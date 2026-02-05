"""Tests for search endpoints via admin API."""

import pytest
from conftest import create_business


class TestPublicSearch:
    def test_public_search_by_name(self, admin_client):
        """Search published POI by name."""
        create_business(admin_client, name="Sunrise Bakery", published=True)

        resp = admin_client.get("/api/pois/search", params={"q": "Sunrise Bakery"})
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Sunrise Bakery" in names

    def test_public_search_excludes_drafts(self, admin_client):
        """Draft POI not in public search."""
        create_business(admin_client, name="Draft Bakery")

        resp = admin_client.get("/api/pois/search", params={"q": "Draft Bakery"})
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Draft Bakery" not in names


class TestAdminSearch:
    def test_admin_search_includes_drafts(self, admin_client):
        """Draft POI in admin search."""
        create_business(admin_client, name="Admin Draft Find")

        resp = admin_client.get("/api/admin/pois/search", params={"q": "Admin Draft"})
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Admin Draft Find" in names


class TestSearchByLocation:
    def test_search_by_location(self, admin_client):
        """Search by city name."""
        create_business(
            admin_client,
            name="Location Search Biz",
            address_city="Pittsboro",
            published=True,
        )

        resp = admin_client.get(
            "/api/pois/search-by-location",
            params={"q": "Pittsboro"},
        )
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) >= 1


class TestSearchValidation:
    def test_search_min_length(self, admin_client):
        """q < 3 chars → 422."""
        resp = admin_client.get("/api/pois/search", params={"q": "ab"})
        assert resp.status_code == 422


class TestSearchByDescription:
    def test_search_by_description(self, admin_client):
        """Match on description_long."""
        create_business(
            admin_client,
            name="Desc Search Biz",
            description_long="Unique handcrafted artisanal pottery studio",
            published=True,
        )

        resp = admin_client.get(
            "/api/pois/search",
            params={"q": "artisanal pottery"},
        )
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Desc Search Biz" in names
