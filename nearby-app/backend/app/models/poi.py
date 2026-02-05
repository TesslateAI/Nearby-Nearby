# app/models/poi.py
import uuid
from sqlalchemy import (Column, String, Text, ForeignKey, Numeric, TIMESTAMP,
                        Boolean, Enum as SQLAlchemyEnum, Table, Integer)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from ..database import Base

from shared.models.enums import POIType

# --- Association Table for Categories ---
poi_category_association = Table('poi_categories', Base.metadata,
    Column('poi_id', PG_UUID(as_uuid=True), ForeignKey('points_of_interest.id'), primary_key=True),
    Column('category_id', PG_UUID(as_uuid=True), ForeignKey('categories.id'), primary_key=True),
    Column('is_main', Boolean, default=False, nullable=False)
)

# --- Main POI Table ---
class PointOfInterest(Base):
    __tablename__ = "points_of_interest"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_type = Column(SQLAlchemyEnum(POIType), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(300), unique=True, index=True)  # SEO-friendly URL slug (name-city)
    publication_status = Column(String(20), default='draft', nullable=False)
    description_long = Column(Text)
    description_short = Column(String(250))
    teaser_paragraph = Column(String(120))
    primary_type_id = Column(PG_UUID(as_uuid=True), ForeignKey("primary_types.id"), nullable=True, index=True)
    listing_type = Column(String(50), default='free')
    status = Column(String(50), default='Fully Open')
    status_message = Column(String(100))
    is_verified = Column(Boolean, default=False)
    is_disaster_hub = Column(Boolean, default=False)
    featured_image = Column(String)
    history_paragraph = Column(Text)
    community_impact = Column(Text)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False, index=True)
    dont_display_location = Column(Boolean, default=False)
    address_full = Column(String)
    address_street = Column(String)
    address_city = Column(String)
    address_state = Column(String)
    address_zip = Column(String)
    address_county = Column(String)
    front_door_latitude = Column(Numeric(10, 7))
    front_door_longitude = Column(Numeric(10, 7))
    business_entry_notes = Column(Text)
    # business_entry_photo moved to Images table (image_type='entry')
    park_entry_notes = Column(Text)
    # park_entry_photo moved to Images table (image_type='entry')
    website_url = Column(String)
    phone_number = Column(String)
    email = Column(String)
    instagram_username = Column(String)
    facebook_username = Column(String)
    x_username = Column(String)
    tiktok_username = Column(String)
    linkedin_username = Column(String)
    other_socials = Column(JSONB)
    cost = Column(String(100))
    pricing_details = Column(Text)
    ticket_link = Column(String)
    price_range_per_person = Column(String)
    pricing = Column(String)
    discounts = Column(JSONB)
    gift_cards = Column(String)
    hours = Column(JSONB)
    holiday_hours = Column(JSONB)
    appointment_booking_url = Column(String)
    hours_but_appointment_required = Column(Boolean)
    parking_types = Column(JSONB)
    parking_locations = Column(JSONB)
    parking_notes = Column(Text)
    # parking_photos moved to Images table (image_type='parking')
    # parking_lot_photo moved to Images table (image_type='parking')
    public_transit_info = Column(Text)
    expect_to_pay_parking = Column(String)
    amenities = Column(JSONB)
    ideal_for = Column(JSONB)
    ideal_for_key = Column(JSONB)
    key_facilities = Column(JSONB)
    payment_methods = Column(JSONB)
    alcohol_options = Column(JSONB)
    wheelchair_accessible = Column(JSONB)
    wheelchair_details = Column(Text)
    smoking_options = Column(JSONB)
    smoking_details = Column(Text)
    wifi_options = Column(JSONB)
    drone_usage = Column(String)
    drone_policy = Column(Text)
    pet_options = Column(JSONB)
    pet_policy = Column(Text)
    public_toilets = Column(JSONB)
    toilet_locations = Column(JSONB)
    toilet_description = Column(Text)
    youth_amenities = Column(JSONB)
    business_amenities = Column(JSONB)
    entertainment_options = Column(JSONB)
    available_for_rent = Column(Boolean)
    rental_info = Column(Text)
    rental_pricing = Column(Text)
    rental_link = Column(String)
    # rental_photos moved to Images table (image_type='rental')
    playground_available = Column(Boolean)
    playground_types = Column(JSONB)
    playground_surface_types = Column(JSONB)
    playground_notes = Column(Text)
    # playground_photos moved to Images table (image_type='playground')
    playground_location = Column(JSONB)
    natural_features = Column(JSONB)
    outdoor_types = Column(JSONB)
    things_to_do = Column(JSONB)
    night_sky_viewing = Column(Text)
    birding_wildlife = Column(Text)
    hunting_fishing_allowed = Column(String)
    hunting_types = Column(JSONB)
    fishing_allowed = Column(String)
    fishing_types = Column(JSONB)
    licenses_required = Column(JSONB)
    hunting_fishing_info = Column(Text)
    camping_lodging = Column(Text)
    service_locations = Column(JSONB)
    locally_found_at = Column(JSONB)
    article_links = Column(JSONB)
    organization_memberships = Column(JSONB)
    membership_passes = Column(JSONB)
    membership_details = Column(Text)
    associated_trails = Column(JSONB)
    photos = Column(JSONB)
    contact_info = Column(JSONB)
    compliance = Column(JSONB)
    custom_fields = Column(JSONB)
    menu_photos = Column(JSONB)
    menu_link = Column(String)
    delivery_links = Column(JSONB)
    reservation_links = Column(JSONB)
    appointment_links = Column(JSONB)
    online_ordering_links = Column(JSONB)
    gallery_photos = Column(JSONB)
    downloadable_maps = Column(JSONB)
    payphone_location = Column(JSONB)
    payphone_locations = Column(JSONB)
    facilities_options = Column(JSONB)
    main_contact_name = Column(String)
    main_contact_email = Column(String)
    main_contact_phone = Column(String)
    offsite_emergency_contact = Column(Text)
    emergency_protocols = Column(Text)
    # Note: embedding column for semantic search is NOT defined here
    # to prevent SQLAlchemy from including it in queries when pgvector is not installed.
    # Semantic search uses raw SQL when the embedding column exists in the database.
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_updated = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    business = relationship("Business", back_populates="poi", uselist=False, cascade="all, delete-orphan")
    park = relationship("Park", back_populates="poi", uselist=False, cascade="all, delete-orphan")
    trail = relationship("Trail", back_populates="poi", uselist=False, cascade="all, delete-orphan")
    event = relationship("Event", back_populates="poi", uselist=False, cascade="all, delete-orphan")
    
    categories = relationship("Category", secondary=poi_category_association, back_populates="pois")
    # Note: Images are queried directly from the images table in API endpoints


