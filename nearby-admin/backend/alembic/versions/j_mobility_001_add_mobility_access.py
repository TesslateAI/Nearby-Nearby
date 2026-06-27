"""Add mobility_access JSONB column to points_of_interest.

The admin Accessibility / Mobility Access UI writes a top-level `mobility_access`
dict ({step_free_entry, main_area_accessible, ground_level_service}) via
form.setFieldValue('mobility_access.<key>', ...). There was no backing column
and no autosave-whitelist entry, so those values silently never persisted —
they were dropped by the whitelist filter on every save. The compute helper even
read `amenities.mobility_access`, a location the frontend never wrote to.

This adds the column so the Accessibility section actually saves, for every POI
type. Nullable + additive — no data backfill needed.

Revision ID: j_mobility_001
Revises: i_alcohol_001
Create Date: 2026-06-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = 'j_mobility_001'
down_revision = 'i_alcohol_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'points_of_interest',
        sa.Column('mobility_access', JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column('points_of_interest', 'mobility_access')
