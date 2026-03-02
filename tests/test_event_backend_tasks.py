"""
TDD tests for Event Backend Tasks 134-149, 153, 157.

These tests are written FIRST and should FAIL until the implementation is done.
They cover:
  - Task 134: Event Status System (event_status column on events table)
  - Task 135: Cancel/Postpone Behavior (cancellation_paragraph, contact_organizer_toggle)
  - Task 136: Reschedule (clone + link via POST /pois/{id}/reschedule)
  - Task 137: Primary Display Category
  - Task 138: Extended Organizer (email, phone, website, social_media, poi_link)
  - Task 139: Cost Type + Multi-entry Ticket Links
  - Task 140: Event Sponsors (JSONB)
  - Task 147: Articles & Mentions (already on base POI, just needs to work for events)
  - Task 148: Community Impact & History (already on base POI, just needs to work for events)
  - Task 153: Suggest an Event endpoint (POST /api/event-suggestions)
  - Task 157: Date Change Guard when status is "Updated Date and/or Time"
"""

import pytest
from conftest import create_event, create_business


# ============================================================================
# Task 134: Event Status System
# ============================================================================
class TestEventStatus:
    """event_status column defaults to 'Scheduled'."""

    def test_default_event_status(self, admin_client):
        """Creating an event without explicit status defaults to 'Scheduled'."""
        data = create_event(admin_client, name="Status Default Event")
        assert data["event"]["event_status"] == "Scheduled"

    def test_set_event_status_on_create(self, admin_client):
        """Can set event_status explicitly on create."""
        data = create_event(
            admin_client,
            name="Moved Online Event",
            event={
                "start_datetime": "2026-07-01T10:00:00Z",
                "event_status": "Moved Online",
            },
        )
        assert data["event"]["event_status"] == "Moved Online"

    def test_update_event_status(self, admin_client):
        """Can update event_status via PUT."""
        data = create_event(admin_client, name="Update Status Event")
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={"event": {"event_status": "Canceled"}},
        )
        assert resp.status_code == 200
        assert resp.json()["event"]["event_status"] == "Canceled"


# ============================================================================
# Task 135: Cancel/Postpone Behavior
# ============================================================================
class TestCancelPostponeBehavior:
    """Cancellation paragraph and contact organizer toggle."""

    def test_canceled_with_paragraph(self, admin_client):
        """Set cancellation_paragraph when canceling."""
        data = create_event(admin_client, name="Cancel Test Event")
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={
                "event": {
                    "event_status": "Canceled",
                    "cancellation_paragraph": "<p>This event has been canceled due to weather.</p>",
                    "contact_organizer_toggle": True,
                },
            },
        )
        assert resp.status_code == 200
        event = resp.json()["event"]
        assert event["event_status"] == "Canceled"
        assert "canceled due to weather" in event["cancellation_paragraph"]
        assert event["contact_organizer_toggle"] is True

    def test_postponed_with_paragraph(self, admin_client):
        """Set cancellation_paragraph when postponing."""
        data = create_event(admin_client, name="Postpone Test Event")
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={
                "event": {
                    "event_status": "Postponed",
                    "cancellation_paragraph": "<p>New date TBD.</p>",
                },
            },
        )
        assert resp.status_code == 200
        event = resp.json()["event"]
        assert event["event_status"] == "Postponed"
        assert event["cancellation_paragraph"] == "<p>New date TBD.</p>"


# ============================================================================
# Task 136: Reschedule (Clone + Link)
# ============================================================================
class TestReschedule:
    """POST /pois/{poi_id}/reschedule clones the event with new dates."""

    def test_reschedule_creates_new_event(self, admin_client):
        """Rescheduling creates a new event linked to the original."""
        original = create_event(
            admin_client,
            name="Original Event",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "end_datetime": "2026-06-15T22:00:00Z",
                "organizer_name": "Test Org",
            },
        )
        original_id = original["id"]

        resp = admin_client.post(
            f"/api/pois/{original_id}/reschedule",
            json={
                "new_start_datetime": "2026-07-20T18:00:00Z",
                "new_end_datetime": "2026-07-20T22:00:00Z",
            },
        )
        assert resp.status_code == 201, resp.text
        new_event = resp.json()

        # New event has different ID
        assert new_event["id"] != original_id

        # New event has correct dates
        assert "2026-07-20" in new_event["event"]["start_datetime"]

        # New event references original
        assert new_event["event"]["rescheduled_from_event_id"] == original_id

        # New event is Scheduled
        assert new_event["event"]["event_status"] == "Scheduled"

        # Original is now Rescheduled with link to new
        original_resp = admin_client.get(f"/api/pois/{original_id}")
        assert original_resp.status_code == 200
        original_updated = original_resp.json()
        assert original_updated["event"]["event_status"] == "Rescheduled"
        assert original_updated["event"]["new_event_link"] == str(new_event["id"])

        # Name is preserved
        assert new_event["name"] == "Original Event"

        # Organizer is preserved
        assert new_event["event"]["organizer_name"] == "Test Org"


