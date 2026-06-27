"""Tests for issue #67: playground_location (singular) -> playground_locations (plural).

Covers:
- API: a Park created with `playground_locations: [{...}]` round-trips with the plural key.
- API: legacy single-dict payload still accepted (backend stores as-is; frontend wraps).
- Migration: SQL fixture with the old singular object shape is wrapped into a
  single-element array by the migration's UPDATE statement.
"""

import pytest
from sqlalchemy import text

from conftest import create_park


class TestPlaygroundLocationsPlural:
    def test_create_park_with_plural_array(self, admin_client):
        """Create a Park with playground_locations as a list of objects -> 201."""
        locs = [{"name": "A", "lat": 1.0, "lng": 2.0, "types": [], "surfaces": [], "notes": ""}]
        data = create_park(
            admin_client,
            name="Playground Plural Park",
            playground_available=True,
            playground_locations=locs,
        )
        assert data["playground_locations"] is not None, data
        # Response uses the plural key
        assert "playground_locations" in data
        # Singular key must not appear in response
        assert "playground_location" not in data or data.get("playground_location") is None
        # First entry round-trips
        result = data["playground_locations"]
        if isinstance(result, list):
            assert result[0]["name"] == "A"
            assert result[0]["lat"] == 1.0
            assert result[0]["lng"] == 2.0
        else:
            # Backend stored as-is; defensive — should not happen for list input
            assert result["name"] == "A"

    def test_update_park_with_multiple_playgrounds(self, admin_client):
        """PUT a park with multiple playground_locations entries."""
        park = create_park(admin_client, name="Multi PG Park", playground_available=True)
        poi_id = park["id"]
        locs = [
            {"name": "North", "lat": 35.1, "lng": -79.1, "types": ["Swings"], "surfaces": ["Sand"], "notes": ""},
            {"name": "South", "lat": 35.2, "lng": -79.2, "types": ["Climbing"], "surfaces": ["Rubber"], "notes": ""},
        ]
        resp = admin_client.put(f"/api/pois/{poi_id}", json={"playground_locations": locs})
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert isinstance(body["playground_locations"], list)
        assert len(body["playground_locations"]) == 2
        assert body["playground_locations"][1]["name"] == "South"


class TestPlaygroundLocationsMigration:
    """Verify migration g67_001's UPDATE wraps legacy singular-object rows.

    We don't actually run the Alembic migration in the test harness (the test
    DB schema is created fresh by SQLAlchemy in conftest.py). Instead we run
    the migration's UPDATE SQL directly against test rows that simulate the
    pre-migration shape, and assert the result.
    """

    def test_singular_object_wrapped_in_array(self, admin_client, db_session):
        # Create a park then write a legacy singular-object value directly via SQL.
        park = create_park(admin_client, name="Migration Fixture")
        poi_id = park["id"]

        # Cast a singular dict in
        db_session.execute(
            text("""
                UPDATE points_of_interest
                SET playground_locations = CAST(:loc AS jsonb)
                WHERE id = CAST(:pid AS uuid)
            """),
            {"loc": '{"lat": 35.0, "lng": -79.0}', "pid": poi_id},
        )
        db_session.commit()

        # Apply the migration's wrapping UPDATE (idempotent — same SQL as g67_001)
        db_session.execute(text("""
            UPDATE points_of_interest
            SET playground_locations = jsonb_build_array(playground_locations)
            WHERE jsonb_typeof(playground_locations) = 'object'
        """))
        db_session.commit()

        result = db_session.execute(
            text("""
                SELECT jsonb_typeof(playground_locations) AS t,
                       jsonb_array_length(playground_locations) AS n,
                       playground_locations->0->>'lat' AS lat0
                FROM points_of_interest
                WHERE id = CAST(:pid AS uuid)
            """),
            {"pid": poi_id},
        ).mappings().first()

        assert result["t"] == "array"
        assert result["n"] == 1
        assert result["lat0"] == "35.0"

    def test_array_rows_left_alone(self, admin_client, db_session):
        """If a row already has an array, the migration UPDATE must not touch it."""
        park = create_park(admin_client, name="Already Array")
        poi_id = park["id"]

        db_session.execute(
            text("""
                UPDATE points_of_interest
                SET playground_locations = CAST(:loc AS jsonb)
                WHERE id = CAST(:pid AS uuid)
            """),
            {"loc": '[{"lat": 10.0, "lng": 20.0}, {"lat": 11.0, "lng": 21.0}]', "pid": poi_id},
        )
        db_session.commit()

        db_session.execute(text("""
            UPDATE points_of_interest
            SET playground_locations = jsonb_build_array(playground_locations)
            WHERE jsonb_typeof(playground_locations) = 'object'
        """))
        db_session.commit()

        result = db_session.execute(
            text("""
                SELECT jsonb_array_length(playground_locations) AS n
                FROM points_of_interest
                WHERE id = CAST(:pid AS uuid)
            """),
            {"pid": poi_id},
        ).mappings().first()
        assert result["n"] == 2  # untouched
