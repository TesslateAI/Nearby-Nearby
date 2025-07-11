# Natural Language Search System

## Overview

The Nearby Nearby application now features a sophisticated natural language search system that combines semantic understanding with geographic proximity to provide Google Maps-like search functionality.

## Architecture

### Components

1. **Text Processor** (`text_processor.py`)
   - Converts POI data into searchable text
   - Handles different POI types (business, park, trail, event)
   - Extracts categories, amenities, and custom fields

2. **Embedding Service** (`embedding_service.py`)
   - Uses Sentence Transformers (`all-MiniLM-L6-v2`)
   - Generates 384-dimensional embeddings
   - Supports batch processing for efficiency

3. **Vector Database Manager** (`vector_db_manager.py`)
   - Manages ChromaDB operations
   - Handles vector storage and retrieval
   - Provides similarity search functionality

4. **Spatial Database Manager** (`spatial_db_manager.py`)
   - Uses PostGIS for geographic queries
   - Calculates distances and proximity scores
   - Filters results by geographic radius

5. **Search Service** (`search_service.py`)
   - Orchestrates the entire search process
   - Implements hybrid scoring algorithm
   - Provides query interpretation and intent detection

### Search Flow

```
User Query → Text Processing → Embedding Generation → Vector Search → Spatial Filtering → Hybrid Scoring → Results
```

## API Endpoints

### Main Search Endpoint

**POST** `/api/search`

**Request Body:**
```json
{
  "query": "coffee near me",
  "user_location": [35.7796, -79.4194],
  "radius_km": 50,
  "limit": 20,
  "category_filter": "Food & Drinks",
  "sort_by": "relevance"
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "Pittsboro Coffee Shop",
      "poi_type": "BUSINESS",
      "description_long": "...",
      "address_city": "Pittsboro",
      "distance_km": 2.5,
      "relevance_score": 0.85,
      "semantic_score": 0.92,
      "proximity_score": 0.78,
      "categories": [...],
      "coordinates": [-79.4194, 35.7796]
    }
  ],
  "total_results": 15,
  "search_time_ms": 245,
  "query_interpretation": {
    "original_query": "coffee near me",
    "processed_query": "coffee near",
    "intent": {
      "intent": "food_search",
      "confidence": 0.8,
      "detected_terms": ["coffee"]
    },
    "expanded_terms": ["coffee", "cafe", "coffee shop"],
    "error": null
  }
}
```

### Additional Endpoints

- **POST** `/api/locations/bulk` - Bulk ingest locations
- **GET** `/api/search/stats` - Get search system statistics
- **POST** `/api/search/rebuild-index` - Rebuild search index
- **DELETE** `/api/search/location/{id}` - Delete location from index

## Hybrid Scoring Algorithm

The system uses a hybrid scoring approach that combines semantic similarity with geographic proximity:

```
Final Score = (Semantic Score × 0.7) + (Proximity Score × 0.3)
```

### Semantic Score
- Based on cosine similarity between query and POI embeddings
- Range: 0.0 to 1.0
- Higher scores indicate better semantic match

### Proximity Score
- Based on distance from user location
- Uses exponential decay function
- Range: 0.0 to 1.0
- Closer locations get higher scores

## Query Interpretation

The system automatically detects search intent:

- **Food Search**: "restaurant", "coffee", "pizza", etc.
- **Activity Search**: "park", "trail", "hiking", etc.
- **Event Search**: "event", "festival", "concert", etc.
- **Proximity Search**: "near", "nearby", "close", etc.

## Setup and Installation

### 1. Install Dependencies

```bash
pip install sentence-transformers chromadb numpy scikit-learn
```

### 2. Initialize Search System

```bash
cd backend
python scripts/initialize_search.py
```

### 3. Verify Installation

Check the search stats endpoint:
```bash
curl http://localhost:8001/api/search/stats
```

## Usage Examples

### Basic Search
```python
import requests

response = requests.post("http://localhost:8001/api/search", json={
    "query": "pizza delivery",
    "user_location": [35.7796, -79.4194],
    "radius_km": 25,
    "limit": 10
})

results = response.json()
```

### Category Filtered Search
```python
response = requests.post("http://localhost:8001/api/search", json={
    "query": "outdoor activities",
    "user_location": [35.7796, -79.4194],
    "category_filter": "Parks & Recreation",
    "limit": 15
})
```

### Distance-Based Sorting
```python
response = requests.post("http://localhost:8001/api/search", json={
    "query": "coffee",
    "user_location": [35.7796, -79.4194],
    "sort_by": "distance",
    "limit": 20
})
```

## Performance Considerations

### Vector Database
- ChromaDB stores embeddings locally
- Supports batch operations for efficiency
- Automatic indexing for fast similarity search

### Embedding Model
- `all-MiniLM-L6-v2` is optimized for speed and quality
- 384-dimensional embeddings balance performance and accuracy
- Model is cached after first load

### Spatial Queries
- PostGIS spatial indexing for fast geographic queries
- Uses `ST_DWithin` for efficient radius searches
- Combines with vector results for optimal performance

## Monitoring and Maintenance

### Search Statistics
Monitor search performance:
```bash
curl http://localhost:8001/api/search/stats
```

### Rebuilding Index
When POI data changes significantly:
```bash
curl -X POST http://localhost:8001/api/search/rebuild-index
```

### Adding New POIs
New POIs are automatically indexed when created through the API.

## Troubleshooting

### Common Issues

1. **No search results**
   - Check if search index is built: `/api/search/stats`
   - Verify POIs exist in database
   - Check user location coordinates

2. **Slow search performance**
   - Monitor vector database size
   - Consider reducing search radius
   - Check database connection

3. **Embedding generation errors**
   - Verify Sentence Transformers installation
   - Check available memory
   - Ensure text processing is working

### Debug Mode

Enable debug logging:
```python
import logging
logging.getLogger('app.services').setLevel(logging.DEBUG)
```

## Future Enhancements

1. **Advanced Intent Detection**
   - Machine learning-based intent classification
   - Context-aware query understanding

2. **Personalization**
   - User preference learning
   - Search history integration

3. **Real-time Updates**
   - WebSocket-based live updates
   - Real-time POI status changes

4. **Multi-language Support**
   - Internationalization
   - Language-specific embeddings

## Contributing

When adding new features to the search system:

1. Update the text processor for new POI fields
2. Add new intent patterns in search service
3. Update API documentation
4. Add comprehensive tests
5. Update this documentation

## Support

For issues or questions about the search system:
1. Check the troubleshooting section
2. Review API documentation
3. Check server logs for detailed error messages
4. Contact the development team 