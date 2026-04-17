"""Phase 1 final: drop legacy ticket_link scalar column.

Revision ID: p1_999_drop_ticket_link
Revises: p1_001_phase1_additive
Create Date: 2026-04-14

Safe to run only after the admin form no longer writes ticket_link and
Migration A has copied all scalar values into events.ticket_links.
"""

from alembic import op
import sqlalchemy as sa


revision = 'p1_999_drop_ticket_link'
down_revision = 'p1_001_phase1_additive'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('points_of_interest', 'ticket_link')


def downgrade():
    op.add_column(
        'points_of_interest',
        sa.Column('ticket_link', sa.String(length=500), nullable=True),
    )
