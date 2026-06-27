"""Add cell_service JSONB column to points_of_interest.

The admin Accessibility section captures a `cell_service` value (CELL_SERVICE_OPTIONS:
Good / Limited / Unknown / None), but there was never a backing column anywhere — no
ORM attribute on either the admin or app model, and no migration. Anything the form
wrote to `cell_service` was silently dropped by the autosave whitelist filter on every
save, mirroring the same namespace bug that mobility_access (j_mobility_001) had.

This adds the column so the value actually persists, for every POI type. Nullable +
additive — no data backfill needed. IF NOT EXISTS makes it idempotent on a database
where the column was already created out-of-band.

Revision ID: l_cell_service_001
Revises: k_embedding_001
Create Date: 2026-06-23
"""

from alembic import op


revision = 'l_cell_service_001'
down_revision = 'k_embedding_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE points_of_interest ADD COLUMN IF NOT EXISTS cell_service JSONB"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE points_of_interest DROP COLUMN IF EXISTS cell_service"
    )
