# app/models/image.py
"""Image model for querying POI images (read-only)"""

import uuid
from sqlalchemy import Column, String, Integer, Boolean, Text, TIMESTAMP, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ..database import Base

from shared.models.enums import ImageType


class Image(Base):
    """Image model matching admin's schema for reading POI images"""
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id", ondelete="CASCADE"), nullable=False)
    image_type = Column(Enum(ImageType), nullable=False)
    image_context = Column(String(50), nullable=True)

    # File information
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    mime_type = Column(String(50), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    # S3 storage fields
    image_size_variant = Column(String(20), nullable=True)
    parent_image_id = Column(UUID(as_uuid=True), ForeignKey("images.id"), nullable=True)
    is_optimized = Column(Boolean, default=False)

    # Cloud storage fields
    storage_provider = Column(String(50), default='s3')
    storage_url = Column(String(500), nullable=True)
    storage_key = Column(String(255), nullable=True)

    # Image processing metadata
    quality = Column(Integer, nullable=True)
    format_optimized = Column(String(10), nullable=True)
    compression_ratio = Column(Integer, nullable=True)

    # Metadata
    alt_text = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    display_order = Column(Integer, nullable=True, default=0)

    # Tracking
    uploaded_by = Column(UUID(as_uuid=True), nullable=True)  # No FK — app has no User model
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Image(id='{self.id}', type='{self.image_type}')>"
