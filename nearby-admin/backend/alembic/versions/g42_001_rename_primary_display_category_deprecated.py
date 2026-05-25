"""Issue #42 — rename Event.primary_display_category to deprecated alias.

Revision ID: g42_001
Revises: g34_001_rename_key_facilities_deprecated
Create Date: 2026-05-25

The `events.primary_display_category` string column is redundant with the
already-shipped UUID-based primary-category mechanism (`poi_categories.is_main`
+ `points_of_interest.main_category_id`). To keep the schema clean while
preserving any latent data for one more release cycle, this migration follows
the Wave-2 "Migration A" pattern: it renames the column to
`_deprecated_primary_display_category` rather than dropping it. The drop will
ship in a later wave once we confirm no read paths remain.

No data backfill is required: any Event with a meaningful primary category
should already have an `is_main=True` row in `poi_categories`. Auditing for
mismatches and backfilling `is_main` rows is a one-time operational task
that lives outside of this migration.
"""

from alembic import op


revision = 'g42_001'
down_revision = 'g34_001_rename_key_facilities_deprecated'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename only — no drop. Idempotent guard so re-runs against partially-
    # migrated environments are safe.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'events'
                  AND column_name = 'primary_display_category'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'events'
                  AND column_name = '_deprecated_primary_display_category'
            ) THEN
                ALTER TABLE events
                RENAME COLUMN primary_display_category
                           TO _deprecated_primary_display_category;
            END IF;
        END$$;
    """)


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'events'
                  AND column_name = '_deprecated_primary_display_category'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'events'
                  AND column_name = 'primary_display_category'
            ) THEN
                ALTER TABLE events
                RENAME COLUMN _deprecated_primary_display_category
                           TO primary_display_category;
            END IF;
        END$$;
    """)
