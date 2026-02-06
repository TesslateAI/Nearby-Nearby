"""Alter description_short from VARCHAR(250) to TEXT

Revision ID: b2g3h4i5j6k7
Revises: a1f2b3c4d5e6
Create Date: 2026-02-06

Changes:
- ALTER description_short from VARCHAR(250) to TEXT (HTML markup needs more space,
  Pydantic validates visible text <= 250 chars)
- Must drop/recreate search_document generated column because it depends on description_short
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2g3h4i5j6k7'
down_revision: Union[str, None] = 'a1f2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# The generated column expression (uses description_short as varchar in original,
# will use it as text after alter)
SEARCH_DOCUMENT_EXPR = """(
    setweight(to_tsvector('english', COALESCE(name::text, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description_short::text, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(address_city::text, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description_long, '')), 'C')
)"""


def upgrade() -> None:
    # Drop the generated column that depends on description_short
    op.execute("ALTER TABLE points_of_interest DROP COLUMN IF EXISTS search_document")

    # Now alter the type
    op.alter_column(
        'points_of_interest',
        'description_short',
        existing_type=sa.String(250),
        type_=sa.Text(),
        existing_nullable=True,
    )

    # Recreate the generated column
    op.execute(
        f"ALTER TABLE points_of_interest "
        f"ADD COLUMN search_document tsvector GENERATED ALWAYS AS ({SEARCH_DOCUMENT_EXPR}) STORED"
    )

    # Recreate the GIN index on search_document
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_poi_search_document "
        "ON points_of_interest USING GIN (search_document)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE points_of_interest DROP COLUMN IF EXISTS search_document")

    op.alter_column(
        'points_of_interest',
        'description_short',
        existing_type=sa.Text(),
        type_=sa.String(250),
        existing_nullable=True,
    )

    # Recreate with varchar casts
    op.execute(
        f"ALTER TABLE points_of_interest "
        f"ADD COLUMN search_document tsvector GENERATED ALWAYS AS ({SEARCH_DOCUMENT_EXPR}) STORED"
    )

    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_poi_search_document "
        "ON points_of_interest USING GIN (search_document)"
    )
