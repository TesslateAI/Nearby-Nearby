"""Phase 1 additive migration: new POI + Trail columns and safe backfills.

Revision ID: p1_001_phase1_additive
Revises: h8i9j0k1l2m3
Create Date: 2026-04-14

This migration is strictly additive:
- Adds new columns to points_of_interest and trails.
- Backfills values derived from existing user data.
- Never drops a column and never sets any JSONB user-data column to NULL.

park_entry_notes is intentionally NOT re-added here (already present via an
earlier migration on the points_of_interest model).
"""

import json

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = 'p1_001_phase1_additive'
down_revision = 'h8i9j0k1l2m3'
branch_labels = None
depends_on = None


# Ideal For regrouping map (see master plan §5).
IDEAL_FOR_GROUP_MAP = {
    # atmosphere
    'Casual + Welcoming': 'atmosphere', 'Formal + Refined': 'atmosphere',
    'Loud + Lively': 'atmosphere', 'Quiet + Reflective': 'atmosphere',
    'Cozy': 'atmosphere', 'Rustic': 'atmosphere', 'Modern': 'atmosphere',
    'Historic': 'atmosphere', 'Romantic': 'atmosphere', 'Lively': 'atmosphere',
    'Intimate': 'atmosphere', 'Laid-Back': 'atmosphere', 'Energetic': 'atmosphere',
    'Trendy': 'atmosphere', 'Scenic': 'atmosphere', 'Upscale': 'atmosphere',
    'Hip': 'atmosphere', 'Artsy': 'atmosphere', 'Professional': 'atmosphere',
    'Family-Oriented': 'atmosphere', 'Relaxed': 'atmosphere', 'Elegant': 'atmosphere',
    # age_group
    'All Ages': 'age_group', 'Families': 'age_group', 'Infants': 'age_group',
    'Toddlers': 'age_group', 'PreK': 'age_group', 'School Age': 'age_group',
    'Youth': 'age_group', 'Teens': 'age_group', 'Ages 18+': 'age_group',
    'Ages 21+': 'age_group', 'Adults': 'age_group', 'Seniors': 'age_group',
    'Golden Years Ages 55+': 'age_group', 'For the Kids': 'age_group',
    # social_settings
    'Date Night - Romance': 'social_settings', 'Girls Night': 'social_settings',
    'Guys Night': 'social_settings', 'Large Groups 10+': 'social_settings',
    'Small Groups': 'social_settings', 'Solo-Friendly': 'social_settings',
    'Pet Friendly': 'social_settings', 'First Dates': 'social_settings',
    'Group Outings': 'social_settings', 'Couples Retreat': 'social_settings',
    'Friend Hangout': 'social_settings',
    # local_special (anything else falls through to _legacy)
    'Local Artists': 'local_special', 'Locally Sourced Ingredients': 'local_special',
    'Budget Friendly': 'local_special', 'Eco Friendly': 'local_special',
    'Luxury': 'local_special', 'Reservations': 'local_special',
    'Happy Hour': 'local_special', 'Hidden Gem': 'local_special',
    'Night Owls Open Late': 'local_special',
    'Night Owls Open Late (past 10pm)': 'local_special',
}


def regroup_ideal_for(flat_list):
    out = {
        'atmosphere': [], 'age_group': [], 'social_settings': [],
        'local_special': [], '_legacy': [],
    }
    for item in (flat_list or []):
        out[IDEAL_FOR_GROUP_MAP.get(item, '_legacy')].append(item)
    return out


