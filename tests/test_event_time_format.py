"""
Tests for Task 46: Event times returned as ISO 8601 (no bare military time).
Backend stores UTC timestamps; frontend handles 12h display.
"""
import re
import pytest
from conftest import create_event


class TestEventTimeFormat:
    """Task 46: API returns datetimes in ISO 8601 format."""

    def test_event_datetime_returned_as_iso(self, admin_client):
        """API returns datetime in ISO 8601 format."""
        poi = create_event(
            admin_client, "ISO Event",
            event={"start_datetime": "2026-06-15T14:30:00Z"},
        )
        start = poi["event"]["start_datetime"]
        # Should be ISO 8601: contains 'T' separator and timezone info
        assert "T" in start
        # Should NOT be bare HH:MM like "14:30"
        assert not re.match(r'^\d{2}:\d{2}$', start)

    def test_event_end_datetime_iso(self, admin_client):
        """End datetime also in ISO 8601 format."""
        poi = create_event(
            admin_client, "End Time Event",
            event={
                "start_datetime": "2026-06-15T14:30:00Z",
                "end_datetime": "2026-06-15T22:00:00Z",
            },
        )
        end = poi["event"]["end_datetime"]
        assert "T" in end
        assert not re.match(r'^\d{2}:\d{2}$', end)

    def test_event_datetime_roundtrip(self, admin_client):
        """Datetime roundtrips correctly through create and get."""
        poi = create_event(
            admin_client, "Roundtrip Event",
            event={"start_datetime": "2026-12-31T23:59:00Z"},
        )
        resp = admin_client.get(f"/api/pois/{poi['id']}")
        assert resp.status_code == 200
        start = resp.json()["event"]["start_datetime"]
        # Should preserve the time
        assert "23:59" in start or "23:59:00" in start
