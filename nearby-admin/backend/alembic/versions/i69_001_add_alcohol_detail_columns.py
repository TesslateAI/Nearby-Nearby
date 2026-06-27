"""Issue #69 — add granular alcohol detail columns.

Revision ID: i69_001
Revises: i64_001
Create Date: 2026-05-25

Adds the three columns that back the new Alcohol accordion sub-fields
introduced by Wave 2 / Phase 1 issue #69. The existing ``alcohol_available``
String(50) column remains the Yes/No gate; these columns surface only when
that gate is set to a non-"no_alcohol" value:

- ``alcohol_availability`` (JSONB): list of granular alcohol types selected
  (beer, wine, cider, mead, spirits, cocktails, non_alcoholic).
- ``byob_allowed`` (Boolean, default False): whether the venue permits BYOB.
- ``alcohol_notes`` (Text): free-form details (last call, age policy, etc).

These columns are additive — empty / missing values are valid and existing
rows backfill to defaults (NULL / False) without any data migration.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = 'i69_001'
down_revision = 'i64_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'points_of_interest',
        sa.Column('alcohol_availability', JSONB(), nullable=True),
    )
    op.add_column(
        'points_of_interest',
        sa.Column(
            'byob_allowed',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false'),
        ),
    )
    op.add_column(
        'points_of_interest',
        sa.Column('alcohol_notes', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('points_of_interest', 'alcohol_notes')
    op.drop_column('points_of_interest', 'byob_allowed')
    op.drop_column('points_of_interest', 'alcohol_availability')
