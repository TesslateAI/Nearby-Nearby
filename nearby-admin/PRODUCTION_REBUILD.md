# Production Rebuild Guide

Quick reference for rebuilding and deploying the production admin panel.

## Quick Rebuild Commands

### Full Rebuild (after code changes)
```bash
cd /home/ubuntu/Nearby-Nearby
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d
```

### Restart Services (no code changes)
```bash
docker compose -f docker-compose.prod.yml restart
```

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Backend only
docker compose -f docker-compose.prod.yml logs -f backend

# Frontend only
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Stop Services
```bash
docker compose -f docker-compose.prod.yml down
```

## What Gets Built

### Frontend (Production)
- **Dockerfile**: `frontend/Dockerfile.prod`
- **Build Command**: `npm run build`
- **Output**: Minified, gzipped React production build
- **Served by**: nginx
- **Port**: 5175 (mapped to internal 5173)
- **Build Time**: ~20-30 seconds

### Backend (Production)
- **Dockerfile**: `backend/Dockerfile`
- **Port**: 8001 (mapped to internal 8000)
- **Database**: AWS RDS PostgreSQL
- **Auto-runs**: Alembic migrations on startup

## Architecture

```
https://admin.nearbynearby.com (Cloudflare)
    ↓ Cloudflare Tunnel
localhost:5175 → nginx (React production build)
    ↓ Internal proxy
backend:8000 → FastAPI
    ↓
AWS RDS PostgreSQL (nearbynearby database)
```

## Common Tasks

### After Frontend Code Changes
```bash
docker compose -f docker-compose.prod.yml up --build -d frontend
```

### After Backend Code Changes
```bash
docker compose -f docker-compose.prod.yml up --build -d backend
```

### After Database Model Changes
```bash
# Create migration
docker compose -f docker-compose.prod.yml exec backend alembic revision --autogenerate -m "Description"

# Apply migration (done automatically on restart, or manually:)
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### Check Service Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Access Running Containers
```bash
# Backend shell
docker compose -f docker-compose.prod.yml exec backend sh

# Frontend shell
docker compose -f docker-compose.prod.yml exec frontend sh
```

## File Locations

- **Production Config**: `docker-compose.prod.yml`
- **Dev Config**: `docker-compose.yml`
- **Frontend Prod Dockerfile**: `frontend/Dockerfile.prod`
- **Frontend Dev Dockerfile**: `frontend/Dockerfile`
- **Backend Dockerfile**: `backend/Dockerfile`
- **Nginx Config**: `frontend/nginx.conf`
- **Environment**: `.env`

## Performance Optimizations

The production build includes:
- ✅ Minified JavaScript (1.57 MB → 471 KB gzipped)
- ✅ Minified CSS (249 KB → 41 KB gzipped)
- ✅ Static asset caching (1 year)
- ✅ Gzip compression
- ✅ Security headers
- ✅ SPA routing support

## Troubleshooting

### Site shows 502 error
```bash
# Check if services are running
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs --tail 50

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### Frontend not updating after rebuild
```bash
# Force rebuild without cache
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### Database connection issues
```bash
# Check backend logs
docker compose -f docker-compose.prod.yml logs backend --tail 100

# Verify .env DATABASE_URL is correct
cat .env | grep DATABASE_URL
```

### Check what's listening on ports
```bash
ss -tlnp | grep -E '5175|8001'
```

## Development vs Production

| Aspect | Development | Production |
|--------|------------|------------|
| **Command** | `docker compose up` | `docker compose -f docker-compose.prod.yml up -d` |
| **Frontend Port** | 5175 (Vite dev server) | 5175 (nginx) |
| **Backend Reload** | Yes (--reload) | No |
| **Build Time** | Instant (no build) | ~20-30s |
| **Performance** | Slower | Optimized |
| **Hot Module Reload** | Yes | No |

## Quick Reference

```bash
# Full production rebuild
docker compose -f docker-compose.prod.yml up --build -d

# Quick restart
docker compose -f docker-compose.prod.yml restart

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop everything
docker compose -f docker-compose.prod.yml down
```
