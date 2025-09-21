import io
import uuid
import os
from typing import Optional, List, Dict, Any
from PIL import Image as PILImage
from fastapi import UploadFile, HTTPException
import base64
from sqlalchemy.orm import Session
import logging

from app.models.image import Image, ImageType, IMAGE_TYPE_CONFIG
from app.database import SessionLocal
from app.core.s3 import s3_config, s3_client

logger = logging.getLogger(__name__)


class ImageService:
    """Modern image service with support for database and S3 storage"""

    def __init__(self):
        # Storage configuration
        self.storage_provider = os.getenv("STORAGE_PROVIDER", "database").lower()
        self.max_file_size = 50 * 1024 * 1024  # 50MB default
        self.supported_formats = {"JPEG", "PNG", "WEBP"}
        self.default_quality = 85  # Default compression quality

        # Size configurations for variants
        self.size_configs = {
            "thumbnail": (150, 150),
            "medium": (400, 400),
            "large": (800, 800),
            "xlarge": (1200, 1200)
        }

        # Initialize S3 if configured
        self.use_s3 = self.storage_provider == "s3" and s3_config.is_configured
        if self.use_s3:
            logger.info("ImageService initialized with S3 storage")
        else:
            logger.info("ImageService initialized with database storage")

    async def validate_and_process_upload(
        self,
        file: UploadFile,
        image_type: ImageType
    ) -> Dict[str, Any]:
        """Validate and process image upload with modern approach"""
        config = IMAGE_TYPE_CONFIG.get(image_type)
        if not config:
            raise HTTPException(status_code=400, detail=f"Invalid image type: {image_type}")

        # Read file content
        content = await file.read()
        file_size = len(content)
        await file.seek(0)

        # Validate file size
        max_size = config["max_size_mb"] * 1024 * 1024
        if file_size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {config['max_size_mb']}MB"
            )

        # Validate MIME type
        if file.content_type not in config["allowed_mimes"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(config['allowed_mimes'])}"
            )

        # Process image with PIL for validation and metadata extraction
        try:
            img = PILImage.open(io.BytesIO(content))
            img.verify()  # Verify it's a valid image

            # Re-open for processing (verify() closes the image)
            img = PILImage.open(io.BytesIO(content))

            return {
                "content": content,
                "width": img.width,
                "height": img.height,
                "format": img.format,
                "mode": img.mode,
                "size_bytes": file_size,
                "mime_type": file.content_type
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    async def check_image_count(
        self,
        db: Session,
        poi_id: uuid.UUID,
        image_type: ImageType,
        context: Optional[str] = None
    ) -> None:
        """Check if adding an image would exceed the maximum count"""
        config = IMAGE_TYPE_CONFIG.get(image_type)
        max_count = config["max_count"]

        # Count existing images (only original images, not variants)
        query = db.query(Image).filter(
            Image.poi_id == poi_id,
            Image.image_type == image_type,
            Image.parent_image_id.is_(None)  # Only count original images
        )
        if context:
            query = query.filter(Image.image_context == context)

        current_count = query.count()

        if current_count >= max_count:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {max_count} images allowed for type {image_type.value}"
            )

    def generate_filename(self, original_filename: str) -> str:
        """Generate a unique filename for storage"""
        import pathlib
        ext = pathlib.Path(original_filename).suffix.lower()
        if not ext:
            ext = ".jpg"  # Default extension
        return f"{uuid.uuid4()}{ext}"

    def generate_s3_key(self, poi_id: uuid.UUID, image_type: ImageType, filename: str, size_variant: str = "original") -> str:
        """Generate S3 key for organized storage"""
        base_path = f"images/{poi_id}/{image_type.value}"
        if size_variant != "original":
            return f"{base_path}/{size_variant}/{filename}"
        return f"{base_path}/{filename}"

    def create_size_variants(self, original_data: bytes, mime_type: str) -> Dict[str, Dict[str, Any]]:
        """Create multiple size variants of an image"""
        variants = {}

        try:
            img = PILImage.open(io.BytesIO(original_data))
            original_format = img.format or "JPEG"

            # Store original
            variants["original"] = {
                "data": original_data,
                "width": img.width,
                "height": img.height,
                "mime_type": mime_type
            }

            # Create size variants
            for size_name, (max_width, max_height) in self.size_configs.items():
                # Skip if original is smaller than target size
                if img.width <= max_width and img.height <= max_height:
                    continue

                # Calculate new dimensions maintaining aspect ratio
                ratio = min(max_width / img.width, max_height / img.height)
                new_width = int(img.width * ratio)
                new_height = int(img.height * ratio)

                # Resize image
                resized_img = img.resize((new_width, new_height), PILImage.Resampling.LANCZOS)

                # Convert to bytes
                output = io.BytesIO()

                # Optimize format and quality
                if original_format in ["JPEG", "JPG"]:
                    resized_img.save(output, format="JPEG", quality=self.default_quality, optimize=True)
                    variant_mime = "image/jpeg"
                elif original_format == "PNG":
                    resized_img.save(output, format="PNG", optimize=True)
                    variant_mime = "image/png"
                elif original_format == "WEBP":
                    resized_img.save(output, format="WEBP", quality=self.default_quality, optimize=True)
                    variant_mime = "image/webp"
                else:
                    resized_img.save(output, format="JPEG", quality=self.default_quality, optimize=True)
                    variant_mime = "image/jpeg"

                variants[size_name] = {
                    "data": output.getvalue(),
                    "width": new_width,
                    "height": new_height,
                    "mime_type": variant_mime
                }

            return variants

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating image variants: {str(e)}")

    async def upload_image(
        self,
        db: Session,
        file: UploadFile,
        poi_id: uuid.UUID,
        image_type: ImageType,
        user_id: Optional[uuid.UUID] = None,
        context: Optional[str] = None,
        alt_text: Optional[str] = None,
        caption: Optional[str] = None,
        display_order: int = 0
    ) -> Image:
        """Upload and store image with support for both database and S3 storage"""

        # Validate file and extract metadata
        file_data = await self.validate_and_process_upload(file, image_type)

        # Check image count limits
        await self.check_image_count(db, poi_id, image_type, context)

        # Generate unique filename
        filename = self.generate_filename(file.filename or "upload.jpg")

        # Create size variants
        variants = self.create_size_variants(file_data["content"], file_data["mime_type"])

        if self.use_s3:
            # S3 STORAGE PATH
            return await self._upload_to_s3(
                db, poi_id, image_type, filename, file_data, variants,
                user_id, context, alt_text, caption, display_order, file.filename
            )
        else:
            # DATABASE STORAGE PATH
            return await self._upload_to_database(
                db, poi_id, image_type, filename, file_data, variants,
                user_id, context, alt_text, caption, display_order, file.filename
            )

    async def _upload_to_s3(
        self,
        db: Session,
        poi_id: uuid.UUID,
        image_type: ImageType,
        filename: str,
        file_data: Dict[str, Any],
        variants: Dict[str, Dict[str, Any]],
        user_id: Optional[uuid.UUID],
        context: Optional[str],
        alt_text: Optional[str],
        caption: Optional[str],
        display_order: int,
        original_filename: Optional[str]
    ) -> Image:
        """Upload image and variants to S3"""

        if not s3_client:
            raise HTTPException(status_code=500, detail="S3 not configured properly")

        try:
            # Upload original to S3
            original_s3_key = self.generate_s3_key(poi_id, image_type, filename, "original")
            original_url = await s3_client.upload_file(
                file_data["content"],
                original_s3_key,
                file_data["mime_type"],
                metadata={
                    "poi_id": str(poi_id),
                    "image_type": image_type.value,
                    "size_variant": "original"
                }
            )

            # Create original image record
            original_image = Image(
                poi_id=poi_id,
                image_type=image_type,
                image_context=context,
                filename=filename,
                original_filename=original_filename,
                mime_type=file_data["mime_type"],
                width=file_data["width"],
                height=file_data["height"],
                alt_text=alt_text,
                caption=caption,
                display_order=display_order,
                uploaded_by=user_id,
                image_size_variant="original",
                storage_provider="s3",
                storage_url=original_url,
                storage_key=original_s3_key,
                size_bytes=file_data["size_bytes"]
            )

            # Save original to database
            db.add(original_image)
            db.flush()  # Get the ID

            # Upload and save size variants
            for size_name, variant_data in variants.items():
                if size_name == "original":
                    continue  # Already saved

                # Upload variant to S3
                variant_s3_key = self.generate_s3_key(poi_id, image_type, filename, size_name)
                variant_url = await s3_client.upload_file(
                    variant_data["data"],
                    variant_s3_key,
                    variant_data["mime_type"],
                    metadata={
                        "poi_id": str(poi_id),
                        "image_type": image_type.value,
                        "size_variant": size_name,
                        "parent_image_id": str(original_image.id)
                    }
                )

                # Create variant record
                variant_image = Image(
                    poi_id=poi_id,
                    image_type=image_type,
                    image_context=context,
                    filename=f"{size_name}_{filename}",
                    original_filename=original_filename,
                    mime_type=variant_data["mime_type"],
                    width=variant_data["width"],
                    height=variant_data["height"],
                    parent_image_id=original_image.id,
                    image_size_variant=size_name,
                    is_optimized=True,
                    storage_provider="s3",
                    storage_url=variant_url,
                    storage_key=variant_s3_key,
                    size_bytes=len(variant_data["data"]),
                    uploaded_by=user_id
                )
                db.add(variant_image)

            db.commit()
            db.refresh(original_image)

            logger.info(f"Successfully uploaded image to S3: {original_s3_key}")
            return original_image

        except Exception as e:
            db.rollback()
            logger.error(f"S3 upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")

    async def _upload_to_database(
        self,
        db: Session,
        poi_id: uuid.UUID,
        image_type: ImageType,
        filename: str,
        file_data: Dict[str, Any],
        variants: Dict[str, Dict[str, Any]],
        user_id: Optional[uuid.UUID],
        context: Optional[str],
        alt_text: Optional[str],
        caption: Optional[str],
        display_order: int,
        original_filename: Optional[str]
    ) -> Image:
        """Upload image and variants to database (original implementation)"""

        # Create original image record
        original_image = Image(
            poi_id=poi_id,
            image_type=image_type,
            image_context=context,
            filename=filename,
            original_filename=original_filename,
            mime_type=file_data["mime_type"],
            width=file_data["width"],
            height=file_data["height"],
            alt_text=alt_text,
            caption=caption,
            display_order=display_order,
            uploaded_by=user_id,
            image_size_variant="original",
            storage_provider="database"
        )

        # Set binary data for original
        original_image.set_binary_data(file_data["content"], "original")

        # Save original to database
        db.add(original_image)
        db.flush()  # Get the ID

        # Create and save size variants
        for size_name, variant_data in variants.items():
            if size_name == "original":
                continue  # Already saved

            variant_image = Image.create_variant(
                parent_image=original_image,
                size_variant=size_name,
                data=variant_data["data"],
                width=variant_data["width"],
                height=variant_data["height"],
                mime_type=variant_data["mime_type"]
            )
            db.add(variant_image)

        db.commit()
        db.refresh(original_image)

        return original_image

    def get_image_urls(self, image: Image) -> Dict[str, str]:
        """Get URLs for image serving (supports both database and S3)"""
        urls = {}

        # For original image
        if image.storage_provider == "s3" and image.storage_url:
            # S3 storage - use direct URLs
            urls["url"] = image.storage_url
            if s3_config.cloudfront_domain:
                # Use CloudFront URL if configured
                urls["cdn_url"] = image.storage_url
        elif image.image_data:
            # Database storage - use serve endpoint
            urls["url"] = f"/api/images/serve/{image.id}"
            urls["data_url"] = image.data_url
        else:
            # Fallback for test images without binary data
            urls["url"] = f"/api/images/serve/{image.id}"

        # Initialize variant URLs with None if they don't exist
        for size_name in ["thumbnail", "medium", "large"]:
            urls[f"{size_name}_url"] = None

        # For size variants
        if image.size_variants:
            for variant in image.size_variants:
                size_name = variant.image_size_variant

                if variant.storage_provider == "s3" and variant.storage_url:
                    # S3 storage
                    urls[f"{size_name}_url"] = variant.storage_url
                    if s3_config.cloudfront_domain:
                        urls[f"{size_name}_cdn_url"] = variant.storage_url
                elif variant.image_data:
                    # Database storage
                    urls[f"{size_name}_url"] = f"/api/images/serve/{variant.id}"
                    urls[f"{size_name}_data_url"] = variant.data_url

        return urls

    async def delete_image(self, db: Session, image_id: uuid.UUID, user_id: Optional[uuid.UUID] = None) -> bool:
        """Delete image and all its variants from both storage and database"""
        image = db.query(Image).filter(Image.id == image_id).first()
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        try:
            # Delete all size variants first
            if image.size_variants:
                for variant in image.size_variants:
                    # Delete from S3 if stored there
                    if variant.storage_provider == "s3" and variant.storage_key and s3_client:
                        await s3_client.delete_file(variant.storage_key)

                    # Delete from database
                    db.delete(variant)

            # Delete the original image from S3 if stored there
            if image.storage_provider == "s3" and image.storage_key and s3_client:
                await s3_client.delete_file(image.storage_key)

            # Delete the original image from database
            db.delete(image)
            db.commit()

            logger.info(f"Successfully deleted image {image_id} from {image.storage_provider}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete image {image_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to delete image: {str(e)}")

    async def reorder_images(
        self,
        db: Session,
        poi_id: uuid.UUID,
        image_type: ImageType,
        image_ids: List[uuid.UUID]
    ) -> List[Image]:
        """Reorder images by updating display_order"""
        images = db.query(Image).filter(
            Image.poi_id == poi_id,
            Image.image_type == image_type,
            Image.parent_image_id.is_(None)  # Only reorder original images, not variants
        ).all()

        # Create mapping of ID to image
        image_map = {img.id: img for img in images}

        # Update display order based on provided order
        for index, image_id in enumerate(image_ids):
            if image_id in image_map:
                image_map[image_id].display_order = index

        db.commit()

        # Return images in new order
        return [image_map[img_id] for img_id in image_ids if img_id in image_map]

    def get_image_by_id(self, db: Session, image_id: uuid.UUID) -> Optional[Image]:
        """Get image by ID"""
        return db.query(Image).filter(Image.id == image_id).first()


# Create singleton instance
image_service = ImageService()