"""
Tests for Tasks 17-41 (Admin Panel Features & Fixes Batch 2).

FAILING TESTS (require implementation):
- TestShortDescriptionLimit: Task 24 — 250-char visible text limit on description_short
- TestFreeBizCategoryLimit: Task 25 — Free business limited to 1 category
- TestMultiplePlaygrounds: Tasks 19/38 — playground_location accepts list of objects

VERIFICATION TESTS (already-working features):
- TestArticleLinksTitle: Task 21 — article_links with title+url round-trips
- TestLogoUploadFreeBiz: Task 22 — free business creation works (basic)
- TestRentalPhotos: Task 41 — rental fields round-trip
- TestTrailHeadExitMaxCount: Tasks 33/34 — trail_head/trail_exit max_count = 10
"""
import pytest
from conftest import (
    create_business, create_park, create_trail, create_event,
    create_category,
)


# =========================================================================
# Task 24: Short Description 250-Char Validator
# =========================================================================

class TestShortDescriptionLimit:
    """description_short must be ≤250 visible characters (HTML stripped)."""

    def test_accepts_short_visible_text(self, admin_client):
        """Visible text under 250 chars should succeed even with HTML tags."""
        short_html = "<p>A cozy cafe in downtown Pittsboro serving craft coffee.</p>"
        poi = create_business(
            admin_client, name="Short Desc Biz",
            description_short=short_html,
        )
        assert poi["description_short"] == short_html

    def test_rejects_over_250_visible_chars(self, admin_client):
        """Visible text over 250 chars should be rejected (422)."""
        long_text = "A" * 260
        long_html = f"<p>{long_text}</p>"
        resp = admin_client.post("/api/pois/", json={
            "name": "Long Desc Biz",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "description_short": long_html,
        })
        assert resp.status_code == 422, f"Expected 422, got {resp.status_code}: {resp.text}"

    def test_exactly_250_visible_chars(self, admin_client):
        """Exactly 250 visible chars should pass."""
        text_250 = "X" * 250
        html = f"<p>{text_250}</p>"
        poi = create_business(
            admin_client, name="Exact 250 Biz",
            description_short=html,
        )
        assert poi["description_short"] == html

    def test_html_tags_not_counted(self, admin_client):
        """HTML markup should not count toward the 250-char limit."""
        # 200 visible chars + lots of HTML tags
        visible = "A" * 200
        html = f'<p><strong><em>{visible}</em></strong></p>'
        poi = create_business(
            admin_client, name="HTML Desc Biz",
            description_short=html,
        )
        assert "A" * 200 in poi["description_short"]

    def test_rejects_on_update_too(self, admin_client):
        """description_short validation should also apply on PUT (update)."""
        poi = create_business(admin_client, name="Update Desc Biz")
        poi_id = poi["id"]
        long_text = "B" * 260
        resp = admin_client.put(f"/api/pois/{poi_id}", json={
            "description_short": f"<p>{long_text}</p>",
        })
        assert resp.status_code == 422


# =========================================================================
# Task 25: Free Business Category Limit (Backend)
# =========================================================================

class TestFreeBizCategoryLimit:
    """Free business listings limited to 1 secondary category."""

    def test_free_biz_allows_1_category(self, admin_client):
        """Free business with 1 category should succeed."""
        cat = create_category(admin_client, name="Cat1 for FreeBiz")
        poi = create_business(
            admin_client, name="1Cat FreeBiz",
            listing_type="free",
            category_ids=[cat["id"]],
        )
        assert poi is not None

    def test_free_biz_rejects_2_categories(self, admin_client):
        """Free business with 2 categories should be rejected (400)."""
        cat1 = create_category(admin_client, name="Cat1")
        cat2 = create_category(admin_client, name="Cat2")
        resp = admin_client.post("/api/pois/", json={
            "name": "2Cat FreeBiz",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "listing_type": "free",
            "category_ids": [cat1["id"], cat2["id"]],
        })
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"

    def test_paid_biz_allows_multiple_categories(self, admin_client):
        """Paid business with multiple categories should succeed."""
        cat1 = create_category(admin_client, name="PaidCat1")
        cat2 = create_category(admin_client, name="PaidCat2")
        poi = create_business(
            admin_client, name="MultiCat PaidBiz",
            listing_type="paid",
            category_ids=[cat1["id"], cat2["id"]],
        )
        assert poi is not None

    def test_free_biz_rejects_2_categories_on_update(self, admin_client):
        """Free business update with 2 categories should be rejected (400)."""
        cat1 = create_category(admin_client, name="UpdCat1")
        cat2 = create_category(admin_client, name="UpdCat2")
        poi = create_business(
            admin_client, name="Upd FreeBiz",
            listing_type="free",
            category_ids=[cat1["id"]],
        )
        poi_id = poi["id"]
        resp = admin_client.put(f"/api/pois/{poi_id}", json={
            "category_ids": [cat1["id"], cat2["id"]],
        })
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"

    def test_free_park_allows_multiple_categories(self, admin_client):
        """Free park with multiple categories should succeed (limit is business-only)."""
        cat1 = create_category(admin_client, name="ParkCat1")
        cat2 = create_category(admin_client, name="ParkCat2")
        poi = create_park(
            admin_client, name="MultiCat Park",
            category_ids=[cat1["id"], cat2["id"]],
        )
        assert poi is not None


