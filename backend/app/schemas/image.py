from typing import Optional, List
from pydantic import BaseModel, Field, validator
from datetime import datetime
from uuid import UUID
from enum import Enum


class ImageTypeEnum(str, Enum):
    """Types of images that can be uploaded"""
    MAIN = "main"
    GALLERY = "gallery"
    ENTRY = "entry"
    PARKING = "parking"
    RESTROOM = "restroom"
    RENTAL = "rental"
    PLAYGROUND = "playground"
    MENU = "menu"
    TRAIL_HEAD = "trail_head"
    TRAIL_EXIT = "trail_exit"
    MAP = "map"
    DOWNLOADABLE_MAP = "downloadable_map"


class ImageBase(BaseModel):
    """Base image schema"""
    image_type: ImageTypeEnum
    image_context: Optional[str] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    display_order: Optional[int] = 0


class ImageCreate(ImageBase):
    """Schema for creating an image (metadata only, file handled separately)"""
    pass


class ImageUpdate(BaseModel):
    """Schema for updating image metadata"""
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    display_order: Optional[int] = None


class ImageResponse(ImageBase):
    """Schema for image response"""
    id: UUID
    poi_id: UUID
    filename: str
    original_filename: Optional[str]
    mime_type: Optional[str]
    size_bytes: Optional[int]
    width: Optional[int]
    height: Optional[int]
    uploaded_by: Optional[UUID]
    created_at: datetime
    updated_at: Optional[datetime]

    # Computed URLs
    url: str
    thumbnail_url: Optional[str] = None
    medium_url: Optional[str] = None
    large_url: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True


class ImageUploadResponse(BaseModel):
    """Response after successful image upload"""
    id: UUID
    filename: str
    url: str
    thumbnail_url: Optional[str]
    message: str = "Image uploaded successfully"


class ImageBulkUploadResponse(BaseModel):
    """Response for bulk image uploads"""
    uploaded: List[ImageUploadResponse]
    failed: List[dict] = []
    message: str


class ImageReorderRequest(BaseModel):
    """Request to reorder images"""
    image_ids: List[UUID]


class ImageTypeConfig(BaseModel):
    """Configuration for each image type"""
    max_count: int
    max_size_mb: float
    allowed_mimes: List[str]
    sizes: dict