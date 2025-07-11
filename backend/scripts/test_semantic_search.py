#!/usr/bin/env python3
"""
Test script for semantic search functionality
Tests various natural language queries to verify search performance
"""

import sys
import os
import json
import time
from typing import Dict, Any

# Add the parent directory (backend) to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests

# Configuration
API_BASE_URL = "http://localhost:8000/api"
TEST_LOCATION = [35.7796, -79.4194]  # Chatham County, NC

# Test queries for semantic search
TEST_QUERIES = [
    # Basic business type searches
    "bakeries near me",
    "coffee shops",
    "libraries",
    "restaurants",
    "grocery stores",
    "pharmacies",
    "hardware stores",
    "gas stations",
    "banks",
    "post offices",
    
    # Natural language variations
    "where can I get coffee",
    "I need a library",
    "find me a bakery",
    "restaurants nearby",
    "grocery store close to me",
    "pharmacy near me",
    "hardware store",
    "gas station",
    "bank location",
    "post office",
    
    # Descriptive searches
    "fresh baked bread",
    "artisan coffee",
    "public library",
    "local restaurant",
    "fresh produce",
    "prescription drugs",
    "tools and supplies",
    "fuel station",
    "banking services",
    "mail services",
    
    # Category-based searches
    "food places",
    "shopping",
    "services",
    "outdoor activities",
    "parks",
    "hiking trails",
    "events",
    "entertainment",
    
    # Complex queries
    "coffee and pastries",
    "library with computers",
    "family restaurant",
    "organic grocery",
    "24 hour pharmacy",
    "hardware and tools",
    "gas and convenience",
    "community bank",
    "postal services",
    "local businesses"
]

