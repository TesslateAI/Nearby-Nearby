# API Reference

## Overview

Both applications expose REST APIs via FastAPI. All endpoints return JSON.

**Base URLs:**
- nearby-admin: `http://localhost:8001/api`
- nearby-app: `http://localhost:8002/api`

---

## nearby-admin API

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Get JWT token | No |
| GET | `/api/auth/users/me` | Get current user | Yes |
| POST | `/api/auth/users/` | Create user | Yes (Admin) |

#### POST /api/auth/login

Request:
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer"
}
```

---

### POI Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/pois/` | Create POI | Yes (Admin/Editor) |
| GET | `/api/pois/` | List published POIs | No |
| GET | `/api/admin/pois/` | List all POIs (incl. drafts) | Yes |
| GET | `/api/pois/{poi_id}` | Get POI by ID | No |
| PUT | `/api/pois/{poi_id}` | Update POI | Yes (Admin/Editor) |
| DELETE | `/api/pois/{poi_id}` | Delete POI | Yes (Admin) |
| GET | `/api/pois/search` | Search POIs (public) | No |
| GET | `/api/admin/pois/search` | Search all POIs | Yes |
| GET | `/api/pois/search-by-location` | Location search | No |
| GET | `/api/pois/{poi_id}/nearby` | Get nearby POIs | No |
| GET | `/api/pois/venues/list` | List available venues (BUSINESS/PARK) | Yes (Admin/Editor) |
| GET | `/api/pois/{poi_id}/venue-data` | Get venue data for event | Yes (Admin/Editor) |
| GET | `/api/event-statuses` | Get event statuses with transitions | Yes (Admin/Editor) |

#### POST /api/pois/

Request:
```json
{
  "poi_type": "BUSINESS",
  "name": "Joe's Coffee",
  "address_city": "Pittsboro",
  "address_state": "NC",
  "phone": "919-555-0123",
  "website": "https://joescoffee.com",
  "teaser_description": "Best coffee in town",
  "location": {
    "type": "Point",
    "coordinates": [-79.1772, 35.7198]
  },
  "category_ids": ["uuid-1", "uuid-2"],
  "publication_status": "draft"
}
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "poi_type": "BUSINESS",
  "name": "Joe's Coffee",
  "slug": "joes-coffee-pittsboro",
  "publication_status": "draft",
  ...
}
```

#### GET /api/pois/search

Query Parameters:
- `q` (string): Search query
- `limit` (int): Max results (default: 10)

Response:
```json
[
  {
    "id": "uuid",
    "name": "Joe's Coffee",
    "slug": "joes-coffee-pittsboro",
    "poi_type": "BUSINESS",
    "address_city": "Pittsboro",
    "similarity": 0.85
  }
]
```

#### GET /api/pois/{poi_id}/venue-data

Returns venue-compatible data for an event. Only works for **BUSINESS** and **PARK** POI types. Used by the admin frontend to pull address, parking, accessibility, restroom data, and copyable image metadata from a venue into an event form.

Response:
```json
{
  "venue_id": "uuid",
  "venue_name": "Jordan Lake Brewing",
  "venue_type": "BUSINESS",
  "address_full": "123 Main St, Pittsboro, NC 27312",
  "address_street": "123 Main St",
  "address_city": "Pittsboro",
  "address_state": "NC",
  "address_zip": "27312",
  "location": {
    "type": "Point",
    "coordinates": [-79.1772, 35.7198]
  },
  "front_door_latitude": 35.7198,
  "front_door_longitude": -79.1772,
  "phone_number": "919-555-0123",
  "parking_types": ["lot", "street"],
  "parking_notes": "Free parking behind building",
  "wheelchair_accessible": ["entrance", "restroom"],
  "public_toilets": ["indoor"],
  "hours": {...},
  "amenities": {...},
  "copyable_images": [
    {
      "id": "uuid",
      "image_type": "entry",
      "filename": "front-door.jpg",
      "url": "https://bucket.s3.amazonaws.com/...",
      "thumbnail_url": "https://bucket.s3.amazonaws.com/.../thumbnail_..."
    }
  ]
}
```

Returns `400` if the POI type is not BUSINESS or PARK. Returns `404` if the POI does not exist.

---

#### Event Schema Fields

Event create, update, and response schemas include the following fields for venue inheritance, recurring events, vendors, and event status:

