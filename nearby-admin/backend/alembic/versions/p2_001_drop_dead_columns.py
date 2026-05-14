"""Phase 2 cleanup: drop 7 columns removed from model, schema, and UI.

Revision ID: p2_001_drop_dead_columns
Revises: p1_002_repair_amenities_arrays
Create Date: 2026-05-14

Columns dropped (issues #33, #34, #36):
  - public_transit_info    (Text)     -- #33
  - expect_to_pay_parking  (String)   -- #36
  - key_facilities         (JSONB)    -- #34
  - youth_amenities        (JSONB)    -- #36
  - business_amenities     (JSONB)    -- #36
  - entertainment_options  (JSONB)    -- #36
  - camping_lodging        (Text)     -- #36
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'p2_001_drop_dead_columns'
down_revision = 'p1_002_repair_amenities_arrays'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('points_of_interest', 'public_transit_info')
    op.drop_column('points_of_interest', 'expect_to_pay_parking')
    op.drop_column('points_of_interest', 'key_facilities')
    op.drop_column('points_of_interest', 'youth_amenities')
    op.drop_column('points_of_interest', 'business_amenities')
    op.drop_column('points_of_interest', 'entertainment_options')
    op.drop_column('points_of_interest', 'camping_lodging')


def downgrade():
    op.add_column('points_of_interest', sa.Column('camping_lodging', sa.Text(), nullable=True))
    op.add_column('points_of_interest', sa.Column('entertainment_options', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('points_of_interest', sa.Column('business_amenities', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('points_of_interest', sa.Column('youth_amenities', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('points_of_interest', sa.Column('key_facilities', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('points_of_interest', sa.Column('expect_to_pay_parking', sa.String(), nullable=True))
    op.add_column('points_of_interest', sa.Column('public_transit_info', sa.Text(), nullable=True))
