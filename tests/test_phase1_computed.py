"""Phase 1: unit tests for pure computed-field helpers in app.crud.crud_poi."""
from app.crud.crud_poi import (
    compute_icon_booleans,
    compute_accessible_restroom,
    compute_inclusive_playground,
    compute_wifi_mirror,
    apply_sponsor_rule,
)


def test_icon_free_wifi_from_wifi_options():
    p = compute_icon_booleans({"wifi_options": ["Free Wifi"]})
    assert p["icon_free_wifi"] is True

    p2 = compute_icon_booleans({"wifi_options": ["Free Public Wifi"]})
    assert p2["icon_free_wifi"] is True

    p3 = compute_icon_booleans({"wifi_options": ["No Public Wifi"]})
    assert p3["icon_free_wifi"] is False


def test_icon_pet_friendly_toggle():
    assert compute_icon_booleans({"pet_options": ["No Dogs Allowed"]})["icon_pet_friendly"] is False
    assert compute_icon_booleans({"pet_options": ["Dog Friendly"]})["icon_pet_friendly"] is True
    assert compute_icon_booleans({"pet_options": []})["icon_pet_friendly"] is False


def test_icon_public_restroom_toggle():
    assert compute_icon_booleans({"public_toilets": ["No"]})["icon_public_restroom"] is False
    assert compute_icon_booleans({"public_toilets": ["Accessible"]})["icon_public_restroom"] is True
    assert compute_icon_booleans({"public_toilets": []})["icon_public_restroom"] is False


def test_icon_wheelchair_accessible_from_accessible_restroom():
    p = compute_icon_booleans({"accessible_restroom": True})
    assert p["icon_wheelchair_accessible"] is True

    p2 = compute_icon_booleans({})
    assert p2["icon_wheelchair_accessible"] is False


def test_compute_accessible_restroom_dict_of_bools():
    p = compute_accessible_restroom({"accessible_restroom_details": {"grab_bars": True, "ramp": False}})
    assert p["accessible_restroom"] is True

    p2 = compute_accessible_restroom({"accessible_restroom_details": {"grab_bars": False}})
    assert p2["accessible_restroom"] is False

    p3 = compute_accessible_restroom({"accessible_restroom_details": None})
    assert p3["accessible_restroom"] is False


def test_inclusive_playground_requires_three_items():
    required = [
        "Accessible route to play area",
        "Ground-level play components accessible",
        "Unitary surface (poured-rubber/tiles)",
    ]
    p = compute_inclusive_playground({"playground_ada_checklist": required})
    assert p["inclusive_playground"] is True

    p2 = compute_inclusive_playground({"playground_ada_checklist": required[:2]})
    assert p2["inclusive_playground"] is False

    p3 = compute_inclusive_playground({})
    assert p3["inclusive_playground"] is False


def test_compute_wifi_mirror_only_when_absent():
    # mirror writes when amenities.wifi is absent
    p = compute_wifi_mirror({"wifi_options": ["Free Public Wifi"], "amenities": {}})
    assert p["amenities"]["wifi"] == "Free Wifi"

    # existing amenities.wifi is preserved
    p2 = compute_wifi_mirror({"wifi_options": ["Free Public Wifi"],
                              "amenities": {"wifi": "Custom"}})
    assert p2["amenities"]["wifi"] == "Custom"


def test_apply_sponsor_rule_forces_paid():
    p = apply_sponsor_rule({"is_sponsor": True, "listing_type": "free"})
    assert p["listing_type"] == "paid"

    p2 = apply_sponsor_rule({"is_sponsor": False, "listing_type": "free"})
    assert p2["listing_type"] == "free"
