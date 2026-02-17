# Search System

## Overview

The Search System in nearby-app uses a **multi-signal search engine** that scores each POI across 6 independent signals, then combines them with tunable weights. A query processor first extracts amenity filters, POI type hints, location hints, and trail difficulty from natural language queries.

**Key Files:**
- `nearby-app/backend/app/search/search_engine.py` - Multi-signal scoring and merge logic
- `nearby-app/backend/app/search/query_processor.py` - Natural language query parsing
- `nearby-app/backend/app/search/constants.py` - Signal weights, synonyms, amenity patterns
- `nearby-app/backend/app/api/endpoints/pois.py` - Search API endpoints
- `nearby-app/backend/app/main.py` - ML model initialization, tsvector index creation
- `nearby-app/app/src/components/SearchBar.jsx` - Frontend search with dropdown
- `nearby-app/app/src/pages/Explore.jsx` - Full-page search results

---

## Architecture

```
User Query: "pet friendly cafe with wifi near pittsboro"
                          │
                          ▼
              ┌─────────────────────┐
              │   Query Processor   │
              │   (parse_query)     │
              ├─────────────────────┤
              │ Extracted:          │
              │ - Filters: pet_     │
              │   options, wifi     │
              │ - Type: BUSINESS    │
              │ - Location: pitsboro│
              │ - Semantic: full    │
              │   original query    │
              └─────────┬───────────┘
                        │
                        ▼
    ┌─────────────────────────────────────────────┐
    │         Multi-Signal Search Engine            │
    ├─────────────────────────────────────────────┤
    │                                               │
    │  Signal 1: Exact Name Match (0.15)           │
    │  Signal 2: Trigram Name Similarity (0.15)    │
    │  Signal 3: Full-Text Search / tsvector (0.10)│
    │  Signal 4: Semantic / pgvector (0.45)        │
    │  Signal 5: Structured Filter Match (0.10)    │
    │  Signal 6: Type/City Contextual Boost (0.05) │
    │                                               │
    │  Total: 1.00                                  │
    ├─────────────────────────────────────────────┤
    │  Score Merge → Dynamic Threshold → Rank      │
    └─────────────────────────────────────────────┘
```

---

## The 6 Search Signals

### Signal 1: Exact Name Match (weight: 0.15)

Checks if the query exactly matches a POI name (case-insensitive). Returns score 1.0 for exact match, 0.0 otherwise. Ensures searching "Joe's Coffee" returns Joe's Coffee as #1.

### Signal 2: Trigram Name Similarity (weight: 0.15)

Uses PostgreSQL `pg_trgm` extension for fuzzy text matching on the `name` column. Handles typos and partial matches. Threshold: 0.15 similarity minimum.

```sql
SELECT id, similarity(name, 'query') as sim
FROM points_of_interest
WHERE name % 'query' AND publication_status = 'published'
ORDER BY sim DESC;
```

### Signal 3: Full-Text Search (weight: 0.10)

Uses a GENERATED tsvector column with English stemming. Created on startup:

```sql
ALTER TABLE points_of_interest
ADD COLUMN IF NOT EXISTS tsvector_col tsvector
GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(long_description, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_poi_tsvector ON points_of_interest USING gin(tsvector_col);
```

Searches using `ts_rank`:
```sql
SELECT id, ts_rank(tsvector_col, plainto_tsquery('english', 'query')) as rank
FROM points_of_interest
WHERE tsvector_col @@ plainto_tsquery('english', 'query')
  AND publication_status = 'published';
```

