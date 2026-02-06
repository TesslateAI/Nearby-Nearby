# app/api/endpoints/community_interest.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from ...database import get_forms_db
from ...models.community_interest import CommunityInterest
from ...schemas.community_interest import CommunityInterestCreate, CommunityInterestResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/community-interest", response_model=CommunityInterestResponse, status_code=201)
@limiter.limit("5/minute")
def submit_community_interest(
    payload: CommunityInterestCreate,
    request: Request,
    db: Session = Depends(get_forms_db),
):
    """Submit a community interest form."""
    entry = CommunityInterest(
        name=payload.name,
        email=payload.email,
        location=payload.location,
        role=payload.role,
        role_other=payload.role_other,
        why=payload.why,
        how_heard=payload.how_heard,
        anything_else=payload.anything_else,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return CommunityInterestResponse(
        id=entry.id,
        location=entry.location,
        created_at=entry.created_at,
    )
