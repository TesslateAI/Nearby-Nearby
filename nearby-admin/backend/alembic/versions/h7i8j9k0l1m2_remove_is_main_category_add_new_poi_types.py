"""Remove is_main_category and add new POI types

Revision ID: h7i8j9k0l1m2
Revises: 9f123456789a
Create Date: 2025-10-27 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'h7i8j9k0l1m2'
down_revision = '9f123456789a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # Step 1: Add new POI types to the enum
    # PostgreSQL requires special handling for enum alterations
    op.execute("""
        ALTER TYPE poitype ADD VALUE IF NOT EXISTS 'SERVICES';
        ALTER TYPE poitype ADD VALUE IF NOT EXISTS 'YOUTH_ACTIVITIES';
        ALTER TYPE poitype ADD VALUE IF NOT EXISTS 'JOBS';
        ALTER TYPE poitype ADD VALUE IF NOT EXISTS 'VOLUNTEER_OPPORTUNITIES';
        ALTER TYPE poitype ADD VALUE IF NOT EXISTS 'DISASTER_HUBS';
    """)

    # Step 2: Remove is_main_category column from categories table
    categories_columns = [c['name'] for c in insp.get_columns('categories')]
    if 'is_main_category' in categories_columns:
        op.drop_column('categories', 'is_main_category')

    # Step 3: Add index on parent_id for better performance (if not exists)
    indexes = insp.get_indexes('categories')
    has_parent_idx = any(
        'parent_id' in idx.get('column_names', [])
        for idx in indexes
    )
    if not has_parent_idx:
        op.create_index(
            op.f('ix_categories_parent_id'),
            'categories',
            ['parent_id'],
            unique=False
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # Step 1: Remove index on parent_id
    indexes = insp.get_indexes('categories')
    has_parent_idx = any(
        idx.get('name') == op.f('ix_categories_parent_id')
        for idx in indexes
    )
    if has_parent_idx:
        op.drop_index(op.f('ix_categories_parent_id'), table_name='categories')

    # Step 2: Re-add is_main_category column (if needed for rollback)
    categories_columns = [c['name'] for c in insp.get_columns('categories')]
    if 'is_main_category' not in categories_columns:
        op.add_column(
            'categories',
            sa.Column('is_main_category', sa.Boolean(), server_default='false', nullable=False)
        )

    # Step 3: Cannot easily remove enum values in PostgreSQL
    # Would require recreating the enum type and updating all references
    # For safety, we'll leave the new POI types in place
    # If you need to remove them, you'll need to:
    # 1. Create a new enum without the new values
    # 2. Update all poi_type columns to use the new enum
    # 3. Drop the old enum
    # 4. Rename the new enum
    print("WARNING: New POI types (SERVICES, YOUTH_ACTIVITIES, JOBS, VOLUNTEER_OPPORTUNITIES, DISASTER_HUBS) "
          "are not removed in downgrade due to PostgreSQL enum limitations. "
          "Manual intervention required if these need to be removed.")
