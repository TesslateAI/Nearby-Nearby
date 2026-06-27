"""Add venue_poi_id, venue_inheritance, and recurring event columns to events

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6g7h8i9
Create Date: 2026-02-17 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = 'e5f6g7h8i9j0'
down_revision = 'd4e5f6g7h8i9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Task 45: Venue inheritance
    op.add_column('events', sa.Column('venue_poi_id', UUID(as_uuid=True), nullable=True))
    op.add_column('events', sa.Column('venue_inheritance', JSONB, nullable=True))
    op.create_foreign_key(
        'fk_events_venue_poi_id',
        'events', 'points_of_interest',
        ['venue_poi_id'], ['id'],
    )

    # Task 50: Recurring events expansion
    op.add_column('events', sa.Column('series_id', UUID(as_uuid=True), nullable=True))
    op.add_column('events', sa.Column('parent_event_id', UUID(as_uuid=True), nullable=True))
    op.add_column('events', sa.Column('excluded_dates', JSONB, nullable=True))
    op.add_column('events', sa.Column('recurrence_end_date', sa.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('events', sa.Column('manual_dates', JSONB, nullable=True))
    op.create_index('ix_events_series_id', 'events', ['series_id'])
    op.create_foreign_key(
        'fk_events_parent_event_id',
        'events', 'events',
        ['parent_event_id'], ['poi_id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_events_parent_event_id', 'events', type_='foreignkey')
    op.drop_index('ix_events_series_id', table_name='events')
    op.drop_column('events', 'manual_dates')
    op.drop_column('events', 'recurrence_end_date')
    op.drop_column('events', 'excluded_dates')
    op.drop_column('events', 'parent_event_id')
    op.drop_column('events', 'series_id')
    op.drop_constraint('fk_events_venue_poi_id', 'events', type_='foreignkey')
    op.drop_column('events', 'venue_inheritance')
    op.drop_column('events', 'venue_poi_id')
