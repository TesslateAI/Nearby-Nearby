from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, Tuple
import logging
import time
from datetime import datetime

from .embedding_service import EmbeddingService
from .text_processor import TextProcessor
from .vector_db_manager import VectorDBManager
from .spatial_db_manager import SpatialDBManager

logger = logging.getLogger(__name__)

class LocationSearchService:
    """
    Main service for natural language location search
    Combines vector search with spatial filtering and hybrid scoring
    """
    
    def __init__(self, db: Session):
        """
        Initialize the search service
        
        Args:
            db: Database session
        """
        self.logger = logging.getLogger(__name__)
        self.db = db
        
        # Initialize component services
        self.embedding_service = EmbeddingService()
        self.text_processor = TextProcessor()
        self.vector_db = VectorDBManager()
        self.spatial_db = SpatialDBManager()
        
        self.logger.info("LocationSearchService initialized successfully")
    
    def search(self, query: str, user_location: List[float], radius_km: float = 50.0, 
               top_n: int = 20, category_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform natural language location search
        
        Args:
            query: User search query
            user_location: [latitude, longitude] of user
            radius_km: Search radius in kilometers
            top_n: Maximum number of results
            category_filter: Optional category filter
            
        Returns:
            Search results with metadata
        """
        start_time = time.time()
        
        try:
            self.logger.info(f"Starting search for query: '{query}' at location {user_location}")
            
            # Step 1: Process and enhance the query with fuzzy search
            processed_query = self.text_processor.process_query(query, enable_fuzzy_search=True)
            enhanced_query = self._enhance_query_for_search(query, processed_query)
            
            # Step 2: Generate query embedding
            query_embedding = self.embedding_service.generate_embedding(enhanced_query)
            
            # Step 3: Vector search for semantic similarity
            vector_results = self._perform_vector_search(
                query_embedding, 
                top_n * 3,  # Get more results for filtering
                category_filter
            )
            
            if not vector_results:
                return self._create_empty_response(query, processed_query, start_time)
            
            # Step 4: Extract POI IDs from vector results
            poi_ids = [result['id'] for result in vector_results]
            
            # Step 5: Spatial filtering using PostGIS
            user_lat, user_lon = user_location
            spatial_results = self.spatial_db.get_pois_within_radius(
                self.db, user_lat, user_lon, radius_km, poi_ids
            )
            
            if not spatial_results:
                return self._create_empty_response(query, processed_query, start_time)
            
            # Step 6: Combine and score results
            combined_results = self._combine_and_score_results(
                vector_results, spatial_results, query_embedding, user_location
            )
            
            # Step 7: Apply final filtering and limit
            final_results = self._apply_final_filters(combined_results, top_n, category_filter)
            
            # Step 8: Calculate search time
            search_time_ms = int((time.time() - start_time) * 1000)
            
            # Step 9: Create response
            response = {
                'results': final_results,
                'total_results': len(final_results),
                'search_time_ms': search_time_ms,
                'query_interpretation': {
                    'original_query': query,
                    'processed_query': processed_query,
                    'intent': self._interpret_query_intent(query),
                    'expanded_terms': self._expand_search_terms(query),
                    'error': None
                }
            }
            
            self.logger.info(f"Search completed in {search_time_ms}ms, found {len(final_results)} results")
            return response
            
        except Exception as e:
            self.logger.error(f"Error in search: {e}")
            return self._create_error_response(query, str(e), start_time)
    
    def _enhance_query_for_search(self, original_query: str, processed_query: str) -> str:
        """
        Enhance the processed query with additional context for better search results
        
        Args:
            original_query: Original user query
            processed_query: Already processed query
            
        Returns:
            Enhanced query string
        """
        enhanced_terms = [processed_query]
        
        # Add original query terms if they're different
        if original_query.lower() != processed_query.lower():
            enhanced_terms.append(original_query)
        
        # Add common variations
        query_lower = original_query.lower()
        
        # Handle "near me" variations
        if 'near me' in query_lower:
            enhanced_terms.append(query_lower.replace('near me', 'nearby'))
            enhanced_terms.append(query_lower.replace('near me', 'local'))
        
        # Handle "close to" variations
        if 'close to' in query_lower:
            enhanced_terms.append(query_lower.replace('close to', 'near'))
            enhanced_terms.append(query_lower.replace('close to', 'around'))
        
        # Handle food-related queries
        food_mappings = {
            'coffee': ['cafe', 'espresso', 'coffee shop'],
            'restaurant': ['dining', 'food', 'eatery'],
            'pizza': ['pizza place', 'pizzeria'],
            'burger': ['burger joint', 'fast food'],
            'sushi': ['japanese', 'asian food'],
            'tacos': ['mexican', 'taco place']
        }
        
        for term, variations in food_mappings.items():
            if term in query_lower:
                enhanced_terms.extend(variations)
        
        # Handle activity-related queries
        activity_mappings = {
            'park': ['recreation', 'outdoor', 'green space'],
            'trail': ['hiking', 'walking path', 'outdoor'],
            'gym': ['fitness', 'workout', 'exercise'],
            'museum': ['art', 'culture', 'exhibit'],
            'library': ['books', 'reading', 'study']
        }
        
        for term, variations in activity_mappings.items():
            if term in query_lower:
                enhanced_terms.extend(variations)
        
        # Combine all terms
        enhanced_query = ' '.join(enhanced_terms)
        
        # Clean up and return
        return self.text_processor._clean_text(enhanced_query)
    
    def preprocess_poi_for_vector_storage(self, poi_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pre-process POI data before storing in vector database
        This enhances the searchable text with additional context
        
        Args:
            poi_data: Raw POI data
            
        Returns:
            Enhanced POI data with improved searchable text
        """
        try:
            # Generate base searchable text
            base_text = self.text_processor.create_searchable_text(poi_data)
            
            # Extract key information for enhancement
            name = poi_data.get('name', '')
            poi_type = poi_data.get('poi_type', '')
            categories = poi_data.get('categories', [])
            
            # Create enhanced text components
            enhanced_components = [base_text]
            
            # Add type-specific enhancements
            if poi_type == 'BUSINESS':
                enhanced_components.append(f"business establishment {name}")
                if poi_data.get('business', {}).get('price_range'):
                    enhanced_components.append(f"price range {poi_data['business']['price_range']}")
            
            elif poi_type == 'PARK':
                enhanced_components.append(f"public park {name}")
                enhanced_components.append("outdoor recreation green space")
                if poi_data.get('park', {}).get('drone_usage_policy'):
                    enhanced_components.append(f"drone policy {poi_data['park']['drone_usage_policy']}")
            
            elif poi_type == 'TRAIL':
                enhanced_components.append(f"hiking trail {name}")
                enhanced_components.append("outdoor recreation walking path")
                trail_data = poi_data.get('trail', {})
                if trail_data.get('length_text'):
                    enhanced_components.append(f"trail length {trail_data['length_text']}")
                if trail_data.get('difficulty'):
                    enhanced_components.append(f"difficulty {trail_data['difficulty']}")
            
            elif poi_type == 'EVENT':
                enhanced_components.append(f"event {name}")
                enhanced_components.append("temporary activity happening")
                event_data = poi_data.get('event', {})
                if event_data.get('cost_text'):
                    enhanced_components.append(f"cost {event_data['cost_text']}")
            
            # Add category-based enhancements
            category_names = []
            if isinstance(categories, list):
                category_names = [cat.get('name', '') if isinstance(cat, dict) else str(cat) 
                                for cat in categories]
            
            for category in category_names:
                if category.lower() in ['restaurant', 'cafe', 'food']:
                    enhanced_components.extend(['dining', 'food service', 'eatery'])
                elif category.lower() in ['park', 'recreation']:
                    enhanced_components.extend(['outdoor', 'recreation', 'leisure'])
                elif category.lower() in ['shopping', 'retail']:
                    enhanced_components.extend(['retail', 'commerce', 'shopping'])
                elif category.lower() in ['fitness', 'gym']:
                    enhanced_components.extend(['fitness', 'exercise', 'workout'])
                elif category.lower() in ['entertainment', 'nightlife']:
                    enhanced_components.extend(['entertainment', 'nightlife', 'social'])
            
            # Add address context
            address_parts = []
            if poi_data.get('address_city'):
                address_parts.append(poi_data['address_city'])
            if poi_data.get('address_state'):
                address_parts.append(poi_data['address_state'])
            
            if address_parts:
                enhanced_components.append(f"located in {' '.join(address_parts)}")
            
            # Combine all components
            enhanced_text = ' '.join(enhanced_components)
            
            # Clean the enhanced text
            enhanced_text = self.text_processor._clean_text(enhanced_text)
            
            # Create enhanced POI data
            enhanced_poi_data = poi_data.copy()
            enhanced_poi_data['searchable_text'] = enhanced_text
            enhanced_poi_data['original_searchable_text'] = base_text
            
            return enhanced_poi_data
            
        except Exception as e:
            self.logger.error(f"Error preprocessing POI for vector storage: {e}")
            # Fallback to original data
            return poi_data
    
    def _perform_vector_search(self, query_embedding: List[float], n_results: int, 
                              category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Perform vector search using ChromaDB"""
        try:
            # Build metadata filter if category is specified
            where_filter = None
            if category_filter:
                where_filter = {"category": {"$contains": category_filter}}
            
            # Search vectors
            vector_results = self.vector_db.search_vectors(
                query_embedding, n_results, where_filter
            )
            
            return vector_results
            
        except Exception as e:
            self.logger.error(f"Error in vector search: {e}")
            return []
    
    def _combine_and_score_results(self, vector_results: List[Dict], spatial_results: List[Dict],
                                  query_embedding: List[float], user_location: List[float]) -> List[Dict]:
        """Combine vector and spatial results with hybrid scoring"""
        try:
            # Create lookup for vector results
            vector_lookup = {result['id']: result for result in vector_results}
            
            # Create lookup for spatial results
            spatial_lookup = {result['id']: result for result in spatial_results}
            
            # Combine results
            combined_results = []
            
            for poi_id in vector_lookup.keys():
                if poi_id in spatial_lookup:
                    vector_result = vector_lookup[poi_id]
                    spatial_result = spatial_lookup[poi_id]
                    
                    # Calculate hybrid score
                    semantic_score = vector_result.get('similarity_score', 0.0)
                    proximity_score = self.spatial_db.calculate_proximity_score(
                        spatial_result.get('distance_km', float('inf'))
                    )
                    
                    # Hybrid scoring: 70% semantic + 30% proximity
                    hybrid_score = (semantic_score * 0.7) + (proximity_score * 0.3)
                    
                    # Combine data
                    combined_result = {
                        **spatial_result,  # Use spatial data as base (includes distance)
                        'semantic_score': round(semantic_score, 3),
                        'proximity_score': round(proximity_score, 3),
                        'relevance_score': round(hybrid_score, 3),
                        'searchable_text': vector_result.get('document', '')
                    }
                    
                    combined_results.append(combined_result)
            
            # Sort by hybrid score
            combined_results.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            return combined_results
            
        except Exception as e:
            self.logger.error(f"Error combining results: {e}")
            return []
    
    def _apply_final_filters(self, results: List[Dict], top_n: int, 
                            category_filter: Optional[str] = None) -> List[Dict]:
        """Apply final filters and limit results"""
        try:
            # Apply category filter if specified
            if category_filter:
                filtered_results = []
                for result in results:
                    categories = result.get('categories', [])
                    category_names = [cat.get('name', '').lower() for cat in categories]
                    
                    if category_filter.lower() in category_names:
                        filtered_results.append(result)
                
                results = filtered_results
            
            # Limit results
            return results[:top_n]
            
        except Exception as e:
            self.logger.error(f"Error applying final filters: {e}")
            return results[:top_n]
    
    def _interpret_query_intent(self, query: str) -> Dict[str, Any]:
        """Interpret the intent of the search query"""
        try:
            query_lower = query.lower()
            
            # Detect intent patterns
            intent = {
                'intent': 'general_search',
                'confidence': 0.5,
                'detected_terms': []
            }
            
            # Food-related terms
            food_terms = ['food', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'dinner', 'lunch', 'breakfast']
            if any(term in query_lower for term in food_terms):
                intent['intent'] = 'food_search'
                intent['confidence'] = 0.8
                intent['detected_terms'] = [term for term in food_terms if term in query_lower]
            
            # Activity-related terms
            activity_terms = ['park', 'trail', 'hiking', 'walking', 'outdoor', 'recreation']
            if any(term in query_lower for term in activity_terms):
                intent['intent'] = 'activity_search'
                intent['confidence'] = 0.8
                intent['detected_terms'] = [term for term in activity_terms if term in query_lower]
            
            # Event-related terms
            event_terms = ['event', 'festival', 'concert', 'show', 'meeting']
            if any(term in query_lower for term in event_terms):
                intent['intent'] = 'event_search'
                intent['confidence'] = 0.8
                intent['detected_terms'] = [term for term in event_terms if term in query_lower]
            
            # Location-related terms
            location_terms = ['near', 'nearby', 'close', 'around', 'local']
            if any(term in query_lower for term in location_terms):
                intent['intent'] = 'proximity_search'
                intent['confidence'] = 0.7
                intent['detected_terms'] = [term for term in location_terms if term in query_lower]
            
            return intent
            
        except Exception as e:
            self.logger.error(f"Error interpreting query intent: {e}")
            return {
                'intent': 'general_search',
                'confidence': 0.5,
                'detected_terms': []
            }
    
    def _expand_search_terms(self, query: str) -> List[str]:
        """Expand search terms for better matching"""
        try:
            expanded_terms = [query]
            
            # Add common variations
            query_lower = query.lower()
            
            # Food variations
            if 'coffee' in query_lower:
                expanded_terms.extend(['cafe', 'coffee shop', 'espresso'])
            elif 'pizza' in query_lower:
                expanded_terms.extend(['pizza restaurant', 'pizzeria'])
            elif 'restaurant' in query_lower:
                expanded_terms.extend(['dining', 'food', 'eatery'])
            
            # Activity variations
            elif 'park' in query_lower:
                expanded_terms.extend(['recreation', 'outdoor', 'playground'])
            elif 'trail' in query_lower:
                expanded_terms.extend(['hiking', 'walking', 'outdoor'])
            
            return expanded_terms
            
        except Exception as e:
            self.logger.error(f"Error expanding search terms: {e}")
            return [query]
    
    def _create_empty_response(self, query: str, processed_query: str, start_time: float) -> Dict[str, Any]:
        """Create response for empty results"""
        search_time_ms = int((time.time() - start_time) * 1000)
        
        return {
            'results': [],
            'total_results': 0,
            'search_time_ms': search_time_ms,
            'query_interpretation': {
                'original_query': query,
                'processed_query': processed_query,
                'intent': self._interpret_query_intent(query),
                'expanded_terms': self._expand_search_terms(query),
                'error': None
            }
        }
    
    def _create_error_response(self, query: str, error: str, start_time: float) -> Dict[str, Any]:
        """Create response for error cases"""
        search_time_ms = int((time.time() - start_time) * 1000)
        
        return {
            'results': [],
            'total_results': 0,
            'search_time_ms': search_time_ms,
            'query_interpretation': {
                'original_query': query,
                'processed_query': query,
                'intent': {'intent': 'error', 'confidence': 0.0, 'detected_terms': []},
                'expanded_terms': [query],
                'error': error
            }
        }
    
    def get_search_stats(self) -> Dict[str, Any]:
        """Get search system statistics"""
        try:
            vector_stats = self.vector_db.get_collection_stats()
            
            return {
                'vector_database': vector_stats,
                'embedding_model': self.embedding_service.get_model_info(),
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting search stats: {e}")
            return {
                'error': str(e),
                'last_updated': datetime.now().isoformat()
            } 