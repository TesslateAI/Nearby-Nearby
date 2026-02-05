"""Tests for POI-to-POI relationships via admin API."""

import pytest
from conftest import create_business, create_event, create_trail, create_park


class TestCreateRelationship:
    def test_create_venue_relationship(self, admin_client):
        """Event → Business venue link."""
        biz = create_business(admin_client, name="Venue Biz")
        evt = create_event(admin_client, name="Event at Venue")

        resp = admin_client.post(
            "/api/relationships/",
            params={
                "source_poi_id": evt["id"],
                "target_poi_id": biz["id"],
                "relationship_type": "venue",
            },
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["source_poi_id"] == evt["id"]
        assert data["target_poi_id"] == biz["id"]
        assert data["relationship_type"] == "venue"

    def test_create_trail_in_park(self, admin_client):
        """Trail → Park relationship."""
        park = create_park(admin_client, name="Rel Park")
        trail = create_trail(admin_client, name="Rel Trail")

        resp = admin_client.post(
            "/api/relationships/",
            params={
                "source_poi_id": trail["id"],
                "target_poi_id": park["id"],
                "relationship_type": "trail_in_park",
            },
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["relationship_type"] == "trail_in_park"


class TestGetRelationships:
    def test_get_relationships(self, admin_client):
        """GET /api/relationships/{poi_id}."""
        biz = create_business(admin_client, name="Rel Get Biz")
        evt = create_event(admin_client, name="Rel Get Event")

        admin_client.post(
            "/api/relationships/",
            params={
                "source_poi_id": evt["id"],
                "target_poi_id": biz["id"],
                "relationship_type": "venue",
            },
        )

        resp = admin_client.get(f"/api/relationships/{evt['id']}")
        assert resp.status_code == 200
        rels = resp.json()
        assert len(rels) >= 1
        assert rels[0]["relationship_type"] == "venue"

    def test_get_related_pois(self, admin_client):
        """GET /api/pois/{poi_id}/related."""
        biz = create_business(admin_client, name="Related Biz")
        evt = create_event(admin_client, name="Related Event")

        admin_client.post(
            "/api/relationships/",
            params={
                "source_poi_id": evt["id"],
                "target_poi_id": biz["id"],
                "relationship_type": "venue",
            },
        )

        resp = admin_client.get(f"/api/pois/{evt['id']}/related")
        assert resp.status_code == 200
        related = resp.json()
        assert len(related) >= 1
        related_names = [r["name"] for r in related]
        assert "Related Biz" in related_names


class TestDeleteSourceCascades:
    def test_delete_source_cascades(self, admin_client):
        """Delete source POI, relationship removed."""
        biz = create_business(admin_client, name="Cascade Biz")
        evt = create_event(admin_client, name="Cascade Event")

        admin_client.post(
            "/api/relationships/",
            params={
                "source_poi_id": evt["id"],
                "target_poi_id": biz["id"],
                "relationship_type": "venue",
            },
        )

        # Delete source POI
        resp = admin_client.delete(f"/api/pois/{evt['id']}")
        assert resp.status_code == 200

        # Business should still exist
        resp = admin_client.get(f"/api/pois/{biz['id']}")
        assert resp.status_code == 200

        # Relationship should be gone (POI not found)
        resp = admin_client.get(f"/api/relationships/{evt['id']}")
        assert resp.status_code == 404


class TestInvalidRelationships:
    def test_self_relationship_fails(self, admin_client):
        """Cannot create relationship with itself."""
        biz = create_business(admin_client, name="Self Ref Biz")
        resp = admin_client.post(
            "/api/relationships/",
            params={
                "source_poi_id": biz["id"],
                "target_poi_id": biz["id"],
                "relationship_type": "related",
            },
        )
        assert resp.status_code == 400

    def test_invalid_relationship_type(self, admin_client):
        """Invalid relationship combination fails."""
        biz1 = create_business(admin_client, name="Invalid Rel Biz 1")
        biz2 = create_business(admin_client, name="Invalid Rel Biz 2")

        # Business → Business with 'venue' type is not valid
        resp = admin_client.post(
            "/api/relationships/",
            params={
                "source_poi_id": biz1["id"],
                "target_poi_id": biz2["id"],
                "relationship_type": "venue",
            },
        )
        assert resp.status_code == 400
