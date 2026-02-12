# app/crud/crud_poi.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, literal_column, select, and_
from geoalchemy2 import Geography
from .. import models
from ..schemas.poi import PointGeometry

def _enrich_poi_with_category_info(db: Session, poi: models.poi.PointOfInterest) -> None:
    """
    Safely populate main_category and secondary_categories on a POI instance.
    Uses the is_main flag from poi_category_association table.
    """
    from ..models.poi import poi_category_association
    from ..models.poi import Category

    # Query for main category (is_main=True)
    main_cat_stmt = select(Category).join(
        poi_category_association,
        Category.id == poi_category_association.c.category_id
    ).where(
        and_(
            poi_category_association.c.poi_id == poi.id,
            poi_category_association.c.is_main == True
        )
    )
    main_cat = db.execute(main_cat_stmt).first()

    # Query for secondary categories (is_main=False)
    secondary_cats_stmt = select(Category).join(
        poi_category_association,
        Category.id == poi_category_association.c.category_id
    ).where(
        and_(
            poi_category_association.c.poi_id == poi.id,
            poi_category_association.c.is_main == False
        )
    )
    secondary_cats = [row[0] for row in db.execute(secondary_cats_stmt).all()]

    # Set as instance attributes for serialization
    poi.__dict__['main_category'] = main_cat[0] if main_cat else None
    poi.__dict__['secondary_categories'] = secondary_cats

def get_poi(db: Session, poi_id: str):
    poi = db.query(models.poi.PointOfInterest).options(
        joinedload(models.poi.PointOfInterest.business),
        joinedload(models.poi.PointOfInterest.park),
        joinedload(models.poi.PointOfInterest.trail),
        joinedload(models.poi.PointOfInterest.event),
        joinedload(models.poi.PointOfInterest.categories)
    ).filter(
        models.poi.PointOfInterest.id == poi_id,
        models.poi.PointOfInterest.publication_status == 'published'
    ).first()

    if poi:
        _enrich_poi_with_category_info(db, poi)

    return poi

def search_pois(db: Session, query: str):
    """
    Enhanced search with typo tolerance, attribute matching, and relevance ranking.

    Searches across:
    - POI names and cities (fuzzy matching with pg_trgm)
    - Attributes (pet-friendly, wifi, parking, etc.) - returns ALL POIs for frontend filtering
    - Categories
    - Descriptions

    For attribute searches (pet, wifi, parking, etc.), returns all published POIs
    and lets the frontend filter by actual attribute data.
    """
    from sqlalchemy import cast, String, text

    query_lower = query.lower().strip()

    # List of attribute keywords that should return all POIs for frontend filtering
    attribute_keywords = [
        'pet', 'pets', 'dog', 'dogs', 'animal',
        'wifi', 'wi-fi', 'internet', 'wireless',
        'parking', 'wheelchair', 'accessible', 'accessibility',
        'restroom', 'bathroom', 'toilet',
        'playground', 'play',
        'alcohol', 'beer', 'wine', 'bar', 'drink'
    ]

    # Check if this is an attribute-only search
    is_attribute_search = any(keyword == query_lower or keyword in query_lower.split() for keyword in attribute_keywords)

    if is_attribute_search:
        # For attribute searches, return all published POIs
        # Frontend will filter based on actual attribute values
        print(f"[INFO] Attribute search detected for '{query}', returning all POIs for frontend filtering")
        pois = db.query(models.poi.PointOfInterest).filter(
            models.poi.PointOfInterest.publication_status == 'published'
        ).limit(100).all()

        # Enrich with category information
        for poi in pois:
            _enrich_poi_with_category_info(db, poi)

        return pois

    # For non-attribute searches, use normal text-based search
    # Calculate similarity scores for fuzzy matching (catches typos)
    name_similarity = func.similarity(models.poi.PointOfInterest.name, query)
    city_similarity = func.similarity(models.poi.PointOfInterest.address_city, query)

    # Search pattern for ILIKE searches
    search_pattern = f"%{query}%"

    # Build the main search filter
    search_conditions = [
        # Fuzzy match on name (similarity > 0.3 means reasonably close match)
        name_similarity > 0.3,
        # Fuzzy match on city
        city_similarity > 0.3,
        # Exact substring match as fallback for precise searches
        models.poi.PointOfInterest.name.ilike(search_pattern),
        models.poi.PointOfInterest.address_city.ilike(search_pattern),
        # Search in descriptions
        models.poi.PointOfInterest.description_long.ilike(search_pattern),
        models.poi.PointOfInterest.description_short.ilike(search_pattern)
    ]

    results = db.query(
        models.poi.PointOfInterest,
        # Calculate combined relevance score (name weighted 2x more than city)
        (name_similarity * 2 + city_similarity).label('relevance')
    ).filter(
        models.poi.PointOfInterest.publication_status == 'published'
    ).filter(
        or_(*search_conditions)
    ).order_by(
        # Sort by relevance (best matches first)
        literal_column('relevance').desc()
    ).limit(50).all()

    # Return just the POI objects (not the tuples with relevance score)
    pois = [result[0] for result in results]

    # Enrich with category information
    for poi in pois:
        _enrich_poi_with_category_info(db, poi)

    return pois

