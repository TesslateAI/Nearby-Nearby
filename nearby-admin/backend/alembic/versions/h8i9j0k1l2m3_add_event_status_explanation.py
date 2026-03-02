"""Add event status_explanation column

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-02-28

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'h8i9j0k1l2m3'
down_revision = 'g7h8i9j0k1l2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('events', sa.Column('status_explanation', sa.String(80), nullable=True))


def downgrade():
    op.drop_column('events', 'status_explanation')
