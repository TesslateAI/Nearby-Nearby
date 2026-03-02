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
│ created_at          │       │ applicable_to       │  │
└─────────────────────┘       │ is_active,sort_order│  │
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
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────────────┐
│  businesses │      │    parks    │      │   trails    │      │       events        │
├─────────────┤      ├─────────────┤      ├─────────────┤      ├─────────────────────┤
│ poi_id FK   │      │ poi_id FK   │      │ poi_id FK   │      │ poi_id FK (PK)      │
│ price_range │      │ drone_usage │      │ length_text │      │ start_datetime      │
│             │      │   _policy   │      │ difficulty  │      │ end_datetime        │
└─────────────┘      └─────────────┘      │ route_type  │      │ is_repeating        │
                                          │ ...         │      │ repeat_pattern      │
                                          └─────────────┘      │ venue_poi_id FK     │
                                                               │ event_status        │
                                                               │ status_explanation  │
                                                               │ organizer_poi_id FK │
                                                               │ cost_type           │
                                                               │ vendor_poi_links    │
                                                               │ sponsors            │
                                                               │ ...                 │
                                                               └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│       images        │       │   poi_relationships │
├─────────────────────┤       ├─────────────────────┤
│ id (UUID) PK        │       │ source_poi_id FK    │
│ poi_id FK           │       │ target_poi_id FK    │
│ image_type          │       │ relationship_type   │
│ filename            │       │ created_at          │
│ storage_url         │       └─────────────────────┘
│ storage_key         │
│ mime_type,size_bytes │       ┌─────────────────────┐
│ function_tags (JSONB)│      │     attributes      │
│ width, height       │       ├─────────────────────┤
│ uploaded_by FK      │       │ id (UUID) PK        │
│ parent_image_id FK  │       │ name                │
└─────────────────────┘       │ type                │
                              │ applicable_to       │
┌─────────────────────┐       │ is_active,sort_order│
│      waitlist       │       └─────────────────────┘
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
| listing_type | VARCHAR | DEFAULT 'free' | Listing tier: free, paid, sponsor_platform, sponsor_state, sponsor_county, sponsor_town, community_comped. Legacy values `paid_founding` and `sponsor` were migrated (see migration `g7h8i9j0k1l2`) |
| location | GEOMETRY(Point, 4326) | | PostGIS point |
| **Address Fields** |
| address_street | VARCHAR(255) | | Street address |
| address_city | VARCHAR(100) | | City |
| address_state | VARCHAR(50) | | State |
| address_zip | VARCHAR(20) | | ZIP code |
| address_country | VARCHAR(100) | | Country |
| **Contact Fields** |
| phone_number | VARCHAR | | Phone number |
| email | VARCHAR | | Contact email |
| website_url | VARCHAR | | Website URL |
| **Social Media** |
| instagram_username | VARCHAR | | Instagram username |
| facebook_username | VARCHAR | | Facebook username |
| x_username | VARCHAR | | X (Twitter) username |
| tiktok_username | VARCHAR | | TikTok username |
| linkedin_username | VARCHAR | | LinkedIn username |
| other_socials | JSONB | | Additional social media `{"youtube": "channel", "bluesky": "handle"}` |
| **Content Fields** |
| teaser_paragraph | TEXT | | Short teaser (visible text ≤ 120 chars, HTML allowed) |
| description_short | TEXT | | Short description (visible text ≤ 250 chars, HTML allowed) |
| description_long | TEXT | | Full description |
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
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| last_updated | TIMESTAMPTZ | DEFAULT NOW(), ON UPDATE | Last update |

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
| name | VARCHAR | NOT NULL, UNIQUE | Category name |
| slug | VARCHAR | NOT NULL, UNIQUE, INDEX | URL-friendly slug |
| parent_id | UUID | FK → categories.id, INDEX | Parent category |
| applicable_to | ARRAY(String) | | POI types this category applies to |
| is_active | BOOLEAN | DEFAULT true | Whether the category is active |
| sort_order | INTEGER | DEFAULT 0 | Display sort order |

