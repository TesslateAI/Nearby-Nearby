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
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/users` | Create user | Yes (Admin) |

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
| POST | `/api/images/bulk-upload/{poi_id}` | Bulk upload | Yes |
| GET | `/api/images/{image_id}` | Get image | No |
| GET | `/api/images/poi/{poi_id}` | Get POI images | No |
| GET | `/api/images/poi/{poi_id}/{type}` | Get images by type | No |
| PUT | `/api/images/{image_id}` | Update metadata | Yes |
| DELETE | `/api/images/{image_id}` | Delete image | Yes |
| PUT | `/api/images/reorder` | Reorder images | Yes |

#### POST /api/images/upload/{poi_id}

Request (multipart/form-data):
- `file`: Image file (JPEG, PNG, WebP, PDF)
- `image_type`: main, gallery, entry, parking, rental, etc.
- `alt_text`: Accessibility text
- `caption`: Image caption

Response:
```json
{
  "id": "uuid",
  "poi_id": "uuid",
  "image_type": "main",
  "storage_url": "https://bucket.s3.amazonaws.com/...",
  "thumbnail_url": "https://bucket.s3.amazonaws.com/.../thumbnail_...",
  "alt_text": "Coffee shop interior",
  "width": 1920,
  "height": 1080
}
```

**Note:** The `thumbnail_url` field provides a pre-generated thumbnail variant for faster loading in lists and grids.

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
| GET | `/api/pois/search` | Keyword search (pg_trgm) |
| GET | `/api/pois/semantic-search` | ML-powered semantic search |
| GET | `/api/pois/hybrid-search` | Combined keyword + semantic |

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
    "main_category": "Coffee Shops",
    "similarity": 0.72
  }
]
```

#### GET /api/pois/semantic-search

Query Parameters:
- `q` (string): Natural language query
- `limit` (int): Max results (default: 10)

Example: `?q=place to get coffee and work on laptop`

#### GET /api/pois/hybrid-search

Query Parameters:
- `q` (string): Search query
- `limit` (int): Max results (default: 10)
- `keyword_weight` (float): Weight for keyword score (default: 0.3)
- `semantic_weight` (float): Weight for semantic score (default: 0.7)

---

### POI Detail Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pois/{poi_id}` | Get POI by UUID |
| GET | `/api/pois/by-slug/{slug}` | Get POI by slug |
| GET | `/api/pois/by-type/{type}` | List POIs by type |
| GET | `/api/pois/by-category/{slug}` | List POIs in category |

#### GET /api/pois/by-slug/{slug}

Response:
```json
{
  "id": "uuid",
  "poi_type": "BUSINESS",
  "name": "Joe's Coffee",
  "slug": "joes-coffee-pittsboro",
  "teaser_description": "Best coffee in town",
  "long_description": "...",
  "address_street": "123 Main St",
  "address_city": "Pittsboro",
  "phone": "919-555-0123",
  "website": "https://joescoffee.com",
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

---

### Geospatial Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nearby` | Get nearest 8 POIs from coordinates |
| GET | `/api/pois/{poi_id}/nearby` | Get nearby POIs within radius |

#### GET /api/nearby

Query Parameters:
- `lat` (float): Latitude
- `lng` (float): Longitude

Response:
```json
[
  {
    "id": "uuid",
    "name": "Joe's Coffee",
    "slug": "joes-coffee-pittsboro",
    "poi_type": "BUSINESS",
    "distance_miles": 0.3,
    "location": {...}
  }
]
```

#### GET /api/pois/{poi_id}/nearby

Query Parameters:
- `radius_miles` (float): Search radius (default: 5)

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/waitlist` | Add email to waitlist |
| GET | `/api/waitlist/count` | Get waitlist count |
| GET | `/api/waitlist/all` | Get all emails (admin) |

#### POST /api/waitlist

Request:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "message": "Successfully added to waitlist"
}
```

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

Currently no rate limiting implemented. Consider implementing for production:
- Search endpoints: 60 requests/minute
- Other endpoints: 120 requests/minute
