import uuid
from sqlalchemy import Column, String, ForeignKey, Table, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.database import Base

# Association Table for the many-to-many relationship between POIs and Categories
poi_category_association = Table('poi_category_association', Base.metadata,
    Column('poi_id', UUID(as_uuid=True), ForeignKey('points_of_interest.id'), primary_key=True),
    Column('category_id', UUID(as_uuid=True), ForeignKey('categories.id'), primary_key=True)
)

class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    
    # For self-referencing hierarchy (subcategories)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    
    # Relationship to parent category
    parent = relationship("Category", remote_side=[id], backref="children")

    # This relationship is defined in the PointOfInterest model via back_populates
    # pois = relationship("PointOfInterest", secondary=poi_category_association, back_populates="categories")

    applicable_to = Column(ARRAY(String))  # Array of POI types this category applies to
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    is_main_category = Column(Boolean, default=False)  # Whether this can be selected as a main category
