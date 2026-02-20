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
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│  businesses │      │    parks    │      │   trails    │      │     events      │
├─────────────┤      ├─────────────┤      ├─────────────┤      ├─────────────────┤
│ id (UUID)   │      │ id (UUID)   │      │ id (UUID)   │      │ id (UUID)       │
│ poi_id FK   │      │ poi_id FK   │      │ poi_id FK   │      │ poi_id FK       │
│ price_range │      │ drones_     │      │ length_mi   │      │ start_datetime  │
│             │      │   allowed   │      │ difficulty  │      │ end_datetime    │
└─────────────┘      └─────────────┘      │ route_type  │      │ venue_poi_id FK │
                                          │ ...         │      │ series_id       │
                                          └─────────────┘      │ parent_event FK │
                                                               │ ...             │
                                                               └─────────────────┘

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
│ function_tags (JSONB)│      │     attributes      │
│ width, height       │       ├─────────────────────┤
│ parent_image_id FK  │       │ id (UUID) PK        │
└─────────────────────┘       │ name                │
                              │ attribute_type      │
┌─────────────────────┐       │ applicable_poi_types│
│      waitlist       │       │ options (JSONB)     │
├─────────────────────┤
│ id (UUID) PK        │
│ email (unique)      │
│ created_at          │       ┌─────────────────────┐
└─────────────────────┘       │    primary_types    │
         │                    ├─────────────────────┤
         │ nearby_forms role  │ id (UUID) PK        │
         ▼                    │ name                │
┌──────────────────────┐      │ poi_type            │
│ community_interest   │      └─────────────────────┘
├──────────────────────┤
│ id (UUID) PK         │      ┌──────────────────────┐
│ name, email          │      │ contact_submissions  │
│ location, role       │      ├──────────────────────┤
│ why, how_heard       │      │ id (UUID) PK         │
└──────────────────────┘      │ name, email, message │
                              └──────────────────────┘
┌──────────────────────┐
│ feedback_submissions │      ┌──────────────────────┐
├──────────────────────┤      │  business_claims     │
│ id (UUID) PK         │      ├──────────────────────┤
│ email, feedback      │      │ id (UUID) PK         │
│ file_urls (JSONB)    │      │ business_name        │
└──────────────────────┘      │ contact info, status │
                              └──────────────────────┘
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
| teaser_paragraph | TEXT | | Short teaser (visible text ≤ 120 chars, HTML allowed) |
| description_short | TEXT | | Short description (visible text ≤ 250 chars, HTML allowed) |
| long_description | TEXT | | Full description |
| internal_notes | TEXT | | Admin-only notes |
| **Flags** |
| lat_long_most_accurate | BOOLEAN | DEFAULT false | Mark lat/long as verified accurate |
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
| public_transit_info | TEXT | | Public transit details |
| expect_to_pay_parking | VARCHAR | | Parking fee expectations |
| alcohol_policy_details | TEXT | | Alcohol policy description |
| **Parking & Facilities (JSONB)** |
| parking_locations | JSONB | | Array of {name, lat, lng} parking lots |
| toilet_locations | JSONB | | Array of {lat, lng, description} restrooms |
| playground_location | JSONB | | Array of {lat, lng, types, surfaces, notes} playgrounds |
| **Primary Parking** |
| primary_parking_lat | FLOAT | | Primary parking lot latitude |
| primary_parking_lng | FLOAT | | Primary parking lot longitude |
| primary_parking_name | VARCHAR | | Primary parking lot name |
| **Mobility Access** |
| mobility_access | JSONB | | Structured accessibility info: `step_free_entry`, `main_area_accessible`, `ground_level_service`, `accessible_restroom`, `accessible_parking` |
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
| is_main | BOOLEAN | DEFAULT false | Whether this is the POI's main category |

**Business rules:**
- Free business listings are limited to 1 category (enforced backend + frontend)
- Paid listings can have unlimited categories

### images

Image storage with variants. All POI photos are now stored in this table (consolidated from previous POI columns).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| poi_id | UUID | FK → points_of_interest.id | Associated POI |
| image_type | VARCHAR | NOT NULL | main, gallery, entry, etc. |
| storage_provider | VARCHAR | DEFAULT 's3' | Always 's3' (database deprecated) |
| storage_url | VARCHAR(500) | | S3 storage URL |
| image_context | VARCHAR(50) | | Contextual grouping (e.g., 'parking_1', 'playground_2') |
| alt_text | VARCHAR(255) | | Accessibility text |
| caption | TEXT | | Image caption |
| display_order | INTEGER | DEFAULT 0 | Sort order |
| function_tags | JSONB | | Array of string tags describing image purpose (e.g., "storefront", "interior", "menu"). See predefined tags below |
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