This catches description-only matches (e.g., searching "kayak" finds a park whose description mentions kayak rentals even if "kayak" isn't in the name).

### Signal 4: Semantic Search (weight: 0.45)

Uses pgvector ML embeddings from the `embeddinggemma-300m` model. Encodes the full original query and finds nearest neighbors by cosine distance.

```python
query_embedding = model.encode(query).tolist()
# cosine_distance query via pgvector
```

Falls back to keyword-only search if pgvector is unavailable or embeddings haven't been generated.

### Signal 5: Structured Filter Match (weight: 0.10)

The query processor extracts amenity filters from natural language. For each extracted filter, the engine checks if the POI's JSONB fields contain matching values.

Examples:
- "pet friendly" → checks `pet_options` is not empty
- "free wifi" → checks `wifi_options` contains "free"
- "wheelchair accessible" → checks `accessibility_features` is not empty

Patterns are defined in `constants.py` via `AMENITY_PATTERNS_STATIC` and dynamically loaded from `shared/constants/field_options.py`.

### Signal 6: Type/City Contextual Boost (weight: 0.05)

Small nudge for POIs matching the inferred type or city:
- If query processor detects type hint (e.g., "restaurant" → BUSINESS), matching POIs get a boost
- If a location hint is extracted (e.g., "near Pittsboro"), POIs in that city get a boost

---

## Query Processor

The `parse_query()` function extracts structured information from natural language:

```python
from app.search import parse_query

parsed = parse_query("easy hiking trail near siler city with restrooms")
# ParsedQuery(
#   original_query="easy hiking trail near siler city with restrooms",
#   semantic_query="easy hiking trail near siler city with restrooms",
#   extracted_filters=[ExtractedFilter(field="toilet_locations", values=None)],
#   poi_type_hint="TRAIL",
#   location_hint="siler city",
#   trail_difficulty_hint="easy"
# )
```

### Extraction Rules

| Feature | Pattern | Result |
|---------|---------|--------|
| Amenity filters | "pet friendly", "wifi", "wheelchair", "restrooms" | ExtractedFilter with field name |
| POI type hints | "restaurant", "cafe", "trail", "park", "event" | POIType enum value |
| Location hints | "near X", "in X", "around X", "by X" | City/location string |
| Trail difficulty | "easy", "moderate", "hard/difficult" | Difficulty level |

Synonyms are defined in `constants.py`:
- `POI_TYPE_SYNONYMS`: Maps words like "restaurant", "cafe", "eatery" → "BUSINESS"
- `TRAIL_DIFFICULTY_SYNONYMS`: Maps "beginner" → "easy", "challenging" → "hard"
- `LOCATION_PREFIXES`: {"near", "in", "around", "by"}

---

## Score Merging and Thresholding

After all 6 signals return their scores, the engine:

1. **Weighted combine**: For each POI, compute `sum(signal_score * signal_weight)`
2. **Dynamic threshold**: Drop any POI scoring below 20% of the top result (minimum absolute: 0.02)
3. **Sort**: Return results ordered by combined score, descending

Constants from `constants.py`:
```python
SIGNAL_WEIGHTS = {
    "semantic": 0.45,
    "keyword_name": 0.15,
    "exact_name": 0.15,
    "fulltext": 0.10,
    "structured_filter": 0.10,
    "type_city_boost": 0.05,
}
MIN_ABSOLUTE_SCORE = 0.02
RELATIVE_SCORE_THRESHOLD = 0.20
TRIGRAM_SIMILARITY_THRESHOLD = 0.15
```

---

## API Endpoints

### GET /api/pois/search

Keyword search with pg_trgm.

```
GET /api/pois/search?q=coffee&limit=10
```

### GET /api/pois/semantic-search

ML-powered natural language search.

```
GET /api/pois/semantic-search?q=place%20to%20work%20on%20laptop&limit=10
```

### GET /api/pois/hybrid-search

Multi-signal combined search (the primary search endpoint).

```
GET /api/pois/hybrid-search?q=pet+friendly+cafe+with+wifi&limit=10&poi_type=BUSINESS
```

Query Parameters:
- `q` (string): Search query
- `limit` (int): Max results (default: 10)
- `poi_type` (string, optional): Filter by POI type

Response:
```json
[
  {
    "id": "uuid",
    "name": "Joe's Coffee",
    "slug": "joes-coffee-pittsboro",
    "poi_type": "BUSINESS",
    "address_city": "Pittsboro",
    "similarity": 0.85
  }
]
```

---

## Frontend Search UX

### Search Bar Behavior

1. **Typing**: Debounced (300ms) hybrid search → dropdown shows results with POI type badges
2. **Enter key / Search button**: Navigates to `/explore?q=query` for full-page results
3. **Dropdown footer**: "Search in Explore" CTA + "Can't find it?" → links to Claim Business page
4. **Arrow keys**: Navigate dropdown results; Enter selects

### Explore Page Search Mode

When `/explore?q=query&type=PARK` is loaded:
- Calls `/api/pois/hybrid-search` with query and optional type filter
- Shows results in grid layout with NearbyFilters (light variant)
- Filter pills (All / Businesses / Events / Parks / Trails) update the `type` URL param

### Hero Filter Pills

The homepage Hero section has quick-filter pills that link to `/explore?type=BUSINESS` etc.

---

## Generating Embeddings

```bash
# Generate embeddings for all POIs (run after data changes)
python generate_embeddings.py --force
```

The embedding text now includes categories, amenities, facilities, and trail-specific info for richer semantic matching.

---

## Fallback Behavior

| Condition | Behavior |
|-----------|----------|
| No pgvector extension | Semantic signal returns empty; other 5 signals still work |
| No embeddings generated | Same as above |
| ML model not loaded | Semantic signal skipped |
| Empty/nonsense query | Returns empty list (no crash) |
| Query too short (< 2 chars) | Frontend doesn't fire search |

---

## Performance Considerations

### Indexes

```sql
-- pg_trgm GIN indexes for fuzzy search
CREATE INDEX idx_poi_name_trgm ON points_of_interest USING gin (name gin_trgm_ops);
CREATE INDEX idx_poi_city_trgm ON points_of_interest USING gin (address_city gin_trgm_ops);

-- tsvector GIN index for full-text search
CREATE INDEX idx_poi_tsvector ON points_of_interest USING gin (tsvector_col);

-- pgvector IVFFlat index for vector search (production)
CREATE INDEX idx_poi_embedding ON points_of_interest USING ivfflat (embedding vector_cosine_ops);
```

### Caching

- ML model loaded once at startup (global variable)
- tsvector column is GENERATED STORED (no runtime computation)
- Consider LRU cache for frequent queries

### Batch Processing

```python
# For bulk embedding generation
def batch_encode(texts: list[str], batch_size: int = 32):
    embeddings = model.encode(texts, batch_size=batch_size)
    return embeddings
```