### poi_categories

Junction table for POI-category many-to-many relationship.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| poi_id | UUID | PK, FK → points_of_interest.id | POI reference |
| category_id | UUID | PK, FK → categories.id | Category reference |
| is_main | BOOLEAN | NOT NULL, DEFAULT false | Whether this is the POI's main category |

**Business rules:**
- Free business listings are limited to 1 category (enforced backend + frontend)
- Paid listings can have unlimited categories

### images

Image storage with variants. All POI photos are now stored in this table (consolidated from previous POI columns).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| poi_id | UUID | FK → points_of_interest.id, ON DELETE CASCADE | Associated POI |
| image_type | ENUM(ImageType) | NOT NULL | main, gallery, entry, etc. |
| image_context | VARCHAR(50) | | Contextual grouping (e.g., 'restroom_1', 'parking_2') |
| **File Information** |
| filename | VARCHAR(255) | NOT NULL | Stored filename |
| original_filename | VARCHAR(255) | | Original upload filename |
| mime_type | VARCHAR(50) | | MIME type (e.g., 'image/jpeg', 'application/pdf') |
| size_bytes | INTEGER | | File size in bytes |
| width | INTEGER | | Image width in pixels |
| height | INTEGER | | Image height in pixels |
| **Variant Tracking** |
| image_size_variant | VARCHAR(20) | | Size variant: 'original', 'thumbnail', 'medium', 'large' |
| parent_image_id | UUID | FK → images.id | Parent image (for size variants) |
| is_optimized | BOOLEAN | DEFAULT false | Whether this is an optimized version |
| **Cloud Storage** |
| storage_provider | VARCHAR(50) | DEFAULT 's3' | Always 's3' |
| storage_url | VARCHAR(500) | | S3 storage URL |
| storage_key | VARCHAR(255) | | S3 object key/path |
| **Image Processing** |
| quality | INTEGER | | JPEG/WebP quality setting |
| format_optimized | VARCHAR(10) | | Target format after optimization |
| compression_ratio | INTEGER | | Compression ratio achieved |
| **Metadata** |
| alt_text | TEXT | | Accessibility text |
| caption | TEXT | | Image caption |
| display_order | INTEGER | DEFAULT 0 | Sort order |
| function_tags | JSONB | | Array of string tags describing image purpose (e.g., "storefront", "interior", "menu"). See predefined tags below |
| **Tracking** |
| uploaded_by | UUID | FK → users.id | User who uploaded the image |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | ON UPDATE | Last update time |

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
| poi_id | UUID | PK, FK → points_of_interest.id |
| price_range | VARCHAR | $, $$, $$$, $$$$ |

### parks

| Column | Type | Description |
|--------|------|-------------|
| poi_id | UUID | PK, FK → points_of_interest.id |
| drone_usage_policy | VARCHAR | Drone policy |

### trails

| Column | Type | Description |
|--------|------|-------------|
| poi_id | UUID | PK, FK → points_of_interest.id |
| length_text | VARCHAR | Trail length as text (e.g., "2.5 miles", "1.2 km") |
| length_segments | JSONB | For multiple loops: `[{"name": "Top Loop", "length": "0.25 miles"}]` |
| difficulty | VARCHAR | easy, moderate, challenging, difficult, very_difficult, extreme |
| difficulty_description | TEXT | Auto-populated based on difficulty |
| route_type | VARCHAR | loop, out_and_back, point_to_point, connecting_network |
| trailhead_location | JSONB | `{"lat": 0, "lng": 0}` |
| trailhead_latitude | NUMERIC(10,7) | Start point lat |
| trailhead_longitude | NUMERIC(10,7) | Start point lng |
| trailhead_entrance_photo | VARCHAR | Trailhead photo URL |
| trailhead_exit_location | JSONB | `{"lat": 0, "lng": 0}` |
| trail_exit_latitude | NUMERIC(10,7) | End point lat |
| trail_exit_longitude | NUMERIC(10,7) | End point lng |
| trailhead_exit_photo | VARCHAR | Trail exit photo URL |
| trail_markings | TEXT | Trail marking information |
| trailhead_access_details | TEXT | Access details for trailhead |
| downloadable_trail_map | VARCHAR | URL to downloadable map file |
| trail_surfaces | JSONB | List of surface types |
| trail_conditions | JSONB | List of condition warnings |
| trail_experiences | JSONB | List of experience types |

