from typing import List, Optional
from uuid import UUID
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.image import Image, ImageType
from app.models.poi import PointOfInterest
from app.schemas.image import (
    ImageResponse,
    ImageUpdate,
    ImageUploadResponse,
    ImageBulkUploadResponse,
    ImageReorderRequest,
    ImageTypeEnum
)
from app.services.image_service import image_service
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/upload/{poi_id}")
async def upload_image(
    poi_id: UUID,
    image_type: ImageTypeEnum = Form(...),
    file: UploadFile = File(...),
    context: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    display_order: Optional[int] = Form(0),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> ImageUploadResponse:
    """
    Upload a single image for a POI.

    - **poi_id**: UUID of the POI
    - **image_type**: Type of image (main, gallery, entry, parking, etc.)
    - **file**: The image file to upload
    - **context**: Optional context (e.g., 'restroom_1', 'parking_2')
    - **alt_text**: Alternative text for accessibility
    - **caption**: Image caption
    - **display_order**: Order for gallery images
    """
    # Check if POI exists
    poi = db.query(PointOfInterest).filter(PointOfInterest.id == poi_id).first()
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")

    # Convert string enum to model enum
    try:
        image_type_enum = ImageType(image_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid image type: {image_type}")

    # Upload the image
    try:
        db_image = await image_service.upload_image(
            db=db,
            file=file,
            poi_id=poi_id,
            image_type=image_type_enum,
            user_id=None,  # TODO: Implement user lookup by email
            context=context,
            alt_text=alt_text,
            caption=caption,
            display_order=display_order
        )

        # Get URLs for the image
        urls = image_service.get_image_urls(db_image)

        return ImageUploadResponse(
            id=db_image.id,
            filename=db_image.filename,
            url=urls["url"],
            thumbnail_url=urls.get("thumbnail_url"),
            message="Image uploaded successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-multiple/{poi_id}")
async def upload_multiple_images(
    poi_id: UUID,
    image_type: ImageTypeEnum = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> ImageBulkUploadResponse:
    """
    Upload multiple images at once (primarily for galleries).

    - **poi_id**: UUID of the POI
    - **image_type**: Type of images (usually 'gallery')
    - **files**: List of image files to upload
    """
    # Check if POI exists
    poi = db.query(PointOfInterest).filter(PointOfInterest.id == poi_id).first()
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")

    # Convert string enum to model enum
    try:
        image_type_enum = ImageType(image_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid image type: {image_type}")

    uploaded = []
    failed = []

    # Get current count for display order
    current_count = db.query(Image).filter(
        Image.poi_id == poi_id,
        Image.image_type == image_type_enum
    ).count()

    for index, file in enumerate(files):
        try:
            db_image = await image_service.upload_image(
                db=db,
                file=file,
                poi_id=poi_id,
                image_type=image_type_enum,
                user_id=None,  # TODO: Implement user lookup by email
                display_order=current_count + index
            )

            urls = image_service.get_image_urls(db_image)
            uploaded.append(ImageUploadResponse(
                id=db_image.id,
                filename=db_image.filename,
                url=urls["url"],
                thumbnail_url=urls.get("thumbnail_url")
            ))
        except Exception as e:
            failed.append({
                "filename": file.filename,
                "error": str(e)
            })

    message = f"Successfully uploaded {len(uploaded)} images"
    if failed:
        message += f", {len(failed)} failed"

    return ImageBulkUploadResponse(
        uploaded=uploaded,
        failed=failed,
        message=message
    )


@router.get("/poi/{poi_id}")
async def get_poi_images(
    poi_id: UUID,
    image_type: Optional[ImageTypeEnum] = None,
    db: Session = Depends(get_db)
) -> List[ImageResponse]:
    """
    Get all images for a POI, optionally filtered by type.

    - **poi_id**: UUID of the POI
    - **image_type**: Optional filter by image type
    """
    query = db.query(Image).filter(Image.poi_id == poi_id)

    if image_type:
        try:
            image_type_enum = ImageType(image_type)
            query = query.filter(Image.image_type == image_type_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid image type: {image_type}")

    images = query.order_by(Image.display_order, Image.created_at).all()

    # Add URLs to each image response
    response = []
    for image in images:
        urls = image_service.get_image_urls(image)
        image_dict = {
            "id": image.id,
            "poi_id": image.poi_id,
            "image_type": image.image_type,
            "image_context": image.image_context,
            "filename": image.filename,
            "original_filename": image.original_filename,
            "mime_type": image.mime_type,
            "size_bytes": image.size_bytes,
            "width": image.width,
            "height": image.height,
            "alt_text": image.alt_text,
            "caption": image.caption,
            "display_order": image.display_order,
            "uploaded_by": image.uploaded_by,
            "created_at": image.created_at,
            "updated_at": image.updated_at,
            **urls
        }
        response.append(ImageResponse(**image_dict))

    return response


@router.get("/image/{image_id}")
async def get_image(
    image_id: UUID,
    db: Session = Depends(get_db)
) -> ImageResponse:
    """Get details of a specific image."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    urls = image_service.get_image_urls(image)
    image_dict = {
        "id": image.id,
        "poi_id": image.poi_id,
        "image_type": image.image_type,
        "image_context": image.image_context,
        "filename": image.filename,
        "original_filename": image.original_filename,
        "mime_type": image.mime_type,
        "size_bytes": image.size_bytes,
        "width": image.width,
        "height": image.height,
        "alt_text": image.alt_text,
        "caption": image.caption,
        "display_order": image.display_order,
        "uploaded_by": image.uploaded_by,
        "created_at": image.created_at,
        "updated_at": image.updated_at,
        **urls
    }

    return ImageResponse(**image_dict)


@router.put("/image/{image_id}")
async def update_image(
    image_id: UUID,
    update_data: ImageUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> ImageResponse:
    """Update image metadata (alt text, caption, display order)."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Update fields if provided
    if update_data.alt_text is not None:
        image.alt_text = update_data.alt_text
    if update_data.caption is not None:
        image.caption = update_data.caption
    if update_data.display_order is not None:
        image.display_order = update_data.display_order

    db.commit()
    db.refresh(image)

    urls = image_service.get_image_urls(image)
    image_dict = {
        "id": image.id,
        "poi_id": image.poi_id,
        "image_type": image.image_type,
        "image_context": image.image_context,
        "filename": image.filename,
        "original_filename": image.original_filename,
        "mime_type": image.mime_type,
        "size_bytes": image.size_bytes,
        "width": image.width,
        "height": image.height,
        "alt_text": image.alt_text,
        "caption": image.caption,
        "display_order": image.display_order,
        "uploaded_by": image.uploaded_by,
        "created_at": image.created_at,
        "updated_at": image.updated_at,
        **urls
    }

    return ImageResponse(**image_dict)


@router.delete("/image/{image_id}")
async def delete_image(
    image_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> dict:
    """Delete an image and its files."""
    try:
        success = await image_service.delete_image(db, image_id, None)
        if success:
            return {"message": "Image deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/poi/{poi_id}/reorder/{image_type}")
async def reorder_images(
    poi_id: UUID,
    image_type: ImageTypeEnum,
    reorder_request: ImageReorderRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> List[ImageResponse]:
    """
    Reorder images of a specific type for a POI.

    - **poi_id**: UUID of the POI
    - **image_type**: Type of images to reorder
    - **image_ids**: Ordered list of image IDs
    """
    try:
        image_type_enum = ImageType(image_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid image type: {image_type}")

    reordered = await image_service.reorder_images(
        db, poi_id, image_type_enum, reorder_request.image_ids
    )

    # Build response
    response = []
    for image in reordered:
        urls = image_service.get_image_urls(image)
        image_dict = {
            "id": image.id,
            "poi_id": image.poi_id,
            "image_type": image.image_type,
            "image_context": image.image_context,
            "filename": image.filename,
            "original_filename": image.original_filename,
            "mime_type": image.mime_type,
            "size_bytes": image.size_bytes,
            "width": image.width,
            "height": image.height,
            "alt_text": image.alt_text,
            "caption": image.caption,
            "display_order": image.display_order,
            "uploaded_by": image.uploaded_by,
            "created_at": image.created_at,
            "updated_at": image.updated_at,
            **urls
        }
        response.append(ImageResponse(**image_dict))

    return response


@router.get("/serve/{image_id}")
async def serve_image(
    image_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Serve an image with support for both database and S3 storage.

    For S3 storage: redirects to the S3 URL
    For database storage: serves binary data directly
    """
    # Get image from database
    image = image_service.get_image_by_id(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Handle S3 storage - redirect to S3 URL
    if image.storage_provider == "s3" and image.storage_url:
        return RedirectResponse(
            url=image.storage_url,
            status_code=302  # Temporary redirect for better caching
        )

    # Handle database storage - serve binary data
    if not image.image_data:
        raise HTTPException(status_code=404, detail="Image data not found")

    # Return binary response with appropriate headers
    return Response(
        content=image.image_data,
        media_type=image.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"inline; filename={image.filename}",
            "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
            "Content-Length": str(len(image.image_data))
        }
    )