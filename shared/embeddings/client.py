"""Thin, fail-soft HTTP client for a Text Embeddings Inference (TEI) server.

Both backends (nearby-app, nearby-admin) import this to turn text into
EmbeddingGemma vectors without bundling the ~1GB sentence-transformers model
into every container. The embedding model is served out-of-process by a TEI
container; this client just speaks the TEI native ``/embed`` HTTP contract.

Design contract (critical — the rest of the codebase relies on this):

* If ``base_url`` is falsy/unset, every call returns ``None`` (or a list of
  ``None``) WITHOUT making any network call. Callers fall back to keyword
  search.
* On ANY error (timeout, connection refused, non-2xx, malformed JSON, wrong
  vector dimension) the client logs once and returns ``None`` / a list of
  ``None``. It NEVER raises to the caller.
* Returned vectors are always defensively L2-normalized so cosine-distance SQL
  is correct even if the server did not normalize.

TEI native contract (confirmed against
https://huggingface.co/docs/text-embeddings-inference/quick_tour):

  POST {base_url}/embed
    body:  {"inputs": ["<text>", ...], "normalize": true, "truncate": false}
    reply: [[f, f, ...], [f, f, ...]]   # one float array per input, in order

EmbeddingGemma uses asymmetric prompts: queries and documents get different
prefixes. We prepend the matching prefix before sending.
"""

from __future__ import annotations

import logging
import math
import os
import threading

import httpx

logger = logging.getLogger(__name__)

# EmbeddingGemma asymmetric prompt prefixes.
QUERY_PREFIX = "task: search result | query: "
DOCUMENT_PREFIX = "title: none | text: "

DEFAULT_MODEL = "michaelfeil/embeddinggemma-300m"
DEFAULT_DIM = 768


class EmbeddingClient:
    """Synchronous, pooled, fail-soft TEI client.

    Parameters
    ----------
    base_url:
        Root URL of the TEI server (e.g. ``http://embeddings:80``). If falsy,
        the client is disabled and every call returns ``None`` without any
        network I/O.
    model:
        Informational only — TEI serves a single model per container, so this
        is not sent in the request. Kept for parity/logging.
    timeout:
        Per-request timeout in seconds.
    expected_dim:
        Expected vector dimension. A returned vector with a different length is
        treated as a failure.
    """

    def __init__(
        self,
        base_url: str | None,
        model: str = DEFAULT_MODEL,
        timeout: float = 5.0,
        expected_dim: int = DEFAULT_DIM,
        backend: str = "tei",
    ) -> None:
        # Normalize: strip whitespace + trailing slash so f"{base}/embed" is clean.
        self.base_url = (base_url or "").strip().rstrip("/") or None
        self.model = model
        self.timeout = timeout
        self.expected_dim = expected_dim
        # Wire protocol: "tei" (HF Text Embeddings Inference — the prod default,
        # POST /embed -> [[...]]) or "openai" (the OpenAI /v1/embeddings shape,
        # POST /embeddings {"model","input"} -> {"data":[{"embedding":[...]}]}).
        # The "openai" backend covers local-dev servers that run natively on
        # Apple Silicon where the amd64 TEI image crashes under emulation —
        # Docker Model Runner, llama.cpp's server, vLLM, Ollama's /v1, etc. Both
        # backends receive the same prefix-prepended text; only the HTTP
        # request/response shape differs.
        self.backend = (backend or "tei").strip().lower()
        self._logged_failure = False
        self._client_lock = threading.Lock()
        self._client: httpx.Client | None = None

    @property
    def enabled(self) -> bool:
        return self.base_url is not None

    def _get_client(self) -> httpx.Client:
        """Lazily build a pooled httpx.Client (thread-safe, reused across calls)."""
        if self._client is None:
            with self._client_lock:
                if self._client is None:
                    self._client = httpx.Client(timeout=self.timeout)
        return self._client

    def _log_failure_once(self, msg: str) -> None:
        """Log a transport/parse failure, but only the first time, to avoid spam."""
        if not self._logged_failure:
            logger.warning("EmbeddingClient disabled-on-error: %s", msg)
            self._logged_failure = True
        else:
            logger.debug("EmbeddingClient error: %s", msg)

    @staticmethod
    def _prefix_for(kind: str) -> str:
        return QUERY_PREFIX if kind == "query" else DOCUMENT_PREFIX

    def _normalize_vector(self, vec) -> list[float] | None:
        """Validate dimension and return an L2-normalized copy, or None on failure."""
        if not isinstance(vec, (list, tuple)):
            self._log_failure_once(f"vector not a list (got {type(vec).__name__})")
            return None
        if len(vec) != self.expected_dim:
            self._log_failure_once(
                f"vector dim {len(vec)} != expected {self.expected_dim}"
            )
            return None
        try:
            floats = [float(x) for x in vec]
        except (TypeError, ValueError) as exc:
            self._log_failure_once(f"vector contains non-float values: {exc}")
            return None
        norm = math.sqrt(sum(x * x for x in floats))
        if norm == 0.0:
            # A zero vector can't be normalized; treat as failure.
            self._log_failure_once("vector has zero magnitude")
            return None
        return [x / norm for x in floats]

    def _parse_openai(self, data) -> list | None:
        """Turn an OpenAI /v1/embeddings reply into TEI-style list-of-vectors.

        Shape: ``{"data": [{"embedding": [...], "index": 0}, ...]}``. We sort by
        ``index`` so order matches the input, then return just the vectors.
        """
        if not isinstance(data, dict) or not isinstance(data.get("data"), list):
            self._log_failure_once("openai response missing 'data' array")
            return None
        items = sorted(
            data["data"],
            key=lambda x: x.get("index", 0) if isinstance(x, dict) else 0,
        )
        vecs = []
        for it in items:
            if not isinstance(it, dict) or "embedding" not in it:
                self._log_failure_once("openai response item missing 'embedding'")
                return None
            vecs.append(it["embedding"])
        return vecs

    def _post_embed(self, inputs: list[str]) -> list | None:
        """POST to the embedding server; return a list-of-vectors, or None on error.

        Both backends are normalized to the same return shape (a list with one
        float-array per input, in order) so the rest of the client is identical.
        """
        if not self.enabled or not inputs:
            return None
        if self.backend == "openai":
            url = f"{self.base_url}/embeddings"
            payload = {"model": self.model, "input": inputs}
        else:  # "tei"
            url = f"{self.base_url}/embed"
            payload = {"inputs": inputs, "normalize": True, "truncate": False}
        try:
            resp = self._get_client().post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:  # noqa: BLE001 — fail-soft by contract
            self._log_failure_once(f"{type(exc).__name__}: {exc}")
            return None
        if self.backend == "openai":
            return self._parse_openai(data)
        if not isinstance(data, list):
            self._log_failure_once(
                f"unexpected response type {type(data).__name__}; expected array of arrays"
            )
            return None
        return data

    def embed(self, text: str, kind: str) -> list[float] | None:
        """Embed a single string.

        ``kind`` is ``"query"`` or ``"document"`` and selects the EmbeddingGemma
        prompt prefix. Returns an L2-normalized vector, or ``None`` on any
        failure (including a disabled client).
        """
        if not self.enabled:
            return None
        prefixed = self._prefix_for(kind) + (text or "")
        data = self._post_embed([prefixed])
        if not data:
            return None
        return self._normalize_vector(data[0])

    def embed_batch(self, texts: list[str], kind: str) -> list[list[float] | None]:
        """Embed a batch of strings, preserving order.

        Returns one entry per input: an L2-normalized vector, or ``None`` for
        any input that failed (or all ``None`` if the client is disabled or the
        whole request failed). Never raises.
        """
        if not texts:
            return []
        if not self.enabled:
            return [None] * len(texts)
        prefix = self._prefix_for(kind)
        prefixed = [prefix + (t or "") for t in texts]
        data = self._post_embed(prefixed)
        if not data:
            return [None] * len(texts)
        if len(data) != len(texts):
            self._log_failure_once(
                f"response count {len(data)} != input count {len(texts)}"
            )
            return [None] * len(texts)
        return [self._normalize_vector(vec) for vec in data]


