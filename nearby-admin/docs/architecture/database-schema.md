# Database Schema

## Overview

The platform uses PostgreSQL 15 with PostGIS 3.4 for geospatial support. Both applications share the same database.

**Database Extensions:**
- `postgis` - Geospatial data types and functions
- `pg_trgm` - Trigram-based fuzzy text search
- `pgvector` - Vector similarity search (production only)

---

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│       users         │       │     categories      │
├─────────────────────┤       ├─────────────────────┤
│ id (UUID) PK        │       │ id (UUID) PK        │
│ email (unique)      │       │ name                │
│ hashed_password     │       │ slug (unique)       │
│ role                │       │ parent_id FK ───────┼──┐
│ created_at          │       │ applicable_types    │  │
└─────────────────────┘       │ created_at          │  │
                              └──────────┬──────────┘  │
                                         │             │
                                         └─────────────┘
                                               │
                                               │ many-to-many
                                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          points_of_interest                              │
├─────────────────────────────────────────────────────────────────────────┤
│ id (UUID) PK                                                             │
│ poi_type (ENUM)              │ name                 │ slug (unique)      │
│ publication_status           │ location (GEOMETRY)  │ created_at         │
│ ... 140+ additional fields (see detailed table below)                    │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         │ 1:1               │ 1:1               │ 1:1               │ 1:1
         ▼                    ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  businesses │      │    parks    │      │   trails    │      │   events    │
├─────────────┤      ├─────────────┤      ├─────────────┤      ├─────────────┤
│ id (UUID)   │      │ id (UUID)   │      │ id (UUID)   │      │ id (UUID)   │
│ poi_id FK   │      │ poi_id FK   │      │ poi_id FK   │      │ poi_id FK   │
│ price_range │      │ drones_     │      │ length_mi   │      │ start_      │
│             │      │   allowed   │      │ difficulty  │      │   datetime  │
└─────────────┘      └─────────────┘      │ route_type  │      │ end_datetime│
                                          │ ...         │      │ ...         │
                                          └─────────────┘      └─────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│       images        │       │   poi_relationships │
├─────────────────────┤       ├─────────────────────┤
│ id (UUID) PK        │       │ source_poi_id FK    │
│ poi_id FK           │       │ target_poi_id FK    │
│ image_type          │       │ relationship_type   │
│ s3_url              │       │ created_at          │
│ alt_text            │       └─────────────────────┘
│ caption             │
│ display_order       │       ┌─────────────────────┐
│ width, height       │       │     attributes      │
│ parent_image_id FK  │       ├─────────────────────┤
└─────────────────────┘       │ id (UUID) PK        │
                              │ name                │
┌─────────────────────┐       │ attribute_type      │
│      waitlist       │       │ applicable_poi_types│
├─────────────────────┤       │ options (JSONB)     │
│ id (UUID) PK        │       └─────────────────────┘
│ email (unique)      │
│ created_at          │       ┌─────────────────────┐
└─────────────────────┘       │    primary_types    │
                              ├─────────────────────┤
                              │ id (UUID) PK        │
                              │ name                │
                              │ poi_type            │
                              └─────────────────────┘
