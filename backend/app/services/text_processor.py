import re
import json
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class TextProcessor:
    """
    Processes POI data into searchable text for vector embeddings
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
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
        
        # Remove special characters that might interfere with embeddings
        text = re.sub(r'[^\w\s.,!?-]', '', text)
        
        # Normalize spacing around punctuation
        text = re.sub(r'\s+([.,!?])', r'\1', text)
        
        return text.strip()
    
    def process_query(self, query: str) -> str:
        """
        Process user search query for better matching
        
        Args:
            query: Raw user query
            
        Returns:
            Processed query string
        """
        # Remove common stop words that don't add semantic value
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        
        # Split query into words
        words = query.lower().split()
        
        # Remove stop words
        filtered_words = [word for word in words if word not in stop_words]
        
        # Rejoin words
        processed_query = ' '.join(filtered_words)
        
        return processed_query if processed_query else query 