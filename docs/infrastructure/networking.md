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

### Production (AWS ECS)

In production, networking is managed by Terraform (`terraform/modules/networking/`).

#### VPC Layout

Two VPCs are involved in the production architecture:

| VPC | CIDR | Purpose |
|-----|------|---------|
| **ECS VPC** | `10.0.0.0/16` | Managed by Terraform, hosts all ECS infrastructure |
| **Default VPC** | `172.31.0.0/16` | Pre-existing AWS default VPC where RDS lives |

**ECS VPC subnets** (across 2 availability zones):

| Subnet Type | CIDRs | Purpose |
|-------------|-------|---------|
| Public | `10.0.1.0/24`, `10.0.2.0/24` | Application Load Balancer (ALB) |
| Private | `10.0.10.0/24`, `10.0.11.0/24` | ECS tasks (Fargate) |
| Database | `10.0.20.0/24`, `10.0.21.0/24` | Unused — RDS is in the default VPC, not here |

#### VPC Peering

Because the RDS instance lives in the default VPC (`172.31.0.0/16`) and ECS tasks run in the ECS VPC (`10.0.0.0/16`), a **VPC peering connection** bridges the two:

- **Peering connection** established between ECS VPC and Default VPC
- **DNS resolution** enabled in both directions so ECS tasks can resolve the RDS hostname to a private IP
- **Route table entries** added in three places:
  1. **ECS private subnet route table**: `172.31.0.0/16 → pcx-xxxxx` (peering connection)
  2. **Default VPC main route table**: `10.0.0.0/16 → pcx-xxxxx`
  3. **Default VPC RDS subnet route table**: `10.0.0.0/16 → pcx-xxxxx`
- **RDS security group rule**: Inbound TCP port `5432` allowed from `10.0.0.0/16` CIDR

#### Traffic Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│  INBOUND (user requests)                                                 │
│                                                                          │
│  Internet → Cloudflare (SSL termination, HTTPS)                          │
│          → ALB (public subnets 10.0.1.0/24, 10.0.2.0/24, port 80 HTTP) │
│          → ECS tasks (private subnets 10.0.10.0/24, 10.0.11.0/24)      │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  OUTBOUND (ECS → Internet)                                               │
│                                                                          │
│  ECS tasks (private subnets)                                             │
│          → NAT Gateway (public subnets)                                  │
│          → Internet (ECR image pulls, HuggingFace ML model download)    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  DATABASE (ECS → RDS)                                                    │
│                                                                          │
│  ECS tasks (private subnets, 10.0.10.0/24)                               │
│          → VPC Peering (pcx-xxxxx)                                       │
│          → RDS in default VPC (172.31.0.0/16, port 5432)                │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Security Groups

| Security Group | Inbound Rules | Outbound Rules | Purpose |
|----------------|---------------|----------------|---------|
| **ALB SG** | TCP 80 from `0.0.0.0/0`, TCP 443 from `0.0.0.0/0` | All traffic | Public-facing load balancer |
| **ECS SG** | All ports from ALB SG (source: ALB SG ID) | All traffic | ECS Fargate tasks |
| **RDS SG** (existing) | TCP 5432 from ECS SG + TCP 5432 from `10.0.0.0/16` CIDR | All traffic | Database access via peering and SG reference |

The RDS security group has two complementary rules for port 5432:
- **SG reference rule**: Allows traffic from the ECS security group by ID (standard for same-VPC access patterns)
- **CIDR rule**: Allows traffic from `10.0.0.0/16` (required because cross-VPC peered traffic cannot use SG references)

#### ECS Networking Mode

ECS tasks use **awsvpc** networking mode:
- Each task gets its own Elastic Network Interface (ENI) with a private IP in the private subnet
- Containers within the same task share `localhost` — they communicate over `127.0.0.1`
- **nearby-admin**: The nginx and backend containers share the same task network namespace, so nginx reaches the backend via `localhost:8000`. This is controlled by `BACKEND_HOST=localhost` in the nginx template
- **nearby-app**: Single container serving both API and prebuilt frontend on port 8000

#### Cloudflare SSL

SSL is handled in **Flexible mode**:
- **Cloudflare** terminates HTTPS from the client (browser → Cloudflare is encrypted)
- **Cloudflare → ALB** connection is plain HTTP on port 80 (within AWS network)
- This avoids needing an ACM certificate on the ALB while still providing HTTPS to end users
- `X-Forwarded-Proto` header is set to `https` by Cloudflare so the backend can detect the original scheme

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