# --- Sub-Type Tables ---
class Business(Base):
    __tablename__ = "businesses"
    poi_id = Column(PG_UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    price_range = Column(String)
    poi = relationship("PointOfInterest", back_populates="business")

class Park(Base):
    __tablename__ = "parks"
    poi_id = Column(PG_UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    drone_usage_policy = Column(String)
    poi = relationship("PointOfInterest", back_populates="park")

class Trail(Base):
    __tablename__ = "trails"
    poi_id = Column(PG_UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    length_text = Column(String)
    length_segments = Column(JSONB)
    difficulty = Column(String)
    difficulty_description = Column(Text)
    route_type = Column(String)
    trailhead_location = Column(JSONB)
    trailhead_latitude = Column(Numeric(10, 7))
    trailhead_longitude = Column(Numeric(10, 7))
    trailhead_entrance_photo = Column(String)
    trailhead_exit_location = Column(JSONB)
    trail_exit_latitude = Column(Numeric(10, 7))
    trail_exit_longitude = Column(Numeric(10, 7))
    trailhead_exit_photo = Column(String)
    trail_markings = Column(Text)
    trailhead_access_details = Column(Text)
    downloadable_trail_map = Column(String)
    trail_surfaces = Column(JSONB)
    trail_conditions = Column(JSONB)
    trail_experiences = Column(JSONB)
    poi = relationship("PointOfInterest", back_populates="trail")

class Event(Base):
    __tablename__ = "events"
    poi_id = Column(PG_UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    start_datetime = Column(TIMESTAMP(timezone=True), nullable=False)
    end_datetime = Column(TIMESTAMP(timezone=True))
    is_repeating = Column(Boolean)
    repeat_pattern = Column(JSONB)
    organizer_name = Column(String)
    venue_settings = Column(JSONB)
    event_entry_notes = Column(Text)
    # event_entry_photo moved to Images table (image_type='entry')
    # event_entry_photo = Column(String)
    food_and_drink_info = Column(Text)
    coat_check_options = Column(JSONB)
    has_vendors = Column(Boolean)
    vendor_types = Column(JSONB)
    vendor_application_deadline = Column(TIMESTAMP(timezone=True))
    vendor_application_info = Column(Text)
    vendor_fee = Column(String)
    vendor_requirements = Column(Text)
    vendor_poi_links = Column(JSONB)
    poi = relationship("PointOfInterest", back_populates="event")


# --- Other Tables ---
class Category(Base):
    __tablename__ = "categories"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    parent_id = Column(PG_UUID(as_uuid=True), ForeignKey("categories.id"), index=True)
    parent = relationship("Category", remote_side=[id], backref="children")
    applicable_to = Column(ARRAY(String))
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    # Removed is_main_category - use is_main in poi_categories association table instead
    pois = relationship("PointOfInterest", secondary=poi_category_association, back_populates="categories")

# Note: Image model is defined in app/models/image.py