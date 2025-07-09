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
    PARK = "PARK"
    TRAIL = "TRAIL"
    EVENT = "EVENT"

class PointOfInterest(Base):
    __tablename__ = "points_of_interest"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_type = Column(Enum(POIType), nullable=False)
    name = Column(String(255), nullable=False)
    description_long = Column(Text)
    description_short = Column(String(250))
    
    # Address fields
    address_full = Column(String)
    address_street = Column(String)
    address_city = Column(String)
    address_state = Column(String)
    address_zip = Column(String)
    
    # Location (PostGIS)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    
    # Status and verification
    status = Column(String(50), default='Fully Open')
    status_message = Column(String(100))
    is_verified = Column(Boolean, default=False)
    is_disaster_hub = Column(Boolean, default=False)
    
    # Contact info
    website_url = Column(String)
    phone_number = Column(String)
    email = Column(String)
    
    # JSONB fields for flexible attributes
    photos = Column(JSONB)  # {"featured": "url", "gallery": ["url1", "url2"]}
    hours = Column(JSONB)   # {"monday": [{"open": "09:00", "close": "17:00"}], "holidays": [{"date": "2024-12-25", "status": "closed"}]}
    amenities = Column(JSONB)  # {"payment_methods": ["Cash", "Credit Card"], "ideal_for": ["Families"]}
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

    @property
    def poi_type_str(self):
        return self.poi_type.value if isinstance(self.poi_type, enum.Enum) else self.poi_type


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
    listing_tier = Column(String)  # 'free', 'paid', 'paid_founding', 'sponsor'
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
    difficulty = Column(String)  # 'easy', 'moderate', 'difficult', 'expert'
    route_type = Column(String)  # 'loop', 'out_and_back', 'point_to_point'
    
    poi = relationship("PointOfInterest", back_populates="trail")


class Event(Base):
    __tablename__ = "events"
    
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    start_datetime = Column(TIMESTAMP(timezone=True), nullable=False)
    end_datetime = Column(TIMESTAMP(timezone=True))
    cost_text = Column(String)  # e.g., "Free", "$15", "Donation suggested"
    
    poi = relationship("PointOfInterest", back_populates="event")