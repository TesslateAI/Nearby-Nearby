"""Add pgvector embedding column + HNSW index to points_of_interest.

Semantic search in nearby-app relies on a pgvector `embedding vector(768)`
column (768 dims for michaelfeil/embeddinggemma-300m) plus an HNSW cosine
index. Until now this schema was applied out-of-band by the manual
`nearby-app/backend/add_embeddings_column.py` script, so it lived outside
Alembic and was never guaranteed on a fresh database. This migration brings
that DDL into the Alembic chain (admin owns the shared schema), replacing the
manual script.

Every statement uses IF [NOT] EXISTS, so this is idempotent and safe to run on
a database where the manual script already created the extension, column, and
index.

Revision ID: k_embedding_001
Revises: j_mobility_001
Create Date: 2026-06-23
"""

from alembic import op


revision = 'k_embedding_001'
down_revision = 'j_mobility_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("ALTER TABLE points_of_interest ADD COLUMN IF NOT EXISTS embedding vector(768)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS poi_embedding_hnsw_idx "
        "ON points_of_interest USING hnsw (embedding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 64)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS poi_embedding_hnsw_idx")
    op.execute("ALTER TABLE points_of_interest DROP COLUMN IF EXISTS embedding")
