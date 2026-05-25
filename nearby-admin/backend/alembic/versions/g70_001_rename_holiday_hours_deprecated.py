"""Issue #70 — consolidate holiday_hours into hours.holidays.

Revision ID: g70_001
Revises: g42_001
Create Date: 2026-05-25

Background
----------
Holiday hours have lived in two places:

  1. ``points_of_interest.holiday_hours`` — a top-level JSONB column.
  2. ``points_of_interest.hours -> 'holidays'`` — a nested JSONB key.

The dual-storage pattern caused silent desync (whichever store the admin form
wrote to, the other went stale). All five reorg specs (#52, #53, #60, #64) and
the public app's ``HoursDisplay`` already consider ``hours.holidays`` the
canonical store. This migration consolidates everything there.

What this migration does
------------------------
* Backfills ``hours -> 'holidays'`` from the legacy column for any POI where
  the legacy column has data and the nested key is unset (preserves whichever
  store the admin most recently touched if both are populated — nested key
  wins, since that is the new canonical store).
* Renames the legacy column to ``_deprecated_holiday_hours`` (Wave-2 Migration
  A pattern — no drop yet, so we can downgrade if needed).

Idempotent
----------
Re-running is safe: the rename block guards on column existence, and the
backfill only writes when the legacy column has data and the nested key does
not.
"""

from alembic import op


revision = 'g70_001'
down_revision = 'g42_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Backfill nested hours->'holidays' from the legacy column where the
    #    nested key is missing. Skipped automatically if the legacy column has
    #    already been renamed (idempotent re-run).
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = 'holiday_hours'
            ) THEN
                UPDATE points_of_interest
                SET hours = jsonb_set(
                    COALESCE(hours, '{}'::jsonb),
                    '{holidays}',
                    holiday_hours,
                    true
                )
                WHERE holiday_hours IS NOT NULL
                  AND jsonb_typeof(holiday_hours) = 'object'
                  AND (
                      hours IS NULL
                      OR jsonb_typeof(hours) <> 'object'
                      OR (hours -> 'holidays') IS NULL
                  );
            END IF;
        END$$;
    """)

    # 2. Rename the legacy column to its deprecated alias.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = 'holiday_hours'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = '_deprecated_holiday_hours'
            ) THEN
                ALTER TABLE points_of_interest
                RENAME COLUMN holiday_hours
                           TO _deprecated_holiday_hours;
            END IF;
        END$$;
    """)


def downgrade() -> None:
    # Just restore the column name. We do not re-extract from hours.holidays —
    # the backfill is one-way by design.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = '_deprecated_holiday_hours'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = 'holiday_hours'
            ) THEN
                ALTER TABLE points_of_interest
                RENAME COLUMN _deprecated_holiday_hours
                           TO holiday_hours;
            END IF;
        END$$;
    """)
