import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Numeric, TIMESTAMP, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import enum

from app.database import Base
from app.models.category import poi_category_association # Import the association table

# Note: For the MVP, we are focusing on the POI-related models.
# The `users` and `categories` tables from the schema can be implemented here
# in a similar fashion when they are needed.

class POIType(enum.Enum):
    BUSINESS = "BUSINESS"
    SERVICES = "SERVICES"
    PARK = "PARK"
    TRAIL = "TRAIL"
    EVENT = "EVENT"
    YOUTH_ACTIVITIES = "YOUTH_ACTIVITIES"
    JOBS = "JOBS"
    VOLUNTEER_OPPORTUNITIES = "VOLUNTEER_OPPORTUNITIES"
    DISASTER_HUBS = "DISASTER_HUBS"

class PointOfInterest(Base):
    __tablename__ = "points_of_interest"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_type = Column(Enum(POIType), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(300), unique=True, index=True)  # SEO-friendly URL slug (name-city)
    description_long = Column(Text)
    description_short = Column(String(250))  # Business free listings only (200 char limit)
    teaser_paragraph = Column(String(120))  # All POI types (120 char limit)
    
    # Primary Type (e.g., Food Truck, Ghost Kitchen, Pop-up)
    primary_type_id = Column(UUID(as_uuid=True), ForeignKey("primary_types.id"), nullable=True, index=True)
    
    # Address fields
    dont_display_location = Column(Boolean, default=False)  # For businesses that don't want exact location shown
    address_full = Column(String)
    address_street = Column(String)
    address_city = Column(String)
    address_state = Column(String)
    address_zip = Column(String)
    address_county = Column(String)

    # Front door coordinates (separate from main location for map pin)
    front_door_latitude = Column(Numeric(precision=10, scale=7))
    front_door_longitude = Column(Numeric(precision=10, scale=7))
    
    # Location (PostGIS)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    
    # Status and verification
    status = Column(String(50), default='Fully Open')
    status_message = Column(String(100))
    is_verified = Column(Boolean, default=False)
    is_disaster_hub = Column(Boolean, default=False)

    # Publication status (draft, published, archived)
    publication_status = Column(String(20), default='draft', nullable=False)
    
    # Contact info
    website_url = Column(String)
    phone_number = Column(String)
    email = Column(String)
    
    # Social media fields (usernames only)
    instagram_username = Column(String)
    facebook_username = Column(String) 
    x_username = Column(String)
    tiktok_username = Column(String)
    linkedin_username = Column(String)
    other_socials = Column(JSONB)  # {"youtube": "channel", "bluesky": "handle"}
    
    # Listing type for all POIs
    listing_type = Column(String(50), default='free')  # 'free', 'paid', 'paid_founding', 'sponsor', 'community_comped'
    
    # Main category (required)
    # Main category is now handled through poi_categories table with is_main=True
    
    # Cost fields (for Events, Parks, Trails)
    cost = Column(String(100))  # Flexible format: "$1000" or "$0.00-$1000.00" or "0" (shows as Free)
    pricing_details = Column(Text)  # Additional pricing details like "Kids Under 2 are Free"
    ticket_link = Column(String)  # For Events - link to buy tickets
    
    # Parking Information (will be in Location accordion on frontend)
    parking_types = Column(JSONB)  # List of parking types selected
    parking_locations = Column(JSONB)  # [{"lat": 0, "lng": 0, "name": "Main lot"}]
    parking_notes = Column(Text)
    parking_photos = Column(JSONB)  # ["url1", "url2"] max 2
    public_transit_info = Column(Text)
    expect_to_pay_parking = Column(String)  # 'yes', 'no', 'sometimes'
    
    # Additional Info
    downloadable_maps = Column(JSONB)  # [{"name": "Trail Map", "url": "..."}]
    payment_methods = Column(JSONB)  # List of accepted payment methods
    key_facilities = Column(JSONB)  # For Events, Parks, Trails
    alcohol_options = Column(JSONB)  # List of alcohol availability options
    wheelchair_accessible = Column(JSONB)  # List of accessibility options
    wheelchair_details = Column(Text)
    smoking_options = Column(JSONB)  # List of smoking options
    smoking_details = Column(Text)
    wifi_options = Column(JSONB)  # For Events only
    drone_usage = Column(String)  # For Events, Parks, Trails
    drone_policy = Column(Text)
    pet_options = Column(JSONB)  # List of pet policy options
    pet_policy = Column(Text)
    
    # Public Toilets
    public_toilets = Column(JSONB)  # List of toilet options
    toilet_locations = Column(JSONB)  # [{"lat": 0, "lng": 0}]
    toilet_description = Column(Text)  # e.g., "For Paying Customers Only"
    
    # Rentals
    available_for_rent = Column(Boolean, default=False)
    rental_info = Column(Text)
    rental_pricing = Column(Text)
    rental_link = Column(String)
    rental_photos = Column(JSONB)  # List of rental photo URLs (max 10)
    
    # History (for paid listings, parks, trails)
    history_paragraph = Column(Text)
    
    # Featured image
    featured_image = Column(String)  # URL to featured image or logo
    
    # Main contact (internal use - not public)
    main_contact_name = Column(String)
    main_contact_email = Column(String)
    main_contact_phone = Column(String)
    
    # Emergency contact (admin only - disaster response)
    offsite_emergency_contact = Column(Text)  # Admin only field
    emergency_protocols = Column(Text)  # Admin only field
    
    # Ideal For Key Box options (smaller subset)
    ideal_for_key = Column(JSONB)  # List of key ideal_for options
    
    # Additional Business Details
    price_range_per_person = Column(String)  # "$10 and under", "$15 and under", etc.
    pricing = Column(String)  # General pricing text (all POIs)
    discounts = Column(JSONB)  # List of discount types offered
    gift_cards = Column(String)  # 'yes_this_only', 'no', 'yes_select_others'
    youth_amenities = Column(JSONB)  # List of youth amenities (Business only)
    business_amenities = Column(JSONB)  # List of business amenities/services
    entertainment_options = Column(JSONB)  # List of entertainment options
    
    # Menu & Online Booking (Business only)
    menu_photos = Column(JSONB)  # List of menu photo URLs
    menu_link = Column(String)  # Link to online menu
    delivery_links = Column(JSONB)  # List of delivery service links
    reservation_links = Column(JSONB)  # List of reservation links
    appointment_links = Column(JSONB)  # List of appointment scheduling links
    online_ordering_links = Column(JSONB)  # List of online ordering links

    # Gallery
    gallery_photos = Column(JSONB)

    # Business Entry
    business_entry_notes = Column(Text)
    business_entry_photo = Column(String)

    # Hours enhancements
    appointment_booking_url = Column(String)
    hours_but_appointment_required = Column(Boolean, default=False)
    
    # Service Relationships
    service_locations = Column(JSONB)  # POI IDs where this business provides services
    
    # Locally Found & Community
    locally_found_at = Column(JSONB)  # POI IDs where products are sold
    article_links = Column(JSONB)  # Links to articles/blog posts
    community_impact = Column(Text)  # Community involvement description
    organization_memberships = Column(JSONB)  # Organization POI IDs and external links
    
    # Playground Information (All POIs)
    playground_available = Column(Boolean, default=False)
    playground_types = Column(JSONB)  # List of playground types
    playground_surface_types = Column(JSONB)  # List of surface types
    playground_notes = Column(Text)
    playground_photos = Column(JSONB)  # List of photo URLs (max 15)
    playground_location = Column(JSONB)  # {"lat": 0, "lng": 0}
    
    # Parks & Trails Additional Info
    payphone_location = Column(JSONB)  # {"lat": 0, "lng": 0}
    payphone_locations = Column(JSONB)  # [{"lat": 0, "lng": 0, "description": "Near entrance"}] - multiple payphones
    park_entry_notes = Column(Text)  # Park entry description/notes
    park_entry_photo = Column(String)  # URL to park entry photo
    parking_lot_photo = Column(String)  # URL to parking lot photo
    facilities_options = Column(JSONB)  # List of park facilities (separate from key_facilities)
    night_sky_viewing = Column(Text)
    natural_features = Column(JSONB)  # List of natural features
    outdoor_types = Column(JSONB)  # List of outdoor space types
    things_to_do = Column(JSONB)  # List of activities available
    birding_wildlife = Column(Text)
    
    # Hunting & Fishing
    hunting_fishing_allowed = Column(String)  # 'no', 'seasonal', 'year_round'
    hunting_types = Column(JSONB)  # List of hunting types allowed
    fishing_allowed = Column(String)  # 'no', 'catch_release', 'catch_keep', 'other'
    fishing_types = Column(JSONB)  # List of fishing types
    licenses_required = Column(JSONB)  # List of required licenses
    hunting_fishing_info = Column(Text)
    
    # Memberships & Passes
    membership_passes = Column(JSONB)  # POI IDs that share memberships
    membership_details = Column(Text)
    
    # Trail connections
    associated_trails = Column(JSONB)  # POI IDs of connected trails
    camping_lodging = Column(Text)
    
    # JSONB fields for flexible attributes
    photos = Column(JSONB)  # {"featured": "url", "gallery": ["url1", "url2"]}
    hours = Column(JSONB)   # Complex hours structure with multiple periods, seasonal, dawn/dusk
    holiday_hours = Column(JSONB)  # Recurring holiday hours {"christmas": "closed", "thanksgiving": {"open": "10:00", "close": "14:00"}}
    amenities = Column(JSONB)  # {"payment_methods": ["Cash", "Credit Card"]}
    ideal_for = Column(JSONB)  # List of ideal_for options
    contact_info = Column(JSONB)  # {"best": {"name": "Rhonda", ...}, "emergency": {...}}
    compliance = Column(JSONB)  # {"pre_approval_required": true, "lead_time": "5 days"}
    custom_fields = Column(JSONB)  # {"Parking Tip": "Back lot is free after 5 PM."}
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_updated = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    categories = relationship(
        "Category",
        secondary=poi_category_association,
        backref="pois"
    )
    
    # Primary type relationship
    primary_type = relationship("PrimaryType")
    
    # POI-to-POI relationships
    source_relationships = relationship(
        "POIRelationship",
        foreign_keys="POIRelationship.source_poi_id",
        back_populates="source_poi"
    )
    
    target_relationships = relationship(
        "POIRelationship",
        foreign_keys="POIRelationship.target_poi_id",
        back_populates="target_poi"
    )

    # Subtype relationships (one-to-one)
    business = relationship("Business", back_populates="poi", uselist=False, cascade="all, delete-orphan")
    park = relationship("Park", back_populates="poi", uselist=False, cascade="all, delete-orphan")
    trail = relationship("Trail", back_populates="poi", uselist=False, cascade="all, delete-orphan")
    event = relationship("Event", back_populates="poi", uselist=False, cascade="all, delete-orphan")

    # Images relationship
    images = relationship("Image", back_populates="poi", cascade="all, delete-orphan")

    @property
    def poi_type_str(self):
        return self.poi_type.value if isinstance(self.poi_type, enum.Enum) else self.poi_type

    @property
    def main_category(self):
        """Get the main category for this POI (where is_main=True)"""
        from sqlalchemy import and_
        from app.models.category import Category, poi_category_association
        if hasattr(self, '_sa_instance_state') and self._sa_instance_state.session:
            session = self._sa_instance_state.session
            return session.query(Category).join(poi_category_association).filter(
                and_(
                    poi_category_association.c.poi_id == self.id,
                    poi_category_association.c.is_main == True
                )
            ).first()
        return None

    @property
    def secondary_categories(self):
        """Get the secondary categories for this POI (where is_main=False)"""
        from sqlalchemy import and_
        from app.models.category import Category, poi_category_association
        if hasattr(self, '_sa_instance_state') and self._sa_instance_state.session:
            session = self._sa_instance_state.session
            return session.query(Category).join(poi_category_association).filter(
                and_(
                    poi_category_association.c.poi_id == self.id,
                    poi_category_association.c.is_main == False
                )
            ).all()
        return []


