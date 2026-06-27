"""Tests for Migration A (#33 and #34): deprecated column rename verification.

Verifies that:
- The original column names (public_transit_info, key_facilities) are NOT
  exposed on any API surface (create, read, list).
- CRUD operations still work without these fields (omitting them is fine).
- The API accepts payloads without these fields and responds with 201.
- The deprecated field names do not appear in any API response body.
"""

import pytest


class TestPublicTransitInfoNotExposed:
    """#33 — public_transit_info must not appear in API responses."""

    def test_create_business_without_public_transit_info(self, admin_client):
        """POST without public_transit_info field succeeds (field is gone)."""
        payload = {
            "name": "Transit Test Business",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.1, 35.7]},
            "publication_status": "draft",
            "parking_notes": "Street parking only",
            "business": {"price_range": "$$"},
        }
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert "public_transit_info" not in data, (
            "public_transit_info must not appear in admin API response after Migration A #33"
        )

    def test_public_transit_info_ignored_if_sent(self, admin_client):
        """If a client sends public_transit_info in POST, the API should either
        ignore it (extra fields) or accept the payload — it must NOT appear in
        the response."""
        payload = {
            "name": "Transit Ignore Test",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.1, 35.7]},
            "publication_status": "draft",
            "public_transit_info": "Bus route 5 stops nearby",  # legacy field
            "business": {"price_range": "$"},
        }
        resp = admin_client.post("/api/pois/", json=payload)
        # Accept 201 (ignored) or 422 (validation error for unknown field)
        assert resp.status_code in (201, 422), resp.text
        if resp.status_code == 201:
            data = resp.json()
            assert "public_transit_info" not in data, (
                "public_transit_info must not appear in response — column is deprecated"
            )

    def test_get_poi_does_not_expose_public_transit_info(self, admin_client):
        """GET /api/pois/{id} response must not include public_transit_info."""
        payload = {
            "name": "Transit Read Test",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.1, 35.7]},
            "publication_status": "draft",
            "business": {"price_range": "$$$"},
        }
        create_resp = admin_client.post("/api/pois/", json=payload)
        assert create_resp.status_code == 201, create_resp.text
        poi_id = create_resp.json()["id"]

        get_resp = admin_client.get(f"/api/pois/{poi_id}")
        assert get_resp.status_code == 200, get_resp.text
        data = get_resp.json()
        assert "public_transit_info" not in data, (
            "public_transit_info must not appear in GET response after Migration A #33"
        )

    def test_list_pois_does_not_expose_public_transit_info(self, admin_client):
        """GET /api/pois/ list response must not include public_transit_info."""
        payload = {
            "name": "Transit List Test",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.1, 35.7]},
            "publication_status": "draft",
            "business": {"price_range": "$"},
        }
        create_resp = admin_client.post("/api/pois/", json=payload)
        assert create_resp.status_code == 201, create_resp.text

        list_resp = admin_client.get("/api/pois/")
        assert list_resp.status_code == 200, list_resp.text
        items = list_resp.json()
        for item in items:
            assert "public_transit_info" not in item, (
                "public_transit_info must not appear in list response"
            )


