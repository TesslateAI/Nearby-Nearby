"""Add slug field to POIs for SEO-friendly URLs

Revision ID: slug_001
Revises: h7i8j9k0l1m2
Create Date: 2025-12-08
"""
from alembic import op
import sqlalchemy as sa
import re

# revision identifiers, used by Alembic.
revision = 'slug_001'
down_revision = 'h7i8j9k0l1m2'
branch_labels = None
depends_on = None


def generate_slug(name, city):
    """Generate URL-friendly slug from name and city"""
    slug = name.lower() if name else ''
    if city:
        slug = f"{slug} {city.lower()}"

    # Remove special characters and replace spaces with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'^-+|-+$', '', slug)

    return slug


def upgrade():
    # Add slug column (nullable first to allow migration)
    op.add_column('points_of_interest', sa.Column('slug', sa.String(300), nullable=True))

    # Create unique index
    op.create_index('ix_points_of_interest_slug', 'points_of_interest', ['slug'], unique=True)

    # Generate slugs for existing POIs
    connection = op.get_bind()

    # Get all POIs
    result = connection.execute(
        sa.text("SELECT id, name, address_city FROM points_of_interest")
    )
    pois = result.fetchall()

    # Track used slugs to handle duplicates
    used_slugs = set()

    for poi_id, name, city in pois:
        base_slug = generate_slug(name, city)
        slug = base_slug
        counter = 1

        # Handle duplicates by appending a number
        while slug in used_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1

        used_slugs.add(slug)

        # Update the POI with the generated slug
        connection.execute(
            sa.text("UPDATE points_of_interest SET slug = :slug WHERE id = :id"),
            {"slug": slug, "id": poi_id}
        )


def downgrade():
    op.drop_index('ix_points_of_interest_slug', table_name='points_of_interest')
    op.drop_column('points_of_interest', 'slug')