# --- Process-wide singleton ------------------------------------------------
_singleton: EmbeddingClient | None = None
_singleton_lock = threading.Lock()


def get_embedding_client() -> EmbeddingClient:
    """Return a process-wide singleton built from environment variables.

    Reads:
      * ``EMBEDDING_SERVICE_URL`` — base URL of the embedding server. If
        unset/empty the returned client is disabled (all calls return ``None``
        with no network I/O). For TEI this is the server root (``/embed`` is
        appended); for the openai backend it is the ``…/v1`` base (``/embeddings``
        is appended).
      * ``EMBEDDING_BACKEND`` — ``"tei"`` (default, prod) or ``"openai"``
        (OpenAI-compatible: Docker Model Runner / llama.cpp / vLLM / Ollama /v1).
      * ``EMBEDDING_MODEL`` — model id. Informational for TEI (one model per
        container); REQUIRED and sent in the request body for the openai backend
        (e.g. ``ai/embeddinggemma``). Default ``michaelfeil/embeddinggemma-300m``.
      * ``EMBEDDING_TIMEOUT`` — per-request seconds (default 5; raise it for a
        cold local model that loads on first request).

    Cheap and stateless to construct.
    """
    global _singleton
    if _singleton is None:
        with _singleton_lock:
            if _singleton is None:
                base_url = os.environ.get("EMBEDDING_SERVICE_URL")
                model = os.environ.get("EMBEDDING_MODEL", DEFAULT_MODEL)
                backend = os.environ.get("EMBEDDING_BACKEND", "tei")
                try:
                    timeout = float(os.environ.get("EMBEDDING_TIMEOUT", "5") or "5")
                except ValueError:
                    timeout = 5.0
                _singleton = EmbeddingClient(
                    base_url=base_url, model=model, backend=backend, timeout=timeout
                )
    return _singleton
