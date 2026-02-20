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
    teaser_paragraph = Column(Text)  # Visible text ≤ 120 chars (HTML allowed)
    description_short = Column(Text)  # Visible text ≤ 250 chars (HTML allowed)
    long_description = Column(Text)
    internal_notes = Column(Text)

    # Flags
    lat_long_most_accurate = Column(Boolean, default=False)

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

    poi_id = Column(UUID, ForeignKey("points_of_interest.id"), primary_key=True)
    start_datetime = Column(TIMESTAMP(timezone=True), nullable=False)
    end_datetime = Column(TIMESTAMP(timezone=True))

    # Repeating event fields
    is_repeating = Column(Boolean, default=False)
    repeat_pattern = Column(JSONB)  # {"frequency": "weekly|daily|monthly|yearly", "interval": 1, "days": [...]}

    # Venue inheritance (see "Venue Data Inheritance" section)
    venue_poi_id = Column(UUID, ForeignKey("points_of_interest.id"), nullable=True)
    venue_inheritance = Column(JSONB, nullable=True)  # Per-section inheritance config

    # Recurring events (see "Recurring Events" section)
    series_id = Column(UUID, nullable=True, index=True)
    parent_event_id = Column(UUID, ForeignKey("events.poi_id"), nullable=True)
    excluded_dates = Column(JSONB, nullable=True)    # ["2026-07-04", "2026-12-25"]
    recurrence_end_date = Column(TIMESTAMP(timezone=True), nullable=True)
    manual_dates = Column(JSONB, nullable=True)       # ["2026-03-01T18:00:00Z", ...]

    # Event-specific fields
    organizer_name = Column(String)
    venue_settings = Column(JSONB)  # Indoor, Outdoor, Hybrid, Online Only
    event_entry_notes = Column(Text)
    food_and_drink_info = Column(Text)
    coat_check_options = Column(JSONB)

    # Vendor information
    has_vendors = Column(Boolean, default=False)
    vendor_types = Column(JSONB)
    vendor_application_deadline = Column(TIMESTAMP(timezone=True))
    vendor_application_info = Column(Text)
    vendor_fee = Column(String)
    vendor_requirements = Column(Text)
    vendor_poi_links = Column(JSONB)  # List of POI IDs for vendors at this event

    poi = relationship("PointOfInterest", back_populates="event", foreign_keys=[poi_id])
    venue_poi = relationship("PointOfInterest", foreign_keys=[venue_poi_id])
    parent_event = relationship("Event", remote_side=[poi_id], foreign_keys=[parent_event_id])
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
| GET | `/api/pois/{id}/venue-data` | Get venue data for event inheritance | Admin/Editor |

---

## Venue Data Inheritance

Events can link to a **venue** (a Business or Park POI) via the `venue_poi_id` field on the Event model. When linked, the event can inherit data from the venue instead of requiring manual re-entry.

### How It Works

1. The admin selects a venue (Business or Park) in the Event form via the **VenueSelector** component.
2. The frontend calls `GET /api/pois/{venue_poi_id}/venue-data` to fetch copyable data.
3. The `venue_inheritance` JSONB field stores per-section inheritance configuration, indicating which data sections are inherited from the venue.

### Inheritance Configuration

The `venue_inheritance` field is a JSONB object with boolean flags per section:

```json
{
  "parking": true,
  "restrooms": true,
  "accessibility": true,
  "address": false
}
```

When a flag is `true`, the event inherits that section's data from the linked venue rather than storing its own values.

### Venue Data Endpoint

```
GET /api/pois/{poi_id}/venue-data
```

**Auth**: Admin/Editor required.

**Validation**: Only `BUSINESS` and `PARK` POI types can be used as venues. Returns `400` for other types.

**Response** (`VenueDataForEvent` schema):

| Field Group | Fields Included |
|-------------|----------------|
| Identity | `venue_id`, `venue_name`, `venue_type` |
| Address | `address_full`, `address_street`, `address_city`, `address_state`, `address_zip`, `address_county` |
| Location | `location`, `front_door_latitude`, `front_door_longitude` |
| Contact | `phone_number`, `email`, `website_url` |
| Parking | `parking_types`, `parking_notes`, `parking_locations`, `expect_to_pay_parking`, `public_transit_info` |
| Accessibility | `wheelchair_accessible`, `wheelchair_details` |
| Restrooms | `public_toilets`, `toilet_description`, `toilet_locations` |
| Hours | `hours` |
| Amenities | `amenities` |
| Photos | `copyable_images` (entry, parking, restroom image metadata) |

---

## Recurring Events

Events support recurrence through a set of fields on the Event model that enable grouping, parent-child relationships, and flexible scheduling patterns.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `is_repeating` | `Boolean` | Flag indicating this is a recurring event |
| `repeat_pattern` | `JSONB` | Recurrence pattern: `{"frequency": "weekly", "interval": 1, "days_of_week": ["Monday", "Wednesday"]}` |
| `series_id` | `UUID` | Groups related event instances into a series (shared across all instances) |
| `parent_event_id` | `FK → events.poi_id` | Links child event instances back to the parent/template event |
| `excluded_dates` | `JSONB array` | Dates to skip in the recurrence pattern (e.g., `["2026-07-04", "2026-12-25"]`) |
| `recurrence_end_date` | `TIMESTAMP` | When the recurrence pattern stops generating new instances |
| `manual_dates` | `JSONB array` | Manually specified dates for irregular patterns (e.g., `["2026-03-01T18:00:00Z"]`) |

### Recurrence Pattern Structure

