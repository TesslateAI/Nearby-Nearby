from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Dict, Any, Tuple, Optional
import logging
from geoalchemy2.elements import WKBElement
from geoalchemy2.shape import to_shape
import math

logger = logging.getLogger(__name__)

class SpatialDBManager:
    """
    Manages spatial database operations using PostGIS
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        
        Args:
            lat1, lon1: Coordinates of first point
            lat2, lon2: Coordinates of second point
            
        Returns:
            Distance in kilometers
        """
        try:
            # Convert to radians
            lat1_rad = math.radians(lat1)
            lon1_rad = math.radians(lon1)
            lat2_rad = math.radians(lat2)
            lon2_rad = math.radians(lon2)
            
            # Haversine formula
            dlat = lat2_rad - lat1_rad
            dlon = lon2_rad - lon1_rad
            
            a = (math.sin(dlat / 2) ** 2 + 
                 math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2)
            c = 2 * math.asin(math.sqrt(a))
            
            # Earth's radius in kilometers
            radius = 6371
            
            distance = radius * c
            return distance
            
        except Exception as e:
            self.logger.error(f"Error calculating distance: {e}")
            return float('inf')
    
    def get_pois_within_radius(self, db: Session, center_lat: float, center_lon: float, 
                              radius_km: float, poi_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Get POIs within a specified radius using PostGIS
        
        Args:
            db: Database session
            center_lat, center_lon: Center point coordinates
            radius_km: Search radius in kilometers
            poi_ids: Optional list of POI IDs to filter by
            
        Returns:
            List of POIs with distance information
        """
        try:
            from app.models.poi import PointOfInterest
            
            # Create center point geometry
            center_point = f'POINT({center_lon} {center_lat})'
            
            # Build query
            query = db.query(
                PointOfInterest,
                func.ST_Distance(
                    PointOfInterest.location,
                    func.ST_GeomFromText(center_point, 4326),
                    use_spheroid=True
                ).label('distance_meters')
            ).filter(
                func.ST_DWithin(
                    PointOfInterest.location,
                    func.ST_GeomFromText(center_point, 4326),
                    radius_km * 1000,  # Convert km to meters
                    use_spheroid=True
                )
            )
            
            # Filter by POI IDs if provided
            if poi_ids:
                query = query.filter(PointOfInterest.id.in_(poi_ids))
            
            # Execute query
            results = query.all()
            
            # Format results
            pois_with_distance = []
            for poi, distance_meters in results:
                distance_km = distance_meters / 1000.0
                
                poi_dict = {
                    'id': str(poi.id),
                    'name': poi.name,
                    'poi_type': poi.poi_type,
                    'description_long': poi.description_long,
                    'description_short': poi.description_short,
                    'address_full': poi.address_full,
                    'address_street': poi.address_street,
                    'address_city': poi.address_city,
                    'address_state': poi.address_state,
                    'address_zip': poi.address_zip,
                    'status': poi.status,
                    'is_verified': poi.is_verified,
                    'website_url': poi.website_url,
                    'phone_number': poi.phone_number,
                    'email': poi.email,
                    'photos': poi.photos,
                    'hours': poi.hours,
                    'amenities': poi.amenities,
                    'contact_info': poi.contact_info,
                    'compliance': poi.compliance,
                    'custom_fields': poi.custom_fields,
                    'created_at': poi.created_at.isoformat() if poi.created_at else None,
                    'last_updated': poi.last_updated.isoformat() if poi.last_updated else None,
                    'distance_km': round(distance_km, 2),
                    'coordinates': self._extract_coordinates(poi.location)
                }
                
                # Add categories
                if poi.categories:
                    poi_dict['categories'] = [
                        {'id': str(cat.id), 'name': cat.name} 
                        for cat in poi.categories
                    ]
                else:
                    poi_dict['categories'] = []
                
                pois_with_distance.append(poi_dict)
            
            # Sort by distance
            pois_with_distance.sort(key=lambda x: x['distance_km'])
            
            self.logger.debug(f"Found {len(pois_with_distance)} POIs within {radius_km}km")
            return pois_with_distance
            
        except Exception as e:
            self.logger.error(f"Error getting POIs within radius: {e}")
            return []
    
    def get_poi_by_id(self, db: Session, poi_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single POI by ID with location information
        
        Args:
            db: Database session
            poi_id: POI ID
            
        Returns:
            POI data or None if not found
        """
        try:
            from app.models.poi import PointOfInterest
            
            poi = db.query(PointOfInterest).filter(PointOfInterest.id == poi_id).first()
            
            if not poi:
                return None
            
            poi_dict = {
                'id': str(poi.id),
                'name': poi.name,
                'poi_type': poi.poi_type,
                'description_long': poi.description_long,
                'description_short': poi.description_short,
                'address_full': poi.address_full,
                'address_street': poi.address_street,
                'address_city': poi.address_city,
                'address_state': poi.address_state,
                'address_zip': poi.address_zip,
                'status': poi.status,
                'is_verified': poi.is_verified,
                'website_url': poi.website_url,
                'phone_number': poi.phone_number,
                'email': poi.email,
                'photos': poi.photos,
                'hours': poi.hours,
                'amenities': poi.amenities,
                'contact_info': poi.contact_info,
                'compliance': poi.compliance,
                'custom_fields': poi.custom_fields,
                'created_at': poi.created_at.isoformat() if poi.created_at else None,
                'last_updated': poi.last_updated.isoformat() if poi.last_updated else None,
                'coordinates': self._extract_coordinates(poi.location)
            }
            
            # Add categories
            if poi.categories:
                poi_dict['categories'] = [
                    {'id': str(cat.id), 'name': cat.name} 
                    for cat in poi.categories
                ]
            else:
                poi_dict['categories'] = []
            
            return poi_dict
            
        except Exception as e:
            self.logger.error(f"Error getting POI by ID: {e}")
            return None
    
    def _extract_coordinates(self, location: WKBElement) -> Optional[List[float]]:
        """
        Extract coordinates from PostGIS geometry
        
        Args:
            location: PostGIS geometry element
            
        Returns:
            List of [longitude, latitude] or None
        """
        try:
            if location:
                point = to_shape(location)
                return [point.x, point.y]  # [longitude, latitude]
            return None
        except Exception as e:
            self.logger.error(f"Error extracting coordinates: {e}")
            return None
    
    def calculate_proximity_score(self, distance_km: float, max_distance_km: float = 50.0) -> float:
        """
        Calculate proximity score based on distance
        
        Args:
            distance_km: Distance in kilometers
            max_distance_km: Maximum distance for scoring
            
        Returns:
            Proximity score between 0 and 1
        """
        if distance_km <= 0:
            return 1.0
        
        if distance_km >= max_distance_km:
            return 0.0
        
        # Exponential decay function
        # Closer distances get higher scores
        score = math.exp(-distance_km / (max_distance_km / 3))
        return max(0.0, min(1.0, score))
    
    def get_bounding_box(self, center_lat: float, center_lon: float, radius_km: float) -> Tuple[float, float, float, float]:
        """
        Calculate bounding box for a given center point and radius
        
        Args:
            center_lat, center_lon: Center point coordinates
            radius_km: Radius in kilometers
            
        Returns:
            Tuple of (min_lat, max_lat, min_lon, max_lon)
        """
        try:
            # Approximate degrees per kilometer (varies by latitude)
            lat_degrees_per_km = 1.0 / 111.0
            lon_degrees_per_km = 1.0 / (111.0 * math.cos(math.radians(center_lat)))
            
            lat_delta = radius_km * lat_degrees_per_km
            lon_delta = radius_km * lon_degrees_per_km
            
            min_lat = center_lat - lat_delta
            max_lat = center_lat + lat_delta
            min_lon = center_lon - lon_delta
            max_lon = center_lon + lon_delta
            
            return (min_lat, max_lat, min_lon, max_lon)
            
        except Exception as e:
            self.logger.error(f"Error calculating bounding box: {e}")
            # Return a default bounding box
            return (center_lat - 0.5, center_lat + 0.5, center_lon - 0.5, center_lon + 0.5) 