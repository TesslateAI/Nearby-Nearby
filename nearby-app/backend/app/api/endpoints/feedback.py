# app/api/endpoints/feedback.py
import uuid
from fastapi import APIRouter, Depends, Request, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from slowapi import Limiter
from slowapi.util import get_remote_address
from ...database import get_forms_db
from ...models.feedback import FeedbackSubmission
from ...schemas.feedback import FeedbackResponse
from ...core.s3 import s3_client

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_FILES = 10


@router.post("/feedback", response_model=FeedbackResponse, status_code=201)
@limiter.limit("2/minute")
async def submit_feedback(
    request: Request,
    feedback: str = Form(..., min_length=10, max_length=5000),
    email: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_forms_db),
):
    """Submit feedback, optionally with screenshot uploads."""
    # Validate email if provided
    if email:
        if len(email) > 255:
            raise HTTPException(status_code=422, detail="Email too long.")
        if "@" not in email or "." not in email.split("@")[-1]:
            raise HTTPException(status_code=422, detail="Invalid email address.")

    # Validate files
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=422,
            detail=f"Maximum {MAX_FILES} files allowed.",
        )

    file_urls: List[str] = []
    submission_id = str(uuid.uuid4())

    for f in files:
        if f.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"File '{f.filename}' has unsupported type '{f.content_type}'. Only images allowed.",
            )
        data = await f.read()
        if len(data) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=422,
                detail=f"File '{f.filename}' exceeds 10 MB limit.",
            )

        if s3_client:
            key = f"feedback/{submission_id}/{f.filename}"
            url = await s3_client.upload_file(data, key, f.content_type)
            file_urls.append(url)

    entry = FeedbackSubmission(
        email=email or None,
        feedback=feedback,
        file_urls=file_urls or None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return FeedbackResponse(
        id=entry.id,
        file_urls=entry.file_urls,
        created_at=entry.created_at,
    )
