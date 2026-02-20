"""Add function_tags to images table

Revision ID: d4e5f6g7h8i9
Revises: c3f4g5h6i7j8
Create Date: 2026-02-17 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = 'd4e5f6g7h8i9'
down_revision = 'c3f4g5h6i7j8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('images', sa.Column('function_tags', JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column('images', 'function_tags')
