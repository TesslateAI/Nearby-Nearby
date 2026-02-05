# Docker Configuration

## Overview

Both applications use Docker for containerization with Docker Compose for orchestration. The setup supports development and production environments.

**Key Files:**
- `nearby-admin/docker-compose.yml` - Development
- `nearby-admin/docker-compose.prod.yml` - Production
- `nearby-admin/backend/Dockerfile` - Backend dev
- `nearby-admin/backend/Dockerfile.prod` - Backend prod
- `nearby-admin/frontend/Dockerfile` - Frontend dev
- `nearby-admin/frontend/Dockerfile.prod` - Frontend prod
- `nearby-app/Dockerfile` - Combined build

---

## nearby-admin Docker Setup

### Development (docker-compose.yml)

```yaml
version: '3.8'

services:
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nearby -d nearbynearby"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: nearby-admin-backend  # Explicit name to avoid DNS collision
    ports:
      - "8001:8000"
    volumes:
      - ./backend:/app
      - image_storage:/app/images
    environment:
      - DATABASE_URL=postgresql://nearby:nearby@db:5432/nearbynearby
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      minio:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: nearby-admin-frontend  # Explicit name to avoid DNS collision
    ports:
      - "5175:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=/api
    depends_on:
      - backend
    command: npm run dev -- --host 0.0.0.0

volumes:
  postgres_data:
  minio_data:
  image_storage:
```

### Production (docker-compose.prod.yml)

**Note:** Production uses real AWS S3 for image storage. MinIO is only used in development.

```yaml
version: '3.8'

services:
  # MinIO removed from production - uses real AWS S3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: nearby-admin-backend  # Explicit name for DNS resolution
    ports:
      - "8001:8000"
    volumes:
      - image_storage:/app/images
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: nearby-admin-frontend  # Explicit name for DNS resolution
    ports:
      - "5175:5173"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  image_storage:
```

---

## Dockerfiles

### Backend Development

```dockerfile
# nearby-admin/backend/Dockerfile

FROM python:3.10-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Final stage
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels and install
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copy application
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### Backend Production

```dockerfile
# nearby-admin/backend/Dockerfile.prod

FROM python:3.10-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Final stage
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser

# Copy wheels and install
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copy application
COPY . .

# Set ownership
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# No --reload flag in production
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Development

```dockerfile
# nearby-admin/frontend/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### Frontend Production

```dockerfile
# nearby-admin/frontend/Dockerfile.prod

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
```

---

## nearby-app Docker Setup

### Combined Dockerfile

```dockerfile
# nearby-app/Dockerfile

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY app/package*.json ./
RUN npm ci

COPY app/ .
RUN npm run build

# Stage 2: Python backend with frontend assets
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./static

# Create data directory
RUN mkdir -p /app/data

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Development Compose

```yaml
# nearby-app/docker-compose.dev.yml

version: '3.8'

services:
  frontend:
    build:
      context: ./app
      dockerfile: Dockerfile.dev
    ports:
      - "8003:5173"
    volumes:
      - ./app:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=http://localhost:8002

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8002:8000"
    volumes:
      - ./backend:/app
    env_file:
      - ./backend/.env
    depends_on:
      - frontend
    networks:
      - nearby-admin_default

networks:
  nearby-admin_default:
    external: true
```

---

## Common Commands

### nearby-admin

```bash
# Development
docker compose up --build              # Start with rebuild
docker compose up -d                   # Start in background
docker compose logs -f                 # Follow logs
docker compose logs -f backend         # Backend logs only
docker compose down                    # Stop services
docker compose down -v                 # Stop and remove volumes

# Production
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml restart
```

### nearby-app

```bash
# Build and run
docker build -t nearby-app:latest .
docker run -d --name nearby-app \
  -p 8002:8000 \
  --network nearby-admin_default \
  -e DATABASE_URL="postgresql://..." \
  nearby-app:latest

# Management
docker logs nearby-app
docker logs -f nearby-app
docker stop nearby-app
docker rm nearby-app

# Rebuild script
./rebuild.sh
```

---

## Volume Management

### List Volumes

```bash
docker volume ls | grep nearby
```

### Remove Volumes

```bash
# Remove specific volume
docker volume rm nearby-admin_postgres_data

# Remove all unused volumes
docker volume prune
```

### Backup Database Volume

```bash
# Create backup
docker run --rm \
  -v nearby-admin_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar cvf /backup/postgres_backup.tar /data

# Restore backup
docker run --rm \
  -v nearby-admin_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xvf /backup/postgres_backup.tar -C /
```

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
ALLOWED_ORIGINS=http://localhost:5175,https://admin.nearbynearby.com

# Storage (S3/MinIO)
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=nearby-images
AWS_S3_ENDPOINT_URL=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
```

---

## Health Checks

### Backend Health Endpoint

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Docker Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs nearby-admin-backend-1

# Check container status
docker ps -a

# Inspect container
docker inspect nearby-admin-backend-1
```

### Database Connection Issues

```bash
# Test database connectivity
docker exec nearby-admin-backend-1 python -c "
from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('Database connected:', result.scalar())
"
```

### Port Conflicts

```bash
# Find what's using a port
netstat -tulpn | grep 8001
# or
lsof -i :8001
```

---

## Best Practices

1. **Use multi-stage builds** - Reduce image size
2. **Run as non-root** - Security best practice
3. **Add health checks** - Enable automatic recovery
4. **Use .dockerignore** - Exclude unnecessary files
5. **Pin versions** - Avoid unexpected updates
6. **Use named volumes** - Persist data properly
7. **Set resource limits** - Prevent runaway containers
