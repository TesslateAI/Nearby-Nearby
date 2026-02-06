# app/api/endpoints/suggestions.py
from fastapi import APIRouter
from ... import schemas
from ...suggestions_db import add_suggestion, get_count

router = APIRouter()


@router.post("/suggestions", response_model=schemas.suggestion.SuggestionResponse, status_code=201)
def submit_suggestion(suggestion: schemas.suggestion.SuggestionCreate):
    """Submit a place suggestion (stored in SQLite)."""
    add_suggestion(
        name=suggestion.name,
        poi_type=suggestion.poi_type,
        address_or_description=suggestion.address_or_description,
        submitter_email=suggestion.submitter_email,
    )
    return {"message": "Thank you! Your suggestion has been received. We'll review it soon."}


@router.get("/suggestions/count")
def get_suggestions_count():
    """Get the total number of place suggestions."""
    return {"count": get_count()}
