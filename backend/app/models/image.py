"""Image model for POI image uploads"""

import uuid
import enum
from datetime import datetime
from typing import Dict, Any

from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, Enum, ForeignKey, LargeBinary, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import base64

from app.database import Base


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


# Configuration for each image type
IMAGE_TYPE_CONFIG: Dict[ImageType, Dict[str, Any]] = {
    ImageType.main: {
        "max_count": 1,
        "max_size_mb": 10,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400),
            "large": (800, 800)
        }
    },
    ImageType.gallery: {
        "max_count": 20,
        "max_size_mb": 10,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400),
            "large": (800, 800)
        }
    },
    ImageType.entry: {
        "max_count": 1,
        "max_size_mb": 5,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400)
        }
    },
    ImageType.parking: {
        "max_count": 5,
        "max_size_mb": 5,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400)
        }
    },
    ImageType.restroom: {
        "max_count": 10,
        "max_size_mb": 5,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400)
        }
    },
    ImageType.rental: {
        "max_count": 10,
        "max_size_mb": 5,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400)
        }
    },
    ImageType.playground: {
        "max_count": 10,
        "max_size_mb": 5,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400)
        }
    },
    ImageType.menu: {
        "max_count": 10,
        "max_size_mb": 10,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400),
            "large": (800, 800)
        }
    },
    ImageType.trail_head: {
        "max_count": 1,
        "max_size_mb": 5,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400)
        }
    },
    ImageType.trail_exit: {
        "max_count": 1,
        "max_size_mb": 5,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400)
        }
    },
    ImageType.map: {
        "max_count": 5,
        "max_size_mb": 20,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp"],
        "sizes": {
            "thumbnail": (150, 150),
            "medium": (400, 400),
            "large": (1200, 1200)
        }
    },
    ImageType.downloadable_map: {
        "max_count": 5,
        "max_size_mb": 50,
        "allowed_mimes": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        "sizes": {}  # No resizing for downloadable maps
    }
}


class Image(Base):
    """Image model for storing POI images"""
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id", ondelete="CASCADE"), nullable=False)
    image_type = Column(Enum(ImageType), nullable=False)
    image_context = Column(String(50), nullable=True)  # For contextual grouping (e.g., 'restroom_1', 'parking_2')

    # File information
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    mime_type = Column(String(50), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    # Binary storage fields (modern database-centric approach)
    image_data = Column(LargeBinary, nullable=True)  # Original image binary data
    image_size_variant = Column(String(20), nullable=True)  # 'original', 'thumbnail', 'medium', 'large'
    parent_image_id = Column(UUID(as_uuid=True), ForeignKey("images.id"), nullable=True)  # For size variants
    is_optimized = Column(Boolean, default=False)  # Whether this is an optimized version

    # Cloud storage fields (for future scaling)
    storage_provider = Column(String(50), default='database')  # 'database', 's3', 'cloudflare', etc.
    storage_url = Column(String(500), nullable=True)  # External URL if using cloud storage
    storage_key = Column(String(255), nullable=True)  # Storage key/path for cloud providers

    # Image processing metadata
    quality = Column(Integer, nullable=True)  # JPEG quality, WebP quality
    format_optimized = Column(String(10), nullable=True)  # Target format after optimization
    compression_ratio = Column(Integer, nullable=True)  # Compression ratio achieved

    # Metadata
    alt_text = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    display_order = Column(Integer, nullable=True, default=0)

    # Tracking
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())

    # Relationships
    poi = relationship("PointOfInterest", back_populates="images")
    uploader = relationship("User")

    # Self-referential relationship for size variants
    parent_image = relationship("Image", remote_side=[id], backref="size_variants")

    def __repr__(self):
        return f"<Image(id='{self.id}', poi_id='{self.poi_id}', type='{self.image_type}', filename='{self.filename}')>"

    @property
    def is_pdf(self) -> bool:
        """Check if the image is actually a PDF file"""
        return self.mime_type == "application/pdf"

    @property
    def config(self) -> Dict[str, Any]:
        """Get configuration for this image type"""
        return IMAGE_TYPE_CONFIG.get(self.image_type, {})

    @property
    def data_url(self) -> str:
        """Get data URL for direct embedding (modern approach)"""
        if not self.image_data:
            return None

        b64_data = base64.b64encode(self.image_data).decode('utf-8')
        return f"data:{self.mime_type};base64,{b64_data}"

    @property
    def is_size_variant(self) -> bool:
        """Check if this is a size variant of another image"""
        return self.parent_image_id is not None

    @property
    def is_original(self) -> bool:
        """Check if this is the original image"""
        return self.image_size_variant == 'original' or self.parent_image_id is None

    def get_variant(self, size: str) -> 'Image':
        """Get a specific size variant of this image"""
        if self.is_size_variant:
            # If this is already a variant, look at siblings
            return next((v for v in self.parent_image.size_variants if v.image_size_variant == size), None)
        else:
            # If this is original, look at children
            return next((v for v in self.size_variants if v.image_size_variant == size), None)

    def set_binary_data(self, data: bytes, size_variant: str = 'original'):
        """Set binary image data with metadata"""
        self.image_data = data
        self.size_bytes = len(data)
        self.image_size_variant = size_variant
        self.storage_provider = 'database'

    @classmethod
    def create_variant(cls, parent_image: 'Image', size_variant: str, data: bytes, width: int, height: int, mime_type: str = None) -> 'Image':
        """Create a size variant of an existing image"""
        variant = cls(
            poi_id=parent_image.poi_id,
            image_type=parent_image.image_type,
            image_context=parent_image.image_context,
            filename=f"{size_variant}_{parent_image.filename}",
            original_filename=parent_image.original_filename,
            mime_type=mime_type or parent_image.mime_type,
            width=width,
            height=height,
            parent_image_id=parent_image.id,
            image_size_variant=size_variant,
            is_optimized=True,
            storage_provider='database',
            uploaded_by=parent_image.uploaded_by
        )
        variant.set_binary_data(data, size_variant)
        return variant