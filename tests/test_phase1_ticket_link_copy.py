"""Phase 1: ticket_links JSONB round-trip on events."""
from conftest import create_event


class TestTicketLinks:
    def test_ticket_links_roundtrip(self, admin_client):
        evt = create_event(
            admin_client,
            name="Ticketed Event",
            event={
                "start_datetime": "2026-06-15T18:00:00Z",
                "ticket_links": [
                    {"platform": "Tickets", "url": "https://example.com/tix"}
                ],
            },
        )
        got = admin_client.get(f"/api/pois/{evt['id']}").json()
        event_obj = got.get("event") or {}
        links = event_obj.get("ticket_links") or []
        assert isinstance(links, list)
        assert len(links) == 1
        assert links[0]["url"] == "https://example.com/tix"
        assert links[0]["platform"] == "Tickets"

    def test_ticket_links_empty_ok(self, admin_client):
        evt = create_event(admin_client, name="No Ticket Event")
        got = admin_client.get(f"/api/pois/{evt['id']}").json()
        event_obj = got.get("event") or {}
        # ticket_links may be None or [] — either is fine
        assert event_obj.get("ticket_links") in (None, [])