def test_search_query(query: str, expected_types: list = None) -> Dict[str, Any]:
    """
    Test a single search query
    
    Args:
        query: The search query to test
        expected_types: List of expected business types in results
        
    Returns:
        Dictionary with test results
    """
    print(f"\n🔍 Testing query: '{query}'")
    
    search_request = {
        "query": query,
        "user_location": TEST_LOCATION,
        "radius_km": 50,
        "limit": 20
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{API_BASE_URL}/search", json=search_request)
        search_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ Search successful ({search_time:.2f}s)")
            print(f"   Results: {data.get('total_results', 0)}")
            print(f"   Search time: {data.get('search_time_ms', 0)}ms")
            
            # Show query interpretation if available
            if 'query_interpretation' in data:
                interpretation = data['query_interpretation']
                if 'intent' in interpretation:
                    intent = interpretation['intent']
                    print(f"   Detected intent: {intent.get('intent', 'Unknown')} (confidence: {intent.get('confidence', 0):.1%})")
            
            # Show top 3 results
            results = data.get('results', [])
            if results:
                print("   Top results:")
                for i, result in enumerate(results[:3], 1):
                    poi_type = result.get('poi_type', 'Unknown')
                    name = result.get('name', 'Unknown')
                    relevance = result.get('relevance_score', 0)
                    distance = result.get('distance_km', 0)
                    categories = [cat.get('name', '') for cat in result.get('categories', [])]
                    
                    print(f"     {i}. {name} ({poi_type})")
                    print(f"        Relevance: {relevance:.1%}, Distance: {distance:.1f}km")
                    print(f"        Categories: {', '.join(categories[:3])}")
            
            # Check if expected types are found
            if expected_types:
                found_types = [result.get('poi_type', '').lower() for result in results]
                matches = [t for t in expected_types if any(t in ft for ft in found_types)]
                if matches:
                    print(f"   ✅ Found expected types: {', '.join(matches)}")
                else:
                    print(f"   ⚠️  Expected types not found: {expected_types}")
            
            return {
                "success": True,
                "query": query,
                "results_count": data.get('total_results', 0),
                "search_time_ms": data.get('search_time_ms', 0),
                "api_time": search_time * 1000
            }
        else:
            print(f"❌ Search failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return {
                "success": False,
                "query": query,
                "error": f"HTTP {response.status_code}: {response.text}"
            }
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return {
            "success": False,
            "query": query,
            "error": str(e)
        }

def run_comprehensive_test():
    """Run comprehensive semantic search tests"""
    print("🚀 Starting comprehensive semantic search testing...")
    print(f"📍 Test location: {TEST_LOCATION}")
    print(f"🌐 API base URL: {API_BASE_URL}")
    
    # Test results summary
    test_results = []
    successful_tests = 0
    total_tests = len(TEST_QUERIES)
    
    # Define expected types for specific queries
    expected_types_map = {
        "bakeries near me": ["business"],
        "coffee shops": ["business"],
        "libraries": ["business"],
        "restaurants": ["business"],
        "grocery stores": ["business"],
        "pharmacies": ["business"],
        "hardware stores": ["business"],
        "gas stations": ["business"],
        "banks": ["business"],
        "post offices": ["business"],
        "parks": ["park"],
        "hiking trails": ["trail"],
        "events": ["event"]
    }
    
    for query in TEST_QUERIES:
        expected_types = expected_types_map.get(query, None)
        result = test_search_query(query, expected_types)
        test_results.append(result)
        
        if result["success"]:
            successful_tests += 1
        
        # Small delay between requests
        time.sleep(0.5)
    
    # Print summary
    print(f"\n📊 Test Summary:")
    print(f"   Total tests: {total_tests}")
    print(f"   Successful: {successful_tests}")
    print(f"   Failed: {total_tests - successful_tests}")
    print(f"   Success rate: {successful_tests/total_tests:.1%}")
    
    # Performance summary
    successful_results = [r for r in test_results if r["success"]]
    if successful_results:
        avg_search_time = sum(r["search_time_ms"] for r in successful_results) / len(successful_results)
        avg_api_time = sum(r["api_time"] for r in successful_results) / len(successful_results)
        print(f"\n⚡ Performance Summary:")
        print(f"   Average search time: {avg_search_time:.1f}ms")
        print(f"   Average API response time: {avg_api_time:.1f}ms")
    
    # Show failed tests
    failed_tests = [r for r in test_results if not r["success"]]
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for result in failed_tests:
            print(f"   - '{result['query']}': {result['error']}")
    
    return test_results

def test_specific_queries():
    """Test specific queries with detailed analysis"""
    print("\n🎯 Testing specific semantic search scenarios...")
    
    specific_tests = [
        {
            "query": "bakeries near me",
            "description": "Basic bakery search",
            "expected_keywords": ["bakery", "bread", "pastry", "cake"]
        },
        {
            "query": "coffee shops",
            "description": "Coffee shop search",
            "expected_keywords": ["coffee", "cafe", "espresso", "brew"]
        },
        {
            "query": "libraries",
            "description": "Library search",
            "expected_keywords": ["library", "books", "study", "learning"]
        },
        {
            "query": "parks",
            "description": "Park search",
            "expected_keywords": ["park", "recreation", "outdoor", "green"]
        },
        {
            "query": "hiking trails",
            "description": "Trail search",
            "expected_keywords": ["trail", "hiking", "walking", "nature"]
        }
    ]
    
    for test in specific_tests:
        print(f"\n🔍 {test['description']}: '{test['query']}'")
        result = test_search_query(test['query'])
        
        if result["success"]:
            # Analyze results for expected keywords
            search_request = {
                "query": test['query'],
                "user_location": TEST_LOCATION,
                "radius_km": 50,
                "limit": 20
            }
            
            response = requests.post(f"{API_BASE_URL}/search", json=search_request)
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                # Check for expected keywords in descriptions
                found_keywords = []
                for result_item in results:
                    description = (result_item.get('description_short', '') + ' ' + 
                                 result_item.get('description_long', '')).lower()
                    name = result_item.get('name', '').lower()
                    
                    for keyword in test['expected_keywords']:
                        if keyword in description or keyword in name:
                            found_keywords.append(keyword)
                
                found_keywords = list(set(found_keywords))
                if found_keywords:
                    print(f"   ✅ Found relevant keywords: {', '.join(found_keywords)}")
                else:
                    print(f"   ⚠️  No expected keywords found in results")

if __name__ == "__main__":
    try:
        # Test if API is available
        print("🔌 Checking API availability...")
        response = requests.get(f"{API_BASE_URL}/search/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ API is available")
            print(f"   Total vectors: {stats.get('total_vectors', 0)}")
            print(f"   Collection: {stats.get('collection_name', 'Unknown')}")
        else:
            print(f"❌ API not available: {response.status_code}")
            sys.exit(1)
        
        # Run comprehensive tests
        run_comprehensive_test()
        
        # Run specific query analysis
        test_specific_queries()
        
        print(f"\n🎉 Semantic search testing completed!")
        print(f"💡 Try these queries in the frontend:")
        print(f"   - 'bakeries near me'")
        print(f"   - 'coffee shops'")
        print(f"   - 'libraries'")
        print(f"   - 'parks'")
        print(f"   - 'hiking trails'")
        
    except KeyboardInterrupt:
        print("\n⏹️  Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Testing failed: {e}")
        sys.exit(1) 