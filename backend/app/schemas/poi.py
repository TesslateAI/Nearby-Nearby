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
LISTING_TYPES = Literal['free', 'paid', 'paid_founding', 'sponsor', 'community_comped']
PRICE_RANGES = Literal['$', '$$', '$$$', '$$$$']

class BusinessBase(BaseModel):
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
    length_segments: Optional[List[Dict[str, str]]] = None
    difficulty: Optional[str] = None
    difficulty_description: Optional[str] = None
    route_type: Optional[str] = None
    
    # Trailhead Information
    trailhead_location: Optional[Dict[str, Any]] = None
    trailhead_latitude: Optional[float] = None
    trailhead_longitude: Optional[float] = None
    trailhead_entrance_photo: Optional[str] = None
    trailhead_photo: Optional[str] = None
    trailhead_exit_location: Optional[Dict[str, Any]] = None
    trail_exit_latitude: Optional[float] = None
    trail_exit_longitude: Optional[float] = None
    trailhead_exit_photo: Optional[str] = None
    trail_exit_photo: Optional[str] = None
    trail_markings: Optional[str] = None
    trailhead_access_details: Optional[str] = None
    downloadable_trail_map: Optional[str] = None
    
    # Trail Surface & Experience
    trail_surfaces: Optional[List[str]] = None
    trail_conditions: Optional[List[str]] = None
    trail_experiences: Optional[List[str]] = None

class TrailCreate(TrailBase): pass
class Trail(TrailBase):
    poi_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# Event Schemas
class EventBase(BaseModel):
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    is_repeating: bool = False
    repeat_pattern: Optional[Dict[str, Any]] = None  # {"frequency": "weekly", "days": ["thursday"]}
    organizer_name: Optional[str] = None
    venue_settings: Optional[List[str]] = None
    event_entry_notes: Optional[str] = None
    event_entry_photo: Optional[str] = None
    food_and_drink_info: Optional[str] = None
    coat_check_options: Optional[List[str]] = None
    has_vendors: bool = False
    vendor_types: Optional[List[str]] = None
    vendor_application_deadline: Optional[datetime] = None
    vendor_application_info: Optional[str] = None
    vendor_fee: Optional[str] = None
    vendor_requirements: Optional[str] = None
    vendor_poi_links: Optional[List[uuid.UUID]] = None

class EventCreate(EventBase): pass
class Event(EventBase):
    poi_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# Point of Interest Schemas