| Field | Type | Description |
|-------|------|-------------|
| **Core Event Fields** |
| `start_datetime` | datetime | Event start (required on create, optional on update) |
| `end_datetime` | datetime (optional) | Event end |
| `is_repeating` | boolean | Whether the event recurs (default: false) |
| `repeat_pattern` | object (optional) | `{"frequency": "weekly\|daily\|monthly\|yearly", ...}` |
| `organizer_name` | string (optional) | Organizer display name |
| `venue_settings` | list[string] (optional) | Indoor, Outdoor, Hybrid, Online Only |
| `event_entry_notes` | string (optional) | Notes about event entry |
| `food_and_drink_info` | string (optional) | Food and drink details |
| `coat_check_options` | list[string] (optional) | Yes, No, Private Lockers |
| **Venue Inheritance** |
| `venue_poi_id` | UUID (optional) | Links the event to a venue (BUSINESS or PARK) POI |
| `venue_inheritance` | object (optional) | Tracks which fields were inherited from the venue |
| **Recurring Events** |
| `series_id` | UUID (optional) | Groups recurring event instances into a series |
| `parent_event_id` | UUID (optional) | Links to the parent/template event for a recurring series |
| `excluded_dates` | list[string] (optional) | Dates excluded from a recurring series (ISO format) |
| `recurrence_end_date` | datetime (optional) | End date for generating recurring instances |
| `manual_dates` | list[string] (optional) | Manually specified dates for irregular recurring events |
| **Vendors** |
| `has_vendors` | boolean | Whether the event has vendors (default: false) |
| `vendor_types` | list[string] (optional) | Types of vendors |
| `vendor_application_deadline` | datetime (optional) | Deadline for vendor applications |
| `vendor_application_info` | string (optional) | Vendor application details |
| `vendor_fee` | string (optional) | Vendor participation fee |
| `vendor_requirements` | string (optional) | Requirements for vendors |
| `vendor_poi_links` | list[object] (optional) | `[{"poi_id": "uuid", "vendor_type": "Food"}]` — links to vendor POIs |
| **Event Status (Tasks 134-136)** |
| `event_status` | string (optional) | Scheduled, Canceled, Postponed, Updated Date and/or Time, Rescheduled, Moved Online, Unofficial Proposed Date (default: Scheduled) |
| `status_explanation` | string (optional) | Short explanation for status changes (max 80 chars). Required for: Updated Date and/or Time, Postponed, Moved Online |
| `cancellation_paragraph` | string (optional) | Detailed explanation for cancelled/postponed events |
| `contact_organizer_toggle` | boolean (optional) | Show "Contact Organizer" button (default: false) |
| `new_event_link` | string (optional) | UUID string of replacement event POI |
| `rescheduled_from_event_id` | UUID (optional) | Original event this was rescheduled from |
| **Primary Display Category (Task 137)** |
| `primary_display_category` | string (optional) | Display category override (backend-only, no UI control) |
| **Extended Organizer (Task 138)** |
| `organizer_email` | string (optional) | Organizer contact email |
| `organizer_phone` | string (optional) | Organizer contact phone |
| `organizer_website` | string (optional) | Organizer website URL |
| `organizer_social_media` | object (optional) | Organizer social media links `{"instagram": "...", "facebook": "..."}` |
| `organizer_poi_id` | UUID (optional) | Links organizer to an existing POI |
| **Cost & Ticketing (Task 139)** |
| `cost_type` | string (optional) | free, single_price, range |
| `ticket_links` | list[object] (optional) | `[{"url": "...", "title": "..."}]` |
| **Sponsors (Task 140)** |
| `sponsors` | list[object] (optional) | `[{"name": "...", "poi_id": "...", "tier": "...", "website": "...", "logo_url": "..."}]` — supports both linked POI sponsors and manual entries |

#### GET /api/pois/venues/list

List all POIs that can be used as venues (BUSINESS and PARK types). Used for venue selection when creating events.

**Auth**: Admin/Editor required.

Query Parameters:
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Max results (default: 500)
- `search` (string, optional): Filter venues by name

Response: Array of POI objects (BUSINESS and PARK types only), sorted by name.

---

#### GET /api/event-statuses

Returns all event statuses with their helper text and valid status transitions. Used by the admin frontend to populate status dropdowns and enforce transition rules.

**Auth**: Admin/Editor required.

