"""
Tests for Task 47: food_and_drink_info field on events.
The field already exists in admin backend — these tests verify it's stored,
updated, and exposed in the app-side API response.
"""
import pytest
from conftest import (
    create_event, publish_poi,
    orm_create_event, orm_publish_poi,
)


class TestEventFoodAndDrink:
    """Task 47: food_and_drink_info stored and visible."""

    def test_food_and_drink_info_stored(self, admin_client):
        """food_and_drink_info is stored and returned in admin API."""
        poi = create_event(
            admin_client, "Food Fest",
            event={"start_datetime": "2026-06-15T18:00:00Z",
                   "food_and_drink_info": "BBQ plates, lemonade, BYOB allowed"},
        )
        assert poi["event"]["food_and_drink_info"] == "BBQ plates, lemonade, BYOB allowed"

    def test_food_and_drink_info_update(self, admin_client):
        """food_and_drink_info can be updated."""
        poi = create_event(admin_client, "Drink Fest")
        resp = admin_client.put(
            f"/api/pois/{poi['id']}",
            json={"event": {"food_and_drink_info": "Free water, food trucks on site"}},
        )
        assert resp.status_code == 200
        assert resp.json()["event"]["food_and_drink_info"] == "Free water, food trucks on site"

    def test_food_and_drink_info_in_app_response(self, db_session, app_client):
        """food_and_drink_info visible in public app API response."""
        poi = orm_create_event(
            db_session, "Public Food Fest", published=True,
            event_fields={"food_and_drink_info": "Local vendors, no outside food"},
        )
        db_session.commit()

        resp = app_client.get(f"/api/pois/{poi.id}")
        assert resp.status_code == 200
        data = resp.json()
        # The event sub-object should include food_and_drink_info
        assert data["event"]["food_and_drink_info"] == "Local vendors, no outside food"
