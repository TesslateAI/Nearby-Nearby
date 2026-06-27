"""Registry-driven serialization for nearby-app public POI responses.

This package contains the field-registry-backed serializer that replaces the
legacy "all columns then filter through a Pydantic schema" approach in the
public POI endpoints.

The serializer (``poi_serializer``) builds the public payload STRICTLY from the
shared field registry (``shared/poi_fields.json`` via
``shared.constants.poi_registry``). Because the registry filters to
``audience == "public"`` fields, admin-only fields (contact_info, compliance,
main_contact_*, emergency_*, admin_notes) can NEVER appear in the output. This is
the structural PII fix introduced in phase B3.

``parity`` provides a diff helper used by shadow mode and the parity test to
prove the registry-driven output is a strict superset of the kept legacy keys
with identical values (minus the deliberately-dropped PII / deprecated keys).
"""

from .poi_serializer import (
    serialize_poi_detail,
    serialize_poi_card,
    structural_registry_keys_for,
    _tier_is_paid,
)
from .parity import diff_serializers

__all__ = [
    "serialize_poi_detail",
    "serialize_poi_card",
    "structural_registry_keys_for",
    "diff_serializers",
    "_tier_is_paid",
]