# =========================================================================
# Tasks 19/38: Multiple Playgrounds (playground_location accepts list)
# =========================================================================

class TestMultiplePlaygrounds:
    """playground_location JSONB field should accept a list of playground objects."""

    def test_single_playground_dict_still_works(self, admin_client):
        """Old format (single dict) should still be accepted."""
        loc = {"lat": 35.72, "lng": -79.18}
        poi = create_park(
            admin_client, name="Single Playground Park",
            playground_available=True,
            playground_location=loc,
        )
        assert poi["playground_location"] is not None

    def test_multiple_playgrounds_as_list(self, admin_client):
        """New format (list of dicts) should be accepted."""
        locs = [
            {"lat": 35.72, "lng": -79.18, "types": ["Swings"], "surfaces": ["Rubber"], "notes": "Main playground"},
            {"lat": 35.73, "lng": -79.19, "types": ["Slides"], "surfaces": ["Sand"], "notes": "Toddler area"},
        ]
        poi = create_park(
            admin_client, name="Multi Playground Park",
            playground_available=True,
            playground_location=locs,
        )
        result = poi["playground_location"]
        assert isinstance(result, list), f"Expected list, got {type(result)}"
        assert len(result) == 2
        assert result[0]["lat"] == 35.72
        assert result[1]["notes"] == "Toddler area"

    def test_multiple_playgrounds_round_trip(self, admin_client):
        """Create with list, update with different list, read back."""
        locs1 = [{"lat": 35.72, "lng": -79.18, "notes": "First"}]
        poi = create_park(
            admin_client, name="RT Playground Park",
            playground_available=True,
            playground_location=locs1,
        )
        poi_id = poi["id"]

        locs2 = [
            {"lat": 35.80, "lng": -79.20, "notes": "Updated First"},
            {"lat": 35.81, "lng": -79.21, "notes": "New Second"},
        ]
        resp = admin_client.put(f"/api/pois/{poi_id}", json={
            "playground_location": locs2,
        })
        assert resp.status_code == 200
        result = resp.json()["playground_location"]
        assert isinstance(result, list)
        assert len(result) == 2
        assert result[0]["notes"] == "Updated First"


# =========================================================================
# Task 21: Article Links Custom Title (VERIFICATION — already done)
# =========================================================================

class TestArticleLinksTitle:
    """article_links with title + url should round-trip."""

    def test_create_with_titled_article_links(self, admin_client):
        links = [
            {"title": "Featured in Local News", "url": "https://news.example.com/article"},
            {"title": "Community Spotlight", "url": "https://blog.example.com/spotlight"},
        ]
        poi = create_business(
            admin_client, name="Article Biz",
            article_links=links,
        )
        assert len(poi["article_links"]) == 2
        assert poi["article_links"][0]["title"] == "Featured in Local News"
        assert poi["article_links"][1]["url"] == "https://blog.example.com/spotlight"

    def test_update_article_links(self, admin_client):
        poi = create_business(admin_client, name="Upd Article Biz")
        poi_id = poi["id"]
        links = [{"title": "New Article", "url": "https://new.example.com"}]
        resp = admin_client.put(f"/api/pois/{poi_id}", json={"article_links": links})
        assert resp.status_code == 200
        assert resp.json()["article_links"][0]["title"] == "New Article"


# =========================================================================
# Task 22: Logo Upload Free Business (VERIFICATION — basic smoke test)
# =========================================================================

class TestLogoUploadFreeBiz:
    """Free business creation should work with all basic fields."""

    def test_create_free_business(self, admin_client):
        poi = create_business(
            admin_client, name="Free Logo Biz",
            listing_type="free",
            description_short="<p>A short description</p>",
        )
        assert poi["listing_type"] == "free"
        assert poi["poi_type"] == "BUSINESS"
        assert poi["description_short"] == "<p>A short description</p>"


# =========================================================================
# Task 41: Rental Photos (VERIFICATION — rental fields round-trip)
# =========================================================================

class TestRentalFields:
    """Rental-related fields should round-trip via API."""

    def test_rental_fields_on_park(self, admin_client):
        poi = create_park(
            admin_client, name="Rental Park",
            available_for_rent=True,
            rental_info="<p>Pavilion available</p>",
            rental_link="https://reserve.example.com",
        )
        assert poi["available_for_rent"] is True
        assert poi["rental_info"] == "<p>Pavilion available</p>"
        assert poi["rental_link"] == "https://reserve.example.com"

    def test_rental_fields_on_trail(self, admin_client):
        poi = create_trail(
            admin_client, name="Rental Trail",
            available_for_rent=True,
            rental_info="<p>Bike rental available</p>",
        )
        assert poi["available_for_rent"] is True


# =========================================================================
# Tasks 33/34: Trail Head/Exit Photo Max Count (Backend verification)
# =========================================================================

class TestTrailHeadExitMaxCount:
    """IMAGE_TYPE_CONFIG should have max_count=10 for trail_head and trail_exit."""

    def test_trail_head_max_count(self):
        from app.models.image import IMAGE_TYPE_CONFIG
        from shared.models.enums import ImageType
        assert IMAGE_TYPE_CONFIG[ImageType.trail_head]["max_count"] == 10

    def test_trail_exit_max_count(self):
        from app.models.image import IMAGE_TYPE_CONFIG
        from shared.models.enums import ImageType
        assert IMAGE_TYPE_CONFIG[ImageType.trail_exit]["max_count"] == 10