Response:
```json
[
  {
    "status": "Scheduled",
    "helper_text": "Event is confirmed and happening as planned.",
    "valid_transitions": [
      "Canceled", "Postponed", "Updated Date and/or Time",
      "Rescheduled", "Moved Online", "Unofficial Proposed Date"
    ]
  },
  {
    "status": "Canceled",
    "helper_text": "Event has been permanently canceled and will not be rescheduled.",
    "valid_transitions": ["Scheduled"]
  },
  {
    "status": "Postponed",
    "helper_text": "Event is temporarily on hold. A new date has not been set yet.",
    "valid_transitions": ["Scheduled", "Canceled", "Rescheduled", "Updated Date and/or Time"]
  }
]
```

**Status Transition Rules:**
- "Scheduled" can transition to any other status
- "Canceled" and "Rescheduled" can only return to "Scheduled"
- "Return to Scheduled" is always allowed from any status
- See `shared/utils/event_status.py` for the full transition matrix

---

#### POST /api/pois/{poi_id}/reschedule

Reschedule an event by cloning the POI and Event with new dates. The original event is marked as "Rescheduled" with a link to the new event.

**Auth**: Admin/Editor required.

Request:
```json
{
  "new_start_datetime": "2026-04-15T18:00:00Z",
  "new_end_datetime": "2026-04-15T22:00:00Z"
}
```

Response (201): Full POI object for the newly created event.

**Side effects:**
- Original event's `event_status` set to "Rescheduled"
- Original event's `new_event_link` set to the new event POI's UUID
- New event's `rescheduled_from_event_id` set to the original POI's UUID
- New event's `event_status` set to "Scheduled"

**Date Change Guard (Task 157):** When updating an event, if the event status is "Updated Date and/or Time" and dates are being changed, the status must be set to "Rescheduled" — otherwise the update returns 400.

---

### Category Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/categories/` | Create category | Yes (Admin) |
| GET | `/api/categories/tree` | Get all categories as tree | No |
| GET | `/api/categories/by-poi-type/{type}` | Get categories for POI type | No |
| GET | `/api/categories/tree/{type}` | Get category tree for type | No |
| GET | `/api/categories/{id}` | Get single category | No |
| PUT | `/api/categories/{id}` | Update category | Yes (Admin) |
| DELETE | `/api/categories/{id}` | Delete category | Yes (Admin) |

#### GET /api/categories/tree

Response:
```json
[
  {
    "id": "uuid",
    "name": "Food & Drink",
    "slug": "food-drink",
    "children": [
      {
        "id": "uuid",
        "name": "Coffee Shops",
        "slug": "coffee-shops",
        "children": []
      }
    ]
  }
]
```

---

### Image Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/images/upload/{poi_id}` | Upload image | Yes |
| POST | `/api/images/upload-multiple/{poi_id}` | Upload multiple images | Yes |
| POST | `/api/images/copy/{source_poi_id}/to/{target_poi_id}` | Copy images between POIs | Yes |
| GET | `/api/images/image/{image_id}` | Get image | No |
| GET | `/api/images/poi/{poi_id}` | Get POI images | No |
| PUT | `/api/images/image/{image_id}` | Update metadata | Yes |
| DELETE | `/api/images/image/{image_id}` | Delete image | Yes |
| PUT | `/api/images/poi/{poi_id}/reorder/{image_type}` | Reorder images by type | Yes |

#### POST /api/images/upload/{poi_id}

Request (multipart/form-data):
- `file`: Image file (JPEG, PNG, WebP, PDF)
- `image_type`: main, gallery, entry, parking, rental, etc.
- `alt_text`: Accessibility text
- `caption`: Image caption
- `function_tags` (optional): JSON string of tag array (e.g. `["storefront", "interior"]`). Falls back to wrapping a single string in an array.

Response:
```json
{
  "id": "uuid",
  "poi_id": "uuid",
  "image_type": "main",
  "storage_url": "https://bucket.s3.amazonaws.com/...",
  "thumbnail_url": "https://bucket.s3.amazonaws.com/.../thumbnail_...",
  "alt_text": "Coffee shop interior",
  "function_tags": ["storefront", "interior"],
  "width": 1920,
  "height": 1080
}
```

**Note:** The `thumbnail_url` field provides a pre-generated thumbnail variant for faster loading in lists and grids. The `function_tags` field is `null` when no tags have been set.

