import uuid
import re
from datetime import datetime
from typing import Optional, List, Any, Literal

from pydantic import BaseModel, field_validator, model_validator
# FIX: Import tools to handle GeoAlchemy2's WKBElement
from geoalchemy2.elements import WKBElement
from geoalchemy2.shape import to_shape

# Import the new category schema to be used in POI schema
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

    # FIX: Add a validator to handle the WKBElement from the database
    @model_validator(mode='before')
    @classmethod
    def parse_wkb(cls, v):
        if isinstance(v, WKBElement):
            # Convert WKBElement to a shapely geometry, then extract coordinates
            point = to_shape(v)
            return {"type": "Point", "coordinates": list(point.coords)[0]}
        # If it's already a dict (from a POST request), pass it through
        return v

# Location Schemas
class LocationBase(BaseModel):
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state_abbr: Optional[str] = None
    postal_code: Optional[str] = None
    coordinates: PointGeometry
    use_coordinates_for_map: bool = False
    entry_notes: Optional[str] = None
    entrance_photo_url: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

# Business Schemas
LISTING_TYPES = Literal['free', 'paid', 'paid_founding', 'sponsor']

class BusinessBase(BaseModel):
    price_range: Optional[str] = None
    listing_type: LISTING_TYPES = 'free'
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_service_business: bool = False
    attributes: Optional[dict] = None

class BusinessCreate(BusinessBase):
    pass

class Business(BusinessBase):
    poi_id: uuid.UUID

    class Config:
        from_attributes = True

# Outdoors Schemas
class OutdoorsBase(BaseModel):
    outdoor_specific_type: Optional[str] = None
    facilities: Optional[Any] = None
    trail_length_km: Optional[float] = None

class OutdoorsCreate(OutdoorsBase):
    pass

class Outdoors(OutdoorsBase):
    poi_id: uuid.UUID

    class Config:
        from_attributes = True

# Event Schemas
class EventBase(BaseModel):
    start_datetime: datetime
    end_datetime: Optional[datetime] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    poi_id: uuid.UUID

    class Config:
        from_attributes = True

# Point of Interest Schemas
STATUS_TYPES = Literal[
    'Fully Open', 'Partly Open', 'Temporary Hour Changes', 'Temporarily Closed',
    'Call Ahead', 'Permanently Closed', 'Warning', 'Limited Capacity',
    'Coming Soon', 'Under Development', 'Alert'
]

class PointOfInterestBase(BaseModel):
    name: str
    description: Optional[str] = None
    poi_type: str
    status: STATUS_TYPES = 'Fully Open'
    summary: Optional[str] = None
    status_message: Optional[str] = None
    featured_image_url: Optional[str] = None
    is_verified: bool = False
    parent_poi_id: Optional[uuid.UUID] = None

    @field_validator('poi_type')
    def poi_type_must_be_valid(cls, v):
        if v not in ['business', 'outdoors', 'event']:
            raise ValueError("poi_type must be 'business', 'outdoors', or 'event'")
        return v

class PointOfInterestCreate(PointOfInterestBase):
    slug: Optional[str] = None
    location: LocationCreate
    business: Optional[BusinessCreate] = None
    outdoors: Optional[OutdoorsCreate] = None
    event: Optional[EventCreate] = None
    category_ids: Optional[List[uuid.UUID]] = []

    @model_validator(mode='before')
    @classmethod
    def generate_slug_from_name(cls, values):
        if isinstance(values, dict):
             if not values.get('slug') and values.get('name'):
                values['slug'] = generate_slug(values['name'])
        return values

class PointOfInterestUpdate(BaseModel):
    # Make all fields optional for PATCH-like behavior
    name: Optional[str] = None
    description: Optional[str] = None
    poi_type: Optional[str] = None
    status: Optional[STATUS_TYPES] = None
    summary: Optional[str] = None
    status_message: Optional[str] = None
    featured_image_url: Optional[str] = None
    is_verified: Optional[bool] = None
    parent_poi_id: Optional[uuid.UUID] = None
    
    location: Optional[LocationCreate] = None
    business: Optional[BusinessCreate] = None
    outdoors: Optional[OutdoorsCreate] = None
    event: Optional[EventCreate] = None
    category_ids: Optional[List[uuid.UUID]] = None

    class Config:
        from_attributes = True


class PointOfInterest(PointOfInterestBase):
    id: uuid.UUID
    slug: str
    location: Location
    business: Optional[Business] = None
    outdoors: Optional[Outdoors] = None
    event: Optional[Event] = None
    categories: List[Category] = []
    updated_at: datetime
    
    class Config:
        from_attributes = True