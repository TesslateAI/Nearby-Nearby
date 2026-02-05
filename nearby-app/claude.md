# Claude Code Guidelines - nearby-app

This file provides guidance to Claude Code (claude.ai/code) when working with the **nearby-app** (user-facing application).

> **Monorepo**: This is part of the NearbyNearby monorepo. See the root [CLAUDE.md](../CLAUDE.md) for overall project guidance and [docs/](../docs/) for full platform documentation.

## Database Safety Rules

**CRITICAL: Production Database Protection**

- The production PostgreSQL database (`nearby-admin-db.ce3mwk2ymjh4.us-east-1.rds.amazonaws.com`) is shared with the nearby-admin panel
- **NEVER modify production data** - data loss is unacceptable
- **ONLY CONSUME** data from the production database (read-only operations)
- Never perform INSERT, UPDATE, DELETE, or any data modification operations on production data
- All write operations should only target development or test databases

This rule ensures data integrity and prevents accidental modifications to live production data.

## Production Deployment

**CRITICAL: Production build is currently running on the server**

### Rebuilding the Container

**When to rebuild:**
- After making changes to frontend code (React components, CSS, etc.)
- After making changes to backend code (Python, FastAPI routes, ML models, etc.)
- After updating dependencies or configuration
- **REQUIRED when testing** - changes won't appear until you rebuild

To rebuild and restart the production container:

```bash
cd /home/ubuntu/nearby-app
./rebuild.sh
```

**What the rebuild script does:**
1. Stops and removes the existing `nearby-app` container
2. Rebuilds the Docker image from scratch (multi-stage build)
3. Starts a new container with the updated code
4. Displays container status and recent logs

**Container Configuration:**
- Container name: `nearby-app`
- Port: `8002:8000` (access via http://localhost:8002)
- Domain: `nearbynearby.com`
- Network: `nearby-admin_default` (shared with admin panel)
- Database: Production RDS PostgreSQL (shared)

**Production Build Architecture:**
- **Multi-stage build**: Frontend built first, then copied to backend container
- **Stage 1**: Node.js builds React app -> outputs to `../backend/static`
- **Stage 2**: Python container serves both API and static frontend
- **ML Model**: `michaelfeil/embeddinggemma-300m` loaded on startup (~1GB RAM)
- **Database Extensions**: `pg_trgm` (fuzzy search), `pgvector` (semantic search)
- **Single container** serves both frontend and backend on port 8000

### CI/CD (Automated Deployment)

Changes to `main` branch (in the `nearby-app/` directory) trigger automated deployment to AWS ECS:

**Workflow:** `.github/workflows/deploy-app.yml` (at monorepo root)
- Builds Docker image with context `./nearby-app`
- Pushes to Amazon ECR
- Forces new ECS deployment
- Uses GitHub OIDC for AWS authentication
- Path-filtered: only triggers on `nearby-app/**` changes

**AWS Resources:**
- ECR Repository: Stores Docker images
- ECS Cluster: Runs production containers
- ECS Service: Manages container deployment

### Manual Deployment Commands

```bash
# Full rebuild (local testing)
cd /home/ubuntu/nearby-app
./rebuild.sh

# View logs
docker logs nearby-app

# Follow logs in real-time
docker logs -f nearby-app

# Check container status
docker ps | grep nearby-app

# Stop container
docker stop nearby-app

# Remove container
docker rm nearby-app
```

### Testing Workflow

1. Make your code changes
2. Run `./rebuild.sh` to deploy changes
3. Test at http://localhost:8002
4. Check logs: `docker logs -f nearby-app`
5. **Remember**: Database is shared - do not modify production data
