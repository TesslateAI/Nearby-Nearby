"""Alter description_short from VARCHAR(250) to TEXT

Revision ID: b2g3h4i5j6k7
Revises: a1f2b3c4d5e6
Create Date: 2026-02-06

Changes:
- ALTER description_short from VARCHAR(250) to TEXT (HTML markup needs more space,
  Pydantic validates visible text <= 250 chars)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2g3h4i5j6k7'
down_revision: Union[str, None] = 'a1f2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'points_of_interest',
        'description_short',
        existing_type=sa.String(250),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        'points_of_interest',
        'description_short',
        existing_type=sa.Text(),
        type_=sa.String(250),
        existing_nullable=True,
    )
