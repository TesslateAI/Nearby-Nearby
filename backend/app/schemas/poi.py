import uuid
import re
from datetime import datetime
from typing import Optional, List, Any, Literal, Dict

from pydantic import BaseModel, field_validator, model_validator, field_serializer, Field, ConfigDict
from geoalchemy2.elements import WKBElement
from geoalchemy2.shape import to_shape

from .category import Category

# Helper for slug generation
def generate_slug(value: str) -> str:
    s = value.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    s = re.sub(r'^-+|-+$', '', s)
    return s

# GeoJSON-like structure for coordinates
class PointGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float]

    @field_validator('coordinates')
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError('Coordinates must be a list of two floats [longitude, latitude]')
        return v

    @model_validator(mode='before')
    @classmethod
    def parse_wkb(cls, v):
        if isinstance(v, WKBElement):
            point = to_shape(v)
            return {"type": "Point", "coordinates": list(point.coords)[0]}
        return v

# Business Schemas
LISTING_TIERS = Literal['free', 'paid', 'paid_founding', 'sponsor']
PRICE_RANGES = Literal['$', '$$', '$$$', '$$$$']

class BusinessBase(BaseModel):
    listing_tier: LISTING_TIERS = 'free'
    price_range: Optional[PRICE_RANGES] = None

class BusinessCreate(BusinessBase): pass
class Business(BusinessBase):
    poi_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# Park Schemas
class ParkBase(BaseModel):
    drone_usage_policy: Optional[str] = None

class ParkCreate(ParkBase): pass
class Park(ParkBase):
    poi_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# Trail Schemas
TRAIL_DIFFICULTY = Literal['easy', 'moderate', 'difficult', 'expert']
ROUTE_TYPES = Literal['loop', 'out_and_back', 'point_to_point']

class TrailBase(BaseModel):
    length_text: Optional[str] = None
    difficulty: Optional[TRAIL_DIFFICULTY] = None
    route_type: Optional[ROUTE_TYPES] = None

class TrailCreate(TrailBase): pass
class Trail(TrailBase):
    poi_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# Event Schemas
class EventBase(BaseModel):
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    cost_text: Optional[str] = None

class EventCreate(EventBase): pass
class Event(EventBase):
    poi_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# Point of Interest Schemas
POI_TYPES = Literal['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
STATUS_TYPES = Literal[
    'Fully Open', 'Partly Open', 'Temporary Hour Changes', 'Temporarily Closed',
    'Call Ahead', 'Permanently Closed', 'Warning', 'Limited Capacity',
    'Coming Soon', 'Under Development', 'Alert'
]

class PointOfInterestBase(BaseModel):
    poi_type: POI_TYPES
    name: str
    description_long: Optional[str] = None
    description_short: Optional[str] = None
    
    # Address fields
    address_full: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    
    # Status and verification
    status: STATUS_TYPES = 'Fully Open'
    status_message: Optional[str] = None
    is_verified: bool = False
    is_disaster_hub: bool = False
    
    # Contact info
    website_url: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    
    # JSONB fields
    photos: Optional[Dict[str, Any]] = None
    hours: Optional[Dict[str, Any]] = None
    amenities: Optional[Dict[str, Any]] = None
    contact_info: Optional[Dict[str, Any]] = None
    compliance: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class PointOfInterestCreate(PointOfInterestBase):
    location: PointGeometry
    business: Optional[BusinessCreate] = None
    park: Optional[ParkCreate] = None
    trail: Optional[TrailCreate] = None
    event: Optional[EventCreate] = None
    category_ids: Optional[List[uuid.UUID]] = []

    @model_validator(mode='before')
    @classmethod
    def validate_poi_type_and_subtype(cls, values):
        if isinstance(values, dict):
            poi_type = values.get('poi_type')
            if poi_type == 'BUSINESS' and not values.get('business'):
                raise ValueError("Business data required for poi_type 'BUSINESS'")
            elif poi_type == 'PARK' and not values.get('park'):
                raise ValueError("Park data required for poi_type 'PARK'")
            elif poi_type == 'TRAIL' and not values.get('trail'):
                raise ValueError("Trail data required for poi_type 'TRAIL'")
            elif poi_type == 'EVENT' and not values.get('event'):
                raise ValueError("Event data required for poi_type 'EVENT'")
        return values

class PointOfInterestUpdate(BaseModel):
    poi_type: Optional[POI_TYPES] = None
    name: Optional[str] = None
    description_long: Optional[str] = None
    description_short: Optional[str] = None
    address_full: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    status: Optional[STATUS_TYPES] = None
    status_message: Optional[str] = None
    is_verified: Optional[bool] = None
    is_disaster_hub: Optional[bool] = None
    website_url: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    photos: Optional[Dict[str, Any]] = None
    hours: Optional[Dict[str, Any]] = None
    amenities: Optional[Dict[str, Any]] = None
    contact_info: Optional[Dict[str, Any]] = None
    compliance: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    
    location: Optional[PointGeometry] = None
    business: Optional[BusinessCreate] = None
    park: Optional[ParkCreate] = None
    trail: Optional[TrailCreate] = None
    event: Optional[EventCreate] = None
    category_ids: Optional[List[uuid.UUID]] = None

    model_config = ConfigDict(from_attributes=True)

class PointOfInterest(PointOfInterestBase):
    poi_type: str = Field(..., alias='poi_type')
    id: uuid.UUID
    location: PointGeometry
    business: Optional[Business] = None
    park: Optional[Park] = None
    trail: Optional[Trail] = None
    event: Optional[Event] = None
    categories: List[Category] = []
    created_at: datetime
    last_updated: datetime
    
    model_config = {'from_attributes': True, 'populate_by_name': True}

# POI Relationship Schema
class POIRelationshipBase(BaseModel):
    source_poi_id: uuid.UUID
    target_poi_id: uuid.UUID
    relationship_type: str

class POIRelationshipCreate(POIRelationshipBase):
    pass

class POIRelationship(POIRelationshipBase):
    model_config = ConfigDict(from_attributes=True)