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
- `shared/constants/field_options.py` - `IMAGE_FUNCTION_TAGS` list (predefined function tags)

---

## Image Types

| Type | Code | Description | Max Count | Max Size |
|------|------|-------------|-----------|----------|
| Main | `main` | Primary POI image | 1 | 10MB |
| Gallery | `gallery` | Additional photos | 20 | 10MB |
| Entry | `entry` | Entrance photos | 3 | 5MB |
| Parking | `parking` | Parking area (per-lot via context) | 5 | 5MB |
| Restroom | `restroom` | Restroom facilities | 10 | 5MB |
| Rental | `rental` | Rental equipment | 10 | 5MB |
| Playground | `playground` | Playground photos (per-playground via context) | 10 | 5MB |
| Menu | `menu` | Menu images | 10 | 10MB |
| Trail Head | `trail_head` | Trailhead photos (was 1, now 10) | 10 | 5MB |
| Trail Exit | `trail_exit` | Trail exit photos (was 1, now 10) | 10 | 5MB |
| Map | `map` | Map images | 5 | 20MB |
| Downloadable Map | `downloadable_map` | PDF maps | 5 | 50MB |

### Image Context Grouping

The `image_context` field on the Image model enables per-item photo association within a POI:

| Context Pattern | Usage |
|-----------------|-------|
| `parking_1`, `parking_2`, ... | Photos for individual parking lots (matched by lot index) |
| `playground_1`, `playground_2`, ... | Photos for individual playgrounds (matched by playground index) |

This allows the frontend to upload and display photos specific to each parking lot or playground rather than sharing a single pool of photos for the POI.

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

## Function Tags

Images can be tagged with one or more **function tags** describing the purpose or content of the photo. This enables fine-grained filtering beyond `image_type` -- for example, distinguishing a "storefront" photo from an "interior" photo even when both are `gallery` type.

### How It Works

- The `function_tags` column is a **JSONB array of strings** on the `images` table.
- Tags can be set during upload (as a JSON-encoded Form field) or updated afterwards via `PUT /api/images/image/{image_id}`.
- Images can be filtered by tag using the `function_tag` query parameter on `GET /api/images/poi/{poi_id}`.

### Predefined Tags

20 predefined tags are defined in `shared/constants/field_options.py` (`IMAGE_FUNCTION_TAGS`):

| Tag | Description |
|-----|-------------|
| `storefront` | Exterior storefront view |
| `entrance` | Building or area entrance |
| `interior` | Indoor space |
| `exterior` | Outdoor/external view |
| `signage` | Signs, wayfinding |
| `parking` | Parking area |
| `restrooms` | Restroom facilities |
| `playground` | Playground equipment |
| `aerial` | Aerial/drone shot |
| `food_drink` | Food or beverage items |
| `menu` | Menu boards or sheets |
| `staff` | Staff or team photos |
| `product` | Products or merchandise |
| `trail_marker` | Trail marker or blaze |
| `scenic` | Scenic vista or landscape |
| `map` | Map or wayfinding diagram |
| `floorplan` | Floor plan layout |
| `event_setup` | Event setup or configuration |
| `stage` | Stage or performance area |
| `vendor_area` | Vendor booths or area |

### Schema

```python
# ImageUpdate schema (Pydantic) -- allows updating tags via PUT
class ImageUpdate(BaseModel):
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    display_order: Optional[int] = None
    function_tags: Optional[List[str]] = None  # e.g. ["storefront", "entrance"]
```

### Migration

Migration `d4e5f6g7h8i9` adds the `function_tags` JSONB column to the `images` table.

---

## Data Model