class POIRelationship(Base):
    __tablename__ = "poi_relationships"
    
    source_poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    target_poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    relationship_type = Column(String, primary_key=True)  # e.g., "venue", "trail_in_park", "service_provider"
    
    source_poi = relationship("PointOfInterest", foreign_keys=[source_poi_id], back_populates="source_relationships")
    target_poi = relationship("PointOfInterest", foreign_keys=[target_poi_id], back_populates="target_relationships")


class Business(Base):
    __tablename__ = "businesses"
    
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    price_range = Column(String)  # '$', '$$', '$$$', '$$$$'
    
    poi = relationship("PointOfInterest", back_populates="business")


class Park(Base):
    __tablename__ = "parks"
    
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    drone_usage_policy = Column(String)
    
    poi = relationship("PointOfInterest", back_populates="park")


class Trail(Base):
    __tablename__ = "trails"
    
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    length_text = Column(String)  # e.g., "2.5 miles", "1.2 km"
    length_segments = Column(JSONB)  # For multiple loops: [{"name": "Top Loop", "length": "0.25 miles"}]
    difficulty = Column(String)  # 'easy', 'moderate', 'challenging', 'difficult', 'very_difficult', 'extreme'
    difficulty_description = Column(Text)  # Auto-populated based on difficulty
    route_type = Column(String)  # 'loop', 'out_and_back', 'point_to_point', 'connecting_network'
    
    # Trailhead Information
    trailhead_location = Column(JSONB)  # {"lat": 0, "lng": 0}
    trailhead_latitude = Column(Numeric(precision=10, scale=7))  # Separate lat field for trailhead
    trailhead_longitude = Column(Numeric(precision=10, scale=7))  # Separate lng field for trailhead
    trailhead_entrance_photo = Column(String)
    trailhead_photo = Column(String)  # Main trailhead photo
    trailhead_exit_location = Column(JSONB)  # {"lat": 0, "lng": 0}
    trail_exit_latitude = Column(Numeric(precision=10, scale=7))  # Separate lat field for trail exit
    trail_exit_longitude = Column(Numeric(precision=10, scale=7))  # Separate lng field for trail exit
    trailhead_exit_photo = Column(String)
    trail_exit_photo = Column(String)  # Main trail exit photo
    trail_markings = Column(Text)
    trailhead_access_details = Column(Text)
    downloadable_trail_map = Column(String)  # URL to map file
    
    # Trail Surface
    trail_surfaces = Column(JSONB)  # List of surface types
    trail_conditions = Column(JSONB)  # List of condition warnings
    
    # Trail Experience
    trail_experiences = Column(JSONB)  # List of experience types
    
    poi = relationship("PointOfInterest", back_populates="trail")


