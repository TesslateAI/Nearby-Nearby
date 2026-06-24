#!/usr/bin/env python3
"""Embedding parity gate: prove the external TEI service reproduces the reference
sentence-transformers encoder closely enough to trust read-time (query) and
write-time (document) vectors BEFORE any prod cutover.

This is a one-off DEV/OPS tool. It is NOT imported or run by the app. The app
image intentionally does NOT bundle torch / sentence-transformers (phase A3) —
those are loaded here only as the reference oracle, inside a throwaway venv.

------------------------------------------------------------------------------
WHAT IT CHECKS
------------------------------------------------------------------------------
For each sample text and each kind ("query", "document"):

  reference vector  = SentenceTransformer(MODEL) encoding of the SAME prefixed
                      string the client sends to TEI.
  candidate vector  = shared.embeddings client.embed(text, kind) — i.e. the
                      real TEI HTTP path used by both backends.

Both are L2-normalized, so cosine == dot product. We assert every pair has
cosine >= --threshold (default 0.999). Print a per-text table + PASS/FAIL
summary. Exit non-zero on FAIL.

------------------------------------------------------------------------------
WHY MANUAL-PREFIX (NOT encode_query / encode_document)
------------------------------------------------------------------------------
The shared client (shared/embeddings/client.py) builds the input by literally
prepending QUERY_PREFIX / DOCUMENT_PREFIX to the raw text and POSTing that whole
string to TEI's /embed, which runs a plain (un-prompted) forward pass + L2
normalize. To compare apples-to-apples we MUST make the reference encoder do the
exact same thing: manually prepend the SAME prefix constants, then call
model.encode(prefixed) with NO model-side prompt. Using encode_query /
encode_document would apply sentence-transformers' OWN prompt templates on top,
which may differ from our prefixes and would test a different pipeline than the
one that actually runs in prod. So when the >=5 API is present we still pass
prompt=None / our own prefix to keep the comparison faithful; the encode_query /
encode_document methods are detected only to confirm the ST version, never used
to do the prefixing. See decisions in the task output.

------------------------------------------------------------------------------
USAGE
------------------------------------------------------------------------------
  # 1. Start TEI serving the SAME model the client expects:
  docker run -p 8080:80 \
      ghcr.io/huggingface/text-embeddings-inference:cpu-1.8.1 \
      --model-id michaelfeil/embeddinggemma-300m
  export EMBEDDING_SERVICE_URL=http://localhost:8080

  # 2. In a scratch venv with the reference deps:
  pip install sentence-transformers torch
  python nearby-app/backend/scripts/parity_check_embeddings.py
  python nearby-app/backend/scripts/parity_check_embeddings.py --texts-file my.txt
  python nearby-app/backend/scripts/parity_check_embeddings.py --from-db --limit 5
  python nearby-app/backend/scripts/parity_check_embeddings.py --threshold 0.9995
"""

from __future__ import annotations

import argparse
import math
import os
import sys
from pathlib import Path

# --- Make `shared` importable -------------------------------------------------
# This file lives at <repo>/nearby-app/backend/scripts/. The monorepo root (which
# contains the `shared/` package) is three levels up. Put it on sys.path so
# `from shared.embeddings import ...` resolves whether the script is launched
# from the repo root, the backend dir, or a scratch venv anywhere.
_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from shared.embeddings import (  # noqa: E402
    DOCUMENT_PREFIX,
    QUERY_PREFIX,
    get_embedding_client,
)

DEFAULT_MODEL = "michaelfeil/embeddinggemma-300m"
DEFAULT_THRESHOLD = 0.999
KINDS = ("query", "document")
_PREFIX = {"query": QUERY_PREFIX, "document": DOCUMENT_PREFIX}

# A spread of representative POI-ish strings: business names, trail descriptions,
# amenity phrases, event blurbs. Mirrors the kind of text build_searchable_text
# produces and the kind of query a user types.
BUILTIN_TEXTS = [
    "Blue Ridge Coffee Roasters",
    "Jordan Lake State Recreation Area",
    "Eno River Trailhead parking and restrooms",
    "moderate 4.2 mile loop trail with rocky surface and creek crossings",
    "dog friendly brewery with outdoor patio and live music on weekends",
    "free admission, wheelchair accessible, public restrooms available",
    "family farm with pumpkin patch, corn maze, and hayrides in October",
    "waterfront seafood restaurant, full bar, sunset views over the sound",
    "historic downtown art gallery featuring local painters and sculptors",
    "where can I find a quiet hiking trail near a waterfall",
    "best pet friendly coffee shop with wifi for remote work",
    "kid friendly park with playground, picnic shelters, and splash pad",
    "annual bluegrass music festival with food trucks and craft vendors",
    "mountain biking single track, advanced difficulty, scenic overlook",
    "farmers market every Saturday morning with fresh produce and crafts",
]


