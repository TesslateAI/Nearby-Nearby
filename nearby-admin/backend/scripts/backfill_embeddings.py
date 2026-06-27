#!/usr/bin/env python3
"""(Re)generate POI document embeddings via the TEI service and store them.

This replaces the legacy, model-bundling
``nearby-app/backend/generate_embeddings.py``. Instead of loading the ~1GB
sentence-transformers model in-process, it builds the canonical searchable text
with ``shared.embeddings.build_searchable_text`` (the SAME builder admin uses
for embed-on-write, so write-time and backfill text are byte-identical) and
embeds through the out-of-process TEI server via
``shared.embeddings.get_embedding_client()``.

Run as a one-off (e.g. ECS RunTask) after the embedding migration
(``k_embedding_001``) and after any mass import. Admin owns this script because
it owns the shared schema and ships ``shared/`` plus the DB credentials in its
image.

Usage
-----
    python scripts/backfill_embeddings.py [--batch-size 32] [--force] [--limit N]

Options
-------
    --batch-size N   POIs embedded per TEI request (default: 32).
    --force          Re-embed ALL POIs (default: only WHERE embedding IS NULL).
    --limit N        Cap the number of POIs processed (testing only).

Environment
-----------
    DATABASE_URL            Admin DB connection (via app.core.config.settings).
    EMBEDDING_SERVICE_URL   TEI base URL. If unset, the script exits 2 — there
                            is nothing to do without the embedding service.

The TEI client is fail-soft: if it returns ``None`` for an item (service down,
timeout, bad dimension), that POI is SKIPPED (its existing embedding is left
untouched) and counted as a failure. The run never crashes on a per-item
failure; it exits non-zero only if zero embeddings succeeded.
"""

import argparse
import os
import sys
import time
from typing import List, Tuple

from sqlalchemy import text

# Add the backend root (parent of scripts/) to sys.path so `app` and `shared`
# resolve the same way the other admin scripts do (see seed_phase1_chatham.py).
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.append(_BACKEND_ROOT)
# Also add the repo root so a top-level `shared/` package resolves in local dev
# (in the admin image `shared/` is already importable from the backend root).
_REPO_ROOT = os.path.dirname(os.path.dirname(_BACKEND_ROOT))
if _REPO_ROOT not in sys.path:
    sys.path.append(_REPO_ROOT)

from app.database import engine  # admin app DB engine (built from DATABASE_URL)
from shared.embeddings import build_searchable_text, get_embedding_client


def fetch_pois(force: bool = False, limit: int | None = None) -> List[Tuple[str, dict]]:
    """Fetch POIs with related-table enrichment for richer embeddings.

    Ported verbatim from the legacy ``generate_embeddings.fetch_pois`` (its
    SQL join, the row-to-dict mapping, and the trail/event/business/category
    enrichment) so the document-text inputs match what the legacy script
    produced. The enrichment dicts are stashed under ``_trail`` / ``_event`` /
    ``_business`` / ``_categories`` for ``build_searchable_text``.
    """
    with engine.connect() as connection:
        # Default: only POIs missing an embedding. --force re-embeds everything.
        where_clause = "" if force else "WHERE p.embedding IS NULL"
        mode = "Force mode: regenerating ALL" if force else "Fetching POIs without"
        print(f"[INFO] {mode} embeddings")

        limit_clause = f"LIMIT {int(limit)}" if limit else ""

        query = text(f"""
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
            {where_clause}
            ORDER BY p.id
            {limit_clause}
        """)

        result = connection.execute(query)
        rows = result.fetchall()
        columns = result.keys()

        pois: List[Tuple[str, dict]] = []
        for row in rows:
            row_dict = dict(zip(columns, row))
            poi_id = str(row_dict['id'])

            # Separate related-table data from the POI columns (legacy gates).
            trail = None
            if row_dict.get('trail_difficulty') or row_dict.get('trail_length_text'):
                trail = {
                    'difficulty': row_dict.get('trail_difficulty'),
                    'length_text': row_dict.get('trail_length_text'),
                    'route_type': row_dict.get('trail_route_type'),
                    'trail_surfaces': row_dict.get('trail_surfaces'),
                    'trail_experiences': row_dict.get('trail_experiences'),
                }

            event = None
            if row_dict.get('event_venue_settings'):
                event = {'venue_settings': row_dict.get('event_venue_settings')}

            business = None
            if row_dict.get('biz_price_range'):
                business = {'price_range': row_dict.get('biz_price_range')}

            categories = []
            if row_dict.get('category_names'):
                categories = [c.strip() for c in row_dict['category_names'].split(',') if c.strip()]

            row_dict['_trail'] = trail
            row_dict['_event'] = event
            row_dict['_business'] = business
            row_dict['_categories'] = categories

            pois.append((poi_id, row_dict))

        print(f"[INFO] Found {len(pois)} POIs to process")
        return pois


