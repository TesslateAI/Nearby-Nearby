# app/schemas/waitlist.py
from pydantic import BaseModel, EmailStr

class WaitlistCreate(BaseModel):
    email: EmailStr

class WaitlistResponse(BaseModel):
    message: str