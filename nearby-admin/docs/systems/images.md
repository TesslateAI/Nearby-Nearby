# Image Management System

## Overview

The Image Management System handles uploading, processing, storing, and serving images for POIs. It supports multiple image types, automatic variant generation, and S3 storage.

**Important:** S3 is now the **only** storage provider. Database binary storage has been deprecated. Production uses AWS S3; development uses MinIO (S3-compatible).

**Key Files:**
- `nearby-admin/backend/app/models/image.py` - Image model
- `nearby-admin/backend/app/services/image_service.py` - Processing service
- `nearby-admin/backend/app/api/endpoints/images.py` - API endpoints
- `nearby-admin/backend/app/core/s3.py` - S3 client configuration
- `nearby-admin/frontend/src/components/ImageUpload/` - Upload components

---

## Image Types

| Type | Code | Description | Max Size |
|------|------|-------------|----------|
| Main | `main` | Primary POI image | 10MB |
| Gallery | `gallery` | Additional photos | 10MB |
| Entry | `entry` | Entrance photos | 10MB |
| Parking | `parking` | Parking area | 10MB |
| Restroom | `restroom` | Restroom facilities | 10MB |
| Rental | `rental` | Rental equipment | 10MB |
| Playground | `playground` | Playground photos | 10MB |
| Menu | `menu` | Menu images | 10MB |
| Trail Head | `trail_head` | Trailhead photos | 10MB |
| Trail Exit | `trail_exit` | Trail exit photos | 10MB |
| Map | `map` | Map images | 10MB |
| Downloadable Map | `downloadable_map` | PDF maps | 20MB |

### Photo Migration from POI Table

Previously, some photos were stored directly in POI columns (e.g., `parking_photos`, `business_entry_photo`). These have been **migrated to the Images table** using the `image_type` field:

| Old POI Column | New image_type |
|----------------|----------------|
| `parking_photos`, `parking_lot_photo` | `parking` |
| `rental_photos` | `rental` |
| `business_entry_photo`, `park_entry_photo`, `event_entry_photo` | `entry` |
| `playground_photos` | `playground` |
| `trailhead_photo` | `trail_head` |
| `trail_exit_photo` | `trail_exit` |

---

## Data Model

```python
# nearby-admin/backend/app/models/image.py

from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

class Image(Base):
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id"))
    image_type = Column(String, nullable=False)  # main, gallery, parking, etc.
    storage_provider = Column(String, default='s3')  # Always 's3' (database deprecated)
    storage_url = Column(String(500))  # S3 storage URL
    alt_text = Column(String(255))  # Accessibility text
    caption = Column(Text)  # Image caption
    display_order = Column(Integer, default=0)  # Sort order
    width = Column(Integer)  # Image width
    height = Column(Integer)  # Image height
    parent_image_id = Column(UUID(as_uuid=True), ForeignKey("images.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    poi = relationship("PointOfInterest", back_populates="images")
    variants = relationship("Image", backref=backref("parent", remote_side=[id]))
```

**Note:** The `image_data` column (binary storage) and `data_url` property have been deprecated. All images are stored in S3.

---

## Image Variants

When an image is uploaded, the system generates multiple size variants:

| Variant | Max Dimensions | Use Case |
|---------|----------------|----------|
| Original | As uploaded | Full resolution |
| XLarge | 1920x1080 | Hero images |
| Large | 1200x800 | Detail pages |
| Medium | 600x400 | Cards, lists |
| Thumbnail | 200x200 | Grid previews |

```python
# nearby-admin/backend/app/services/image_service.py

VARIANTS = {
    "xlarge": (1920, 1080),
    "large": (1200, 800),
    "medium": (600, 400),
    "thumbnail": (200, 200),
}

def create_variants(image: Image, original_bytes: bytes) -> list[Image]:
    """Generate size variants for an uploaded image."""
    from PIL import Image as PILImage

    original = PILImage.open(BytesIO(original_bytes))
    variants = []

    for variant_name, (max_width, max_height) in VARIANTS.items():
        resized = original.copy()
        resized.thumbnail((max_width, max_height), PILImage.LANCZOS)

        # Save to bytes
        output = BytesIO()
        resized.save(output, format=original.format or 'JPEG', quality=85)

        # Upload to S3
        variant_key = f"{image.poi_id}/{variant_name}_{image.id}.{get_extension(original)}"
        s3_url = upload_to_s3(output.getvalue(), variant_key)

        # Create variant record
        variant = Image(
            poi_id=image.poi_id,
            image_type=image.image_type,
            s3_url=s3_url,
            width=resized.width,
            height=resized.height,
            parent_image_id=image.id
        )
        variants.append(variant)

    return variants
```