```json
{
  "frequency": "weekly",   // "daily", "weekly", "monthly", "yearly"
  "interval": 1,           // Every N periods (e.g., every 2 weeks)
  "days_of_week": ["Monday", "Wednesday"]  // Applicable for weekly frequency
}
```

### Parent-Child Relationship

- The **parent event** serves as the template, storing the recurrence configuration.
- **Child events** are individual instances linked via `parent_event_id`.
- All events in a series share the same `series_id` for easy querying.
- The `excluded_dates` array on the parent tracks cancelled individual occurrences.

---

## Primary Parking

POIs support a **primary parking location** with dedicated fields, separate from the `parking_locations` JSONB array that stores additional parking areas.

| Field | Type | Description |
|-------|------|-------------|
| `primary_parking_lat` | `Float` | Latitude of the main parking area |
| `primary_parking_lng` | `Float` | Longitude of the main parking area |
| `primary_parking_name` | `String` | Name/label for the primary parking area (e.g., "Main Lot") |

The `parking_locations` JSONB array continues to store additional parking areas as `[{"lat": 0, "lng": 0, "name": "Overflow Lot"}]`.

**Note**: These fields are currently managed on the frontend form (`initialValues.js`, `LocationSection.jsx`, `usePOIHandlers.jsx`) and are not yet added to the backend SQLAlchemy model or schema.

---

## Wheelchair and Mobility Access

Renamed from "Wheelchair Accessibility" to **"Wheelchair and Mobility Access"**. In addition to the existing `wheelchair_accessible` (JSONB list) and `wheelchair_details` (Text) fields, a new `mobility_access` JSONB field provides structured granular data.

### `mobility_access` Field Structure

```json
{
  "step_free_entry": "Yes",           // "Yes", "No", "Partial"
  "main_area_accessible": "Yes",      // "Yes", "No", "Partial"
  "ground_level_service": "Partial",  // "Yes", "No", "Partial"
  "accessible_restroom": "Yes",       // "Yes", "No", "Partial"
  "accessible_parking": "No"          // "Yes", "No", "Partial"
}
```

Each sub-field accepts `"Yes"`, `"No"`, or `"Partial"`. The frontend renders these as select inputs in the Facilities section of the POI form.

---

## Restroom Toilet Types Per Location

Each entry in the `toilet_locations` JSONB array now supports a `toilet_types` array field, allowing per-location specification of toilet types available.

### Updated Structure

```json
[
  {
    "lat": 35.720303,
    "lng": -79.177397,
    "description": "Near main entrance",
    "photos": "",
    "toilet_types": ["Standard", "Family", "Porta Potty"]
  }
]
```

Available toilet type options include: `"Standard"`, `"Family"`, `"Porta Potty"`, and others as configured in the frontend.

---

## Default Values

New POIs are initialized with the following default values (defined in `nearby-admin/frontend/src/components/POIForm/constants/initialValues.js`):

| Field | Default Value |
|-------|---------------|
| `address_city` | `Pittsboro` |
| `address_county` | `Chatham` |
| `address_state` | `NC` |
| `longitude` | `-79.177397` (Pittsboro center) |
| `latitude` | `35.720303` (Pittsboro center) |
| `poi_type` | `BUSINESS` |
| `listing_type` | `free` |
| `publication_status` | `draft` |
| `status` | `Fully Open` |

These defaults reflect the platform's focus on Chatham County, North Carolina.

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

## Validation Rules

### Backend Validators (Pydantic)

| Field | Rule | Notes |
|-------|------|-------|
| `teaser_paragraph` | Visible text ≤ 120 chars | HTML tags stripped before counting |
| `description_short` | Visible text ≤ 250 chars | HTML tags stripped before counting |

Both validators use `strip_html_tags()` to remove HTML before measuring length. The database columns are `TEXT` (not VARCHAR) because HTML markup can exceed the visible character limit.

### Free Business Listing Restrictions

Free business listings (`listing_type == 'free'` and `poi_type == 'BUSINESS'`) have additional restrictions:

| Restriction | Enforcement |
|-------------|-------------|
| Max 1 category | Backend: 400 error if `len(category_ids) > 1`. Frontend: disables "Add Category" after 1 selection |
| No teaser paragraph | Frontend: field hidden for free business |
| No Community Connections | Frontend: entire section hidden (community_impact, article_links) |
| Has public restrooms | Frontend: Facilities & Public Amenities sections always visible |
| No restroom photo uploads | Frontend: restroom photo upload hidden for free business listings (`!(isBusiness && isFreeListing)` guard) |
| Has wheelchair accessibility | Frontend: Facilities section always visible |
| Has parking fields | Frontend: parking_notes, public_transit_info, expect_to_pay_parking always visible |

### Multiple Playgrounds (JSONB)

The `playground_location` field accepts either a single dict `{lat, lng}` or an array `[{lat, lng, types, surfaces, notes}, ...]`. The frontend normalizes both formats to an array for display. Each playground can have its own photos via `image_context` grouping.

### Multiple Restrooms (JSONB)

The `toilet_locations` field stores an array of restroom objects `[{lat, lng, description, photos, toilet_types}, ...]`. Parks, trails, and events all use the multi-restroom card UI with add/remove buttons. Each restroom location can specify its own `toilet_types` array (e.g., `["Standard", "Family", "Porta Potty"]`). See the "Restroom Toilet Types Per Location" section above for details.

---

## Best Practices

1. **Always validate POI type** before saving type-specific data
2. **Use transactions** for operations involving multiple tables
3. **Generate slugs automatically** to ensure SEO-friendly URLs
4. **Cascade deletes** to clean up related records
5. **Filter by publication_status** in public endpoints
6. **Load relationships eagerly** to avoid N+1 queries
