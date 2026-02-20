"""
Tests for Task 50: Recurring events expansion.
Adds daily/monthly/yearly/custom intervals, excluded dates, series linking,
manual dates, recurrence end date, and 60-month limit.
"""
import uuid
import pytest
from datetime import datetime, timezone, timedelta
from conftest import create_event


class TestRecurringEvents:
    """Task 50: Expanded recurring event support."""

    def test_daily_recurrence(self, admin_client):
        """Daily recurring event stores pattern correctly."""
        event = create_event(
            admin_client, "Daily Standup",
            event={
                "start_datetime": "2026-06-15T09:00:00Z",
                "is_repeating": True,
                "repeat_pattern": {"frequency": "daily", "interval": 1},
            },
        )
        assert event["event"]["is_repeating"] is True
        assert event["event"]["repeat_pattern"]["frequency"] == "daily"
        assert event["event"]["repeat_pattern"]["interval"] == 1

    def test_weekly_recurrence(self, admin_client):
        """Weekly recurring event (already works, verify preserved)."""
        event = create_event(
            admin_client, "Weekly Meetup",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "is_repeating": True,
                "repeat_pattern": {"frequency": "weekly", "days": ["thursday"]},
            },
        )
        assert event["event"]["repeat_pattern"]["frequency"] == "weekly"
        assert "thursday" in event["event"]["repeat_pattern"]["days"]

    def test_monthly_recurrence(self, admin_client):
        """Monthly recurring event."""
        event = create_event(
            admin_client, "Monthly Board Meeting",
            event={
                "start_datetime": "2026-06-01T19:00:00Z",
                "is_repeating": True,
                "repeat_pattern": {
                    "frequency": "monthly",
                    "day_of_month": "first_monday",
                },
            },
        )
        assert event["event"]["repeat_pattern"]["frequency"] == "monthly"
        assert event["event"]["repeat_pattern"]["day_of_month"] == "first_monday"

    def test_yearly_recurrence(self, admin_client):
        """Yearly recurring event."""
        event = create_event(
            admin_client, "Annual Gala",
            event={
                "start_datetime": "2026-12-31T20:00:00Z",
                "is_repeating": True,
                "repeat_pattern": {
                    "frequency": "yearly",
                    "month_of_year": 12,
                },
            },
        )
        assert event["event"]["repeat_pattern"]["frequency"] == "yearly"

    def test_custom_interval(self, admin_client):
        """Custom interval (e.g., every 3 days)."""
        event = create_event(
            admin_client, "Every 3 Days",
            event={
                "start_datetime": "2026-06-15T10:00:00Z",
                "is_repeating": True,
                "repeat_pattern": {"frequency": "daily", "interval": 3},
            },
        )
        assert event["event"]["repeat_pattern"]["interval"] == 3

    def test_excluded_dates(self, admin_client):
        """Recurring event with excluded dates."""
        event = create_event(
            admin_client, "Skip Holidays",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "is_repeating": True,
                "repeat_pattern": {"frequency": "weekly", "days": ["friday"]},
                "excluded_dates": ["2026-07-04", "2026-12-25"],
            },
        )
        assert event["event"]["excluded_dates"] == ["2026-07-04", "2026-12-25"]

    def test_recurrence_end_date(self, admin_client):
        """Recurring event with end date."""
        event = create_event(
            admin_client, "Limited Series",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "is_repeating": True,
                "repeat_pattern": {"frequency": "weekly", "days": ["monday"]},
                "recurrence_end_date": "2026-12-31T23:59:59Z",
            },
        )
        end_date = event["event"]["recurrence_end_date"]
        assert end_date is not None
        assert "2026-12-31" in end_date

    def test_manual_dates(self, admin_client):
        """Event with manually specified dates (irregular schedule)."""
        manual = [
            "2026-07-04T18:00:00Z",
            "2026-08-15T18:00:00Z",
            "2026-10-31T18:00:00Z",
        ]
        event = create_event(
            admin_client, "Irregular Event",
            event={
                "start_datetime": "2026-07-04T18:00:00Z",
                "manual_dates": manual,
            },
        )
        assert event["event"]["manual_dates"] == manual

    def test_series_id_links_instances(self, admin_client):
        """Events can have a series_id to link instances in a series."""
        series_id = str(uuid.uuid4())
        event1 = create_event(
            admin_client, "Series Event 1",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "series_id": series_id,
            },
        )
        event2 = create_event(
            admin_client, "Series Event 2",
            event={
                "start_datetime": "2026-06-22T18:00:00Z",
                "series_id": series_id,
            },
        )
        assert event1["event"]["series_id"] == series_id
        assert event2["event"]["series_id"] == series_id

    def test_parent_event_id(self, admin_client):
        """Events can reference a parent event in a series."""
        parent = create_event(admin_client, "Parent Event")
        child = create_event(
            admin_client, "Child Event",
            event={
                "start_datetime": "2026-06-22T18:00:00Z",
                "parent_event_id": parent["id"],
            },
        )
        assert child["event"]["parent_event_id"] == parent["id"]