---

## S3/MinIO Configuration

```python
# nearby-admin/backend/app/core/s3.py

import boto3
from botocore.config import Config

def get_s3_client():
    """Get S3 client configured for S3 or MinIO."""
    return boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,  # None for real S3
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name=settings.AWS_REGION
    )

def upload_to_s3(file_bytes: bytes, key: str, content_type: str = None) -> str:
    """Upload file to S3 and return URL."""
    client = get_s3_client()
    bucket = settings.AWS_S3_BUCKET

    extra_args = {}
    if content_type:
        extra_args['ContentType'] = content_type

    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=file_bytes,
        **extra_args
    )

    # Return URL
    if settings.AWS_S3_ENDPOINT_URL:
        # MinIO
        return f"{settings.AWS_S3_ENDPOINT_URL}/{bucket}/{key}"
    else:
        # Real S3
        return f"https://{bucket}.s3.amazonaws.com/{key}"

def delete_from_s3(url: str):
    """Delete file from S3 by URL."""
    client = get_s3_client()
    key = extract_key_from_url(url)
    client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
```

---

## Image Service

```python
# nearby-admin/backend/app/services/image_service.py

from PIL import Image as PILImage
from io import BytesIO

ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_PDF_SIZE = 20 * 1024 * 1024  # 20MB for PDFs

def validate_image(file: UploadFile, image_type: str) -> tuple[bool, str]:
    """Validate uploaded image file."""
    # Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        return False, f"Invalid file type: {file.content_type}"

    # Check file size
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    max_size = MAX_PDF_SIZE if file.content_type == 'application/pdf' else MAX_FILE_SIZE
    if size > max_size:
        return False, f"File too large: {size / 1024 / 1024:.1f}MB (max {max_size / 1024 / 1024}MB)"

    return True, ""

def process_image(
    db: Session,
    poi_id: UUID,
    file: UploadFile,
    image_type: str,
    alt_text: str = None,
    caption: str = None
) -> Image:
    """Process and store uploaded image with variants."""

    # Validate
    valid, error = validate_image(file, image_type)
    if not valid:
        raise ValueError(error)

    # Read file
    file_bytes = file.file.read()

    # Get dimensions (skip for PDFs)
    width, height = None, None
    if file.content_type != 'application/pdf':
        img = PILImage.open(BytesIO(file_bytes))
        width, height = img.size

    # Generate S3 key
    extension = file.filename.split('.')[-1]
    key = f"{poi_id}/original_{uuid.uuid4()}.{extension}"

    # Upload original
    s3_url = upload_to_s3(file_bytes, key, file.content_type)

    # Create image record
    image = Image(
        poi_id=poi_id,
        image_type=image_type,
        s3_url=s3_url,
        alt_text=alt_text,
        caption=caption,
        width=width,
        height=height
    )
    db.add(image)
    db.flush()  # Get ID for variants

    # Create variants (skip for PDFs)
    if file.content_type != 'application/pdf':
        variants = create_variants(image, file_bytes)
        for variant in variants:
            db.add(variant)

    db.commit()
    db.refresh(image)
    return image
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/images/upload/{poi_id}` | Upload single image | Yes |
| POST | `/api/images/bulk-upload/{poi_id}` | Upload multiple | Yes |
| GET | `/api/images/{image_id}` | Get image metadata | Public |
| GET | `/api/images/poi/{poi_id}` | Get all POI images | Public |
| GET | `/api/images/poi/{poi_id}/{type}` | Get by type | Public |
| PUT | `/api/images/{image_id}` | Update metadata | Yes |
| DELETE | `/api/images/{image_id}` | Delete image | Yes |
| PUT | `/api/images/reorder` | Reorder images | Yes |

### Upload Endpoint

