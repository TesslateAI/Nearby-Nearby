# app/api/endpoints/waitlist.py
from fastapi import APIRouter, HTTPException
from ... import schemas
from ...waitlist_db import add_email, email_exists, get_all_emails, get_count

router = APIRouter()

@router.post("/waitlist", response_model=schemas.waitlist.WaitlistResponse, status_code=201)
def add_to_waitlist(waitlist_in: schemas.waitlist.WaitlistCreate):
    """Add an email to the waitlist (stored in SQLite3 database)."""
    # Check if email already exists
    if email_exists(waitlist_in.email):
        raise HTTPException(
            status_code=409,
            detail="This email address is already on the waitlist."
        )

    # Add email to SQLite database
    success = add_email(waitlist_in.email)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to add email to waitlist. Please try again."
        )

    return {"message": "Thank you for subscribing! You're now part of the Nearby Nearby community."}


@router.get("/waitlist/count")
def get_waitlist_count():
    """Get the total number of emails in the waitlist."""
    return {"count": get_count()}


@router.get("/waitlist/all")
def get_all_waitlist_emails():
    """Get all emails from the waitlist (admin endpoint)."""
    return {"emails": get_all_emails()}