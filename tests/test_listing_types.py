"""
Tests for Tasks 171-172: Listing type changes.

- Remove 'paid_founding' listing type
- Replace 'sponsor' with 4 granular sponsor levels:
  sponsor_platform, sponsor_state, sponsor_county, sponsor_town
"""
import pytest
from conftest import create_business


# ---------------------------------------------------------------------------
# Task 171: Remove paid_founding
# ---------------------------------------------------------------------------
class TestRemovePaidFounding:
    def test_create_business_paid_founding_rejected(self, admin_client):
        """POST with listing_type='paid_founding' should be rejected (422)."""
        resp = admin_client.post("/api/pois/", json={
            "name": "Founding Biz",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "paid_founding",
        })
        assert resp.status_code == 422, f"Expected 422, got {resp.status_code}: {resp.text}"

    def test_paid_founding_not_in_field_options(self):
        """paid_founding should not appear in shared constants."""
        from shared.constants.field_options import LISTING_TYPES
        values = [lt["value"] for lt in LISTING_TYPES]
        assert "paid_founding" not in values

    def test_paid_founding_not_in_schema_literal(self):
        """paid_founding should not be accepted by the schema Literal."""
        from app.schemas.poi import LISTING_TYPES as LT
        # Literal.__args__ gives the allowed values
        allowed = LT.__args__
        assert "paid_founding" not in allowed


# ---------------------------------------------------------------------------
# Task 172: Sponsor levels
# ---------------------------------------------------------------------------
class TestSponsorLevels:
    def test_create_business_sponsor_platform(self, admin_client):
        resp = admin_client.post("/api/pois/", json={
            "name": "Platform Sponsor",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "sponsor_platform",
        })
        assert resp.status_code == 201, f"Expected 201: {resp.text}"
        assert resp.json()["listing_type"] == "sponsor_platform"

    def test_create_business_sponsor_state(self, admin_client):
        resp = admin_client.post("/api/pois/", json={
            "name": "State Sponsor",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "sponsor_state",
        })
        assert resp.status_code == 201, f"Expected 201: {resp.text}"
        assert resp.json()["listing_type"] == "sponsor_state"

    def test_create_business_sponsor_county(self, admin_client):
        resp = admin_client.post("/api/pois/", json={
            "name": "County Sponsor",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "sponsor_county",
        })
        assert resp.status_code == 201, f"Expected 201: {resp.text}"
        assert resp.json()["listing_type"] == "sponsor_county"

    def test_create_business_sponsor_town(self, admin_client):
        resp = admin_client.post("/api/pois/", json={
            "name": "Town Sponsor",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "sponsor_town",
        })
        assert resp.status_code == 201, f"Expected 201: {resp.text}"
        assert resp.json()["listing_type"] == "sponsor_town"

    def test_old_sponsor_rejected(self, admin_client):
        """The old generic 'sponsor' value should be rejected."""
        resp = admin_client.post("/api/pois/", json={
            "name": "Old Sponsor",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "sponsor",
        })
        assert resp.status_code == 422, f"Expected 422, got {resp.status_code}: {resp.text}"

    def test_update_listing_type_to_sponsor_level(self, admin_client):
        """Should be able to update a business to a sponsor level."""
        biz = create_business(admin_client, name="Updatable Biz")
        poi_id = biz["id"]
        resp = admin_client.put(f"/api/pois/{poi_id}", json={
            "listing_type": "sponsor_platform",
        })
        assert resp.status_code == 200, f"Expected 200: {resp.text}"
        assert resp.json()["listing_type"] == "sponsor_platform"

    def test_all_sponsor_levels_in_field_options(self):
        """All 4 sponsor levels should be in shared constants."""
        from shared.constants.field_options import LISTING_TYPES
        values = [lt["value"] for lt in LISTING_TYPES]
        for level in ["sponsor_platform", "sponsor_state", "sponsor_county", "sponsor_town"]:
            assert level in values, f"{level} missing from LISTING_TYPES"


# ---------------------------------------------------------------------------
# Existing listing types still work
# ---------------------------------------------------------------------------
class TestListingTypeBehavior:
    def test_free_listing_accepted(self, admin_client):
        resp = admin_client.post("/api/pois/", json={
            "name": "Free Biz",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "free",
        })
        assert resp.status_code == 201

    def test_paid_listing_accepted(self, admin_client):
        resp = admin_client.post("/api/pois/", json={
            "name": "Paid Biz",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "paid",
        })
        assert resp.status_code == 201

    def test_community_comped_accepted(self, admin_client):
        resp = admin_client.post("/api/pois/", json={
            "name": "Comped Biz",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "community_comped",
        })
        assert resp.status_code == 201
