#!/usr/bin/env python3
"""
Test script for fuzzy search using fuzzywuzzy in text_processor
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.text_processor import TextProcessor

def test_fuzzy_search():
    """Test the fuzzy search functionality in text processor"""
    print("🧪 Testing Fuzzy Search with fuzzywuzzy in TextProcessor")
    print("=" * 60)
    
    # Initialize text processor
    text_processor = TextProcessor()
    
    # Test queries with typos
    test_queries = [
        "cofee shop",           # coffee
        "resturant",            # restaurant
        "piza place",           # pizza
        "gim near me",          # gym
        "parc",                 # park
        "pharmacy",             # pharmacy
        "gas station",          # gas station
        "atm machine",          # atm
        "supermarket",          # grocery store
        "university",           # university
    ]
    
    print("\n📝 Testing Query Processing with Fuzzy Search:")
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        
        # Test basic processing
        processed = text_processor.process_query(query, enable_fuzzy_search=True)
        print(f"  Processed: '{processed}'")
        
        # Test fuzzy suggestions
        suggestions = text_processor.get_fuzzy_suggestions(query)
        if suggestions['metadata']['fuzzy_search_available']:
            print(f"  Corrections: {suggestions['corrections'][:3]}")
            print(f"  Similar queries: {suggestions['similar_queries'][:3]}")
        else:
            print(f"  Fuzzy search not available: {suggestions['metadata']['message']}")
    
    # Test similar POI finding
    print("\n🏢 Testing Similar POI Finding:")
    sample_poi_names = [
        "Starbucks Coffee",
        "McDonald's Restaurant", 
        "Gold's Gym",
        "Central Park",
        "Pizza Hut",
        "Walmart Store",
        "Bank of America",
        "CVS Pharmacy"
    ]
    
    similar_queries = ["starbuks", "mcdonalds", "golds gym", "central parc", "piza hut"]
    
    for query in similar_queries:
        print(f"\nQuery: '{query}'")
        similar_pois = text_processor.find_similar_poi_names(query, sample_poi_names, threshold=70)
        
        if similar_pois:
            print(f"  Similar POIs found: {len(similar_pois)}")
            for poi in similar_pois[:3]:  # Top 3
                print(f"    - '{poi['name']}' (similarity: {poi['similarity_score']:.3f})")
        else:
            print("  No similar POIs found")
    
    # Test fuzzy search statistics
    print("\n📊 Fuzzy Search Statistics:")
    stats = text_processor.get_fuzzy_search_stats()
    
    if stats['fuzzy_search_available']:
        print(f"  Typo mappings: {stats['typo_mapping_count']}")
        print(f"  Supported algorithms: {', '.join(stats['supported_algorithms'])}")
        print(f"  Similarity threshold: {stats['similarity_threshold']}")
        print(f"  Library: {stats['library']}")
        
        print("\n  Typo categories:")
        for category, count in stats['typo_categories'].items():
            print(f"    {category}: {count}")
    else:
        print(f"  {stats['message']}")

def test_typo_correction():
    """Test typo correction functionality"""
    print("\n🔤 Testing Typo Correction:")
    print("=" * 30)
    
    text_processor = TextProcessor()
    
    test_typos = [
        "cofee", "resturant", "piza", "gim", "parc",
        "pharmacy", "gas", "atm", "supermarket", "university"
    ]
    
    for typo in test_typos:
        corrected = text_processor._correct_typos_with_fuzzywuzzy(typo)
        print(f"'{typo}' -> '{corrected}'")

def test_abbreviation_expansion():
    """Test abbreviation expansion"""
    print("\n📋 Testing Abbreviation Expansion:")
    print("=" * 35)
    
    text_processor = TextProcessor()
    
    test_abbreviations = [
        "st", "ave", "rd", "blvd", "dr", "ln", "ct", "pl",
        "gas", "atm", "gym", "park", "library", "school"
    ]
    
    for abbrev in test_abbreviations:
        expanded = text_processor._expand_abbreviations_with_fuzzywuzzy(abbrev)
        print(f"'{abbrev}' -> '{expanded}'")

def test_complex_queries():
    """Test complex queries with multiple typos"""
    print("\n🎯 Testing Complex Queries:")
    print("=" * 30)
    
    text_processor = TextProcessor()
    
    complex_queries = [
        "cofee shop neer me",
        "resturant adn bar neer downtown", 
        "gim wth pool neer my house",
        "piza delivery to my home",
        "gas station on main st"
    ]
    
    for query in complex_queries:
        print(f"\nOriginal: '{query}'")
        processed = text_processor.process_query(query, enable_fuzzy_search=True)
        print(f"Processed: '{processed}'")
        
        suggestions = text_processor.get_fuzzy_suggestions(query)
        if suggestions['metadata']['fuzzy_search_available'] and suggestions['corrections']:
            print(f"Corrections: {suggestions['corrections'][:3]}")

if __name__ == "__main__":
    print("🚀 Starting Fuzzy Search Tests with fuzzywuzzy")
    print("=" * 60)
    
    # Test typo correction
    test_typo_correction()
    
    # Test abbreviation expansion  
    test_abbreviation_expansion()
    
    # Test complex queries
    test_complex_queries()
    
    # Test full fuzzy search functionality
    test_fuzzy_search()
    
    print("\n🎉 All tests completed!") 