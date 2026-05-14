"""p2_003: add primary_trailhead_name; migrate trail exit to access_points; drop exit columns

Revision ID: p2_003_trail_exit_to_access_points
Revises: p2_002_primary_display_category_all_types
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'p2_003_trail_exit_to_aps'
down_revision = 'p2_002_primary_display_cat'
branch_labels = None
depends_on = None


def upgrade():
    # Add primary_trailhead_name to points_of_interest
    op.add_column('points_of_interest',
        sa.Column('primary_trailhead_name', sa.String(), nullable=True)
    )

    # Migrate existing trail exit data into access_points JSONB array
    op.execute("""
        UPDATE trails
        SET access_points = COALESCE(access_points, '[]'::jsonb) ||
            jsonb_build_array(
                jsonb_build_object(
                    'name', 'Trail Exit',
                    'type', 'exit',
                    'latitude', trail_exit_latitude,
                    'longitude', trail_exit_longitude,
                    'what3words', '',
                    'notes', ''
                )
            )
        WHERE trail_exit_latitude IS NOT NULL
           OR trail_exit_longitude IS NOT NULL
    """)

    # Drop the deprecated exit and entrance photo columns from trails
    op.drop_column('trails', 'trailhead_entrance_photo')
    op.drop_column('trails', 'trailhead_exit_location')
    op.drop_column('trails', 'trail_exit_latitude')
    op.drop_column('trails', 'trail_exit_longitude')
    op.drop_column('trails', 'trailhead_exit_photo')


def downgrade():
    op.add_column('trails', sa.Column('trailhead_exit_photo', sa.String(), nullable=True))
    op.add_column('trails', sa.Column('trail_exit_longitude', sa.Numeric(precision=10, scale=7), nullable=True))
    op.add_column('trails', sa.Column('trail_exit_latitude', sa.Numeric(precision=10, scale=7), nullable=True))
    op.add_column('trails', sa.Column('trailhead_exit_location', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('trails', sa.Column('trailhead_entrance_photo', sa.String(), nullable=True))
    op.drop_column('points_of_interest', 'primary_trailhead_name')
