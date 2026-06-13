"""Event backend tasks 134-149, 153, 157

Add event status, extended organizer, cost type, ticket links, sponsors
columns to events table and create event_suggestions table.

Revision ID: f6g7h8i9j0k1
Revises: e5f6g7h8i9j0
Create Date: 2026-02-27 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = 'f6g7h8i9j0k1'
down_revision = 'e5f6g7h8i9j0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Task 134-136: Event Status System
    op.add_column('events', sa.Column('event_status', sa.String(100), server_default='Scheduled'))
    op.add_column('events', sa.Column('cancellation_paragraph', sa.Text))
    op.add_column('events', sa.Column('contact_organizer_toggle', sa.Boolean, server_default='false'))
    op.add_column('events', sa.Column('new_event_link', sa.String))
    op.add_column('events', sa.Column('rescheduled_from_event_id', UUID(as_uuid=True), sa.ForeignKey('events.poi_id'), nullable=True))

    # Task 137: Primary Display Category
    op.add_column('events', sa.Column('primary_display_category', sa.String(100)))

    # Task 138: Extended Organizer
    op.add_column('events', sa.Column('organizer_email', sa.String))
    op.add_column('events', sa.Column('organizer_phone', sa.String))
    op.add_column('events', sa.Column('organizer_website', sa.String))
    op.add_column('events', sa.Column('organizer_social_media', JSONB))
    op.add_column('events', sa.Column('organizer_poi_id', UUID(as_uuid=True), sa.ForeignKey('points_of_interest.id'), nullable=True))

    # Task 139: Cost & Ticketing
    op.add_column('events', sa.Column('cost_type', sa.String(50)))
    op.add_column('events', sa.Column('ticket_links', JSONB))

    # Task 140: Sponsors
    op.add_column('events', sa.Column('sponsors', JSONB))

    # Task 153: Event Suggestions table
    op.create_table(
        'event_suggestions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('event_name', sa.String(255), nullable=False),
        sa.Column('event_description', sa.Text),
        sa.Column('event_date', sa.String(100)),
        sa.Column('event_location', sa.String(255)),
        sa.Column('organizer_name', sa.String(100)),
        sa.Column('organizer_email', sa.String(255), nullable=False),
        sa.Column('organizer_phone', sa.String(50)),
        sa.Column('additional_info', sa.Text),
        sa.Column('status', sa.String(50), server_default='pending'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('event_suggestions')

    op.drop_column('events', 'sponsors')
    op.drop_column('events', 'ticket_links')
    op.drop_column('events', 'cost_type')
    op.drop_column('events', 'organizer_poi_id')
    op.drop_column('events', 'organizer_social_media')
    op.drop_column('events', 'organizer_website')
    op.drop_column('events', 'organizer_phone')
    op.drop_column('events', 'organizer_email')
    op.drop_column('events', 'primary_display_category')
    op.drop_column('events', 'rescheduled_from_event_id')
    op.drop_column('events', 'new_event_link')
    op.drop_column('events', 'contact_organizer_toggle')
    op.drop_column('events', 'cancellation_paragraph')
    op.drop_column('events', 'event_status')
