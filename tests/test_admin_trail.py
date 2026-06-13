"""Tests for Trail POI CRUD operations via admin API."""

import pytest
from conftest import create_trail


class TestCreateTrailMinimal:
    def test_create_trail_minimal(self, admin_client):
        """Minimal trail with trail: {}."""
        data = create_trail(admin_client, name="Minimal Trail")
        assert data["name"] == "Minimal Trail"
        assert data["poi_type"] == "TRAIL"
        assert data["trail"] is not None
        assert data["publication_status"] == "draft"


class TestCreateTrailAllFields:
    def test_create_trail_all_subtype_fields(self, admin_client):
        """All 18 trail subtype fields."""
        payload = {
            "name": "Full Trail",
            "poi_type": "TRAIL",
            "location": {"type": "Point", "coordinates": [-79.2, 35.7]},
            "description_long": "A scenic 5-mile loop through old growth forest.",
            "address_city": "Siler City",
            "cost": "$0",
            "trail": {
                "length_text": "5.2 miles",
                "length_segments": [
                    {"name": "Main Loop", "length": "3.5 miles"},
                    {"name": "Summit Spur", "length": "1.7 miles"},
                ],
                "difficulty": "moderate",
                "difficulty_description": "Some steep sections with rocky terrain",
                "route_type": "loop",
                "trailhead_location": {"lat": 35.70, "lng": -79.20},
                "trailhead_latitude": 35.7000,
                "trailhead_longitude": -79.2000,
                # trailhead_entrance_photo / trailhead_exit_photo /
                # trailhead_exit_location / trail_exit_latitude /
                # trail_exit_longitude dropped by migration w63c_001.
                # Exit data now lives inside access_points[] entries.
                "access_points": [
                    {
                        "name": "Trail Exit",
                        "description": "",
                        "latitude": 35.7100,
                        "longitude": -79.2100,
                        "what3words_address": "",
                        "notes": "",
                        "photo_ids": [],
                    }
                ],
                "trail_markings": "Blue blazes throughout. Yellow blazes at summit spur junction.",
                "trailhead_access_details": "Gravel parking lot off of Hwy 64",
                "downloadable_trail_map": "https://example.com/trail-map.pdf",
                "trail_surfaces": ["Dirt", "Gravel", "Rock"],
                "trail_conditions": ["Muddy after rain", "Fallen trees"],
                "trail_experiences": ["Scenic Views", "Wildlife", "Waterfall"],
            },
        }

        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 201, resp.text
        data = resp.json()
        trail = data["trail"]
        assert trail["length_text"] == "5.2 miles"
        assert trail["difficulty"] == "moderate"
        assert trail["route_type"] == "loop"
        assert len(trail["length_segments"]) == 2
        assert trail["trail_surfaces"] == ["Dirt", "Gravel", "Rock"]
        assert trail["trail_experiences"] == ["Scenic Views", "Wildlife", "Waterfall"]


class TestCreateTrailCoordinates:
    def test_create_trail_trailhead_coordinates(self, admin_client):
        """Test trailhead_location (JSONB), trailhead_latitude, trailhead_longitude."""
        data = create_trail(
            admin_client,
            name="Coord Trail",
            trail={
                "trailhead_location": {"lat": 35.72, "lng": -79.18},
                "trailhead_latitude": 35.7200,
                "trailhead_longitude": -79.1800,
            },
        )
        trail = data["trail"]
        assert trail["trailhead_location"]["lat"] == 35.72
        assert float(trail["trailhead_latitude"]) == pytest.approx(35.72, abs=0.001)
        assert float(trail["trailhead_longitude"]) == pytest.approx(-79.18, abs=0.001)

    def test_create_trail_exit_coordinates(self, admin_client):
        """Test exit coordinates via access_points[] (post w63c_001 schema)."""
        data = create_trail(
            admin_client,
            name="Exit Coord Trail",
            trail={
                "access_points": [
                    {
                        "name": "Trail Exit",
                        "description": "",
                        "latitude": 35.7300,
                        "longitude": -79.1900,
                        "what3words_address": "",
                        "notes": "",
                        "photo_ids": [],
                    }
                ],
            },
        )
        trail = data["trail"]
        assert isinstance(trail["access_points"], list)
        assert len(trail["access_points"]) == 1
        exit_ap = trail["access_points"][0]
        assert exit_ap["name"] == "Trail Exit"
        assert float(exit_ap["latitude"]) == pytest.approx(35.73, abs=0.001)
        assert float(exit_ap["longitude"]) == pytest.approx(-79.19, abs=0.001)


class TestCreateTrailSurfaceExperience:
    def test_create_trail_surfaces_and_conditions(self, admin_client):
        """Test trail surface and condition lists."""
        data = create_trail(
            admin_client,
            name="Surface Trail",
            trail={
                "trail_surfaces": ["Paved", "Boardwalk"],
                "trail_conditions": ["Icy in winter"],
                "trail_markings": "White diamond blazes",
            },
        )
        trail = data["trail"]
        assert trail["trail_surfaces"] == ["Paved", "Boardwalk"]
        assert trail["trail_conditions"] == ["Icy in winter"]
        assert trail["trail_markings"] == "White diamond blazes"