def get_nearby_pois(db: Session, poi_id: str, radius_miles: float = 5.0):
    from geoalchemy2.shape import to_shape

    origin_poi = db.query(models.poi.PointOfInterest).filter(models.poi.PointOfInterest.id == poi_id).first()
    if not origin_poi:
        return []

    # Extract coordinates from origin POI
    origin_point = to_shape(origin_poi.location)
    origin_lon = origin_point.x
    origin_lat = origin_point.y

    # Convert miles to meters (1 mile = 1609.34 meters)
    radius_meters = radius_miles * 1609.34

    # Use geography type for accurate distance in meters
    distance_expr = literal_column(
        f"ST_Distance(location::geography, ST_MakePoint({origin_lon}, {origin_lat})::geography)"
    )

    nearby_pois_with_distance = db.query(
        models.poi.PointOfInterest,
        distance_expr.label('distance_meters')
    ).filter(
        models.poi.PointOfInterest.id != poi_id,
        models.poi.PointOfInterest.publication_status == 'published',
        distance_expr <= radius_meters
    ).order_by('distance_meters').all()

    # The query returns tuples of (PointOfInterest, distance), so we need to format them.
    results = []
    for poi, distance in nearby_pois_with_distance:
        poi.distance_meters = distance
        _enrich_poi_with_category_info(db, poi)
        results.append(poi)

    return results

def semantic_search_pois(db: Session, query: str, limit: int = 10, model=None):
    """
    Semantic search for POIs using vector embeddings.

    Uses michaelfeil/embeddinggemma-300m model to understand the meaning of queries
    and find semantically similar POIs.

    Falls back to keyword search if pgvector/embedding is not available.

    Args:
        db: Database session
        query: Natural language search query
        limit: Maximum number of results to return
        model: Pre-loaded embedding model (if None, will load on demand)

    Returns:
        List of POIs ranked by semantic similarity
    """
    # Check if embedding column exists in database
    try:
        from sqlalchemy import text
        result = db.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'points_of_interest' AND column_name = 'embedding'"
        )).fetchone()
        if not result:
            print("[INFO] Embedding column not found, falling back to keyword search")
            return search_pois(db, query)
    except Exception as e:
        print(f"[ERROR] Failed to check embedding column: {e}")
        db.rollback()  # Rollback failed transaction before fallback
        return search_pois(db, query)

    # Use pre-loaded model or load on demand
    if model is None:
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer("michaelfeil/embeddinggemma-300m")
        except Exception as e:
            print(f"[ERROR] Failed to load embedding model: {e}")
            print("[FALLBACK] Using keyword search instead")
            return search_pois(db, query)

    # Generate query embedding
    try:
        query_embedding = model.encode(query, show_progress_bar=False)
    except Exception as e:
        print(f"[ERROR] Failed to encode query: {e}")
        return search_pois(db, query)

    # Use raw SQL for semantic search since embedding column is not in ORM model
    try:
        from sqlalchemy import text
        sql = text("""
            SELECT id FROM points_of_interest
            WHERE publication_status = 'published'
            AND embedding IS NOT NULL
            ORDER BY embedding <=> :query_embedding
            LIMIT :limit
        """)
        result = db.execute(sql, {"query_embedding": str(list(query_embedding)), "limit": limit})
        poi_ids = [row[0] for row in result.fetchall()]

        if not poi_ids:
            return search_pois(db, query)

        # Fetch full POI objects
        results = db.query(models.poi.PointOfInterest).filter(
            models.poi.PointOfInterest.id.in_(poi_ids)
        ).all()

        # Enrich with category information
        for poi in results:
            _enrich_poi_with_category_info(db, poi)

        return results
    except Exception as e:
        print(f"[ERROR] Semantic search failed: {e}")
        print("[FALLBACK] Using keyword search instead")
        db.rollback()  # Rollback failed transaction before fallback
        return search_pois(db, query)

