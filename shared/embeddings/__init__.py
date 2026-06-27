"""Shared embeddings module — canonical searchable-text builder + TEI client.

Imported by both backends as ``from shared.embeddings import ...``. Keeps the
searchable-text layout (the basis of stored embeddings) and the TEI transport
in one dependency-light place so the two apps never drift.
"""

from shared.embeddings.text_builder import (
    build_searchable_text,
    build_searchable_text_from_orm,
    create_searchable_text,
)
from shared.embeddings.client import (
    DOCUMENT_PREFIX,
    QUERY_PREFIX,
    EmbeddingClient,
    get_embedding_client,
)

__all__ = [
    "build_searchable_text",
    "create_searchable_text",
    "build_searchable_text_from_orm",
    "EmbeddingClient",
    "get_embedding_client",
    "QUERY_PREFIX",
    "DOCUMENT_PREFIX",
]