# ============================================================================
# Task 137: Primary Display Category
# ============================================================================
class TestPrimaryDisplayCategory:
    """primary_display_category string field on events."""

    def test_set_primary_display_category(self, admin_client):
        data = create_event(
            admin_client,
            name="Categorized Event",
            event={
                "start_datetime": "2026-08-01T10:00:00Z",
                "primary_display_category": "Festival",
            },
        )
        assert data["event"]["primary_display_category"] == "Festival"

    def test_update_primary_display_category(self, admin_client):
        data = create_event(admin_client, name="Cat Update Event")
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={"event": {"primary_display_category": "Concert"}},
        )
        assert resp.status_code == 200
        assert resp.json()["event"]["primary_display_category"] == "Concert"


# ============================================================================
# Task 138: Extended Organizer
# ============================================================================
class TestExtendedOrganizer:
    """Extended organizer fields: email, phone, website, social_media, poi_link."""

    def test_create_event_with_full_organizer(self, admin_client):
        data = create_event(
            admin_client,
            name="Full Organizer Event",
            event={
                "start_datetime": "2026-09-01T10:00:00Z",
                "organizer_name": "Arts Council",
                "organizer_email": "info@artscouncil.org",
                "organizer_phone": "919-555-0100",
                "organizer_website": "https://artscouncil.org",
                "organizer_social_media": {
                    "instagram": "@artscouncil",
                    "facebook": "artscouncil",
                },
            },
        )
        event = data["event"]
        assert event["organizer_name"] == "Arts Council"
        assert event["organizer_email"] == "info@artscouncil.org"
        assert event["organizer_phone"] == "919-555-0100"
        assert event["organizer_website"] == "https://artscouncil.org"
        assert event["organizer_social_media"]["instagram"] == "@artscouncil"

    def test_organizer_poi_link(self, admin_client):
        """Link organizer to an existing POI (e.g., a business)."""
        biz = create_business(admin_client, name="Organizer Biz")
        biz_id = biz["id"]

        data = create_event(
            admin_client,
            name="POI-Linked Organizer Event",
            event={
                "start_datetime": "2026-09-15T10:00:00Z",
                "organizer_name": "Organizer Biz",
                "organizer_poi_id": biz_id,
            },
        )
        assert data["event"]["organizer_poi_id"] == biz_id


# ============================================================================
# Task 139: Cost Type + Multi-entry Ticket Links
# ============================================================================
class TestCostAndTicketing:
    """cost_type enum and ticket_links multi-entry JSONB."""

    def test_free_event(self, admin_client):
        data = create_event(
            admin_client,
            name="Free Event",
            event={
                "start_datetime": "2026-10-01T10:00:00Z",
                "cost_type": "free",
            },
        )
        assert data["event"]["cost_type"] == "free"

    def test_range_cost_with_ticket_links(self, admin_client):
        data = create_event(
            admin_client,
            name="Paid Range Event",
            cost="$25-$75",
            event={
                "start_datetime": "2026-10-15T10:00:00Z",
                "cost_type": "range",
                "ticket_links": [
                    {"name": "General Admission", "url": "https://tickets.example.com/ga"},
                    {"name": "VIP", "url": "https://tickets.example.com/vip"},
                ],
            },
        )
        assert data["event"]["cost_type"] == "range"
        assert len(data["event"]["ticket_links"]) == 2
        assert data["event"]["ticket_links"][0]["name"] == "General Admission"
        assert data["event"]["ticket_links"][1]["url"] == "https://tickets.example.com/vip"

    def test_single_price_event(self, admin_client):
        data = create_event(
            admin_client,
            name="Single Price Event",
            cost="$50",
            event={
                "start_datetime": "2026-11-01T10:00:00Z",
                "cost_type": "single_price",
            },
        )
        assert data["event"]["cost_type"] == "single_price"


