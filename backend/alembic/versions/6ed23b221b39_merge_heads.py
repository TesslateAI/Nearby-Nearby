"""merge_heads

Revision ID: 6ed23b221b39
Revises: drop_photo_cols_001, slug_001
Create Date: 2026-01-13 14:56:57.784179

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6ed23b221b39'
down_revision = ('drop_photo_cols_001', 'slug_001')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass