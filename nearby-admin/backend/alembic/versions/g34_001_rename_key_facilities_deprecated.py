"""Migration A (#34): rename key_facilities → _deprecated_key_facilities.

Revision ID: g34_001
Revises: g33_001
Create Date: 2026-05-25

Phase A of a two-phase deferred-destructive cleanup. key_facilities was
replaced by the 4 auto-computed icon booleans (icon_free_wifi,
icon_pet_friendly, icon_public_restroom, icon_wheelchair_accessible). The
column is renamed to signal it is no longer active. No data is lost; rollback
is trivial. The actual DROP is deferred to Migration B (Wave 5) after a soak
period with product sign-off.

All code references to key_facilities have been removed from both backend apps
(models, schemas, endpoints, autosave whitelist, generate_embeddings.py) and
the admin frontend (CoreInformationSection, initialValues, usePOIHandlers,
PoiDetailPage). Dev-only seed scripts have also been updated.
"""

from alembic import op
from sqlalchemy.dialects import postgresql


revision = 'g34_001'
down_revision = 'g33_001'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'points_of_interest',
        'key_facilities',
        new_column_name='_deprecated_key_facilities',
    )


def downgrade():
    op.alter_column(
        'points_of_interest',
        '_deprecated_key_facilities',
        new_column_name='key_facilities',
    )
