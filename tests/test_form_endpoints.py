"""
Integration tests for the 5 public form endpoints.

Tests exercise:
- Happy path (valid submission)
- Validation errors (missing required fields, oversized input)
- Duplicate handling (waitlist email uniqueness)
- File upload validation (feedback endpoint)

These tests use the app_client fixture which swaps sys.modules
so nearby-app's FastAPI app is loaded.  The forms DB dependency
(get_forms_db) is overridden to use the same test session.
"""

import io
import pytest


# ---------------------------------------------------------------------------
# Fixture: app_client with forms DB override
# ---------------------------------------------------------------------------
@pytest.fixture(scope="function")
def forms_client(db_session):
    """
    TestClient for nearby-app with get_forms_db overridden to the test session.
    Similar to app_client but also overrides the forms DB dependency.
    """
    import os
    import sys

    MONOREPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    ADMIN_BACKEND = os.path.join(MONOREPO_ROOT, "nearby-admin", "backend")
    APP_BACKEND = os.path.join(MONOREPO_ROOT, "nearby-app", "backend")
    TEST_DATABASE_URL = os.environ.get(
        "DATABASE_URL",
        "postgresql://test:test@localhost:5434/test_nearby",
    )

    _prev_path = sys.path.copy()

    if ADMIN_BACKEND in sys.path:
        sys.path.remove(ADMIN_BACKEND)
    if APP_BACKEND not in sys.path:
        sys.path.insert(0, APP_BACKEND)

    admin_modules = {}
    for mod_name in list(sys.modules.keys()):
        if mod_name == "app" or mod_name.startswith("app."):
            admin_modules[mod_name] = sys.modules.pop(mod_name)

    try:
        os.environ["DATABASE_URL"] = TEST_DATABASE_URL
        os.environ["FORMS_DATABASE_URL"] = ""  # fallback to DATABASE_URL

        # Create form tables in the test DB (they aren't in AdminBase.metadata)
        from sqlalchemy import text as sa_text
        db_session.execute(sa_text("""
            CREATE TABLE IF NOT EXISTS waitlist (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        db_session.execute(sa_text("""
            CREATE TABLE IF NOT EXISTS community_interest (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100),
                email VARCHAR(255),
                location VARCHAR(200) NOT NULL,
                role JSONB,
                role_other VARCHAR(100),
                why TEXT,
                how_heard VARCHAR(500),
                anything_else TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        db_session.execute(sa_text("""
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        db_session.execute(sa_text("""
            CREATE TABLE IF NOT EXISTS feedback_submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255),
                feedback TEXT NOT NULL,
                file_urls JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        db_session.execute(sa_text("""
            CREATE TABLE IF NOT EXISTS business_claims (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                business_name VARCHAR(200) NOT NULL,
                contact_name VARCHAR(100) NOT NULL,
                contact_phone VARCHAR(20) NOT NULL,
                contact_email VARCHAR(255) NOT NULL,
                business_address VARCHAR(500) NOT NULL,
                how_heard VARCHAR(500),
                anything_else TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        db_session.commit()

        from app.main import app as nearby_app
        from app.database import get_db as app_get_db, get_forms_db
        from fastapi.testclient import TestClient

        def _override_db():
            try:
                yield db_session
            finally:
                pass

        nearby_app.dependency_overrides[app_get_db] = _override_db
        nearby_app.dependency_overrides[get_forms_db] = _override_db

        with TestClient(nearby_app, raise_server_exceptions=False) as c:
            yield c

        nearby_app.dependency_overrides.clear()

    finally:
        for mod_name in list(sys.modules.keys()):
            if mod_name == "app" or mod_name.startswith("app."):
                del sys.modules[mod_name]
        sys.modules.update(admin_modules)
        sys.path = _prev_path


# ===================================================================
# 1. WAITLIST
# ===================================================================
class TestWaitlist:
    def test_add_email(self, forms_client):
        resp = forms_client.post("/api/waitlist", json={"email": "test@example.com"})
        assert resp.status_code == 201
        assert "message" in resp.json()

    def test_duplicate_email(self, forms_client):
        forms_client.post("/api/waitlist", json={"email": "dup@example.com"})
        resp = forms_client.post("/api/waitlist", json={"email": "dup@example.com"})
        assert resp.status_code == 409

    def test_invalid_email(self, forms_client):
        resp = forms_client.post("/api/waitlist", json={"email": "not-an-email"})
        assert resp.status_code == 422

    def test_missing_email(self, forms_client):
        resp = forms_client.post("/api/waitlist", json={})
        assert resp.status_code == 422

    def test_count(self, forms_client):
        forms_client.post("/api/waitlist", json={"email": "count@example.com"})
        resp = forms_client.get("/api/waitlist/count")
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1


# ===================================================================
# 2. COMMUNITY INTEREST
# ===================================================================
class TestCommunityInterest:
    def test_minimal_submission(self, forms_client):
        resp = forms_client.post(
            "/api/community-interest",
            json={"location": "Pittsboro, Chatham County, NC"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["location"] == "Pittsboro, Chatham County, NC"
        assert "id" in body

    def test_full_submission(self, forms_client):
        resp = forms_client.post(
            "/api/community-interest",
            json={
                "name": "Jane Doe",
                "email": "jane@example.com",
                "location": "Siler City, Chatham County, NC",
                "role": ["Resident", "Business Owner"],
                "role_other": None,
                "why": "We need better local discovery.",
                "how_heard": "Instagram",
                "anything_else": "Excited!",
            },
        )
        assert resp.status_code == 201

    def test_missing_location(self, forms_client):
        resp = forms_client.post(
            "/api/community-interest",
            json={"name": "No Location"},
        )
        assert resp.status_code == 422

    def test_location_too_long(self, forms_client):
        resp = forms_client.post(
            "/api/community-interest",
            json={"location": "x" * 201},
        )
        assert resp.status_code == 422


# ===================================================================
# 3. CONTACT
# ===================================================================
class TestContact:
    def test_submit(self, forms_client):
        resp = forms_client.post(
            "/api/contact",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "message": "Hello, I have a question about the platform.",
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "id" in body
        assert body["message"] == "Thank you for reaching out!"

    def test_message_too_short(self, forms_client):
        resp = forms_client.post(
            "/api/contact",
            json={
                "name": "Short",
                "email": "short@example.com",
                "message": "Hi",
            },
        )
        assert resp.status_code == 422

    def test_missing_name(self, forms_client):
        resp = forms_client.post(
            "/api/contact",
            json={"email": "no@name.com", "message": "This is a valid message."},
        )
        assert resp.status_code == 422

    def test_missing_email(self, forms_client):
        resp = forms_client.post(
            "/api/contact",
            json={"name": "No Email", "message": "This is a valid message."},
        )
        assert resp.status_code == 422


# ===================================================================
# 4. FEEDBACK
# ===================================================================
class TestFeedback:
    def test_text_only(self, forms_client):
        resp = forms_client.post(
            "/api/feedback",
            data={"feedback": "This is great feedback about the platform!"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "id" in body

    def test_with_email(self, forms_client):
        resp = forms_client.post(
            "/api/feedback",
            data={
                "feedback": "Some detailed feedback here please.",
                "email": "feedback@example.com",
            },
        )
        assert resp.status_code == 201

    def test_feedback_too_short(self, forms_client):
        resp = forms_client.post(
            "/api/feedback",
            data={"feedback": "Short"},
        )
        assert resp.status_code == 422

    def test_invalid_file_type(self, forms_client):
        bad_file = io.BytesIO(b"not an image")
        resp = forms_client.post(
            "/api/feedback",
            data={"feedback": "Feedback with bad file attached here."},
            files=[("files", ("evil.exe", bad_file, "application/octet-stream"))],
        )
        assert resp.status_code == 422
        assert "unsupported type" in resp.json()["detail"].lower()

    def test_file_too_large(self, forms_client):
        # 11 MB file
        big_file = io.BytesIO(b"\x00" * (11 * 1024 * 1024))
        resp = forms_client.post(
            "/api/feedback",
            data={"feedback": "Feedback with oversized image file."},
            files=[("files", ("big.jpg", big_file, "image/jpeg"))],
        )
        assert resp.status_code == 422
        assert "10 mb" in resp.json()["detail"].lower()


# ===================================================================
# 5. BUSINESS CLAIMS
# ===================================================================
class TestBusinessClaims:
    def test_submit(self, forms_client):
        resp = forms_client.post(
            "/api/business-claims",
            json={
                "business_name": "Joe's Coffee",
                "contact_name": "Joe Smith",
                "contact_phone": "919-555-0100",
                "contact_email": "joe@coffee.com",
                "business_address": "123 Main St, Pittsboro, NC 27312",
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["business_name"] == "Joe's Coffee"
        assert "id" in body

    def test_full_submission(self, forms_client):
        resp = forms_client.post(
            "/api/business-claims",
            json={
                "business_name": "Trail Mix Cafe",
                "contact_name": "Sara Lee",
                "contact_phone": "919-555-0200",
                "contact_email": "sara@trailmix.com",
                "business_address": "456 Oak Ave, Siler City, NC",
                "how_heard": "Facebook ad",
                "anything_else": "We also do catering!",
            },
        )
        assert resp.status_code == 201

    def test_missing_required_fields(self, forms_client):
        resp = forms_client.post(
            "/api/business-claims",
            json={"business_name": "Incomplete"},
        )
        assert resp.status_code == 422

    def test_invalid_email(self, forms_client):
        resp = forms_client.post(
            "/api/business-claims",
            json={
                "business_name": "Bad Email Biz",
                "contact_name": "Test",
                "contact_phone": "123",
                "contact_email": "not-an-email",
                "business_address": "Somewhere",
            },
        )
        assert resp.status_code == 422

    def test_name_too_long(self, forms_client):
        resp = forms_client.post(
            "/api/business-claims",
            json={
                "business_name": "x" * 201,
                "contact_name": "Test",
                "contact_phone": "123",
                "contact_email": "ok@ok.com",
                "business_address": "Somewhere",
            },
        )
        assert resp.status_code == 422
