"""Refactor business and outdoors attributes

Revision ID: d5e8c1a9b2c3
Revises: c7d8e9f0a1b2
Create Date: 2025-06-15 04:15:00.123456

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd5e8c1a9b2c3'
down_revision = 'c7d8e9f0a1b2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    # Drop old individual columns from 'businesses' as they are now in 'attributes' JSONB field
    op.drop_column('businesses', 'price_range')
    op.drop_column('businesses', 'amenities') # This is redundant with the new `attributes` field
    
    # Add the single 'attributes' column to 'outdoors' table
    op.add_column('outdoors', sa.Column('attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    # Drop the old, now unused, individual columns from 'outdoors'
    op.drop_column('outdoors', 'outdoor_specific_type')
    op.drop_column('outdoors', 'facilities')
    op.drop_column('outdoors', 'trail_length_km')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    # Re-add the old columns to 'outdoors'
    op.add_column('outdoors', sa.Column('trail_length_km', sa.NUMERIC(precision=6, scale=2), autoincrement=False, nullable=True))
    op.add_column('outdoors', sa.Column('facilities', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.add_column('outdoors', sa.Column('outdoor_specific_type', sa.VARCHAR(), autoincrement=False, nullable=True))
    # Drop the new 'attributes' column from 'outdoors'
    op.drop_column('outdoors', 'attributes')

    # Re-add the old columns to 'businesses'
    op.add_column('businesses', sa.Column('amenities', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.add_column('businesses', sa.Column('price_range', sa.VARCHAR(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###