# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS                                       │
└─────────────────────────────────────────────────────────────────────────┘
                    │                              │
                    ▼                              ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│         nearby-admin            │  │          nearby-app              │
│      (Admin Panel)              │  │     (User-Facing App)            │
├─────────────────────────────────┤  ├─────────────────────────────────┤
│  Frontend (React + Mantine)     │  │  Frontend (React + Leaflet)     │
│  Port: 5175                     │  │  Port: 8002 (combined)          │
├─────────────────────────────────┤  ├─────────────────────────────────┤
│  Backend (FastAPI)              │  │  Backend (FastAPI + ML)         │
│  Port: 8001                     │  │  - Embedding Model (~1GB)       │
│  - JWT Auth                     │  │  - Multi-Signal Search Engine   │
│  - RBAC                         │  │  - Geospatial Queries           │
│  - Image Processing             │  │  - Public Forms (rate-limited)  │
└───────────────┬─────────────────┘  └───────────────┬─────────────────┘
                │                                    │
                └──────────────┬─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL + PostGIS                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  POI Tables     │  │  User Tables    │  │  Category       │          │
│  │  - points_of_   │  │  - users        │  │  Tables         │          │
│  │    interest     │  │                 │  │  - categories   │          │
│  │  - businesses   │  └─────────────────┘  └─────────────────┘          │
│  │  - parks        │                                                     │
│  │  - trails       │  ┌─────────────────┐  ┌─────────────────┐          │
│  │  - events       │  │  Image Tables   │  │  Form Tables    │          │
│  └─────────────────┘  │  - images       │  │  (nearby_forms) │          │
│                       └─────────────────┘  │  - waitlist     │          │
│  ┌─────────────────┐                       │  - community_   │          │
│  │  Extensions     │                       │    interest     │          │
│  │  - pg_trgm      │                       │  - contact_     │          │
│  │  - pgvector     │                       │    submissions  │          │
│  │  - postgis      │                       │  - feedback_    │          │
│  └─────────────────┘                       │    submissions  │          │
│                                            │  - business_    │          │
│                                            │    claims       │          │
│                                            └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        S3 / MinIO                                        │
│                    (Image + File Storage)                                │
│  - POI images (original + thumbnail/medium/large/xlarge variants)       │
│  - Feedback file uploads (feedback/{submission_id}/{filename})          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Admin Panel (nearby-admin)

```
User Action → React Frontend → FastAPI Backend → PostgreSQL
                                     │
                                     ├── Image Upload → S3/MinIO
                                     └── Auth Check → JWT Validation
```

**Key Flows:**
1. **Create POI**: Form submission → Validation → Insert to DB → Return POI with slug
2. **Upload Image**: File upload → Validate → Resize variants → Store in S3 → Save metadata to DB
3. **Publish POI**: Update publication_status → Available in nearby-app

### User App (nearby-app)

```
User Search → React Frontend → FastAPI Backend → Multi-Signal Search Engine
                                                        │
                                   ┌────────────────────┼────────────────────┐
                                   │                    │                    │
                              6 Search Signals     Query Processor      Score Merger
                              ┌─────────────┐    ┌──────────────┐    ┌──────────┐
                              │ Exact Name  │    │ Amenity      │    │ Weighted │
                              │ Trigram     │    │ Type Hints   │    │ Combine  │
                              │ Full-Text   │    │ Location     │    │ Threshold│
                              │ Semantic    │    │ Difficulty   │    │ Rank     │
                              │ Structured  │    └──────────────┘    └──────────┘
                              │ Type/City   │
                              └─────────────┘

Form Submit → React Frontend → FastAPI Backend → Forms Database (isolated)
                                     │                    │
                                     ├── Rate Limit Check (slowapi)
                                     ├── Pydantic Validation
                                     └── File Upload → S3 (feedback only)
```

**Key Flows:**
1. **Search**: Query → Query Processor extracts filters/hints → 6 signals scored independently → Weighted merge → Dynamic threshold → Ranked results
2. **Nearby**: Location → PostGIS distance query → Sorted by distance
3. **SEO**: Request for POI → Inject meta tags → Return HTML with Open Graph data
4. **Form Submit**: Input → Rate limit → Validate → Insert to forms DB → Success response

---

## Technology Stack

### Backend Technologies

| Component | nearby-admin | nearby-app |
|-----------|--------------|------------|
| Framework | FastAPI | FastAPI |
| Python Version | 3.10 | 3.11 |
| ORM | SQLAlchemy 2.x | SQLAlchemy 2.x |
| Auth | JWT + bcrypt | N/A (public) |
| Image Processing | Pillow | N/A |
| ML Model | N/A | embeddinggemma-300m |
| Rate Limiting | N/A | slowapi (5/min forms, 2/min file uploads) |
| S3 Client | boto3 | boto3 (feedback file uploads) |

