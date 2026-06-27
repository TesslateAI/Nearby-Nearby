# Docker Configuration

## Overview

Both applications use Docker for containerization. Production runs on AWS ECS Fargate with pre-built images from ECR. Local development uses Docker Compose.

**Key Files:**

| File | Purpose |
|------|---------|
| `nearby-admin/docker-compose.yml` | Admin dev environment |
| `nearby-admin/docker-compose.prod.yml` | Admin local production |
| `nearby-admin/backend/Dockerfile` | Admin backend (dev) |
| `nearby-admin/backend/Dockerfile.ecs` | Admin backend (ECS production) |
| `nearby-admin/frontend/Dockerfile` | Admin frontend (dev) |
| `nearby-admin/frontend/Dockerfile.prod` | Admin frontend (production + ECS) |
| `nearby-admin/frontend/nginx.conf.template` | Nginx template with `BACKEND_HOST` variable |
| `nearby-app/Dockerfile` | User app combined build (production + ECS) |
| `nearby-app/docker-compose.dev.yml` | User app dev environment |

---

## Production Dockerfiles (ECS)

### nearby-app (`nearby-app/Dockerfile`)

Multi-stage build. Build context is the **monorepo root** (not `nearby-app/`).

```dockerfile
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY nearby-app/app/package*.json ./
RUN npm install
COPY nearby-app/app/ ./
RUN npm run build

# Stage 2: Python backend + baked frontend (NO in-process ML model)
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*
COPY nearby-app/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# No ML model is bundled anymore: embeddings are served by a separate TEI
# container and consumed via the shared fail-soft HTTP client. (torch /
# sentence-transformers removed from requirements; no model prefetch step.)

COPY shared/ ./shared/                                    # Shared enums + embeddings client
COPY nearby-app/backend/ ./                                # Backend code
COPY --from=frontend-builder /app/backend/static ./static  # Pre-built frontend

EXPOSE 8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Key details:**
- **No ML model in the image.** `torch` and `sentence-transformers` (~1GB) were
  removed from `nearby-app/backend/requirements.txt`, and the model prefetch
  `RUN python -c "...SentenceTransformer(...)"` step was dropped. The image is
  much smaller and builds on CI again (previously ~5.7GB / QEMU-only). Embeddings
  come from the separate TEI service (see "Embedding Service (TEI)" below).
- `HEALTHCHECK` start period is relaxed **120s → 30s** — there is no longer a
  1GB model to load at startup, just an HTTP-client singleton.
- `shared/` package is copied for enum imports **and** the `shared.embeddings`
  fail-soft TEI client.
- Vite outputs built React to `../backend/static` which gets copied as the static directory

### nearby-admin Backend (`nearby-admin/backend/Dockerfile.ecs`)

Build context is the **monorepo root**. Used by CI/CD and ECS.

```dockerfile
FROM python:3.10-slim AS builder
WORKDIR /app
COPY nearby-admin/backend/requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt

FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 curl \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/* && rm -rf /wheels
COPY shared/ ./shared/
COPY nearby-admin/backend/ ./
RUN chown -R appuser:appuser /app
USER appuser

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["sh", "-c", "alembic upgrade heads && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

**Key details:**
- Runs `alembic upgrade heads` on startup before starting uvicorn
- Non-root user (`appuser`) for security
- `shared/` package copied for enum imports

### nearby-admin Frontend (`nearby-admin/frontend/Dockerfile.prod`)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_HOST=localhost
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
```

**Key details:**
- Uses nginx's built-in `envsubst` template system (`/etc/nginx/templates/`)
- `BACKEND_HOST` defaults to `localhost` (ECS: containers share network namespace)
- Override to `BACKEND_HOST=backend` in Docker Compose (containers use service DNS)

### Nginx Template (`nearby-admin/frontend/nginx.conf.template`)

```nginx
server {
    listen 5173;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # API proxy — uses BACKEND_HOST variable
    location /api/ {
        proxy_pass http://${BACKEND_HOST}:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- **ECS**: `BACKEND_HOST=localhost` — nginx and backend share the same task network
- **Docker Compose**: `BACKEND_HOST=backend` — nginx reaches backend via Docker DNS

---

## Local Development

### nearby-admin (Docker Compose)

```yaml
# nearby-admin/docker-compose.yml (development)
services:
  db:
    # Custom PostGIS + pgvector image (nearby-admin/db/Dockerfile) so local dev
    # runs real semantic search, mirroring prod RDS. Replaces stock postgis.
    build: { context: ./db, dockerfile: Dockerfile }

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]

  # Embedding model served out-of-process by Hugging Face TEI (mirrors prod ECS).
  # Reachable on the shared network at http://embedding:80; 8085 published for
  # ad-hoc curl/parity. No healthcheck (the minimal TEI image has no curl/wget);
  # dependents use service_started + the fail-soft client.
  embedding:
    image: ghcr.io/huggingface/text-embeddings-inference:cpu-1.8.1
    command: ["--model-id", "michaelfeil/embeddinggemma-300m", "--port", "80"]
    ports: ["8085:80"]
    volumes: [embedding_cache:/data]

  backend:
    build: { context: ./backend, dockerfile: Dockerfile }
    container_name: nearby-admin-backend
    ports: ["8001:8000"]
    volumes:
      - ./backend:/app
      - ../shared:/app/shared    # Mount shared enums + embeddings client
    environment:
      # Embed-on-write target; fail-soft if the embedding service is down.
      - EMBEDDING_SERVICE_URL=${EMBEDDING_SERVICE_URL:-http://embedding:80}
    command: sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    depends_on:
      embedding: { condition: service_started }

  frontend:
    build: { context: ./frontend, dockerfile: Dockerfile }
    container_name: nearby-admin-frontend
    ports: ["5176:5173"]
    command: npm run dev -- --host 0.0.0.0
```

> **pgvector DB images:** the stock `postgis/postgis` image lacks pgvector. Local
> dev builds `nearby-admin/db/Dockerfile` (PostGIS + `postgresql-15-pgvector`);
> CI and the integration tests build `tests/Dockerfile.testdb`
> (`postgis/postgis:15-3.3` + `postgresql-15-pgvector`) so `CREATE EXTENSION vector`
> and the `vector(768)` column work everywhere.

```bash
# Start development
cd nearby-admin
docker compose up --build

# Background mode
docker compose up -d

# View logs
docker compose logs -f backend
```

### nearby-admin Local Production

```yaml
# nearby-admin/docker-compose.prod.yml
services:
  backend:
    build: { context: ./backend, dockerfile: Dockerfile.prod }
    container_name: nearby-admin-backend
    ports: ["8001:8000"]
    env_file: .env
    restart: unless-stopped

  frontend:
    build: { context: ./frontend, dockerfile: Dockerfile.prod }
    container_name: nearby-admin-frontend
    ports: ["5175:5173"]
    environment:
      - BACKEND_HOST=backend    # Override for Docker Compose networking
    restart: unless-stopped
```

```bash
# Full rebuild
cd nearby-admin
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d
```

### nearby-app (Development)

```yaml
# nearby-app/docker-compose.dev.yml
services:
  frontend:
    build: { context: ./app, dockerfile: Dockerfile.dev }
    ports: ["8003:5173"]    # Vite dev server with HMR
    environment:
      - VITE_API_BASE_URL=http://localhost:8002

  backend:
    build: { context: ./backend, dockerfile: Dockerfile.dev }
    ports: ["8002:8000"]
    volumes:
      - ./backend:/app
      - ../shared:/app/shared
    environment:
      - PYTHONPATH=/app
    networks:
      - nearby-admin_default

networks:
  nearby-admin_default:
    external: true
```

```bash
# Start dev mode (requires nearby-admin network)
cd nearby-app
docker compose -f docker-compose.dev.yml up --build
```

### nearby-app Local Production

```bash
# Using rebuild.sh
cd nearby-app
./rebuild.sh

# Manual build (build context is monorepo root)
docker build -t nearby-app:latest -f nearby-app/Dockerfile .
docker run -d --name nearby-app \
  -p 8002:8000 \
  --network nearby-admin_default \
  -e DATABASE_URL="postgresql://..." \
  nearby-app:latest
```

---

## Build Context Summary

| Dockerfile | Build Context | Why |
|------------|---------------|-----|
| `nearby-app/Dockerfile` | Monorepo root (`.`) | Needs `shared/` and `nearby-app/` |
| `nearby-admin/backend/Dockerfile.ecs` | Monorepo root (`.`) | Needs `shared/` and `nearby-admin/backend/` |
| `nearby-admin/frontend/Dockerfile.prod` | `nearby-admin/frontend/` | Self-contained frontend build |
| `nearby-admin/backend/Dockerfile` | `nearby-admin/backend/` | Dev only, shared mounted as volume |
| `nearby-admin/frontend/Dockerfile` | `nearby-admin/frontend/` | Dev only |

---

## S3 Authentication

### ECS (Production)

ECS tasks use **IAM role-based authentication** — no AWS access keys needed. The task role has S3 permissions attached via Terraform.

The S3 client in both apps (`app/core/s3.py`) checks for IAM role credentials when explicit keys aren't set:

```python
@property
def is_configured(self) -> bool:
    if not self.bucket_name:
        return False
    return bool(self.access_key_id or self._has_iam_role())
```

### Local Development

Use MinIO with explicit credentials in `.env`:

```bash
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=nearby-images
AWS_S3_ENDPOINT_URL=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
```

---

## Health Checks

### Endpoints

Both apps expose `/api/health`:

```bash
# nearby-app (reports the embedding service status — informational only)
curl http://localhost:8002/api/health
# {"status":"healthy","service":"nearby-app","database":"connected","embedding_service":"configured"}
# embedding_service is "disabled" when EMBEDDING_SERVICE_URL is unset; it NEVER
# affects overall health (semantic search just degrades to keyword search).

# nearby-admin
curl http://localhost:8001/api/health
# {"status":"healthy","service":"nearby-admin","database":"connected"}
```

### Docker HEALTHCHECK

```dockerfile
# nearby-app (30s start period — no more 1GB model load)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# nearby-admin backend (60s start period for alembic + startup)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1
```

The TEI `embedding` container has **no** healthcheck (its minimal image ships no
curl/wget); ECS treats the essential container as healthy while running and
Service Connect routes to it, with the fail-soft client degrading to keyword
search while the model loads.

---

## Common Commands

```bash
# nearby-admin development
docker compose -C nearby-admin up --build
docker compose -C nearby-admin logs -f backend

# nearby-admin local production
docker compose -C nearby-admin -f docker-compose.prod.yml up --build -d
docker compose -C nearby-admin -f docker-compose.prod.yml logs -f

# nearby-app local production
cd nearby-app && ./rebuild.sh

# View container status
docker ps

# Inspect network
docker network inspect nearby-admin_default
```

---

## Volume Management

```bash
# List volumes
docker volume ls | grep nearby

# Remove database volume (full reset)
docker volume rm nearby-admin_postgres_data

# Remove all unused volumes
docker volume prune
```

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication (admin only)
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
ALLOWED_ORIGINS=https://admin.nearbynearby.com,https://nearbynearby.com

# S3 Storage (local dev — not needed in ECS, uses IAM role)
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=nearby-images
AWS_S3_ENDPOINT_URL=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123

# Forms Database (nearby-app only)
FORMS_DATABASE_URL=postgresql://nearby_forms:password@host:5432/dbname
```

---

## Troubleshooting

### Container Won't Start

```bash
docker logs nearby-admin-backend-1
docker ps -a
docker inspect nearby-admin-backend-1
```

### Database Connection Issues

```bash
docker exec nearby-admin-backend-1 python -c "
from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    print('Database connected:', conn.execute(text('SELECT 1')).scalar())
"
```

### Port Conflicts

```bash
netstat -tulpn | grep 8001
lsof -i :8001
```

### ECS Container Issues

```bash
# Check ECS service events
aws ecs describe-services \
  --cluster nearbynearby-prod \
  --services nearbynearby-prod-app \
  --query 'services[0].events[:5]'

# View container logs
aws logs tail /ecs/nearby-app --follow
```
