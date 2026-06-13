"""Issue #63 — add 'access_point' to the ImageType postgres enum.

Revision ID: i63_001
Revises: g70_001
Create Date: 2026-05-25

The Trail Trailhead + Access Points consolidation (issue #63 / #64) needs a
new image classification so admins can tag photos taken at secondary trail
entries as 'access_point' (distinct from 'trail_head' / 'trail_exit'). The
SQLAlchemy enum is materialised in Postgres as a native enum type — adding
a value requires ``ALTER TYPE ... ADD VALUE`` which Postgres refuses to run
inside the transaction block Alembic creates by default. We disable the
per-migration transaction to allow the change.

This migration is purely additive; downgrade is a no-op because Postgres
does not support removing enum values without recreating the type and
rewriting every dependent column — an irreversible action we are unwilling
to script automatically.
"""

from alembic import op


revision = 'i63_001'
down_revision = 'g70_001'
branch_labels = None
depends_on = None

# Required so ALTER TYPE ... ADD VALUE runs outside a transaction.
# See alembic docs: "Running ALTER TYPE / CREATE INDEX CONCURRENTLY".
disable_ddl_transaction = True


def upgrade() -> None:
    op.execute("ALTER TYPE imagetype ADD VALUE IF NOT EXISTS 'access_point'")


def downgrade() -> None:
    # Postgres cannot drop a single enum value safely without recreating the
    # type. Intentional no-op.
    pass
