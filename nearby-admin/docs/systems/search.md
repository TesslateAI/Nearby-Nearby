# Search System

## Overview

The Search System in nearby-app provides three search methods: keyword search (pg_trgm), semantic search (pgvector embeddings), and hybrid search (combined scoring). This enables both traditional text matching and natural language understanding.

**Key Files:**
- `nearby-app/backend/app/crud/crud_poi.py` - Search functions
- `nearby-app/backend/app/api/endpoints/pois.py` - Search endpoints
- `nearby-app/backend/app/main.py` - ML model initialization
- `nearby-app/app/src/components/SearchBar.jsx` - Frontend search

---

## Search Methods

| Method | Technology | Strengths | Use Case |
|--------|------------|-----------|----------|
| **Keyword** | pg_trgm | Fast, typo-tolerant | Exact name searches |
| **Semantic** | pgvector + ML | Natural language | Conceptual queries |
| **Hybrid** | Both combined | Best of both | Default search |

---

## Keyword Search (pg_trgm)

PostgreSQL's pg_trgm extension enables fuzzy text matching with typo tolerance.

### Database Setup

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes
CREATE INDEX idx_poi_name_trgm ON points_of_interest
  USING gin (name gin_trgm_ops);

CREATE INDEX idx_poi_city_trgm ON points_of_interest
  USING gin (address_city gin_trgm_ops);
```

### Implementation

```python
# nearby-app/backend/app/crud/crud_poi.py

from sqlalchemy import func, or_, desc

def search_pois(db: Session, query: str, limit: int = 10):
    """Keyword search with fuzzy matching using pg_trgm."""

    # Calculate similarity scores
    name_sim = func.similarity(PointOfInterest.name, query)
    city_sim = func.similarity(PointOfInterest.address_city, query)

    # Combined score (name weighted 2x)
    combined_score = (name_sim * 2 + city_sim) / 3

    results = db.query(
        PointOfInterest,
        combined_score.label("similarity")
    ).filter(
        PointOfInterest.publication_status == "published",
        or_(
            PointOfInterest.name.op("%")(query),      # Trigram match
            PointOfInterest.address_city.op("%")(query)
        )
    ).order_by(
        desc("similarity")
    ).limit(limit).all()

    return [
        {
            "id": poi.id,
            "name": poi.name,
            "slug": poi.slug,
            "poi_type": poi.poi_type,
            "address_city": poi.address_city,
            "similarity": float(score)
        }
        for poi, score in results
    ]
```

### Trigram Similarity

The `%` operator finds strings with similarity above threshold (default 0.3):

```
Query: "coffe"
Matches: "Coffee" (0.7), "Caffeine" (0.4), "Cafe" (0.35)
```

---

## Semantic Search (pgvector)

Uses ML embeddings to understand query meaning, not just text matching.

### ML Model

```python
# nearby-app/backend/app/main.py

from sentence_transformers import SentenceTransformer

# Load on startup (global variable)
embedding_model = None

@app.on_event("startup")
async def load_model():
    global embedding_model
    embedding_model = SentenceTransformer('michaelfeil/embeddinggemma-300m')
    print("Embedding model loaded (~1GB RAM)")
```

### Database Setup

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to POIs
ALTER TABLE points_of_interest
ADD COLUMN embedding vector(768);  -- 768 dimensions for embeddinggemma

-- Create index for fast similarity search
CREATE INDEX idx_poi_embedding ON points_of_interest
USING ivfflat (embedding vector_cosine_ops);
```

### Implementation

