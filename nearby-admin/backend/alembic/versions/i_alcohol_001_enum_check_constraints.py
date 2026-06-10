"""Add CHECK constraints on enum-like VARCHAR columns.

Revision ID: i_alcohol_001
Revises: w63c_001
Create Date: 2026-05-30

Several columns were declared as `VARCHAR` with no CHECK constraint, but the
Pydantic schemas treat them as `Optional[Literal[...]]`. A bad value (e.g. an
empty string) sneaks in via the raw-dict autosave path and crashes every list
endpoint with `ResponseValidationError`.

This migration cleans up any value not in the allowed set (sets it to NULL)
and then attaches a CHECK constraint via `NOT VALID` + `VALIDATE CONSTRAINT`,
which keeps the table-rewrite lock window short.

Idempotency: cleanup uses a `NOT IN` filter that only touches bad rows; the
constraint add is guarded by a `pg_constraint` lookup in Python.

Implementation note: existence-check is done in Python rather than a `DO $$`
block because the `businesses.price_range` allowed set contains `$$`, `$$$`,
`$$$$`, which collide with PostgreSQL's dollar-quote delimiter inside a DO
block.

Downgrade drops the constraints; cleaned-up data is not restored.
"""

from alembic import op
from sqlalchemy import text


revision = 'i_alcohol_001'
down_revision = 'w63c_001'
branch_labels = None
depends_on = None


ENUM_COLUMNS = {
    ('points_of_interest', 'alcohol_available'):
        ('full_bar', 'beer_wine', 'byob', 'no_alcohol', 'seasonal', 'nearby'),
    ('points_of_interest', 'expect_to_pay_parking'):
        ('yes', 'no', 'sometimes'),
    ('points_of_interest', 'listing_type'):
        ('free', 'paid', 'paid_founding', 'community_comped'),
    ('points_of_interest', 'publication_status'):
        ('draft', 'published', 'archived'),
    ('points_of_interest', 'sponsor_level'):
        ('platform', 'state', 'county', 'town'),
    ('businesses', 'price_range'):
        ('$', '$$', '$$$', '$$$$'),
    ('trails', 'trail_lighting'):
        ('partial', 'full', 'seasonal', 'dusk_to_dawn'),
}


def _quote(values):
    return ", ".join("'" + v.replace("'", "''") + "'" for v in values)


def upgrade() -> None:
    bind = op.get_bind()

    # 1. Cleanup: NULL out values not in the allowed set.
    for (table, col), allowed in ENUM_COLUMNS.items():
        allowed_sql = _quote(allowed)
        op.execute(
            f"UPDATE {table} SET {col} = NULL "
            f"WHERE {col} IS NOT NULL AND {col} NOT IN ({allowed_sql})"
        )

    # 2. Add CHECK NOT VALID, then VALIDATE CONSTRAINT.
    for (table, col), allowed in ENUM_COLUMNS.items():
        constraint = f"ck_{table}_{col}_valid"
        allowed_sql = _quote(allowed)
        already_exists = bind.execute(
            text("SELECT 1 FROM pg_constraint WHERE conname = :name"),
            {"name": constraint},
        ).scalar()
        if not already_exists:
            op.execute(
                f"ALTER TABLE {table} ADD CONSTRAINT {constraint} "
                f"CHECK ({col} IS NULL OR {col} IN ({allowed_sql})) NOT VALID"
            )
        op.execute(f"ALTER TABLE {table} VALIDATE CONSTRAINT {constraint}")


def downgrade() -> None:
    for (table, col), _ in ENUM_COLUMNS.items():
        constraint = f"ck_{table}_{col}_valid"
        op.execute(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {constraint}")
