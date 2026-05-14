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


def _pg_quote(s: str) -> str:
    """Escape a string for inline use in a SQL VALUES clause."""
    return "'" + s.replace("'", "''") + "'"


def upgrade():
    # Column adds are idempotent via IF NOT EXISTS so a previously-failed
    # partial migration attempt doesn't wedge the next retry.
    op.execute(sa.text("""
        ALTER TABLE points_of_interest
            ADD COLUMN IF NOT EXISTS has_been_published BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS arrival_methods JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS what3words_address VARCHAR(100),
            ADD COLUMN IF NOT EXISTS icon_free_wifi BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS icon_pet_friendly BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS icon_public_restroom BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS icon_wheelchair_accessible BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS is_sponsor BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS sponsor_level VARCHAR(30),
            ADD COLUMN IF NOT EXISTS admin_notes TEXT,
            ADD COLUMN IF NOT EXISTS accessible_parking_details JSONB,
            ADD COLUMN IF NOT EXISTS accessible_restroom BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS accessible_restroom_details JSONB,
            ADD COLUMN IF NOT EXISTS playground_age_groups JSONB,
            ADD COLUMN IF NOT EXISTS playground_ada_checklist JSONB,
            ADD COLUMN IF NOT EXISTS inclusive_playground BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS alcohol_available VARCHAR(50)
    """))
    # park_entry_notes SKIPPED — already exists on the model/table.

    op.execute(sa.text("""
        ALTER TABLE trails
            ADD COLUMN IF NOT EXISTS mile_markers BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS trailhead_signage BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS audio_guide_available BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS qr_trail_guide BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS trail_guide_notes TEXT,
            ADD COLUMN IF NOT EXISTS trail_lighting VARCHAR(30),
            ADD COLUMN IF NOT EXISTS access_points JSONB
    """))

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

    # 5) Ideal For: flat list -> grouped dict.
    # Previously a Python row-by-row UPDATE loop — too slow for prod (exceeded
    # ECS health check grace period). Now one set-based SQL statement, with
    # the group map inlined as a VALUES table.
    values_rows = ",\n              ".join(
        f"({_pg_quote(item)}, {_pg_quote(grp)})"
        for item, grp in IDEAL_FOR_GROUP_MAP.items()
    )
    op.execute(sa.text(f"""
        WITH group_map(item, grp) AS (
            VALUES
              {values_rows}
        ),
        expanded AS (
            SELECT p.id, elem.value AS item,
                   COALESCE(gm.grp, '_legacy') AS grp
            FROM points_of_interest p
            CROSS JOIN LATERAL jsonb_array_elements_text(p.ideal_for) AS elem(value)
            LEFT JOIN group_map gm ON gm.item = elem.value
            WHERE p.ideal_for IS NOT NULL
              AND jsonb_typeof(p.ideal_for) = 'array'
        ),
        grouped AS (
            SELECT id,
                   jsonb_build_object(
                       'atmosphere',      COALESCE(jsonb_agg(item) FILTER (WHERE grp = 'atmosphere'),      '[]'::jsonb),
                       'age_group',       COALESCE(jsonb_agg(item) FILTER (WHERE grp = 'age_group'),       '[]'::jsonb),
                       'social_settings', COALESCE(jsonb_agg(item) FILTER (WHERE grp = 'social_settings'), '[]'::jsonb),
                       'local_special',   COALESCE(jsonb_agg(item) FILTER (WHERE grp = 'local_special'),   '[]'::jsonb),
                       '_legacy',         COALESCE(jsonb_agg(item) FILTER (WHERE grp = '_legacy'),         '[]'::jsonb)
                   ) AS regrouped
            FROM expanded
            GROUP BY id
        )
        UPDATE points_of_interest p
        SET ideal_for = g.regrouped
        FROM grouped g
        WHERE p.id = g.id
    """))

    # 6) Icon booleans backfill (SQL mirror of compute_icon_booleans).
    # Each expression is wrapped in COALESCE(..., false) because JSONB key
    # access returns NULL for missing keys, which can propagate through AND
    # into a NULL boolean — and these columns are NOT NULL.
    op.execute(sa.text("""
        UPDATE points_of_interest SET
            icon_free_wifi = COALESCE(
                (wifi_options @> '["Free Public Wifi"]'::jsonb) OR
                (wifi_options @> '["Free Wifi"]'::jsonb) OR
                (COALESCE(amenities, '{}'::jsonb) ->> 'wifi' = 'Free Wifi'),
                false
            ),
            icon_public_restroom = COALESCE(
                public_toilets IS NOT NULL
                AND jsonb_array_length(public_toilets) > 0
                AND NOT (public_toilets = '["No Public Restroom"]'::jsonb)
                AND NOT (public_toilets = '["No"]'::jsonb),
                false
            ),
            icon_pet_friendly = COALESCE(
                pet_options IS NOT NULL
                AND jsonb_array_length(pet_options) > 0
                AND NOT (pet_options <@ '["Not Allowed","No Dogs","No Pets Allowed","No Dogs Allowed","No Cats Allowed"]'::jsonb),
                false
            ),
            icon_wheelchair_accessible = COALESCE(
                accessible_restroom = true
                OR inclusive_playground = true
                OR (accessible_parking_details IS NOT NULL
                    AND jsonb_array_length(accessible_parking_details) > 0)
                OR (jsonb_typeof(COALESCE(amenities, '{}'::jsonb) -> 'mobility_access') = 'array'
                    AND jsonb_array_length(COALESCE(amenities, '{}'::jsonb) -> 'mobility_access') > 0),
                false
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
