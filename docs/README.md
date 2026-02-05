# Nearby Nearby Platform Documentation

Technical documentation for the Nearby Nearby platform - a location discovery system for Points of Interest (POIs).

## Platform Overview

The platform consists of two applications sharing a PostgreSQL database:

| Application | Purpose | Port | Tech Stack |
|-------------|---------|------|------------|
| **nearby-admin** | Admin panel for managing POI database | 5175 (frontend), 8001 (backend) | React + Mantine, FastAPI |
| **nearby-app** | User-facing app with ML-powered search | 8002 | React, FastAPI + ML embeddings |

## Quick Navigation

### Architecture
- [System Overview](architecture/overview.md) - High-level architecture, tech stack, data flow
- [Database Schema](architecture/database-schema.md) - All models, relationships, field reference
- [API Reference](architecture/api-reference.md) - Complete endpoint documentation

### Core Systems
| System | Description |
|--------|-------------|
| [Authentication](systems/authentication.md) | JWT tokens, login flow, token management |
| [Authorization](systems/authorization.md) | Role-based access control (Admin/Editor/Viewer) |
| [POI Management](systems/poi-management.md) | CRUD operations for 8 POI types |
| [Categories](systems/categories.md) | Hierarchical category system |
| [Images](systems/images.md) | Upload, S3/MinIO storage, image variants |
| [Attributes](systems/attributes.md) | Dynamic configurable fields |
| [Relationships](systems/relationships.md) | POI-to-POI linking |
| [Search](systems/search.md) | Keyword, semantic, and hybrid search |
| [Geospatial](systems/geospatial.md) | PostGIS nearby queries |
| [SEO](systems/seo.md) | Meta tags, Open Graph, structured data |
| [Users](systems/users.md) | User management and scripts |

### Infrastructure
- [Docker](infrastructure/docker.md) - Container setup, compose files
- [Database](infrastructure/database.md) - PostgreSQL, PostGIS, migrations
- [Deployment](infrastructure/deployment.md) - CI/CD, AWS ECS, production
- [Networking](infrastructure/networking.md) - Docker networks, ports

### Frontend
- [Admin Frontend](frontend/admin-frontend.md) - React/Mantine components
- [App Frontend](frontend/app-frontend.md) - User-facing React app

---

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL 15 with PostGIS 3.4
- **ORM**: SQLAlchemy 2.x
- **Migrations**: Alembic
- **Auth**: JWT with bcrypt password hashing
- **ML**: SentenceTransformers (embeddinggemma-300m)

### Frontend
- **Framework**: React 18 with Vite
- **UI Library**: Mantine v8 (admin), custom CSS (app)
- **Maps**: React-Leaflet with OpenStreetMap
- **Rich Text**: TipTap editor

### Infrastructure
- **Containers**: Docker with Docker Compose
- **Storage**: S3/MinIO for images
- **CI/CD**: GitHub Actions → AWS ECR/ECS
- **Web Server**: nginx (production frontend)

---

## POI Types

The platform supports 8 POI types:

| Type | Description |
|------|-------------|
| `BUSINESS` | Businesses, restaurants, services |
| `PARK` | Parks and recreational areas |
| `TRAIL` | Hiking and walking trails |
| `EVENT` | Events and activities |
| `SERVICES` | Service providers |
| `YOUTH_ACTIVITIES` | Youth programs |
| `JOBS` | Job listings |
| `VOLUNTEER_OPPORTUNITIES` | Volunteer positions |
| `DISASTER_HUBS` | Emergency resources |

---

## Key Concepts

### Publication Status
POIs have a `publication_status` field:
- `draft` - Only visible in admin panel
- `published` - Visible in user-facing app

### Slugs
SEO-friendly URLs using slugs (e.g., `/places/joes-coffee-pittsboro`)

### Categories
Hierarchical system with parent-child relationships, filtered by POI type

### Search Methods
1. **Keyword** - Fuzzy matching with pg_trgm
2. **Semantic** - Vector similarity with pgvector
3. **Hybrid** - 30% keyword + 70% semantic scoring

---

## Database Connection

Both applications share the same PostgreSQL database:
- **Production**: AWS RDS endpoint
- **Development**: Local PostGIS container

See [Database](infrastructure/database.md) for connection details.

---

## Getting Started

1. **Local Development**: See [Docker setup](infrastructure/docker.md)
2. **API Exploration**: See [API Reference](architecture/api-reference.md)
3. **Understanding the Data Model**: See [Database Schema](architecture/database-schema.md)
