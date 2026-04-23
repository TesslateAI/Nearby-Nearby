"""Repair amenities rows where p1_001 produced JSONB arrays.

Revision ID: p1_002_repair_amenities_arrays
Revises: p1_999_drop_ticket_link
Create Date: 2026-04-23

p1_001_phase1_additive ran:
    UPDATE ... SET amenities = COALESCE(amenities, '{}'::jsonb)
                              || jsonb_build_object('wifi', ...)
On rows whose amenities was already a JSONB array (legacy data), the ||
operator appended the dict to the array instead of merging — producing
shapes like [null, {"wifi": null}]. The admin response schema declares
amenities as Dict[str, Any], so /api/pois/ then 500'd with
ResponseValidationError until a runtime coercion was shipped.

This migration fixes the underlying data: for every row where amenities
is an array, merge all dict elements in the array into a single dict.
Rows with no dict elements collapse to NULL.

Idempotent — the WHERE filter excludes already-object rows, so re-running
is a no-op.
"""

from alembic import op
import sqlalchemy as sa


revision = 'p1_002_repair_amenities_arrays'
down_revision = 'p1_999_drop_ticket_link'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(sa.text("""
        UPDATE points_of_interest
        SET amenities = (
            SELECT jsonb_object_agg(pair.key, pair.value)
            FROM jsonb_array_elements(amenities) AS elem
            CROSS JOIN LATERAL jsonb_each(
                CASE WHEN jsonb_typeof(elem) = 'object' THEN elem ELSE '{}'::jsonb END
            ) AS pair
        )
        WHERE jsonb_typeof(amenities) = 'array'
    """))


def downgrade():
    # Irreversible: we don't restore the malformed array shape.
    pass
