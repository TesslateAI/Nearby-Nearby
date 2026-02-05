"""Drop photo columns - consolidated to Images table

Revision ID: drop_photo_cols_001
Revises: 02830f53f66c
Create Date: 2025-12-30

This migration removes photo columns from POI models as all photos
are now stored in the Images table with S3 storage.

Columns removed:
- points_of_interest: parking_photos, rental_photos, playground_photos,
                       business_entry_photo, park_entry_photo, parking_lot_photo
- trails: trailhead_photo, trail_exit_photo
- events: event_entry_photo

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'drop_photo_cols_001'
down_revision: Union[str, None] = '02830f53f66c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop photo columns from points_of_interest table
    # Using IF EXISTS to make migration idempotent
    op.execute("""
        ALTER TABLE points_of_interest
        DROP COLUMN IF EXISTS parking_photos,
        DROP COLUMN IF EXISTS rental_photos,
        DROP COLUMN IF EXISTS playground_photos,
        DROP COLUMN IF EXISTS business_entry_photo,
        DROP COLUMN IF EXISTS park_entry_photo,
        DROP COLUMN IF EXISTS parking_lot_photo
    """)

    # Drop photo columns from trails table
    op.execute("""
        ALTER TABLE trails
        DROP COLUMN IF EXISTS trailhead_photo,
        DROP COLUMN IF EXISTS trail_exit_photo
    """)

    # Drop photo column from events table
    op.execute("""
        ALTER TABLE events
        DROP COLUMN IF EXISTS event_entry_photo
    """)


def downgrade() -> None:
    # Restore photo columns to points_of_interest table
    op.add_column('points_of_interest', sa.Column('parking_photos', postgresql.JSONB(), nullable=True))
    op.add_column('points_of_interest', sa.Column('rental_photos', postgresql.JSONB(), nullable=True))
    op.add_column('points_of_interest', sa.Column('playground_photos', postgresql.JSONB(), nullable=True))
    op.add_column('points_of_interest', sa.Column('business_entry_photo', sa.String(), nullable=True))
    op.add_column('points_of_interest', sa.Column('park_entry_photo', sa.String(), nullable=True))
    op.add_column('points_of_interest', sa.Column('parking_lot_photo', sa.String(), nullable=True))

    # Restore photo columns to trails table
    op.add_column('trails', sa.Column('trailhead_photo', sa.String(), nullable=True))
    op.add_column('trails', sa.Column('trail_exit_photo', sa.String(), nullable=True))

    # Restore photo column to events table
    op.add_column('events', sa.Column('event_entry_photo', sa.String(), nullable=True))
