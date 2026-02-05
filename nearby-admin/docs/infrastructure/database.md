# Database Configuration

## Overview

The platform uses PostgreSQL 15 with PostGIS 3.4 for geospatial support. Both applications share the same database in production.

**Key Files:**
- `nearby-admin/backend/app/database.py` - SQLAlchemy setup
- `nearby-admin/backend/alembic.ini` - Migration config
- `nearby-admin/backend/alembic/` - Migration files

---

## PostgreSQL Setup

### Docker Image

```yaml
# docker-compose.yml
db:
  image: postgis/postgis:15-3.4
  environment:
    POSTGRES_USER: nearby
    POSTGRES_PASSWORD: nearby
    POSTGRES_DB: nearbynearby
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

### Extensions

Required PostgreSQL extensions:

| Extension | Purpose | Enabled By |
|-----------|---------|------------|
| PostGIS | Geospatial data types | postgis/postgis image |
| pg_trgm | Fuzzy text search | App startup |
| pgvector | Vector similarity (production) | Manual/migration |

### Enabling Extensions

```python
# nearby-app/backend/app/main.py

@app.on_event("startup")
async def startup():
    # Enable pg_trgm
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        conn.commit()
```

---

## SQLAlchemy Configuration

### Database Module

```python
# nearby-admin/backend/app/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before use
    pool_size=5,         # Connection pool size
    max_overflow=10      # Additional connections when pool is full
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Connection URL Format

```
postgresql://username:password@host:port/database
```

Examples:
```bash
# Local development
DATABASE_URL=postgresql://nearby:nearby@db:5432/nearbynearby

# Local (from host machine)
DATABASE_URL=postgresql://nearby:nearby@localhost:5432/nearbynearby

# Production RDS
DATABASE_URL=postgresql://admin:password@mydb.xxx.us-east-1.rds.amazonaws.com:5432/nearbynearby
```

---

## Alembic Migrations

### Configuration

```ini
# nearby-admin/backend/alembic.ini

[alembic]
script_location = alembic
prepend_sys_path = .
sqlalchemy.url = driver://user:pass@localhost/dbname
```

### Environment Setup

```python
# nearby-admin/backend/alembic/env.py

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.database import Base
from app.core.config import settings

# Import all models for autogenerate
from app.models import poi, user, category, image, attribute

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()
```

### Common Commands

```bash
# Create new migration
docker exec nearby-admin-backend-1 alembic revision --autogenerate -m "Add new field"

# Apply migrations
docker exec nearby-admin-backend-1 alembic upgrade head

# Rollback one migration
docker exec nearby-admin-backend-1 alembic downgrade -1

# View migration history
docker exec nearby-admin-backend-1 alembic history

# View current revision
docker exec nearby-admin-backend-1 alembic current
```

### Migration Example

```python
# alembic/versions/xxxx_add_new_column.py

"""Add new column to POI

Revision ID: abc123
Revises: xyz789
Create Date: 2024-01-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'abc123'
down_revision = 'xyz789'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        'points_of_interest',
        sa.Column('new_field', sa.String(255), nullable=True)
    )

def downgrade():
    op.drop_column('points_of_interest', 'new_field')
```

---

## Connection Strings

### Development

```bash
# nearby-admin (inside container network)
DATABASE_URL=postgresql://nearby:nearby@db:5432/nearbynearby

# nearby-app (connecting to nearby-admin db container)
DATABASE_URL=postgresql://nearby:nearby@nearby-admin-db-1:5432/nearbynearby
```

### Production

```bash
# AWS RDS
DATABASE_URL=postgresql://postgres_admin:PASSWORD@nearby-admin-db.xxx.us-east-1.rds.amazonaws.com:5432/nearbynearby
```

---

## Database Operations

### Check Connection

```bash
docker exec nearby-admin-backend-1 python -c "
from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT version()'))
    print(result.scalar())
"
```

### Run Raw SQL

```bash
docker exec -it nearby-admin-db-1 psql -U nearby -d nearbynearby -c "SELECT COUNT(*) FROM points_of_interest"
```

### Interactive Shell

```bash
docker exec -it nearby-admin-db-1 psql -U nearby -d nearbynearby
```

### Backup Database

```bash
# Create backup
docker exec nearby-admin-db-1 pg_dump -U nearby nearbynearby > backup.sql

# Restore backup
cat backup.sql | docker exec -i nearby-admin-db-1 psql -U nearby -d nearbynearby
```

---

## Performance Tuning

### Connection Pooling

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,        # Base connections
    max_overflow=20,     # Extra connections under load
    pool_timeout=30,     # Wait time for connection
    pool_recycle=1800,   # Recycle connections after 30 min
    pool_pre_ping=True   # Verify connection health
)
```

### Query Optimization

```python
# Use joinedload to avoid N+1 queries
from sqlalchemy.orm import joinedload

poi = db.query(PointOfInterest).options(
    joinedload(PointOfInterest.categories),
    joinedload(PointOfInterest.images),
    joinedload(PointOfInterest.business)
).filter(PointOfInterest.id == poi_id).first()
```

### Indexes

```sql
-- Text search indexes
CREATE INDEX idx_poi_name_trgm ON points_of_interest USING gin (name gin_trgm_ops);
CREATE INDEX idx_poi_city_trgm ON points_of_interest USING gin (address_city gin_trgm_ops);

-- Geospatial index
CREATE INDEX idx_poi_location ON points_of_interest USING gist (location);

-- Common filters
CREATE INDEX idx_poi_publication_status ON points_of_interest (publication_status);
CREATE INDEX idx_poi_type ON points_of_interest (poi_type);
```

---

## pgvector Setup (Production)

### Enable Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Add Embedding Column

```sql
ALTER TABLE points_of_interest
ADD COLUMN embedding vector(768);
```

### Create Index

```sql
-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX idx_poi_embedding ON points_of_interest
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## Shared Database Architecture

Both applications share the same database:

```
┌─────────────────────┐     ┌─────────────────────┐
│    nearby-admin     │     │     nearby-app      │
│   (Read + Write)    │     │    (Read Only)      │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └───────────┬───────────────┘
                       │
           ┌───────────▼───────────┐
           │     PostgreSQL        │
           │   + PostGIS           │
           │   + pg_trgm           │
           │   + pgvector          │
           └───────────────────────┘
```

**Important Rules:**
- `nearby-admin` performs all write operations
- `nearby-app` only reads published data
- Both filter by `publication_status = 'published'` for public endpoints
- Never modify production data from `nearby-app`

---

## Troubleshooting

### Connection Refused

```bash
# Check if database is running
docker ps | grep db

# Check database logs
docker logs nearby-admin-db-1
```

### Authentication Failed

```bash
# Verify credentials
docker exec -it nearby-admin-db-1 psql -U nearby -d nearbynearby
```

### Migration Conflicts

```bash
# View current state
docker exec nearby-admin-backend-1 alembic current

# Stamp to specific revision
docker exec nearby-admin-backend-1 alembic stamp <revision>

# Generate from scratch
docker exec nearby-admin-backend-1 alembic revision --autogenerate -m "Initial"
```

---

## Best Practices

1. **Always use migrations** - Never modify schema manually
2. **Test locally first** - Run migrations on dev before production
3. **Backup before migrate** - Create backup before major changes
4. **Use connection pooling** - Reuse connections efficiently
5. **Add indexes** - Index frequently queried columns
6. **Filter by status** - Always check publication_status in public queries