```python
# nearby-admin/backend/app/api/endpoints/images.py

@router.post("/upload/{poi_id}")
async def upload_image(
    poi_id: UUID,
    file: UploadFile = File(...),
    image_type: str = Form(...),
    alt_text: str = Form(None),
    caption: str = Form(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a single image for a POI."""
    poi = crud_poi.get_poi(db, poi_id)
    if not poi:
        raise HTTPException(404, "POI not found")

    image = process_image(db, poi_id, file, image_type, alt_text, caption)
    return image

@router.post("/bulk-upload/{poi_id}")
async def bulk_upload(
    poi_id: UUID,
    files: list[UploadFile] = File(...),
    image_type: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload multiple images at once."""
    images = []
    for file in files:
        image = process_image(db, poi_id, file, image_type)
        images.append(image)
    return images
```

### Reorder Endpoint

```python
@router.put("/reorder")
async def reorder_images(
    reorder_data: list[ImageReorder],
    db: Session = Depends(get_db)
):
    """Update display order for multiple images."""
    for item in reorder_data:
        image = db.query(Image).filter(Image.id == item.image_id).first()
        if image:
            image.display_order = item.display_order
    db.commit()
    return {"status": "success"}
```

---

## Frontend Components

### Image Upload Field

```jsx
// nearby-admin/frontend/src/components/ImageUpload/ImageUploadField.jsx

function ImageUploadField({ poiId, imageType, images, onUpload, onDelete }) {
  const [uploading, setUploading] = useState(false);

  const handleDrop = async (files) => {
    setUploading(true);
    const formData = new FormData();

    files.forEach(file => formData.append('files', file));
    formData.append('image_type', imageType);

    const response = await fetch(`/api/images/bulk-upload/${poiId}`, {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    const newImages = await response.json();
    onUpload(newImages);
    setUploading(false);
  };

  return (
    <div>
      <Dropzone
        onDrop={handleDrop}
        accept={['image/jpeg', 'image/png', 'image/webp']}
        maxSize={10 * 1024 * 1024}
        loading={uploading}
      >
        <Text>Drag images here or click to upload</Text>
      </Dropzone>

      <SimpleGrid cols={4}>
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            onDelete={() => onDelete(image.id)}
          />
        ))}
      </SimpleGrid>
    </div>
  );
}
```

### Image Card

```jsx
function ImageCard({ image, onDelete, onEdit }) {
  return (
    <Card>
      <Card.Section>
        <img src={image.s3_url} alt={image.alt_text || 'POI image'} />
      </Card.Section>
      <TextInput
        label="Alt Text"
        value={image.alt_text || ''}
        onChange={(e) => onEdit({ alt_text: e.target.value })}
      />
      <Textarea
        label="Caption"
        value={image.caption || ''}
        onChange={(e) => onEdit({ caption: e.target.value })}
      />
      <ActionIcon color="red" onClick={onDelete}>
        <IconTrash />
      </ActionIcon>
    </Card>
  );
}
```

### Drag-and-Drop Reordering

```jsx
// Using @hello-pangea/dnd
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function ReorderableGallery({ images, onReorder }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(images);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Update display_order values
    const updates = reordered.map((img, index) => ({
      image_id: img.id,
      display_order: index
    }));

    onReorder(updates);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="gallery" direction="horizontal">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {images.map((image, index) => (
              <Draggable key={image.id} draggableId={image.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <img src={image.s3_url} alt={image.alt_text} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

---

## Configuration

### Environment Variables

```bash
# S3 Configuration
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=nearby-images
AWS_S3_ENDPOINT_URL=http://minio:9000  # For MinIO, empty for real S3
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
AWS_REGION=us-east-1
```

### MinIO Setup (Development Only)

MinIO is an S3-compatible object storage used **only in development**. Production uses real AWS S3.

```yaml
# docker-compose.yml (development only - NOT in production)
services:
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
```

**Note:** MinIO has been removed from `docker-compose.prod.yml`. Production deployments use real AWS S3.

---

## Best Practices

1. **Validate files** - Check MIME type and size before processing
2. **Generate variants** - Create multiple sizes for different uses
3. **Use CDN** - Serve images through CloudFront or similar
4. **Lazy loading** - Load images as they scroll into view
5. **WebP format** - Convert to WebP for smaller file sizes
6. **Alt text** - Always provide accessibility descriptions
7. **Delete cleanup** - Remove from S3 when deleting records
