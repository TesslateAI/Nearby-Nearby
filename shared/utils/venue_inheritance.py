"""Venue inheritance resolution for events.

When an event has a venue_poi_id, certain data sections can be inherited from
the venue POI. The venue_inheritance JSONB config specifies per-section behavior:
  - "as_is": use venue data directly
  - "use_and_add": merge venue base + event additions
  - "do_not_use": skip venue data, keep event's own data
"""

from typing import Optional

# Map section names to the fields they control
_SECTION_FIELDS = {
    "parking": ["parking_types", "parking_locations", "parking_notes", "expect_to_pay_parking", "public_transit_info"],
    "restrooms": ["public_toilets", "toilet_locations", "toilet_description"],
    "accessibility": ["wheelchair_accessible", "wheelchair_details"],
    "hours": ["hours"],
    "amenities": ["amenities"],
    "pet_policy": ["pet_options", "pet_policy"],
    "drone_policy": ["drone_usage", "drone_policy"],
}


def resolve_venue_inheritance(
    event_data: dict,
    venue_data: Optional[dict],
    inheritance_config: Optional[dict],
) -> dict:
    """Merge venue data into event data based on inheritance config.

    Args:
        event_data: Dict of event POI fields.
        venue_data: Dict of venue POI fields (may be None).
        inheritance_config: Per-section config dict, e.g. {"parking": "as_is"}.

    Returns:
        Merged dict with event_data updated according to config.
        Includes "_venue_source" dict showing which sections were inherited.
    """
    result = dict(event_data)
    venue_source = {}

    if not inheritance_config or not venue_data:
        result["_venue_source"] = venue_source
        return result

    for section, mode in inheritance_config.items():
        if section not in _SECTION_FIELDS:
            continue

        fields = _SECTION_FIELDS[section]
        venue_source[section] = mode

        if mode == "do_not_use":
            continue

        if mode == "as_is":
            for field in fields:
                venue_val = venue_data.get(field)
                if venue_val is not None:
                    result[field] = venue_val

        elif mode == "use_and_add":
            for field in fields:
                venue_val = venue_data.get(field)
                event_val = result.get(field)

                if venue_val is None:
                    continue

                if isinstance(venue_val, list) and isinstance(event_val, list):
                    # Merge lists, preserving order: venue first, then event additions
                    merged = list(venue_val)
                    for item in event_val:
                        if item not in merged:
                            merged.append(item)
                    result[field] = merged
                elif isinstance(venue_val, dict) and isinstance(event_val, dict):
                    # Merge dicts: venue base, event overrides
                    merged = dict(venue_val)
                    merged.update(event_val)
                    result[field] = merged
                elif event_val is None:
                    # Event has no data, use venue
                    result[field] = venue_val
                # else: event has non-list/dict data, keep event's own value

    result["_venue_source"] = venue_source
    return result
