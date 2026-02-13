# app/schemas/poi.py
from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional, List, Any
import uuid
from datetime import datetime
from geoalchemy2.elements import WKBElement
from geoalchemy2.shape import to_shape

# --- Helper Schemas ---
class PointGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float]

    @classmethod
    def from_wkb(cls, wkb: WKBElement):
        point = to_shape(wkb)
        return cls(coordinates=[point.x, point.y])

class Category(BaseModel):
    id: uuid.UUID
    name: str
    model_config = ConfigDict(from_attributes=True)

# --- Sub-Type Schemas ---
class Business(BaseModel):
    price_range: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class Park(BaseModel):
    drone_usage_policy: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
    
class Trail(BaseModel):
    length_text: Optional[str] = None
    difficulty: Optional[str] = None
    route_type: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class Event(BaseModel):
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# --- Image Schema for S3 URLs ---
class POIImage(BaseModel):
    id: str
    url: str
    thumbnail_url: Optional[str] = None  # Smaller variant for grid display
    type: str
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


# --- Main POI Schemas ---
class POISearchResult(BaseModel):
    id: uuid.UUID
    name: str
    slug: Optional[str] = None  # SEO-friendly URL slug
    poi_type: Optional[str] = None  # For generating SEO URLs
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    location: Optional[PointGeometry] = None  # GeoJSON Point with coordinates for map display
    main_category: Optional[Category] = None  # Primary display category

    # Attribute fields needed for frontend attribute-based filtering
    # Basic amenities
    pet_options: Optional[Any] = None
    pet_policy: Optional[str] = None
    wifi_options: Optional[Any] = None
    key_facilities: Optional[Any] = None
    amenities: Optional[Any] = None
    business_amenities: Optional[Any] = None
    youth_amenities: Optional[Any] = None
    entertainment_options: Optional[Any] = None

    # Parking & transit
    parking_types: Optional[Any] = None
    parking_notes: Optional[str] = None
    parking_locations: Optional[Any] = None
    expect_to_pay_parking: Optional[str] = None
    public_transit_info: Optional[str] = None

    # Accessibility
    wheelchair_accessible: Optional[Any] = None
    wheelchair_details: Optional[str] = None

    # Restrooms
    public_toilets: Optional[Any] = None
    toilet_locations: Optional[Any] = None
    toilet_description: Optional[str] = None

    # Playground
    playground_available: Optional[bool] = None
    playground_types: Optional[Any] = None
    playground_surface_types: Optional[Any] = None
    playground_notes: Optional[str] = None
    playground_location: Optional[Any] = None

    # Alcohol & smoking
    alcohol_options: Optional[Any] = None
    smoking_options: Optional[Any] = None
    smoking_details: Optional[str] = None

    # Rentals
    available_for_rent: Optional[bool] = None
    rental_info: Optional[str] = None
    rental_pricing: Optional[str] = None
    rental_link: Optional[str] = None

    # Food & dining
    menu_link: Optional[str] = None
    menu_photos: Optional[Any] = None
    delivery_links: Optional[Any] = None
    online_ordering_links: Optional[Any] = None
    food_and_drink_info: Optional[str] = None

    # Booking & reservations
    reservation_links: Optional[Any] = None
    appointment_links: Optional[Any] = None
    appointment_booking_url: Optional[str] = None
    hours_but_appointment_required: Optional[bool] = None

    # Pricing & payment
    price_range_per_person: Optional[str] = None
    pricing: Optional[str] = None
    cost: Optional[str] = None
    pricing_details: Optional[str] = None
    payment_methods: Optional[Any] = None
    gift_cards: Optional[str] = None
    discounts: Optional[Any] = None

    # Outdoor & nature features
    natural_features: Optional[Any] = None
    outdoor_types: Optional[Any] = None
    things_to_do: Optional[Any] = None
    birding_wildlife: Optional[str] = None
    night_sky_viewing: Optional[str] = None

    # Hunting & fishing
    hunting_fishing_allowed: Optional[str] = None
    hunting_types: Optional[Any] = None
    fishing_allowed: Optional[str] = None
    fishing_types: Optional[Any] = None
    licenses_required: Optional[Any] = None
    hunting_fishing_info: Optional[str] = None

    # Drones
    drone_usage: Optional[str] = None
    drone_policy: Optional[str] = None

    # Camping & lodging
    camping_lodging: Optional[str] = None

    # Park & trail facilities
    facilities_options: Optional[Any] = None
    downloadable_maps: Optional[Any] = None
    payphone_location: Optional[Any] = None
    payphone_locations: Optional[Any] = None

    # Trail-specific
    associated_trails: Optional[Any] = None
    difficulty: Optional[str] = None
    difficulty_description: Optional[str] = None
    length_text: Optional[str] = None
    length_segments: Optional[Any] = None
    route_type: Optional[str] = None
    trail_surfaces: Optional[Any] = None
    trail_markings: Optional[Any] = None
    trail_experiences: Optional[Any] = None
    trail_conditions: Optional[str] = None
    downloadable_trail_map: Optional[str] = None
    trailhead_access_details: Optional[str] = None

    # Memberships & passes
    membership_passes: Optional[Any] = None
    membership_details: Optional[str] = None

    # Event-specific
    ticket_link: Optional[str] = None
    event_entry_notes: Optional[str] = None
    has_vendors: Optional[bool] = None
    vendor_types: Optional[Any] = None
    vendor_application_info: Optional[str] = None
    vendor_application_deadline: Optional[str] = None
    vendor_requirements: Optional[str] = None
    vendor_fee: Optional[str] = None
    vendor_poi_links: Optional[Any] = None
    venue_settings: Optional[Any] = None

    # Compliance & requirements
    compliance: Optional[Any] = None

    # General
    categories: Optional[List[dict]] = None
    ideal_for: Optional[Any] = None
    hours: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

    @model_validator(mode='before')
    @classmethod
    def convert_wkb_to_geojson(cls, data):
        """Convert WKBElement to PointGeometry for location field"""
        if isinstance(data, dict):
            # Already a dict, check if location is WKBElement
            if 'location' in data and isinstance(data['location'], WKBElement):
                data['location'] = PointGeometry.from_wkb(data['location'])
        else:
            # It's a SQLAlchemy model object
            if hasattr(data, 'location') and isinstance(data.location, WKBElement):
                # Convert to dict and update location
                data_dict = {key: getattr(data, key) for key in dir(data) if not key.startswith('_')}
                data_dict['location'] = PointGeometry.from_wkb(data.location)
                return data_dict
        return data

