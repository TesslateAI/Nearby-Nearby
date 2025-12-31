# POI Management System

## Overview

The POI (Point of Interest) Management System is the core of the platform, handling creation, reading, updating, and deletion of location data. It supports 8 different POI types with shared base fields and type-specific extensions.

**Key Files:**
- `nearby-admin/backend/app/models/poi.py` - SQLAlchemy models
- `nearby-admin/backend/app/crud/crud_poi.py` - CRUD operations
- `nearby-admin/backend/app/api/endpoints/pois.py` - API endpoints
- `nearby-admin/backend/app/schemas/poi.py` - Pydantic schemas
- `nearby-admin/frontend/src/components/POIForm/` - Form components

---

## POI Types

| Type | Enum Value | Description |
|------|------------|-------------|
| Business | `BUSINESS` | Restaurants, shops, services |
| Park | `PARK` | Parks and recreational areas |
| Trail | `TRAIL` | Hiking and walking trails |
| Event | `EVENT` | Events and activities |
| Services | `SERVICES` | Service providers |
| Youth Activities | `YOUTH_ACTIVITIES` | Youth programs |
| Jobs | `JOBS` | Job listings |
| Volunteer | `VOLUNTEER_OPPORTUNITIES` | Volunteer positions |
| Disaster Hubs | `DISASTER_HUBS` | Emergency resources |

---

## Data Model

### Base POI Fields

All POI types share these fields:

```python
# nearby-admin/backend/app/models/poi.py

class PointOfInterest(Base):
    __tablename__ = "points_of_interest"

    # Identity
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    poi_type = Column(Enum(POIType), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True)
    publication_status = Column(String, default="draft")

    # Location
    location = Column(Geometry("POINT", srid=4326))
    address_street = Column(String(255))
    address_city = Column(String(100))
    address_state = Column(String(50))
    address_zip = Column(String(20))
    front_door_latitude = Column(Float)
    front_door_longitude = Column(Float)

    # Contact
    phone = Column(String(20))
    email = Column(String(255))
    website = Column(String(500))

    # Social Media
    facebook = Column(String(255))
    instagram = Column(String(255))
    twitter = Column(String(255))
    tiktok = Column(String(255))
    youtube = Column(String(255))

    # Content
    teaser_description = Column(Text)
    long_description = Column(Text)
    internal_notes = Column(Text)

    # Hours (JSONB)
    hours = Column(JSONB)
    seasonal_hours = Column(JSONB)
    holiday_hours = Column(JSONB)

    # Features (JSONB)
    amenities = Column(JSONB)
    accessibility_features = Column(JSONB)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    categories = relationship("Category", secondary=poi_category_association)
    images = relationship("Image", back_populates="poi")
    business = relationship("Business", uselist=False)
    park = relationship("Park", uselist=False)
    trail = relationship("Trail", uselist=False)
    event = relationship("Event", uselist=False)
```

### Type-Specific Models

#### Business

```python
class Business(Base):
    __tablename__ = "businesses"

    id = Column(UUID, primary_key=True)
    poi_id = Column(UUID, ForeignKey("points_of_interest.id"))
    price_range = Column(String)  # $, $$, $$$, $$$$
```

#### Park

```python
class Park(Base):
    __tablename__ = "parks"

    id = Column(UUID, primary_key=True)
    poi_id = Column(UUID, ForeignKey("points_of_interest.id"))
    drones_allowed = Column(Boolean)
```

#### Trail

```python
class Trail(Base):
    __tablename__ = "trails"

    id = Column(UUID, primary_key=True)
    poi_id = Column(UUID, ForeignKey("points_of_interest.id"))
    length_miles = Column(Float)
    difficulty = Column(String)  # easy, moderate, hard
    route_type = Column(String)  # loop, out-and-back, point-to-point
    trailhead_latitude = Column(Float)
    trailhead_longitude = Column(Float)
    trail_exit_latitude = Column(Float)
    trail_exit_longitude = Column(Float)
    trail_surfaces = Column(ARRAY(String))
```

#### Event

```python
class Event(Base):
    __tablename__ = "events"

    id = Column(UUID, primary_key=True)
    poi_id = Column(UUID, ForeignKey("points_of_interest.id"))
    start_datetime = Column(DateTime)
    end_datetime = Column(DateTime)
    repeat_pattern = Column(String)
    organizer_name = Column(String)
    organizer_email = Column(String)
    ticket_url = Column(String)
    is_free = Column(Boolean)
```

