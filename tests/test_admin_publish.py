"""Tests for publication status lifecycle: draft → published → archived."""

import pytest
from conftest import create_business, publish_poi


class TestDefaultDraft:
    def test_default_draft(self, admin_client):
        """New POI has publication_status='draft'."""
        biz = create_business(admin_client, name="Draft Biz")
        assert biz["publication_status"] == "draft"


class TestDraftVisibility:
    def test_draft_not_in_public_list(self, admin_client):
        """Draft POI not in GET /api/pois/."""
        biz = create_business(admin_client, name="Hidden Draft")
        resp = admin_client.get("/api/pois/")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Hidden Draft" not in names

    def test_draft_in_admin_list(self, admin_client):
        """Draft POI in GET /api/admin/pois/."""
        biz = create_business(admin_client, name="Admin Visible Draft")
        resp = admin_client.get("/api/admin/pois/")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Admin Visible Draft" in names


class TestPublishPoi:
    def test_publish_poi(self, admin_client):
        """Update to published, verify in public list."""
        biz = create_business(admin_client, name="To Be Published")
        assert biz["publication_status"] == "draft"

        published = publish_poi(admin_client, biz["id"])
        assert published["publication_status"] == "published"

        resp = admin_client.get("/api/pois/")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "To Be Published" in names


class TestArchivePoi:
    def test_archive_poi(self, admin_client):
        """Update to archived, verify not in public list."""
        biz = create_business(admin_client, name="To Be Archived", published=True)
        resp = admin_client.put(
            f"/api/pois/{biz['id']}",
            json={"publication_status": "archived"},
        )
        assert resp.status_code == 200
        assert resp.json()["publication_status"] == "archived"

        # Not in public list
        resp = admin_client.get("/api/pois/")
        names = [p["name"] for p in resp.json()]
        assert "To Be Archived" not in names

        # Still in admin list
        resp = admin_client.get("/api/admin/pois/")
        names = [p["name"] for p in resp.json()]
        assert "To Be Archived" in names


class TestDraftSearchVisibility:
    def test_draft_not_in_public_search(self, admin_client):
        """GET /api/pois/search?q=name → empty for drafts."""
        biz = create_business(admin_client, name="Searchable Draft Biz")

        resp = admin_client.get("/api/pois/search", params={"q": "Searchable Draft"})
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Searchable Draft Biz" not in names

    def test_draft_in_admin_search(self, admin_client):
        """GET /api/admin/pois/search?q=name → found for drafts."""
        biz = create_business(admin_client, name="Admin Searchable Draft")

        resp = admin_client.get("/api/admin/pois/search", params={"q": "Admin Searchable"})
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Admin Searchable Draft" in names