### Frontend Technologies

| Component | nearby-admin | nearby-app |
|-----------|--------------|------------|
| Framework | React 18 | React 18 |
| Build Tool | Vite | Vite |
| UI Library | Mantine v8 | Custom CSS |
| Maps | N/A | React-Leaflet |
| Rich Text | TipTap | N/A |
| DnD | @hello-pangea/dnd | N/A |
| Icons | N/A | lucide-react |

### Database Extensions

| Extension | Purpose |
|-----------|---------|
| PostGIS | Geospatial data types and queries |
| pg_trgm | Trigram-based fuzzy text search |
| pgvector | Vector similarity search for embeddings |

---

## Network Architecture

### Docker Networks

```
nearby-admin_default (shared network)
├── nearby-admin-frontend-1
├── nearby-admin-backend-1
├── nearby-admin-db-1 (PostGIS)
├── minio (S3 storage)
└── nearby-app (connected via external: true)
```

### Port Mapping

| Service | Container Port | Host Port | Purpose |
|---------|----------------|-----------|---------|
| Admin Frontend | 5173 | 5175 | Admin UI |
| Admin Backend | 8000 | 8001 | Admin API |
| App Combined | 8000 | 8002 | User app |
| App Frontend (dev) | 5173 | 8003 | Vite dev server (dev only) |
| MinIO API | 9000 | 9000 | S3 API |
| MinIO Console | 9001 | 9001 | S3 UI |
| PostgreSQL | 5432 | 5432 | Database |

---

## Deployment Architecture

### Development

```
Local Machine
├── Docker Compose
│   ├── nearby-admin (dev containers)
│   │   ├── frontend (Vite dev server)
│   │   ├── backend (uvicorn --reload)
│   │   └── db (PostGIS)
│   └── nearby-app
│       ├── frontend (Vite dev server, port 8003)
│       └── backend (uvicorn --reload, port 8002)
└── MinIO (local S3)
```

### Production

```
AWS Infrastructure
├── ECS Cluster
│   ├── nearby-admin
│   │   ├── frontend (nginx)
│   │   └── backend (uvicorn)
│   └── nearby-app (combined: frontend baked into backend container)
├── RDS (PostgreSQL + PostGIS)
│   ├── Main role: postgres_admin (full access)
│   └── Forms role: nearby_forms (INSERT/SELECT on form tables only)
└── S3 (image storage + feedback file uploads)
```

---

## Key Files by System

### nearby-admin

| Layer | Files |
|-------|-------|
| Entry Point | `backend/app/main.py` |
| Models | `backend/app/models/*.py` |
| API Routes | `backend/app/api/endpoints/*.py` |
| CRUD Logic | `backend/app/crud/*.py` |
| Services | `backend/app/services/*.py` |
| Auth | `backend/app/core/security.py`, `permissions.py` |
| Migrations | `backend/alembic/versions/*.py` |
| Frontend | `frontend/src/App.jsx`, `components/` |

### nearby-app

| Layer | Files |
|-------|-------|
| Entry Point | `backend/app/main.py` |
| Models | `backend/app/models/*.py` (POI + form models) |
| API Routes | `backend/app/api/endpoints/*.py` |
| Search Engine | `backend/app/search/search_engine.py`, `query_processor.py`, `constants.py` |
| S3 Client | `backend/app/core/s3.py` |
| Database | `backend/app/database.py` (main engine + forms engine) |
| Frontend | `app/src/App.jsx`, `components/`, `pages/` |

### Shared

| Layer | Files |
|-------|-------|
| Enums | `shared/models/enums.py` (POIType, ImageType) |
| Constants | `shared/constants/field_options.py` (amenity patterns for search) |

---

## Security Considerations

1. **Authentication**: JWT tokens with configurable expiration (admin panel only)
2. **Authorization**: Role-based access (Admin > Editor > Viewer)
3. **Input Validation**: Pydantic schemas with `Field(max_length=...)` for all inputs
4. **HTML Sanitization**: DOMPurify for rich text content
5. **CORS**: Configured allowed origins per environment
6. **Non-root Containers**: Production containers run as appuser
7. **Forms DB Isolation**: Separate `nearby_forms` PostgreSQL role with INSERT/SELECT only on form tables — prevents SQL injection escalation to POI data
8. **Rate Limiting**: `slowapi` on all public form endpoints (5/min general, 2/min file uploads)
9. **File Upload Validation**: Content-type whitelist (image/* only), 10MB size limit, max 10 files per submission