### events

| Column | Type | Description |
|--------|------|-------------|
| poi_id | UUID | PK, FK → points_of_interest.id |
| start_datetime | TIMESTAMP WITH TIMEZONE | NOT NULL. Event start |
| end_datetime | TIMESTAMP WITH TIMEZONE | Event end |
| is_repeating | BOOLEAN | Whether this is a repeating event (default: false) |
| repeat_pattern | JSONB | Recurrence rule: `{"frequency": "weekly\|daily\|monthly\|yearly", "interval": 1, "days": ["MO","WE"]}` |
| organizer_name | VARCHAR | Organizer name |
| venue_settings | JSONB | List of venue settings: Indoor, Outdoor, Hybrid (In-Person and Online), Online Only |
| event_entry_notes | TEXT | Event entry description/notes |
| food_and_drink_info | TEXT | Food and drink information |
| coat_check_options | JSONB | List of coat check options |
| **Vendor Information** |
| has_vendors | BOOLEAN | Whether event has vendors (default: false) |
| vendor_types | JSONB | List of vendor types present |
| vendor_application_deadline | TIMESTAMP WITH TIMEZONE | Vendor application deadline |
| vendor_application_info | TEXT | Vendor application instructions |
| vendor_fee | VARCHAR | Vendor participation fee |
| vendor_requirements | TEXT | Requirements for vendors |
| vendor_poi_links | JSONB | List of dicts linking vendor POIs: `[{"poi_id": "uuid", ...}]` |
| **Venue Inheritance** |
| venue_poi_id | UUID | FK → points_of_interest.id. Links event to a venue (business or park) for inheriting location, hours, amenities, etc. |
| venue_inheritance | JSONB | Per-section config controlling which fields are inherited from the venue. Values: `"as_is"`, `"use_and_add"`, `"do_not_use"` (e.g., `{"parking": "as_is", "hours": "use_and_add", "amenities": "do_not_use"}`) |
| **Recurring Events** |
| series_id | UUID | Groups recurring event instances into a series. Indexed for fast lookups |
| parent_event_id | UUID | FK → events.poi_id. Links a child event instance to its parent/template event |
| excluded_dates | JSONB | Array of ISO date strings excluded from recurrence (e.g., `["2026-07-04", "2026-12-25"]`) |
| recurrence_end_date | TIMESTAMP WITH TIMEZONE | When the recurrence pattern ends |
| manual_dates | JSONB | Array of ISO datetime strings for irregular/manually specified occurrences (e.g., `["2026-03-01T18:00:00Z"]`) |
| **Event Status & Rescheduling (Tasks 134-136)** |
| event_status | VARCHAR(100) | Event status from `EventStatus` enum: Scheduled, Canceled, Postponed, Updated Date and/or Time, Rescheduled, Moved Online, Unofficial Proposed Date (default: Scheduled) |
| status_explanation | VARCHAR(80) | Short explanation text for status changes (required for: Updated Date and/or Time, Postponed, Moved Online) |
| cancellation_paragraph | TEXT | Longer explanation shown when event is cancelled or postponed |
| contact_organizer_toggle | BOOLEAN | Show "Contact Organizer" button on cancelled/postponed events (default: false) |
| new_event_link | VARCHAR | UUID string of the replacement event POI (not a FK for flexibility) |
| rescheduled_from_event_id | UUID | FK → events.poi_id. Links to the original event this was rescheduled from |
| **Primary Display Category (Task 137)** |
| primary_display_category | VARCHAR(100) | Backend-only display category override (no UI control yet) |
| **Extended Organizer (Task 138)** |
| organizer_email | VARCHAR | Organizer contact email |
| organizer_phone | VARCHAR | Organizer contact phone |
| organizer_website | VARCHAR | Organizer website URL |
| organizer_social_media | JSONB | Organizer social media links (key-value pairs) |
| organizer_poi_id | UUID | FK → points_of_interest.id. Links organizer to an existing POI |
| **Cost & Ticketing (Task 139)** |
| cost_type | VARCHAR(50) | Cost classification: free, single_price, range |
| ticket_links | JSONB | Array of ticket purchase links `[{"url": "...", "title": "..."}]` |
| **Sponsors (Task 140)** |
| sponsors | JSONB | Array of sponsor objects `[{"name": "...", "url": "...", "level": "..."}]` |

