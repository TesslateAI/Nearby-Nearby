import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Numeric, TIMESTAMP, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry

from app.database import Base
from app.models.category import poi_category_association # Import the association table

# Note: For the MVP, we are focusing on the POI-related models.
# The `users` and `categories` tables from the schema can be implemented here
# in a similar fashion when they are needed.

class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address_line1 = Column(String)
    city = Column(String)
    state_abbr = Column(String(2))
    postal_code = Column(String)
    coordinates = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    
    # NEW: For cases where the map pin should be trusted over the address
    use_coordinates_for_map = Column(Boolean, nullable=False, default=False)
    # NEW: Note for directions at the location
    entry_notes = Column(Text, nullable=True)
    # NEW: URL for a photo of the business entrance
    entrance_photo_url = Column(String, nullable=True)


class PointOfInterest(Base):
    __tablename__ = "points_of_interest"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text) # Unlimited for paid, limited on frontend for free
    poi_type = Column(String, nullable=False) # 'business', 'park', 'trail', 'event'
    status = Column(String, nullable=False, default='Fully Open')
    
    # NEW Fields
    summary = Column(String(200), nullable=True) # 200 char summary for SEO
    status_message = Column(String(80), nullable=True) # Extra details on status
    is_verified = Column(Boolean, nullable=False, default=False)
    featured_image_url = Column(String, nullable=True)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"))
    
    # NEW: For parent-child relationships (e.g., business in a shopping center)
    parent_poi_id = Column(UUID(as_uuid=True), ForeignKey('points_of_interest.id'), nullable=True)

    location = relationship("Location")

    # Relationships to subtypes (one-to-one)
    business = relationship("Business", back_populates="poi", uselist=False, cascade="all, delete-orphan")
    outdoors = relationship("Outdoors", back_populates="poi", uselist=False, cascade="all, delete-orphan")
    
    # FIX: Specify the foreign key to resolve ambiguity.
    # This relationship describes the case where the POI *is* an Event.
    event = relationship(
        "Event",
        back_populates="poi",
        foreign_keys="Event.poi_id",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # For completeness, define the other side of the venue relationship.
    # A POI can be a venue for many events.
    hosted_events = relationship("Event", back_populates="venue", foreign_keys="Event.venue_poi_id")

    # NEW: Relationship for parent POI
    parent = relationship("PointOfInterest", remote_side=[id], backref="children")

    # NEW: Many-to-many relationship with Category
    categories = relationship(
        "Category",
        secondary=poi_category_association,
        backref="pois" # Use backref here for simplicity on the other side
    )


class Business(Base):
    __tablename__ = "businesses"
    
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    price_range = Column(String)
    
    # UPDATED: Listing type for Free, Paid, etc.
    listing_type = Column(String, nullable=False, default='free') # 'free', 'paid', 'paid_founding', 'sponsor'
    
    # NEW: Non-public contact info
    contact_name = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)

    # NEW: Flag for service-based businesses
    is_service_business = Column(Boolean, nullable=False, default=False)
    
    # Existing JSONB field for all other flexible attributes
    amenities = Column(JSONB) # OBSOLETE: Replaced by `attributes` for consistency
    attributes = Column(JSONB)

    poi = relationship("PointOfInterest", back_populates="business")

class Outdoors(Base):
    __tablename__ = "outdoors"

    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    outdoor_specific_type = Column(String) # 'park', 'trail'
    facilities = Column(JSONB)
    trail_length_km = Column(Numeric(6, 2))
    
    poi = relationship("PointOfInterest", back_populates="outdoors")

class Event(Base):
    __tablename__ = "events"

    # Foreign key for when the POI *is* an event
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    start_datetime = Column(TIMESTAMP(timezone=True), nullable=False)
    end_datetime = Column(TIMESTAMP(timezone=True))
    
    # Foreign key for the POI that is the event's *venue*
    venue_poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"))
    
    # FIX: Specify the foreign key to resolve ambiguity.
    poi = relationship(
        "PointOfInterest",
        back_populates="event",
        foreign_keys=[poi_id]
    )

    # For completeness, define the relationship to the venue POI.
    venue = relationship(
        "PointOfInterest",
        back_populates="hosted_events",
        foreign_keys=[venue_poi_id]
    )