**Function Tags** (predefined in `shared/constants/field_options.py` `IMAGE_FUNCTION_TAGS`):
`storefront`, `entrance`, `interior`, `exterior`, `signage`, `parking`, `restrooms`, `playground`, `aerial`, `food_drink`, `menu`, `staff`, `product`, `trail_marker`, `scenic`, `map`, `floorplan`, `event_setup`, `stage`, `vendor_area`

Migration: `d4e5f6g7h8i9_add_function_tags_to_images`

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
| **Venue Inheritance** |
| venue_poi_id | UUID | FK → points_of_interest.id. Links event to a venue (business or park) for inheriting location, hours, amenities, etc. |
| venue_inheritance | JSONB | Per-section config controlling which fields are inherited from the venue (e.g., `{"location": true, "hours": true, "amenities": false}`) |
| **Recurring Events** |
| series_id | UUID | Groups recurring event instances into a series. Indexed for fast lookups |
| parent_event_id | UUID | FK → events.poi_id. Links a child event instance to its parent/template event |
| excluded_dates | JSONB | Array of ISO date strings excluded from recurrence (e.g., `["2026-07-04", "2026-12-25"]`) |
| recurrence_end_date | TIMESTAMP WITH TIMEZONE | When the recurrence pattern ends |
| manual_dates | JSONB | Array of ISO datetime strings for irregular/manually specified occurrences (e.g., `["2026-03-01T18:00:00Z"]`) |

Migration: `e5f6g7h8i9j0_add_venue_inheritance_and_recurring`

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

Email signup collection. Migrated from SQLite to PostgreSQL. Uses isolated `nearby_forms` DB role.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| email | VARCHAR | UNIQUE, email address |
| created_at | TIMESTAMP | Signup time |

### community_interest

Public form for users interested in bringing Nearby Nearby to their community.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| name | VARCHAR(100) | | Submitter name |
| email | VARCHAR(255) | | Contact email |
| location | VARCHAR(200) | NOT NULL | "Town, County, State" |
| role | JSONB | | Array of roles: Resident, Business Owner, etc. |
| role_other | VARCHAR(100) | | Custom role if "Other" selected |
| why | TEXT | | Why they want NN in their area |
| how_heard | VARCHAR(500) | | How they heard about NN |
| anything_else | TEXT | | Additional comments |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Submission time |

### contact_submissions

General contact form submissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| name | VARCHAR(100) | NOT NULL | Submitter name |
| email | VARCHAR(255) | NOT NULL | Contact email |
| message | TEXT | NOT NULL | Message content (min 10 chars) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Submission time |

### feedback_submissions

User feedback with optional file uploads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| email | VARCHAR(255) | | Optional contact email |
| feedback | TEXT | NOT NULL | Feedback content (min 10 chars) |
| file_urls | JSONB | | Array of S3 URLs for uploaded screenshots |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Submission time |

### business_claims

Business owner registration/claim requests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| business_name | VARCHAR(200) | NOT NULL | Business name |
| contact_name | VARCHAR(100) | NOT NULL | Owner/contact name |
| contact_phone | VARCHAR(20) | NOT NULL | Phone number |
| contact_email | VARCHAR(255) | NOT NULL | Email address |
| business_address | VARCHAR(500) | NOT NULL | Business street address |
| how_heard | VARCHAR(500) | | How they heard about NN |
| anything_else | TEXT | | Additional notes |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Claim status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Submission time |

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

### Full-Text Search Indexes (tsvector)

```sql
CREATE INDEX idx_poi_tsvector ON points_of_interest
  USING gin (tsvector_col);
```

The `tsvector_col` is a GENERATED ALWAYS column using `to_tsvector('english', ...)` for full-text search with English stemming.

### Event Indexes

```sql
CREATE INDEX ix_events_series_id ON events (series_id);
```

Groups recurring event instances for fast series lookups.

---

## Database Roles

### nearby_forms (Public Forms Isolation)

A restricted PostgreSQL role used by the nearby-app for public form submissions.

**Permissions:**
- `CONNECT` on the database
- `USAGE` on public schema
- `SELECT, INSERT` on: waitlist, community_interest, contact_submissions, feedback_submissions, business_claims

**Cannot access:** points_of_interest, businesses, parks, trails, events, images, users, categories, or any other POI-related table.

**Connection:** Via `FORMS_DATABASE_URL` env var (separate SQLAlchemy engine in nearby-app). Falls back to `DATABASE_URL` if not set.

Migration: `nearby-admin/backend/alembic/versions/c3f4g5h6i7j8_create_form_tables.py`

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
