"""p2_004: drop legacy wheelchair_accessible JSONB column

Replaced by the individual mobility_access sub-fields (step_free_entry,
main_area_accessible, ground_level_service) and the auto-computed
icon_wheelchair_accessible boolean.

Revision ID: p2_004_drop_wheelchair_accessible
Revises: p2_003_trail_exit_to_aps
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'p2_004_drop_wheelchair'
down_revision = 'p2_003_trail_exit_to_aps'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('points_of_interest', 'wheelchair_accessible')


def downgrade():
    op.add_column('points_of_interest',
        sa.Column('wheelchair_accessible', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )
