from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=200, description="Search query")
    user_location: Tuple[float, float] = Field(..., description="User location as [latitude, longitude]")
    radius_km: Optional[float] = Field(50.0, ge=1.0, le=200.0, description="Search radius in kilometers")
    limit: Optional[int] = Field(10, ge=1, le=50, description="Maximum number of results")
    category_filter: Optional[str] = Field(None, description="Filter by POI category")
    sort_by: Optional[str] = Field("relevance", description="Sort by: relevance, distance, rating")
    
    @validator('user_location')
    def validate_location(cls, v):
        if len(v) != 2:
            raise ValueError('Location must be a tuple of 2 coordinates')
        lat, lng = v
        if not (-90 <= lat <= 90):
            raise ValueError('Latitude must be between -90 and 90')
        if not (-180 <= lng <= 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v
    
    @validator('sort_by')
    def validate_sort_by(cls, v):
        allowed_values = ['relevance', 'distance', 'rating']
        if v not in allowed_values:
            raise ValueError(f'Sort by must be one of: {allowed_values}')
        return v

class LocationResult(BaseModel):
    id: str
    name: str
    poi_type: str
    description_long: Optional[str] = None
    description_short: Optional[str] = None
    address_full: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    coordinates: Optional[List[float]] = None  # [longitude, latitude]
    distance_km: Optional[float] = None
    relevance_score: Optional[float] = None
    semantic_score: Optional[float] = None
    proximity_score: Optional[float] = None
    status: Optional[str] = None
    is_verified: Optional[bool] = None
    website_url: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    photos: Optional[Dict] = None
    hours: Optional[Dict] = None
    amenities: Optional[Dict] = None
    contact_info: Optional[Dict] = None
    compliance: Optional[Dict] = None
    custom_fields: Optional[Dict] = None
    created_at: Optional[str] = None
    last_updated: Optional[str] = None

class QueryInterpretation(BaseModel):
    original_query: str
    processed_query: str
    intent: Dict[str, Any]
    expanded_terms: List[str]
    error: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[LocationResult]
    total_results: int
    search_time_ms: int
    query_interpretation: QueryInterpretation

class BulkIngestRequest(BaseModel):
    locations: List[Dict] = Field(..., description="List of location data to ingest")

class BulkIngestResponse(BaseModel):
    success_count: int
    error_count: int
    errors: List[str] = []
    processing_time_ms: int

class SearchStats(BaseModel):
    total_vectors: int
    collection_name: str
    last_updated: Optional[datetime] = None 