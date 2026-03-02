"""
Phase 2: Test EventStatus enum, helper text dict, and explanation-required list.
"""

import pytest


class TestEventStatusEnum:
    """EventStatus enum should have exactly 7 values matching EVENT_STATUS_OPTIONS."""

    def test_event_status_enum_exists(self):
        from shared.models.enums import EventStatus
        assert EventStatus is not None

    def test_event_status_values(self):
        from shared.models.enums import EventStatus
        expected = [
            "Scheduled", "Canceled", "Postponed", "Updated Date and/or Time",
            "Rescheduled", "Moved Online", "Unofficial Proposed Date",
        ]
        actual = [e.value for e in EventStatus]
        assert actual == expected

    def test_event_status_lookup_by_name(self):
        from shared.models.enums import EventStatus
        assert EventStatus.SCHEDULED.value == "Scheduled"
        assert EventStatus.CANCELED.value == "Canceled"
        assert EventStatus.POSTPONED.value == "Postponed"
        assert EventStatus.RESCHEDULED.value == "Rescheduled"
        assert EventStatus.MOVED_ONLINE.value == "Moved Online"


class TestEventStatusHelperText:
    """EVENT_STATUS_HELPER_TEXT should map all 7 statuses to helper strings."""

    def test_helper_text_exists(self):
        from shared.constants.field_options import EVENT_STATUS_HELPER_TEXT
        assert isinstance(EVENT_STATUS_HELPER_TEXT, dict)

    def test_helper_text_has_all_statuses(self):
        from shared.constants.field_options import EVENT_STATUS_HELPER_TEXT, EVENT_STATUS_OPTIONS
        for status in EVENT_STATUS_OPTIONS:
            assert status in EVENT_STATUS_HELPER_TEXT, f"Missing helper text for '{status}'"

    def test_helper_text_values_are_strings(self):
        from shared.constants.field_options import EVENT_STATUS_HELPER_TEXT
        for status, text in EVENT_STATUS_HELPER_TEXT.items():
            assert isinstance(text, str), f"Helper text for '{status}' is not a string"
            assert len(text) > 0, f"Helper text for '{status}' is empty"


class TestEventStatusExplanationRequired:
    """EVENT_STATUS_EXPLANATION_REQUIRED lists statuses that need status_explanation."""

    def test_explanation_required_exists(self):
        from shared.constants.field_options import EVENT_STATUS_EXPLANATION_REQUIRED
        assert isinstance(EVENT_STATUS_EXPLANATION_REQUIRED, list)

    def test_explanation_required_values(self):
        from shared.constants.field_options import EVENT_STATUS_EXPLANATION_REQUIRED
        assert "Updated Date and/or Time" in EVENT_STATUS_EXPLANATION_REQUIRED
        assert "Postponed" in EVENT_STATUS_EXPLANATION_REQUIRED
        assert "Moved Online" in EVENT_STATUS_EXPLANATION_REQUIRED

    def test_scheduled_not_in_explanation_required(self):
        from shared.constants.field_options import EVENT_STATUS_EXPLANATION_REQUIRED
        assert "Scheduled" not in EVENT_STATUS_EXPLANATION_REQUIRED
        assert "Canceled" not in EVENT_STATUS_EXPLANATION_REQUIRED
