"""Tests for Event POI CRUD operations via admin API."""

import pytest
from conftest import create_event


class TestCreateEventMinimal:
    def test_create_event_minimal(self, admin_client):
        """Minimal event with event: { start_datetime }."""
        data = create_event(admin_client, name="Minimal Event")
        assert data["name"] == "Minimal Event"
        assert data["poi_type"] == "EVENT"
        assert data["event"] is not None
        assert data["event"]["start_datetime"] is not None
        assert data["publication_status"] == "draft"


class TestCreateEventAllFields:
    def test_create_event_all_subtype_fields(self, admin_client):
        """All event subtype fields."""
        payload = {
            "name": "Full Event",
            "poi_type": "EVENT",
            "location": {"type": "Point", "coordinates": [-79.3, 35.6]},
            "description_long": "Annual summer festival with live music and food vendors.",
            "address_city": "Pittsboro",
            "cost": "$25",
            "pricing_details": "Kids under 5 free. VIP: $75",
            "ticket_link": "https://tickets.example.com/summer-fest",
            "event": {
                "start_datetime": "2026-07-04T10:00:00Z",
                "end_datetime": "2026-07-04T22:00:00Z",
                "is_repeating": False,
                "organizer_name": "Pittsboro Arts Council",
                "venue_settings": ["Outdoor", "Indoor"],
                "event_entry_notes": "Enter through main gate on Hillsboro St",
                "food_and_drink_info": "Local food trucks and beer garden on site",
                "coat_check_options": ["Available", "Free"],
                "has_vendors": True,
                "vendor_types": ["Food", "Crafts", "Art"],
                "vendor_application_deadline": "2026-06-01T23:59:59Z",
                "vendor_application_info": "Apply online at our website",
                "vendor_fee": "$150 per booth",
                "vendor_requirements": "Must have NC business license and liability insurance",
            },
        }

        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 201, resp.text
        data = resp.json()
        event = data["event"]
        assert event["organizer_name"] == "Pittsboro Arts Council"
        assert event["has_vendors"] is True
        assert event["vendor_types"] == ["Food", "Crafts", "Art"]
        assert event["venue_settings"] == ["Outdoor", "Indoor"]
        assert data["cost"] == "$25"
        assert data["ticket_link"] == "https://tickets.example.com/summer-fest"


class TestCreateEventRepeating:
    def test_create_event_repeating(self, admin_client):
        """Repeating event with repeat_pattern."""
        data = create_event(
            admin_client,
            name="Weekly Trivia",
            event={
                "start_datetime": "2026-03-05T19:00:00Z",
                "is_repeating": True,
                "repeat_pattern": {
                    "frequency": "weekly",
                    "days": ["thursday"],
                },
            },
        )
        event = data["event"]
        assert event["is_repeating"] is True
        assert event["repeat_pattern"]["frequency"] == "weekly"
        assert event["repeat_pattern"]["days"] == ["thursday"]


class TestCreateEventVendors:
    def test_create_event_vendors(self, admin_client):
        """Vendor-related fields."""
        data = create_event(
            admin_client,
            name="Vendor Event",
            event={
                "start_datetime": "2026-05-01T08:00:00Z",
                "has_vendors": True,
                "vendor_types": ["Food", "Crafts"],
                "vendor_application_deadline": "2026-04-15T23:59:59Z",
                "vendor_fee": "$100",
                "vendor_requirements": "Booth must be 10x10",
            },
        )
        event = data["event"]
        assert event["has_vendors"] is True
        assert event["vendor_types"] == ["Food", "Crafts"]
        assert event["vendor_fee"] == "$100"
        assert event["vendor_requirements"] == "Booth must be 10x10"


class TestCreateEventCostFields:
    def test_create_event_cost_fields(self, admin_client):
        """Cost, pricing_details, ticket_link on base POI."""
        data = create_event(
            admin_client,
            name="Paid Event",
            cost="$50",
            pricing_details="Early bird: $35 before June 1",
            ticket_link="https://tickets.example.com/paid",
        )
        assert data["cost"] == "$50"
        assert data["pricing_details"] == "Early bird: $35 before June 1"
        assert data["ticket_link"] == "https://tickets.example.com/paid"
