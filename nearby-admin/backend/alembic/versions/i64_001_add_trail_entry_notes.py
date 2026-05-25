"""Issue #64 — add 'trail_entry_notes' column for the Trail Guide reorg.

Revision ID: i64_001
Revises: i63_001
Create Date: 2026-05-25

The Trail accordion 22-section spec (issue #64) introduces a free-form
``trail_entry_notes`` field under the consolidated Trail Guide section so
admins can describe entry conditions in prose without it being conflated
with the existing ``trailhead_access_details`` field (which is reserved
for the trailhead specifically — access points have their own notes inside
``access_points`` JSONB rows). The column is nullable Text and lives on
the ``trails`` table (the trail-specific extension of points_of_interest).
No backfill is needed because empty / missing notes are valid.
"""

from alembic import op
import sqlalchemy as sa


revision = 'i64_001'
down_revision = 'i63_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'trails',
        sa.Column('trail_entry_notes', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('trails', 'trail_entry_notes')