#### GET /api/images/poi/{poi_id}

Query Parameters:
- `image_type` (string, optional): Filter by image type (e.g. `main`, `gallery`, `entry`)
- `function_tag` (string, optional): Filter images by a specific function tag (e.g. `"storefront"`)

Response: Array of image objects (see image response schema below).

#### POST /api/images/upload-multiple/{poi_id}

Upload multiple images at once (primarily for galleries).

Request (multipart/form-data):
- `files`: List of image files to upload
- `image_type`: Type of images (usually 'gallery')

Response:
```json
{
  "uploaded": [
    {
      "id": "uuid",
      "filename": "photo1.jpg",
      "url": "https://bucket.s3.amazonaws.com/...",
      "thumbnail_url": "https://bucket.s3.amazonaws.com/.../thumbnail_..."
    }
  ],
  "failed": [],
  "message": "Successfully uploaded 3 images"
}
```

#### PUT /api/images/image/{image_id}

Request:
```json
{
  "alt_text": "Updated alt text",
  "caption": "Updated caption",
  "display_order": 2,
  "function_tags": ["storefront", "exterior"]
}
```

All fields are optional. Only provided fields are updated.

#### POST /api/images/copy/{source_poi_id}/to/{target_poi_id}

Copy image records from one POI to another. Creates new database records that reference the same S3 objects (no binary data is duplicated). Primarily used to copy venue images (entry, parking, restroom) to an event.

Query Parameters:
- `image_types` (list[string], required): Image types to copy (e.g. `entry`, `parking`, `restroom`)

Constraints:
- Source POI must be a **BUSINESS** or **PARK**
- Target POI must be an **EVENT**

Response:
```json
{
  "uploaded": [
    {
      "id": "uuid",
      "filename": "copy_original.jpg",
      "url": "https://bucket.s3.amazonaws.com/...",
      "thumbnail_url": "https://bucket.s3.amazonaws.com/.../thumbnail_...",
      "message": "Copied entry image from venue"
    }
  ],
  "failed": [],
  "message": "Successfully copied 3 images"
}
```

---

### Relationship Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/relationships/` | Create relationship | Yes |
| GET | `/api/relationships/` | List relationships | No |
| GET | `/api/relationships/{source_id}` | Get POI relationships | No |
| DELETE | `/api/relationships/{source}/{target}/{type}` | Delete relationship | Yes |

#### POST /api/relationships/

Request:
```json
{
  "source_poi_id": "uuid",
  "target_poi_id": "uuid",
  "relationship_type": "event_venue"
}
```

---

### Attribute Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/attributes/` | Create attribute | Yes (Admin) |
| GET | `/api/attributes/` | List attributes | No |
| GET | `/api/attributes/by-type/{type}` | Get by attribute type | No |
| GET | `/api/attributes/for-poi-type/{type}` | Get for POI type | No |
| GET | `/api/attributes/hierarchy` | Get attribute hierarchy | No |
| PUT | `/api/attributes/{id}` | Update attribute | Yes (Admin) |
| DELETE | `/api/attributes/{id}` | Delete attribute | Yes (Admin) |

---

### Primary Type Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/primary-types/` | Create primary type | Yes (Admin) |
| GET | `/api/primary-types/` | List primary types | No |
| GET | `/api/primary-types/{id}` | Get primary type | No |
| PUT | `/api/primary-types/{id}` | Update primary type | Yes (Admin) |
| DELETE | `/api/primary-types/{id}` | Delete primary type | Yes (Admin) |

---

## nearby-app API

### Search Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pois/search` | Multi-signal search (keyword + trigram + full-text + semantic) |
| GET | `/api/pois/semantic-search` | ML-powered semantic search (routed through multi-signal engine) |
| GET | `/api/pois/hybrid-search` | Combined multi-signal hybrid search |

All search endpoints automatically exclude past events and events with Canceled or Rescheduled status from results.

#### GET /api/pois/search

Query Parameters:
- `q` (string, required): Search query (min 1 char)
- `poi_type` (string, optional): Filter by POI type (BUSINESS, PARK, TRAIL, EVENT)
- `date_from` (string, optional): Filter events starting after this date (YYYY-MM-DD)
- `date_to` (string, optional): Filter events starting before this date (YYYY-MM-DD)
- `event_status` (string, optional): Filter by event status

