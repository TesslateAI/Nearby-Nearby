# app/schemas/suggestion.py
from pydantic import BaseModel
from typing import Optional


class SuggestionCreate(BaseModel):
    name: str
    poi_type: Optional[str] = None
    address_or_description: Optional[str] = None
    submitter_email: Optional[str] = None


class SuggestionResponse(BaseModel):
    message: str