def hybrid_search_pois(
    db: Session,
    query: str,
    limit: int = 10,
    keyword_weight: float = 0.3,
    semantic_weight: float = 0.7,
    model=None
):
    """
    Hybrid search combining keyword matching and semantic understanding.

    Combines traditional keyword search (finds exact matches) with semantic search
    (understands meaning) for best of both worlds.

    Falls back to keyword search if pgvector/embedding is not available.

    Args:
        db: Database session
        query: Search query
        limit: Maximum number of results
        keyword_weight: Weight for keyword search (0-1)
        semantic_weight: Weight for semantic search (0-1)
        model: Pre-loaded embedding model (if None, will load on demand)

    Returns:
        List of POIs ranked by combined score
    """
    # Check if this is an attribute-based search - delegate to keyword search
    # which returns all published POIs for frontend attribute filtering
    query_lower = query.lower().strip()
    attribute_keywords = [
        'pet', 'pets', 'dog', 'dogs', 'animal',
        'wifi', 'wi-fi', 'internet', 'wireless',
        'parking', 'wheelchair', 'accessible', 'accessibility',
        'restroom', 'bathroom', 'toilet',
        'playground', 'play',
        'alcohol', 'beer', 'wine', 'bar', 'drink',
        'outdoor', 'patio', 'terrace',
        'bike', 'bicycle',
        'rental', 'rent',
        'smoking', 'smoke', 'cigarette',
        'cheap', 'affordable', 'budget',
        'expensive', 'upscale', 'luxury',
        'gift card', 'discount', 'deal',
        'delivery', 'takeout',
        'reservation', 'appointment',
        'family', 'kid friendly', 'kids', 'children',
        'open now'
    ]
    is_attribute_search = any(
        keyword == query_lower or keyword in query_lower.split()
        for keyword in attribute_keywords
    )
    if is_attribute_search:
        print(f"[INFO] Hybrid search: attribute keyword detected for '{query}', delegating to keyword search")
        return search_pois(db, query)

    # Check if embedding column exists in database
    try:
        from sqlalchemy import text
        result = db.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'points_of_interest' AND column_name = 'embedding'"
        )).fetchone()
        if not result:
            print("[INFO] Embedding column not found, falling back to keyword search")
            return search_pois(db, query)
    except Exception as e:
        print(f"[ERROR] Failed to check embedding column: {e}")
        return search_pois(db, query)

    # Normalize weights
    total_weight = keyword_weight + semantic_weight
    if total_weight > 0:
        keyword_weight = keyword_weight / total_weight
        semantic_weight = semantic_weight / total_weight

    # Use pre-loaded model or load on demand
    if model is None:
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer("michaelfeil/embeddinggemma-300m")
        except Exception as e:
            print(f"[ERROR] Failed to load embedding model: {e}")
            print("[FALLBACK] Using keyword search only")
            return search_pois(db, query)

    # Generate query embedding
    try:
        query_embedding = model.encode(query, show_progress_bar=False)
    except Exception as e:
        print(f"[ERROR] Failed to encode query: {e}")
        print("[FALLBACK] Using keyword search only")
        return search_pois(db, query)

    # Use raw SQL for hybrid search since embedding column is not in ORM model
    try:
        from sqlalchemy import text
        sql = text("""
            SELECT id,
                   (similarity(name, :query) * 2 + similarity(address_city, :query)) / 3 * :kw +
                   (1 - (embedding <=> cast(:query_embedding as vector))) * :sw AS combined_score
            FROM points_of_interest
            WHERE publication_status = 'published'
            AND embedding IS NOT NULL
            AND (
                (similarity(name, :query) * 2 + similarity(address_city, :query)) / 3 * :kw +
                (1 - (embedding <=> cast(:query_embedding as vector))) * :sw
            ) > 0.15
            ORDER BY combined_score DESC
            LIMIT :limit
        """)
        result = db.execute(sql, {
            "query": query,
            "query_embedding": str(list(query_embedding)),
            "kw": keyword_weight,
            "sw": semantic_weight,
            "limit": limit
        })
        poi_ids = [row[0] for row in result.fetchall()]

        if not poi_ids:
            return search_pois(db, query)

        # Fetch full POI objects
        pois = db.query(models.poi.PointOfInterest).filter(
            models.poi.PointOfInterest.id.in_(poi_ids)
        ).all()

        # Enrich with category information
        for poi in pois:
            _enrich_poi_with_category_info(db, poi)

        return pois
    except Exception as e:
        print(f"[ERROR] Hybrid search failed: {e}")
        print("[FALLBACK] Using keyword search only")
        db.rollback()  # Rollback failed transaction before fallback
        return search_pois(db, query)