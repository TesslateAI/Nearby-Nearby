"""Canonical searchable-text builder for POI embeddings.

This is a dependency-light port of ``create_searchable_text`` from
``nearby-app/backend/generate_embeddings.py`` (the legacy embedding-generation
script). The field reads, ordering, and join separators are kept VERBATIM so
that the output string is byte-identical to the legacy script for the same POI.

Pure stdlib — no torch, no sentence-transformers, no DB, no SQLAlchemy import
required to call ``build_searchable_text`` (the dict-based entry point).

Two entry points:

* ``build_searchable_text(poi_dict, categories=..., trail=..., event=...,
  business=..., park=...)`` — the raw-row / dict path (legacy-compatible).
* ``build_searchable_text_from_orm(poi)`` — accepts a SQLAlchemy
  ``PointOfInterest`` instance (with ``business``/``park``/``trail``/``event``/
  ``categories`` relations loaded) and constructs the SAME arguments before
  delegating to ``build_searchable_text``. Output is guaranteed equal to the
  raw-row path for the same POI.
"""


def _json_list(val) -> list:
    """Safely extract a list from a JSONB value (may be list, dict, str, or None)."""
    if isinstance(val, list):
        return [str(v) for v in val if v]
    if isinstance(val, dict):
        return [str(v) for v in val.values() if v]
    return []


def build_searchable_text(poi: dict, categories: list = None,
                          trail: dict = None, event: dict = None,
                          business: dict = None, park: dict = None) -> str:
    """
    Create rich searchable text from POI attributes and related tables.
    Includes categories, amenities, facilities, trail/park/event specifics, etc.

    NOTE: This body is a verbatim port of the legacy
    ``create_searchable_text`` in
    ``nearby-app/backend/generate_embeddings.py``. Do not reorder fields or
    change separators — embeddings stored in production depend on this exact
    string layout.
    """
    parts = []

    # Name (most important)
    if poi.get('name'):
        parts.append(f"Name: {poi['name']}")

    # Type
    if poi.get('poi_type'):
        parts.append(f"Type: {poi['poi_type']}")

    # Categories
    if categories:
        parts.append(f"Categories: {', '.join(categories)}")

    # Short description
    if poi.get('description_short'):
        parts.append(f"Description: {poi['description_short']}")

    # Long description (limit to first 500 chars)
    if poi.get('description_long'):
        parts.append(f"Details: {poi['description_long'][:500]}")

    # --- Business amenities ---
    biz_amenities = _json_list(poi.get('business_amenities'))
    if biz_amenities:
        parts.append(f"Business amenities: {', '.join(biz_amenities)}")

    entertainment = _json_list(poi.get('entertainment_options'))
    if entertainment:
        parts.append(f"Entertainment: {', '.join(entertainment)}")

    youth = _json_list(poi.get('youth_amenities'))
    if youth:
        parts.append(f"Youth amenities: {', '.join(youth)}")

    # General amenities / ideal_for
    amenities = _json_list(poi.get('amenities'))
    ideal = _json_list(poi.get('ideal_for'))
    ideal_key = _json_list(poi.get('ideal_for_key'))
    all_amenities = amenities + ideal + ideal_key
    if all_amenities:
        parts.append(f"Amenities: {', '.join(all_amenities)}")

    # key_facilities removed — column renamed _deprecated_key_facilities (Migration A #34)

    # --- Accessibility & features ---
    features = []
    # wheelchair_accessible removed (Issue #45 PR2 Migration B — column dropped)
    wifi = _json_list(poi.get('wifi_options'))
    if wifi:
        features.extend(wifi)
    pet = _json_list(poi.get('pet_options'))
    if pet:
        features.extend(pet)
    public_toilets = _json_list(poi.get('public_toilets'))
    if public_toilets:
        features.extend(public_toilets)
    if features:
        parts.append(f"Features: {', '.join(features)}")

    # --- Park specifics ---
    facilities = _json_list(poi.get('facilities_options'))
    if facilities:
        parts.append(f"Park facilities: {', '.join(facilities)}")

    things = _json_list(poi.get('things_to_do'))
    if things:
        parts.append(f"Things to do: {', '.join(things)}")

    natural = _json_list(poi.get('natural_features'))
    if natural:
        parts.append(f"Natural features: {', '.join(natural)}")

    outdoor = _json_list(poi.get('outdoor_types'))
    if outdoor:
        parts.append(f"Outdoor types: {', '.join(outdoor)}")

    if poi.get('playground_available'):
        parts.append("Playground available")

    if poi.get('camping_lodging'):
        parts.append(f"Camping/lodging: {str(poi['camping_lodging'])[:200]}")

    # --- Trail specifics ---
    if trail:
        if trail.get('difficulty'):
            parts.append(f"Trail difficulty: {trail['difficulty']}")
        if trail.get('length_text'):
            parts.append(f"Trail length: {trail['length_text']}")
        if trail.get('route_type'):
            parts.append(f"Route type: {trail['route_type']}")
        surfaces = _json_list(trail.get('trail_surfaces'))
        if surfaces:
            parts.append(f"Trail surfaces: {', '.join(surfaces)}")
        experiences = _json_list(trail.get('trail_experiences'))
        if experiences:
            parts.append(f"Trail experiences: {', '.join(experiences)}")

    # --- Event specifics ---
    if event:
        venue_settings = _json_list(event.get('venue_settings'))
        if venue_settings:
            parts.append(f"Venue: {', '.join(venue_settings)}")

    # --- Business specifics ---
    if business and business.get('price_range'):
        parts.append(f"Price range: {business['price_range']}")

    # --- Pricing ---
    if poi.get('cost'):
        parts.append(f"Cost: {poi['cost']}")
    if poi.get('price_range_per_person'):
        parts.append(f"Price per person: {poi['price_range_per_person']}")

    # Alcohol
    alcohol = _json_list(poi.get('alcohol_options'))
    if alcohol:
        parts.append(f"Alcohol: {', '.join(alcohol)}")

    # Discounts
    discounts = _json_list(poi.get('discounts'))
    if discounts:
        parts.append(f"Discounts: {', '.join(discounts)}")

    # Location
    if poi.get('address_city'):
        parts.append(f"Location: {poi['address_city']}")

    return " | ".join(parts)