class Event(Base):
    __tablename__ = "events"
    
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    start_datetime = Column(TIMESTAMP(timezone=True), nullable=False)
    end_datetime = Column(TIMESTAMP(timezone=True))
    # Repeating event fields
    is_repeating = Column(Boolean, default=False)
    repeat_pattern = Column(JSONB)  # {"frequency": "weekly", "days": ["thursday"], "exceptions": []}
    
    # Event-specific fields
    organizer_name = Column(String)
    venue_settings = Column(JSONB)  # List of venue settings: Indoor, Outdoor, Hybrid, Online Only
    event_entry_notes = Column(Text)  # Event entry description/notes
    event_entry_photo = Column(String)  # URL to event entry photo
    food_and_drink_info = Column(Text)
    coat_check_options = Column(JSONB)  # List of coat check options
    
    # Vendor information
    has_vendors = Column(Boolean, default=False)
    vendor_types = Column(JSONB)  # List of vendor types present
    vendor_application_deadline = Column(TIMESTAMP(timezone=True))
    vendor_application_info = Column(Text)
    vendor_fee = Column(String)
    vendor_requirements = Column(Text)
    vendor_poi_links = Column(JSONB)  # List of POI IDs for vendors at this event
    
    poi = relationship("PointOfInterest", back_populates="event")