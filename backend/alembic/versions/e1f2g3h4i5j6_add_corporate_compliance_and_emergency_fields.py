"""add_corporate_compliance_and_emergency_fields

Revision ID: e1f2g3h4i5j6
Revises: d5e8c1a9b2c3
Create Date: 2025-01-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e1f2g3h4i5j6'
down_revision = 'd5e8c1a9b2c3'
branch_labels = None
depends_on = None


def upgrade():
    # Add the new JSONB columns to the points_of_interest table
    op.add_column('points_of_interest', sa.Column('corporate_compliance', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('points_of_interest', sa.Column('main_emergency_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('points_of_interest', sa.Column('offsite_emergency_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('points_of_interest', sa.Column('emergency_protocols', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('points_of_interest', sa.Column('public_toilets', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade():
    # Remove the columns
    op.drop_column('points_of_interest', 'public_toilets')
    op.drop_column('points_of_interest', 'emergency_protocols')
    op.drop_column('points_of_interest', 'offsite_emergency_contact')
    op.drop_column('points_of_interest', 'main_emergency_contact')
    op.drop_column('points_of_interest', 'corporate_compliance')
