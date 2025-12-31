# Networking Configuration

## Overview

The platform uses Docker networks for container communication. Both applications share a common network to access the same database and services.

---

## Docker Network Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     nearby-admin_default network                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ nearby-admin-   │  │ nearby-admin-   │  │ nearby-admin-   │     │
│  │ frontend-1      │  │ backend-1       │  │ db-1            │     │
│  │ (nginx)         │  │ (FastAPI)       │  │ (PostgreSQL)    │     │
│  │ Port: 5175      │  │ Port: 8001      │  │ Port: 5432      │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           │                    │                    │               │
│  ┌────────┴────────────────────┴────────────────────┴──────────┐   │
│  │                      Internal DNS                            │   │
│  │  frontend → nearby-admin-frontend-1                          │   │
│  │  backend → nearby-admin-backend-1                            │   │
│  │  db → nearby-admin-db-1                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │ minio           │  │ nearby-app      │                           │
│  │ (S3 storage)    │  │ (User app)      │                           │
│  │ Port: 9000,9001 │  │ Port: 8002      │                           │
│  └─────────────────┘  └─────────────────┘                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Port Mapping

### External Ports (Host Machine)

| Port | Service | Description |
|------|---------|-------------|
| 5175 | nearby-admin frontend | Admin UI |
| 8001 | nearby-admin backend | Admin API |
| 8002 | nearby-app | User app (API + UI) |
| 9000 | MinIO | S3 API |
| 9001 | MinIO | S3 Console |
| 5432 | PostgreSQL | Database |

### Internal Ports (Container Network)

| Port | Service | Used By |
|------|---------|---------|
| 5173 | Frontend (Vite/nginx) | nginx proxy |
| 8000 | Backend (uvicorn) | Frontend proxy |
| 5432 | PostgreSQL | All backends |
| 9000 | MinIO S3 | Image service |

---

## Network Configuration

### Creating the Network

```bash
# Automatically created by docker compose
docker compose up

# Or manually create
docker network create nearby-admin_default
```

### Connecting Containers

```yaml
# nearby-admin/docker-compose.yml
# Network is created automatically

services:
  backend:
    # ...
  frontend:
    # ...
  db:
    # ...

# nearby-app/docker-compose.dev.yml
# Connects to existing network

networks:
  nearby-admin_default:
    external: true

services:
  backend:
    networks:
      - nearby-admin_default
```

### Manual Container Connection

```bash
docker run -d --name nearby-app \
  --network nearby-admin_default \
  -p 8002:8000 \
  nearby-app:latest
```

---

## DNS Resolution

### Container Names as Hostnames

Within the Docker network, containers can reach each other by name:

```python
# From nearby-app, connect to nearby-admin database
DATABASE_URL=postgresql://nearby:nearby@nearby-admin-db-1:5432/nearbynearby

# From frontend, proxy to backend
proxy_pass http://nearby-admin-backend-1:8000
```

### DNS Collision Issue

**Problem**: Both apps have services named "backend" causing DNS conflicts.

```bash
# Multiple IPs returned for "backend"
docker exec nearby-admin-frontend-1 nslookup backend
# Returns: 172.20.0.5 AND 172.20.0.4
```

**Solution**: Use explicit container names:

```javascript
// nearby-admin/frontend/vite.config.js
proxy: {
  '/api': {
    target: 'http://nearby-admin-backend-1:8000',  // Explicit name
    changeOrigin: true
  }
}
```

---

## Nginx Configuration

### Production Frontend Proxy

```nginx
# nearby-admin/frontend/nginx.conf

server {
    listen 5173;
    server_name admin.nearbynearby.com;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Static assets caching
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Vite Development Proxy

**Important:** Always use explicit container names in proxy configuration to avoid DNS collision when both nearby-admin and nearby-app are running on the same Docker network.

```javascript
// nearby-admin/frontend/vite.config.js

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true  // Required for Docker
    },
    allowedHosts: [
      '.tesslate.com',
      '.nearbynearby.com'
    ],
    proxy: {
      '/api': {
        target: 'http://nearby-admin-backend-1:8000',  // Use explicit container name, NOT 'http://backend:8000'
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

---

## CORS Configuration

### Backend CORS Settings

```python
# nearby-admin/backend/app/main.py

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment Configuration

```bash
# Development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5175,http://localhost:8002

# Production
ALLOWED_ORIGINS=https://admin.nearbynearby.com,https://nearbynearby.com
```

---

## Troubleshooting

### Check Network Exists

```bash
docker network ls | grep nearby
```

### Inspect Network

```bash
docker network inspect nearby-admin_default
```

### Test DNS Resolution

```bash
docker exec nearby-admin-frontend-1 nslookup nearby-admin-backend-1
```

### Test Connectivity

```bash
# Ping between containers
docker exec nearby-admin-frontend-1 ping -c 3 nearby-admin-backend-1

# Test HTTP connection
docker exec nearby-admin-frontend-1 curl http://nearby-admin-backend-1:8000/health
```

### View Container IPs

```bash
docker network inspect nearby-admin_default --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'
```

---

## Security Considerations

### Internal Network Isolation

- Containers only expose necessary ports to host
- Internal communication stays within Docker network
- Database not exposed externally in production

### Production Recommendations

1. **Use private subnets** for database
2. **Security groups** to restrict access
3. **TLS/SSL** for external connections
4. **VPC** isolation for AWS deployments

---

## Network Commands Reference

```bash
# List networks
docker network ls

# Create network
docker network create nearby-admin_default

# Remove network
docker network rm nearby-admin_default

# Connect container to network
docker network connect nearby-admin_default nearby-app

# Disconnect container
docker network disconnect nearby-admin_default nearby-app

# Inspect network
docker network inspect nearby-admin_default

# Prune unused networks
docker network prune
```

---

## Best Practices

1. **Use explicit container names** - Avoid DNS collisions
2. **Don't expose database externally** - Keep port 5432 internal
3. **Use health checks** - Ensure services are ready
4. **Configure timeouts** - Set appropriate proxy timeouts
5. **Enable CORS properly** - Restrict to known origins
6. **Use environment variables** - Don't hardcode hostnames
