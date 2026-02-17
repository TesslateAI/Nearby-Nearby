"""Create form tables for public submissions

Revision ID: c3f4g5h6i7j8
Revises: b2g3h4i5j6k7
Create Date: 2026-02-06

Creates 5 tables:
- waitlist (email capture)
- community_interest (community interest form)
- contact_submissions (contact us form)
- feedback_submissions (feedback with file uploads)
- business_claims (claim your business form)

Also creates a restricted 'nearby_forms' database role that can only
INSERT and SELECT on these tables — isolating public form writes from
POI data.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers
revision = 'c3f4g5h6i7j8'
down_revision = 'b2g3h4i5j6k7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── waitlist ──────────────────────────────────────────────
    op.create_table(
        'waitlist',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True),
                  server_default=sa.text('NOW()')),
    )
    op.create_index('ix_waitlist_email', 'waitlist', ['email'])

    # ── community_interest ────────────────────────────────────
    op.create_table(
        'community_interest',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('location', sa.String(200), nullable=False),
        sa.Column('role', JSONB, nullable=True),
        sa.Column('role_other', sa.String(100), nullable=True),
        sa.Column('why', sa.Text, nullable=True),
        sa.Column('how_heard', sa.String(500), nullable=True),
        sa.Column('anything_else', sa.Text, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True),
                  server_default=sa.text('NOW()')),
    )

    # ── contact_submissions ───────────────────────────────────
    op.create_table(
        'contact_submissions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True),
                  server_default=sa.text('NOW()')),
    )

    # ── feedback_submissions ──────────────────────────────────
    op.create_table(
        'feedback_submissions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('feedback', sa.Text, nullable=False),
        sa.Column('file_urls', JSONB, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True),
                  server_default=sa.text('NOW()')),
    )

    # ── business_claims ───────────────────────────────────────
    op.create_table(
        'business_claims',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('business_name', sa.String(200), nullable=False),
        sa.Column('contact_name', sa.String(100), nullable=False),
        sa.Column('contact_phone', sa.String(20), nullable=False),
        sa.Column('contact_email', sa.String(255), nullable=False),
        sa.Column('business_address', sa.String(500), nullable=False),
        sa.Column('how_heard', sa.String(500), nullable=True),
        sa.Column('anything_else', sa.Text, nullable=True),
        sa.Column('status', sa.String(20), nullable=False,
                  server_default='pending'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True),
                  server_default=sa.text('NOW()')),
    )

    # ── nearby_forms role ─────────────────────────────────────
    # Wrap in a DO block so it's idempotent (won't fail if role exists)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nearby_forms') THEN
                CREATE ROLE nearby_forms WITH LOGIN PASSWORD 'nf_s3cure_2026!';
            END IF;
        END
        $$;
    """)
    op.execute("GRANT CONNECT ON DATABASE nearbynearby TO nearby_forms")
    op.execute("GRANT USAGE ON SCHEMA public TO nearby_forms")
    op.execute("""
        GRANT SELECT, INSERT ON
            waitlist, community_interest, contact_submissions,
            feedback_submissions, business_claims
        TO nearby_forms
    """)


def downgrade() -> None:
    op.execute("""
        REVOKE ALL ON
            waitlist, community_interest, contact_submissions,
            feedback_submissions, business_claims
        FROM nearby_forms
    """)
    op.execute("REVOKE USAGE ON SCHEMA public FROM nearby_forms")
    op.execute("REVOKE CONNECT ON DATABASE nearbynearby FROM nearby_forms")

    op.drop_table('business_claims')
    op.drop_table('feedback_submissions')
    op.drop_table('contact_submissions')
    op.drop_table('community_interest')
    op.drop_index('ix_waitlist_email', 'waitlist')
    op.drop_table('waitlist')
