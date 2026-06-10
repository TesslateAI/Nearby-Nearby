"""Wave 5 / Issue #33 Migration B — drop _deprecated_public_transit_info.

Revision ID: w33b_001
Revises: i69_001
Create Date: 2026-05-25

Migration A (commit eb02942) renamed ``public_transit_info`` to
``_deprecated_public_transit_info`` after stripping every code reference.
This is Migration B — the irreversible drop. All consumers are gone:
nearby-admin + nearby-app models/schemas/endpoints/autosave whitelist,
venue_inheritance, all admin frontend files, and the test that exercised
it have been updated since the rename.

The downgrade re-adds the column as nullable ``Text`` so a roll-back
restores the schema shape (data is not preserved — Migration B is one-way
on data by design).
"""

from alembic import op
import sqlalchemy as sa


revision = 'w33b_001'
down_revision = 'i69_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = '_deprecated_public_transit_info'
            ) THEN
                ALTER TABLE points_of_interest
                DROP COLUMN _deprecated_public_transit_info;
            END IF;
        END$$;
    """)


def downgrade() -> None:
    op.add_column(
        'points_of_interest',
        sa.Column('_deprecated_public_transit_info', sa.Text(), nullable=True),
    )