def upgrade():
    # --- points_of_interest: 17 additive columns (park_entry_notes already exists) ---
    op.add_column('points_of_interest', sa.Column('has_been_published', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('points_of_interest', sa.Column('arrival_methods', JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=True))
    op.add_column('points_of_interest', sa.Column('what3words_address', sa.String(length=100), nullable=True))
    op.add_column('points_of_interest', sa.Column('icon_free_wifi', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('points_of_interest', sa.Column('icon_pet_friendly', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('points_of_interest', sa.Column('icon_public_restroom', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('points_of_interest', sa.Column('icon_wheelchair_accessible', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('points_of_interest', sa.Column('is_sponsor', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('points_of_interest', sa.Column('sponsor_level', sa.String(length=30), nullable=True))
    op.add_column('points_of_interest', sa.Column('admin_notes', sa.Text(), nullable=True))
    op.add_column('points_of_interest', sa.Column('accessible_parking_details', JSONB(), nullable=True))
    op.add_column('points_of_interest', sa.Column('accessible_restroom', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('points_of_interest', sa.Column('accessible_restroom_details', JSONB(), nullable=True))
    op.add_column('points_of_interest', sa.Column('playground_age_groups', JSONB(), nullable=True))
    op.add_column('points_of_interest', sa.Column('playground_ada_checklist', JSONB(), nullable=True))
    op.add_column('points_of_interest', sa.Column('inclusive_playground', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('points_of_interest', sa.Column('alcohol_available', sa.String(length=50), nullable=True))
    # park_entry_notes SKIPPED — already exists on the model/table.

    # --- trails: 7 additive columns ---
    op.add_column('trails', sa.Column('mile_markers', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('trails', sa.Column('trailhead_signage', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('trails', sa.Column('audio_guide_available', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('trails', sa.Column('qr_trail_guide', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('trails', sa.Column('trail_guide_notes', sa.Text(), nullable=True))
    op.add_column('trails', sa.Column('trail_lighting', sa.String(length=30), nullable=True))
    op.add_column('trails', sa.Column('access_points', JSONB(), nullable=True))

    # ------------------------------------------------------------------
    # Backfills (order matters)
    # ------------------------------------------------------------------

    # 1) has_been_published flag for currently-published POIs.
    op.execute(sa.text(
        "UPDATE points_of_interest SET has_been_published = true "
        "WHERE publication_status = 'published'"
    ))

    # 2) Sponsor migration (formerly encoded in listing_type='sponsor_*').
    op.execute(sa.text(
        "UPDATE points_of_interest SET is_sponsor = true, sponsor_level = 'platform', listing_type = 'paid' "
        "WHERE listing_type = 'sponsor_platform'"
    ))
    op.execute(sa.text(
        "UPDATE points_of_interest SET is_sponsor = true, sponsor_level = 'state', listing_type = 'paid' "
        "WHERE listing_type = 'sponsor_state'"
    ))
    op.execute(sa.text(
        "UPDATE points_of_interest SET is_sponsor = true, sponsor_level = 'county', listing_type = 'paid' "
        "WHERE listing_type = 'sponsor_county'"
    ))
    op.execute(sa.text(
        "UPDATE points_of_interest SET is_sponsor = true, sponsor_level = 'town', listing_type = 'paid' "
        "WHERE listing_type = 'sponsor_town'"
    ))

    # 3) Mirror wifi_options into amenities.wifi, only when amenities.wifi
    #    is absent. wifi_options is already JSONB — no cast needed.
    op.execute(sa.text("""
        UPDATE points_of_interest
        SET amenities = COALESCE(amenities, '{}'::jsonb) || jsonb_build_object('wifi',
            CASE
                WHEN wifi_options @> '["Free Public Wifi"]'::jsonb THEN 'Free Wifi'
                WHEN wifi_options @> '["Paid Public Wifi"]'::jsonb THEN 'Paid Wifi'
                WHEN wifi_options @> '["No Public Wifi"]'::jsonb  THEN 'No Public Wifi'
            END)
        WHERE wifi_options IS NOT NULL
          AND NOT (COALESCE(amenities, '{}'::jsonb) ? 'wifi')
    """))

    # 4) Copy scalar ticket_link into ticket_links jsonb array when empty.
    op.execute(sa.text("""
        UPDATE events
        SET ticket_links = jsonb_build_array(
            jsonb_build_object('platform', 'Tickets', 'url', poi.ticket_link)
        )
        FROM points_of_interest poi
        WHERE events.poi_id = poi.id
          AND poi.ticket_link IS NOT NULL
          AND poi.ticket_link <> ''
          AND (events.ticket_links IS NULL OR events.ticket_links = '[]'::jsonb)
    """))

    # 5) Ideal For: flat list -> grouped dict (Python row-by-row).
    conn = op.get_bind()
    rows = conn.execute(sa.text(
        "SELECT id, ideal_for FROM points_of_interest WHERE ideal_for IS NOT NULL"
    )).fetchall()
    for r in rows:
        val = r.ideal_for
        if isinstance(val, dict):
            continue
        new_val = regroup_ideal_for(val)
        conn.execute(
            sa.text("UPDATE points_of_interest SET ideal_for = CAST(:v AS jsonb) WHERE id = :i"),
            {'v': json.dumps(new_val), 'i': str(r.id)},
        )

    # 6) Icon booleans backfill (SQL mirror of compute_icon_booleans).
    #    wifi_options / public_toilets / pet_options are already JSONB;
    #    no ::jsonb cast needed on those columns.
    op.execute(sa.text("""
        UPDATE points_of_interest SET
            icon_free_wifi = (
                (wifi_options @> '["Free Public Wifi"]'::jsonb) OR
                (wifi_options @> '["Free Wifi"]'::jsonb) OR
                (COALESCE(amenities, '{}'::jsonb) ->> 'wifi' = 'Free Wifi')
            ),
            icon_public_restroom = (
                public_toilets IS NOT NULL
                AND jsonb_array_length(public_toilets) > 0
                AND NOT (public_toilets = '["No Public Restroom"]'::jsonb)
                AND NOT (public_toilets = '["No"]'::jsonb)
            ),
            icon_pet_friendly = (
                pet_options IS NOT NULL
                AND jsonb_array_length(pet_options) > 0
                AND NOT (pet_options <@ '["Not Allowed","No Dogs","No Pets Allowed","No Dogs Allowed","No Cats Allowed"]'::jsonb)
            ),
            icon_wheelchair_accessible = (
                accessible_restroom = true
                OR inclusive_playground = true
                OR (accessible_parking_details IS NOT NULL
                    AND jsonb_array_length(accessible_parking_details) > 0)
                OR (jsonb_typeof(COALESCE(amenities, '{}'::jsonb) -> 'mobility_access') = 'array'
                    AND jsonb_array_length(COALESCE(amenities, '{}'::jsonb) -> 'mobility_access') > 0)
            )
    """))


def downgrade():
    # Drop trail columns first, then points_of_interest columns, in reverse order.
    op.drop_column('trails', 'access_points')
    op.drop_column('trails', 'trail_lighting')
    op.drop_column('trails', 'trail_guide_notes')
    op.drop_column('trails', 'qr_trail_guide')
    op.drop_column('trails', 'audio_guide_available')
    op.drop_column('trails', 'trailhead_signage')
    op.drop_column('trails', 'mile_markers')

    op.drop_column('points_of_interest', 'alcohol_available')
    op.drop_column('points_of_interest', 'inclusive_playground')
    op.drop_column('points_of_interest', 'playground_ada_checklist')
    op.drop_column('points_of_interest', 'playground_age_groups')
    op.drop_column('points_of_interest', 'accessible_restroom_details')
    op.drop_column('points_of_interest', 'accessible_restroom')
    op.drop_column('points_of_interest', 'accessible_parking_details')
    op.drop_column('points_of_interest', 'admin_notes')
    op.drop_column('points_of_interest', 'sponsor_level')
    op.drop_column('points_of_interest', 'is_sponsor')
    op.drop_column('points_of_interest', 'icon_wheelchair_accessible')
    op.drop_column('points_of_interest', 'icon_public_restroom')
    op.drop_column('points_of_interest', 'icon_pet_friendly')
    op.drop_column('points_of_interest', 'icon_free_wifi')
    op.drop_column('points_of_interest', 'what3words_address')
    op.drop_column('points_of_interest', 'arrival_methods')
    op.drop_column('points_of_interest', 'has_been_published')
