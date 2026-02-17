"""
Tests for new POI fields and validators:
- Teaser paragraph 120 visible-char limit (strip HTML)
- lat_long_most_accurate boolean flag
- alcohol_policy_details text field
- Playground location lat/lng
- Parking locations lat/lng (verification)
- Restroom locations lat/lng + description (verification)
"""
import pytest
from conftest import create_business, create_park, create_event


# -------------------------------------------------------------------------
# Teaser paragraph validation
# -------------------------------------------------------------------------

class TestTeaserParagraphLimit:
    def test_teaser_accepts_short_visible_text(self, admin_client):
        """Visible text under 120 chars should succeed even with HTML tags."""
        short_html = "<p>A cozy cafe in downtown Pittsboro.</p>"
        poi = create_business(admin_client, name="Short Teaser Biz", teaser_paragraph=short_html)
        assert poi["teaser_paragraph"] == short_html

    def test_teaser_rejects_over_120_visible_chars(self, admin_client):
        """Visible text over 120 chars should be rejected (422)."""
        # 130 visible characters
        long_text = "A" * 130
        long_html = f"<p>{long_text}</p>"
        resp = admin_client.post("/api/pois/", json={
            "name": "Long Teaser Biz",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            "teaser_paragraph": long_html,
        })
        assert resp.status_code == 422, f"Expected 422, got {resp.status_code}: {resp.text}"

    def test_teaser_allows_html_heavy_short_text(self, admin_client):
        """HTML markup should not count toward the 120-char limit."""
        html = '<p><strong><em>Bold italic</em></strong> text with <a href="https://example.com">a link</a></p>'
        # visible text: "Bold italic text with a link" = 28 chars
        poi = create_business(admin_client, name="HTML Heavy Biz", teaser_paragraph=html)
        # Backend may sanitize HTML (e.g. add target/rel to links), so check visible text is preserved
        assert "Bold italic" in poi["teaser_paragraph"]
        assert "a link" in poi["teaser_paragraph"]

    def test_teaser_exactly_120_visible_chars(self, admin_client):
        """Exactly 120 visible chars should pass."""
        text_120 = "X" * 120
        html = f"<p>{text_120}</p>"
        poi = create_business(admin_client, name="Exact 120 Biz", teaser_paragraph=html)
        assert poi["teaser_paragraph"] == html

    def test_teaser_rejects_on_update_too(self, admin_client):
        """Teaser validation should also apply on PUT (update)."""
        poi = create_business(admin_client, name="Update Teaser Biz")
        poi_id = poi["id"]
        long_text = "B" * 121
        resp = admin_client.put(f"/api/pois/{poi_id}", json={
            "teaser_paragraph": f"<p>{long_text}</p>",
        })
        assert resp.status_code == 422


# -------------------------------------------------------------------------
# lat_long_most_accurate flag
# -------------------------------------------------------------------------

class TestLatLongMostAccurate:
    def test_create_with_flag_true(self, admin_client):
        """lat_long_most_accurate=true should persist on create."""
        poi = create_park(admin_client, name="Accurate Park", lat_long_most_accurate=True)
        assert poi["lat_long_most_accurate"] is True

    def test_default_is_false(self, admin_client):
        """Default should be false when not provided."""
        poi = create_park(admin_client, name="Default Park")
        assert poi["lat_long_most_accurate"] is False

    def test_update_flag(self, admin_client):
        """Should be updatable via PUT."""
        poi = create_park(admin_client, name="Toggle Park")
        poi_id = poi["id"]
        resp = admin_client.put(f"/api/pois/{poi_id}", json={"lat_long_most_accurate": True})
        assert resp.status_code == 200
        assert resp.json()["lat_long_most_accurate"] is True


# -------------------------------------------------------------------------
# alcohol_policy_details
# -------------------------------------------------------------------------

