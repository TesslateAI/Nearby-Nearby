"""Wave 5 / Issue #63 Migration C — drop legacy trail_exit/_entrance columns.

Revision ID: w63c_001
Revises: w63b_001
Create Date: 2026-05-25

Removes the five legacy columns from the ``trails`` table that
w63b_001 just finished migrating into ``access_points`` and the
``images`` table:

  - trailhead_exit_location  (JSONB)
  - trail_exit_latitude      (Numeric(10,7))
  - trail_exit_longitude     (Numeric(10,7))
  - trailhead_exit_photo     (String — legacy URL field; superseded by images table)
  - trailhead_entrance_photo (String — legacy URL field; superseded by image_type='trail_head')

Each DROP is guarded by an information_schema lookup so the migration is
idempotent even if a column was already removed manually.

Downgrade re-adds all five columns as nullable. Data is NOT restored.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = 'w63c_001'
down_revision = 'w63b_001'
branch_labels = None
depends_on = None


COLUMNS_TO_DROP = [
    ('trailhead_exit_location', JSONB()),
    ('trail_exit_latitude', sa.Numeric(precision=10, scale=7)),
    ('trail_exit_longitude', sa.Numeric(precision=10, scale=7)),
    ('trailhead_exit_photo', sa.String()),
    ('trailhead_entrance_photo', sa.String()),
]


def upgrade() -> None:
    for col_name, _ in COLUMNS_TO_DROP:
        op.execute(f"""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'trails'
                      AND column_name = '{col_name}'
                ) THEN
                    ALTER TABLE trails DROP COLUMN {col_name};
                END IF;
            END$$;
        """)


def downgrade() -> None:
    for col_name, col_type in COLUMNS_TO_DROP:
        op.add_column('trails', sa.Column(col_name, col_type, nullable=True))
