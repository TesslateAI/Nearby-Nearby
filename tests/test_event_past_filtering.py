"""
Phase 4: Test past event exclusion and cancelled/rescheduled event filtering.

Past events (end_datetime < now, or start_datetime < now if no end) should be
excluded from browse and search endpoints by default. Cancelled and Rescheduled
events should be excluded from search. Direct access endpoints (/pois/{id},
/pois/by-slug/{slug}) remain unfiltered.
"""

import pytest
from datetime import datetime, timezone, timedelta
from conftest import (
    orm_create_event, orm_create_business, orm_create_category,
    orm_assign_main_category, db_session, app_client,
)


class TestPastEventExclusion:
    """Past events should be excluded from browse endpoints by default."""

    def test_past_event_excluded_from_by_type(self, db_session, app_client):
        """Past event should not appear in GET /pois/by-type/EVENT."""
        # Create a past event (end_datetime in the past)
        orm_create_event(
            db_session,
            name="Past Event",
            published=True,
            event_fields={
                "start_datetime": datetime(2020, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
                "end_datetime": datetime(2020, 1, 1, 18, 0, 0, tzinfo=timezone.utc),
            },
        )
        # Create a future event
        orm_create_event(
            db_session,
            name="Future Event",
            published=True,
            slug="future-event",
            event_fields={
                "start_datetime": datetime(2030, 6, 15, 18, 0, 0, tzinfo=timezone.utc),
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/by-type/EVENT")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Future Event" in names
        assert "Past Event" not in names

    def test_past_event_excluded_from_by_category(self, db_session, app_client):
        """Past event should not appear in GET /pois/by-category/{slug}."""
        cat = orm_create_category(db_session, name="Concerts")

        past = orm_create_event(
            db_session, name="Old Concert", published=True,
            event_fields={
                "start_datetime": datetime(2020, 5, 1, 19, 0, 0, tzinfo=timezone.utc),
                "end_datetime": datetime(2020, 5, 1, 23, 0, 0, tzinfo=timezone.utc),
            },
        )
        future = orm_create_event(
            db_session, name="Upcoming Concert", published=True, slug="upcoming-concert",
            event_fields={
                "start_datetime": datetime(2030, 5, 1, 19, 0, 0, tzinfo=timezone.utc),
            },
        )

        orm_assign_main_category(db_session, past.id, cat.id)
        orm_assign_main_category(db_session, future.id, cat.id)
        db_session.commit()

        resp = app_client.get(f"/api/pois/by-category/{cat.slug}")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()["pois"]]
        assert "Upcoming Concert" in names
        assert "Old Concert" not in names

    def test_past_event_accessible_via_direct_get(self, db_session, app_client):
        """Past events should still be accessible via GET /pois/{id}."""
        past = orm_create_event(
            db_session, name="Archived Event", published=True,
            event_fields={
                "start_datetime": datetime(2020, 3, 1, 10, 0, 0, tzinfo=timezone.utc),
                "end_datetime": datetime(2020, 3, 1, 18, 0, 0, tzinfo=timezone.utc),
            },
        )
        db_session.commit()

        resp = app_client.get(f"/api/pois/{past.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Archived Event"

    def test_past_event_accessible_via_slug(self, db_session, app_client):
        """Past events should still be accessible via GET /pois/by-slug/{slug}."""
        past = orm_create_event(
            db_session, name="Historical Event", published=True,
            slug="historical-event",
            event_fields={
                "start_datetime": datetime(2019, 12, 31, 20, 0, 0, tzinfo=timezone.utc),
                "end_datetime": datetime(2020, 1, 1, 2, 0, 0, tzinfo=timezone.utc),
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/by-slug/historical-event")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Historical Event"

    def test_include_past_events_param(self, db_session, app_client):
        """include_past_events=true should show past events in by-type."""
        orm_create_event(
            db_session, name="Old Fest", published=True,
            event_fields={
                "start_datetime": datetime(2020, 7, 4, 10, 0, 0, tzinfo=timezone.utc),
                "end_datetime": datetime(2020, 7, 4, 22, 0, 0, tzinfo=timezone.utc),
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/by-type/EVENT?include_past_events=true")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Old Fest" in names

    def test_past_event_no_end_datetime(self, db_session, app_client):
        """Event with no end_datetime and past start_datetime should be excluded."""
        orm_create_event(
            db_session, name="No End Past", published=True,
            event_fields={
                "start_datetime": datetime(2020, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
                "end_datetime": None,
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/by-type/EVENT")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "No End Past" not in names

    def test_non_event_pois_unaffected(self, db_session, app_client):
        """Non-event POIs should always pass through the filter."""
        orm_create_business(db_session, name="Old Coffee Shop", published=True)
        db_session.commit()

        resp = app_client.get("/api/pois/by-type/BUSINESS")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Old Coffee Shop" in names


class TestCancelledEventExclusion:
    """Cancelled and Rescheduled events excluded from browse/search endpoints."""

    def test_cancelled_event_excluded_from_by_type(self, db_session, app_client):
        """Cancelled event should not appear in by-type listing."""
        orm_create_event(
            db_session, name="Cancelled Gala", published=True,
            event_fields={
                "start_datetime": datetime(2030, 6, 15, 18, 0, 0, tzinfo=timezone.utc),
                "event_status": "Canceled",
            },
        )
        orm_create_event(
            db_session, name="Active Gala", published=True, slug="active-gala",
            event_fields={
                "start_datetime": datetime(2030, 6, 15, 18, 0, 0, tzinfo=timezone.utc),
                "event_status": "Scheduled",
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/by-type/EVENT")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Active Gala" in names
        assert "Cancelled Gala" not in names

    def test_rescheduled_event_excluded_from_by_type(self, db_session, app_client):
        """Rescheduled event should not appear in by-type listing."""
        orm_create_event(
            db_session, name="Rescheduled Fest", published=True,
            event_fields={
                "start_datetime": datetime(2030, 8, 1, 10, 0, 0, tzinfo=timezone.utc),
                "event_status": "Rescheduled",
            },
        )
        db_session.commit()

        resp = app_client.get("/api/pois/by-type/EVENT")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Rescheduled Fest" not in names

    def test_cancelled_event_accessible_via_direct_link(self, db_session, app_client):
        """Cancelled events should still be accessible via direct GET."""
        cancelled = orm_create_event(
            db_session, name="Cancelled Direct", published=True,
            event_fields={
                "start_datetime": datetime(2030, 6, 15, 18, 0, 0, tzinfo=timezone.utc),
                "event_status": "Canceled",
            },
        )
        db_session.commit()

        resp = app_client.get(f"/api/pois/{cancelled.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Cancelled Direct"