Response:
```json
[
  {
    "id": "uuid",
    "name": "Joe's Coffee",
    "slug": "joes-coffee-pittsboro",
    "poi_type": "BUSINESS",
    "address_city": "Pittsboro",
    "main_category": {"id": "uuid", "name": "Coffee Shops"}
  }
]
```

#### GET /api/pois/semantic-search

Query Parameters:
- `q` (string, required): Natural language query (min 1 char)
- `limit` (int): Max results (default: 10, max: 50)
- `poi_type` (string, optional): Filter by POI type
- `date_from` (string, optional): Filter events starting after (YYYY-MM-DD)
- `date_to` (string, optional): Filter events starting before (YYYY-MM-DD)
- `event_status` (string, optional): Filter by event status

Example: `?q=place to get coffee and work on laptop`

#### GET /api/pois/hybrid-search

Query Parameters:
- `q` (string, required): Search query (min 1 char)
- `limit` (int): Max results (default: 10, max: 50)
- `poi_type` (string, optional): Filter by POI type (BUSINESS, PARK, TRAIL, EVENT)
- `date_from` (string, optional): Filter events starting after (YYYY-MM-DD)
- `date_to` (string, optional): Filter events starting before (YYYY-MM-DD)
- `event_status` (string, optional): Filter by event status

---

### POI Detail Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pois/{poi_id}` | Get POI by UUID (with venue inheritance) |
| GET | `/api/pois/by-slug/{slug}` | Get POI by slug (with venue inheritance) |
| GET | `/api/pois/by-type/{type}` | List POIs by type |
| GET | `/api/pois/by-category/{slug}` | List POIs in category |
| GET | `/api/pois/{poi_id}/effective-hours` | Get resolved hours for a date |
| GET | `/api/events/in-range` | Get events (incl. recurring) in date range |
| GET | `/api/pois/{poi_id}/vendors` | Resolve vendor POI links for an event |
| GET | `/api/pois/{poi_id}/sponsors` | Resolve sponsor POI links for an event |

#### GET /api/pois/by-slug/{slug}

Returns a full POI detail. For EVENT POIs with a `venue_poi_id`, venue inheritance is automatically applied -- inheritable fields (parking, accessibility, restrooms, hours, amenities, pets, drone policy) are resolved from the linked venue when not set on the event itself.

Response:
```json
{
  "id": "uuid",
  "poi_type": "BUSINESS",
  "name": "Joe's Coffee",
  "slug": "joes-coffee-pittsboro",
  "teaser_paragraph": "Best coffee in town",
  "description_long": "...",
  "address_street": "123 Main St",
  "address_city": "Pittsboro",
  "phone_number": "919-555-0123",
  "website_url": "https://joescoffee.com",
  "hours": {...},
  "location": {
    "type": "Point",
    "coordinates": [-79.1772, 35.7198]
  },
  "images": [...],
  "categories": [...],
  "business": {
    "price_range": "$$"
  }
}
```

#### GET /api/pois/by-type/{type}

Query Parameters:
- `include_past_events` (bool, optional): Include past events in results (default: false)

Automatically excludes Canceled and Rescheduled events. Valid types: BUSINESS, PARK, TRAIL, EVENT.

#### GET /api/pois/by-category/{slug}

Query Parameters:
- `include_past_events` (bool, optional): Include past events in results (default: false)

Automatically excludes Canceled and Rescheduled events. Returns the category metadata along with matching POIs. Event POIs include event-specific data (start/end dates, status, organizer, venue, cost_type).

#### GET /api/pois/{poi_id}/effective-hours

Returns the resolved hours for a POI on a given date, applying the override precedence chain: Exceptions > Holidays > Seasonal > Regular.

Query Parameters:
- `date` (string, optional): Date in `YYYY-MM-DD` format. Defaults to today.

Response:
```json
{
  "hours": {
    "open": "09:00",
    "close": "17:00"
  },
  "source": "regular",
  "label": null
}
```

Possible `source` values: `exception`, `holiday`, `seasonal`, `regular`, `none`.

When a holiday or exception applies, `label` contains the name (e.g., `"Christmas Day"`, `"Staff Meeting"`).

Returns `404` if the POI does not exist. Returns `400` if the date format is invalid.

#### GET /api/events/in-range

Get all events (including expanded recurring event instances) within a date range. Non-repeating events are included if their `start_datetime` falls within the range. Recurring events are expanded using their `repeat_pattern` with `excluded_dates` and `manual_dates` applied.

Automatically excludes Canceled and Rescheduled events.

Query Parameters:
- `date_from` (string, required): Start date (YYYY-MM-DD)
- `date_to` (string, required): End date (YYYY-MM-DD)

Response:
```json
[
  {
    "id": "uuid",
    "name": "Farmers Market",
    "slug": "farmers-market-pittsboro",
    "occurrence_datetime": "2026-03-07T09:00:00+00:00",
    "address_city": "Pittsboro",
    "event_status": "Scheduled"
  }
]
```

Results are sorted by `occurrence_datetime`. A single recurring event may produce multiple entries (one per occurrence in range).

Returns `400` if the date format is invalid.

#### GET /api/pois/{poi_id}/vendors

Resolve the `vendor_poi_links` JSONB field on an event into published POI summaries. Returns enriched vendor data by looking up each linked POI.

Response:
```json
[
  {
    "id": "uuid",
    "name": "Joe's BBQ",
    "slug": "joes-bbq-pittsboro",
    "poi_type": "BUSINESS",
    "address_city": "Pittsboro",
    "featured_image": "https://...",
    "vendor_type": "Food"
  }
]
```

Returns `404` if the POI is not found or not published. Returns an empty array if the event has no vendors or no vendor POI links.

#### GET /api/pois/{poi_id}/sponsors

Resolve the `sponsors` JSONB field on an event. Linked sponsors (those with a `poi_id`) are enriched with POI data. Manual sponsors (those without a `poi_id`) are passed through as-is.

Response:
```json
[
  {
    "poi_id": "uuid",
    "name": "Local Bank",
    "slug": "local-bank-pittsboro",
    "poi_type": "BUSINESS",
    "address_city": "Pittsboro",
    "featured_image": "https://...",
    "tier": "Gold"
  },
  {
    "name": "Community Foundation",
    "tier": "Silver",
    "website": "https://example.com",
    "logo_url": "https://..."
  }
]
```

Returns `404` if the POI is not found or not published. Returns an empty array if the event has no sponsors.

---

### Sitemap Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sitemap-events.xml` | XML sitemap for published events |

**Note:** Sitemap endpoints are served at the root level (no `/api` prefix).

#### GET /sitemap-events.xml

Generates an XML sitemap for published event POIs. Excludes Canceled and Rescheduled events. Upcoming events receive higher priority (0.8) and daily change frequency; past events receive lower priority (0.4) and monthly change frequency.

Response (application/xml):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nearbynearby.com/events/farmers-market-pittsboro</loc>
    <priority>0.8</priority>
    <changefreq>daily</changefreq>
  </url>
</urlset>
```

---

### Geospatial Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nearby` | Get nearest 8 POIs from coordinates |
| GET | `/api/pois/{poi_id}/nearby` | Get nearby POIs within radius |

#### GET /api/nearby

Query Parameters:
- `latitude` (float, required): Latitude (-90 to 90)
- `longitude` (float, required): Longitude (-180 to 180)
- `include_past_events` (bool, optional): Include past events in results (default: false)

Automatically excludes Canceled and Rescheduled events unless `include_past_events` is true.

Response:
```json
[
  {
    "id": "uuid",
    "name": "Joe's Coffee",
    "slug": "joes-coffee-pittsboro",
    "poi_type": "BUSINESS",
    "distance_meters": 483.0,
    "location": {...}
  }
]
```

#### GET /api/pois/{poi_id}/nearby

Query Parameters:
- `radius_miles` (float): Search radius in miles (default: 5)
- `include_past_events` (bool, optional): Include past events in results (default: false)

Automatically excludes Canceled and Rescheduled events.

---

### Category Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories with POI counts |

Response:
```json
[
  {
    "id": "uuid",
    "name": "Coffee Shops",
    "slug": "coffee-shops",
    "poi_count": 12
  }
]
```

---

### Waitlist Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/waitlist` | Add email to waitlist | 5/min |
| GET | `/api/waitlist/count` | Get waitlist count | - |

#### POST /api/waitlist

Request:
```json
{
  "email": "user@example.com"
}
```

Response (201):
```json
{
  "message": "Successfully added to waitlist"
}
```

Error (409 - duplicate):
```json
{
  "detail": "Email already registered"
}
```

---

### Public Form Endpoints

All form endpoints use the isolated `nearby_forms` database role and are rate-limited via `slowapi`.

#### Community Interest

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/community-interest` | Submit community interest form | 5/min |

Request:
```json
{
  "location": "Pittsboro, Chatham County, NC",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": ["Resident", "Business Owner"],
  "why": "We need better local discovery.",
  "how_heard": "Instagram"
}
```

Response (201):
```json
{
  "id": "uuid",
  "location": "Pittsboro, Chatham County, NC",
  "created_at": "2026-01-15T10:30:00Z",
  "message": "Thank you for your interest!"
}
```

Only `location` is required. All other fields are optional.

#### Contact

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/contact` | Submit contact form | 5/min |

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I have a question about the platform."
}
```

Response (201):
```json
{
  "id": "uuid",
  "created_at": "2026-01-15T10:30:00Z",
  "message": "Thank you for reaching out!"
}
```

All fields required. Message must be 10-5000 characters.

#### Feedback

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/feedback` | Submit feedback with optional file uploads | 2/min |

Request (multipart/form-data):
- `feedback` (string, required): Feedback text (10-5000 chars)
- `email` (string, optional): Contact email
- `files` (UploadFile[], optional): Up to 10 image files, max 10MB each (JPEG, PNG, GIF, WebP)

Response (201):
```json
{
  "id": "uuid",
  "file_urls": ["https://bucket.s3.amazonaws.com/feedback/uuid/screenshot.png"],
  "created_at": "2026-01-15T10:30:00Z",
  "message": "Thank you for your feedback!"
}
```

#### Business Claims

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/business-claims` | Submit business claim request | 5/min |

Request:
```json
{
  "business_name": "Joe's Coffee",
  "contact_name": "Joe Smith",
  "contact_phone": "919-555-0100",
  "contact_email": "joe@coffee.com",
  "business_address": "123 Main St, Pittsboro, NC 27312",
  "how_heard": "Facebook ad",
  "anything_else": "We also do catering!"
}
```

Response (201):
```json
{
  "id": "uuid",
  "business_name": "Joe's Coffee",
  "created_at": "2026-01-15T10:30:00Z",
  "message": "Thank you for claiming your business!"
}
```

Required: business_name, contact_name, contact_phone, contact_email, business_address. Optional: how_heard, anything_else.

#### Event Suggestions

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/event-suggestions` | Submit an event suggestion | 5/min |

Request:
```json
{
  "event_name": "Chatham County Fair",
  "event_description": "Annual county fair with rides and food",
  "event_date": "September 2026",
  "event_location": "Pittsboro, NC",
  "organizer_name": "Jane Doe",
  "organizer_email": "jane@example.com",
  "organizer_phone": "919-555-0100",
  "additional_info": "Has been running for 20 years"
}
```

Response (201):
```json
{
  "id": "uuid",
  "created_at": "2026-02-27T10:30:00Z",
  "message": "Thank you for suggesting an event!"
}
```

Required: event_name, organizer_email. All other fields optional. Sends ntfy.sh notification on submission.

---

## Authentication

### JWT Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token payload:
```json
{
  "sub": "user@example.com",
  "exp": 1704067200
}
```

### Role-Based Access

| Role | Permissions |
|------|-------------|
| Admin | Full access to all endpoints |
| Editor | Create/update POIs, images, relationships |
| Viewer | Read-only access |

---

## Error Responses

All errors return JSON with `detail` field:

```json
{
  "detail": "Error message here"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 422 | Unprocessable Entity (validation failed) |
| 500 | Internal Server Error |

---

## Rate Limiting

Public form endpoints are rate-limited using `slowapi` with `get_remote_address` as the key function:

| Endpoint Group | Limit | Reason |
|---------------|-------|--------|
| `/api/waitlist` | 5/min | Spam prevention |
| `/api/community-interest` | 5/min | Spam prevention |
| `/api/contact` | 5/min | Spam prevention |
| `/api/feedback` | 2/min | File upload resource protection |
| `/api/business-claims` | 5/min | Spam prevention |
| `/api/event-suggestions` | 5/min | Spam prevention |

When rate limit is exceeded, returns HTTP 429:
```json
{
  "detail": "Rate limit exceeded: 5 per 1 minute"
}
```
