"""Wave 5 / Issue #63 Migration B — migrate trail_exit data into access_points.

Revision ID: w63b_001
Revises: w45b_001
Create Date: 2026-05-25

# MERGE NOTE: down_revision linearized to w45b_001 (Wave 5 #45 PR2) once
# that chain landed; the two chains are orthogonal (no overlapping columns)
# so ordering between #45 and #63 is interchangeable.

For every Trail POI that has trail_exit_latitude / trail_exit_longitude /
trailhead_exit_location set, this migration:

  1. Re-tags every ``images`` row with ``image_type='trail_exit'`` belonging
     to a Trail POI to ``image_type='access_point'``. The re-tagged rows
     are identifiable for the duration of this migration because they
     have ``image_context IS NULL`` — newly-created access-point images
     are written with an ``image_context`` set per the
     ``<TrailheadAccessPointsSection>`` component.
  2. Appends a synthetic ``Trail Exit`` entry to ``trails.access_points[]``
     for every Trail POI that has any exit coordinate or
     ``trailhead_exit_location`` set. The entry carries the just-re-tagged
     photo IDs (or an empty array if there are none).

The migration is split into two SQL passes for clarity (one for POIs with
re-tagged photos, one for POIs without). Both passes are idempotent —
guarded by a ``NOT EXISTS`` check on the existing access_points array so
running the migration twice is a no-op.

NOTE: ``ImageType.trail_exit`` stays in the Postgres enum. Postgres cannot
safely drop an enum value without recreating the type and rewriting every
dependent column — an irreversible operation. The frontend stops writing
``trail_exit`` after this migration; the enum value becomes vestigial but
harmless. Existing rows are re-tagged as part of upgrade().

Downgrade pulls the synthetic ``Trail Exit`` rows back out so a roll-back
(combined with w63c_001 down which re-adds the columns) leaves the
schema shape intact. Image re-tagging is best-effort — we cannot
distinguish migrated rows from genuinely new access_point rows that
happen to have no image_context, so downgrade leaves them as
``access_point``.
"""

from alembic import op


revision = 'w63b_001'
down_revision = 'w45b_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Re-tag every trail_exit image attached to a Trail POI. Doing this
    #    first lets the subsequent jsonb_agg pick up the photo IDs.
    op.execute("""
        UPDATE images
        SET image_type = 'access_point'
        WHERE image_type = 'trail_exit'
          AND poi_id IN (SELECT poi_id FROM trails)
    """)

    # 2a. Pass 1 — Trail POIs that have re-tagged photos. We attach the
    #     photo IDs to a synthetic 'Trail Exit' access_points entry. The
    #     NOT EXISTS guard makes the operation idempotent.
    op.execute("""
        WITH exit_photo_ids AS (
            SELECT poi_id,
                   jsonb_agg(id::text ORDER BY display_order, id) AS ids
            FROM images
            WHERE image_type = 'access_point'
              AND image_context IS NULL
              AND poi_id IN (
                  SELECT poi_id FROM trails
                  WHERE trail_exit_latitude IS NOT NULL
                     OR trail_exit_longitude IS NOT NULL
                     OR trailhead_exit_location IS NOT NULL
              )
            GROUP BY poi_id
        )
        UPDATE trails t
        SET access_points = COALESCE(t.access_points, '[]'::jsonb) || jsonb_build_array(
            jsonb_build_object(
                'name', 'Trail Exit',
                'description', '',
                'latitude', t.trail_exit_latitude,
                'longitude', t.trail_exit_longitude,
                'what3words_address', '',
                'notes', '',
                'photo_ids', ep.ids
            )
        )
        FROM exit_photo_ids ep
        WHERE t.poi_id = ep.poi_id
          AND NOT EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(t.access_points, '[]'::jsonb)) AS e
              WHERE e->>'name' = 'Trail Exit'
          );
    """)

    # 2b. Pass 2 — Trail POIs that have exit coordinates but no associated
    #     photos. Same idempotency guard. ``photo_ids`` is an empty array.
    op.execute("""
        UPDATE trails t
        SET access_points = COALESCE(t.access_points, '[]'::jsonb) || jsonb_build_array(
            jsonb_build_object(
                'name', 'Trail Exit',
                'description', '',
                'latitude', t.trail_exit_latitude,
                'longitude', t.trail_exit_longitude,
                'what3words_address', '',
                'notes', '',
                'photo_ids', '[]'::jsonb
            )
        )
        WHERE (
                  t.trail_exit_latitude IS NOT NULL
               OR t.trail_exit_longitude IS NOT NULL
               OR t.trailhead_exit_location IS NOT NULL
              )
          AND NOT EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(t.access_points, '[]'::jsonb)) AS e
              WHERE e->>'name' = 'Trail Exit'
          );
    """)


def downgrade() -> None:
    # Pull synthetic 'Trail Exit' entries back out. If a real user later
    # named a genuine access point exactly 'Trail Exit', this downgrade
    # would also remove that — judged acceptable because downgrade is
    # informational only and column-restore via w63c_001 down would
    # also be a manual-recovery operation.
    op.execute("""
        UPDATE trails
        SET access_points = (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM jsonb_array_elements(access_points) AS elem
            WHERE elem->>'name' <> 'Trail Exit'
        )
        WHERE jsonb_typeof(access_points) = 'array';
    """)
    # Image re-tagging is intentionally NOT reversed. We cannot
    # distinguish images that started life as 'trail_exit' from images
    # that were created post-migration as genuine access_point uploads.
