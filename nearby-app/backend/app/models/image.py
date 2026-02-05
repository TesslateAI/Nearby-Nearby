# app/models/image.py
"""Minimal Image model for querying POI images (read-only)"""

import uuid
import enum
from sqlalchemy import Column, String, Integer, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..database import Base


class ImageType(enum.Enum):
    """Enum for different image types"""
    main = "main"
    gallery = "gallery"
    entry = "entry"
    parking = "parking"
    restroom = "restroom"
    rental = "rental"
    playground = "playground"
    menu = "menu"
    trail_head = "trail_head"
    trail_exit = "trail_exit"
    map = "map"
    downloadable_map = "downloadable_map"


class Image(Base):
    """Minimal Image model for reading POI images (S3 URLs only)"""
    __tablename__ = "images"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id", ondelete="CASCADE"), nullable=False)
    image_type = Column(Enum(ImageType), nullable=False)

    # File information
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(50), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    # S3 storage fields
    storage_url = Column(String(500), nullable=True)
    image_size_variant = Column(String(20), nullable=True)
    parent_image_id = Column(UUID(as_uuid=True), ForeignKey("images.id"), nullable=True)

    # Metadata
    alt_text = Column(String(500), nullable=True)
    caption = Column(String(500), nullable=True)
    display_order = Column(Integer, nullable=True, default=0)

    def __repr__(self):
        return f"<Image(id='{self.id}', type='{self.image_type}')>"
