# Public Forms System

## Overview

The platform provides 6 public form endpoints for user engagement. These forms are accessible without authentication and are designed with defense-in-depth security.

**Key Files:**

| Layer | Files |
|-------|-------|
| Migration | `nearby-admin/backend/alembic/versions/c3f4g5h6i7j8_create_form_tables.py` |
| Database | `nearby-app/backend/app/database.py` (forms_engine, get_forms_db) |
| Models | `nearby-app/backend/app/models/{community_interest,contact,feedback,business_claim,event_suggestion}.py` |
| Schemas | `nearby-app/backend/app/schemas/{community_interest,contact,feedback,business_claim,event_suggestion}.py` |
| Endpoints | `nearby-app/backend/app/api/endpoints/{waitlist,community_interest,contact,feedback,business_claims,event_suggestions}.py` |
| S3 Client | `nearby-app/backend/app/core/s3.py` |
| Frontend | `nearby-app/app/src/pages/{CommunityInterest,Contact,Feedback,ClaimBusiness,SuggestEvent}.jsx` |
| Tests | `tests/test_form_endpoints.py` (23 tests) |

---

## The 6 Forms

### 1. Email Waitlist (SignupBar)

Simple email capture in the homepage signup bar.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | EmailStr | Yes | unique, max 255 |

**Endpoint**: `POST /api/waitlist`
**Rate limit**: 5/min
**Duplicate handling**: Returns 409 if email already exists

### 2. Community Interest

For users who want Nearby Nearby in their community. Replaces former Google Forms link in footer.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | No | max 100 |
| email | EmailStr | No | max 255 |
| location | string | **Yes** | max 200, "Town, County, State" |
| role | string[] | No | Checkbox: Resident, Business Owner, Event Organizer, Nonprofit/Community Group, Local Gov/Tourism Rep, Visitor/Traveler, Other |
| role_other | string | No | max 100, only if "Other" selected |
| why | text | No | max 2000 |
| how_heard | string | No | max 500 |
| anything_else | text | No | max 2000 |

**Endpoint**: `POST /api/community-interest`
**Rate limit**: 5/min
**Frontend**: `/community-interest` page

### 3. Contact Us

General contact form.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | **Yes** | max 100 |
| email | EmailStr | **Yes** | max 255 |
| message | text | **Yes** | min 10, max 5000 |

**Endpoint**: `POST /api/contact`
**Rate limit**: 5/min
**Frontend**: `/contact` page

### 4. Feedback ("We're Listening")

User feedback with optional screenshot uploads. Replaces former Google Forms link in footer.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | EmailStr | No | max 255 |
| feedback | text | **Yes** | min 10, max 5000 |
| files | UploadFile[] | No | max 10 files, max 10MB each, JPEG/PNG/GIF/WebP only |

**Endpoint**: `POST /api/feedback` (multipart/form-data)
**Rate limit**: 2/min (stricter due to file uploads)
**Frontend**: `/feedback` page with drag-and-drop file upload zone

**File upload flow:**
1. Accept `UploadFile` list via multipart form
2. Validate: image content-type, ≤10MB each, ≤10 files
3. Upload to S3 at `feedback/{submission_id}/{filename}`
4. Store array of S3 URLs as JSONB in `feedback_submissions.file_urls`

### 5. Claim Your Business

Business owner registration. Replaces the old "Suggest a Place" form. Chatham County NC only for now.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| business_name | string | **Yes** | max 200 |
| contact_name | string | **Yes** | max 100 |
| contact_phone | string | **Yes** | max 20 |
| contact_email | EmailStr | **Yes** | max 255 |
| business_address | string | **Yes** | max 500 |
| how_heard | string | No | max 500 |
| anything_else | text | No | max 2000 |

**Endpoint**: `POST /api/business-claims`
**Rate limit**: 5/min
**Frontend**: `/claim-business` page with Chatham County gate (Yes/No → if No, redirects to Community Interest form)

**Note**: `/suggest-place` redirects to `/claim-business` for backward compatibility.

### 6. Suggest an Event

For users who want to suggest a local event to be added to the platform. Two fieldsets: "Event Details" and "Your Contact Information."

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| event_name | string | **Yes** | min 1, max 255 |
| event_description | text | No | — |
| event_date | string | No | max 100, free-text (e.g. "Saturday, March 15, 2026 — 9 AM to 1 PM") |
| event_location | string | No | max 255 |
| organizer_name | string | No | max 100 |
| organizer_email | EmailStr | **Yes** | max 255 |
| organizer_phone | string | No | max 50 |
| additional_info | text | No | — (used for details link / URL) |
| status | string | — | Server-set, default `'pending'` |

**Endpoint**: `POST /api/event-suggestions`
**Rate limit**: 5/min
**Frontend**: `/suggest-event` page with CalendarPlus icon header
**Notification**: Sends ntfy.sh push to `nearbynearbyadmin` topic on each submission (best-effort, non-blocking)

---

## Security Architecture (Defense in Depth)

