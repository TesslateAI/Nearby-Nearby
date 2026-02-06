from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class FeedbackCreate(BaseModel):
    email: Optional[EmailStr] = Field(None, max_length=255)
    feedback: str = Field(..., min_length=10, max_length=5000)


class FeedbackResponse(BaseModel):
    id: UUID
    file_urls: Optional[List[str]] = None
    created_at: datetime
    message: str = "Thank you for your feedback!"

    model_config = {"from_attributes": True}
