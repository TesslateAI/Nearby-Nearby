# app/api/endpoints/contact.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from ...database import get_forms_db
from ...models.contact import ContactSubmission
from ...schemas.contact import ContactCreate, ContactResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/contact", response_model=ContactResponse, status_code=201)
@limiter.limit("5/minute")
def submit_contact(
    payload: ContactCreate,
    request: Request,
    db: Session = Depends(get_forms_db),
):
    """Submit a contact form."""
    entry = ContactSubmission(
        name=payload.name,
        email=payload.email,
        message=payload.message,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return ContactResponse(id=entry.id, created_at=entry.created_at)