```python
# nearby-app/backend/app/crud/crud_poi.py

def semantic_search_pois(
    db: Session,
    query: str,
    limit: int = 10,
    model: SentenceTransformer = None
):
    """Semantic search using ML embeddings."""

    # Check if pgvector is available
    try:
        result = db.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'points_of_interest' AND column_name = 'embedding'"
        )).fetchone()

        if not result:
            # Fall back to keyword search
            return search_pois(db, query, limit)
    except Exception:
        return search_pois(db, query, limit)

    # Encode query to vector
    query_embedding = model.encode(query).tolist()

    # Find similar POIs using cosine distance
    results = db.query(
        PointOfInterest,
        PointOfInterest.embedding.cosine_distance(query_embedding).label("distance")
    ).filter(
        PointOfInterest.publication_status == "published",
        PointOfInterest.embedding.isnot(None)
    ).order_by(
        "distance"
    ).limit(limit).all()

    return [
        {
            "id": poi.id,
            "name": poi.name,
            "slug": poi.slug,
            "poi_type": poi.poi_type,
            "address_city": poi.address_city,
            "similarity": 1 - float(distance)  # Convert distance to similarity
        }
        for poi, distance in results
    ]
```

### Query Examples

| Query | Semantic Understanding |
|-------|----------------------|
| "place to work on laptop" | Finds coffee shops, coworking spaces |
| "outdoor activities for kids" | Finds parks, playgrounds, trails |
| "romantic dinner spot" | Finds upscale restaurants |
| "quick lunch near me" | Finds fast casual restaurants |

---

## Hybrid Search

Combines keyword and semantic search with configurable weights.

### Implementation

```python
# nearby-app/backend/app/crud/crud_poi.py

def hybrid_search_pois(
    db: Session,
    query: str,
    limit: int = 10,
    keyword_weight: float = 0.3,
    semantic_weight: float = 0.7,
    model: SentenceTransformer = None
):
    """Combined keyword and semantic search."""

    # Get keyword results
    keyword_results = search_pois(db, query, limit * 2)
    keyword_scores = {r["id"]: r["similarity"] for r in keyword_results}

    # Get semantic results
    semantic_results = semantic_search_pois(db, query, limit * 2, model)
    semantic_scores = {r["id"]: r["similarity"] for r in semantic_results}

    # Combine all unique POI IDs
    all_ids = set(keyword_scores.keys()) | set(semantic_scores.keys())

    # Calculate combined scores
    combined = []
    for poi_id in all_ids:
        kw_score = keyword_scores.get(poi_id, 0)
        sem_score = semantic_scores.get(poi_id, 0)
        combined_score = (kw_score * keyword_weight) + (sem_score * semantic_weight)

        # Get POI details from whichever result has it
        poi_data = next(
            (r for r in keyword_results + semantic_results if r["id"] == poi_id),
            None
        )
        if poi_data:
            combined.append({
                **poi_data,
                "similarity": combined_score,
                "keyword_score": kw_score,
                "semantic_score": sem_score
            })

    # Sort by combined score
    combined.sort(key=lambda x: x["similarity"], reverse=True)
    return combined[:limit]
```

### Default Weights

- **Keyword**: 30% - Ensures exact name matches rank high
- **Semantic**: 70% - Prioritizes conceptual relevance

---

## API Endpoints

### GET /api/pois/search

Keyword search with pg_trgm.

```
GET /api/pois/search?q=coffee&limit=10
```

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

### GET /api/pois/semantic-search

ML-powered natural language search.

```
GET /api/pois/semantic-search?q=place%20to%20work%20on%20laptop&limit=10
```

### GET /api/pois/hybrid-search

Combined search with configurable weights.

```
GET /api/pois/hybrid-search?q=coffee&limit=10&keyword_weight=0.3&semantic_weight=0.7
```

---

## Frontend Implementation

### Search Bar

The SearchBar component supports both global search and contextual filtering within the Nearby feature.

