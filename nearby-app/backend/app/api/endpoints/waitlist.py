# app/api/endpoints/waitlist.py
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from slowapi import Limiter
from slowapi.util import get_remote_address
from ...database import get_forms_db
from ...models.waitlist import WaitlistEntry
from ...schemas.waitlist import WaitlistCreate, WaitlistResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/waitlist", response_model=WaitlistResponse, status_code=201)
@limiter.limit("5/minute")
def add_to_waitlist(
    payload: WaitlistCreate,
    request: Request,
    db: Session = Depends(get_forms_db),
):
    """Add an email to the newsletter waitlist."""
    entry = WaitlistEntry(email=payload.email)
    try:
        db.add(entry)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This email address is already on the waitlist.",
        )
    return {"message": "Thank you for subscribing! You're now part of the Nearby Nearby community."}


@router.get("/waitlist/count")
def get_waitlist_count(db: Session = Depends(get_forms_db)):
    """Get the total number of emails in the waitlist."""
    count = db.query(WaitlistEntry).count()
    return {"count": count}
