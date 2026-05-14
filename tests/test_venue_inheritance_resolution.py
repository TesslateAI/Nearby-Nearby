"""
Phase 6: Test venue inheritance resolution utility.

resolve_venue_inheritance() merges venue data into event data based on
per-section inheritance config: as_is, use_and_add, do_not_use.
"""

import pytest


class TestVenueInheritanceResolution:
    """Unit tests for resolve_venue_inheritance utility."""

    def test_as_is_copies_venue_parking(self):
        """as_is mode should copy venue parking data to the event."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {"parking_types": None}
        venue_data = {"parking_types": ["Public Parking Lot", "Street"]}
        config = {"parking": "as_is"}

        result = resolve_venue_inheritance(event_data, venue_data, config)
        assert result["parking_types"] == ["Public Parking Lot", "Street"]

    def test_use_and_add_merges_venue_and_event(self):
        """use_and_add should merge venue base + event additions."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {"parking_types": ["Valet"]}
        venue_data = {"parking_types": ["Public Parking Lot", "Street"]}
        config = {"parking": "use_and_add"}

        result = resolve_venue_inheritance(event_data, venue_data, config)
        assert "Public Parking Lot" in result["parking_types"]
        assert "Street" in result["parking_types"]
        assert "Valet" in result["parking_types"]

    def test_do_not_use_ignores_venue_data(self):
        """do_not_use should not copy venue data."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {"parking_types": ["Valet"]}
        venue_data = {"parking_types": ["Public Parking Lot"]}
        config = {"parking": "do_not_use"}

        result = resolve_venue_inheritance(event_data, venue_data, config)
        assert result["parking_types"] == ["Valet"]

    def test_missing_config_defaults_to_no_inheritance(self):
        """No inheritance config means event keeps its own data."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {"parking_types": ["Valet"]}
        venue_data = {"parking_types": ["Public Parking Lot"]}

        result = resolve_venue_inheritance(event_data, venue_data, None)
        assert result["parking_types"] == ["Valet"]

    def test_null_venue_data_no_error(self):
        """Null venue data should not cause errors."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {"parking_types": ["Valet"]}
        config = {"parking": "as_is"}

        result = resolve_venue_inheritance(event_data, None, config)
        assert result["parking_types"] == ["Valet"]

    def test_restrooms_as_is(self):
        """as_is for restrooms section."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {"public_toilets": None, "toilet_description": None}
        venue_data = {"public_toilets": ["Yes", "Family"], "toilet_description": "Near entrance"}
        config = {"restrooms": "as_is"}

        result = resolve_venue_inheritance(event_data, venue_data, config)
        assert result["public_toilets"] == ["Yes", "Family"]
        assert result["toilet_description"] == "Near entrance"

    def test_accessibility_use_and_add(self):
        """use_and_add for accessibility section."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {"wheelchair_accessible": ["Yes"]}
        venue_data = {"wheelchair_accessible": ["Yes"], "wheelchair_details": "Ramp at entrance"}
        config = {"accessibility": "use_and_add"}

        result = resolve_venue_inheritance(event_data, venue_data, config)
        assert "Yes" in result["wheelchair_accessible"]
        assert result["wheelchair_details"] == "Ramp at entrance"

    def test_hours_as_is(self):
        """as_is for hours section copies venue hours."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {"hours": None}
        venue_data = {"hours": {"monday": {"open": "09:00", "close": "17:00"}}}
        config = {"hours": "as_is"}

        result = resolve_venue_inheritance(event_data, venue_data, config)
        assert result["hours"]["monday"]["open"] == "09:00"

    def test_multiple_sections(self):
        """Multiple sections can be configured independently."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {
            "parking_types": None,
            "public_toilets": ["Porta Potti"],
            "wheelchair_accessible": None,
        }
        venue_data = {
            "parking_types": ["Street"],
            "public_toilets": ["Yes"],
            "wheelchair_accessible": ["Yes"],
        }
        config = {
            "parking": "as_is",
            "restrooms": "do_not_use",
            "accessibility": "as_is",
        }

        result = resolve_venue_inheritance(event_data, venue_data, config)
        assert result["parking_types"] == ["Street"]
        assert result["public_toilets"] == ["Porta Potti"]  # do_not_use: event keeps own
        assert result["wheelchair_accessible"] == ["Yes"]  # as_is from venue

    def test_venue_source_annotations(self):
        """Result should include _venue_source annotations."""
        from shared.utils.venue_inheritance import resolve_venue_inheritance

        event_data = {"parking_types": None}
        venue_data = {"parking_types": ["Street"]}
        config = {"parking": "as_is"}

        result = resolve_venue_inheritance(event_data, venue_data, config)
        assert "_venue_source" in result
        assert result["_venue_source"]["parking"] == "as_is"
