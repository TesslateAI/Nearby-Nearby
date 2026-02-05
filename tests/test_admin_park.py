"""Tests for Park POI CRUD operations via admin API."""

import pytest
from conftest import create_park


class TestCreateParkMinimal:
    def test_create_park_minimal(self, admin_client):
        """Minimal park with park: {}."""
        data = create_park(admin_client, name="Minimal Park")
        assert data["name"] == "Minimal Park"
        assert data["poi_type"] == "PARK"
        assert data["park"] is not None
        assert data["publication_status"] == "draft"

    def test_create_park_with_drone_policy(self, admin_client):
        """Park with drone_usage_policy in subtype."""
        data = create_park(
            admin_client,
            name="Drone Park",
            park={"drone_usage_policy": "Allowed with permit"},
        )
        assert data["park"]["drone_usage_policy"] == "Allowed with permit"


class TestCreateParkAllFields:
    def test_create_park_all_fields(self, admin_client):
        """All base + park-specific fields."""
        payload = {
            "name": "Full Park",
            "poi_type": "PARK",
            "location": {"type": "Point", "coordinates": [-79.1, 35.9]},
            "description_long": "A beautiful state park with hiking trails and lake access.",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "cost": "$5",
            "pricing_details": "Day pass, annual passes available",
            "status": "Fully Open",
            "is_verified": True,
            "parking_types": ["Lot", "Overflow"],
            "parking_notes": "Main lot fills up by 10am on weekends",
            "wheelchair_accessible": ["Paved Trails", "Restroom"],
            "public_toilets": ["Indoor", "Portable"],
            "pet_options": ["Leashed Dogs"],
            "pet_policy": "Dogs must be on 6-foot leash at all times",
            "available_for_rent": True,
            "rental_info": "Picnic shelters available",
            "rental_pricing": "$50/day",
            "playground_available": True,
            "playground_types": ["Swings", "Climbing"],
            "playground_surface_types": ["Rubber", "Sand"],
            "playground_notes": "Ages 5-12 playground near entrance",
            "playground_location": {"lat": 35.9, "lng": -79.1},
            "natural_features": ["Lake", "Waterfall", "Old Growth Forest"],
            "outdoor_types": ["State Park", "Recreation Area"],
            "things_to_do": ["Hiking", "Swimming", "Fishing", "Kayaking"],
            "birding_wildlife": "Great Blue Herons nest near the lake in spring",
            "night_sky_viewing": "Excellent dark sky viewing from hilltop",
            "hunting_fishing_allowed": "seasonal",
            "hunting_types": ["Deer", "Turkey"],
            "fishing_allowed": "catch_release",
            "fishing_types": ["Bass", "Catfish"],
            "licenses_required": ["NC Fishing License"],
            "hunting_fishing_info": "Season runs Oct-Jan",
            "facilities_options": ["Picnic Tables", "Grills", "Boat Ramp"],
            "payphone_location": {"lat": 35.9, "lng": -79.1},
            "payphone_locations": [{"lat": 35.9, "lng": -79.1, "description": "Near entrance"}],
            "park_entry_notes": "Enter through main gate on Hwy 64",
            "hours": {"monday": {"open": "07:00", "close": "21:00"}},
            "downloadable_maps": [{"name": "Trail Map", "url": "https://park.com/map.pdf"}],
            "history_paragraph": "Established in 1935 as part of the CCC program.",
            "key_facilities": ["Boat Ramp", "Swimming Beach"],
            "park": {"drone_usage_policy": "Not allowed in wildlife areas"},
        }

        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["name"] == "Full Park"
        assert data["poi_type"] == "PARK"
        assert data["natural_features"] == ["Lake", "Waterfall", "Old Growth Forest"]
        assert data["playground_available"] is True
        assert data["hunting_fishing_allowed"] == "seasonal"


class TestCreateParkOutdoorFields:
    def test_create_park_outdoor_fields(self, admin_client):
        """Test outdoor-specific fields."""
        data = create_park(
            admin_client,
            name="Outdoor Park",
            natural_features=["River", "Cliffs"],
            outdoor_types=["County Park"],
            things_to_do=["Rock Climbing", "Swimming"],
            birding_wildlife="Eagles spotted regularly",
            night_sky_viewing="Moderate light pollution",
        )
        assert data["natural_features"] == ["River", "Cliffs"]
        assert data["things_to_do"] == ["Rock Climbing", "Swimming"]
        assert data["birding_wildlife"] == "Eagles spotted regularly"
        assert data["night_sky_viewing"] == "Moderate light pollution"


class TestCreateParkHuntingFishing:
    def test_create_park_hunting_fishing(self, admin_client):
        """Test hunting/fishing fields."""
        data = create_park(
            admin_client,
            name="Hunting Park",
            hunting_fishing_allowed="year_round",
            hunting_types=["Deer", "Rabbit"],
            fishing_allowed="catch_keep",
            fishing_types=["Trout", "Bass"],
            licenses_required=["NC Hunting License", "NC Fishing License"],
            hunting_fishing_info="Check with ranger station for current regulations",
        )
        assert data["hunting_fishing_allowed"] == "year_round"
        assert data["hunting_types"] == ["Deer", "Rabbit"]
        assert data["fishing_allowed"] == "catch_keep"
        assert data["licenses_required"] == ["NC Hunting License", "NC Fishing License"]


class TestCreateParkFacilities:
    def test_create_park_facilities(self, admin_client):
        """Test facilities fields."""
        data = create_park(
            admin_client,
            name="Facilities Park",
            facilities_options=["Picnic Tables", "Grills", "Restrooms"],
            payphone_location={"lat": 35.9, "lng": -79.1},
            payphone_locations=[{"lat": 35.9, "lng": -79.1, "description": "Entrance"}],
            park_entry_notes="Entrance fee required on weekends",
        )
        assert data["facilities_options"] == ["Picnic Tables", "Grills", "Restrooms"]
        assert data["park_entry_notes"] == "Entrance fee required on weekends"
        assert data["payphone_location"]["lat"] == 35.9
