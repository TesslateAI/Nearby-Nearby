"""Phase 1: DELETE refuses when has_been_published=true; archive allowed."""
import uuid
from conftest import create_business
from app.models.poi import PointOfInterest


class TestDeleteRefusal:
    def test_delete_unpublished_works(self, admin_client):
        biz = create_business(admin_client, name="Deletable")
        poi_id = biz["id"]
        resp = admin_client.delete(f"/api/pois/{poi_id}")
        assert resp.status_code in (200, 204)
        assert admin_client.get(f"/api/pois/{poi_id}").status_code == 404

    def test_delete_published_returns_409_archive(self, admin_client, db_session):
        biz = create_business(admin_client, name="Published Biz")
        poi_id = biz["id"]

        # Mark as has_been_published directly on the ORM row
        poi = db_session.query(PointOfInterest).filter(
            PointOfInterest.id == uuid.UUID(poi_id)
        ).first()
        poi.has_been_published = True
        db_session.commit()

        resp = admin_client.delete(f"/api/pois/{poi_id}")
        assert resp.status_code == 409
        body = resp.json()
        # FastAPI wraps dict detail in {"detail": {...}}
        detail = body.get("detail", body)
        assert detail.get("action") == "archive"

        # POI still exists
        assert admin_client.get(f"/api/pois/{poi_id}").status_code == 200

    def test_archive_works_after_refusal(self, admin_client, db_session):
        biz = create_business(admin_client, name="Archive Me")
        poi_id = biz["id"]
        poi = db_session.query(PointOfInterest).filter(
            PointOfInterest.id == uuid.UUID(poi_id)
        ).first()
        poi.has_been_published = True
        db_session.commit()

        # Refusal
        assert admin_client.delete(f"/api/pois/{poi_id}").status_code == 409

        # Archive via PUT
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={"publication_status": "archived"},
        )
        assert resp.status_code == 200
        assert resp.json()["publication_status"] == "archived"
