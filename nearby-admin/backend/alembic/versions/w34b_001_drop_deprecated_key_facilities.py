"""Wave 5 / Issue #34 Migration B — drop _deprecated_key_facilities.

Revision ID: w34b_001
Revises: w33b_001
Create Date: 2026-05-25

Migration A renamed ``key_facilities`` (JSONB) to
``_deprecated_key_facilities`` after stripping every code reference.
This is Migration B — the irreversible drop. The 4 auto-computed icon
booleans (icon_free_wifi, icon_pet_friendly, icon_public_restroom,
icon_wheelchair_accessible) cover the original purpose; the legacy
``generate_embeddings.py`` reference was removed at the same time as
the rename so semantic-search embeddings no longer depend on this
column.

Downgrade re-adds the column as nullable ``JSONB`` so a roll-back
restores the schema shape. Existing data is not preserved.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = 'w34b_001'
down_revision = 'w33b_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = '_deprecated_key_facilities'
            ) THEN
                ALTER TABLE points_of_interest
                DROP COLUMN _deprecated_key_facilities;
            END IF;
        END$$;
    """)


def downgrade() -> None:
    op.add_column(
        'points_of_interest',
        sa.Column('_deprecated_key_facilities', JSONB(), nullable=True),
    )
