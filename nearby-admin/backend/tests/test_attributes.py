import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

def test_create_attribute(client: TestClient, db_session: Session):
    """
    Tests creating a new attribute.
    """
    attribute_payload = {
        "name": "Live Music",
        "type": "ENTERTAINMENT",
        "applicable_to": ["BUSINESS", "EVENT"],
        "is_active": True,
        "sort_order": 1
    }
    
    response = client.post("/api/attributes/", json=attribute_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Live Music"
    assert data["type"] == "ENTERTAINMENT"
    assert data["applicable_to"] == ["BUSINESS", "EVENT"]
    assert data["is_active"] == True
    assert "id" in data

def test_get_attributes(client: TestClient, db_session: Session):
    """
    Tests retrieving attributes with filters.
    """
    # Create some test attributes
    client.post("/api/attributes/", json={
        "name": "Credit Card",
        "type": "PAYMENT_METHOD",
        "applicable_to": ["BUSINESS"],
        "is_active": True
    })
    
    client.post("/api/attributes/", json={
        "name": "Family Friendly",
        "type": "IDEAL_FOR",
        "applicable_to": ["BUSINESS", "PARK"],
        "is_active": True
    })
    
    # Get all attributes
    response = client.get("/api/attributes/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    
    # Filter by type
    response = client.get("/api/attributes/?attribute_type=PAYMENT_METHOD")
    assert response.status_code == 200
    data = response.json()
    assert all(attr["type"] == "PAYMENT_METHOD" for attr in data)
    
    # Filter by applicable POI type
    response = client.get("/api/attributes/?applicable_to=BUSINESS")
    assert response.status_code == 200
    data = response.json()
    assert all("BUSINESS" in attr["applicable_to"] for attr in data)

def test_get_attributes_by_type(client: TestClient, db_session: Session):
    """
    Tests getting attributes by specific type.
    """
    # Create test attribute
    client.post("/api/attributes/", json={
        "name": "Cash",
        "type": "PAYMENT_METHOD",
        "applicable_to": ["BUSINESS"],
        "is_active": True
    })
    
    response = client.get("/api/attributes/by-type/PAYMENT_METHOD")
    assert response.status_code == 200
    data = response.json()
    assert all(attr["type"] == "PAYMENT_METHOD" for attr in data)

def test_get_attributes_for_poi_type(client: TestClient, db_session: Session):
    """
    Tests getting attributes that apply to a specific POI type.
    """
    # Create test attributes
    client.post("/api/attributes/", json={
        "name": "Hiking",
        "type": "ACTIVITY",
        "applicable_to": ["TRAIL", "PARK"],
        "is_active": True
    })
    
    client.post("/api/attributes/", json={
        "name": "Restaurant",
        "type": "BUSINESS_TYPE",
        "applicable_to": ["BUSINESS"],
        "is_active": True
    })
    
    response = client.get("/api/attributes/for-poi-type/TRAIL")
    assert response.status_code == 200
    data = response.json()
    assert all("TRAIL" in attr["applicable_to"] for attr in data)
    assert any(attr["name"] == "Hiking" for attr in data)

def test_update_attribute(client: TestClient, db_session: Session):
    """
    Tests updating an attribute.
    """
    # Create attribute
    create_response = client.post("/api/attributes/", json={
        "name": "Original Name",
        "type": "AMENITY",
        "applicable_to": ["BUSINESS"],
        "is_active": True
    })
    assert create_response.status_code == 201
    attribute_id = create_response.json()["id"]
    
    # Update attribute
    update_payload = {
        "name": "Updated Name",
        "is_active": False
    }
    
    response = client.put(f"/api/attributes/{attribute_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["is_active"] == False

def test_delete_attribute(client: TestClient, db_session: Session):
    """
    Tests deleting an attribute.
    """
    # Create attribute
    create_response = client.post("/api/attributes/", json={
        "name": "To Delete",
        "type": "AMENITY",
        "applicable_to": ["BUSINESS"],
        "is_active": True
    })
    assert create_response.status_code == 201
    attribute_id = create_response.json()["id"]
    
    # Delete attribute
    response = client.delete(f"/api/attributes/{attribute_id}")
    assert response.status_code == 200
    
    # Verify it's gone
    get_response = client.get(f"/api/attributes/{attribute_id}")
    assert get_response.status_code == 404

def test_get_attribute_hierarchy(client: TestClient, db_session: Session):
    """
    Tests getting attributes in hierarchy structure.
    """
    # Create parent attribute
    parent_response = client.post("/api/attributes/", json={
        "name": "Payment Methods",
        "type": "PAYMENT_METHOD",
        "applicable_to": ["BUSINESS"],
        "is_active": True
    })
    parent_id = parent_response.json()["id"]
    
    # Create child attribute
    client.post("/api/attributes/", json={
        "name": "Credit Card",
        "type": "PAYMENT_METHOD",
        "applicable_to": ["BUSINESS"],
        "parent_id": parent_id,
        "is_active": True
    })
    
    response = client.get("/api/attributes/hierarchy?attribute_type=PAYMENT_METHOD")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0 