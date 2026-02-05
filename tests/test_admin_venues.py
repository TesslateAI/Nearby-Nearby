"""Tests for venue list and venue-data-for-event endpoints."""

import uuid
import pytest
from conftest import create_business, create_park, create_event, create_trail


class TestVenueList:
    def test_venue_list_only_business_park(self, admin_client):
        """Only BUSINESS and PARK in venue list."""
        biz = create_business(admin_client, name="Venue List Biz")
        park = create_park(admin_client, name="Venue List Park")
        trail = create_trail(admin_client, name="Venue List Trail")
        evt = create_event(admin_client, name="Venue List Event")

        resp = admin_client.get("/api/pois/venues/list")
        assert resp.status_code == 200
        venues = resp.json()
        venue_names = [v["name"] for v in venues]
        assert "Venue List Biz" in venue_names
        assert "Venue List Park" in venue_names
        assert "Venue List Trail" not in venue_names
        assert "Venue List Event" not in venue_names

    def test_venue_list_search(self, admin_client):
        """Search within venue list."""
        create_business(admin_client, name="Searchable Venue Cafe")
        create_business(admin_client, name="Another Place")

        resp = admin_client.get("/api/pois/venues/list", params={"search": "Searchable Venue"})
        assert resp.status_code == 200
        venues = resp.json()
        assert len(venues) >= 1
        assert venues[0]["name"] == "Searchable Venue Cafe"


class TestVenueData:
    def test_venue_data_returns_all_fields(self, admin_client):
        """All venue-copyable fields present."""
        biz = create_business(
            admin_client,
            name="Venue Data Biz",
            address_full="123 Main St, Pittsboro, NC",
            address_street="123 Main St",
            address_city="Pittsboro",
            address_state="NC",
            address_zip="27312",
            phone_number="919-555-1234",
            email="venue@example.com",
            website_url="https://venuebiz.com",
            parking_types=["Lot"],
            parking_notes="Free lot behind building",
            wheelchair_accessible=["Entrance"],
            wheelchair_details="Ramp at front",
            public_toilets=["Indoor"],
            toilet_description="ADA compliant",
            hours={"monday": {"open": "09:00", "close": "17:00"}},
        )

        resp = admin_client.get(f"/api/pois/{biz['id']}/venue-data")
        assert resp.status_code == 200
        data = resp.json()
        assert data["venue_name"] == "Venue Data Biz"
        assert data["venue_type"] == "BUSINESS"
        assert data["address_city"] == "Pittsboro"
        assert data["phone_number"] == "919-555-1234"
        assert data["parking_types"] == ["Lot"]
        assert data["wheelchair_accessible"] == ["Entrance"]
        assert data["public_toilets"] == ["Indoor"]
        assert data["hours"]["monday"]["open"] == "09:00"

    def test_venue_data_non_venue_type_400(self, admin_client):
        """EVENT POI → 400."""
        evt = create_event(admin_client, name="Not a Venue Event")
        resp = admin_client.get(f"/api/pois/{evt['id']}/venue-data")
        assert resp.status_code == 400

    def test_venue_data_missing_poi_404(self, admin_client):
        """Bad UUID → 404."""
        fake_id = str(uuid.uuid4())
        resp = admin_client.get(f"/api/pois/{fake_id}/venue-data")
        assert resp.status_code == 404
