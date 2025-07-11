# Semantic Search Testing Guide

This guide will help you test the semantic search functionality with realistic local business data.

## Prerequisites

1. **Backend is running** - Make sure your Docker containers are up
2. **Database is accessible** - Ensure the database connection is working
3. **API is responding** - Verify the backend API is available at `http://localhost:8000`

## Step 1: Generate Test Data

### Option A: Use the Enhanced Test Data Generator (Recommended)

```bash
# Navigate to the backend directory
cd backend

# Run the enhanced test data generator
python scripts/generate_semantic_test_data.py
```

This will create:
- **100 POIs** with diverse business types
- **20 categories** for semantic search
- **Realistic business names** and descriptions
- **Geographic distribution** around Chatham County, NC

### Business Types Created:
- 8 Bakeries
- 10 Coffee Shops  
- 5 Libraries
- 12 Restaurants
- 8 Grocery Stores
- 6 Pharmacies
- 6 Hardware Stores
- 8 Gas Stations
- 5 Banks
- 4 Post Offices
- 10 Parks
- 8 Hiking Trails
- 10 Events

### Option B: Use the Original Test Data Generator

```bash
python scripts/generate_test_data.py
```

## Step 2: Initialize Search Index

After generating test data, you need to rebuild the search index:

```bash
# Rebuild the search index with new data
curl -X POST http://localhost:8000/api/search/rebuild-index
```

Or use the API endpoint in your browser: `http://localhost:8000/api/search/rebuild-index`

## Step 3: Test Semantic Search

### Option A: Automated Testing Script

```bash
# Run the comprehensive test script
python scripts/test_semantic_search.py
```

This will test:
- 40 different search queries
- Performance metrics
- Query interpretation
- Result relevance

### Option B: Manual Testing via Frontend

1. **Open the frontend**: Navigate to `http://localhost:3000`
2. **Use the search bar** in the hero section
3. **Try these test queries**:

#### Basic Business Searches:
- `bakeries near me`
- `coffee shops`
- `libraries`
- `restaurants`
- `grocery stores`
- `pharmacies`
- `hardware stores`
- `gas stations`
- `banks`
- `post offices`

#### Natural Language Variations:
- `where can I get coffee`
- `I need a library`
- `find me a bakery`
- `restaurants nearby`
- `grocery store close to me`
- `pharmacy near me`

#### Descriptive Searches:
- `fresh baked bread`
- `artisan coffee`
- `public library`
- `local restaurant`
- `fresh produce`
- `prescription drugs`
- `tools and supplies`
- `fuel station`
- `banking services`
- `mail services`

#### Category-Based Searches:
- `food places`
- `shopping`
- `services`
- `outdoor activities`
- `parks`
- `hiking trails`
- `events`
- `entertainment`

#### Complex Queries:
- `coffee and pastries`
- `library with computers`
- `family restaurant`
- `organic grocery`
- `24 hour pharmacy`
- `hardware and tools`
- `gas and convenience`
- `community bank`
- `postal services`
- `local businesses`

### Option C: Direct API Testing

```bash
# Test a specific query via curl
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "bakeries near me",
    "user_location": [35.7796, -79.4194],
    "radius_km": 50,
    "limit": 20
  }'
```

## Step 4: Verify Search Results

### What to Look For:

1. **Relevance Scores**: Results should show relevance percentages (e.g., "85% match")
2. **Distance Information**: Each result should show distance from your location
3. **Query Interpretation**: The system should show detected intent
4. **Category Matching**: Results should match the search category
5. **Performance**: Search should complete in under 500ms

### Expected Results:

#### For "bakeries near me":
- Should return businesses with "bakery" in name or description
- Categories should include "Bakeries"
- Relevance scores should be high for bakery-related businesses

#### For "coffee shops":
- Should return coffee shops and cafes
- Categories should include "Coffee Shops"
- Names should contain coffee-related terms

#### For "libraries":
- Should return library businesses
- Categories should include "Libraries" and "Public Services"
- Descriptions should mention books, learning, etc.

## Step 5: Performance Testing

### Check Search Statistics:

```bash
curl http://localhost:8000/api/search/stats
```

Expected response:
```json
{
  "total_vectors": 100,
  "collection_name": "poi_embeddings"
}
```

### Monitor Search Performance:

The test script will show:
- Average search time (should be < 500ms)
- API response time
- Success rate (should be > 95%)

## Step 6: Troubleshooting

### Common Issues:

1. **No results returned**:
   - Check if search index was rebuilt
   - Verify test data was created
   - Check API logs for errors

2. **Low relevance scores**:
   - Ensure text processing is working
   - Check if embeddings were generated correctly
   - Verify query preprocessing

3. **Slow search performance**:
   - Check ChromaDB status
   - Monitor database performance
   - Verify vector search is working

### Debug Commands:

```bash
# Check if vectors exist
curl http://localhost:8000/api/search/stats

# Check database for POIs
curl http://localhost:8000/api/pois/?limit=5

# Test fuzzy search
curl "http://localhost:8000/api/search/fuzzy/suggestions?query=bakery"

# Check categories
curl http://localhost:8000/api/categories/tree
```

## Step 7: Advanced Testing

### Test Edge Cases:

1. **Typos and Variations**:
   - `bakery` vs `bakeries`
   - `coffee` vs `cafe`
   - `library` vs `libraries`

2. **Geographic Queries**:
   - `near me`
   - `close to me`
   - `in Pittsboro`
   - `near Siler City`

3. **Complex Intent**:
   - `I want to buy bread`
   - `Need to get coffee`
   - `Looking for a place to study`

### Test Hybrid Search:

The system combines:
- **Semantic similarity** (70% weight)
- **Geographic proximity** (30% weight)

Verify that:
- Nearby results rank higher
- Relevant results appear first
- Distance affects ranking appropriately

## Success Criteria

✅ **Search works for all business types**
✅ **Natural language queries return relevant results**
✅ **Performance is under 500ms average**
✅ **Relevance scores are meaningful**
✅ **Geographic filtering works correctly**
✅ **Query interpretation provides insights**

## Next Steps

After successful testing:

1. **Customize the location** in `generate_semantic_test_data.py` for your area
2. **Add more business types** if needed
3. **Tune the hybrid scoring weights** in `search_service.py`
4. **Optimize performance** based on test results
5. **Deploy to production** with real data

## Support

If you encounter issues:

1. Check the backend logs: `docker logs nearby-nearby-backend-1`
2. Verify database connectivity
3. Test API endpoints individually
4. Review the search system documentation in `SEARCH_SYSTEM.md` 