class TestAlcoholPolicyDetails:
    def test_create_with_alcohol_details(self, admin_client):
        """alcohol_policy_details should persist on create."""
        details = "<p>BYOB allowed on weekends only. No glass bottles.</p>"
        poi = create_park(
            admin_client, name="BYOB Park",
            alcohol_policy_details=details,
        )
        assert poi["alcohol_policy_details"] == details

    def test_update_alcohol_details(self, admin_client):
        """Should be updatable via PUT."""
        poi = create_park(admin_client, name="Alcohol Park")
        poi_id = poi["id"]
        details = "<p>Beer and wine sold at concession stand.</p>"
        resp = admin_client.put(f"/api/pois/{poi_id}", json={"alcohol_policy_details": details})
        assert resp.status_code == 200
        assert resp.json()["alcohol_policy_details"] == details

    def test_default_is_none(self, admin_client):
        """Should be None/null when not provided."""
        poi = create_business(admin_client, name="No Alcohol Biz")
        assert poi.get("alcohol_policy_details") is None


# -------------------------------------------------------------------------
# Playground location lat/lng
# -------------------------------------------------------------------------

class TestPlaygroundLocation:
    def test_create_with_playground_coords(self, admin_client):
        """playground_location JSONB with lat/lng should persist."""
        loc = {"lat": 35.72, "lng": -79.18}
        poi = create_park(
            admin_client, name="Playground Park",
            playground_available=True,
            playground_location=loc,
        )
        assert poi["playground_location"]["lat"] == 35.72
        assert poi["playground_location"]["lng"] == -79.18

    def test_update_playground_coords(self, admin_client):
        """Should be updatable via PUT."""
        poi = create_park(admin_client, name="Move Playground Park")
        poi_id = poi["id"]
        loc = {"lat": 35.80, "lng": -79.20}
        resp = admin_client.put(f"/api/pois/{poi_id}", json={"playground_location": loc})
        assert resp.status_code == 200
        assert resp.json()["playground_location"]["lat"] == 35.80


# -------------------------------------------------------------------------
# Parking locations lat/lng (verification of existing feature)
# -------------------------------------------------------------------------

class TestParkingLocations:
    def test_parking_locations_with_lat_lng(self, admin_client):
        """parking_locations array with lat/lng/name should round-trip."""
        locs = [
            {"lat": 35.71, "lng": -79.10, "name": "Main Lot"},
            {"lat": 35.72, "lng": -79.11, "name": "Overflow Lot"},
        ]
        poi = create_park(admin_client, name="Parking Park", parking_locations=locs)
        assert len(poi["parking_locations"]) == 2
        assert poi["parking_locations"][0]["name"] == "Main Lot"
        assert poi["parking_locations"][0]["lat"] == 35.71
        assert poi["parking_locations"][1]["lng"] == -79.11

    def test_parking_locations_on_event(self, admin_client):
        """Events should also support parking_locations."""
        locs = [{"lat": 35.60, "lng": -79.30, "name": "Event Parking"}]
        poi = create_event(admin_client, name="Parking Event", parking_locations=locs)
        assert len(poi["parking_locations"]) == 1
        assert poi["parking_locations"][0]["name"] == "Event Parking"


# -------------------------------------------------------------------------
# Restroom locations lat/lng + description (verification of existing)
# -------------------------------------------------------------------------

class TestRestroomLocations:
    def test_toilet_locations_with_lat_lng_desc(self, admin_client):
        """toilet_locations array with lat/lng/description should round-trip."""
        locs = [
            {"lat": 35.71, "lng": -79.10, "description": "Near visitor center"},
            {"lat": 35.72, "lng": -79.11, "description": "By the playground"},
        ]
        poi = create_park(
            admin_client, name="Restroom Park",
            public_toilets=["Flush", "Porta-Potty"],
            toilet_locations=locs,
        )
        assert len(poi["toilet_locations"]) == 2
        assert poi["toilet_locations"][0]["description"] == "Near visitor center"
        assert poi["toilet_locations"][1]["lat"] == 35.72

    def test_toilet_description_field(self, admin_client):
        """toilet_description text field should persist."""
        poi = create_park(
            admin_client, name="Desc Restroom Park",
            toilet_description="For paying customers only",
        )
        assert poi["toilet_description"] == "For paying customers only"
