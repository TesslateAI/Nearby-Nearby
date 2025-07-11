# Fuzzy Search Implementation

This document describes the fuzzy search implementation in NearbyNearby, which provides typo-tolerant search capabilities using the `fuzzywuzzy` library.

## Overview

The fuzzy search system is designed to handle common typos, misspellings, and variations in user queries, making the search experience more forgiving and user-friendly. It integrates with the existing vector search system to provide comprehensive search results.

## Key Features

- **Typo Correction**: Automatically corrects common misspellings
- **Abbreviation Expansion**: Expands common abbreviations to full terms
- **Fuzzy Matching**: Finds similar POIs using multiple similarity algorithms
- **Phonetic Matching**: Uses phonetic algorithms for sound-alike matching
- **Hybrid Search**: Combines multiple matching strategies for optimal results

## Dependencies

The fuzzy search system requires the following Python packages:

```bash
pip install fuzzywuzzy python-Levenshtein jellyfish
```

- `fuzzywuzzy`: Main fuzzy string matching library
- `python-Levenshtein`: Fast Levenshtein distance calculation
- `jellyfish`: Additional phonetic and string similarity algorithms

## Architecture

### Core Components

1. **FuzzySearchService** (`app/services/fuzzy_search_service.py`)
   - Main service class handling all fuzzy search operations
   - Uses `fuzzywuzzy` for string similarity calculations
   - Integrates with database for POI matching

2. **TextProcessor Integration** (`app/services/text_processor.py`)
   - Integrates fuzzy search into query processing pipeline
   - Applies typo correction and abbreviation expansion
   - Maintains compatibility with vector search

3. **API Endpoints** (`app/api/endpoints/search.py`)
   - Provides fuzzy search endpoints
   - Returns suggestions and similar POIs
   - Integrates with main search functionality

## Usage

### Basic Typo Correction

```python
from app.services.fuzzy_search_service import fuzzy_search_service

# Correct typos in a query
query = "cofee shop near me"
cleaned = fuzzy_search_service.clean_query(query)
corrected = fuzzy_search_service.correct_typos(cleaned)
# Result: "coffee shop near me"
```

### Abbreviation Expansion

```python
# Expand abbreviations
query = "gas st"
expanded = fuzzy_search_service.expand_abbreviations(query)
# Result: "gas station street"
```

### Finding Similar POIs

```python
from app.database import SessionLocal

db = SessionLocal()
similar_pois = fuzzy_search_service.find_similar_pois(db, "coffee shop", limit=5)
db.close()
```

### Getting Fuzzy Suggestions

```python
suggestions = fuzzy_search_service.get_fuzzy_suggestions(db, "cof", limit=3)
# Returns: ["coffee", "coffee shop", "cafe"]
```

### Hybrid Search

```python
results = fuzzy_search_service.hybrid_fuzzy_search(db, "cofee shop near me", limit=10)
# Combines multiple matching strategies for best results
```

## API Endpoints

### Fuzzy Suggestions

```
GET /api/search/fuzzy-suggestions?query={query}&limit={limit}
```

Returns autocomplete suggestions based on fuzzy matching.

### Similar POIs

```
GET /api/search/similar-pois?query={query}&limit={limit}
```

Returns POIs with similar names or descriptions.

### Hybrid Fuzzy Search

```
GET /api/search/hybrid-fuzzy?query={query}&limit={limit}
```

Performs comprehensive fuzzy search combining multiple strategies.

## Configuration

### Typo Mapping

The system includes a comprehensive mapping of common typos:

```python
typo_mapping = {
    'cofee': 'coffee',
    'resturant': 'restaurant',
    'piza': 'pizza',
    'gim': 'gym',
    'parc': 'park',
    # ... more mappings
}
```

### Abbreviation Mapping

Common abbreviations are automatically expanded:

```python
abbreviation_mapping = {
    'st': 'street',
    'ave': 'avenue',
    'rd': 'road',
    'blvd': 'boulevard',
    'gas': 'gas station',
    'atm': 'atm',
    # ... more mappings
}
```

## Similarity Algorithms

The system uses multiple similarity algorithms from `fuzzywuzzy`:

1. **Ratio**: Basic string similarity using Levenshtein distance
2. **Partial Ratio**: Best partial string matching
3. **Token Sort Ratio**: Handles word order differences
4. **Token Set Ratio**: Handles duplicate words

### Phonetic Matching

Uses `jellyfish` library for phonetic matching:

- **Metaphone**: Phonetic encoding for sound-alike matching
- **Jaro-Winkler**: Similarity for short strings like names

## Performance Considerations

### Database Queries

- Fuzzy search operations are performed in-memory after fetching POIs
- Consider implementing caching for frequently accessed POI data
- Limit the number of POIs fetched for fuzzy matching (default: 1000)

### Similarity Calculations

- `fuzzywuzzy` with `python-Levenshtein` provides fast similarity calculations
- Multiple similarity algorithms are computed in parallel where possible
- Results are cached to avoid redundant calculations

## Testing

Run the fuzzy search tests:

```bash
cd backend
python scripts/test_fuzzy_search.py
```

The test script covers:
- Typo correction
- Abbreviation expansion
- Fuzzy suggestions
- Similar POI finding
- Hybrid search
- Phonetic matching

## Integration with Vector Search

The fuzzy search system integrates seamlessly with the existing vector search:

1. **Query Preprocessing**: Fuzzy correction is applied before vector embedding
2. **Hybrid Results**: Combines fuzzy and vector search results
3. **Fallback**: Falls back to vector search if fuzzy search fails

## Benefits of Using fuzzywuzzy

1. **Proven Library**: Well-tested and widely used
2. **Multiple Algorithms**: Various similarity metrics for different use cases
3. **Performance**: Optimized C implementation with `python-Levenshtein`
4. **Flexibility**: Configurable thresholds and scoring methods
5. **Maintenance**: Active development and community support

## Future Enhancements

1. **Machine Learning**: Train custom similarity models on user data
2. **Context Awareness**: Consider user location and preferences
3. **Real-time Learning**: Learn from user corrections and feedback
4. **Multi-language Support**: Extend to support multiple languages
5. **Advanced Phonetic Matching**: Implement more sophisticated phonetic algorithms

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure `fuzzywuzzy` and `python-Levenshtein` are installed
2. **Performance Issues**: Reduce the number of POIs fetched for fuzzy matching
3. **Memory Usage**: Monitor memory usage with large POI datasets

### Debugging

Enable debug logging to see fuzzy search operations:

```python
import logging
logging.getLogger('app.services.fuzzy_search_service').setLevel(logging.DEBUG)
```

## Conclusion

The fuzzy search implementation using `fuzzywuzzy` provides robust typo-tolerant search capabilities while maintaining good performance and ease of maintenance. It enhances the user experience by handling common search variations and misspellings effectively. 