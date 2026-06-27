"""Regression tests for the empty-string -> None coercion on Optional[Literal] fields.

Production incident: a row in `points_of_interest` had `alcohol_available = ''`
which made every list endpoint 500 with `ResponseValidationError`. The fix is a
`mode='before'` model validator on every schema that has `Optional[Literal[...]]`
fields, plus a paired helper used by the autosave write path which bypasses
Pydantic. These tests cover both shapes (dict input, ORM-like object input) and
fields beyond the original `alcohol_available` to prove the introspection
generalizes.
"""

from types import SimpleNamespace

from app.schemas._coercers import (
    EmptyStringToNoneMixin,
    coerce_empty_literals,
    _annotation_allows_none_and_literal,
)
from app.schemas.poi import (
    PointOfInterestUpdate,
    BusinessBase,
    TrailBase,
    ALCOHOL_AVAILABLE,
    PRICE_RANGES,
)


def test_annotation_predicate_detects_optional_literal():
    from typing import Optional, Literal

    assert _annotation_allows_none_and_literal(Optional[Literal["a", "b"]]) is True
    assert _annotation_allows_none_and_literal(Optional[str]) is False
    assert _annotation_allows_none_and_literal(Literal["a", "b"]) is False
    assert _annotation_allows_none_and_literal(str) is False


def test_coerce_empty_literals_dict_path():
    payload = {
        "alcohol_available": "",
        "expect_to_pay_parking": "",
        "name": "",
        "sponsor_level": "platform",
    }
    coerce_empty_literals(payload, PointOfInterestUpdate)

    assert payload["alcohol_available"] is None
    assert payload["expect_to_pay_parking"] is None
    assert payload["name"] == "", "non-Literal fields must not be coerced"
    assert payload["sponsor_level"] == "platform", "valid Literal values must pass through"


def test_business_response_coerces_empty_price_range_from_orm_like_object():
    """Reproduces the production crash shape: ORM object with empty string in an Optional[Literal] column."""
    orm_like = SimpleNamespace(price_range="", poi_id="00000000-0000-0000-0000-000000000001")

    model = BusinessBase.model_validate(orm_like, from_attributes=True)

    assert model.price_range is None


def test_trail_response_coerces_empty_trail_lighting():
    orm_like = SimpleNamespace(trail_lighting="", length_text="2.5 miles")

    model = TrailBase.model_validate(orm_like, from_attributes=True)

    assert model.trail_lighting is None
    assert model.length_text == "2.5 miles"


def test_pou_update_via_dict_coerces_empty_optional_literal():
    """The update schema must also coerce, so direct PUT/PATCH never persists ''."""
    payload = {"alcohol_available": "", "sponsor_level": "", "listing_type": ""}
    model = PointOfInterestUpdate.model_validate(payload)

    assert model.alcohol_available is None
    assert model.sponsor_level is None
    assert model.listing_type is None


def test_valid_literal_value_still_validates():
    payload = {"alcohol_available": "full_bar"}
    model = PointOfInterestUpdate.model_validate(payload)
    assert model.alcohol_available == "full_bar"


def test_invalid_literal_value_still_rejected():
    """The mixin only coerces ''; garbage non-empty values must still raise."""
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        PointOfInterestUpdate.model_validate({"alcohol_available": "bogus"})
