import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Note: No need to import from app directly, fixtures handle it.

def test_create_and_read_poi(client: TestClient, db_session: Session):
    """
    Tests creating a POI and then retrieving it to ensure correctness.
    """
    # 1. Create a "business" type POI
    business_payload = {
        "name": "Test Cafe",
        "description": "A cozy place for coffee.",
        "poi_type": "business",
        "location": {
            "address_line1": "123 Test St",
            "city": "Testville",
            "state_abbr": "TS",
            "postal_code": "12345",
            "coordinates": {"type": "Point", "coordinates": [-75.4, 35.9]}
        },
        "business": {
            "price_range": "$$"
        }
    }
    
    response = client.post("/api/pois/", json=business_payload)
    
    # Assertions for the creation
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == business_payload["name"]
    assert data["poi_type"] == "business"
    assert data["business"]["price_range"] == "$$"
    assert "id" in data
    assert "slug" in data and data["slug"] == "test-cafe"
    poi_id = data["id"]

    # 2. Read the created POI by its ID
    response = client.get(f"/api/pois/{poi_id}")
    
    # Assertions for reading the specific POI
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "Test Cafe"
    assert data["location"]["city"] == "Testville"
    assert data["location"]["coordinates"]["coordinates"] == [-75.4, 35.9]

def test_read_pois_list(client: TestClient, db_session: Session):
    """
    Tests retrieving a list of all POIs.
    """
    # Create a POI first
    client.post("/api/pois/", json={
        "name": "Another Test POI",
        "poi_type": "outdoors",
        "location": { "coordinates": {"type": "Point", "coordinates": [-76, 36]} },
        "outdoors": { "outdoor_specific_type": "park" }
    })

    response = client.get("/api/pois/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["name"] == "Another Test POI"

def test_delete_poi(client: TestClient, db_session: Session):
    """
    Tests creating a POI and then deleting it.
    """
    # 1. Create a POI to delete
    poi_payload = {
        "name": "To Be Deleted",
        "poi_type": "event",
        "location": { "coordinates": {"type": "Point", "coordinates": [-77, 37]} },
        "event": { "start_datetime": "2025-12-25T18:00:00Z" }
    }
    create_response = client.post("/api/pois/", json=poi_payload)
    assert create_response.status_code == 201
    poi_id = create_response.json()["id"]

    # 2. Delete the POI
    delete_response = client.delete(f"/api/pois/{poi_id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["name"] == "To Be Deleted"

    # 3. Verify it's gone
    get_response = client.get(f"/api/pois/{poi_id}")
    assert get_response.status_code == 404


def test_create_poi_with_existing_slug(client: TestClient, db_session: Session):
    """
    Tests that creating a POI with a slug that already exists fails.
    """
    poi_payload = {
        "name": "Unique Name",
        "poi_type": "business",
        "location": { "coordinates": {"type": "Point", "coordinates": [-78, 38]} },
        "business": {}
    }
    
    # Create it the first time - should succeed
    response1 = client.post("/api/pois/", json=poi_payload)
    assert response1.status_code == 201

    # Try to create it again with the same name/slug - should fail
    response2 = client.post("/api/pois/", json=poi_payload)
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"]
