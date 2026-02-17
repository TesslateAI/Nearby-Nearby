from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(..., max_length=255)
    message: str = Field(..., min_length=10, max_length=5000)


class ContactResponse(BaseModel):
    id: UUID
    created_at: datetime
    message: str = "Thank you for reaching out!"

    model_config = {"from_attributes": True}