# ============================================================================
# Task 140: Event Sponsors
# ============================================================================
class TestEventSponsors:
    """sponsors JSONB field on events."""

    def test_create_event_with_sponsors(self, admin_client):
        data = create_event(
            admin_client,
            name="Sponsored Event",
            event={
                "start_datetime": "2026-12-01T10:00:00Z",
                "sponsors": [
                    {"name": "Acme Corp", "url": "https://acme.com"},
                    {"name": "Local Bank", "url": "https://localbank.com"},
                ],
            },
        )
        sponsors = data["event"]["sponsors"]
        assert len(sponsors) == 2
        assert sponsors[0]["name"] == "Acme Corp"
        assert sponsors[1]["url"] == "https://localbank.com"

    def test_update_event_sponsors(self, admin_client):
        data = create_event(admin_client, name="Sponsors Update Event")
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={
                "event": {
                    "sponsors": [
                        {"name": "New Sponsor", "url": "https://newsponsor.com"},
                    ],
                },
            },
        )
        assert resp.status_code == 200
        sponsors = resp.json()["event"]["sponsors"]
        assert len(sponsors) == 1
        assert sponsors[0]["name"] == "New Sponsor"


# ============================================================================
# Task 147: Articles & Mentions (base POI fields should work for Events)
# ============================================================================
class TestArticlesAndMentionsForEvents:
    """article_links on base POI should save/load for EVENT type."""

    def test_event_with_article_links(self, admin_client):
        data = create_event(
            admin_client,
            name="Event With Articles",
            article_links=[
                {"title": "Local Paper Feature", "url": "https://paper.com/event"},
            ],
        )
        assert data["article_links"] is not None
        assert len(data["article_links"]) == 1
        assert data["article_links"][0]["title"] == "Local Paper Feature"

    def test_update_event_article_links(self, admin_client):
        data = create_event(admin_client, name="Articles Update Event")
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={
                "article_links": [
                    {"title": "Blog Post", "url": "https://blog.com/event-review"},
                ],
            },
        )
        assert resp.status_code == 200
        assert resp.json()["article_links"][0]["title"] == "Blog Post"


# ============================================================================
# Task 148: Community Impact & History for Events
# ============================================================================
class TestCommunityImpactForEvents:
    """community_impact and history_paragraph should work for Events."""

    def test_event_with_community_impact(self, admin_client):
        data = create_event(
            admin_client,
            name="Community Event",
            community_impact="This event supports local youth programs.",
        )
        assert data["community_impact"] == "This event supports local youth programs."

    def test_event_with_history_paragraph(self, admin_client):
        data = create_event(
            admin_client,
            name="Historic Event",
            history_paragraph="<p>Running since 1985.</p>",
        )
        assert data["history_paragraph"] == "<p>Running since 1985.</p>"


