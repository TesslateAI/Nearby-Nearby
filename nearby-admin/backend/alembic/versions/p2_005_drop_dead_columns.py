"""p2_005: drop dead columns — key_facilities, public_transit_info,
expect_to_pay_parking, entertainment_options, camping_lodging,
youth_amenities, business_amenities

These columns were replaced or are no longer used:
- key_facilities (JSONB): replaced by 4 icon booleans
  (icon_free_wifi, icon_pet_friendly, icon_public_restroom,
  icon_wheelchair_accessible) — issues #34
- public_transit_info (TEXT): dead, never surfaced in UI — issue #33
- expect_to_pay_parking (VARCHAR): dead, never surfaced in UI — issue #36
- entertainment_options (JSONB): dead, never surfaced in UI — issue #36
- camping_lodging (TEXT): dead, never surfaced in UI — issue #36
- youth_amenities (JSONB): dead, never surfaced in UI — issue #36
- business_amenities (JSONB): dead, never surfaced in UI — issue #36

Revision ID: p2_005_drop_dead_columns
Revises: p2_004_drop_wheelchair
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'p2_005_drop_dead_columns'
down_revision = 'p2_004_drop_wheelchair'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('points_of_interest', 'key_facilities')
    op.drop_column('points_of_interest', 'public_transit_info')
    op.drop_column('points_of_interest', 'expect_to_pay_parking')
    op.drop_column('points_of_interest', 'entertainment_options')
    op.drop_column('points_of_interest', 'camping_lodging')
    op.drop_column('points_of_interest', 'youth_amenities')
    op.drop_column('points_of_interest', 'business_amenities')


def downgrade():
    op.add_column('points_of_interest',
        sa.Column('business_amenities', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )
    op.add_column('points_of_interest',
        sa.Column('youth_amenities', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )
    op.add_column('points_of_interest',
        sa.Column('camping_lodging', sa.Text(), nullable=True)
    )
    op.add_column('points_of_interest',
        sa.Column('entertainment_options', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )
    op.add_column('points_of_interest',
        sa.Column('expect_to_pay_parking', sa.String(), nullable=True)
    )
    op.add_column('points_of_interest',
        sa.Column('public_transit_info', sa.Text(), nullable=True)
    )
    op.add_column('points_of_interest',
        sa.Column('key_facilities', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )
