"""Migration A (#33): rename public_transit_info → _deprecated_public_transit_info.

Revision ID: g33_001_rename_public_transit_info_deprecated
Revises: p1_002_repair_amenities_arrays
Create Date: 2026-05-25

Phase A of a two-phase deferred-destructive cleanup. The column is renamed to
signal it is no longer active. No data is lost; rollback is trivial. The actual
DROP is deferred to Migration B (Wave 5) after a soak period with product
sign-off.

All code references to public_transit_info have been removed from both
backend apps (models, schemas, endpoints, autosave whitelist,
venue_inheritance.py) and the admin frontend (LocationSection, initialValues,
VenueSelector, usePOIHandlers, PoiDetailPage).
"""

from alembic import op


revision = 'g33_001_rename_public_transit_info_deprecated'
down_revision = 'p1_002_repair_amenities_arrays'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'points_of_interest',
        'public_transit_info',
        new_column_name='_deprecated_public_transit_info',
    )


def downgrade():
    op.alter_column(
        'points_of_interest',
        '_deprecated_public_transit_info',
        new_column_name='public_transit_info',
    )