# Legacy alias — keep both names callable.
create_searchable_text = build_searchable_text


# --- ORM adapter -----------------------------------------------------------
#
# The legacy raw-row path (fetch_pois -> generate_and_store_embeddings) reads:
#   * poi dict        = SELECT p.*  (every column on points_of_interest),
#                       with `poi_type` already a plain string from the DB row.
#   * categories      = string_agg(c.name, ', ') split on "," and stripped.
#   * trail           = {difficulty, length_text, route_type, trail_surfaces,
#                        trail_experiences} (only built when difficulty or
#                        length_text is truthy).
#   * event           = {venue_settings} (only built when venue_settings truthy).
#   * business         = {price_range} (only built when price_range truthy).
#   * park            = never passed by the legacy generator.
#
# build_searchable_text_from_orm reproduces those exact arguments from an ORM
# PointOfInterest so the resulting string is byte-identical.

# The fields build_searchable_text actually reads off the poi dict. We pull
# them by getattr so we never depend on a column the ORM model might not map.
_POI_TEXT_FIELDS = (
    "name",
    "poi_type",
    "description_short",
    "description_long",
    "business_amenities",
    "entertainment_options",
    "youth_amenities",
    "amenities",
    "ideal_for",
    "ideal_for_key",
    "wifi_options",
    "pet_options",
    "public_toilets",
    "facilities_options",
    "things_to_do",
    "natural_features",
    "outdoor_types",
    "playground_available",
    "camping_lodging",
    "cost",
    "price_range_per_person",
    "alcohol_options",
    "discounts",
    "address_city",
)


def _poi_type_to_str(value):
    """Mirror the DB row's plain-string poi_type.

    In the raw-row path `poi_type` is whatever Postgres returns for the enum
    column — the bare value string (e.g. ``"BUSINESS"``). The ORM maps it to a
    Python enum, so unwrap ``.value`` to match exactly.
    """
    if value is None:
        return None
    enum_value = getattr(value, "value", None)
    if enum_value is not None:
        return enum_value
    return value


def build_searchable_text_from_orm(poi) -> str:
    """Build the canonical searchable text from a SQLAlchemy PointOfInterest.

    ``poi`` is expected to have its ``business``/``park``/``trail``/``event``/
    ``categories`` relations loaded. The output equals the raw-row path
    (``build_searchable_text`` fed from ``SELECT p.*`` + joins) for the same
    POI.
    """
    poi_dict = {field: getattr(poi, field, None) for field in _POI_TEXT_FIELDS}
    poi_dict["poi_type"] = _poi_type_to_str(poi_dict.get("poi_type"))

    # Categories: same join + split/strip as the legacy string_agg(c.name, ', ').
    categories = None
    poi_categories = getattr(poi, "categories", None)
    if poi_categories:
        category_names = ", ".join(
            c.name for c in poi_categories if getattr(c, "name", None)
        )
        categories = [c.strip() for c in category_names.split(",") if c.strip()]

    # Trail: only built when difficulty or length_text is truthy (legacy gate).
    trail = None
    trail_obj = getattr(poi, "trail", None)
    if trail_obj is not None and (
        getattr(trail_obj, "difficulty", None)
        or getattr(trail_obj, "length_text", None)
    ):
        trail = {
            "difficulty": getattr(trail_obj, "difficulty", None),
            "length_text": getattr(trail_obj, "length_text", None),
            "route_type": getattr(trail_obj, "route_type", None),
            "trail_surfaces": getattr(trail_obj, "trail_surfaces", None),
            "trail_experiences": getattr(trail_obj, "trail_experiences", None),
        }

    # Event: only built when venue_settings is truthy (legacy gate).
    event = None
    event_obj = getattr(poi, "event", None)
    if event_obj is not None and getattr(event_obj, "venue_settings", None):
        event = {"venue_settings": getattr(event_obj, "venue_settings", None)}

    # Business: only built when price_range is truthy (legacy gate).
    business = None
    business_obj = getattr(poi, "business", None)
    if business_obj is not None and getattr(business_obj, "price_range", None):
        business = {"price_range": getattr(business_obj, "price_range", None)}

    # park is never passed by the legacy generator — keep it None to match.
    return build_searchable_text(
        poi_dict,
        categories=categories,
        trail=trail,
        event=event,
        business=business,
        park=None,
    )