---

## CRUD Operations

### Create POI

```python
# nearby-admin/backend/app/crud/crud_poi.py

def create_poi(db: Session, poi_data: POICreate) -> PointOfInterest:
    """Create a new POI with auto-generated slug."""

    # Generate unique slug
    base_slug = slugify(f"{poi_data.name}-{poi_data.address_city}")
    slug = generate_unique_slug(db, base_slug)

    # Create base POI
    poi = PointOfInterest(
        **poi_data.dict(exclude={"category_ids", "business", "park", "trail", "event"}),
        slug=slug
    )
    db.add(poi)

    # Create type-specific record
    if poi_data.poi_type == POIType.BUSINESS and poi_data.business:
        business = Business(poi_id=poi.id, **poi_data.business.dict())
        db.add(business)
    elif poi_data.poi_type == POIType.TRAIL and poi_data.trail:
        trail = Trail(poi_id=poi.id, **poi_data.trail.dict())
        db.add(trail)
    # ... similar for park, event

    # Associate categories
    if poi_data.category_ids:
        categories = db.query(Category).filter(
            Category.id.in_(poi_data.category_ids)
        ).all()
        poi.categories = categories

    db.commit()
    db.refresh(poi)
    return poi
```

### Read POI

```python
def get_poi(db: Session, poi_id: UUID) -> PointOfInterest:
    """Get POI by ID with all relationships loaded."""
    return db.query(PointOfInterest).options(
        joinedload(PointOfInterest.business),
        joinedload(PointOfInterest.park),
        joinedload(PointOfInterest.trail),
        joinedload(PointOfInterest.event),
        joinedload(PointOfInterest.categories),
        joinedload(PointOfInterest.images),
    ).filter(PointOfInterest.id == poi_id).first()

def get_poi_by_slug(db: Session, slug: str) -> PointOfInterest:
    """Get POI by slug."""
    return db.query(PointOfInterest).options(
        joinedload(PointOfInterest.business),
        # ... other relationships
    ).filter(PointOfInterest.slug == slug).first()
```

### Update POI

```python
def update_poi(db: Session, poi_id: UUID, poi_data: POIUpdate) -> PointOfInterest:
    """Update existing POI."""
    poi = db.query(PointOfInterest).filter(PointOfInterest.id == poi_id).first()
    if not poi:
        return None

    # Update base fields
    for field, value in poi_data.dict(exclude_unset=True).items():
        if field not in ["category_ids", "business", "park", "trail", "event"]:
            setattr(poi, field, value)

    # Update type-specific record
    if poi.poi_type == POIType.BUSINESS and poi_data.business:
        if poi.business:
            for field, value in poi_data.business.dict(exclude_unset=True).items():
                setattr(poi.business, field, value)
    # ... similar for other types

    # Update categories
    if poi_data.category_ids is not None:
        categories = db.query(Category).filter(
            Category.id.in_(poi_data.category_ids)
        ).all()
        poi.categories = categories

    db.commit()
    db.refresh(poi)
    return poi
```

### Delete POI

```python
def delete_poi(db: Session, poi_id: UUID) -> bool:
    """Delete POI and all related records."""
    poi = db.query(PointOfInterest).filter(PointOfInterest.id == poi_id).first()
    if not poi:
        return False

    # Delete associated images from S3
    for image in poi.images:
        delete_from_s3(image.s3_url)

    db.delete(poi)  # Cascades to type tables, images
    db.commit()
    return True
```

---

## Search Operations

### Text Search

```python
def search_pois(db: Session, query: str, limit: int = 10):
    """Fuzzy text search using pg_trgm."""
    return db.query(
        PointOfInterest,
        func.similarity(PointOfInterest.name, query).label("sim")
    ).filter(
        PointOfInterest.publication_status == "published",
        or_(
            PointOfInterest.name.op("%")(query),
            PointOfInterest.address_city.op("%")(query)
        )
    ).order_by(
        desc("sim")
    ).limit(limit).all()
```

### Location Search

