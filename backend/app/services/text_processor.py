import re
import json
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

# Import fuzzywuzzy for fuzzy search capabilities
try:
    from fuzzywuzzy import fuzz, process
    FUZZY_SEARCH_AVAILABLE = True
except ImportError:
    FUZZY_SEARCH_AVAILABLE = False
    logger.warning("Fuzzy search not available. Install fuzzywuzzy for fuzzy search capabilities.")

class TextProcessor:
    """
    Processes POI data into searchable text for vector embeddings
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Common typos and misspellings mapping
        self.typo_mapping = {
            # Food-related typos
            'cofee': 'coffee',
            'resturant': 'restaurant',
            'resaurant': 'restaurant',
            'cafe': 'cafe',
            'pizza': 'pizza',
            'piza': 'pizza',
            'burger': 'burger',
            'burgur': 'burger',
            'sushi': 'sushi',
            'susi': 'sushi',
            
            # Location-related typos
            'nearby': 'nearby',
            'near by': 'nearby',
            'close to': 'nearby',
            'around': 'nearby',
            'near': 'nearby',
            
            # Common abbreviations
            'st': 'street',
            'ave': 'avenue',
            'rd': 'road',
            'blvd': 'boulevard',
            'dr': 'drive',
            'ln': 'lane',
            'ct': 'court',
            'pl': 'place',
            
            # Business types
            'gas': 'gas station',
            'gas station': 'gas station',
            'atm': 'atm',
            'bank': 'bank',
            'pharmacy': 'pharmacy',
            'drugstore': 'pharmacy',
            'hospital': 'hospital',
            'clinic': 'clinic',
            'gym': 'gym',
            'fitness': 'gym',
            'park': 'park',
            'library': 'library',
            'school': 'school',
            'university': 'university',
            'college': 'university',
            'hotel': 'hotel',
            'motel': 'hotel',
            'store': 'store',
            'shop': 'store',
            'market': 'store',
            'supermarket': 'grocery store',
            'grocery': 'grocery store',
        }
        
        if FUZZY_SEARCH_AVAILABLE:
            self.logger.info("Fuzzy search capabilities available")
        else:
            self.logger.warning("Fuzzy search capabilities not available")
    
    def create_searchable_text(self, poi_data: Dict[str, Any]) -> str:
        """
        Convert POI data into searchable text for embedding generation
        
        Args:
            poi_data: Dictionary containing POI information
            
        Returns:
            Formatted searchable text string
        """
        try:
            # Extract basic information
            name = poi_data.get('name', '')
            description_long = poi_data.get('description_long', '')
            description_short = poi_data.get('description_short', '')
            poi_type = poi_data.get('poi_type', '')
            
            # Extract address information
            address_parts = []
            if poi_data.get('address_street'):
                address_parts.append(poi_data['address_street'])
            if poi_data.get('address_city'):
                address_parts.append(poi_data['address_city'])
            if poi_data.get('address_state'):
                address_parts.append(poi_data['address_state'])
            if poi_data.get('address_zip'):
                address_parts.append(poi_data['address_zip'])
            
            address_text = ', '.join(address_parts) if address_parts else ''
            
            # Extract categories
            categories = []
            if poi_data.get('categories'):
                if isinstance(poi_data['categories'], list):
                    categories = [cat.get('name', '') if isinstance(cat, dict) else str(cat) 
                                for cat in poi_data['categories']]
                else:
                    categories = [str(poi_data['categories'])]
            
            # Extract amenities and custom fields
            amenities_text = self._extract_json_text(poi_data.get('amenities', {}))
            custom_fields_text = self._extract_json_text(poi_data.get('custom_fields', {}))
            
            # Extract subtype-specific information
            subtype_text = self._extract_subtype_text(poi_data)
            
            # Combine all text components
            text_components = []
            
            # Primary information
            if name:
                text_components.append(name)
            
            if description_short:
                text_components.append(description_short)
            
            if description_long:
                text_components.append(description_long)
            
            # Location information
            if address_text:
                text_components.append(f"Located in {address_text}")
            
            # Categories
            if categories:
                text_components.append(f"Categories: {', '.join(categories)}")
            
            # POI type
            if poi_type:
                text_components.append(f"Type: {poi_type}")
            
            # Subtype information
            if subtype_text:
                text_components.append(subtype_text)
            
            # Amenities
            if amenities_text:
                text_components.append(f"Amenities: {amenities_text}")
            
            # Custom fields
            if custom_fields_text:
                text_components.append(f"Features: {custom_fields_text}")
            
            # Join all components
            searchable_text = '. '.join(text_components)
            
            # Clean up the text
            searchable_text = self._clean_text(searchable_text)
            
            if not searchable_text.strip():
                self.logger.warning(f"Generated empty searchable text for POI: {name}")
                return f"{name} {poi_type}".strip()
            
            return searchable_text
            
        except Exception as e:
            self.logger.error(f"Error creating searchable text: {e}")
            # Fallback to basic text
            return f"{poi_data.get('name', 'Unknown')} {poi_data.get('poi_type', '')}".strip()
    
    def _extract_json_text(self, json_data: Any) -> str:
        """Extract text from JSON fields like amenities and custom_fields"""
        if not json_data:
            return ""
        
        if isinstance(json_data, str):
            return json_data
        
        if isinstance(json_data, dict):
            text_parts = []
            for key, value in json_data.items():
                if isinstance(value, list):
                    text_parts.append(f"{key}: {', '.join(map(str, value))}")
                elif isinstance(value, dict):
                    text_parts.append(f"{key}: {self._extract_json_text(value)}")
                else:
                    text_parts.append(f"{key}: {value}")
            return '; '.join(text_parts)
        
        return str(json_data)
    
    def _extract_subtype_text(self, poi_data: Dict[str, Any]) -> str:
        """Extract text from POI subtype data (business, park, trail, event)"""
        poi_type = poi_data.get('poi_type', '')
        
        if poi_type == 'BUSINESS' and poi_data.get('business'):
            business = poi_data['business']
            parts = []
            if business.get('listing_tier'):
                parts.append(f"Listing tier: {business['listing_tier']}")
            if business.get('price_range'):
                parts.append(f"Price range: {business['price_range']}")
            return '; '.join(parts)
        
        elif poi_type == 'PARK' and poi_data.get('park'):
            park = poi_data['park']
            parts = []
            if park.get('drone_usage_policy'):
                parts.append(f"Drone policy: {park['drone_usage_policy']}")
            return '; '.join(parts)
        
        elif poi_type == 'TRAIL' and poi_data.get('trail'):
            trail = poi_data['trail']
            parts = []
            if trail.get('length_text'):
                parts.append(f"Length: {trail['length_text']}")
            if trail.get('difficulty'):
                parts.append(f"Difficulty: {trail['difficulty']}")
            if trail.get('route_type'):
                parts.append(f"Route type: {trail['route_type']}")
            return '; '.join(parts)
        
        elif poi_type == 'EVENT' and poi_data.get('event'):
            event = poi_data['event']
            parts = []
            if event.get('start_datetime'):
                parts.append(f"Event starts: {event['start_datetime']}")
            if event.get('end_datetime'):
                parts.append(f"Event ends: {event['end_datetime']}")
            if event.get('cost_text'):
                parts.append(f"Cost: {event['cost_text']}")
            return '; '.join(parts)
        
        return ""
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might interfere with embeddings. Also remove punctuation.
        text = re.sub(r'[^\w\s]', '', text)
        
        
        return text.strip()
    
    def process_query(self, query: str, enable_fuzzy_search: bool = True) -> str:
        """
        Process user search query for better matching with optional fuzzy search
        
        Args:
            query: Raw user query
            enable_fuzzy_search: Whether to enable fuzzy search for typo correction
            
        Returns:
            Processed query string optimized for vector search
        """
        if not query or not query.strip():
            return ""
        
        # Step 1: Fuzzy search correction (if enabled and available)
        if enable_fuzzy_search and FUZZY_SEARCH_AVAILABLE:
            try:
                # Clean and correct typos using fuzzywuzzy
                cleaned_query = self._clean_query_text(query)
                corrected_query = self._correct_typos_with_fuzzywuzzy(cleaned_query)
                expanded_query = self._expand_abbreviations_with_fuzzywuzzy(corrected_query)
                
                # Log corrections if any were made
                if corrected_query != cleaned_query:
                    self.logger.info(f"Fuzzy search corrected query: '{query}' -> '{expanded_query}'")
                
                query = expanded_query
                
            except Exception as e:
                self.logger.warning(f"Fuzzy search failed, falling back to basic processing: {e}")
        
        # Step 2: Basic cleaning
        cleaned_query = self._clean_query_text(query)
        
        # Step 3: Extract and process location terms
        location_terms = self._extract_location_terms(cleaned_query)
        
        # Step 4: Handle proximity indicators
        proximity_terms = self._process_proximity_terms(cleaned_query)
        
        # Step 5: Expand abbreviations and common terms
        expanded_terms = self._expand_abbreviations(cleaned_query)
        
        # Step 6: Add semantic context
        contextual_terms = self._add_semantic_context(cleaned_query)
        
        # Step 7: Combine all processed terms
        all_terms = []
        all_terms.extend(location_terms)
        all_terms.extend(proximity_terms)
        all_terms.extend(expanded_terms)
        all_terms.extend(contextual_terms)
        
        # Step 8: Remove duplicates and join
        unique_terms = list(dict.fromkeys(all_terms))  # Preserve order
        processed_query = ' '.join(unique_terms)
        
        # Step 9: Final cleanup
        processed_query = self._clean_text(processed_query)
        
        return processed_query if processed_query else query
    
    def _correct_typos_with_fuzzywuzzy(self, query: str) -> str:
        """Correct typos in query using fuzzywuzzy"""
        if not FUZZY_SEARCH_AVAILABLE:
            return query
        
        words = query.split()
        corrected_words = []
        
        for word in words:
            # First check exact typo mapping
            if word in self.typo_mapping:
                corrected_words.append(self.typo_mapping[word])
                continue
            
            # Use fuzzywuzzy to find the best match from typo mapping
            best_match = process.extractOne(
                word, 
                self.typo_mapping.keys(), 
                scorer=fuzz.ratio,
                score_cutoff=80  # 80% similarity threshold
            )
            
            if best_match:
                corrected_word, score = best_match
                corrected_words.append(self.typo_mapping[corrected_word])
            else:
                corrected_words.append(word)
        
        return ' '.join(corrected_words)
    
    def _expand_abbreviations_with_fuzzywuzzy(self, query: str) -> str:
        """Expand abbreviations in query using fuzzywuzzy"""
        if not FUZZY_SEARCH_AVAILABLE:
            return query
        
        words = query.split()
        expanded_words = []
        
        for word in words:
            # Check if word is an abbreviation
            if word in self.typo_mapping:
                expanded_words.append(self.typo_mapping[word])
            else:
                expanded_words.append(word)
        
        return ' '.join(expanded_words)
    
    def _clean_query_text(self, query: str) -> str:
        """Clean and normalize query text"""
        # Convert to lowercase
        query = query.lower().strip()
        
        # Remove extra whitespace
        query = re.sub(r'\s+', ' ', query)
        
        # Remove special characters that might interfere with embeddings
        query = re.sub(r'[^\w\s.,!?-]', '', query)
        
        # Normalize spacing around punctuation
        query = re.sub(r'\s+([.,!?])', r'\1', query)
        
        return query
    
    def _extract_location_terms(self, query: str) -> List[str]:
        """Extract and enhance location-related terms"""
        location_terms = []
        
        # Common location indicators
        location_patterns = {
            r'\b(near|close to|around|in|at)\b': 'location',
            r'\b(street|avenue|road|drive|lane|boulevard|plaza|park)\b': 'street_type',
            r'\b(downtown|uptown|midtown|suburb|neighborhood|district|area)\b': 'area_type',
            r'\b(north|south|east|west|n|s|e|w)\b': 'direction',
            r'\b(center|central|midtown|downtown)\b': 'central_area'
        }
        
        for pattern, term_type in location_patterns.items():
            matches = re.findall(pattern, query, re.IGNORECASE)
            location_terms.extend(matches)
        
        # Add contextual location terms
        if any(word in query for word in ['coffee', 'cafe', 'restaurant', 'food']):
            location_terms.extend(['dining', 'food', 'restaurant'])
        
        if any(word in query for word in ['park', 'trail', 'hike', 'outdoor']):
            location_terms.extend(['outdoor', 'recreation', 'nature'])
        
        if any(word in query for word in ['shop', 'store', 'mall', 'retail']):
            location_terms.extend(['shopping', 'retail', 'commerce'])
        
        return location_terms
    
    def _process_proximity_terms(self, query: str) -> List[str]:
        """Process proximity and distance indicators"""
        proximity_terms = []
        
        # Proximity indicators
        proximity_patterns = {
            r'\b(near me|close by|nearby|local)\b': ['proximity', 'local'],
            r'\b(walking distance|walkable)\b': ['walking', 'pedestrian'],
            r'\b(driving distance|drive)\b': ['driving', 'accessible'],
            r'\b(within \d+ miles?|within \d+ km)\b': ['distance', 'radius']
        }
        
        for pattern, terms in proximity_patterns.items():
            if re.search(pattern, query, re.IGNORECASE):
                proximity_terms.extend(terms)
        
        return proximity_terms
    
    def _expand_abbreviations(self, query: str) -> List[str]:
        """Expand common abbreviations and terms"""
        expansions = {
            'cafe': ['coffee', 'cafe', 'espresso'],
            'restaurant': ['dining', 'food', 'restaurant', 'eatery'],
            'park': ['recreation', 'outdoor', 'park', 'green space'],
            'shop': ['store', 'retail', 'shopping'],
            'gym': ['fitness', 'workout', 'exercise'],
            'bar': ['pub', 'tavern', 'lounge', 'nightlife'],
            'museum': ['art', 'culture', 'exhibit', 'gallery'],
            'library': ['books', 'reading', 'study', 'quiet'],
            'hospital': ['medical', 'healthcare', 'emergency'],
            'school': ['education', 'learning', 'academic'],
            'bank': ['financial', 'money', 'atm'],
            'gas': ['fuel', 'gasoline', 'convenience'],
            'pharmacy': ['drugstore', 'medicine', 'health'],
            'post office': ['mail', 'postal', 'shipping'],
            'police': ['law enforcement', 'safety', 'emergency'],
            'fire': ['fire department', 'emergency', 'safety']
        }
        
        expanded_terms = []
        query_lower = query.lower()
        
        for abbreviation, full_terms in expansions.items():
            if abbreviation in query_lower:
                expanded_terms.extend(full_terms)
        
        return expanded_terms
    
    def _add_semantic_context(self, query: str) -> List[str]:
        """Add semantic context based on query content"""
        context_terms = []
        
        # Activity-based context
        if any(word in query for word in ['eat', 'food', 'dinner', 'lunch', 'breakfast']):
            context_terms.extend(['dining', 'restaurant', 'food service'])
        
        if any(word in query for word in ['drink', 'coffee', 'tea', 'beer', 'wine']):
            context_terms.extend(['beverage', 'drink', 'refreshment'])
        
        if any(word in query for word in ['shop', 'buy', 'purchase', 'retail']):
            context_terms.extend(['shopping', 'retail', 'commerce'])
        
        if any(word in query for word in ['exercise', 'workout', 'fitness', 'gym']):
            context_terms.extend(['fitness', 'health', 'exercise'])
        
        if any(word in query for word in ['park', 'play', 'recreation', 'outdoor']):
            context_terms.extend(['recreation', 'outdoor', 'leisure'])
        
        if any(word in query for word in ['work', 'office', 'business', 'meeting']):
            context_terms.extend(['business', 'work', 'professional'])
        
        if any(word in query for word in ['learn', 'study', 'education', 'school']):
            context_terms.extend(['education', 'learning', 'academic'])
        
        if any(word in query for word in ['health', 'medical', 'doctor', 'hospital']):
            context_terms.extend(['healthcare', 'medical', 'wellness'])
        
        # Time-based context
        if any(word in query for word in ['open', 'hours', 'today', 'now']):
            context_terms.extend(['operating hours', 'availability'])
        
        if any(word in query for word in ['late', 'night', 'evening', '24/7']):
            context_terms.extend(['late night', 'extended hours'])
        
        return context_terms
    
    def get_fuzzy_suggestions(self, query: str) -> Dict[str, Any]:
        """
        Get fuzzy search suggestions for a query using fuzzywuzzy
        
        Args:
            query: Query to get suggestions for
            
        Returns:
            Dictionary with suggestions and metadata
        """
        if not FUZZY_SEARCH_AVAILABLE:
            return {
                'suggestions': [],
                'corrections': [],
                'similar_queries': [],
                'metadata': {
                    'fuzzy_search_available': False,
                    'message': 'Fuzzy search not available. Install fuzzywuzzy.'
                }
            }
        
        try:
            # Get typo corrections
            corrections = []
            words = query.lower().split()
            for word in words:
                if word in self.typo_mapping:
                    corrections.append(self.typo_mapping[word])
                else:
                    # Use fuzzywuzzy to find similar words
                    best_match = process.extractOne(
                        word, 
                        self.typo_mapping.keys(), 
                        scorer=fuzz.ratio,
                        score_cutoff=70
                    )
                    if best_match:
                        corrected_word, score = best_match
                        corrections.append(self.typo_mapping[corrected_word])
            
            # Generate suggestions based on corrected query
            corrected_query = self._correct_typos_with_fuzzywuzzy(query)
            expanded_query = self._expand_abbreviations_with_fuzzywuzzy(corrected_query)
            
            # Create similar queries
            similar_queries = []
            if corrected_query != query:
                similar_queries.append(corrected_query)
            if expanded_query != corrected_query:
                similar_queries.append(expanded_query)
            
            # Add common variations
            if 'coffee' in query.lower() or 'cafe' in query.lower():
                similar_queries.extend(['coffee shop', 'cafe', 'espresso bar'])
            if 'restaurant' in query.lower():
                similar_queries.extend(['dining', 'food', 'eatery'])
            if 'gym' in query.lower():
                similar_queries.extend(['fitness center', 'workout', 'exercise'])
            
            return {
                'suggestions': corrections[:5],  # Top 5 corrections
                'corrections': corrections,
                'similar_queries': similar_queries[:5],  # Top 5 similar queries
                'metadata': {
                    'fuzzy_search_available': True,
                    'has_corrections': len(corrections) > 0,
                    'correction_count': len(corrections),
                    'variation_count': len(similar_queries),
                    'original_query': query,
                    'corrected_query': corrected_query,
                    'expanded_query': expanded_query
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error getting fuzzy suggestions: {e}")
            return {
                'suggestions': [],
                'corrections': [],
                'similar_queries': [],
                'metadata': {
                    'fuzzy_search_available': True,
                    'error': str(e)
                }
            }
    
    def find_similar_poi_names(self, query: str, poi_names: List[str], threshold: float = 0.7) -> List[Dict[str, Any]]:
        """
        Find POIs with similar names using fuzzywuzzy
        
        Args:
            query: Search query
            poi_names: List of POI names to search
            threshold: Similarity threshold (0-100)
            
        Returns:
            List of similar POIs with similarity scores
        """
        if not FUZZY_SEARCH_AVAILABLE:
            return []
        
        try:
            similar_pois = []
            query_lower = query.lower()
            
            for poi_name in poi_names:
                poi_lower = poi_name.lower()
                
                # Calculate multiple similarity scores using fuzzywuzzy
                ratio = fuzz.ratio(query_lower, poi_lower)
                partial_ratio = fuzz.partial_ratio(query_lower, poi_lower)
                token_sort_ratio = fuzz.token_sort_ratio(query_lower, poi_lower)
                
                # Use the highest score
                max_score = max(ratio, partial_ratio, token_sort_ratio)
                
                if max_score >= threshold:
                    similar_pois.append({
                        'name': poi_name,
                        'similarity_score': max_score / 100.0,  # Convert to 0-1 scale
                        'ratio': ratio,
                        'partial_ratio': partial_ratio,
                        'token_sort_ratio': token_sort_ratio
                    })
            
            # Sort by similarity score (descending)
            similar_pois.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            return similar_pois
            
        except Exception as e:
            self.logger.error(f"Error finding similar POI names: {e}")
            return []
    
    def get_fuzzy_search_stats(self) -> Dict[str, Any]:
        """
        Get statistics about fuzzy search capabilities
        
        Returns:
            Dictionary with fuzzy search statistics
        """
        if not FUZZY_SEARCH_AVAILABLE:
            return {
                'fuzzy_search_available': False,
                'message': 'Fuzzy search not available. Install fuzzywuzzy.'
            }
        
        try:
            return {
                'fuzzy_search_available': True,
                'typo_mapping_count': len(self.typo_mapping),
                'supported_algorithms': [
                    'fuzz.ratio',
                    'fuzz.partial_ratio', 
                    'fuzz.token_sort_ratio',
                    'fuzz.token_set_ratio'
                ],
                'similarity_threshold': 80,
                'library': 'fuzzywuzzy',
                'typo_categories': {
                    'food_related': len([k for k in self.typo_mapping.keys() if any(word in k for word in ['coffee', 'restaurant', 'pizza', 'cafe'])]),
                    'location_related': len([k for k in self.typo_mapping.keys() if any(word in k for word in ['near', 'close', 'around'])]),
                    'abbreviations': len([k for k in self.typo_mapping.keys() if len(k) <= 3]),
                    'business_types': len([k for k in self.typo_mapping.keys() if any(word in k for word in ['gas', 'atm', 'bank', 'pharmacy', 'gym'])]),
                }
            }
        except Exception as e:
            self.logger.error(f"Error getting fuzzy search stats: {e}")
            return {
                'fuzzy_search_available': True,
                'error': str(e)
            } 