class TestKeyFacilitiesNotExposed:
    """#34 — key_facilities must not appear in API responses."""

    def test_create_park_without_key_facilities(self, admin_client):
        """POST without key_facilities field succeeds (field is gone)."""
        payload = {
            "name": "Facilities Test Park",
            "poi_type": "PARK",
            "location": {"type": "Point", "coordinates": [-79.1, 35.7]},
            "publication_status": "draft",
            # wheelchair_accessible removed — column dropped (Issue #45 PR2 Migration B)
            "park": {"drone_usage_policy": "Not allowed"},
        }
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert "key_facilities" not in data, (
            "key_facilities must not appear in admin API response after Migration A #34"
        )

    def test_key_facilities_ignored_if_sent(self, admin_client):
        """If a client sends key_facilities in POST, the API should either
        ignore it (extra fields) or accept the payload — it must NOT appear in
        the response."""
        payload = {
            "name": "Facilities Ignore Test",
            "poi_type": "PARK",
            "location": {"type": "Point", "coordinates": [-79.1, 35.7]},
            "publication_status": "draft",
            "key_facilities": ["ATM", "Water Fountain"],  # legacy field
            "park": {"drone_usage_policy": "Not allowed"},
        }
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code in (201, 422), resp.text
        if resp.status_code == 201:
            data = resp.json()
            assert "key_facilities" not in data, (
                "key_facilities must not appear in response — column is deprecated"
            )

    def test_get_poi_does_not_expose_key_facilities(self, admin_client):
        """GET /api/pois/{id} response must not include key_facilities."""
        payload = {
            "name": "Facilities Read Test",
            "poi_type": "PARK",
            "location": {"type": "Point", "coordinates": [-79.1, 35.7]},
            "publication_status": "draft",
            "park": {"drone_usage_policy": "Not allowed"},
        }
        create_resp = admin_client.post("/api/pois/", json=payload)
        assert create_resp.status_code == 201, create_resp.text
        poi_id = create_resp.json()["id"]

        get_resp = admin_client.get(f"/api/pois/{poi_id}")
        assert get_resp.status_code == 200, get_resp.text
        data = get_resp.json()
        assert "key_facilities" not in data, (
            "key_facilities must not appear in GET response after Migration A #34"
        )

    def test_list_pois_does_not_expose_key_facilities(self, admin_client):
        """GET /api/pois/ list response must not include key_facilities."""
        payload = {
            "name": "Facilities List Test",
            "poi_type": "PARK",
            "location": {"type": "Point", "coordinates": [-79.1, 35.7]},
            "publication_status": "draft",
            "park": {"drone_usage_policy": "Not allowed"},
        }
        create_resp = admin_client.post("/api/pois/", json=payload)
        assert create_resp.status_code == 201, create_resp.text

        list_resp = admin_client.get("/api/pois/")
        assert list_resp.status_code == 200, list_resp.text
        items = list_resp.json()
        for item in items:
            assert "key_facilities" not in item, (
                "key_facilities must not appear in list response"
            )


class TestCRUDWithoutDeprecatedColumns:
    """Confirm that normal CRUD round-trips work fine after the removals."""

    def test_full_business_crud_without_deprecated_fields(self, admin_client):
        """Create, read, update, and delete a business without the removed fields."""
        create_payload = {
            "name": "CRUD Deprecation Test",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "publication_status": "draft",
            "parking_types": ["Street", "Lot"],
            "parking_notes": "Free parking in rear",
            "expect_to_pay_parking": "no",
            # wheelchair_accessible removed — column dropped (Issue #45 PR2 Migration B)
            "payment_methods": ["Cash", "Credit Card"],
            "business": {"price_range": "$$"},
        }
        create_resp = admin_client.post("/api/pois/", json=create_payload)
        assert create_resp.status_code == 201, create_resp.text
        data = create_resp.json()
        poi_id = data["id"]

        # Verify deprecated fields are absent
        assert "public_transit_info" not in data
        assert "key_facilities" not in data

        # Read
        get_resp = admin_client.get(f"/api/pois/{poi_id}")
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        assert "public_transit_info" not in get_data
        assert "key_facilities" not in get_data

        # Update
        update_payload = {**create_payload, "name": "CRUD Deprecation Test Updated"}
        put_resp = admin_client.put(f"/api/pois/{poi_id}", json=update_payload)
        assert put_resp.status_code == 200, put_resp.text
        put_data = put_resp.json()
        assert put_data["name"] == "CRUD Deprecation Test Updated"
        assert "public_transit_info" not in put_data
        assert "key_facilities" not in put_data

        # Delete
        del_resp = admin_client.delete(f"/api/pois/{poi_id}")
        assert del_resp.status_code in (200, 204), del_resp.text
