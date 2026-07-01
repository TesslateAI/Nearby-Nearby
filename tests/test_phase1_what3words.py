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

    def test_slash_prefix_is_accepted_and_stripped(self, admin_client, httpx_mock, w3w_key):
        # Users paste the canonical "///word.word.word" from what3words.com; the
        # backend must accept it and call the API with the bare form (issue #80).
        httpx_mock.add_response(
            url="https://api.what3words.com/v3/convert-to-coordinates?words=filled.count.soap&key=test-key",
            json={
                "coordinates": {"lat": 51.5, "lng": -0.19},
                "words": "filled.count.soap",
            },
        )
        resp = admin_client.post(
            "/api/utils/what3words-to-coords",
            json={"words": "///filled.count.soap"},
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["words"] == "filled.count.soap"

    def test_malformed_words_returns_400(self, admin_client, w3w_key):
        resp = admin_client.post(
            "/api/utils/what3words-to-coords",
            json={"words": "abc"},
        )
        assert resp.status_code == 422 or resp.status_code == 400

    def test_quota_exceeded_returns_402_with_upgrade_hint(self, admin_client, httpx_mock, w3w_key):
        # Free plan / exhausted quota -> 402 QuotaExceeded. Surface a clear,
        # actionable message instead of an opaque 502 (issue #80, bugs #1/#3).
        httpx_mock.add_response(
            url="https://api.what3words.com/v3/convert-to-coordinates?words=filled.count.soap&key=test-key",
            status_code=402,
            json={"error": {"code": "QuotaExceeded", "message": "Quota exceeded or API plan does not have access to this feature."}},
        )
        resp = admin_client.post(
            "/api/utils/what3words-to-coords",
            json={"words": "filled.count.soap"},
        )
        assert resp.status_code == 402, resp.text
        detail = resp.json()["detail"].lower()
        assert "plan" in detail and "upgrade" in detail

    def test_invalid_key_returns_502_with_key_hint(self, admin_client, httpx_mock, w3w_key):
        httpx_mock.add_response(
            url="https://api.what3words.com/v3/convert-to-coordinates?words=filled.count.soap&key=test-key",
            status_code=401,
            json={"error": {"code": "InvalidKey", "message": "Authentication failed; invalid API key"}},
        )
        resp = admin_client.post(
            "/api/utils/what3words-to-coords",
            json={"words": "filled.count.soap"},
        )
        assert resp.status_code == 502, resp.text
        assert "key" in resp.json()["detail"].lower()

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