class POINearbyResult(POISearchResult):
    distance_meters: Optional[float] = None
    location: Optional[PointGeometry] = None
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)
    
class POIDetail(BaseModel):
    id: uuid.UUID
    name: str
    slug: Optional[str] = None  # SEO-friendly URL slug
    poi_type: str
    status: Optional[str] = None
    status_message: Optional[str] = None
    is_verified: Optional[bool] = None
    listing_type: Optional[str] = None

    # Descriptions
    description_long: Optional[str] = None
    description_short: Optional[str] = None
    teaser_paragraph: Optional[str] = None
    history_paragraph: Optional[str] = None

    # Address and Location
    address_full: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    address_county: Optional[str] = None
    front_door_latitude: Optional[float] = None
    front_door_longitude: Optional[float] = None
    location: PointGeometry
    dont_display_location: Optional[bool] = None

    # Contact Information
    phone_number: Optional[str] = None
    email: Optional[str] = None
    website_url: Optional[str] = None
    main_contact_name: Optional[str] = None
    main_contact_email: Optional[str] = None
    main_contact_phone: Optional[str] = None

    # Social Media
    instagram_username: Optional[str] = None
    facebook_username: Optional[str] = None
    x_username: Optional[str] = None
    tiktok_username: Optional[str] = None
    linkedin_username: Optional[str] = None
    other_socials: Optional[Any] = None

    # Hours and Availability
    hours: Optional[Any] = None
    holiday_hours: Optional[Any] = None
    hours_but_appointment_required: Optional[bool] = None
    appointment_booking_url: Optional[str] = None

    # Pricing and Costs
    cost: Optional[str] = None
    pricing_details: Optional[str] = None
    price_range_per_person: Optional[str] = None
    ticket_link: Optional[str] = None
    gift_cards: Optional[str] = None
    discounts: Optional[Any] = None

    # Parking
    parking_types: Optional[Any] = None
    parking_locations: Optional[Any] = None
    parking_notes: Optional[str] = None
    parking_photos: Optional[Any] = None
    expect_to_pay_parking: Optional[str] = None
    parking_lot_photo: Optional[str] = None
    public_transit_info: Optional[str] = None

    # Accessibility
    wheelchair_accessible: Optional[Any] = None
    wheelchair_details: Optional[str] = None

    # Amenities and Facilities
    amenities: Optional[Any] = None
    key_facilities: Optional[Any] = None
    facilities_options: Optional[Any] = None
    wifi_options: Optional[Any] = None
    payment_methods: Optional[Any] = None
    alcohol_options: Optional[Any] = None
    smoking_options: Optional[Any] = None
    smoking_details: Optional[str] = None
    youth_amenities: Optional[Any] = None
    business_amenities: Optional[Any] = None
    entertainment_options: Optional[Any] = None

    # Pets and Animals
    pet_options: Optional[Any] = None
    pet_policy: Optional[str] = None

    # Restrooms
    public_toilets: Optional[Any] = None
    toilet_locations: Optional[Any] = None
    toilet_description: Optional[str] = None
    payphone_locations: Optional[Any] = None

    # Drone Policy
    drone_usage: Optional[str] = None
    drone_policy: Optional[str] = None

    # Rentals
    available_for_rent: Optional[bool] = None
    rental_info: Optional[str] = None
    rental_pricing: Optional[str] = None
    rental_link: Optional[str] = None
    rental_photos: Optional[Any] = None

    # Playground (for Parks)
    playground_available: Optional[bool] = None
    playground_types: Optional[Any] = None
    playground_surface_types: Optional[Any] = None
    playground_notes: Optional[str] = None
    playground_photos: Optional[Any] = None
    playground_location: Optional[Any] = None

    # Outdoor Activities
    natural_features: Optional[Any] = None
    outdoor_types: Optional[Any] = None
    things_to_do: Optional[Any] = None
    birding_wildlife: Optional[str] = None
    night_sky_viewing: Optional[str] = None
    hunting_fishing_allowed: Optional[str] = None
    hunting_types: Optional[Any] = None
    fishing_allowed: Optional[str] = None
    fishing_types: Optional[Any] = None
    licenses_required: Optional[Any] = None
    hunting_fishing_info: Optional[str] = None
    camping_lodging: Optional[str] = None
    associated_trails: Optional[Any] = None

    # Membership
    membership_passes: Optional[Any] = None
    membership_details: Optional[str] = None

    # Menu and Ordering (for Businesses)
    menu_link: Optional[str] = None
    delivery_links: Optional[Any] = None
    reservation_links: Optional[Any] = None
    appointment_links: Optional[Any] = None
    online_ordering_links: Optional[Any] = None

    # Business Information
    service_locations: Optional[Any] = None
    locally_found_at: Optional[Any] = None
    article_links: Optional[Any] = None
    community_impact: Optional[str] = None
    organization_memberships: Optional[Any] = None

    # Photos and Media
    photos: Optional[Any] = None
    gallery_photos: Optional[Any] = None
    featured_image: Optional[str] = None
    downloadable_maps: Optional[Any] = None

    # Entry Information
    business_entry_notes: Optional[str] = None
    business_entry_photo: Optional[str] = None
    park_entry_notes: Optional[str] = None
    park_entry_photo: Optional[str] = None

    # Emergency
    offsite_emergency_contact: Optional[str] = None
    emergency_protocols: Optional[str] = None

    # Ideal For
    ideal_for: Optional[Any] = None
    ideal_for_key: Optional[Any] = None

    # Disaster Response
    is_disaster_hub: Optional[bool] = None

    # Relationships
    business: Optional[Business] = None
    park: Optional[Park] = None
    trail: Optional[Trail] = None
    event: Optional[Event] = None
    categories: List[Category] = []
    main_category: Optional[Category] = None  # Primary display category (is_main=True in association)
    secondary_categories: List[Category] = []  # Other categories (is_main=False)

    # Images from S3 storage
    images: List[POIImage] = []

    # Metadata
    created_at: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    publication_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)