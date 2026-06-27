"""Issue #48 — Pet Policy 43-item list + simplified icon_pet_friendly logic.

These tests exercise the simplified `icon_pet_friendly` rule (Issue #48):
  - Empty `pet_options` -> False
  - Any non-empty `pet_options` -> True

The negatives-filter previously applied ("No Pets Allowed", "No Dogs Allowed", ...)
has been removed because the 43-item list itself no longer contains negative
items; the "Are pets allowed?" Yes/No gate is the single source of truth for
the "no pets" case.
"""

import pytest


def _create_business_with_pets(client, name, pet_options):
    payload = {
        "name": name,
        "poi_type": "BUSINESS",
        "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
        "business": {"price_range": "$$"},
        "pet_options": pet_options,
    }
    resp = client.post("/api/pois/", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestIconPetFriendly:
    def test_empty_pet_options_returns_false(self, admin_client):
        """An empty list yields icon_pet_friendly = False."""
        data = _create_business_with_pets(admin_client, "Empty Pets Biz", [])
        assert data["icon_pet_friendly"] is False

    def test_null_pet_options_returns_false(self, admin_client):
        """Null/omitted pet_options yields icon_pet_friendly = False."""
        payload = {
            "name": "No Pets Biz",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
        }
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 201, resp.text
        assert resp.json()["icon_pet_friendly"] is False

    def test_single_pet_option_returns_true(self, admin_client):
        """Any single new-list pet_option yields icon_pet_friendly = True."""
        data = _create_business_with_pets(
            admin_client, "Friendly Biz", ["Dogs Allowed"]
        )
        assert data["icon_pet_friendly"] is True

    def test_multiple_pet_options_returns_true(self, admin_client):
        """Multiple selections yield icon_pet_friendly = True."""
        data = _create_business_with_pets(
            admin_client,
            "Very Friendly Biz",
            [
                "Any Well Behaved Pet",
                "Pet Waste Bags Available",
                "Pet Relief Area",
            ],
        )
        assert data["icon_pet_friendly"] is True

    def test_new_list_items_persist(self, admin_client):
        """New 43-item-list values are accepted and persisted as-is."""
        chosen = [
            "Breed Restriction — see notes",
            "Leash Required — 6 Feet Maximum",
            "Vaccination Proof Required",
            "Wildlife Hazard Area — see notes",
        ]
        data = _create_business_with_pets(admin_client, "List Persistence Biz", chosen)
        assert data["pet_options"] == chosen
        assert data["icon_pet_friendly"] is True


class TestPetOptionsConstantContents:
    """The constant itself should match the Issue #48 spec exactly."""

    def test_pet_options_has_43_items_and_no_negatives(self):
        from shared.constants.field_options import PET_OPTIONS

        assert len(PET_OPTIONS) == 43
        # The negatives that used to live in the list are now gone — the
        # Yes/No gate handles "no pets" entirely.
        negatives = {
            "No Pets Allowed",
            "No Dogs Allowed",
            "No Cats Allowed",
            "Not Allowed",
            "No Dogs",
        }
        assert negatives.isdisjoint(set(PET_OPTIONS))
        # Spot-check a few of the new items.
        assert "Any Well Behaved Pet" in PET_OPTIONS
        assert "Dogs Allowed" in PET_OPTIONS
        assert "Vaccination Proof Required" in PET_OPTIONS