Migrations:
- `e5f6g7h8i9j0_add_venue_inheritance_and_recurring`
- `f6g7h8i9j0k1_event_backend_tasks_134_149` (event status, extended organizer, cost/ticketing, sponsors, event_suggestions table)
- `g7h8i9j0k1l2_listing_type_changes_171_172` (data migration: paid_founding → paid, sponsor → sponsor_platform)
- `h8i9j0k1l2m3_add_event_status_explanation` (adds status_explanation column to events)

---

## Supporting Tables

### attributes

Dynamic configurable fields.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR | Attribute name (e.g., "Live Music") |
| type | VARCHAR | Attribute type (e.g., "ENTERTAINMENT", "PAYMENT_METHOD", "AMENITY") |
| parent_id | UUID | FK → attributes.id. Self-referencing parent for hierarchy |
| applicable_to | ARRAY(String) | POI types this attribute applies to |
| is_active | BOOLEAN | Whether the attribute is active (default: true) |
| sort_order | INTEGER | Display sort order (default: 0) |

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

### event_suggestions

Public form for users to suggest new events. Uses isolated `nearby_forms` DB role.

Created by migration `f6g7h8i9j0k1_event_backend_tasks_134_149` (Task 153).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| event_name | VARCHAR(255) | NOT NULL | Suggested event name |
| event_description | TEXT | | Event description |
| event_date | VARCHAR(100) | | Approximate date/time |
| event_location | VARCHAR(255) | | Event location |
| organizer_name | VARCHAR(100) | | Organizer name |
| organizer_email | VARCHAR(255) | NOT NULL | Contact email |
| organizer_phone | VARCHAR(50) | | Contact phone |
| additional_info | TEXT | | Additional details |
| status | VARCHAR(50) | DEFAULT 'pending' | Suggestion review status |
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
- `SELECT, INSERT` on: waitlist, community_interest, contact_submissions, feedback_submissions, business_claims, event_suggestions

**Cannot access:** points_of_interest, businesses, parks, trails, events, images, users, categories, or any other POI-related table.

**Connection:** Via `FORMS_DATABASE_URL` env var (separate SQLAlchemy engine in nearby-app). Falls back to `DATABASE_URL` if not set.

Migration: `nearby-admin/backend/alembic/versions/c3f4g5h6i7j8_create_form_tables.py`

---

## Enums

Canonical enum definitions live in `shared/models/enums.py` and are imported by both backends.

### POIType

```python
class POIType(enum.Enum):
    BUSINESS = "BUSINESS"
    SERVICES = "SERVICES"
    PARK = "PARK"
    TRAIL = "TRAIL"
    EVENT = "EVENT"
    YOUTH_ACTIVITIES = "YOUTH_ACTIVITIES"
    JOBS = "JOBS"
    VOLUNTEER_OPPORTUNITIES = "VOLUNTEER_OPPORTUNITIES"
    DISASTER_HUBS = "DISASTER_HUBS"
```