```python
# nearby-admin/backend/app/models/image.py

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

class Image(Base):
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id = Column(UUID(as_uuid=True), ForeignKey("points_of_interest.id", ondelete="CASCADE"))
    image_type = Column(Enum(ImageType), nullable=False)  # main, gallery, parking, etc.
    image_context = Column(String(50), nullable=True)  # e.g. 'restroom_1', 'parking_2'

    # File information
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    mime_type = Column(String(50), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    # Size variant fields
    image_size_variant = Column(String(20), nullable=True)  # 'original', 'thumbnail', 'medium', 'large'
    parent_image_id = Column(UUID(as_uuid=True), ForeignKey("images.id"), nullable=True)
    is_optimized = Column(Boolean, default=False)

    # Cloud storage fields (S3/MinIO)
    storage_provider = Column(String(50), default='s3')
    storage_url = Column(String(500), nullable=True)
    storage_key = Column(String(255), nullable=True)

    # Metadata
    alt_text = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    display_order = Column(Integer, nullable=True, default=0)
    function_tags = Column(JSONB, nullable=True)  # ["storefront", "entrance", "interior"]

    # Tracking
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())

    # Relationships
    poi = relationship("PointOfInterest", back_populates="images")
    parent_image = relationship("Image", remote_side=[id], backref="size_variants")
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
| POST | `/api/images/upload-multiple/{poi_id}` | Upload multiple images | Yes |
| GET | `/api/images/image/{image_id}` | Get image metadata | Public |
| GET | `/api/images/poi/{poi_id}` | Get all POI images (supports `image_type` and `function_tag` query filters) | Public |
| PUT | `/api/images/image/{image_id}` | Update metadata (alt_text, caption, display_order, function_tags) | Yes |
| DELETE | `/api/images/image/{image_id}` | Delete image | Yes |
| PUT | `/api/images/poi/{poi_id}/reorder/{image_type}` | Reorder images of a type | Yes |
| GET | `/api/images/serve/{image_id}` | Redirect to S3 URL | Public |
| POST | `/api/images/copy/{source_poi_id}/to/{target_poi_id}` | Copy images between POIs (venue inheritance) | Yes |

### Upload Endpoint

```python
# nearby-admin/backend/app/api/endpoints/images.py

@router.post("/upload/{poi_id}")
async def upload_image(
    poi_id: UUID,
    image_type: ImageTypeEnum = Form(...),
    file: UploadFile = File(...),
    context: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    display_order: Optional[int] = Form(0),
    function_tags: Optional[str] = Form(None),  # JSON-encoded array, e.g. '["storefront", "entrance"]'
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Upload a single image for a POI.
    function_tags is a JSON string that gets parsed into a list."""
    ...

@router.post("/upload-multiple/{poi_id}")
async def upload_multiple_images(
    poi_id: UUID,
    image_type: ImageTypeEnum = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Upload multiple images at once (primarily for galleries)."""
    ...
```

The `function_tags` form field accepts either:
- A JSON-encoded array string: `'["storefront", "entrance"]'`
- A single tag string: `"storefront"` (automatically wrapped in a list)

### Reorder Endpoint

```python
@router.put("/poi/{poi_id}/reorder/{image_type}")
async def reorder_images(
    poi_id: UUID,
    image_type: ImageTypeEnum,
    reorder_request: ImageReorderRequest,  # { "image_ids": [uuid, uuid, ...] }
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Reorder images of a specific type for a POI."""
    ...
```

### Filtering by Function Tag

The `GET /api/images/poi/{poi_id}` endpoint supports filtering by function tag:

```
GET /api/images/poi/{poi_id}?function_tag=storefront
GET /api/images/poi/{poi_id}?image_type=gallery&function_tag=interior
```

The filter uses PostgreSQL's JSONB `@>` (contains) operator to check if the `function_tags` array includes the given tag.

### Image Copy Endpoint (Venue Inheritance)

```python
@router.post("/copy/{source_poi_id}/to/{target_poi_id}")
async def copy_images_from_venue(
    source_poi_id: UUID,
    target_poi_id: UUID,
    image_types: List[ImageTypeEnum] = Query(...),  # e.g. ?image_types=entry&image_types=parking
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Copy images from a venue (BUSINESS/PARK) to an event (EVENT)."""
    ...
```

This endpoint creates **reference copies** of images -- new `Image` database records that share the same S3 objects (no file duplication). It is used by the **venue inheritance** feature so events automatically get entry, parking, and restroom photos from their venue.

**Behavior:**
- Source POI must be `BUSINESS` or `PARK`; target must be `EVENT`
- Only original images are copied (not size variants); variants are re-created pointing to the new parent
- Copied filenames are prefixed with `copy_`
- Captions are set to `"Copied from venue: {venue_name}"`
- The `image_types` query parameter filters which types to copy (e.g., `entry`, `parking`, `restroom`)
- Returns an `ImageBulkUploadResponse` with lists of `uploaded` and `failed` items

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
8. **Tag images** - Use `function_tags` to describe purpose (e.g., `storefront`, `interior`) for better filtering and display
9. **Use image copy for events** - When creating events at a venue, copy venue images via the copy endpoint instead of re-uploading
