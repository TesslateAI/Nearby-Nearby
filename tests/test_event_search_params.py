"""
Phase 8: Test event-specific search parameters.

Search endpoints should accept date_from, date_to, and event_status query params
to filter event results.
"""

import pytest
from datetime import datetime, timezone
from conftest import orm_create_event, db_session, app_client


class TestEventSearchDateFilters:
    """date_from and date_to params filter events by start_datetime."""

    def test_search_date_from_filters_earlier(self, db_session, app_client):
        """Events before date_from should be excluded."""
        # Create an event in January 2026
        orm_create_event(
            db_session, name="January Gala", published=True,
            event_fields={
                "start_datetime": datetime(2026, 1, 15, 18, 0, 0, tzinfo=timezone.utc),
            },
        )
        # Create an event in July 2026
        orm_create_event(
            db_session, name="July Fest", published=True, slug="july-fest",
            event_fields={
                "start_datetime": datetime(2026, 7, 4, 10, 0, 0, tzinfo=timezone.utc),
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/search?q=Gala&date_from=2026-06-01")
        assert resp.status_code == 200
        # January Gala should be filtered out (before June 2026)
        names = [p["name"] for p in resp.json()]
        assert "January Gala" not in names

    def test_search_date_to_filters_later(self, db_session, app_client):
        """Events after date_to should be excluded."""
        orm_create_event(
            db_session, name="December Ball", published=True,
            event_fields={
                "start_datetime": datetime(2026, 12, 31, 20, 0, 0, tzinfo=timezone.utc),
            },
        )
        orm_create_event(
            db_session, name="March Fest", published=True, slug="march-fest",
            event_fields={
                "start_datetime": datetime(2026, 3, 1, 10, 0, 0, tzinfo=timezone.utc),
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/search?q=Fest&date_to=2026-06-30")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "December Ball" not in names

    def test_search_date_range_returns_events_in_range(self, db_session, app_client):
        """date_from + date_to together should filter to events in range."""
        orm_create_event(
            db_session, name="Spring Event", published=True,
            event_fields={
                "start_datetime": datetime(2026, 4, 15, 10, 0, 0, tzinfo=timezone.utc),
            },
        )
        orm_create_event(
            db_session, name="Fall Event", published=True, slug="fall-event",
            event_fields={
                "start_datetime": datetime(2026, 10, 15, 10, 0, 0, tzinfo=timezone.utc),
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/search?q=Event&date_from=2026-03-01&date_to=2026-06-30")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        if "Spring Event" in names:
            assert "Fall Event" not in names


class TestEventSearchStatusFilter:
    """event_status param filters by specific event status."""

    def test_search_event_status_filter(self, db_session, app_client):
        """Only events with matching status should be returned."""
        orm_create_event(
            db_session, name="Scheduled Concert", published=True,
            event_fields={
                "start_datetime": datetime(2030, 6, 15, 18, 0, 0, tzinfo=timezone.utc),
                "event_status": "Scheduled",
            },
        )
        orm_create_event(
            db_session, name="Postponed Concert", published=True, slug="postponed-concert",
            event_fields={
                "start_datetime": datetime(2030, 6, 20, 18, 0, 0, tzinfo=timezone.utc),
                "event_status": "Postponed",
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/search?q=Concert&event_status=Scheduled")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        # Postponed should be excluded (both by status filter AND by the default exclusion)
        assert "Postponed Concert" not in names
