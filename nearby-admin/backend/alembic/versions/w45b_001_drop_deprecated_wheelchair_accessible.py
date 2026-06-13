"""Wave 5 / Issue #45 Migration B — drop _deprecated_wheelchair_accessible.

Revision ID: w45b_001
Revises: w45a_001
Create Date: 2026-05-25

Migration A renamed ``wheelchair_accessible`` (JSONB) to
``_deprecated_wheelchair_accessible`` after stripping every code
reference. This is Migration B — the irreversible drop. The remaining
accessibility surface is provided by ``wheelchair_details`` (Text,
free-form notes) and ``icon_wheelchair_accessible`` (Boolean, card
icon + home-page counts).

Downgrade re-adds the column as nullable ``JSONB`` so a roll-back
restores the schema shape. Existing data is not preserved.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = 'w45b_001'
down_revision = 'w45a_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='points_of_interest'
                  AND column_name='_deprecated_wheelchair_accessible'
            ) THEN
                ALTER TABLE points_of_interest
                DROP COLUMN _deprecated_wheelchair_accessible;
            END IF;
        END$$;
    """)


def downgrade() -> None:
    op.add_column(
        'points_of_interest',
        sa.Column('_deprecated_wheelchair_accessible', JSONB(), nullable=True),
    )