```python
def search_by_location(
    db: Session,
    lat: float,
    lng: float,
    radius_miles: float = 10
):
    """Find POIs within radius of coordinates."""
    point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)

    return db.query(
        PointOfInterest,
        (func.ST_Distance(
            PointOfInterest.location.cast(Geography),
            point.cast(Geography)
        ) / 1609.34).label("distance_miles")
    ).filter(
        PointOfInterest.publication_status == "published",
        func.ST_DWithin(
            PointOfInterest.location.cast(Geography),
            point.cast(Geography),
            radius_miles * 1609.34  # Convert to meters
        )
    ).order_by("distance_miles").all()
```

---

## Slug Generation

```python
# nearby-admin/backend/app/crud/crud_poi.py

import re
from unidecode import unidecode

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = unidecode(text).lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text

def generate_unique_slug(db: Session, base_slug: str) -> str:
    """Generate unique slug, appending number if needed."""
    slug = base_slug
    counter = 1

    while db.query(PointOfInterest).filter(
        PointOfInterest.slug == slug
    ).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug
```

---

## Publication Status

POIs have two publication states:

| Status | Description | Visibility |
|--------|-------------|------------|
| `draft` | Work in progress | Admin panel only |
| `published` | Ready for public | User-facing app |

```python
# Publishing a POI
def publish_poi(db: Session, poi_id: UUID):
    poi = get_poi(db, poi_id)
    poi.publication_status = "published"
    db.commit()
    return poi

# Unpublishing
def unpublish_poi(db: Session, poi_id: UUID):
    poi = get_poi(db, poi_id)
    poi.publication_status = "draft"
    db.commit()
    return poi
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/pois/` | Create POI | Admin/Editor |
| GET | `/api/pois/` | List published POIs | Public |
| GET | `/api/admin/pois/` | List all POIs | Auth |
| GET | `/api/pois/{id}` | Get POI by ID | Public |
| PUT | `/api/pois/{id}` | Update POI | Admin/Editor |
| DELETE | `/api/pois/{id}` | Delete POI | Admin |
| GET | `/api/pois/search` | Search POIs | Public |

---

## Frontend Form System

The POI form uses a modular accordion-based architecture:

```
POIForm/
├── POIForm.jsx           # Main form component
├── hooks/
│   ├── usePOIForm.js     # Form state management
│   ├── usePOIHandlers.jsx # CRUD handlers
│   └── useAutoSave.js    # Auto-save logic
├── constants/
│   ├── initialValues.js  # Default form values
│   ├── validationRules.js # Validation schema
│   └── fieldOptions.js   # Field configurations
└── sections/
    ├── CoreInformationSection.jsx
    ├── LocationSection.jsx
    ├── ContactSection.jsx
    ├── BusinessDetailsSection.jsx
    ├── TrailSpecificSections.jsx
    ├── EventSpecificSections.jsx
    └── ... (12+ sections)
```

### Conditional Rendering by POI Type

```jsx
// nearby-admin/frontend/src/components/POIForm/POIForm.jsx

function POIForm({ poiId }) {
  const { form, loading } = usePOIForm(poiId);
  const poiType = form.values.poi_type;

  return (
    <Accordion>
      <CoreInformationSection form={form} />
      <LocationSection form={form} />
      <ContactSection form={form} />

      {/* Type-specific sections */}
      {poiType === 'BUSINESS' && (
        <>
          <BusinessDetailsSection form={form} />
          <MenuBookingSection form={form} />
        </>
      )}

      {poiType === 'TRAIL' && (
        <TrailSpecificSections form={form} />
      )}

      {poiType === 'EVENT' && (
        <EventSpecificSections form={form} />
      )}

      {poiType === 'PARK' && (
        <ParkCategoriesSection form={form} />
      )}
    </Accordion>
  );
}
```

---

## Validation Rules

```javascript
// nearby-admin/frontend/src/components/POIForm/constants/validationRules.js

export const validationRules = {
  name: (value) => (!value ? 'Name is required' : null),
  poi_type: (value) => (!value ? 'POI type is required' : null),
  address_city: (value) => (!value ? 'City is required' : null),
  email: (value) => (
    value && !/^\S+@\S+$/.test(value) ? 'Invalid email' : null
  ),
  website: (value) => (
    value && !value.startsWith('http') ? 'Must start with http' : null
  ),
};
```

---

## Best Practices

1. **Always validate POI type** before saving type-specific data
2. **Use transactions** for operations involving multiple tables
3. **Generate slugs automatically** to ensure SEO-friendly URLs
4. **Cascade deletes** to clean up related records
5. **Filter by publication_status** in public endpoints
6. **Load relationships eagerly** to avoid N+1 queries
