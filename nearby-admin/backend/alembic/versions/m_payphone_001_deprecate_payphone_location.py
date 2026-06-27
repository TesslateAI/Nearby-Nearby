"""Consolidate payphone_location (singular) into payphone_locations (plural).

Background
----------
Payphone data has lived in two columns on points_of_interest:

  1. ``payphone_location``  — legacy singular JSONB object ``{"lat": 0, "lng": 0}``.
  2. ``payphone_locations`` — canonical plural JSONB array
     ``[{"lat": 0, "lng": 0, "description": "Near entrance"}]``.

The plural array is the canonical store the admin RepeatableLocationGroup UI and the
field registry both reference (the registry already marks the singular
deprecated -> payphone_locations). The dual storage caused the usual silent desync.

What this migration does (Migration A / g70_001 pattern — rename only, no drop)
------------------------------------------------------------------------------
* Backfills ``payphone_locations`` from the legacy singular column for any POI where
  the plural is unset (NULL or empty array) and the singular has an object value.
  The singular object is wrapped in a single-element array to match the plural shape.
* Renames the legacy column to ``_deprecated_payphone_location`` (no drop yet, so the
  change is reversible). After the rename the singular is no longer an ORM column, so
  it drops out of the registry on the next regen (intended).

Idempotent
----------
Re-running is safe: every block guards on column existence, and the backfill only
writes when the plural is unset and the singular holds an object.
"""

from alembic import op


revision = 'm_payphone_001'
down_revision = 'l_cell_service_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Backfill the plural array from the legacy singular object where the plural
    #    is unset. Wrap the singular object in a single-element array. Skipped
    #    automatically once the singular column has been renamed (idempotent re-run).
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = 'payphone_location'
            ) THEN
                UPDATE points_of_interest
                SET payphone_locations = jsonb_build_array(payphone_location)
                WHERE payphone_location IS NOT NULL
                  AND jsonb_typeof(payphone_location) = 'object'
                  AND (
                      payphone_locations IS NULL
                      OR jsonb_typeof(payphone_locations) <> 'array'
                      OR jsonb_array_length(payphone_locations) = 0
                  );
            END IF;
        END$$;
    """)

    # 2. Rename the legacy singular column to its deprecated alias.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = 'payphone_location'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = '_deprecated_payphone_location'
            ) THEN
                ALTER TABLE points_of_interest
                RENAME COLUMN payphone_location
                           TO _deprecated_payphone_location;
            END IF;
        END$$;
    """)


def downgrade() -> None:
    # Restore the singular column name. We do not re-extract from the plural array —
    # the backfill is one-way by design.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = '_deprecated_payphone_location'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'points_of_interest'
                  AND column_name = 'payphone_location'
            ) THEN
                ALTER TABLE points_of_interest
                RENAME COLUMN _deprecated_payphone_location
                           TO payphone_location;
            END IF;
        END$$;
    """)
