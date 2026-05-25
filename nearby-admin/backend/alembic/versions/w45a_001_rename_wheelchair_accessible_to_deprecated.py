"""Wave 5 / Issue #45 Migration A — rename wheelchair_accessible.

Revision ID: w45a_001
Revises: w34b_001
Create Date: 2026-05-25

Renames the ``wheelchair_accessible`` (JSONB) column to
``_deprecated_wheelchair_accessible`` after every code reference has
been removed in PR2 (issue #45). The accompanying boolean
``icon_wheelchair_accessible`` (kept) drives the live card icon and
home-page counts; the multi-value JSONB list this column held was no
longer surfaced after the public-facing accessibility chip,
NearbyCard amenity icon, search filter, and SEO ``accessibilityFeature``
were removed.

Migration B (``w45b_001``) is paired with this migration and drops the
renamed column entirely.

Downgrade renames the deprecated column back to the original name so a
roll-back restores the schema shape. Existing data is preserved through
the rename.
"""

from alembic import op


revision = 'w45a_001'
down_revision = 'w34b_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='points_of_interest'
                  AND column_name='wheelchair_accessible'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='points_of_interest'
                  AND column_name='_deprecated_wheelchair_accessible'
            ) THEN
                ALTER TABLE points_of_interest
                RENAME COLUMN wheelchair_accessible
                           TO _deprecated_wheelchair_accessible;
            END IF;
        END$$;
    """)


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='points_of_interest'
                  AND column_name='_deprecated_wheelchair_accessible'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='points_of_interest'
                  AND column_name='wheelchair_accessible'
            ) THEN
                ALTER TABLE points_of_interest
                RENAME COLUMN _deprecated_wheelchair_accessible
                           TO wheelchair_accessible;
            END IF;
        END$$;
    """)
