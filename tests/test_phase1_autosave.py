"""Phase 1: PATCH /api/pois/{id}/autosave behavior."""
import pytest
from conftest import create_business


class TestAutosave:
    def test_partial_body_updates_single_field(self, admin_client):
        biz = create_business(admin_client, name="Autosave Biz")
        poi_id = biz["id"]
        resp = admin_client.patch(
            f"/api/pois/{poi_id}/autosave",
            json={"description_short": "hi"},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["status"] == "ok"
        assert body["id"] == poi_id
        assert "saved_at" in body

        got = admin_client.get(f"/api/pois/{poi_id}").json()
        assert got["description_short"] == "hi"
        assert got["name"] == "Autosave Biz"

    def test_id_in_body_silently_dropped(self, admin_client):
        biz = create_business(admin_client, name="Drop Id Biz")
        poi_id = biz["id"]
        resp = admin_client.patch(
            f"/api/pois/{poi_id}/autosave",
            json={"id": "00000000-0000-0000-0000-000000000000", "description_short": "x"},
        )
        assert resp.status_code == 200
        got = admin_client.get(f"/api/pois/{poi_id}").json()
        assert got["id"] == poi_id

    def test_has_been_published_cannot_be_set_via_autosave(self, admin_client):
        biz = create_business(admin_client, name="NoPub Biz")
        poi_id = biz["id"]
        assert biz.get("has_been_published") in (False, None)
        resp = admin_client.patch(
            f"/api/pois/{poi_id}/autosave",
            json={"has_been_published": True},
        )
        assert resp.status_code == 200
        got = admin_client.get(f"/api/pois/{poi_id}").json()
        assert got.get("has_been_published") in (False, None)

    def test_unknown_key_silently_dropped(self, admin_client):
        biz = create_business(admin_client, name="Bogus Biz")
        poi_id = biz["id"]
        resp = admin_client.patch(
            f"/api/pois/{poi_id}/autosave",
            json={"bogus_field": "zzz", "description_short": "ok"},
        )
        assert resp.status_code == 200
        got = admin_client.get(f"/api/pois/{poi_id}").json()
        assert got["description_short"] == "ok"
        assert "bogus_field" not in got

    def test_autosave_runs_phase1_computed(self, admin_client):
        biz = create_business(admin_client, name="Wifi Biz")
        poi_id = biz["id"]
        resp = admin_client.patch(
            f"/api/pois/{poi_id}/autosave",
            json={"wifi_options": ["Free Public Wifi"]},
        )
        assert resp.status_code == 200
        got = admin_client.get(f"/api/pois/{poi_id}").json()
        assert got.get("icon_free_wifi") is True
