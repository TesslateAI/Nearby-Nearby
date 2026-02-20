"""
Tests for Task 45: Venue data inheritance for events.
Events should have venue_poi_id (FK) and venue_inheritance (JSONB)
to pull data from a linked venue POI with per-section controls.
"""
import uuid
import pytest
from conftest import create_event, create_business, create_park


class TestVenueInheritance:
    """Task 45: venue_poi_id and venue_inheritance on events."""

    def test_create_event_with_venue_poi_id(self, admin_client):
        """Create event linked to a venue POI via venue_poi_id."""
        venue = create_business(admin_client, "The Venue Hall")
        event = create_event(
            admin_client, "Concert at Venue",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "venue_poi_id": venue["id"],
            },
        )
        assert event["event"]["venue_poi_id"] == venue["id"]

    def test_venue_inheritance_config_stored(self, admin_client):
        """Venue inheritance config (per-section) is stored and returned."""
        venue = create_business(admin_client, "Config Venue")
        inheritance_config = {
            "parking": {"mode": "use_as_is"},
            "restrooms": {"mode": "use_and_add", "event_additions": "Portable restrooms near stage"},
            "playground": {"mode": "do_not_use"},
            "accessibility": {"mode": "use_as_is"},
            "pet_policy": {"mode": "use_as_is"},
            "drone_policy": {"mode": "use_as_is"},
        }
        event = create_event(
            admin_client, "Configured Event",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "venue_poi_id": venue["id"],
                "venue_inheritance": inheritance_config,
            },
        )
        vi = event["event"]["venue_inheritance"]
        assert vi["parking"]["mode"] == "use_as_is"
        assert vi["restrooms"]["mode"] == "use_and_add"
        assert vi["playground"]["mode"] == "do_not_use"

    def test_event_overrides_do_not_mutate_venue(self, admin_client):
        """Event overrides stored separately; venue POI stays unchanged."""
        venue = create_business(
            admin_client, "Immutable Venue",
            parking_notes="Venue has 50 spots",
        )
        event = create_event(
            admin_client, "Override Event",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "venue_poi_id": venue["id"],
            },
            parking_notes="Event adds valet parking",
        )
        # Venue should remain unchanged
        resp = admin_client.get(f"/api/pois/{venue['id']}")
        assert resp.json()["parking_notes"] == "Venue has 50 spots"
        # Event has its own parking notes
        assert event["parking_notes"] == "Event adds valet parking"

    def test_venue_poi_id_must_reference_valid_poi(self, admin_client):
        """venue_poi_id referencing a non-existent POI should fail or be rejected."""
        fake_id = str(uuid.uuid4())
        # This should fail because the FK constraint won't be satisfied
        resp = admin_client.post(
            "/api/pois/",
            json={
                "name": "Bad Venue Event",
                "poi_type": "EVENT",
                "location": {"type": "Point", "coordinates": [-79.3, 35.6]},
                "event": {
                    "start_datetime": "2026-06-15T18:00:00Z",
                    "venue_poi_id": fake_id,
                },
            },
        )
        # Should fail with 4xx or 5xx due to FK violation
        assert resp.status_code >= 400

    def test_venue_poi_id_nullable(self, admin_client):
        """Events without a venue_poi_id work normally (field is nullable)."""
        event = create_event(admin_client, "No Venue Event")
        assert event["event"].get("venue_poi_id") is None

    def test_venue_inheritance_nullable(self, admin_client):
        """Events without venue_inheritance work normally."""
        event = create_event(admin_client, "No Inheritance Event")
        assert event["event"].get("venue_inheritance") is None

    def test_park_as_venue(self, admin_client):
        """A park can be used as a venue for an event."""
        park = create_park(admin_client, "Festival Park")
        event = create_event(
            admin_client, "Park Festival",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "venue_poi_id": park["id"],
            },
        )
        assert event["event"]["venue_poi_id"] == park["id"]
