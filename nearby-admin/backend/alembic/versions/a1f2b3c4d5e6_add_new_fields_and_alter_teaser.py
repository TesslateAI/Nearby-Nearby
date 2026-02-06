"""Add lat_long_most_accurate, alcohol_policy_details, alter teaser_paragraph to text

Revision ID: a1f2b3c4d5e6
Revises: 6ed23b221b39
Create Date: 2026-02-06

Changes:
- ALTER teaser_paragraph from VARCHAR(120) to TEXT (HTML markup needs more space,
  Pydantic validates visible text <= 120 chars)
- ADD lat_long_most_accurate BOOLEAN DEFAULT FALSE
- ADD alcohol_policy_details TEXT
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f2b3c4d5e6'
down_revision: Union[str, None] = '6ed23b221b39'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Change teaser_paragraph from VARCHAR(120) to TEXT
    op.alter_column(
        'points_of_interest',
        'teaser_paragraph',
        existing_type=sa.String(120),
        type_=sa.Text(),
        existing_nullable=True,
    )

    # Add lat_long_most_accurate flag
    op.add_column(
        'points_of_interest',
        sa.Column('lat_long_most_accurate', sa.Boolean(), server_default='false', nullable=True),
    )

    # Add alcohol_policy_details
    op.add_column(
        'points_of_interest',
        sa.Column('alcohol_policy_details', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('points_of_interest', 'alcohol_policy_details')
    op.drop_column('points_of_interest', 'lat_long_most_accurate')
    op.alter_column(
        'points_of_interest',
        'teaser_paragraph',
        existing_type=sa.Text(),
        type_=sa.String(120),
        existing_nullable=True,
    )
