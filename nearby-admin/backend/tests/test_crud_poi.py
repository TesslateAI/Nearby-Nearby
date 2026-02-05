import pytest
from sqlalchemy.exc import IntegrityError
from app.models import PointOfInterest
from app.schemas.poi import PointOfInterestCreate, PointOfInterestUpdate, ParkCreate, TrailCreate, EventCreate
from app.crud import crud_poi
import uuid
from datetime import datetime
from geoalchemy2.shape import to_shape
import time

# Use the db_session fixture from conftest.py (which uses test-db)


def make_poi_create(name="Test POI", poi_type="BUSINESS"):
    # Provide required subtype data for each poi_type
    if poi_type == "BUSINESS":
        return PointOfInterestCreate(
            name=name,
            poi_type=poi_type,
            location={"type": "Point", "coordinates": [0.0, 0.0]},
            business={"listing_tier": "free"},
            park=None,
            trail=None,
            event=None,
            category_ids=[],
            description_long=None,
            description_short=None,
            amenities=None
        )
    elif poi_type == "PARK":
        return PointOfInterestCreate(
            name=name,
            poi_type=poi_type,
            location={"type": "Point", "coordinates": [0.0, 0.0]},
            business=None,
            park=ParkCreate(drone_usage_policy="Allowed"),
            trail=None,
            event=None,
            category_ids=[],
            description_long=None,
            description_short=None,
            amenities=None
        )
    elif poi_type == "TRAIL":
        return PointOfInterestCreate(
            name=name,
            poi_type=poi_type,
            location={"type": "Point", "coordinates": [0.0, 0.0]},
            business=None,
            park=None,
            trail=TrailCreate(length_text="1 mile", difficulty="easy", route_type="loop"),
            event=None,
            category_ids=[],
            description_long=None,
            description_short=None,
            amenities=None
        )
    elif poi_type == "EVENT":
        return PointOfInterestCreate(
            name=name,
            poi_type=poi_type,
            location={"type": "Point", "coordinates": [0.0, 0.0]},
            business=None,
            park=None,
            trail=None,
            event=EventCreate(start_datetime=datetime.utcnow()),
            category_ids=[],
            description_long=None,
            description_short=None,
            amenities=None
        )
    else:
        raise ValueError("Unknown poi_type")


def test_create_poi(db_session):
    poi_in = make_poi_create()
    poi = crud_poi.create_poi(db_session, poi_in)
    assert poi.id is not None
    assert poi.name == "Test POI"
    assert poi.poi_type.value == "BUSINESS"
    assert poi.business is not None


def test_create_poi_missing_subtype(db_session):
    # Should fail if required subtype data is missing
    with pytest.raises(ValueError):
        PointOfInterestCreate(
            name="Test POI",
            poi_type="PARK",
            location={"type": "Point", "coordinates": [0.0, 0.0]},
            business=None,
            park=None,
            trail=None,
            event=None,
            category_ids=[],
            description_long=None,
            description_short=None,
            amenities=None
        )


def test_update_poi(db_session):
    poi_in = make_poi_create()
    poi = crud_poi.create_poi(db_session, poi_in)
    update_in = PointOfInterestUpdate(name="Updated Name")
    updated = crud_poi.update_poi(db_session, db_obj=poi, obj_in=update_in)
    assert updated.name == "Updated Name"


def test_delete_poi(db_session):
    poi_in = make_poi_create()
    poi = crud_poi.create_poi(db_session, poi_in)
    deleted = crud_poi.delete_poi(db_session, poi.id)
    assert deleted is not None
    # Should not find it again
    assert crud_poi.get_poi(db_session, poi.id) is None


def test_delete_nonexistent_poi(db_session):
    fake_id = uuid.uuid4()
    deleted = crud_poi.delete_poi(db_session, fake_id)
    assert deleted is None


def test_get_pois(db_session):
    prefix = f"POI_TEST_SUITE_{int(time.time())}_"
    for i in range(3):
        poi_in = make_poi_create(name=f"{prefix}{i}")
        crud_poi.create_poi(db_session, poi_in)
    pois = [p for p in crud_poi.get_pois(db_session) if p.name and p.name.startswith(prefix)]
    assert len(pois) == 3


