"""
Phase 9: Test events sitemap endpoint.

GET /sitemap-events.xml should return valid XML with published, non-cancelled events.
"""

import pytest
from datetime import datetime, timezone
from conftest import orm_create_event, db_session, app_client


class TestEventSitemap:
    """GET /sitemap-events.xml returns valid XML sitemap."""

    def test_returns_valid_xml(self, db_session, app_client):
        """Sitemap should return application/xml content type."""
        orm_create_event(
            db_session, name="Sitemap Event", published=True, slug="sitemap-event",
            event_fields={
                "start_datetime": datetime(2030, 6, 15, 18, 0, 0, tzinfo=timezone.utc),
            },
        )
        db_session.commit()

        resp = app_client.get("/sitemap-events.xml")
        assert resp.status_code == 200
        assert "application/xml" in resp.headers.get("content-type", "")

    def test_published_events_included(self, db_session, app_client):
        """Published events should appear in the sitemap."""
        orm_create_event(
            db_session, name="Published Event", published=True, slug="published-event",
            event_fields={
                "start_datetime": datetime(2030, 7, 1, 10, 0, 0, tzinfo=timezone.utc),
                "event_status": "Scheduled",
            },
        )
        db_session.commit()

        resp = app_client.get("/sitemap-events.xml")
        body = resp.text
        assert "published-event" in body

    def test_cancelled_events_excluded(self, db_session, app_client):
        """Cancelled events should not appear in the sitemap."""
        orm_create_event(
            db_session, name="Cancelled Sitemap Event", published=True, slug="cancelled-sitemap",
            event_fields={
                "start_datetime": datetime(2030, 8, 1, 10, 0, 0, tzinfo=timezone.utc),
                "event_status": "Canceled",
            },
        )
        db_session.commit()

        resp = app_client.get("/sitemap-events.xml")
        body = resp.text
        assert "cancelled-sitemap" not in body

    def test_rescheduled_events_excluded(self, db_session, app_client):
        """Rescheduled events should not appear in the sitemap."""
        orm_create_event(
            db_session, name="Rescheduled Sitemap", published=True, slug="rescheduled-sitemap",
            event_fields={
                "start_datetime": datetime(2030, 9, 1, 10, 0, 0, tzinfo=timezone.utc),
                "event_status": "Rescheduled",
            },
        )
        db_session.commit()

        resp = app_client.get("/sitemap-events.xml")
        body = resp.text
        assert "rescheduled-sitemap" not in body

    def test_draft_events_excluded(self, db_session, app_client):
        """Draft/unpublished events should not appear in the sitemap."""
        orm_create_event(
            db_session, name="Draft Sitemap Event", published=False, slug="draft-sitemap",
            event_fields={
                "start_datetime": datetime(2030, 10, 1, 10, 0, 0, tzinfo=timezone.utc),
            },
        )
        db_session.commit()

        resp = app_client.get("/sitemap-events.xml")
        body = resp.text
        assert "draft-sitemap" not in body

    def test_urls_use_events_slug_format(self, db_session, app_client):
        """URLs should use /events/{slug} format."""
        orm_create_event(
            db_session, name="Slug Test Event", published=True, slug="slug-test-event",
            event_fields={
                "start_datetime": datetime(2030, 11, 1, 10, 0, 0, tzinfo=timezone.utc),
                "event_status": "Scheduled",
            },
        )
        db_session.commit()

        resp = app_client.get("/sitemap-events.xml")
        body = resp.text
        assert "/events/slug-test-event" in body

    def test_xml_structure(self, db_session, app_client):
        """XML should have proper urlset structure."""
        orm_create_event(
            db_session, name="Structure Event", published=True, slug="structure-event",
            event_fields={
                "start_datetime": datetime(2030, 12, 1, 10, 0, 0, tzinfo=timezone.utc),
                "event_status": "Scheduled",
            },
        )
        db_session.commit()

        resp = app_client.get("/sitemap-events.xml")
        body = resp.text
        assert '<?xml' in body
        assert '<urlset' in body
        assert '<url>' in body
        assert '<loc>' in body
