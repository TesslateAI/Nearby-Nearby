"""Listing type changes - tasks 171-172

Remove paid_founding, replace sponsor with 4 sponsor levels.

Revision ID: g7h8i9j0k1l2
Revises: f6g7h8i9j0k1
Create Date: 2026-02-28 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'g7h8i9j0k1l2'
down_revision = 'f6g7h8i9j0k1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Migrate paid_founding → paid
    op.execute(
        "UPDATE points_of_interest SET listing_type = 'paid' WHERE listing_type = 'paid_founding'"
    )
    # Migrate sponsor → sponsor_platform
    op.execute(
        "UPDATE points_of_interest SET listing_type = 'sponsor_platform' WHERE listing_type = 'sponsor'"
    )


def downgrade() -> None:
    # Revert sponsor_platform → sponsor
    op.execute(
        "UPDATE points_of_interest SET listing_type = 'sponsor' WHERE listing_type = 'sponsor_platform'"
    )
    # Revert sponsor_state/county/town → sponsor
    op.execute(
        "UPDATE points_of_interest SET listing_type = 'sponsor' WHERE listing_type IN ('sponsor_state', 'sponsor_county', 'sponsor_town')"
    )
    # Revert paid → paid (paid_founding data is lost since we can't distinguish)