POI_TYPES = Literal['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
PUBLICATION_STATUS = Literal['draft', 'published', 'archived']

# Different status types for different POI types
BUSINESS_STATUS_TYPES = Literal[
    'Fully Open', 'Partly Open', 'Temporary Hour Changes', 'Temporarily Closed',
    'Call Ahead', 'Permanently Closed', 'Warning', 'Limited Capacity',
    'Coming Soon', 'Under Development', 'Alert'
]

EVENT_STATUS_TYPES = Literal[
    'Scheduled', 'Canceled', 'Postponed', 'Updated Date and/or Time',
    'Rescheduled', 'Moved Online', 'Unofficial Proposed Date'
]

OTHER_STATUS_TYPES = Literal[
    'Fully Open', 'Partly Open', 'Temporarily Closed', 'Permanently Closed',
    'Warning', 'Limited Capacity', 'Coming Soon', 'Under Development', 'Alert'
]

class PointOfInterestBase(BaseModel):
    poi_type: POI_TYPES
    name: str
    description_long: Optional[str] = None
    description_short: Optional[str] = None  # Business free listings only (200 char limit)
    teaser_paragraph: Optional[str] = Field(None, max_length=120)  # All POI types (120 char limit)
    
    # Listing type for all POIs
    listing_type: LISTING_TYPES = 'free'
    
    # Cost fields (for Events, Parks, Trails)
    cost: Optional[str] = None  # Flexible format: "$1000" or "$0.00-$1000.00" or "0"
    pricing_details: Optional[str] = None  # Additional pricing details
    ticket_link: Optional[str] = None  # For Events - link to buy tickets
    
    # History (for paid listings, parks, trails)
    history_paragraph: Optional[str] = None
    
    # Featured image
    featured_image: Optional[str] = None
    
    # Main contact (internal use - not public)
    main_contact_name: Optional[str] = None
    main_contact_email: Optional[str] = None
    main_contact_phone: Optional[str] = None
    
    # Emergency contact (admin only - disaster response)
    offsite_emergency_contact: Optional[str] = None
    emergency_protocols: Optional[str] = None
    
    # Ideal For Key Box options (smaller subset)
    ideal_for_key: Optional[List[str]] = None
    
    # Additional Business Details
    price_range_per_person: Optional[str] = None
    pricing: Optional[str] = None
    discounts: Optional[List[str]] = None
    gift_cards: Optional[str] = None
    youth_amenities: Optional[List[str]] = None
    business_amenities: Optional[List[str]] = None
    entertainment_options: Optional[List[str]] = None
    
    # Menu & Online Booking (Business only)
    menu_photos: Optional[List[str]] = None
    menu_link: Optional[str] = None
    delivery_links: Optional[List[str]] = None
    reservation_links: Optional[List[str]] = None
    appointment_links: Optional[List[str]] = None
    online_ordering_links: Optional[List[str]] = None

    # Gallery
    gallery_photos: Optional[List[str]] = None

    # Business Entry
    business_entry_notes: Optional[str] = None
    business_entry_photo: Optional[str] = None

    # Hours enhancements
    appointment_booking_url: Optional[str] = None
    hours_but_appointment_required: Optional[bool] = False
    
    # Service Relationships
    service_locations: Optional[List[uuid.UUID]] = None
    
    # Locally Found & Community
    locally_found_at: Optional[List[uuid.UUID]] = None
    article_links: Optional[List[Dict[str, str]]] = None
    community_impact: Optional[str] = None
    organization_memberships: Optional[List[Dict[str, Any]]] = None
    
    # Rental photos
    rental_photos: Optional[List[str]] = None
    
    # Address fields
    dont_display_location: bool = False  # For businesses that don't want exact location shown
    address_full: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    address_county: Optional[str] = None
    # Shopping center relationship (for businesses)
    shopping_center: Optional[str] = None

    # Front door coordinates (separate from main location for map pin)
    front_door_latitude: Optional[float] = None
    front_door_longitude: Optional[float] = None
    
    # Status and verification
    status: Optional[str] = 'Fully Open'  # Will be validated based on POI type
    status_message: Optional[str] = None
    is_verified: bool = False
    is_disaster_hub: bool = False

    # Publication status (draft, published, archived)
    publication_status: PUBLICATION_STATUS = 'draft'
    
    # Contact info
    website_url: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    
    # Social media fields (usernames only)
    instagram_username: Optional[str] = None
    facebook_username: Optional[str] = None
    x_username: Optional[str] = None
    tiktok_username: Optional[str] = None
    linkedin_username: Optional[str] = None
    other_socials: Optional[Dict[str, str]] = None
    
    # Parking Information
    parking_types: Optional[List[str]] = None
    parking_locations: Optional[List[Dict[str, Any]]] = None
    parking_notes: Optional[str] = None
    parking_photos: Optional[List[str]] = None
    public_transit_info: Optional[str] = None
    expect_to_pay_parking: Optional[Literal['yes', 'no', 'sometimes']] = None
    
    # Additional Info
    downloadable_maps: Optional[List[Dict[str, str]]] = None
    payment_methods: Optional[List[str]] = None
    key_facilities: Optional[List[str]] = None
    alcohol_options: Optional[List[str]] = None
    wheelchair_accessible: Optional[List[str]] = None
    wheelchair_details: Optional[str] = None
    smoking_options: Optional[List[str]] = None
    smoking_details: Optional[str] = None
    wifi_options: Optional[List[str]] = None
    drone_usage: Optional[str] = None
    drone_policy: Optional[str] = None
    pet_options: Optional[List[str]] = None
    pet_policy: Optional[str] = None
    
    # Public Toilets
    public_toilets: Optional[List[str]] = None
    toilet_locations: Optional[List[Dict[str, Any]]] = None
    toilet_description: Optional[str] = None
    
    # Rentals
    available_for_rent: bool = False
    rental_info: Optional[str] = None
    rental_pricing: Optional[str] = None
    rental_link: Optional[str] = None
    rental_photos: Optional[List[str]] = None
    
    # Playground Information (All POIs)
    playground_available: bool = False
    playground_types: Optional[List[str]] = None
    playground_surface_types: Optional[List[str]] = None
    playground_notes: Optional[str] = None
    playground_photos: Optional[List[str]] = None
    playground_location: Optional[Dict[str, Any]] = None
    
    # Parks & Trails Additional Info
    payphone_location: Optional[Dict[str, Any]] = None
    payphone_locations: Optional[List[Dict[str, Any]]] = None
    park_entry_notes: Optional[str] = None
    park_entry_photo: Optional[str] = None
    parking_lot_photo: Optional[str] = None
    facilities_options: Optional[List[str]] = None
    night_sky_viewing: Optional[str] = None
    natural_features: Optional[List[str]] = None
    outdoor_types: Optional[List[str]] = None
    things_to_do: Optional[List[str]] = None
    birding_wildlife: Optional[str] = None
    
    # Hunting & Fishing
    hunting_fishing_allowed: Optional[str] = None
    hunting_types: Optional[List[str]] = None
    fishing_allowed: Optional[str] = None
    fishing_types: Optional[List[str]] = None
    licenses_required: Optional[List[str]] = None
    hunting_fishing_info: Optional[str] = None
    
    # Memberships & Passes
    membership_passes: Optional[List[uuid.UUID]] = None
    membership_details: Optional[str] = None
    
    # Trail connections
    associated_trails: Optional[List[uuid.UUID]] = None
    camping_lodging: Optional[str] = None

    # Park system and management (for parks)
    park_system: Optional[str] = None
    park_manager: Optional[str] = None

    # JSONB fields
    photos: Optional[Dict[str, Any]] = None
    hours: Optional[Dict[str, Any]] = None  # Complex hours with multiple periods, seasonal
    holiday_hours: Optional[Dict[str, Any]] = None  # Recurring holiday hours
    amenities: Optional[Dict[str, Any]] = None
    ideal_for: Optional[List[str]] = None  # List of ideal_for options
    contact_info: Optional[Dict[str, Any]] = None
    compliance: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class PointOfInterestCreate(PointOfInterestBase):
    location: PointGeometry
    business: Optional[BusinessCreate] = None
    park: Optional[ParkCreate] = None
    trail: Optional[TrailCreate] = None
    event: Optional[EventCreate] = None
    main_category_id: Optional[uuid.UUID] = None  # Single main category
    category_ids: Optional[List[uuid.UUID]] = []  # Secondary categories

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
    teaser_paragraph: Optional[str] = Field(None, max_length=120)
    listing_type: Optional[LISTING_TYPES] = None
    cost: Optional[str] = None
    pricing_details: Optional[str] = None
    ticket_link: Optional[str] = None
    history_paragraph: Optional[str] = None
    featured_image: Optional[str] = None
    main_contact_name: Optional[str] = None
    main_contact_email: Optional[str] = None
    main_contact_phone: Optional[str] = None
    offsite_emergency_contact: Optional[str] = None
    emergency_protocols: Optional[str] = None
    ideal_for_key: Optional[List[str]] = None
    price_range_per_person: Optional[str] = None
    pricing: Optional[str] = None
    discounts: Optional[List[str]] = None
    gift_cards: Optional[str] = None
    youth_amenities: Optional[List[str]] = None
    business_amenities: Optional[List[str]] = None
    entertainment_options: Optional[List[str]] = None
    menu_photos: Optional[List[str]] = None
    menu_link: Optional[str] = None
    delivery_links: Optional[List[str]] = None
    reservation_links: Optional[List[str]] = None
    appointment_links: Optional[List[str]] = None
    online_ordering_links: Optional[List[str]] = None
    gallery_photos: Optional[List[str]] = None
    business_entry_notes: Optional[str] = None
    business_entry_photo: Optional[str] = None
    appointment_booking_url: Optional[str] = None
    hours_but_appointment_required: Optional[bool] = None
    service_locations: Optional[List[uuid.UUID]] = None
    locally_found_at: Optional[List[uuid.UUID]] = None
    article_links: Optional[List[Dict[str, str]]] = None
    community_impact: Optional[str] = None
    organization_memberships: Optional[List[Dict[str, Any]]] = None
    rental_photos: Optional[List[str]] = None
    dont_display_location: Optional[bool] = None
    address_full: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    address_county: Optional[str] = None
    shopping_center: Optional[str] = None
    front_door_latitude: Optional[float] = None
    front_door_longitude: Optional[float] = None
    status: Optional[str] = None
    status_message: Optional[str] = None
    is_verified: Optional[bool] = None
    is_disaster_hub: Optional[bool] = None
    publication_status: Optional[PUBLICATION_STATUS] = None
    website_url: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    instagram_username: Optional[str] = None
    facebook_username: Optional[str] = None
    x_username: Optional[str] = None
    tiktok_username: Optional[str] = None
    linkedin_username: Optional[str] = None
    other_socials: Optional[Dict[str, str]] = None
    parking_types: Optional[List[str]] = None
    parking_locations: Optional[List[Dict[str, Any]]] = None
    parking_notes: Optional[str] = None
    parking_photos: Optional[List[str]] = None
    public_transit_info: Optional[str] = None
    expect_to_pay_parking: Optional[Literal['yes', 'no', 'sometimes']] = None
    downloadable_maps: Optional[List[Dict[str, str]]] = None
    payment_methods: Optional[List[str]] = None
    key_facilities: Optional[List[str]] = None
    alcohol_options: Optional[List[str]] = None
    wheelchair_accessible: Optional[List[str]] = None
    wheelchair_details: Optional[str] = None
    smoking_options: Optional[List[str]] = None
    smoking_details: Optional[str] = None
    wifi_options: Optional[List[str]] = None
    drone_usage: Optional[str] = None
    drone_policy: Optional[str] = None
    pet_options: Optional[List[str]] = None
    pet_policy: Optional[str] = None
    public_toilets: Optional[List[str]] = None
    toilet_locations: Optional[List[Dict[str, Any]]] = None
    toilet_description: Optional[str] = None
    available_for_rent: Optional[bool] = None
    rental_info: Optional[str] = None
    rental_pricing: Optional[str] = None
    rental_link: Optional[str] = None
    rental_photos: Optional[List[str]] = None
    playground_available: Optional[bool] = None
    playground_types: Optional[List[str]] = None
    playground_surface_types: Optional[List[str]] = None
    playground_notes: Optional[str] = None
    playground_photos: Optional[List[str]] = None
    playground_location: Optional[Dict[str, Any]] = None
    payphone_location: Optional[Dict[str, Any]] = None
    payphone_locations: Optional[List[Dict[str, Any]]] = None
    park_entry_notes: Optional[str] = None
    park_entry_photo: Optional[str] = None
    parking_lot_photo: Optional[str] = None
    facilities_options: Optional[List[str]] = None
    night_sky_viewing: Optional[str] = None
    natural_features: Optional[List[str]] = None
    outdoor_types: Optional[List[str]] = None
    things_to_do: Optional[List[str]] = None
    birding_wildlife: Optional[str] = None
    hunting_fishing_allowed: Optional[str] = None
    hunting_types: Optional[List[str]] = None
    fishing_allowed: Optional[str] = None
    fishing_types: Optional[List[str]] = None
    licenses_required: Optional[List[str]] = None
    hunting_fishing_info: Optional[str] = None
    membership_passes: Optional[List[uuid.UUID]] = None
    membership_details: Optional[str] = None
    associated_trails: Optional[List[uuid.UUID]] = None
    camping_lodging: Optional[str] = None
    park_system: Optional[str] = None
    park_manager: Optional[str] = None
    photos: Optional[Dict[str, Any]] = None
    hours: Optional[Dict[str, Any]] = None
    holiday_hours: Optional[Dict[str, Any]] = None
    amenities: Optional[Dict[str, Any]] = None
    ideal_for: Optional[List[str]] = None
    contact_info: Optional[Dict[str, Any]] = None
    compliance: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    
    location: Optional[PointGeometry] = None
    business: Optional[BusinessCreate] = None
    park: Optional[ParkCreate] = None
    trail: Optional[TrailCreate] = None
    event: Optional[EventCreate] = None
    main_category_id: Optional[uuid.UUID] = None  # Single main category
    category_ids: Optional[List[uuid.UUID]] = None  # Secondary categories

    model_config = ConfigDict(from_attributes=True)

class PointOfInterest(PointOfInterestBase):
    poi_type: str = Field(..., alias='poi_type')
    id: uuid.UUID
    location: PointGeometry
    business: Optional[Business] = None
    park: Optional[Park] = None
    trail: Optional[Trail] = None
    event: Optional[Event] = None
    main_category: Optional[Category] = None  # Will be populated via property
    secondary_categories: List[Category] = []  # Will be populated via property
    categories: List[Category] = []  # All categories (for backward compatibility)
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