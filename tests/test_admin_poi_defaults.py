"""
Tests for Task 42 (city defaults) and Task 43 (coordinate persistence).
Backend tests verifying POI creation with default/custom city values
and coordinate persistence.
"""
import pytest
from conftest import create_event, create_business, create_park


class TestCityDefaults:
    """Task 42: Default city to Pittsboro, but accept custom cities."""

    def test_create_poi_with_pittsboro_city(self, admin_client):
        """Creating a POI with city='Pittsboro' persists correctly."""
        poi = create_business(admin_client, "Downtown Cafe", address_city="Pittsboro")
        assert poi["address_city"] == "Pittsboro"

    def test_create_poi_with_custom_city(self, admin_client):
        """Creating a POI with a custom city like 'Siler City' works."""
        poi = create_business(admin_client, "Country Store", address_city="Siler City")
        assert poi["address_city"] == "Siler City"

    def test_create_poi_without_city(self, admin_client):
        """Creating a POI without specifying city still works (city is optional)."""
        poi = create_business(admin_client, "No City Biz")
        # City should be None/null if not provided
        assert poi.get("address_city") is None or poi["address_city"] == ""

    def test_update_poi_city(self, admin_client):
        """City can be updated on an existing POI."""
        poi = create_business(admin_client, "City Changer", address_city="Pittsboro")
        resp = admin_client.put(
            f"/api/pois/{poi['id']}",
            json={"address_city": "Chapel Hill"},
        )
        assert resp.status_code == 200
        assert resp.json()["address_city"] == "Chapel Hill"

    def test_create_event_with_default_county_state(self, admin_client):
        """County defaults to Chatham, state to NC (already existing behavior)."""
        poi = create_event(
            admin_client, "Town Event",
            address_county="Chatham", address_state="NC"
        )
        assert poi["address_county"] == "Chatham"
        assert poi["address_state"] == "NC"


class TestCoordinatePersistence:
    """Task 43: Coordinates persist and can be updated."""

    def test_create_poi_with_coordinates(self, admin_client):
        """POI created at specific coordinates returns those coordinates."""
        poi = create_business(
            admin_client, "Coords Biz",
            location={"type": "Point", "coordinates": [-79.177397, 35.720303]},
        )
        loc = poi["location"]
        assert loc["coordinates"][0] == pytest.approx(-79.177397, abs=1e-5)
        assert loc["coordinates"][1] == pytest.approx(35.720303, abs=1e-5)

    def test_update_poi_coordinates(self, admin_client):
        """Coordinates can be updated on an existing POI."""
        poi = create_business(admin_client, "Moving Biz")
        resp = admin_client.put(
            f"/api/pois/{poi['id']}",
            json={"location": {"type": "Point", "coordinates": [-80.0, 36.0]}},
        )
        assert resp.status_code == 200
        loc = resp.json()["location"]
        assert loc["coordinates"][0] == pytest.approx(-80.0, abs=1e-5)
        assert loc["coordinates"][1] == pytest.approx(36.0, abs=1e-5)

    def test_front_door_coordinates_persist(self, admin_client):
        """Front door coordinates persist separately from main location."""
        poi = create_business(
            admin_client, "Front Door Biz",
            front_door_latitude=35.72,
            front_door_longitude=-79.18,
        )
        assert float(poi["front_door_latitude"]) == pytest.approx(35.72, abs=1e-2)
        assert float(poi["front_door_longitude"]) == pytest.approx(-79.18, abs=1e-2)
