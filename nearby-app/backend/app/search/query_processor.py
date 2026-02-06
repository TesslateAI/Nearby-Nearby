# app/search/query_processor.py
"""Query parsing, filter extraction, and synonym mapping."""

import re
from dataclasses import dataclass, field
from typing import Optional

from .constants import (
    POI_TYPE_SYNONYMS,
    TRAIL_DIFFICULTY_SYNONYMS,
    LOCATION_PREFIXES,
    build_amenity_patterns,
)

# Build amenity patterns once at import time
_AMENITY_PATTERNS = build_amenity_patterns()


@dataclass
class ExtractedFilter:
    """A structured filter extracted from the query."""
    field: str
    values: list  # list of acceptable DB values, or None for "non-empty" check


@dataclass
class ParsedQuery:
    """Result of parsing a user search query."""
    original_query: str
    semantic_query: str  # cleaned query for embedding
    extracted_filters: list = field(default_factory=list)  # list of ExtractedFilter
    poi_type_hint: Optional[str] = None  # e.g. "BUSINESS", "TRAIL"
    location_hint: Optional[str] = None  # e.g. "Pittsboro"
    trail_difficulty_hint: Optional[str] = None  # e.g. "easy"


def parse_query(query: str) -> ParsedQuery:
    """
    Parse a user search query and extract structured filters, type hints,
    location hints, and difficulty hints.

    The semantic_query is the full original query (not stripped), since
    the embedding model benefits from all context.
    """
    if not query or not query.strip():
        return ParsedQuery(original_query=query or "", semantic_query="")

    original = query.strip()
    q_lower = original.lower()

    extracted_filters = []
    poi_type_hint = None
    location_hint = None
    trail_difficulty_hint = None

    # 1. Extract amenity filters (longest match first to handle "free wifi" before "free")
    sorted_patterns = sorted(_AMENITY_PATTERNS.keys(), key=len, reverse=True)
    for pattern_phrase in sorted_patterns:
        if pattern_phrase in q_lower:
            db_field, values = _AMENITY_PATTERNS[pattern_phrase]
            # Avoid duplicate field extractions
            if not any(f.field == db_field for f in extracted_filters):
                extracted_filters.append(ExtractedFilter(field=db_field, values=values))

    # 2. Extract POI type hints
    words = re.findall(r'\b\w+\b', q_lower)
    for word in words:
        if word in POI_TYPE_SYNONYMS:
            poi_type_hint = POI_TYPE_SYNONYMS[word]
            break  # take first match

    # 3. Extract location hints ("near Pittsboro", "in Durham")
    location_pattern = r'\b(?:' + '|'.join(LOCATION_PREFIXES) + r')\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)'
    location_match = re.search(location_pattern, original)
    if location_match:
        location_hint = location_match.group(1)

    # 4. Extract trail difficulty hints
    for difficulty, synonyms in TRAIL_DIFFICULTY_SYNONYMS.items():
        for syn in synonyms:
            if syn in words:
                trail_difficulty_hint = difficulty
                break
        if trail_difficulty_hint:
            break

    return ParsedQuery(
        original_query=original,
        semantic_query=original,  # full query for embedding
        extracted_filters=extracted_filters,
        poi_type_hint=poi_type_hint,
        location_hint=location_hint,
        trail_difficulty_hint=trail_difficulty_hint,
    )
