"""Issue #51 — Event Sponsors require a tier in {Tier 1..Tier 5}.

Pydantic `@field_validator` on `EventBase.sponsors` rejects any sponsor that:
  - is missing the `tier` field
  - has a `tier` value not in {'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'}

Rejections return HTTP 422 with a clear message naming the offending sponsor
position (1-indexed).
"""

import pytest


def _event_payload(name, sponsors):
    return {
        "name": name,
        "poi_type": "EVENT",
        "location": {"type": "Point", "coordinates": [-79.3, 35.6]},
        "event": {
            "start_datetime": "2026-06-15T18:00:00Z",
            "sponsors": sponsors,
        },
    }


class TestSponsorTierValidation:
    def test_tier_1_through_5_accepted(self, admin_client):
        """Each of Tier 1..Tier 5 is accepted."""
        for tier in ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"]:
            payload = _event_payload(
                f"Event {tier}",
                [{"name": "Sponsor X", "tier": tier}],
            )
            resp = admin_client.post("/api/pois/", json=payload)
            assert resp.status_code == 201, (
                f"Tier {tier!r} should be accepted, got {resp.status_code}: {resp.text}"
            )
            sponsors = resp.json()["event"]["sponsors"]
            assert sponsors == [{"name": "Sponsor X", "tier": tier}]

    def test_legacy_tier_value_rejected(self, admin_client):
        """Legacy tier values (e.g., 'Gold') are rejected with 422."""
        payload = _event_payload(
            "Legacy Tier Event",
            [{"name": "Sponsor X", "tier": "Gold"}],
        )
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 422, resp.text
        assert "Gold" in resp.text or "invalid Tier" in resp.text

    def test_missing_tier_rejected(self, admin_client):
        """A sponsor with no `tier` key is rejected with 422."""
        payload = _event_payload(
            "Missing Tier Event",
            [{"name": "Sponsor X"}],
        )
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 422, resp.text
        assert "missing required Tier" in resp.text or "missing" in resp.text.lower()

    def test_empty_string_tier_rejected(self, admin_client):
        """A sponsor with `tier: ''` (the default initial value) is rejected."""
        payload = _event_payload(
            "Empty Tier Event",
            [{"name": "Sponsor X", "tier": ""}],
        )
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 422, resp.text

    def test_error_message_names_position(self, admin_client):
        """Multi-sponsor failure names the 1-indexed offending position."""
        payload = _event_payload(
            "Position Naming Event",
            [
                {"name": "Sponsor A", "tier": "Tier 1"},
                {"name": "Sponsor B", "tier": "Platinum"},  # invalid
            ],
        )
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 422, resp.text
        # The error message should reference position 2 (1-indexed).
        assert "position 2" in resp.text

    def test_no_sponsors_accepted(self, admin_client):
        """An event with no sponsors at all is still accepted."""
        payload = _event_payload("Sponsorless Event", [])
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 201, resp.text

        # Same goes for omitting the field entirely.
        payload2 = {
            "name": "No Sponsors Key",
            "poi_type": "EVENT",
            "location": {"type": "Point", "coordinates": [-79.3, 35.6]},
            "event": {"start_datetime": "2026-06-15T18:00:00Z"},
        }
        resp2 = admin_client.post("/api/pois/", json=payload2)
        assert resp2.status_code == 201, resp2.text
