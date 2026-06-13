from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class EventSuggestionCreate(BaseModel):
    event_name: str = Field(..., min_length=1, max_length=255)
    event_description: Optional[str] = None
    event_date: Optional[str] = Field(None, max_length=100)
    event_location: Optional[str] = Field(None, max_length=255)
    organizer_name: Optional[str] = Field(None, max_length=100)
    organizer_email: EmailStr = Field(..., max_length=255)
    organizer_phone: Optional[str] = Field(None, max_length=50)
    additional_info: Optional[str] = None


class EventSuggestionResponse(BaseModel):
    id: UUID
    created_at: datetime
    message: str = "Thank you for suggesting an event!"

    model_config = {"from_attributes": True}
