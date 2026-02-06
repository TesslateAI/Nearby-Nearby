"""
Cross-app integration tests.

Data is created directly via SQLAlchemy ORM (admin models imported at
conftest module level), then read via the nearby-app TestClient.
This avoids the sys.modules collision between admin and app backends
that both use the ``app.*`` namespace.

Only ``app_client`` is used here — no ``admin_client`` needed.
"""

import pytest
from datetime import datetime, timezone
from conftest import (
    orm_create_business,
    orm_create_park,
    orm_create_trail,
    orm_create_event,
    orm_create_category,
    orm_assign_main_category,
    orm_publish_poi,
)


class TestAdminCreateAppRead:
    def test_admin_create_app_read(self, db_session, app_client):
        """Create full business via ORM (published), read via app GET /api/pois/{id}."""
        poi = orm_create_business(
            db_session,
            name="Crossapp Cafe",
            description_long="A wonderful crossapp cafe",
            phone_number="919-555-0001",
            address_city="Pittsboro",
            address_state="NC",
            published=True,
        )
        db_session.commit()
        poi_id = str(poi.id)

        resp = app_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["name"] == "Crossapp Cafe"
        assert data["description_long"] == "A wonderful crossapp cafe"
        assert data["phone_number"] == "919-555-0001"
        assert data["address_city"] == "Pittsboro"


class TestDraftNotVisibleToApp:
    def test_draft_not_visible_to_app(self, db_session, app_client):
        """Create draft via ORM, app GET /api/pois/{id} → 404."""
        poi = orm_create_business(db_session, name="Draft Only Biz", published=False)
        db_session.commit()

        resp = app_client.get(f"/api/pois/{str(poi.id)}")
        assert resp.status_code == 404


class TestPublishThenAppReads:
    def test_publish_then_app_reads(self, db_session, app_client):
        """Create draft → verify hidden → publish → app reads successfully."""
        poi = orm_create_business(db_session, name="Publish Then Read", published=False)
        db_session.commit()

        # Draft not visible
        resp = app_client.get(f"/api/pois/{str(poi.id)}")
        assert resp.status_code == 404

        # Publish
        orm_publish_poi(db_session, poi)
        db_session.commit()

        # Now visible
        resp = app_client.get(f"/api/pois/{str(poi.id)}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Publish Then Read"


class TestAppSearchFindsPublished:
    def test_app_search_finds_published(self, db_session, app_client):
        """Create published POI, app GET /api/pois/search?q=name → found."""
        orm_create_business(
            db_session,
            name="Searchable Crossapp Biz",
            published=True,
        )
        db_session.commit()

        resp = app_client.get("/api/pois/search", params={"q": "Searchable Crossapp"})
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Searchable Crossapp Biz" in names


class TestAppNearby:
    def test_app_nearby(self, db_session, app_client):
        """Create 2 nearby published POIs, app GET /api/pois/{id}/nearby → other POI returned."""
        poi1 = orm_create_business(
            db_session,
            name="Nearby POI 1",
            location="POINT(-79.0 35.8)",
            published=True,
        )
        poi2 = orm_create_business(
            db_session,
            name="Nearby POI 2",
            location="POINT(-79.001 35.801)",
            published=True,
        )
        db_session.commit()

        resp = app_client.get(
            f"/api/pois/{str(poi1.id)}/nearby",
            params={"radius_miles": "10"},
        )
        assert resp.status_code == 200
        nearby = resp.json()
        nearby_names = [p["name"] for p in nearby]
        assert "Nearby POI 2" in nearby_names


class TestAppBySlug:
    def test_app_by_slug(self, db_session, app_client):
        """Create POI, app GET /api/pois/by-slug/{slug} → found."""
        poi = orm_create_business(
            db_session,
            name="Slug Test Biz",
            address_city="Durham",
            slug="slug-test-biz-durham",
            published=True,
        )
        db_session.commit()

        resp = app_client.get("/api/pois/by-slug/slug-test-biz-durham")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Slug Test Biz"


class TestAppByType:
    def test_app_by_type(self, db_session, app_client):
        """Create BUSINESS, app GET /api/pois/by-type/BUSINESS → found."""
        orm_create_business(db_session, name="Type Test Biz", published=True)
        db_session.commit()

        resp = app_client.get("/api/pois/by-type/BUSINESS")
        assert resp.status_code == 200
        results = resp.json()
        names = [r["name"] for r in results]
        assert "Type Test Biz" in names


class TestAppReadsAllFieldTypes:
    def test_app_reads_all_field_types(self, db_session, app_client):
        """Create POI with JSONB, lists, strings, booleans, subtype — verify via app."""
        poi = orm_create_business(
            db_session,
            name="All Fields Biz",
            description_long="Full description",
            phone_number="919-000-1111",
            hours={"monday": {"open": "09:00", "close": "17:00"}},
            amenities={"wifi": True},
            parking_types=["Lot"],
            is_verified=True,
            available_for_rent=True,
            price_range="$$$",
            published=True,
        )
        db_session.commit()

        resp = app_client.get(f"/api/pois/{str(poi.id)}")
        assert resp.status_code == 200
        data = resp.json()
        # Strings
        assert data["name"] == "All Fields Biz"
        assert data["description_long"] == "Full description"
        assert data["phone_number"] == "919-000-1111"
        # JSONB
        assert data["hours"]["monday"]["open"] == "09:00"
        assert data["amenities"]["wifi"] is True
        # Lists
        assert data["parking_types"] == ["Lot"]
        # Booleans
        assert data["is_verified"] is True
        assert data["available_for_rent"] is True
        # Subtype
        assert data["business"]["price_range"] == "$$$"


class TestAppReadsTrailSubtype:
    def test_app_reads_trail_subtype(self, db_session, app_client):
        """Trail fields visible to app."""
        poi = orm_create_trail(
            db_session,
            name="App Trail",
            trail_fields={
                "length_text": "3 miles",
                "difficulty": "moderate",
                "route_type": "loop",
            },
            published=True,
        )
        db_session.commit()

        resp = app_client.get(f"/api/pois/{str(poi.id)}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["trail"]["length_text"] == "3 miles"
        assert data["trail"]["difficulty"] == "moderate"
        assert data["trail"]["route_type"] == "loop"


class TestAppReadsEventSubtype:
    def test_app_reads_event_subtype(self, db_session, app_client):
        """Event fields visible to app."""
        poi = orm_create_event(
            db_session,
            name="App Event",
            event_fields={
                "start_datetime": datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc),
                "end_datetime": datetime(2026, 8, 1, 18, 0, 0, tzinfo=timezone.utc),
            },
            published=True,
        )
        db_session.commit()

        resp = app_client.get(f"/api/pois/{str(poi.id)}")
        assert resp.status_code == 200
        data = resp.json()
        assert "2026-08-01" in data["event"]["start_datetime"]
        assert data["event"]["end_datetime"] is not None


class TestAdminUpdateAppRereads:
    def test_admin_update_app_rereads(self, db_session, app_client):
        """Create → app reads → update via ORM → app reads again → verify changes."""
        poi = orm_create_business(
            db_session,
            name="Update Reread Biz",
            phone_number="919-111-1111",
            published=True,
        )
        db_session.commit()

        # App reads original
        resp = app_client.get(f"/api/pois/{str(poi.id)}")
        assert resp.status_code == 200
        assert resp.json()["phone_number"] == "919-111-1111"

        # Update directly via ORM
        poi.phone_number = "919-222-2222"
        db_session.commit()

        # App reads updated
        resp = app_client.get(f"/api/pois/{str(poi.id)}")
        assert resp.status_code == 200
        assert resp.json()["phone_number"] == "919-222-2222"


class TestAppNearbyByCoordinates:
    def test_app_nearby_by_coordinates(self, db_session, app_client):
        """App GET /api/nearby?latitude=X&longitude=Y → nearest POIs."""
        orm_create_business(
            db_session,
            name="Coord Nearby Biz",
            location="POINT(-79.0 35.8)",
            published=True,
        )
        db_session.commit()

        resp = app_client.get(
            "/api/nearby",
            params={"latitude": "35.8", "longitude": "-79.0"},
        )
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) >= 1
        names = [r["name"] for r in results]
        assert "Coord Nearby Biz" in names


