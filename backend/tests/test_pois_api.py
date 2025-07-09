import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Note: No need to import from app directly, fixtures handle it.

def test_create_and_read_poi(client: TestClient, db_session: Session):
    """
    Tests creating a POI and then retrieving it to ensure correctness.
    """
    # 1. Create a "BUSINESS" type POI
    business_payload = {
        "name": "Test Cafe",
        "description_long": "A cozy place for coffee.",
        "poi_type": "BUSINESS",
        "location": {
            "type": "Point",
            "coordinates": [-75.4, 35.9]
        },
        "business": {
            "listing_tier": "free",
            "price_range": "$$"
        }
    }
    
    response = client.post("/api/pois/", json=business_payload)
    
    # Assertions for the creation
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == business_payload["name"]
    assert data["poi_type"] == "BUSINESS"
    assert data["business"]["price_range"] == "$$"
    assert "id" in data
    poi_id = data["id"]

    # 2. Read the created POI by its ID
    response = client.get(f"/api/pois/{poi_id}")
    
    # Assertions for reading the specific POI
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "Test Cafe"
    assert data["location"]["coordinates"] == [-75.4, 35.9]

def test_read_pois_list(client: TestClient, db_session: Session):
    """
    Tests retrieving a list of all POIs.
    """
    # Create a POI first
    client.post("/api/pois/", json={
        "name": "Another Test POI",
        "poi_type": "PARK",
        "location": {"type": "Point", "coordinates": [-76, 36]},
        "park": {"drone_usage_policy": "Allowed with permit"}
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
        "poi_type": "EVENT",
        "location": {"type": "Point", "coordinates": [-77, 37]},
        "event": {"start_datetime": "2025-12-25T18:00:00Z"}
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

def test_create_poi_with_missing_subtype_data(client: TestClient, db_session: Session):
    """
    Tests that creating a POI without required subtype data fails.
    """
    poi_payload = {
        "name": "Test POI",
        "poi_type": "BUSINESS",
        "location": {"type": "Point", "coordinates": [-78, 38]}
        # Missing business data
    }
    
    response = client.post("/api/pois/", json=poi_payload)
    # FastAPI returns 422 for validation errors, which is correct
    assert response.status_code == 422
    # The error detail structure may vary, so just check that there's an error
    assert "detail" in response.json()

def test_create_trail_poi(client: TestClient, db_session: Session):
    """
    Tests creating a TRAIL type POI.
    """
    trail_payload = {
        "name": "Mountain Trail",
        "description_long": "A beautiful mountain trail",
        "poi_type": "TRAIL",
        "location": {"type": "Point", "coordinates": [-79, 39]},
        "trail": {
            "length_text": "2.5 miles",
            "difficulty": "moderate",
            "route_type": "loop"
        }
    }
    
    response = client.post("/api/pois/", json=trail_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Mountain Trail"
    assert data["poi_type"] == "TRAIL"
    assert data["trail"]["length_text"] == "2.5 miles"
    assert data["trail"]["difficulty"] == "moderate"

def test_create_poi_with_amenities(client: TestClient, db_session: Session):
    """
    Tests creating a POI with JSONB amenities field.
    """
    poi_payload = {
        "name": "Test POI with Amenities",
        "poi_type": "BUSINESS",
        "location": {"type": "Point", "coordinates": [-80, 40]},
        "business": {"listing_tier": "free"},
        "amenities": {
            "payment_methods": ["Cash", "Credit Card"],
            "ideal_for": ["Families", "Couples"]
        }
    }
    
    response = client.post("/api/pois/", json=poi_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["amenities"]["payment_methods"] == ["Cash", "Credit Card"]
    assert data["amenities"]["ideal_for"] == ["Families", "Couples"]

def test_poi_relationships(client: TestClient, db_session: Session):
    """
    Tests creating and managing POI relationships.
    """
    # Create two POIs
    poi1_response = client.post("/api/pois/", json={
        "name": "Event Venue",
        "poi_type": "BUSINESS",
        "location": {"type": "Point", "coordinates": [-81, 41]},
        "business": {"listing_tier": "free"}
    })
    assert poi1_response.status_code == 201
    poi1_id = poi1_response.json()["id"]
    
    poi2_response = client.post("/api/pois/", json={
        "name": "Summer Festival",
        "poi_type": "EVENT",
        "location": {"type": "Point", "coordinates": [-81, 41]},
        "event": {"start_datetime": "2025-06-15T18:00:00Z"}
    })
    assert poi2_response.status_code == 201
    poi2_id = poi2_response.json()["id"]
    
    # Create a relationship
    relationship_response = client.post("/api/relationships/", params={
        "source_poi_id": poi2_id,
        "target_poi_id": poi1_id,
        "relationship_type": "venue"
    })
    assert relationship_response.status_code == 201
    
    # Get relationships for the event
    relationships_response = client.get(f"/api/relationships/{poi2_id}")
    assert relationships_response.status_code == 200
    relationships = relationships_response.json()
    assert len(relationships) == 1
    assert relationships[0]["relationship_type"] == "venue"
    
    # Get related POIs
    related_response = client.get(f"/api/pois/{poi2_id}/related")
    assert related_response.status_code == 200
    related_pois = related_response.json()
    assert len(related_pois) == 1
    assert related_pois[0]["name"] == "Event Venue"
