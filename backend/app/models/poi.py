import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Numeric, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.database import Base

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

class PointOfInterest(Base):
    __tablename__ = "points_of_interest"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text)
    poi_type = Column(String, nullable=False) # 'business', 'park', 'trail', 'event'
    status = Column(String, nullable=False, default='active')
    
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"))
    
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


class Business(Base):
    __tablename__ = "businesses"
    
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"), primary_key=True)
    price_range = Column(String)
    amenities = Column(JSONB)

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