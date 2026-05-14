"""Add primary_display_category to points_of_interest for all POI types (issue #42).

Revision ID: p2_002_primary_display_category_all_types
Revises: p2_001_drop_dead_columns
Create Date: 2026-05-14

Previously this field only existed in the events table. Moving it to the base
points_of_interest table makes it available for Business, Park, Trail, and Event.
The events.primary_display_category column is left in place for backward compat.
"""

from alembic import op
import sqlalchemy as sa

revision = 'p2_002_primary_display_cat'
down_revision = 'p2_001_drop_dead_columns'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'points_of_interest',
        sa.Column('primary_display_category', sa.String(100), nullable=True),
    )


def downgrade():
    op.drop_column('points_of_interest', 'primary_display_category')