```

---

## Core Tables

### users

User accounts for admin panel authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| email | VARCHAR | UNIQUE, NOT NULL | User email |
| hashed_password | VARCHAR | NOT NULL | bcrypt hash |
| role | VARCHAR | NOT NULL | admin, editor, viewer |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

### points_of_interest

Main POI table with all shared fields.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| poi_type | ENUM | NOT NULL | BUSINESS, PARK, TRAIL, EVENT, etc. |
| name | VARCHAR(255) | NOT NULL | POI name |
| slug | VARCHAR(255) | UNIQUE | SEO-friendly URL slug |
| publication_status | VARCHAR | DEFAULT 'draft' | draft or published |
| location | GEOMETRY(Point, 4326) | | PostGIS point |
| **Address Fields** |
| address_street | VARCHAR(255) | | Street address |
| address_city | VARCHAR(100) | | City |
| address_state | VARCHAR(50) | | State |
| address_zip | VARCHAR(20) | | ZIP code |
| address_country | VARCHAR(100) | | Country |
| **Contact Fields** |
| phone | VARCHAR(20) | | Phone number |
| email | VARCHAR(255) | | Contact email |
| website | VARCHAR(500) | | Website URL |
| **Social Media** |
| facebook | VARCHAR(255) | | Facebook URL |
| instagram | VARCHAR(255) | | Instagram handle |
| twitter | VARCHAR(255) | | Twitter handle |
| tiktok | VARCHAR(255) | | TikTok handle |
| youtube | VARCHAR(255) | | YouTube URL |
| **Content Fields** |
| teaser_description | TEXT | | Short description |
| long_description | TEXT | | Full description |
| internal_notes | TEXT | | Admin-only notes |
| **Hours (JSONB)** |
| hours | JSONB | | Regular operating hours |
| seasonal_hours | JSONB | | Seasonal variations |
| holiday_hours | JSONB | | Holiday schedule |
| **Amenities (JSONB)** |
| amenities | JSONB | | Available amenities |
| accessibility_features | JSONB | | ADA compliance info |
| **Location Details** |
| front_door_latitude | FLOAT | | Entrance lat |
| front_door_longitude | FLOAT | | Entrance lng |
| parking_notes | TEXT | | Parking instructions |
| **Timestamps** |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | | Last update |

**Additional Fields (100+)**: The table includes many more fields for specific features like rentals, outdoor amenities, memberships, payments, compliance, etc.

**Deprecated Photo Columns**: The following columns are deprecated and have been migrated to the `images` table:
- `parking_photos`, `parking_lot_photo` → `images` with `image_type='parking'`
- `rental_photos` → `images` with `image_type='rental'`
- `business_entry_photo`, `park_entry_photo`, `event_entry_photo` → `images` with `image_type='entry'`
- `playground_photos` → `images` with `image_type='playground'`
- `trailhead_photo` → `images` with `image_type='trail_head'`
- `trail_exit_photo` → `images` with `image_type='trail_exit'`

### categories

Hierarchical category system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(100) | NOT NULL | Category name |
| slug | VARCHAR(100) | UNIQUE | URL-friendly slug |
| parent_id | UUID | FK → categories.id | Parent category |
| applicable_types | ARRAY | | POI types this applies to |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

### poi_category_association

Junction table for POI-category many-to-many relationship.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| poi_id | UUID | FK → points_of_interest.id | POI reference |
| category_id | UUID | FK → categories.id | Category reference |

### images

Image storage with variants. All POI photos are now stored in this table (consolidated from previous POI columns).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| poi_id | UUID | FK → points_of_interest.id | Associated POI |
| image_type | VARCHAR | NOT NULL | main, gallery, entry, etc. |
| storage_provider | VARCHAR | DEFAULT 's3' | Always 's3' (database deprecated) |
| storage_url | VARCHAR(500) | | S3 storage URL |
| alt_text | VARCHAR(255) | | Accessibility text |
| caption | TEXT | | Image caption |
| display_order | INTEGER | DEFAULT 0 | Sort order |
| width | INTEGER | | Image width |
| height | INTEGER | | Image height |
| parent_image_id | UUID | FK → images.id | Original image (for variants) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Note:** The `image_data` column (binary storage) has been deprecated. All images are stored in S3.

**Image Types:**
- `main` - Primary POI image
- `gallery` - Gallery images
- `entry` - Entry/entrance photos (includes business, park, event entrances)
- `parking` - Parking area photos (includes parking lots)
- `restroom` - Restroom photos
- `rental` - Rental item photos
- `playground` - Playground photos
- `menu` - Menu images
- `trail_head` - Trailhead photos
- `trail_exit` - Trail exit photos
- `map` - Map images
- `downloadable_map` - Downloadable PDF maps

### poi_relationships

POI-to-POI relationships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| source_poi_id | UUID | FK, PK | Source POI |
| target_poi_id | UUID | FK, PK | Target POI |
| relationship_type | VARCHAR | PK | Type of relationship |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Relationship Types:**
- `event_venue` - Event → Business/Park
- `event_vendor` - Event → Business
- `event_sponsor` - Event → Business
- `trail_in_park` - Trail → Park
- `service_provider` - Trail/Park → Business
- `related` - Any POI types

---

## Subtype Tables

### businesses

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| poi_id | UUID | FK → points_of_interest.id |
| price_range | VARCHAR | $, $$, $$$, $$$$ |

### parks

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| poi_id | UUID | FK → points_of_interest.id |
| drones_allowed | BOOLEAN | Drone policy |

### trails

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| poi_id | UUID | FK → points_of_interest.id |
| length_miles | FLOAT | Trail length |
| difficulty | VARCHAR | easy, moderate, hard |
| route_type | VARCHAR | loop, out-and-back, point-to-point |
| trailhead_latitude | FLOAT | Start point lat |
| trailhead_longitude | FLOAT | Start point lng |
| trail_exit_latitude | FLOAT | End point lat |
| trail_exit_longitude | FLOAT | End point lng |
| trail_surfaces | ARRAY | Surface types |

### events

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| poi_id | UUID | FK → points_of_interest.id |
| start_datetime | TIMESTAMP | Event start |
| end_datetime | TIMESTAMP | Event end |
| repeat_pattern | VARCHAR | Recurrence pattern |
| organizer_name | VARCHAR | Organizer name |
| organizer_email | VARCHAR | Organizer contact |
| ticket_url | VARCHAR | Ticket purchase URL |
| is_free | BOOLEAN | Free event flag |

---

## Supporting Tables

### attributes

Dynamic configurable fields.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR | Attribute name |
| attribute_type | VARCHAR | text, select, multi-select, etc. |
| applicable_poi_types | ARRAY | POI types this applies to |
| options | JSONB | Options for select types |
| created_at | TIMESTAMP | Creation time |

### primary_types

POI subtype classifications (e.g., Food Truck, Ghost Kitchen for BUSINESS).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR | Type name |
| poi_type | VARCHAR | Parent POI type |
| created_at | TIMESTAMP | Creation time |

### waitlist

Email signup collection.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| email | VARCHAR | UNIQUE, email address |
| created_at | TIMESTAMP | Signup time |

---

## Indexes

### Text Search Indexes (pg_trgm)

```sql
CREATE INDEX idx_poi_name_trgm ON points_of_interest
  USING gin (name gin_trgm_ops);