# ============================================================================
# Task 153: Suggest an Event (POST /api/event-suggestions)
# ============================================================================
class TestSuggestEvent:
    """Public endpoint to suggest an event via nearby-app."""

    @pytest.fixture(scope="function")
    def forms_client(self, db_session):
        """TestClient for nearby-app with forms DB override (for event suggestions)."""
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
            os.environ["FORMS_DATABASE_URL"] = ""

            # Create event_suggestions table in test DB
            from sqlalchemy import text as sa_text
            db_session.execute(sa_text("""
                CREATE TABLE IF NOT EXISTS event_suggestions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_name VARCHAR(255) NOT NULL,
                    event_description TEXT,
                    event_date VARCHAR(100),
                    event_location VARCHAR(255),
                    organizer_name VARCHAR(100),
                    organizer_email VARCHAR(255) NOT NULL,
                    organizer_phone VARCHAR(50),
                    additional_info TEXT,
                    status VARCHAR(50) DEFAULT 'pending',
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

    def test_suggest_event_minimal(self, forms_client):
        """Minimal suggestion with event_name and organizer_email."""
        resp = forms_client.post(
            "/api/event-suggestions",
            json={
                "event_name": "Summer Music Fest",
                "organizer_email": "organizer@example.com",
            },
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert "id" in data
        assert "created_at" in data

    def test_suggest_event_full(self, forms_client):
        """Full suggestion with all fields."""
        resp = forms_client.post(
            "/api/event-suggestions",
            json={
                "event_name": "Community Cook-Off",
                "event_description": "Annual cooking competition open to all.",
                "event_date": "July 4, 2026",
                "event_location": "Downtown Pittsboro",
                "organizer_name": "Jane Smith",
                "organizer_email": "jane@example.com",
                "organizer_phone": "919-555-0199",
                "additional_info": "Expecting 200+ attendees.",
            },
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert "id" in data

    def test_suggest_event_missing_required(self, forms_client):
        """Missing event_name should fail validation."""
        resp = forms_client.post(
            "/api/event-suggestions",
            json={
                "organizer_email": "test@example.com",
            },
        )
        assert resp.status_code == 422

    def test_suggest_event_missing_email(self, forms_client):
        """Missing organizer_email should fail validation."""
        resp = forms_client.post(
            "/api/event-suggestions",
            json={
                "event_name": "No Email Event",
            },
        )
        assert resp.status_code == 422


# ============================================================================
# Task 157: Date Change Guard
# ============================================================================
class TestDateChangeGuard:
    """Block date changes when event_status is 'Updated Date and/or Time'."""

    def test_date_change_blocked_when_updated_status(self, admin_client):
        """Changing dates when status='Updated Date and/or Time' should fail."""
        data = create_event(
            admin_client,
            name="Guard Test Event",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "event_status": "Updated Date and/or Time",
            },
        )
        poi_id = data["id"]

        # Try to change the date without also setting status to Rescheduled
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={
                "event": {
                    "start_datetime": "2026-07-20T18:00:00Z",
                },
            },
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"

    def test_date_change_allowed_with_reschedule_status(self, admin_client):
        """Changing dates IS allowed when also setting status to 'Rescheduled'."""
        data = create_event(
            admin_client,
            name="Guard Allow Event",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "event_status": "Updated Date and/or Time",
            },
        )
        poi_id = data["id"]

        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={
                "event": {
                    "start_datetime": "2026-07-20T18:00:00Z",
                    "event_status": "Rescheduled",
                },
            },
        )
        assert resp.status_code == 200

    def test_date_change_allowed_for_normal_status(self, admin_client):
        """Changing dates is fine when status is 'Scheduled' (normal)."""
        data = create_event(admin_client, name="Normal Status Event")
        poi_id = data["id"]

        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={
                "event": {
                    "start_datetime": "2026-08-01T10:00:00Z",
                },
            },
        )
        assert resp.status_code == 200


# ============================================================================
# Combined: All new fields roundtrip
# ============================================================================
class TestAllNewFieldsRoundtrip:
    """Create event with ALL new fields and verify they roundtrip."""

    def test_create_and_read_all_new_fields(self, admin_client):
        """Full roundtrip of every new event field."""
        payload = {
            "name": "Full Roundtrip Event",
            "poi_type": "EVENT",
            "location": {"type": "Point", "coordinates": [-79.3, 35.6]},
            "cost": "$25-$75",
            "community_impact": "Benefits local schools",
            "history_paragraph": "<p>25 year tradition</p>",
            "article_links": [{"title": "News", "url": "https://news.com/event"}],
            "event": {
                "start_datetime": "2026-06-15T18:00:00Z",
                "end_datetime": "2026-06-15T22:00:00Z",
                "organizer_name": "Community Org",
                "event_status": "Scheduled",
                "cancellation_paragraph": "",
                "contact_organizer_toggle": False,
                "primary_display_category": "Festival",
                "organizer_email": "org@example.com",
                "organizer_phone": "919-555-0100",
                "organizer_website": "https://community.org",
                "organizer_social_media": {"instagram": "@community"},
                "cost_type": "range",
                "ticket_links": [
                    {"name": "GA", "url": "https://tickets.com/ga"},
                ],
                "sponsors": [
                    {"name": "Sponsor A", "url": "https://sponsora.com"},
                ],
            },
        }

        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 201, resp.text
        data = resp.json()
        event = data["event"]

        # Verify all new event fields
        assert event["event_status"] == "Scheduled"
        assert event["primary_display_category"] == "Festival"
        assert event["organizer_email"] == "org@example.com"
        assert event["organizer_phone"] == "919-555-0100"
        assert event["organizer_website"] == "https://community.org"
        assert event["organizer_social_media"]["instagram"] == "@community"
        assert event["cost_type"] == "range"
        assert len(event["ticket_links"]) == 1
        assert event["ticket_links"][0]["name"] == "GA"
        assert len(event["sponsors"]) == 1
        assert event["sponsors"][0]["name"] == "Sponsor A"

        # Verify base POI fields for events
        assert data["community_impact"] == "Benefits local schools"
        assert data["history_paragraph"] == "<p>25 year tradition</p>"
        assert data["article_links"][0]["title"] == "News"

        # Verify GET returns same data
        get_resp = admin_client.get(f"/api/pois/{data['id']}")
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        get_event = get_data["event"]
        assert get_event["event_status"] == "Scheduled"
        assert get_event["primary_display_category"] == "Festival"
        assert get_event["organizer_email"] == "org@example.com"
        assert get_event["cost_type"] == "range"
        assert len(get_event["ticket_links"]) == 1
        assert len(get_event["sponsors"]) == 1
