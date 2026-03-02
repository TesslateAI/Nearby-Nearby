"""
Phase 7: Test duplicate event prevention.

Creating an event with the same venue_poi_id + start_datetime + name (case-insensitive)
should return HTTP 409. Different combinations should be allowed.
"""

import pytest
from conftest import create_event, create_business


class TestDuplicateEventPrevention:
    """Duplicate event check on create: same venue + date + name = 409."""

    def test_duplicate_event_returns_409(self, admin_client):
        """Creating duplicate event (same venue + date + name) should return 409."""
        venue = create_business(admin_client, name="Town Hall")
        venue_id = venue["id"]

        # Create first event
        create_event(
            admin_client,
            name="Summer Gala",
            event={
                "start_datetime": "2026-07-04T18:00:00Z",
                "venue_poi_id": venue_id,
            },
        )

        # Try to create duplicate
        resp = admin_client.post(
            "/api/pois/",
            json={
                "name": "Summer Gala",
                "poi_type": "EVENT",
                "location": {"type": "Point", "coordinates": [-79.3, 35.6]},
                "event": {
                    "start_datetime": "2026-07-04T18:00:00Z",
                    "venue_poi_id": venue_id,
                },
            },
        )
        assert resp.status_code == 409, f"Expected 409, got {resp.status_code}: {resp.text}"

    def test_duplicate_check_case_insensitive(self, admin_client):
        """Name matching should be case-insensitive."""
        venue = create_business(admin_client, name="Community Center")
        venue_id = venue["id"]

        create_event(
            admin_client,
            name="summer gala",
            event={
                "start_datetime": "2026-07-04T18:00:00Z",
                "venue_poi_id": venue_id,
            },
        )

        resp = admin_client.post(
            "/api/pois/",
            json={
                "name": "SUMMER GALA",
                "poi_type": "EVENT",
                "location": {"type": "Point", "coordinates": [-79.3, 35.6]},
                "event": {
                    "start_datetime": "2026-07-04T18:00:00Z",
                    "venue_poi_id": venue_id,
                },
            },
        )
        assert resp.status_code == 409

    def test_different_venue_same_date_name_allowed(self, admin_client):
        """Different venue + same date + same name should be allowed."""
        venue1 = create_business(admin_client, name="Venue A")
        venue2 = create_business(admin_client, name="Venue B")

        create_event(
            admin_client,
            name="Music Night",
            event={
                "start_datetime": "2026-08-01T20:00:00Z",
                "venue_poi_id": venue1["id"],
            },
        )

        data = create_event(
            admin_client,
            name="Music Night",
            event={
                "start_datetime": "2026-08-01T20:00:00Z",
                "venue_poi_id": venue2["id"],
            },
        )
        assert data["name"] == "Music Night"

    def test_same_venue_different_date_allowed(self, admin_client):
        """Same venue + different date + same name should be allowed."""
        venue = create_business(admin_client, name="Theater")
        venue_id = venue["id"]

        create_event(
            admin_client,
            name="Show Night",
            event={
                "start_datetime": "2026-08-01T20:00:00Z",
                "venue_poi_id": venue_id,
            },
        )

        data = create_event(
            admin_client,
            name="Show Night",
            event={
                "start_datetime": "2026-08-02T20:00:00Z",
                "venue_poi_id": venue_id,
            },
        )
        assert data["name"] == "Show Night"

    def test_same_venue_same_date_different_name_allowed(self, admin_client):
        """Same venue + same date + different name should be allowed."""
        venue = create_business(admin_client, name="Arena")
        venue_id = venue["id"]

        create_event(
            admin_client,
            name="Morning Yoga",
            event={
                "start_datetime": "2026-08-01T08:00:00Z",
                "venue_poi_id": venue_id,
            },
        )

        data = create_event(
            admin_client,
            name="Evening Concert",
            event={
                "start_datetime": "2026-08-01T08:00:00Z",
                "venue_poi_id": venue_id,
            },
        )
        assert data["name"] == "Evening Concert"

    def test_no_venue_skips_check(self, admin_client):
        """Events without venue_poi_id should skip duplicate check."""
        create_event(
            admin_client,
            name="Virtual Event",
            event={"start_datetime": "2026-09-01T10:00:00Z"},
        )

        # Same name + date but no venue — should be allowed
        data = create_event(
            admin_client,
            name="Virtual Event",
            event={"start_datetime": "2026-09-01T10:00:00Z"},
        )
        assert data["name"] == "Virtual Event"
