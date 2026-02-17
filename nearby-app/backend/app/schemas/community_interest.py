from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

ROLE_OPTIONS = [
    "Resident",
    "Business Owner",
    "Event Organizer",
    "Nonprofit/Community Group",
    "Local Gov/Tourism Rep",
    "Visitor/Traveler",
    "Other",
]


class CommunityInterestCreate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    location: str = Field(..., min_length=1, max_length=200)
    role: Optional[List[str]] = None
    role_other: Optional[str] = Field(None, max_length=100)
    why: Optional[str] = Field(None, max_length=2000)
    how_heard: Optional[str] = Field(None, max_length=500)
    anything_else: Optional[str] = Field(None, max_length=2000)


class CommunityInterestResponse(BaseModel):
    id: UUID
    location: str
    created_at: datetime
    message: str = "Thank you for your interest!"

    model_config = {"from_attributes": True}
