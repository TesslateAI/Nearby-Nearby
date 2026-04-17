"""Phase 1: POST /api/utils/what3words-to-coords."""
import pytest
from app.core.config import settings


@pytest.fixture
def w3w_key(monkeypatch):
    monkeypatch.setattr(settings, "what3words_api_key", "test-key")
    yield "test-key"


class TestWhat3Words:
    def test_valid_words_returns_coords(self, admin_client, httpx_mock, w3w_key):
        httpx_mock.add_response(
            url="https://api.what3words.com/v3/convert-to-coordinates?words=filled.count.soap&key=test-key",
            json={
                "coordinates": {"lat": 51.5, "lng": -0.19},
                "nearestPlace": "London",
                "country": "GB",
                "words": "filled.count.soap",
            },
        )
        resp = admin_client.post(
            "/api/utils/what3words-to-coords",
            json={"words": "filled.count.soap"},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["latitude"] == 51.5
        assert body["longitude"] == -0.19
        assert body["nearest_place"] == "London"
        assert body["country"] == "GB"
        assert body["words"] == "filled.count.soap"

    def test_malformed_words_returns_400(self, admin_client, w3w_key):
        resp = admin_client.post(
            "/api/utils/what3words-to-coords",
            json={"words": "abc"},
        )
        assert resp.status_code == 422 or resp.status_code == 400

    def test_missing_api_key_returns_503(self, admin_client, monkeypatch):
        monkeypatch.setattr(settings, "what3words_api_key", None)
        resp = admin_client.post(
            "/api/utils/what3words-to-coords",
            json={"words": "filled.count.soap"},
        )
        assert resp.status_code == 503
        assert "what3words" in resp.json()["detail"].lower()

    def test_upstream_500_returns_502(self, admin_client, httpx_mock, w3w_key):
        httpx_mock.add_response(
            url="https://api.what3words.com/v3/convert-to-coordinates?words=filled.count.soap&key=test-key",
            status_code=500,
            json={"error": "boom"},
        )
        resp = admin_client.post(
            "/api/utils/what3words-to-coords",
            json={"words": "filled.count.soap"},
        )
        assert resp.status_code == 502