```jsx
// nearby-app/app/src/components/SearchBar.jsx

function SearchBar({
  onSearch,
  nearbyPoiIds,      // Optional: POI IDs to filter against (for Nearby feature)
  onFilterNearby     // Optional: Callback when filtering nearby results
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced search with increased limit for nearby filtering
  const debouncedSearch = useDebouncedCallback(async (q) => {
    if (q.length < 2) {
      setResults([]);
      onFilterNearby?.(null);  // Clear filter when query is empty
      return;
    }

    setLoading(true);
    const response = await fetch(
      `/api/pois/hybrid-search?q=${encodeURIComponent(q)}&limit=50`  // 50 for nearby filtering
    );
    const data = await response.json();

    // If nearbyPoiIds provided, filter to only nearby POIs
    if (nearbyPoiIds) {
      const filtered = data.filter(poi => nearbyPoiIds.includes(poi.id));
      onFilterNearby?.(filtered.map(poi => poi.id));
      setResults(filtered);
    } else {
      setResults(data);
    }

    setLoading(false);
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (selectedIndex >= 0 && results[selectedIndex]) {
          navigateToPOI(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setResults([]);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search places, parks, trails, events..."
      />

      {loading && <Loader />}

      {results.length > 0 && (
        <SearchDropdown
          results={results}
          selectedIndex={selectedIndex}
          onSelect={navigateToPOI}
        />
      )}
    </div>
  );
}
```

### Search Dropdown

```jsx
// nearby-app/app/src/components/SearchDropdown.jsx

function SearchDropdown({ results, selectedIndex, onSelect }) {
  return (
    <div className="search-dropdown">
      {results.map((result, index) => (
        <button
          key={result.id}
          className={`search-result ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(result)}
        >
          <span className="result-type">{result.poi_type}</span>
          <span className="result-name">{result.name}</span>
          <span className="result-city">{result.address_city}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## Generating Embeddings

To enable semantic search, POIs need embedding vectors:

```python
# Script to generate embeddings for existing POIs

from sentence_transformers import SentenceTransformer

model = SentenceTransformer('michaelfeil/embeddinggemma-300m')

def generate_poi_text(poi):
    """Create searchable text from POI fields."""
    parts = [poi.name]
    if poi.teaser_description:
        parts.append(poi.teaser_description)
    if poi.address_city:
        parts.append(poi.address_city)
    if poi.poi_type:
        parts.append(poi.poi_type.replace('_', ' '))
    return ' '.join(parts)

def update_embeddings(db: Session):
    """Generate embeddings for all POIs."""
    pois = db.query(PointOfInterest).all()

    for poi in pois:
        text = generate_poi_text(poi)
        embedding = model.encode(text).tolist()
        poi.embedding = embedding

    db.commit()
```

---

## Performance Considerations

### Indexing

```sql
-- pg_trgm GIN index for text search
CREATE INDEX idx_poi_name_trgm ON points_of_interest
USING gin (name gin_trgm_ops);

-- pgvector IVFFlat index for vector search
-- Lists parameter affects accuracy vs speed tradeoff
CREATE INDEX idx_poi_embedding ON points_of_interest
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Caching

```python
# Cache model in memory (loaded once at startup)
embedding_model = None  # Global

# Consider caching frequent queries
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_search(query: str, limit: int):
    return hybrid_search_pois(db, query, limit)
```

### Batch Processing

```python
# For bulk embedding generation
def batch_encode(texts: list[str], batch_size: int = 32):
    """Encode texts in batches for efficiency."""
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_embeddings = model.encode(batch)
        embeddings.extend(batch_embeddings)
    return embeddings
```

---

## Fallback Behavior

When semantic search is unavailable (no pgvector, no embeddings), the system gracefully falls back:

```python
def hybrid_search_pois(db, query, limit, model):
    # Check if embeddings available
    if not embeddings_available(db) or model is None:
        # Fall back to keyword-only search
        return search_pois(db, query, limit)

    # ... normal hybrid search
```

---

## Best Practices

1. **Debounce searches** - Wait 300ms after typing stops
2. **Limit results** - Return 8-10 results for dropdown
3. **Show loading state** - Indicate search is in progress
4. **Keyboard navigation** - Support arrow keys and Enter
5. **Fallback gracefully** - Work without embeddings
6. **Cache model** - Load once, reuse for all queries
7. **Update embeddings** - Regenerate when POI content changes