def test_search_pois(db_session):
    poi_in = make_poi_create(name="UniqueName123")
    crud_poi.create_poi(db_session, poi_in)
    results = crud_poi.search_pois(db_session, "UniqueName123")
    assert len(results) >= 1
    assert any("UniqueName123" in p.name for p in results)


def test_update_poi_location(db_session):
    poi_in = make_poi_create()
    poi = crud_poi.create_poi(db_session, poi_in)
    update_in = PointOfInterestUpdate(location={"type": "Point", "coordinates": [1.0, 2.0]})
    updated = crud_poi.update_poi(db_session, db_obj=poi, obj_in=update_in)
    # Convert WKBElement to Shapely Point to check coordinates
    point = to_shape(updated.location)
    assert point.x == 1.0
    assert point.y == 2.0


def test_create_poi_relationship(db_session):
    poi1 = crud_poi.create_poi(db_session, make_poi_create(name="POI1"))
    poi2 = crud_poi.create_poi(db_session, make_poi_create(name="POI2"))
    rel = crud_poi.create_poi_relationship(db_session, poi1.id, poi2.id, "related")
    assert rel.source_poi_id == poi1.id
    assert rel.target_poi_id == poi2.id
    assert rel.relationship_type == "related"


def test_get_poi_relationships(db_session):
    poi1 = crud_poi.create_poi(db_session, make_poi_create(name="POI1"))
    poi2 = crud_poi.create_poi(db_session, make_poi_create(name="POI2"))
    crud_poi.create_poi_relationship(db_session, poi1.id, poi2.id, "related")
    rels = crud_poi.get_poi_relationships(db_session, poi1.id)
    assert len(rels) == 1
    assert rels[0].relationship_type == "related"


def test_integrity_error_handling(monkeypatch, db_session):
    poi_in = make_poi_create()
    def raise_integrity(*args, **kwargs):
        raise IntegrityError("mock", None, None)
    monkeypatch.setattr(db_session, "add", raise_integrity)
    with pytest.raises(Exception):
        crud_poi.create_poi(db_session, poi_in)


def test_update_with_invalid_data(db_session):
    poi_in = make_poi_create()
    poi = crud_poi.create_poi(db_session, poi_in)
    # Try updating with a field that doesn't exist
    update_in = PointOfInterestUpdate()
    update_in.__dict__["nonexistent_field"] = "value"
    updated = crud_poi.update_poi(db_session, db_obj=poi, obj_in=update_in)
    assert hasattr(updated, "name")


def test_delete_poi_also_deletes_relationships(db_session):
    # Create three POIs
    poi1 = crud_poi.create_poi(db_session, make_poi_create(name="POI1"))
    poi2 = crud_poi.create_poi(db_session, make_poi_create(name="POI2"))
    poi3 = crud_poi.create_poi(db_session, make_poi_create(name="POI3"))

    # Create relationships: poi1 <-> poi2, poi1 <-> poi3
    rel1 = crud_poi.create_poi_relationship(db_session, poi1.id, poi2.id, "related")
    rel2 = crud_poi.create_poi_relationship(db_session, poi3.id, poi1.id, "related")

    # Confirm relationships exist
    rels_for_poi1 = crud_poi.get_poi_relationships(db_session, poi1.id)
    assert len(rels_for_poi1) == 2

    # Delete poi1
    crud_poi.delete_poi(db_session, poi1.id)

    # Relationships involving poi1 should be gone
    rels_for_poi2 = crud_poi.get_poi_relationships(db_session, poi2.id)
    rels_for_poi3 = crud_poi.get_poi_relationships(db_session, poi3.id)
    assert all(poi1.id not in (r.source_poi_id, r.target_poi_id) for r in rels_for_poi2)
    assert all(poi1.id not in (r.source_poi_id, r.target_poi_id) for r in rels_for_poi3) 