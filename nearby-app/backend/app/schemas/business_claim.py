from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class BusinessClaimCreate(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=200)
    contact_name: str = Field(..., min_length=1, max_length=100)
    contact_phone: str = Field(..., min_length=1, max_length=20)
    contact_email: EmailStr = Field(..., max_length=255)
    business_address: str = Field(..., min_length=1, max_length=500)
    how_heard: Optional[str] = Field(None, max_length=500)
    anything_else: Optional[str] = Field(None, max_length=2000)


class BusinessClaimResponse(BaseModel):
    id: UUID
    business_name: str
    created_at: datetime
    message: str = "Thank you! We'll review your claim."

    model_config = {"from_attributes": True}
