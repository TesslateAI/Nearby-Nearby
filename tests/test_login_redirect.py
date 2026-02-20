"""Tests for login endpoint behavior - ensures 401 on bad creds returns JSON, not redirect.

Validates that POSTing invalid credentials to /api/auth/login returns a proper
401 JSON response with a "detail" field, rather than triggering a redirect loop.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app as admin_app
from app.database import get_db as admin_get_db
from app import crud, schemas


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def unauthenticated_client(db_session):
    """
    TestClient for the admin app WITHOUT auth overrides.
    Only the database dependency is overridden so the real authentication
    logic runs (login, password hashing, JWT creation).
    """
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    admin_app.dependency_overrides[admin_get_db] = _override_get_db
    with TestClient(admin_app) as c:
        yield c
    admin_app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_credentials(db_session):
    """
    Create a real admin user in the test database and return the credentials.
    Returns a dict with 'email' and 'password' keys.
    """
    email = "login-test-admin@test.com"
    password = "securepassword123"
    existing = crud.get_user_by_email(db_session, email=email)
    if not existing:
        user = schemas.UserCreate(email=email, password=password, role="admin")
        crud.create_user(db=db_session, user=user)
    return {"email": email, "password": password}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestLoginInvalidCredentials:
    """Ensure invalid login attempts return 401 JSON, never a redirect."""

    def test_login_nonexistent_user_returns_401(self, unauthenticated_client):
        """POST /api/auth/login with a nonexistent email returns 401 JSON."""
        response = unauthenticated_client.post(
            "/api/auth/login",
            data={"username": "nonexistent@test.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    def test_login_wrong_password_returns_401(self, unauthenticated_client, admin_credentials):
        """POST /api/auth/login with correct email but wrong password returns 401."""
        response = unauthenticated_client.post(
            "/api/auth/login",
            data={"username": admin_credentials["email"], "password": "totallyWrong"},
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    def test_login_empty_credentials_returns_422(self, unauthenticated_client):
        """POST /api/auth/login with missing fields returns 422 validation error."""
        response = unauthenticated_client.post("/api/auth/login", data={})
        assert response.status_code == 422

    def test_login_no_redirect_on_failure(self, unauthenticated_client):
        """Confirm the response is NOT a redirect (3xx) on bad credentials."""
        response = unauthenticated_client.post(
            "/api/auth/login",
            data={"username": "bad@test.com", "password": "bad"},
            follow_redirects=False,
        )
        # Should be 401, definitely not 3xx
        assert response.status_code == 401
        assert not (300 <= response.status_code < 400)


class TestLoginValidCredentials:
    """Ensure valid login returns a token."""

    def test_login_valid_credentials_returns_token(self, unauthenticated_client, admin_credentials):
        """POST /api/auth/login with correct creds returns 200 with access_token."""
        response = unauthenticated_client.post(
            "/api/auth/login",
            data={
                "username": admin_credentials["email"],
                "password": admin_credentials["password"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        # Token should be a non-empty string
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0

    def test_login_token_is_usable(self, unauthenticated_client, admin_credentials):
        """Token returned from login can be used to access protected endpoints."""
        # Login first
        login_resp = unauthenticated_client.post(
            "/api/auth/login",
            data={
                "username": admin_credentials["email"],
                "password": admin_credentials["password"],
            },
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]

        # Use token to access /api/auth/users/me
        me_resp = unauthenticated_client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == admin_credentials["email"]
