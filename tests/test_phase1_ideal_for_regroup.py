"""Phase 1: normalize_ideal_for regroups flat list into categorized dict."""
from app.crud.crud_poi import normalize_ideal_for
from conftest import create_business


def test_flat_list_grouped():
    p = normalize_ideal_for({"ideal_for": ["All Ages", "Families", "Cozy + Intimate"]})
    v = p["ideal_for"]
    assert isinstance(v, dict)
    assert set(v["age_group"]) == {"All Ages", "Families"}
    assert v["atmosphere"] == ["Cozy + Intimate"]
    assert v["social_settings"] == []
    assert v["local_special"] == []
    assert v["_legacy"] == []


def test_unknown_terms_go_to_legacy():
    p = normalize_ideal_for({"ideal_for": ["Banana"]})
    assert p["ideal_for"]["_legacy"] == ["Banana"]


def test_dict_input_passthrough():
    existing = {"age_group": ["All Ages"], "atmosphere": [],
                "social_settings": [], "local_special": [], "_legacy": []}
    p = normalize_ideal_for({"ideal_for": existing})
    assert p["ideal_for"] is existing


def test_none_passthrough():
    p = normalize_ideal_for({"ideal_for": None})
    assert p["ideal_for"] is None


def test_integration_post_flat_list_returns_grouped(admin_client):
    biz = create_business(
        admin_client,
        name="Ideal Biz",
        ideal_for=["All Ages", "Cozy + Intimate", "Banana"],
    )
    got = admin_client.get(f"/api/pois/{biz['id']}").json()
    v = got["ideal_for"]
    assert isinstance(v, dict)
    assert "All Ages" in v["age_group"]
    assert "Cozy + Intimate" in v["atmosphere"]
    assert "Banana" in v["_legacy"]
