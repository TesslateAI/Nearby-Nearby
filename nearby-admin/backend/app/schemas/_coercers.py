"""Schema coercers for forgiving legacy/edge-case input.

Background: several columns in this database are `VARCHAR` with no CHECK
constraint, but their Pydantic schemas declare them as `Optional[Literal[...]]`.
When a row contains an empty string the response serializer raises
`ResponseValidationError` and the endpoint returns 500.

`EmptyStringToNoneMixin` walks the class fields via introspection and coerces
`""` to `None` for any `Optional[Literal[...]]` field, so new enum-typed fields
inherit the protection automatically. `coerce_empty_literals` is the same logic
exposed as a pure function for write paths that bypass Pydantic (autosave).
"""

from functools import cache
from typing import Literal, get_args, get_origin

from pydantic import BaseModel, model_validator


def _annotation_allows_none_and_literal(annotation) -> bool:
    args = get_args(annotation)
    if not args:
        return False
    return type(None) in args and any(get_origin(a) is Literal for a in args)


@cache
def _literal_optional_field_names(cls: type) -> tuple:
    return tuple(
        name
        for name, fi in cls.model_fields.items()
        if _annotation_allows_none_and_literal(fi.annotation)
    )


def coerce_empty_literals(data: dict, model_cls: type) -> dict:
    """Mutate `data` in place: replace '' with None for Optional[Literal] fields of `model_cls`."""
    for name in _literal_optional_field_names(model_cls):
        if data.get(name) == "":
            data[name] = None
    return data


class EmptyStringToNoneMixin(BaseModel):
    """Add to a class's base list to coerce '' -> None for its Optional[Literal] fields.

    Handles three input shapes:
      - dict: mutate in place
      - pydantic BaseModel: pass through (already validated upstream)
      - ORM object (from_attributes=True): build a dict copy, leaving the ORM untouched
    """

    @model_validator(mode="before")
    @classmethod
    def _coerce_empty_strings_to_none(cls, data):
        fields = _literal_optional_field_names(cls)
        if not fields:
            return data
        if isinstance(data, BaseModel):
            return data
        if isinstance(data, dict):
            for name in fields:
                if data.get(name) == "":
                    data[name] = None
            return data
        out = {n: getattr(data, n) for n in cls.model_fields if hasattr(data, n)}
        for name in fields:
            if out.get(name) == "":
                out[name] = None
        return out