def backfill(pois: List[Tuple[str, dict]], batch_size: int) -> Tuple[int, int]:
    """Embed POIs through TEI in batches and store vectors. Returns (ok, failed).

    Each item that the client returns ``None`` for is skipped (its existing
    embedding is left untouched) and counted as a failure. Vectors are stored
    with the same raw SQL as the legacy generator:
    ``UPDATE ... SET embedding = CAST(:embedding AS vector) WHERE id = :id``.
    """
    total = len(pois)
    if total == 0:
        print("[INFO] No POIs to process!")
        return 0, 0

    client = get_embedding_client()
    print(f"\n[EMBEDDING] Processing {total} POIs in batches of {batch_size}...")

    start_time = time.time()
    succeeded = 0
    failed = 0
    processed = 0

    for i in range(0, total, batch_size):
        batch = pois[i:i + batch_size]

        # Build the canonical document text — the SAME builder as embed-on-write.
        texts = [
            build_searchable_text(
                poi_data,
                categories=poi_data.get('_categories'),
                trail=poi_data.get('_trail'),
                event=poi_data.get('_event'),
                business=poi_data.get('_business'),
            )
            for _poi_id, poi_data in batch
        ]
        ids = [poi_id for poi_id, _poi_data in batch]

        # 'document' kind applies the EmbeddingGemma document prefix. Fail-soft:
        # any failed item comes back as None; the whole call never raises.
        embeddings = client.embed_batch(texts, kind="document")

        with engine.connect() as connection:
            for poi_id, embedding in zip(ids, embeddings):
                if embedding is None:
                    # Service failure for this item — skip, leave embedding as-is.
                    failed += 1
                    continue
                connection.execute(
                    text("""
                        UPDATE points_of_interest
                        SET embedding = CAST(:embedding AS vector)
                        WHERE id = :id
                    """),
                    {"embedding": str(embedding), "id": poi_id},
                )
                succeeded += 1
            connection.commit()

        processed += len(batch)
        elapsed = time.time() - start_time
        rate = processed / elapsed if elapsed > 0 else 0
        remaining = (total - processed) / rate if rate > 0 else 0
        print(f"[PROGRESS] {processed}/{total} ({100 * processed / total:.1f}%) | "
              f"ok={succeeded} failed={failed} | "
              f"Rate: {rate:.1f} POIs/s | ETA: {remaining:.0f}s")

    total_time = time.time() - start_time
    print(f"\n[DONE] Embedded {succeeded}, failed {failed} of {total} POIs "
          f"in {total_time:.1f}s")
    return succeeded, failed


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backfill POI embeddings via the TEI service"
    )
    parser.add_argument("--batch-size", type=int, default=32,
                        help="POIs embedded per TEI request (default: 32)")
    parser.add_argument("--force", action="store_true",
                        help="Re-embed ALL POIs (default: only embedding IS NULL)")
    parser.add_argument("--limit", type=int, default=None,
                        help="Cap number of POIs processed (testing only)")
    args = parser.parse_args()

    print("=" * 60)
    print("POI Embedding Backfill (TEI)")
    print("=" * 60)

    # Nothing to do without the embedding service — a disabled client would
    # silently produce all-None and 'succeed' at embedding zero POIs.
    if not os.environ.get("EMBEDDING_SERVICE_URL"):
        print("[ERROR] EMBEDDING_SERVICE_URL is not set. The TEI embedding "
              "service is required to generate embeddings — nothing to do.")
        return 2

    pois = fetch_pois(force=args.force, limit=args.limit)
    if not pois:
        print("\n[SUCCESS] No POIs needed embedding.")
        return 0

    succeeded, failed = backfill(pois, args.batch_size)

    print("\n" + "=" * 60)
    print(f"Summary: embedded={succeeded} failed={failed} "
          f"total={succeeded + failed}")
    print("=" * 60)

    if succeeded == 0:
        print("[ERROR] Zero embeddings succeeded — is the TEI service reachable?")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
