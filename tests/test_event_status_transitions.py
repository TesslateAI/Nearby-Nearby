"""
Phase 10: Test event status transition validation.

Only certain status transitions are allowed. "Return to Scheduled" is always
allowed from any status. Invalid transitions should be blocked.
"""

import pytest
from conftest import create_event


class TestStatusTransitionRules:
    """Validate status transitions via admin API."""

    def test_scheduled_to_canceled_allowed(self, admin_client):
        """Scheduled -> Canceled is allowed."""
        data = create_event(admin_client, name="Cancel Transition")
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={"event": {"event_status": "Canceled"}},
        )
        assert resp.status_code == 200
        assert resp.json()["event"]["event_status"] == "Canceled"

    def test_scheduled_to_postponed_allowed(self, admin_client):
        """Scheduled -> Postponed is allowed (requires status_explanation)."""
        data = create_event(admin_client, name="Postpone Transition")
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={"event": {
                "event_status": "Postponed",
                "status_explanation": "Weather delay",
            }},
        )
        assert resp.status_code == 200
        assert resp.json()["event"]["event_status"] == "Postponed"

    def test_canceled_to_scheduled_allowed(self, admin_client):
        """Canceled -> Scheduled (return to scheduled) is always allowed."""
        data = create_event(
            admin_client, name="Return Transition",
            event={"start_datetime": "2026-06-15T18:00:00Z", "event_status": "Canceled"},
        )
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={"event": {"event_status": "Scheduled"}},
        )
        assert resp.status_code == 200
        assert resp.json()["event"]["event_status"] == "Scheduled"

    def test_canceled_to_postponed_blocked(self, admin_client):
        """Canceled -> Postponed should be blocked (invalid transition)."""
        data = create_event(
            admin_client, name="Bad Transition 1",
            event={"start_datetime": "2026-06-15T18:00:00Z", "event_status": "Canceled"},
        )
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={"event": {
                "event_status": "Postponed",
                "status_explanation": "Trying to postpone from canceled",
            }},
        )
        assert resp.status_code == 400

    def test_rescheduled_to_postponed_blocked(self, admin_client):
        """Rescheduled -> Postponed should be blocked."""
        data = create_event(
            admin_client, name="Bad Transition 2",
            event={"start_datetime": "2026-06-15T18:00:00Z", "event_status": "Rescheduled"},
        )
        poi_id = data["id"]
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={"event": {
                "event_status": "Postponed",
                "status_explanation": "Bad transition attempt",
            }},
        )
        assert resp.status_code == 400

    def test_any_status_to_scheduled_always_allowed(self, admin_client):
        """Return to Scheduled should be allowed from any status."""
        for status in ["Postponed", "Moved Online", "Unofficial Proposed Date"]:
            extra = {}
            if status in ("Postponed", "Moved Online"):
                extra = {"status_explanation": "test"}
            data = create_event(
                admin_client,
                name=f"Return from {status}",
                event={"start_datetime": "2026-06-15T18:00:00Z", "event_status": status, **extra},
            )
            poi_id = data["id"]
            resp = admin_client.put(
                f"/api/pois/{poi_id}",
                json={"event": {"event_status": "Scheduled"}},
            )
            assert resp.status_code == 200, f"Failed to return to Scheduled from {status}: {resp.text}"


class TestStatusTransitionUtility:
    """Unit tests for the transition validation utility."""

    def test_validate_valid_transition(self):
        from shared.utils.event_status import validate_status_transition
        valid, msg = validate_status_transition("Scheduled", "Canceled")
        assert valid is True

    def test_validate_invalid_transition(self):
        from shared.utils.event_status import validate_status_transition
        valid, msg = validate_status_transition("Canceled", "Postponed")
        assert valid is False
        assert msg  # Should have an error message

    def test_return_to_scheduled_always_valid(self):
        from shared.utils.event_status import validate_status_transition
        for status in ["Canceled", "Postponed", "Rescheduled", "Moved Online",
                       "Updated Date and/or Time", "Unofficial Proposed Date"]:
            valid, msg = validate_status_transition(status, "Scheduled")
            assert valid is True, f"Should allow {status} -> Scheduled"


class TestEventStatusesEndpoint:
    """GET /event-statuses returns helper text and transitions."""

    def test_event_statuses_endpoint(self, admin_client):
        """Should return all statuses with helper text and valid transitions."""
        resp = admin_client.get("/api/event-statuses")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 7

        # Each entry should have status, helper_text, valid_transitions
        for entry in data:
            assert "status" in entry
            assert "helper_text" in entry
            assert "valid_transitions" in entry
            assert isinstance(entry["valid_transitions"], list)
