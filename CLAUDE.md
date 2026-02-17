# Claude Code Guidelines - Nearby Nearby Projects

This file provides guidance to Claude Code (claude.ai/code) when working with the Nearby Nearby platform.

---

## Documentation Reference (Source of Truth)

The `docs/` folder contains the authoritative documentation for each system:

### Architecture
- `docs/architecture/overview.md` - High-level system architecture, tech stack, data flow diagrams
- `docs/architecture/database-schema.md` - All database models, relationships, and field definitions
- `docs/architecture/api-reference.md` - Complete REST API endpoint documentation for both apps

### Core Systems
- `docs/systems/authentication.md` - JWT token auth, login flow, token management
- `docs/systems/authorization.md` - Role-based access control (Admin/Editor/Viewer)
- `docs/systems/poi-management.md` - CRUD operations for all 8 POI types
- `docs/systems/categories.md` - Hierarchical category system with parent-child relationships
- `docs/systems/images.md` - Image upload, S3/MinIO storage, variant generation
- `docs/systems/attributes.md` - Dynamic configurable fields for POIs
- `docs/systems/relationships.md` - POI-to-POI linking (event_venue, trail_in_park, etc.)
- `docs/systems/search.md` - Keyword (pg_trgm), semantic (pgvector), and hybrid search
- `docs/systems/geospatial.md` - **Nearby Nearby Feature**, PostGIS queries, distance calculations, map integration
- `docs/systems/seo.md` - Meta tags, Open Graph, structured data
- `docs/systems/users.md` - User management and admin scripts

### Infrastructure
- `docs/infrastructure/docker.md` - Container setup, compose files, multi-stage builds
- `docs/infrastructure/database.md` - PostgreSQL, PostGIS, migrations, extensions
- `docs/infrastructure/deployment.md` - CI/CD pipeline, AWS ECS, production deployment
- `docs/infrastructure/networking.md` - Docker networks, port mappings, DNS

### Frontend
- `docs/frontend/admin-frontend.md` - React/Mantine admin panel components
- `docs/frontend/app-frontend.md` - User-facing React app with Leaflet maps

### Testing
- `docs/testing/strategy.md` - Test priorities, folder structure, frameworks, CI/CD integration

---

## Google Sheets Project Tracker

The project task list, test coverage matrix, and bug log live in a shared Google Sheet. A CLI/Python client at `scripts/google_sheets/` provides full read/write access.