| Layer | What | Protects Against |
|-------|------|------------------|
| **1. DB Role** | `nearby_forms` role — can only INSERT/SELECT on form tables | SQL injection escalating to POI data |
| **2. Separate Engine** | `FORMS_DATABASE_URL` env var → dedicated SQLAlchemy engine | Code bugs using wrong session |
| **3. Pydantic** | Strict schemas with `Field(max_length=...)`, `EmailStr` | Malformed input, oversized payloads |
| **4. Rate Limiting** | `slowapi` — 5/min on form endpoints, 2/min on file uploads | Spam, DoS |
| **5. File Validation** | Content-type check, 10MB limit, image-only, max 10 files | Malicious uploads |

### Database Isolation

```python
# nearby-app/backend/app/database.py

# Main engine (read-only POI access)
engine = create_engine(settings.DATABASE_URL)

# Forms engine (isolated: nearby_forms role, INSERT/SELECT only)
_forms_url = settings.FORMS_DATABASE_URL or settings.DATABASE_URL
forms_engine = create_engine(_forms_url)

# Dependency injection
def get_forms_db():
    db = FormsSessionLocal()
    try:
        yield db
    finally:
        db.close()
```

All form endpoints use `Depends(get_forms_db)` instead of `Depends(get_db)`.

### Graceful Fallback

If `FORMS_DATABASE_URL` is empty or not set, falls back to `DATABASE_URL` (superuser). This means:
- **Local dev without the role**: Still works, just no table-level isolation
- **Production**: Uses restricted `nearby_forms` role for real security

---

## Environment Variables

| Variable | App | Purpose |
|----------|-----|---------|
| `FORMS_DATABASE_URL` | nearby-app | Connection string for forms DB role |
| `AWS_S3_BUCKET` | nearby-app | S3 bucket for feedback file uploads |
| `AWS_REGION` | nearby-app | AWS region |
| `AWS_ACCESS_KEY_ID` | nearby-app | S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | nearby-app | S3 credentials |
| `AWS_S3_ENDPOINT_URL` | nearby-app | MinIO endpoint (dev only) |

---

## Frontend Pages

All form pages follow a consistent pattern:
- Form card with header icon and description
- Client-side validation with disabled submit until valid
- Loading state during submission
- Success screen with confirmation message
- Error handling for network failures and validation errors

### Routes

| Route | Component | Replaces |
|-------|-----------|----------|
| `/community-interest` | `CommunityInterest.jsx` | Google Form link in footer |
| `/contact` | `Contact.jsx` | New page |
| `/feedback` | `Feedback.jsx` | Google Form link in footer |
| `/claim-business` | `ClaimBusiness.jsx` | `/suggest-place` (SuggestPlace.jsx) |
| `/suggest-event` | `SuggestEvent.jsx` | New page |
| `/suggest-place` | Redirect → `/claim-business` | Backward compatibility |

### Footer Links Updated

The footer's "Get Involved" column now uses internal `<Link>` components instead of external Google Forms URLs:
- "Share Your Feedback" → `/feedback`
- "Claim Your Business" → `/claim-business`
- "Community Interest" → `/community-interest`
- "Contact Us" → `/contact`
- "Suggest an Event" → `/suggest-event`

---

## Testing

23 integration tests in `tests/test_form_endpoints.py`:

| Class | Tests | What's Covered |
|-------|-------|----------------|
| `TestWaitlist` | 5 | Add email, duplicate (409), invalid email, missing email, count |
| `TestCommunityInterest` | 4 | Minimal (location only), full submission, missing location, location too long |
| `TestContact` | 4 | Submit, message too short, missing name, missing email |
| `TestFeedback` | 5 | Text only, with email, too short, invalid file type, file too large |
| `TestBusinessClaims` | 5 | Submit, full submission, missing required fields, invalid email, name too long |

The `forms_client` fixture creates form tables via raw SQL (since they aren't in AdminBase.metadata) and overrides both `get_db` and `get_forms_db` to use the test session.

---

## Migration

The Alembic migration `c3f4g5h6i7j8_create_form_tables.py` creates:
1. Six tables (waitlist, community_interest, contact_submissions, feedback_submissions, business_claims, event_suggestions)
2. The `nearby_forms` PostgreSQL role with restricted permissions
3. Grants INSERT and SELECT on form tables to the role

Run on production: `docker compose -f docker-compose.prod.yml exec backend alembic upgrade head`

---

## Deleted Files

The forms system replaced several SQLite-based files:

| Deleted File | Replacement |
|-------------|-------------|
| `nearby-app/backend/app/waitlist_db.py` | ORM model + PostgreSQL |
| `nearby-app/backend/app/suggestions_db.py` | `business_claim.py` model |
| `nearby-app/backend/app/api/endpoints/suggestions.py` | `business_claims.py` endpoint |
| `nearby-app/backend/app/schemas/suggestion.py` | `business_claim.py` schema |
| `nearby-app/app/src/pages/SuggestPlace.jsx` | `ClaimBusiness.jsx` |
| `tests/test_suggestions.py` | `test_form_endpoints.py` |