### EventStatus

Defines valid event lifecycle states. Used by the `events.event_status` column.

```python
class EventStatus(enum.Enum):
    SCHEDULED = "Scheduled"
    CANCELED = "Canceled"
    POSTPONED = "Postponed"
    UPDATED_DATE_TIME = "Updated Date and/or Time"
    RESCHEDULED = "Rescheduled"
    MOVED_ONLINE = "Moved Online"
    UNOFFICIAL_PROPOSED = "Unofficial Proposed Date"
```

**Status transition rules** are defined in `shared/utils/event_status.py`:
- "Scheduled" can transition to any other status
- "Canceled" and "Rescheduled" can only return to "Scheduled"
- "Postponed" can go to Canceled, Rescheduled, or Updated Date and/or Time
- "Moved Online" can go to Canceled, Postponed, or Rescheduled
- "Unofficial Proposed Date" can go to Canceled or Postponed
- Any status can always return to "Scheduled"

**Status explanation** (`status_explanation` VARCHAR(80)) is required for: Updated Date and/or Time, Postponed, Moved Online.

### ImageType

```python
class ImageType(enum.Enum):
    main = "main"
    gallery = "gallery"
    entry = "entry"
    parking = "parking"
    restroom = "restroom"
    rental = "rental"
    playground = "playground"
    menu = "menu"
    trail_head = "trail_head"
    trail_exit = "trail_exit"
    map = "map"
    downloadable_map = "downloadable_map"
```

---

## Shared Constants & Utilities

### Field Options (`shared/constants/field_options.py`)

Python source of truth for field option lists used by backend validation. Key additions:

| Constant | Description |
|----------|-------------|
| `LISTING_TYPES` | Valid listing type values: free, paid, sponsor_platform, sponsor_state, sponsor_county, sponsor_town, community_comped |
| `EVENT_STATUS_OPTIONS` | Valid event status strings matching `EventStatus` enum values |
| `EVENT_STATUS_HELPER_TEXT` | Human-readable description for each event status |
| `EVENT_STATUS_EXPLANATION_REQUIRED` | Statuses requiring a `status_explanation`: Updated Date and/or Time, Postponed, Moved Online |
| `EVENT_COST_TYPES` | Valid cost type values: free, single_price, range |
| `VENUE_SETTINGS` | Valid venue setting values: Indoor, Outdoor, Hybrid (In-Person and Online), Online Only |
| `BUSINESS_STATUS_OPTIONS` | Valid business status values (Fully Open, Partly Open, etc.) |

### Utility Modules (`shared/utils/`)

| Module | Purpose |
|--------|---------|
| `shared/utils/event_status.py` | Event status transition validation. Defines `EVENT_STATUS_TRANSITIONS` dict and `validate_status_transition(current, new)` function |
| `shared/utils/recurring_events.py` | Recurring event date expansion. Uses `dateutil.rrule` to expand `repeat_pattern` JSONB into concrete datetimes within a date range, respecting `excluded_dates`, `manual_dates`, and `recurrence_end_date`. Max horizon: 60 months |
| `shared/utils/venue_inheritance.py` | Venue inheritance resolution. Merges venue POI data into event data based on `venue_inheritance` config. Modes: `"as_is"` (use venue data), `"use_and_add"` (merge venue + event), `"do_not_use"` (keep event data). Controlled sections: parking, restrooms, accessibility, hours, amenities, pet_policy, drone_policy |
| `shared/utils/hours_resolution.py` | Hours resolution engine (Python port of `hoursUtils.js`). Resolves effective hours for a date with override precedence: (1) Exception hours, (2) Holiday hours (US holidays computed by formula), (3) Seasonal hours, (4) Regular hours. Public API: `get_effective_hours_for_date(hours_data, date)` |

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