**Spreadsheet**: [NearbyNearby Project Tracker](https://docs.google.com/spreadsheets/d/1TXnwzQaY1RH7qWUCcFZzzlWMnrlAzBmwt7PekR8JrZg/edit)
**Full docs**: `scripts/google_sheets/README.md`

### Sheets

| Sheet | Alias | Contents |
|---|---|---|
| `PLAN` | `plan` | 186 tasks — priority, status, assignments, dependencies, PR# |
| `Feature Implementation List` | `features` / `impl` | 500+ test cases by feature area |
| `Edge Cases Causing Failures` | `bugs` / `edge` | Bug log with reproduction steps |

### CLI Quick Reference

```bash
# All commands: python -m scripts.google_sheets.sheets_client <command>

# Read
sheets head plan                              # First 10 rows (formatted table)
sheets cat plan --json                        # Entire sheet as JSON
sheets row plan 5                             # Single row as key:value
sheets headers plan                           # Column letters + names
sheets count plan                             # Row count
sheets info                                   # All sheets with dimensions

# Search
sheets grep plan "HTTP 500"                   # Regex search all columns
sheets grep plan "Manav" -c "Assigned To"     # Search specific column
sheets find plan Status "Not Started"         # Exact match
sheets filter plan Status="Not Started" "Assigned To"=Manav  # AND filter
sheets summary plan Status                    # Value counts with percentages

# Task shortcuts
sheets task 1                                 # Get task #1 as JSON
sheets status 1 "In Progress"                 # Update status
sheets status 1 "Complete" -n "Fixed in abc"  # Status + notes
sheets blocked-by 1                           # Tasks depending on task 1
sheets next-task                              # Next available task number

# Write
sheets set plan 5 Status="In Progress"        # Update columns by name
sheets append plan "113,,NEW,Title,..."        # Append row
sheets add-bug "Desc" "Location" "Repro"      # Log edge case
```

### Coding Agent Workflow

When picking up a task:

```python
from scripts.google_sheets.sheets_client import SheetsClient
client = SheetsClient()

task = client.get_task_by_number(5)           # Read task
client.update_task_status(5, "In Progress")   # Mark started
# ... do the work ...
client.update_task_status(5, "Complete", notes="Fixed in commit abc123")
```

---

## The "Nearby Nearby" Feature

The platform's namesake and flagship feature. Nearby Nearby is "The World's First Local Discovery Platform, Built for Rural America" - designed to help users discover local businesses, parks, trails, and events in areas underserved by traditional discovery platforms like Yelp or Google Maps.

### How It Works

When viewing any POI detail page, users see a **"NEARBY" section** that answers the question: *"I'm here... what else is around?"* The feature shows other places within a configurable radius, enabling users to:

1. **Discover hidden gems** - Find local businesses and outdoor spaces that don't show up on mainstream platforms
2. **Plan outings** - See what's nearby before visiting (e.g., "Is there a coffee shop near this trailhead?")
3. **Navigate easily** - Get directions via Google Maps, Apple Maps, or Waze with one click
4. **Check availability** - See hours for a specific date, filter out closed places and past events

### User Flow

```
User views POI detail page (e.g., "Jordan Lake State Park")
    ↓
"NEARBY" section loads with POIs within default 5-mile radius
    ↓
User can:
  • Filter by type using horizontal scrolling pills (All, Businesses, Events, Parks, Trails, Youth Events)
  • Search within nearby results using hybrid AI search (keyword + semantic)
  • Adjust radius via dropdown (1, 3, 5, 10, 15 miles)
  • Select date via smart dropdown (Today, Tomorrow, This Weekend, or pick custom)
  • Click map markers to highlight cards (and vice versa)
  • Get directions via modal (Google Maps, Apple Maps, Waze)
  • Copy address or lat/long to clipboard
```

### Controls Layout

```
┌─────────────────────────────────────────────────┐
│  NEARBY                                         │
│  12 listings                                    │
│                                                 │
│  [All] [Businesses] [Events] [Parks] [Trails] →│  ← Horizontal scroll
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🔍 Search nearby... try "pet friendly"  │   │  ← Full-width search
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [📍 5 miles ▼] [📅 Any Date ▼] [↺ Clear]      │  ← Dropdowns row
└─────────────────────────────────────────────────┘
```

### Key Components

| File | Purpose |
|------|---------|
| `nearby-app/app/src/components/nearby-feature/NearbySection.jsx` | Main container with map, filters, search, pagination, directions modal |
| `nearby-app/app/src/components/nearby-feature/NearbyCard.jsx` | POI cards with distance, hours, amenities, action buttons |
| `nearby-app/app/src/components/nearby-feature/NearbyFilters.jsx` | Horizontal scrolling filter pills with lucide-react icons |
| `nearby-app/app/src/components/Map.jsx` | Leaflet map with Carto Voyager tiles and numbered markers |

### Features

**Filtering & Search:**
- **Type filter pills**: All, Businesses, Events, Parks, Trails, Youth Events (with lucide icons)
- **Horizontal scroll**: Filter pills scroll horizontally on mobile with hidden scrollbar
- **Hybrid AI search**: Uses `/api/pois/hybrid-search` filtered to nearby results only
- **Date presets**: Today, Tomorrow, This Weekend, or pick a custom date (no manual entry)
- **Configurable radius**: 1, 3, 5, 10, or 15 miles via dropdown
- **Past event exclusion**: Automatically hides events that have already ended

**Map Features:**
- **Carto Voyager tiles**: Warm, MapQuest-like colors
- **Numbered markers**: Purple circles with numbers matching card positions
- **Current location**: Gold/yellow circle for the current POI
- **Auto-fit bounds**: Map zooms to show all markers
- **Click to highlight**: Clicking a marker scrolls to and highlights the card

**Mobile-First UX:**
- **44px+ touch targets**: All buttons meet WCAG accessibility standards
- **Horizontal scrolling**: Filter pills scroll on mobile
- **Icon-only mode**: On very small screens (< 480px), dropdowns show only icons
- **Responsive breakpoints**: 768px, 480px, 360px

**Other Features:**
- **Directions modal**: Choose Google Maps, Apple Maps, or Waze
- **Copy functionality**: Copy lat/long or address to clipboard
- **Amenity icons**: Restrooms, wheelchair accessible, WiFi, pet-friendly
- **Type-specific info**: Trail length/difficulty, park type, event dates
- **Pagination**: Handles large result sets with page navigation

### API

```
GET /api/pois/{poi_id}/nearby?radius_miles={radius}
```

Returns POIs within radius sorted by distance. Uses PostGIS `ST_DWithin` for efficient spatial queries.

**Full documentation**: `docs/systems/geospatial.md`

---

## Project Structure

This is a **monorepo** containing two applications:

- **[nearby-admin](nearby-admin/)**: Admin panel for managing POI database (frontend + backend)
- **[nearby-app](nearby-app/)**: User-facing application with ML-powered search (frontend + backend)

Both applications share the same production PostgreSQL database. Documentation lives in the root `docs/` folder (single source of truth).

---

## Database Safety Rules

**� CRITICAL: Production Database Protection**

- The production PostgreSQL database (`nearby-admin-db.ce3mwk2ymjh4.us-east-1.rds.amazonaws.com`) is **shared between both applications**
- **NEVER modify production data** - data loss is unacceptable
- **ONLY CONSUME** data from the production database (read-only operations)
- Never perform INSERT, UPDATE, DELETE, or any data modification operations on production data
- All write operations should only target development or test databases
- Database migrations should be tested locally first, then carefully applied to production

This rule ensures data integrity and prevents accidental modifications to live production data.

---

## Production Deployment (AWS ECS Fargate)

Production runs on **AWS ECS Fargate** with fully automated CI/CD. There are no manual rebuilds or SSH sessions — push to `main` and it deploys automatically.

```
Internet → Cloudflare (HTTPS) → ALB (HTTP port 80) → ECS Fargate
                                    │
                    ┌───────────────┴───────────────┐
           nearbynearby.com              admin.nearbynearby.com
           nearby-app service            nearby-admin service
           1 vCPU / 3GB                  0.5 vCPU / 1GB
           1 container                   2 containers (nginx + backend)
                    └───────────────┬───────────────┘
                              RDS PostgreSQL (existing, via VPC peering)
                              S3 + CloudFront (existing)
```

### How to Deploy

**Automatic**: Push code changes to `main` branch. GitHub Actions builds, tests, and deploys.
- `nearby-app/**` or `shared/**` changes → triggers app workflow
- `nearby-admin/**` or `shared/**` changes → triggers admin workflow

**Manual**: Go to GitHub → Actions → Select workflow → "Run workflow" → optionally check "Skip integration tests"

### Deployment Timing

| Workflow | Tests | Build + Push | ECS Deploy | Total |
|----------|-------|-------------|------------|-------|
| nearby-app | ~12 min | ~8 min | ~2 min | **~20 min** |
| nearby-app (skip tests) | skipped | ~8 min | ~2 min | **~10 min** |
| nearby-admin | none | ~2 min | ~1 min | **~3 min** |

### CI/CD Workflows

**`.github/workflows/deploy-app.yml`**:
1. Runs 225 integration tests against PostGIS service container
2. Builds multi-stage Docker image (~5.7GB with ML model)
3. Pushes to ECR with `latest` + `sha` tags
4. Forces new ECS deployment
5. Has `skip_tests` checkbox for manual triggers (push always runs tests)

**`.github/workflows/deploy-admin.yml`**:
1. Builds admin backend image (monorepo root context)
2. Builds admin frontend image
3. Pushes both to ECR
4. Forces new ECS deployment

Both use **GitHub OIDC** for AWS auth — no static credentials. Only secret: `AWS_ROLE_TO_ASSUME`.

### Monitoring Production

```bash
# View app logs (use MSYS_NO_PATHCONV=1 on Windows/Git Bash)
MSYS_NO_PATHCONV=1 aws logs tail '/ecs/nearbynearby-prod/app' --follow

# View admin logs
MSYS_NO_PATHCONV=1 aws logs tail '/ecs/nearbynearby-prod/admin' --follow

# Check service health
aws ecs describe-services \
  --cluster nearbynearby-prod \
  --services nearbynearby-prod-app nearbynearby-prod-admin \
  --query 'services[].{name:serviceName,running:runningCount,desired:desiredCount}'

# Check health endpoints directly
curl http://nearbynearby-prod-1716569837.us-east-1.elb.amazonaws.com/api/health
```

### Rollback

```bash
# List recent task definition revisions
aws ecs list-task-definitions --family-prefix nearbynearby-prod-app --sort DESC --max-items 5

# Roll back to previous revision
aws ecs update-service \
  --cluster nearbynearby-prod \
  --service nearbynearby-prod-app \
  --task-definition nearbynearby-prod-app:PREVIOUS_REVISION
```

### Infrastructure (Terraform)

All AWS infrastructure is managed in `terraform/`:
- **Modules used**: networking, ecr, ecs, alb, secrets, monitoring
- **Not used in prod**: database, storage (existing RDS and S3 kept as-is)
- **VPC peering**: ECS VPC (10.0.0.0/16) ↔ Default VPC (172.31.0.0/16) for RDS connectivity
- **State**: S3 backend with DynamoDB locking

```bash
# Apply infrastructure changes
cd terraform/environments/prod
export TF_VAR_database_url="postgresql://..."
export TF_VAR_forms_database_url="postgresql://..."
export TF_VAR_secret_key="..."
terraform plan
terraform apply
```

### Monthly Cost (~$156)

| Resource | Cost |
|----------|------|
| ECS Fargate (app: 1 vCPU/3GB) | ~$73 |
| ECS Fargate (admin: 0.5 vCPU/1GB) | ~$18 |
| NAT Gateway | ~$32 |
| ALB | ~$16 |
| RDS (existing) | ~$13 |
| ECR + CloudWatch | ~$4 |

---

## nearby-admin (Admin Panel)

### Architecture
- **Frontend**: React + Vite → nginx (production)
- **Backend**: FastAPI (Python)
- **ECS**: 2 containers in 1 task sharing localhost (awsvpc mode)
- **Deployment**: Automatic via GitHub Actions on push to `main`

---

## Local Development with Shared Local Database

For local development, both applications can share a local PostGIS database instead of connecting to production RDS.

### Prerequisites
- Docker and Docker Compose installed

### Step 1: Configure Environment Files

**nearby-admin/.env** - Uses internal Docker network hostname:
```
DATABASE_URL=postgresql://nearby:nearby@db:5432/nearbynearby
POSTGRES_USER=nearby
POSTGRES_PASSWORD=nearby
POSTGRES_DB=nearbynearby
```

**nearby-app/backend/.env** - Uses the nearby-admin database container name:
```
DATABASE_URL=postgresql://nearby:nearby@nearby-admin-db-1:5432/nearbynearby
```

### Step 2: Start nearby-admin (Creates Database)

```bash
cd nearby-admin
docker compose up --build -d
```

This creates:
- `nearby-admin_default` network (shared between apps)
- `nearby-admin-db-1` PostGIS database container
- Backend on port 8001
- Frontend on port 5175

### Step 3: Start nearby-app

```bash
cd nearby-app
docker build -t nearby-app:latest .
docker run -d --name nearby-app \
  -p 8002:8000 \
  --network nearby-admin_default \
  --env-file backend/.env \
  nearby-app:latest
```

### Step 4: Create Admin User

```bash
docker exec nearby-admin-backend-1 python scripts/manage_users.py create admin@nearby.com admin123 --role admin
```

### Local Access Points

| Service | URL |
|---------|-----|
| nearby-app (user app) | http://localhost:8002 |
| nearby-admin frontend | http://localhost:5175 |
| nearby-admin API docs | http://localhost:8001/docs |

### Local Development Notes

- The local PostGIS database does NOT include `pgvector` extension - semantic/vector search is disabled
- Fuzzy text search (`pg_trgm`) works normally
- The ML embedding model (~1GB) loads on nearby-app startup - first request may be slow
- Data persists in Docker volume `nearby-admin_postgres_data`
- To reset the database: `docker volume rm nearby-admin_postgres_data`

### Stop Local Development

```bash
# Stop nearby-app
docker stop nearby-app && docker rm nearby-app

# Stop nearby-admin (keeps database volume)
cd nearby-admin && docker compose down

# Stop and remove database volume (full reset)
cd nearby-admin && docker compose down -v
```

---

## nearby-app (User-Facing Application)

### Architecture
- **Combined Build**: Frontend + Backend in single container (~5.7GB image)
- **Frontend**: React + Vite (compiled to static files, served by FastAPI)
- **Backend**: FastAPI (Python) with ML model (`embeddinggemma-300m`, ~1GB)
- **ECS**: 1 vCPU / 3GB, single container, auto-scales 1-3 tasks
- **Deployment**: Automatic via GitHub Actions on push to `main`
- **Health check**: `/api/health` with 120s start period (ML model loading)

---

## Testing

### Automated Tests (225 integration tests)

Tests live in the root `tests/` directory and cover admin CRUD, cross-app data flow, search engine, public forms, and real S3 image uploads. They run against disposable PostGIS + MinIO containers — never production.

```bash
# 1. Start test containers (PostGIS on port 5434, MinIO on port 9100)
docker compose -f tests/docker-compose.test.yml up -d

# 2. Run all tests
pytest tests/ -v

# Run a specific file
pytest tests/test_admin_business.py -v

# Stop on first failure
pytest tests/ -v -x

# 3. Stop test containers when done
docker compose -f tests/docker-compose.test.yml down
```

No manual environment variable setup needed — `tests/conftest.py` handles everything.

### CI/CD Test Integration

- Tests run automatically in GitHub Actions on every push to `main` (for nearby-app)
- Tests run on **GitHub-hosted Ubuntu runners** — nothing runs on your AWS or local machine
- GitHub free tier: 2,000 min/month (private repos), unlimited (public)
- Test job takes ~12 minutes (PostGIS service container + 225 tests)
- Tests gate deployment — build-and-deploy only runs if tests pass
- Manual workflow_dispatch has "Skip integration tests" checkbox for hotfixes

**When to run tests locally:**
- Before pushing code (catch bugs before CI)
- After any backend code change (models, schemas, CRUD, endpoints)
- After modifying shared enums or constants

**Full docs:** `docs/testing/strategy.md`

---

## Quick Reference

### Production (ECS)

```bash
# Check service health
aws ecs describe-services \
  --cluster nearbynearby-prod \
  --services nearbynearby-prod-app nearbynearby-prod-admin \
  --query 'services[].{name:serviceName,running:runningCount,desired:desiredCount,events:events[0].message}'

# View logs (use MSYS_NO_PATHCONV=1 on Windows/Git Bash)
MSYS_NO_PATHCONV=1 aws logs tail '/ecs/nearbynearby-prod/app' --follow
MSYS_NO_PATHCONV=1 aws logs tail '/ecs/nearbynearby-prod/admin' --follow

# Force redeploy (without code changes)
aws ecs update-service --cluster nearbynearby-prod --service nearbynearby-prod-app --force-new-deployment
aws ecs update-service --cluster nearbynearby-prod --service nearbynearby-prod-admin --force-new-deployment

# Check GitHub Actions workflow status
gh run list --limit 5

# Manually trigger deployment
gh workflow run "Deploy nearby-app to AWS ECR/ECS" --ref main
gh workflow run "Deploy nearby-admin to AWS ECR/ECS" --ref main
```

### Local Development

```bash
# nearby-admin (dev mode)
cd nearby-admin && docker compose up --build

# nearby-app (dev mode with hot reload)
cd nearby-app && docker compose -f docker-compose.dev.yml up --build

# Run tests
docker compose -f tests/docker-compose.test.yml up -d
pytest tests/ -v
docker compose -f tests/docker-compose.test.yml down
```

---

## Important Notes

### Port Mapping

#### Complete Port Reference

| Service | Dev Port | Prod Port | Internal | Purpose |
|---------|----------|-----------|----------|---------|
| nearby-admin Frontend | 5175 | 5175 | 5173 | Admin UI (Vite dev server / nginx in prod) |
| nearby-admin Backend | 8001 | 8001 | 8000 | Admin API (FastAPI) |
| nearby-app Backend | 8002 | 8002 | 8000 | User App API (serves prebuilt frontend in prod) |
| nearby-app Frontend | **8003** | N/A | 5173 | User App UI (Vite dev server - **dev only**) |
| MinIO S3 | 9000, 9001 | 9000, 9001 | N/A | Object Storage |
| PostgreSQL (Local) | 5433 | N/A | 5432 | Database (local dev only) |

#### Understanding Port 8002 vs 8003 (nearby-app)

**Port 8002 - Backend API (always used)**
- Maps to internal port 8000 (FastAPI)
- In **production**: Serves BOTH the API AND the prebuilt Vite dist (static files baked into container via multi-stage build)
- In **development**: Only serves the API; frontend uses port 8003

**Port 8003 - Frontend Dev Server (development only)**
- Maps to internal port 5173 (Vite)
- Provides hot module reloading (HMR) for frontend development
- **NOT used in production** - frontend is prebuilt and served by backend on 8002
- Set `VITE_API_BASE_URL=http://localhost:8002` to connect to backend

#### nearby-app Development Mode (with hot reload)

```bash
# Start both frontend and backend with hot reloading
cd nearby-app
docker compose -f docker-compose.dev.yml up --build

# Access points in dev mode:
# - Frontend (hot reload): http://localhost:8003
# - Backend API: http://localhost:8002
# - API docs: http://localhost:8002/docs
```

#### Summary
- **Production**: Use port 8002 only (serves both API and prebuilt frontend)
- **Development**: Use port 8003 for frontend (hot reload) + port 8002 for API

### Network Configuration
- Both applications can communicate via `nearby-admin_default` network
- nearby-app container connects to this network to share resources

### Database Connection
- Both applications connect to the same RDS PostgreSQL instance
- Connection string stored in environment variables
- Never hardcode database credentials

### Git Configuration

**IMPORTANT**: When making commits, ALWAYS use the user's identity:
- **Git User Name**: Manav M
- **Git User Email**: manavmaj2001@gmail.com

Claude is NEVER a contributor or co-author. All commits should be attributed to the user only.

---

## App-Specific Documentation

For detailed documentation about each application:
- [nearby-admin/CLAUDE.md](nearby-admin/CLAUDE.md) - Comprehensive admin panel documentation
- [nearby-app/CLAUDE.md](nearby-app/CLAUDE.md) - User-facing app documentation

---

## Emergency Procedures

### If Production is Down

1. **Check ECS service status**:
   ```bash
   aws ecs describe-services \
     --cluster nearbynearby-prod \
     --services nearbynearby-prod-app nearbynearby-prod-admin \
     --query 'services[].{name:serviceName,running:runningCount,desired:desiredCount,events:events[0:3]}'
   ```

2. **Check CloudWatch logs for errors**:
   ```bash
   MSYS_NO_PATHCONV=1 aws logs tail '/ecs/nearbynearby-prod/app' --since 30m
   MSYS_NO_PATHCONV=1 aws logs tail '/ecs/nearbynearby-prod/admin' --since 30m
   ```

3. **Force redeploy** (pulls latest image and restarts):
   ```bash
   aws ecs update-service --cluster nearbynearby-prod --service nearbynearby-prod-app --force-new-deployment
   aws ecs update-service --cluster nearbynearby-prod --service nearbynearby-prod-admin --force-new-deployment
   ```

4. **Rollback to previous version**:
   ```bash
   # List recent task definition revisions
   aws ecs list-task-definitions --family-prefix nearbynearby-prod-app --sort DESC --max-items 5

   # Deploy a specific previous revision
   aws ecs update-service --cluster nearbynearby-prod --service nearbynearby-prod-app \
     --task-definition nearbynearby-prod-app:PREVIOUS_REVISION_NUMBER
   ```

5. **Check health endpoints**:
   ```bash
   curl http://nearbynearby-prod-1716569837.us-east-1.elb.amazonaws.com/api/health
   ```

### Database Connection Issues

1. **Check if ECS tasks can reach RDS** (look for "Connection timed out" in logs):
   ```bash
   MSYS_NO_PATHCONV=1 aws logs tail '/ecs/nearbynearby-prod/app' --filter-pattern "Connection" --since 10m
   ```

2. **Verify VPC peering is active**:
   ```bash
   aws ec2 describe-vpc-peering-connections \
     --filters "Name=status-code,Values=active" \
     --query 'VpcPeeringConnections[].{Id:VpcPeeringConnectionId,Status:Status.Code}'
   ```

3. **Check SSM parameter values** (secrets):
   ```bash
   MSYS_NO_PATHCONV=1 aws ssm get-parameter --name '/nearbynearby/prod/database-url' --with-decryption --query 'Parameter.Value' --output text
   ```

---

For EDITS to the database structure, make migrations not manual edits.

## User Management

The nearby-admin backend includes a user management script. In production (ECS), use `aws ecs execute-command`:

```bash
# Get the running task ID
TASK_ID=$(aws ecs list-tasks --cluster nearbynearby-prod --service-name nearbynearby-prod-admin --query 'taskArns[0]' --output text | awk -F/ '{print $NF}')

# Create a new user
aws ecs execute-command --cluster nearbynearby-prod --task $TASK_ID \
  --container backend --interactive \
  --command "python scripts/manage_users.py create admin@nearby.com password123 --role admin"

# List all users
aws ecs execute-command --cluster nearbynearby-prod --task $TASK_ID \
  --container backend --interactive \
  --command "python scripts/manage_users.py list"
```

For local development:
```bash
docker exec nearby-admin-backend-1 python scripts/manage_users.py create <email> <password> --role admin
docker exec nearby-admin-backend-1 python scripts/manage_users.py list
```

---

## Development Best Practices

1. **Always test locally first** before deploying to production
2. **Read logs** after rebuilding to catch errors early
3. **Never commit secrets** or database credentials
4. **Keep .env files secure** and never commit them
5. **Test database migrations locally** before applying to production
6. **Monitor resource usage** (especially ML model memory in nearby-app)
7. **Use proper error handling** and logging in all code changes

---

## Known Issues & Solutions

### Docker DNS Collision (CRITICAL)

**Problem**: Both `nearby-admin` and `nearby-app` have backend services named `backend` in their docker-compose files. When both are running on the same Docker network (`nearby-admin_default`), DNS lookups for `backend` return BOTH IP addresses, causing requests to randomly route to the wrong backend.

**Symptoms**:
- `405 Method Not Allowed` errors on POST/PUT requests
- Intermittent failures (works sometimes, fails other times)
- Requests not appearing in expected backend logs

**Root Cause**:
```bash
# DNS lookup returns two IPs:
docker exec nearby-admin-frontend-1 nslookup backend
# Returns: 172.20.0.5 (nearby-admin-backend) AND 172.20.0.4 (nearby-app-backend)
```

**Solution**: Use explicit container names instead of service names in proxy configurations:
```javascript
// nearby-admin/frontend/vite.config.js
proxy: {
  '/api': {
    target: 'http://nearby-admin-backend-1:8000',  // NOT 'http://backend:8000'
    changeOrigin: true,
    secure: false,
  },
},
```

### Vite Proxy Configuration

**Location**: `nearby-admin/frontend/vite.config.js`

**Key Settings**:
```javascript
server: {
  host: '0.0.0.0',
  strictPort: true,
  port: 5173,
  watch: { usePolling: true },  // Required for Docker
  allowedHosts: ['.tesslate.com', '.nearbynearby.com'],
  proxy: {
    '/api': {
      target: 'http://nearby-admin-backend-1:8000',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

### pgvector / Embedding Column

**Problem**: The `nearby-app` SQLAlchemy model defines an `embedding` column using pgvector, but:
- Local dev database doesn't have pgvector extension installed
- Production may or may not have the embedding column yet
- SQLAlchemy includes ALL model columns in SELECT queries, causing failures

**Solution**:
1. Remove `embedding` from the SQLAlchemy ORM model (`nearby-app/backend/app/models/poi.py`)
2. Check for column existence at runtime in search functions
3. Fall back to keyword search when embedding is unavailable

```python
# Check if embedding column exists before using it
from sqlalchemy import text
result = db.execute(text(
    "SELECT column_name FROM information_schema.columns "
    "WHERE table_name = 'points_of_interest' AND column_name = 'embedding'"
)).fetchone()
if not result:
    return search_pois(db, query)  # Fallback to keyword search
```

### Publication Status Filtering

**Important**: All `nearby-app` endpoints filter by `publication_status == 'published'`. Draft POIs created in nearby-admin will NOT appear in nearby-app until published.

**Endpoints that filter**:
- `/api/pois/search`
- `/api/pois/semantic-search`
- `/api/pois/hybrid-search`
- `/api/pois/{poi_id}`
- `/api/pois/by-slug/{slug}`
- `/api/pois/by-type/{type}`
- `/api/pois/by-category/{slug}`
- `/api/nearby`

---

## Debugging Tips

### Check Docker DNS Resolution
```bash
docker exec nearby-admin-frontend-1 nslookup backend
```

### Test API Endpoints Directly
```bash
# Test backend directly (bypassing proxy)
curl -X POST http://localhost:8001/api/pois/ -H "Content-Type: application/json" -d '{"name":"test"}'

# Test through Vite proxy
curl -X POST http://localhost:5175/api/pois/ -H "Content-Type: application/json" -d '{"name":"test"}'
```

### Check Database Column Existence
```bash
docker exec nearby-admin-backend-1 python -c "
from app.database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
result = db.execute(text(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'points_of_interest' AND column_name = 'embedding'\")).fetchone()
print('embedding column exists:', result is not None)
db.close()
"
```

### Check POI Publication Status
```bash
docker exec nearby-admin-backend-1 python -c "
from app.database import SessionLocal
from app.models.poi import PointOfInterest
db = SessionLocal()
for poi in db.query(PointOfInterest).all():
    print(f'{poi.name}: {poi.publication_status}')
db.close()
"
```

### View Container Network Info
```bash
docker network inspect nearby-admin_default
```

---

## File Locations Reference

| Purpose | File |
|---------|------|
| Admin Vite proxy config | `nearby-admin/frontend/vite.config.js` |
| Admin backend routes | `nearby-admin/backend/app/api/endpoints/pois.py` |
| Admin POI model | `nearby-admin/backend/app/models/poi.py` |
| App search functions | `nearby-app/backend/app/crud/crud_poi.py` |
| App POI model | `nearby-app/backend/app/models/poi.py` |
| Admin docker compose (dev) | `nearby-admin/docker-compose.yml` |
| Admin docker compose (local prod) | `nearby-admin/docker-compose.prod.yml` |
| App docker compose (dev) | `nearby-app/docker-compose.dev.yml` |
| App CI/CD workflow | `.github/workflows/deploy-app.yml` |
| Admin CI/CD workflow | `.github/workflows/deploy-admin.yml` |
| App Dockerfile (ECS + local prod) | `nearby-app/Dockerfile` |
| Admin backend Dockerfile (ECS) | `nearby-admin/backend/Dockerfile.ecs` |
| Admin frontend Dockerfile (ECS) | `nearby-admin/frontend/Dockerfile.prod` |
| Nginx template (ECS) | `nearby-admin/frontend/nginx.conf.template` |
| Terraform root | `terraform/environments/prod/main.tf` |
| Terraform modules | `terraform/modules/{networking,ecr,ecs,alb,secrets,monitoring}/` |
| Integration tests | `tests/` (225 tests) |
| Test containers | `tests/docker-compose.test.yml` |
| Shared enums | `shared/models/enums.py` |

