"""
Tests for Task 49: Payphone lat/long for events.
Base POI already has payphone_location (single) and payphone_locations (array).
These tests verify they work for EVENT type POIs.
"""
import pytest
from conftest import create_event


class TestEventPayphone:
    """Task 49: Events can store payphone locations."""

    def test_event_payphone_location_stored(self, admin_client):
        """Events can store a single payphone lat/lng."""
        poi = create_event(
            admin_client, "Payphone Event",
            payphone_location={"lat": 35.72, "lng": -79.18},
        )
        assert poi["payphone_location"] is not None
        assert poi["payphone_location"]["lat"] == pytest.approx(35.72, abs=1e-2)
        assert poi["payphone_location"]["lng"] == pytest.approx(-79.18, abs=1e-2)

    def test_event_multiple_payphone_locations(self, admin_client):
        """Events can store multiple payphone locations."""
        poi = create_event(
            admin_client, "Multi Payphone Event",
            payphone_locations=[
                {"lat": 35.72, "lng": -79.18, "description": "Near entrance"},
                {"lat": 35.73, "lng": -79.19, "description": "By parking lot"},
            ],
        )
        assert poi["payphone_locations"] is not None
        assert len(poi["payphone_locations"]) == 2
        assert poi["payphone_locations"][0]["description"] == "Near entrance"

    def test_event_payphone_update(self, admin_client):
        """Payphone location can be updated on events."""
        poi = create_event(admin_client, "Update Payphone Event")
        resp = admin_client.put(
            f"/api/pois/{poi['id']}",
            json={
                "payphone_location": {"lat": 35.80, "lng": -79.20},
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["payphone_location"]["lat"] == pytest.approx(35.80, abs=1e-2)

    def test_event_payphone_in_get_response(self, admin_client):
        """Payphone data returned in GET response for events."""
        poi = create_event(
            admin_client, "Get Payphone Event",
            payphone_location={"lat": 35.72, "lng": -79.18},
        )
        resp = admin_client.get(f"/api/pois/{poi['id']}")
        assert resp.status_code == 200
        assert resp.json()["payphone_location"] is not None