class TestAppCategories:
    def test_app_categories(self, db_session, app_client):
        """Create category + assign to published POI, app GET /api/categories → category with count."""
        cat = orm_create_category(db_session, name="Crossapp Cat")
        poi = orm_create_business(db_session, name="Cat Biz", published=True)
        orm_assign_main_category(db_session, poi.id, cat.id)
        db_session.commit()

        resp = app_client.get("/api/categories")
        assert resp.status_code == 200
        categories = resp.json()
        cat_entry = next((c for c in categories if c["name"] == "Crossapp Cat"), None)
        assert cat_entry is not None
        assert cat_entry["poi_count"] >= 1


class TestHybridSearchAPI:
    def test_hybrid_search_returns_results(self, db_session, app_client):
        """hybrid-search endpoint returns matches for a known name."""
        orm_create_business(db_session, name="Hybrid Search Cafe", published=True)
        db_session.commit()

        resp = app_client.get("/api/pois/hybrid-search", params={"q": "Hybrid Search Cafe"})
        assert resp.status_code == 200
        names = [r["name"] for r in resp.json()]
        assert "Hybrid Search Cafe" in names

    def test_hybrid_search_poi_type_filter(self, db_session, app_client):
        """poi_type param filters results to that type only."""
        orm_create_business(db_session, name="Filter Biz", published=True)
        orm_create_park(db_session, name="Filter Park", published=True)
        db_session.commit()

        resp = app_client.get(
            "/api/pois/hybrid-search",
            params={"q": "Filter", "poi_type": "BUSINESS"},
        )
        assert resp.status_code == 200
        types = [r["poi_type"] for r in resp.json()]
        assert all(t == "BUSINESS" for t in types)

    def test_hybrid_search_poi_type_invalid(self, db_session, app_client):
        """Invalid poi_type handled gracefully (returns empty, no crash)."""
        resp = app_client.get(
            "/api/pois/hybrid-search",
            params={"q": "test", "poi_type": "INVALID_TYPE"},
        )
        assert resp.status_code == 200
        assert resp.json() == []