CREATE INDEX idx_poi_city_trgm ON points_of_interest
  USING gin (address_city gin_trgm_ops);
```

### Geospatial Indexes (PostGIS)

```sql
CREATE INDEX idx_poi_location ON points_of_interest
  USING gist (location);
```

### Vector Indexes (pgvector) - Production Only

```sql
CREATE INDEX idx_poi_embedding ON points_of_interest
  USING ivfflat (embedding vector_cosine_ops);
```

---

## Common Queries

### Get POI with all relationships

```sql
SELECT p.*, b.*, pk.*, t.*, e.*,
       array_agg(c.name) as categories
FROM points_of_interest p
LEFT JOIN businesses b ON p.id = b.poi_id
LEFT JOIN parks pk ON p.id = pk.poi_id
LEFT JOIN trails t ON p.id = t.poi_id
LEFT JOIN events e ON p.id = e.poi_id
LEFT JOIN poi_category_association pca ON p.id = pca.poi_id
LEFT JOIN categories c ON pca.category_id = c.id
WHERE p.slug = 'example-slug'
GROUP BY p.id, b.id, pk.id, t.id, e.id;
```

### Fuzzy search with pg_trgm

```sql
SELECT *, similarity(name, 'search term') as sim
FROM points_of_interest
WHERE publication_status = 'published'
  AND (name % 'search term' OR address_city % 'search term')
ORDER BY sim DESC
LIMIT 10;
```

### Nearby POIs with PostGIS

```sql
SELECT *, ST_Distance(
  location::geography,
  ST_SetSRID(ST_MakePoint(-79.1772, 35.7198), 4326)::geography
) / 1609.34 as distance_miles
FROM points_of_interest
WHERE publication_status = 'published'
ORDER BY location <-> ST_SetSRID(ST_MakePoint(-79.1772, 35.7198), 4326)
LIMIT 8;
```
