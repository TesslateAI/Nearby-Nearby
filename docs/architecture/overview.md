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
│  - JWT Auth                     │  │  - Semantic Search              │
│  - RBAC                         │  │  - Geospatial Queries           │
│  - Image Processing             │  │                                 │
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
│  │  - events       │  │  Image Tables   │  │  Extensions     │          │
│  └─────────────────┘  │  - images       │  │  - pg_trgm      │          │
│                       └─────────────────┘  │  - pgvector     │          │
│                                            │  - postgis      │          │
│                                            └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        S3 / MinIO                                        │
│                    (Image Storage)                                       │
│  - Original images                                                       │
│  - Thumbnails, Medium, Large, XLarge variants                           │
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
User Search → React Frontend → FastAPI Backend → Search Pipeline
                                                        │
                                   ┌────────────────────┼────────────────────┐
                                   │                    │                    │
                              Keyword Search    Semantic Search    Hybrid Search
                              (pg_trgm)         (pgvector)         (Combined)
                                   │                    │                    │
                                   └────────────────────┼────────────────────┘
                                                        │
                                                        ▼
                                                 Ranked Results
```

**Key Flows:**
1. **Search**: Query → Encode with ML model → Vector similarity + Keyword matching → Ranked results
2. **Nearby**: Location → PostGIS distance query → Sorted by distance
3. **SEO**: Request for POI → Inject meta tags → Return HTML with Open Graph data

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

### Frontend Technologies

| Component | nearby-admin | nearby-app |
|-----------|--------------|------------|
| Framework | React 18 | React 18 |
| Build Tool | Vite | Vite |
| UI Library | Mantine v8 | Custom CSS |
| Maps | N/A | React-Leaflet |
| Rich Text | TipTap | N/A |
| DnD | @hello-pangea/dnd | N/A |

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
│       └── combined container
└── MinIO (local S3)
```

### Production

```
AWS Infrastructure
├── ECS Cluster
│   ├── nearby-admin
│   │   ├── frontend (nginx)
│   │   └── backend (uvicorn)
│   └── nearby-app (combined)
├── RDS (PostgreSQL + PostGIS)
└── S3 (image storage)
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
| Frontend | `frontend/src/App.jsx`, `components/` |

### nearby-app

| Layer | Files |
|-------|-------|
| Entry Point | `backend/app/main.py` |
| Models | `backend/app/models/*.py` |
| API Routes | `backend/app/api/endpoints/*.py` |
| Search Logic | `backend/app/crud/crud_poi.py` |
| Frontend | `app/src/App.jsx`, `components/`, `pages/` |

---

## Security Considerations

1. **Authentication**: JWT tokens with configurable expiration
2. **Authorization**: Role-based access (Admin > Editor > Viewer)
3. **Input Validation**: Pydantic schemas for all inputs
4. **HTML Sanitization**: DOMPurify for rich text content
5. **CORS**: Configured allowed origins per environment
6. **Non-root Containers**: Production containers run as appuser
