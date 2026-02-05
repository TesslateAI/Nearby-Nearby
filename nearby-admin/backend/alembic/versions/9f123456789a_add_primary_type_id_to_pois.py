"""Add primary_type_id to points_of_interest (safe) and ensure primary_types table exists

Revision ID: 9f123456789a
Revises: 02830f53f66c
Create Date: 2025-10-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9f123456789a'
down_revision = '02830f53f66c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # Ensure primary_types table exists
    if not insp.has_table('primary_types'):
        op.create_table(
            'primary_types',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(length=120), nullable=False),
            sa.Column('slug', sa.String(length=160), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name'),
            sa.UniqueConstraint('slug')
        )
        op.create_index(op.f('ix_primary_types_name'), 'primary_types', ['name'], unique=False)
        op.create_index(op.f('ix_primary_types_slug'), 'primary_types', ['slug'], unique=False)

    # Add primary_type_id column to points_of_interest if missing
    poi_columns = [c['name'] for c in insp.get_columns('points_of_interest')]
    if 'primary_type_id' not in poi_columns:
        op.add_column('points_of_interest', sa.Column('primary_type_id', sa.UUID(), nullable=True))

    # Add FK if missing
    fks = insp.get_foreign_keys('points_of_interest')
    has_fk = any(
        fk.get('constrained_columns') == ['primary_type_id'] and fk.get('referred_table') == 'primary_types'
        for fk in fks
    )
    if not has_fk:
        op.create_foreign_key(
            'points_of_interest_primary_type_id_fkey',
            'points_of_interest',
            'primary_types',
            ['primary_type_id'],
            ['id'],
            ondelete='SET NULL'
        )

    # Add index if missing
    indexes = insp.get_indexes('points_of_interest')
    has_idx = any(
        idx.get('column_names') == ['primary_type_id']
        for idx in indexes
    )
    if not has_idx:
        op.create_index(op.f('ix_points_of_interest_primary_type_id'), 'points_of_interest', ['primary_type_id'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # Drop index if exists
    indexes = insp.get_indexes('points_of_interest')
    has_idx = any(
        idx.get('name') == op.f('ix_points_of_interest_primary_type_id') or idx.get('column_names') == ['primary_type_id']
        for idx in indexes
    )
    if has_idx:
        op.drop_index(op.f('ix_points_of_interest_primary_type_id'), table_name='points_of_interest')

    # Drop FK if exists
    fks = insp.get_foreign_keys('points_of_interest')
    for fk in fks:
        if fk.get('constrained_columns') == ['primary_type_id'] and fk.get('referred_table') == 'primary_types':
            # Some dialects may use different naming; use name when present
            fk_name = fk.get('name') or 'points_of_interest_primary_type_id_fkey'
            op.drop_constraint(fk_name, 'points_of_interest', type_='foreignkey')
            break

    # Drop column if exists
    poi_columns = [c['name'] for c in insp.get_columns('points_of_interest')]
    if 'primary_type_id' in poi_columns:
        op.drop_column('points_of_interest', 'primary_type_id')

    # Do not drop primary_types table by default to avoid data loss
    # If you really need to drop it, uncomment below:
    # if insp.has_table('primary_types'):
    #     op.drop_index(op.f('ix_primary_types_slug'), table_name='primary_types')
    #     op.drop_index(op.f('ix_primary_types_name'), table_name='primary_types')
    #     op.drop_table('primary_types')
