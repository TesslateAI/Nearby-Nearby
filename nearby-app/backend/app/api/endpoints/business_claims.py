# app/api/endpoints/business_claims.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from ...database import get_forms_db
from ...models.business_claim import BusinessClaim
from ...schemas.business_claim import BusinessClaimCreate, BusinessClaimResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/business-claims", response_model=BusinessClaimResponse, status_code=201)
@limiter.limit("5/minute")
def submit_business_claim(
    payload: BusinessClaimCreate,
    request: Request,
    db: Session = Depends(get_forms_db),
):
    """Submit a business claim request."""
    entry = BusinessClaim(
        business_name=payload.business_name,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        business_address=payload.business_address,
        how_heard=payload.how_heard,
        anything_else=payload.anything_else,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return BusinessClaimResponse(
        id=entry.id,
        business_name=entry.business_name,
        created_at=entry.created_at,
    )
