"""Add images table for POI image uploads

Revision ID: ab1234567890
Revises: e6318f242755
Create Date: 2025-01-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ab1234567890'
down_revision: Union[str, None] = 'e6318f242755'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create image type enum only if it doesn't exist
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE imagetype AS ENUM (
                'main', 'gallery', 'entry', 'parking', 'restroom',
                'rental', 'playground', 'menu', 'trail_head',
                'trail_exit', 'map', 'downloadable_map'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create images table only if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            poi_id UUID NOT NULL REFERENCES points_of_interest(id) ON DELETE CASCADE,
            image_type imagetype NOT NULL,
            image_context VARCHAR(50),
            filename VARCHAR(255) NOT NULL,
            original_filename VARCHAR(255),
            mime_type VARCHAR(50),
            size_bytes INTEGER,
            width INTEGER,
            height INTEGER,
            alt_text TEXT,
            caption TEXT,
            display_order INTEGER DEFAULT 0,
            uploaded_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE
        )
    """)

    # Create indexes only if they don't exist
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_images_poi_id ON images (poi_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_images_type ON images (image_type)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_images_poi_type ON images (poi_id, image_type)
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_images_poi_type', table_name='images')
    op.drop_index('idx_images_type', table_name='images')
    op.drop_index('idx_images_poi_id', table_name='images')

    # Drop table
    op.drop_table('images')

    # Drop enum type
    op.execute('DROP TYPE imagetype')