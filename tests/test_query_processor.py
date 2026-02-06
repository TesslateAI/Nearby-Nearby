"""
Unit tests for the search query processor.

These test the pure parsing logic — no database needed.
"""

import os
import sys
import pytest

# Ensure monorepo root and app backend are on path
MONOREPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP_BACKEND = os.path.join(MONOREPO_ROOT, "nearby-app", "backend")
for p in [MONOREPO_ROOT, APP_BACKEND]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.search.query_processor import parse_query


class TestExtractsAmenityFilters:
    def test_extracts_pet_friendly(self):
        parsed = parse_query("pet friendly cafe")
        fields = [f.field for f in parsed.extracted_filters]
        assert "pet_options" in fields

    def test_extracts_wifi(self):
        parsed = parse_query("coffee shop with wifi")
        fields = [f.field for f in parsed.extracted_filters]
        assert "wifi_options" in fields

    def test_extracts_free_wifi(self):
        parsed = parse_query("free wifi cafe")
        fields = [f.field for f in parsed.extracted_filters]
        assert "wifi_options" in fields

    def test_multiple_filters(self):
        parsed = parse_query("pet friendly cafe with wifi")
        fields = [f.field for f in parsed.extracted_filters]
        assert "pet_options" in fields
        assert "wifi_options" in fields

    def test_extracts_outdoor_seating(self):
        parsed = parse_query("restaurant with outdoor seating")
        fields = [f.field for f in parsed.extracted_filters]
        assert "business_amenities" in fields

    def test_extracts_live_music(self):
        parsed = parse_query("bar with live music")
        fields = [f.field for f in parsed.extracted_filters]
        assert "entertainment_options" in fields

    def test_extracts_playground(self):
        parsed = parse_query("park with playground")
        fields = [f.field for f in parsed.extracted_filters]
        assert "playground_available" in fields


class TestExtractsPOITypeHint:
    def test_extracts_trail(self):
        parsed = parse_query("hiking trail")
        assert parsed.poi_type_hint == "TRAIL"

    def test_extracts_park(self):
        parsed = parse_query("park with lake")
        assert parsed.poi_type_hint == "PARK"

    def test_extracts_restaurant(self):
        parsed = parse_query("italian restaurant")
        assert parsed.poi_type_hint == "BUSINESS"

    def test_extracts_event(self):
        parsed = parse_query("music festival")
        assert parsed.poi_type_hint == "EVENT"

    def test_no_type_for_generic_query(self):
        parsed = parse_query("Circle City")
        assert parsed.poi_type_hint is None


class TestExtractsLocationHint:
    def test_extracts_near_city(self):
        parsed = parse_query("restaurants near Pittsboro")
        assert parsed.location_hint == "Pittsboro"

    def test_extracts_in_city(self):
        parsed = parse_query("parks in Durham")
        assert parsed.location_hint == "Durham"

    def test_no_location_for_generic_query(self):
        parsed = parse_query("pet friendly cafe")
        assert parsed.location_hint is None


class TestExtractsTrailDifficulty:
    def test_extracts_easy(self):
        parsed = parse_query("easy hiking trail")
        assert parsed.trail_difficulty_hint == "easy"

    def test_extracts_moderate(self):
        parsed = parse_query("moderate hike")
        assert parsed.trail_difficulty_hint == "moderate"

    def test_extracts_difficult(self):
        parsed = parse_query("difficult trail")
        assert parsed.trail_difficulty_hint == "hard"


class TestEdgeCases:
    def test_empty_query(self):
        parsed = parse_query("")
        assert parsed.semantic_query == ""
        assert parsed.extracted_filters == []
        assert parsed.poi_type_hint is None

    def test_whitespace_query(self):
        parsed = parse_query("   ")
        assert parsed.semantic_query == ""

    def test_no_filters(self):
        parsed = parse_query("Circle City")
        assert parsed.extracted_filters == []

    def test_case_insensitive(self):
        parsed = parse_query("PET FRIENDLY cafe")
        fields = [f.field for f in parsed.extracted_filters]
        assert "pet_options" in fields

    def test_semantic_query_preserves_original(self):
        parsed = parse_query("pet friendly cafe near Pittsboro")
        assert parsed.semantic_query == "pet friendly cafe near Pittsboro"
        assert parsed.original_query == "pet friendly cafe near Pittsboro"
