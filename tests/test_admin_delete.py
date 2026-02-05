"""Tests for deleting POIs via admin API."""

import uuid
import pytest
from conftest import create_business, create_event, create_category


class TestDeletePoi:
    def test_delete_poi(self, admin_client):
        """DELETE → 200, then GET → 404."""
        biz = create_business(admin_client, name="To Delete")
        poi_id = biz["id"]

        resp = admin_client.delete(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "To Delete"

        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 404


class TestDeleteCascadesRelationships:
    def test_delete_cascades_relationships(self, admin_client):
        """POI with relationships, delete POI, verify relationships gone."""
        biz = create_business(admin_client, name="Venue Biz")
        evt = create_event(admin_client, name="Event at Venue")

        # Create venue relationship
        resp = admin_client.post(
            "/api/relationships/",
            params={
                "source_poi_id": evt["id"],
                "target_poi_id": biz["id"],
                "relationship_type": "venue",
            },
        )
        assert resp.status_code == 201

        # Verify relationship exists
        resp = admin_client.get(f"/api/relationships/{evt['id']}")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

        # Delete the event
        resp = admin_client.delete(f"/api/pois/{evt['id']}")
        assert resp.status_code == 200

        # Verify venue biz still exists
        resp = admin_client.get(f"/api/pois/{biz['id']}")
        assert resp.status_code == 200

        # Relationships for the deleted POI should be gone
        # (attempting to query relationships for deleted POI gives 404)
        resp = admin_client.get(f"/api/relationships/{evt['id']}")
        assert resp.status_code == 404


class TestDeletePreservesCategories:
    def test_delete_preserves_categories(self, admin_client):
        """Delete POI, verify categories still exist."""
        cat = create_category(admin_client, name="Preserved Cat")
        biz = create_business(
            admin_client,
            name="Biz With Cat",
            main_category_id=cat["id"],
        )

        # Delete POI
        resp = admin_client.delete(f"/api/pois/{biz['id']}")
        assert resp.status_code == 200

        # Category should still exist
        resp = admin_client.get(f"/api/categories/{cat['id']}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Preserved Cat"


class TestDeleteNonexistent:
    def test_delete_nonexistent(self, admin_client):
        """DELETE → 404."""
        fake_id = str(uuid.uuid4())
        resp = admin_client.delete(f"/api/pois/{fake_id}")
        assert resp.status_code == 404