def cosine(a, b) -> float:
    """Cosine similarity. Inputs are expected L2-normalized (so this is ~dot),
    but we divide by norms anyway to stay correct if either side is not unit
    length. Returns 0.0 if either vector is degenerate."""
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


def load_reference_encoder():
    """Import sentence-transformers + torch (the reference oracle) and return a
    callable encode(text, kind) -> list[float] that reproduces EXACTLY what the
    client sends to TEI: manual prefix + plain encode + L2 normalize.

    Exits with code 2 (with an actionable message) if the deps aren't installed,
    because they were intentionally dropped from the app image in phase A3."""
    try:
        from sentence_transformers import SentenceTransformer  # noqa: F401
        import sentence_transformers as st
    except ImportError:
        sys.stderr.write(
            "\n[parity] ERROR: reference deps not installed.\n"
            "This one-off parity script needs sentence-transformers + torch as\n"
            "the reference oracle. They were intentionally removed from the app\n"
            "image (phase A3), so install them in a scratch venv:\n\n"
            "    pip install sentence-transformers torch\n\n"
            "then re-run this script.\n"
        )
        sys.exit(2)

    st_version = getattr(st, "__version__", "0")
    print(f"[parity] loading reference encoder: {DEFAULT_MODEL} "
          f"(sentence-transformers {st_version})")
    model = SentenceTransformer(DEFAULT_MODEL)

    # Detect the prompt API purely to log/confirm the ST version. We do NOT use
    # encode_query / encode_document to do the prefixing — that would apply the
    # model's own prompt templates and test a DIFFERENT pipeline than the client.
    # We always do manual-prefix-then-plain-encode to match the TEI client 1:1.
    has_modern_api = hasattr(model, "encode_query") and hasattr(
        model, "encode_document"
    )
    print(
        "[parity] ST query/document prompt API present: "
        f"{has_modern_api} (NOT used — using manual prefix to match the client)"
    )

    def encode(text: str, kind: str) -> list[float]:
        prefixed = _PREFIX[kind] + (text or "")
        # prompt=None / no prompt_name => raw forward pass on the exact bytes the
        # client POSTs to TEI. normalize_embeddings=True mirrors the client's
        # defensive L2 normalize (and TEI normalize:true).
        vec = model.encode(
            prefixed,
            prompt=None,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return [float(x) for x in vec.tolist()]

    return encode


def texts_from_db(limit: int) -> list[str]:
    """Best-effort: pull a few real POIs and run them through the canonical
    build_searchable_text so we test on production-shaped document text.
    Returns [] (with a warning) on any problem — never fatal."""
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("[parity] --from-db requested but DATABASE_URL is unset; skipping DB texts.")
        return []
    try:
        from sqlalchemy import create_engine, text as sql_text
        from shared.embeddings import build_searchable_text
    except Exception as exc:  # noqa: BLE001 — optional path, stay non-fatal
        print(f"[parity] --from-db unavailable ({type(exc).__name__}: {exc}); skipping.")
        return []
    try:
        engine = create_engine(db_url)
        query = sql_text(
            """
            SELECT p.*,
                   t.difficulty AS trail_difficulty,
                   t.length_text AS trail_length_text,
                   t.route_type AS trail_route_type,
                   t.trail_surfaces AS trail_surfaces,
                   t.trail_experiences AS trail_experiences,
                   e.venue_settings AS event_venue_settings,
                   b.price_range AS biz_price_range,
                   COALESCE(
                       (SELECT string_agg(c.name, ', ')
                        FROM categories c
                        JOIN poi_categories pc ON c.id = pc.category_id
                        WHERE pc.poi_id = p.id), ''
                   ) AS category_names
            FROM points_of_interest p
            LEFT JOIN trails t ON t.poi_id = p.id
            LEFT JOIN events e ON e.poi_id = p.id
            LEFT JOIN businesses b ON b.poi_id = p.id
            ORDER BY p.id
            LIMIT :limit
            """
        )
        out: list[str] = []
        with engine.connect() as conn:
            result = conn.execute(query, {"limit": limit})
            columns = result.keys()
            for row in result.fetchall():
                row_dict = dict(zip(columns, row))
                trail = None
                if row_dict.get("trail_difficulty") or row_dict.get("trail_length_text"):
                    trail = {
                        "difficulty": row_dict.get("trail_difficulty"),
                        "length_text": row_dict.get("trail_length_text"),
                        "route_type": row_dict.get("trail_route_type"),
                        "trail_surfaces": row_dict.get("trail_surfaces"),
                        "trail_experiences": row_dict.get("trail_experiences"),
                    }
                event = None
                if row_dict.get("event_venue_settings"):
                    event = {"venue_settings": row_dict.get("event_venue_settings")}
                business = None
                if row_dict.get("biz_price_range"):
                    business = {"price_range": row_dict.get("biz_price_range")}
                categories = []
                if row_dict.get("category_names"):
                    categories = [
                        c.strip()
                        for c in row_dict["category_names"].split(",")
                        if c.strip()
                    ]
                built = build_searchable_text(
                    row_dict,
                    categories=categories,
                    trail=trail,
                    event=event,
                    business=business,
                )
                if built:
                    out.append(built)
        print(f"[parity] pulled {len(out)} POI text(s) from DB via build_searchable_text.")
        return out
    except Exception as exc:  # noqa: BLE001 — optional path, stay non-fatal
        print(f"[parity] --from-db failed ({type(exc).__name__}: {exc}); skipping DB texts.")
        return []


def load_texts(args) -> list[str]:
    """Resolve the sample texts: --texts-file, else built-ins. Optionally append
    --from-db texts."""
    texts: list[str] = []
    if args.texts_file:
        path = Path(args.texts_file)
        if not path.is_file():
            sys.stderr.write(f"[parity] ERROR: --texts-file not found: {path}\n")
            sys.exit(2)
        texts = [
            line.strip()
            for line in path.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        if not texts:
            sys.stderr.write(f"[parity] ERROR: --texts-file is empty: {path}\n")
            sys.exit(2)
        print(f"[parity] loaded {len(texts)} text(s) from {path}.")
    else:
        texts = list(BUILTIN_TEXTS)
        print(f"[parity] using {len(texts)} built-in sample text(s).")

    if args.from_db:
        texts = texts + texts_from_db(args.limit)
    return texts


def require_tei_client():
    """Build the shared client and hard-fail with an actionable message if the
    TEI URL isn't configured (a disabled client would silently return None and
    make the parity check meaningless)."""
    client = get_embedding_client()
    if not client.enabled:
        sys.stderr.write(
            "\n[parity] ERROR: EMBEDDING_SERVICE_URL is not set, so the shared\n"
            "client is DISABLED and would return no vectors. Start a TEI server\n"
            "and point the client at it, e.g.:\n\n"
            "    docker run -p 8080:80 \\\n"
            "        ghcr.io/huggingface/text-embeddings-inference:cpu-1.8.1 \\\n"
            "        --model-id michaelfeil/embeddinggemma-300m\n"
            "    export EMBEDDING_SERVICE_URL=http://localhost:8080\n\n"
            "then re-run this script.\n"
        )
        sys.exit(2)
    print(f"[parity] candidate TEI client URL: {client.base_url}")
    return client


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Parity gate: TEI service vs reference sentence-transformers encoder."
    )
    parser.add_argument(
        "--texts-file",
        help="Path to a file with one sample text per line (overrides built-ins).",
    )
    parser.add_argument(
        "--from-db",
        action="store_true",
        help="Also pull a few real POIs via build_searchable_text (needs DATABASE_URL).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Max POIs to pull when --from-db is set (default: 5).",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=DEFAULT_THRESHOLD,
        help=f"Minimum cosine similarity to PASS (default: {DEFAULT_THRESHOLD}).",
    )
    args = parser.parse_args(argv)

    # Fail fast on a missing TEI URL BEFORE spending time loading the ~1GB model.
    client = require_tei_client()
    texts = load_texts(args)
    encode_ref = load_reference_encoder()

    print(
        f"\n[parity] comparing {len(texts)} text(s) x {len(KINDS)} kind(s) "
        f"against threshold {args.threshold}\n"
    )

    header = f"{'#':>3}  {'kind':<8}  {'cosine':>10}  {'ok':>3}  text"
    print(header)
    print("-" * len(header))

    failures = 0
    checks = 0
    min_cos = 1.0
    for i, text_val in enumerate(texts, start=1):
        for kind in KINDS:
            ref_vec = encode_ref(text_val, kind)
            cand_vec = client.embed(text_val, kind)
            if cand_vec is None:
                # The fail-soft client swallowed an error and returned None — the
                # TEI request failed (down, wrong model, bad dim). That's a FAIL.
                checks += 1
                failures += 1
                preview = (text_val[:48] + "…") if len(text_val) > 48 else text_val
                print(f"{i:>3}  {kind:<8}  {'NONE':>10}  {'NO':>3}  {preview}")
                continue
            cos = cosine(ref_vec, cand_vec)
            checks += 1
            min_cos = min(min_cos, cos)
            ok = cos >= args.threshold
            if not ok:
                failures += 1
            preview = (text_val[:48] + "…") if len(text_val) > 48 else text_val
            mark = "OK" if ok else "NO"
            print(f"{i:>3}  {kind:<8}  {cos:>10.6f}  {mark:>3}  {preview}")

    print("-" * len(header))
    print(
        f"[parity] {checks} check(s), {failures} failure(s), "
        f"min cosine {min_cos:.6f}, threshold {args.threshold}"
    )

    if failures:
        print(
            f"\n[parity] FAIL: {failures} pair(s) below threshold. "
            "TEI does NOT reproduce the reference encoder closely enough; "
            "do NOT cut over to it yet."
        )
        return 1

    print(
        "\n[parity] PASS: every query+document vector matches the reference "
        f"encoder at cosine >= {args.threshold}. Safe to trust the TEI service."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
