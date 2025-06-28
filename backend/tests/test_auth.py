import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid

def test_create_user(client: TestClient, db_session: Session):
    """
    Tests creating a new user.
    """
    user_payload = {
        "email": f"test{uuid.uuid4()}@example.com",
        "password": "testpassword123",
        "role": "admin"
    }
    
    response = client.post("/api/auth/users/", json=user_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == user_payload["email"]
    assert data["role"] == "admin"
    assert "id" in data
    assert "password" not in data  # Password should not be returned

def test_create_duplicate_user(client: TestClient, db_session: Session):
    """
    Tests that creating a user with duplicate email fails.
    """
    unique_email = f"duplicate{uuid.uuid4()}@example.com"
    user_payload = {
        "email": unique_email,
        "password": "testpassword123",
        "role": "admin"
    }
    
    # Create first user
    response = client.post("/api/auth/users/", json=user_payload)
    assert response.status_code == 201
    
    # Try to create duplicate
    response = client.post("/api/auth/users/", json=user_payload)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

def test_login_success(client: TestClient, db_session: Session):
    """
    Tests successful login.
    """
    # Create a user first
    user_payload = {
        "email": f"login{uuid.uuid4()}@example.com",
        "password": "testpassword123",
        "role": "admin"
    }
    client.post("/api/auth/users/", json=user_payload)
    
    # Login
    login_data = {
        "username": user_payload["email"],  # OAuth2 form uses 'username' field
        "password": "testpassword123"
    }
    
    response = client.post("/api/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client: TestClient, db_session: Session):
    """
    Tests login with invalid credentials.
    """
    login_data = {
        "username": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    
    response = client.post("/api/auth/login", data=login_data)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_current_user_with_token(client: TestClient, db_session: Session):
    """
    Tests getting current user with valid token.
    """
    # Create a user first
    user_payload = {
        "email": f"token{uuid.uuid4()}@example.com",
        "password": "testpassword123",
        "role": "admin"
    }
    client.post("/api/auth/users/", json=user_payload)
    
    # Login to get token
    login_data = {
        "username": user_payload["email"],
        "password": "testpassword123"
    }
    login_response = client.post("/api/auth/login", data=login_data)
    token = login_response.json()["access_token"]
    
    # Get current user with token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user_payload["email"]

def test_get_current_user_without_token(client: TestClient, db_session: Session):
    """
    Tests getting current user without token fails.
    """
    response = client.get("/api/auth/users/me")
    # FastAPI returns 403 for missing credentials, which is correct
    assert response.status_code == 403 