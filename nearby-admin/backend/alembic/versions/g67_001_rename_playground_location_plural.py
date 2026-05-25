"""Rename playground_location → playground_locations (singular → plural).

Revision ID: g67_001
Revises: p1_002_repair_amenities_arrays
Create Date: 2026-05-25

Migration A pattern: rename only — no drops. The reorg specs (#53/#59/#60/#64)
and the new RepeatableLocationGroup component (issue #67) all reference the
plural name `playground_locations`. Historically the column was singular and
stored either a single dict `{lat, lng}` or, by recent convention, a list of
dicts. This migration renames the column and one-time wraps any remaining
singular-object rows in a single-element array so all downstream reads can
assume an array shape.

Idempotent on re-run: the WHERE filter excludes already-array (or NULL) rows.

Down revision selection
-----------------------
On the `barry-first-changes-ever` branch the visible alembic head is
`p1_002_repair_amenities_arrays`. Other heads (`slug_001`,
`706598f33ffe`, `d5e8c1a9b2c3`) live on parallel branches and will be
merged separately if needed. We deterministically pick the head on this
branch as the parent.
"""

from alembic import op
import sqlalchemy as sa


revision = 'g67_001'
down_revision = 'p1_002_repair_amenities_arrays'
branch_labels = None
depends_on = None


def upgrade():
    # 1) Rename the column.
    op.alter_column(
        'points_of_interest',
        'playground_location',
        new_column_name='playground_locations',
    )

    # 2) Wrap legacy singular-object rows in a single-element array so the new
    #    plural name matches the canonical array shape used by the
    #    RepeatableLocationGroup UI.
    op.execute(sa.text("""
        UPDATE points_of_interest
        SET playground_locations = jsonb_build_array(playground_locations)
        WHERE jsonb_typeof(playground_locations) = 'object'
    """))


def downgrade():
    # Restore the singular column name. We do NOT attempt to unwrap arrays;
    # downstream code already tolerated either shape before the rename.
    op.alter_column(
        'points_of_interest',
        'playground_locations',
        new_column_name='playground_location',
    )
