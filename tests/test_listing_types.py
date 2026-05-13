"""
Listing type tests, updated for Phase 1 (May 2026 launch).

Phase 1 changes vs the prior sponsor_* listing types design:
- `paid_founding` is retained (not removed).
- The `sponsor_*` listing types are REMOVED. Sponsorship is modelled via
  `is_sponsor: bool` + `sponsor_level: platform|state|county|town`, with
  `listing_type` always reverting to `paid` when `is_sponsor=true`.
"""
import pytest
from conftest import create_business


class TestListingTypeLiterals:
    def test_paid_founding_is_accepted(self):
        from app.schemas.poi import LISTING_TYPES as LT
        assert "paid_founding" in LT.__args__

    def test_expected_listing_types(self):
        from app.schemas.poi import LISTING_TYPES as LT
        assert set(LT.__args__) == {"free", "paid", "paid_founding", "community_comped"}

    def test_sponsor_listing_types_rejected(self, admin_client):
        for lt in ["sponsor_platform", "sponsor_state", "sponsor_county", "sponsor_town", "sponsor"]:
            resp = admin_client.post("/api/pois/", json={
                "name": f"Old {lt}",
                "poi_type": "BUSINESS",
                "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
                "business": {"price_range": "$$"},
                "listing_type": lt,
            })
            assert resp.status_code == 422, f"{lt} should be rejected: {resp.text}"


class TestSponsorModel:
    def test_sponsor_level_platform(self, admin_client):
        resp = admin_client.post("/api/pois/", json={
            "name": "Platform Sponsor",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "paid",
            "is_sponsor": True,
            "sponsor_level": "platform",
        })
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["is_sponsor"] is True
        assert body["sponsor_level"] == "platform"
        assert body["listing_type"] == "paid"

    @pytest.mark.parametrize("level", ["platform", "state", "county", "town"])
    def test_sponsor_level_all_values(self, admin_client, level):
        resp = admin_client.post("/api/pois/", json={
            "name": f"{level} Sponsor",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "paid",
            "is_sponsor": True,
            "sponsor_level": level,
        })
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["sponsor_level"] == level
        assert body["is_sponsor"] is True

    def test_is_sponsor_forces_paid(self, admin_client):
        """Setting is_sponsor=true reverts listing_type to 'paid' via apply_sponsor_rule."""
        resp = admin_client.post("/api/pois/", json={
            "name": "Sponsor Free Attempt",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "free",
            "is_sponsor": True,
            "sponsor_level": "state",
        })
        assert resp.status_code == 201, resp.text
        assert resp.json()["listing_type"] == "paid"


class TestListingTypeBehavior:
    @pytest.mark.parametrize("lt", ["free", "paid", "paid_founding", "community_comped"])
    def test_all_listing_types_accepted(self, admin_client, lt):
        resp = admin_client.post("/api/pois/", json={
            "name": f"{lt} Biz",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": lt,
        })
        assert resp.status_code == 201, resp.text
