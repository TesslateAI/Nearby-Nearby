"""Serializer parity diff helper (phase B3).

Used by:
  * shadow mode — compare the registry-driven payload against the legacy payload
    at request time and log any drift, and
  * ``tests/test_serializer_parity.py`` — the cutover gate.

``diff_serializers`` compares two payload dicts and reports:
  * ``keys_added``      — keys in the registry output but NOT in the legacy output
                          (previously-dropped public fields the registry restores).
  * ``keys_removed``    — keys in the legacy output but NOT in the registry output
                          (PII / deprecated / structural fields the registry drops).
  * ``value_mismatches``— keys present in BOTH whose values differ (must be empty
                          for kept keys — a silent value change is a regression).
"""

from __future__ import annotations

from typing import Any, Dict, List


def _normalize(value: Any) -> Any:
    """Normalize values so equality ignores incidental representation diffs.

    Tuples (e.g. coordinate pairs) compare equal to lists; everything else is
    returned as-is. This keeps the comparison about *meaning*, not container
    type, while still catching real value drift.
    """
    if isinstance(value, tuple):
        return [_normalize(v) for v in value]
    if isinstance(value, list):
        return [_normalize(v) for v in value]
    if isinstance(value, dict):
        return {k: _normalize(v) for k, v in value.items()}
    return value


def diff_serializers(
    legacy_dict: Dict[str, Any],
    registry_dict: Dict[str, Any],
) -> Dict[str, Any]:
    """Diff two serializer payloads.

    Parameters
    ----------
    legacy_dict : dict
        The legacy payload (e.g. the raw all-columns dict or a POIDetail dump).
    registry_dict : dict
        The registry-driven payload from ``serialize_poi_detail``.

    Returns
    -------
    dict
        ``{"keys_added": [...], "keys_removed": [...], "value_mismatches": [...]}``
        where each ``value_mismatches`` entry is
        ``{"key": k, "legacy": <v1>, "registry": <v2>}``. Lists are sorted for
        deterministic output.
    """
    legacy_keys = set(legacy_dict.keys())
    registry_keys = set(registry_dict.keys())

    keys_added = sorted(registry_keys - legacy_keys)
    keys_removed = sorted(legacy_keys - registry_keys)

    value_mismatches: List[Dict[str, Any]] = []
    for key in sorted(legacy_keys & registry_keys):
        lv = _normalize(legacy_dict[key])
        rv = _normalize(registry_dict[key])
        if lv != rv:
            value_mismatches.append(
                {"key": key, "legacy": lv, "registry": rv}
            )

    return {
        "keys_added": keys_added,
        "keys_removed": keys_removed,
        "value_mismatches": value_mismatches,
    }
