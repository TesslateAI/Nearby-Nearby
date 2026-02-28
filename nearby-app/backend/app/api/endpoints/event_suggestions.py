# app/api/endpoints/event_suggestions.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from ...database import get_forms_db
from ...models.event_suggestion import EventSuggestion
from ...schemas.event_suggestion import EventSuggestionCreate, EventSuggestionResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/event-suggestions", response_model=EventSuggestionResponse, status_code=201)
@limiter.limit("5/minute")
def suggest_event(
    payload: EventSuggestionCreate,
    request: Request,
    db: Session = Depends(get_forms_db),
):
    """Submit a suggestion for a new event."""
    entry = EventSuggestion(
        event_name=payload.event_name,
        event_description=payload.event_description,
        event_date=payload.event_date,
        event_location=payload.event_location,
        organizer_name=payload.organizer_name,
        organizer_email=payload.organizer_email,
        organizer_phone=payload.organizer_phone,
        additional_info=payload.additional_info,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Send ntfy.sh notification (best effort)
    try:
        import httpx
        httpx.post(
            "https://ntfy.sh/nearbynearbyadmin",
            data=f"New event suggestion: {payload.event_name} from {payload.organizer_email}",
            headers={"Title": "New Event Suggestion"},
            timeout=5.0,
        )
    except Exception:
        pass  # Don't fail the request if notification fails

    return EventSuggestionResponse(id=entry.id, created_at=entry.created_at)
