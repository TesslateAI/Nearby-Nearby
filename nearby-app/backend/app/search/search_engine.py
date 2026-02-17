# app/search/search_engine.py
"""
Multi-signal search engine.

Pulls candidates from multiple PostgreSQL queries, scores each signal
independently, then merges and re-ranks in Python.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from .query_processor import parse_query, ParsedQuery
from .constants import (
    SIGNAL_WEIGHTS,
    MIN_ABSOLUTE_SCORE,
    RELATIVE_SCORE_THRESHOLD,
    TRIGRAM_SIMILARITY_THRESHOLD,
)


def multi_signal_search(
    db: Session,
    query: str,
    limit: int = 10,
    poi_type: Optional[str] = None,
    model=None,
) -> list:
    """
    Run multi-signal search and return ranked POI objects.

    Args:
        db: Database session
        query: User search query
        limit: Max results to return
        poi_type: Optional POI type filter (e.g. "BUSINESS")
        model: Pre-loaded SentenceTransformer model

    Returns:
        List of PointOfInterest ORM objects, enriched with category info,
        sorted by combined score (best first).
    """
    if not query or not query.strip():
        return []

    parsed = parse_query(query)

    # If explicit poi_type param, override any type hint from the query
    effective_type = poi_type.upper() if poi_type else parsed.poi_type_hint

    # Collect candidate POI IDs with per-signal scores
    # Each signal returns {poi_id: score} where score is 0..1
    candidates = {}  # poi_id -> {signal_name: score}

    # --- Signal 1: Exact name match ---
    exact_scores = _signal_exact_name(db, parsed.original_query, effective_type)
    _merge_scores(candidates, "exact_name", exact_scores)

    # --- Signal 2: Keyword / trigram name match ---
    keyword_scores = _signal_keyword_name(db, parsed.original_query, effective_type)
    _merge_scores(candidates, "keyword_name", keyword_scores)

    # --- Signal 3: Full-text search (tsvector) ---
    fulltext_scores = _signal_fulltext(db, parsed.original_query, effective_type)
    _merge_scores(candidates, "fulltext", fulltext_scores)

    # --- Signal 4: Semantic (pgvector) ---
    semantic_scores = _signal_semantic(db, parsed.semantic_query, effective_type, model)
    _merge_scores(candidates, "semantic", semantic_scores)

    # --- Signal 5: Structured filter match ---
    if parsed.extracted_filters:
        filter_scores = _signal_structured_filters(db, parsed.extracted_filters, effective_type)
        _merge_scores(candidates, "structured_filter", filter_scores)

    # --- Signal 6: Type/city contextual boost ---
    if effective_type or parsed.location_hint:
        boost_scores = _signal_type_city_boost(
            db, candidates.keys(), effective_type, parsed.location_hint
        )
        _merge_scores(candidates, "type_city_boost", boost_scores)

    if not candidates:
        return []

    # --- Score merging ---
    scored = []
    for poi_id, signals in candidates.items():
        total = 0.0
        for signal_name, weight in SIGNAL_WEIGHTS.items():
            total += signals.get(signal_name, 0.0) * weight
        scored.append((poi_id, total))

    # Sort by score descending
    scored.sort(key=lambda x: x[1], reverse=True)

    # Dynamic threshold: drop below 20% of top score, minimum 0.05
    if scored:
        top_score = scored[0][1]
        threshold = max(top_score * RELATIVE_SCORE_THRESHOLD, MIN_ABSOLUTE_SCORE)
        scored = [(pid, s) for pid, s in scored if s >= threshold]

    # Limit
    scored = scored[:limit]

    if not scored:
        return []

    # Fetch full ORM objects, preserving score order
    from ..crud.crud_poi import _enrich_poi_with_category_info
    from .. import models

    poi_ids = [pid for pid, _ in scored]
    id_to_score = {pid: s for pid, s in scored}

    pois = db.query(models.poi.PointOfInterest).filter(
        models.poi.PointOfInterest.id.in_(poi_ids)
    ).all()

    # Sort by score (the IN clause doesn't preserve order)
    poi_map = {str(p.id): p for p in pois}
    ordered = []
    for pid in poi_ids:
        poi = poi_map.get(pid)
        if poi:
            _enrich_poi_with_category_info(db, poi)
            ordered.append(poi)

    return ordered


# ---------------------------------------------------------------------------
# Signal functions
# ---------------------------------------------------------------------------

def _signal_exact_name(db: Session, query: str, poi_type: Optional[str]) -> dict:
    """Exact (case-insensitive) name match. Returns score 1.0 for matches."""
    type_filter = "AND poi_type = :poi_type" if poi_type else ""
    sql = text(f"""
        SELECT id::text FROM points_of_interest
        WHERE publication_status = 'published'
        AND LOWER(name) = LOWER(:query)
        {type_filter}
        LIMIT 5
    """)
    params = {"query": query}
    if poi_type:
        params["poi_type"] = poi_type
    try:
        rows = db.execute(sql, params).fetchall()
        return {row[0]: 1.0 for row in rows}
    except Exception as e:
        print(f"[SEARCH] Exact name signal error: {e}")
        db.rollback()
        return {}


def _signal_keyword_name(db: Session, query: str, poi_type: Optional[str]) -> dict:
    """Trigram similarity on name. Returns normalized similarity score."""
    type_filter = "AND poi_type = :poi_type" if poi_type else ""
    sql = text(f"""
        SELECT id::text,
               similarity(name, :query) AS sim
        FROM points_of_interest
        WHERE publication_status = 'published'
        AND similarity(name, :query) > :threshold
        {type_filter}
        ORDER BY sim DESC
        LIMIT 30
    """)
    params = {"query": query, "threshold": TRIGRAM_SIMILARITY_THRESHOLD}
    if poi_type:
        params["poi_type"] = poi_type
    try:
        rows = db.execute(sql, params).fetchall()
        if not rows:
            return {}
        max_sim = max(row[1] for row in rows) or 1.0
        return {row[0]: row[1] / max_sim for row in rows}
    except Exception as e:
        print(f"[SEARCH] Keyword name signal error: {e}")
        db.rollback()
        return {}


def _signal_fulltext(db: Session, query: str, poi_type: Optional[str]) -> dict:
    """Full-text search using tsvector/tsquery. Returns ts_rank score."""
    # Check if search_document column exists
    try:
        col_check = db.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'points_of_interest' AND column_name = 'search_document'"
        )).fetchone()
        if not col_check:
            return {}
    except Exception:
        db.rollback()
        return {}

    type_filter = "AND poi_type = :poi_type" if poi_type else ""
    sql = text(f"""
        SELECT id::text,
               ts_rank(search_document, websearch_to_tsquery('english', :query)) AS rank
        FROM points_of_interest
        WHERE publication_status = 'published'
        AND search_document @@ websearch_to_tsquery('english', :query)
        {type_filter}
        ORDER BY rank DESC
        LIMIT 30
    """)
    params = {"query": query}
    if poi_type:
        params["poi_type"] = poi_type
    try:
        rows = db.execute(sql, params).fetchall()
        if not rows:
            return {}
        max_rank = max(row[1] for row in rows) or 1.0
        return {row[0]: row[1] / max_rank for row in rows}
    except Exception as e:
        print(f"[SEARCH] Full-text signal error: {e}")
        db.rollback()
        return {}


def _signal_semantic(
    db: Session, query: str, poi_type: Optional[str], model
) -> dict:
    """Semantic search using pgvector embeddings."""
    if model is None:
        return {}

    # Check embedding column exists
    try:
        col_check = db.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'points_of_interest' AND column_name = 'embedding'"
        )).fetchone()
        if not col_check:
            return {}
    except Exception:
        db.rollback()
        return {}

    try:
        query_embedding = model.encode(query, show_progress_bar=False)
    except Exception as e:
        print(f"[SEARCH] Embedding encode error: {e}")
        return {}

    type_filter = "AND poi_type = :poi_type" if poi_type else ""
    sql = text(f"""
        SELECT id::text,
               1 - (embedding <=> cast(:query_embedding as vector)) AS similarity
        FROM points_of_interest
        WHERE publication_status = 'published'
        AND embedding IS NOT NULL
        {type_filter}
        ORDER BY embedding <=> cast(:query_embedding as vector)
        LIMIT 30
    """)
    params = {"query_embedding": str(list(query_embedding))}
    if poi_type:
        params["poi_type"] = poi_type
    try:
        rows = db.execute(sql, params).fetchall()
        if not rows:
            return {}
        max_sim = max(row[1] for row in rows) or 1.0
        # Normalize so best match = 1.0
        return {row[0]: max(row[1] / max_sim, 0.0) for row in rows}
    except Exception as e:
        print(f"[SEARCH] Semantic signal error: {e}")
        db.rollback()
        return {}


def _signal_structured_filters(
    db: Session, filters: list, poi_type: Optional[str]
) -> dict:
    """
    Score POIs that match extracted structured filters.

    For JSONB array fields, checks if any of the expected values are contained.
    For boolean fields, checks True.
    For text fields (values=None), checks IS NOT NULL and non-empty.
    """
    if not filters:
        return {}

    # Build WHERE conditions for each filter
    conditions = []
    params = {}
    type_filter = "AND poi_type = :poi_type" if poi_type else ""
    if poi_type:
        params["poi_type"] = poi_type

    for i, filt in enumerate(filters):
        field_name = filt.field
        # Validate field name against known columns to prevent SQL injection
        allowed_fields = {
            "pet_options", "wifi_options", "wheelchair_accessible", "public_toilets",
            "entertainment_options", "business_amenities", "youth_amenities",
            "alcohol_options", "parking_types", "facilities_options",
            "playground_available", "fishing_allowed", "hunting_fishing_allowed",
            "cost", "camping_lodging",
        }
        if field_name not in allowed_fields:
            continue

        if filt.values is None:
            # Text field: just check non-empty
            conditions.append(f"({field_name} IS NOT NULL AND {field_name} != '')")
        elif filt.values == [True]:
            conditions.append(f"{field_name} = true")
        else:
            # JSONB array: check if any value is contained
            # Use ?| operator for JSONB arrays
            param_name = f"vals_{i}"
            conditions.append(f"{field_name}::jsonb ?| :{param_name}")
            params[param_name] = filt.values

    if not conditions:
        return {}

    # Count how many filters each POI matches
    case_parts = []
    for cond in conditions:
        case_parts.append(f"CASE WHEN {cond} THEN 1 ELSE 0 END")

    score_expr = " + ".join(case_parts)
    num_filters = len(conditions)

    sql = text(f"""
        SELECT id::text,
               ({score_expr})::float / {num_filters} AS match_score
        FROM points_of_interest
        WHERE publication_status = 'published'
        AND ({' OR '.join(conditions)})
        {type_filter}
        ORDER BY match_score DESC
        LIMIT 50
    """)

    try:
        rows = db.execute(sql, params).fetchall()
        return {row[0]: row[1] for row in rows}
    except Exception as e:
        print(f"[SEARCH] Structured filter signal error: {e}")
        db.rollback()
        return {}


def _signal_type_city_boost(
    db: Session,
    candidate_ids,
    poi_type: Optional[str],
    location_hint: Optional[str],
) -> dict:
    """Small nudge for POIs matching the inferred type or location."""
    if not candidate_ids or (not poi_type and not location_hint):
        return {}

    ids = list(candidate_ids)
    if not ids:
        return {}

    conditions = []
    params = {"ids": tuple(ids)}

    if poi_type:
        conditions.append("CASE WHEN poi_type = :poi_type THEN 0.5 ELSE 0.0 END")
        params["poi_type"] = poi_type
    if location_hint:
        conditions.append(
            "CASE WHEN LOWER(address_city) = LOWER(:city) THEN 0.5 ELSE 0.0 END"
        )
        params["city"] = location_hint

    score_expr = " + ".join(conditions)
    divisor = len(conditions)

    sql = text(f"""
        SELECT id::text,
               ({score_expr}) / {divisor} AS boost
        FROM points_of_interest
        WHERE id::text = ANY(:ids)
    """)
    params["ids"] = ids

    try:
        rows = db.execute(sql, params).fetchall()
        return {row[0]: row[1] for row in rows}
    except Exception as e:
        print(f"[SEARCH] Type/city boost signal error: {e}")
        db.rollback()
        return {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _merge_scores(candidates: dict, signal_name: str, scores: dict):
    """Merge a signal's scores into the candidates dict."""
    for poi_id, score in scores.items():
        if poi_id not in candidates:
            candidates[poi_id] = {}
        candidates[poi_id][signal_name] = float(score)
