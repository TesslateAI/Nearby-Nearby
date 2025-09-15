# Local Development Setup - Multiple Options

This document provides comprehensive setup instructions for the Nearby-Nearby project with multiple development approaches.

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for all approaches)
- [Git](https://git-scm.com/downloads)

**Additional requirements for hybrid setup:**
- Node.js 18+ and npm
- Python 3.10+

## 🚀 Quick Start (Recommended)

### Option 1: Full Docker Setup (Easiest)

This approach runs everything in containers - no local Node.js or Python setup needed.

```bash
# 1. Clone the repository (if not already done)
git clone <your-repository-url>
cd nearby-nearby

# 2. Create environment file
cp .envexample .env

# 3. Edit .env file with development settings
# The default .env should already have appropriate development values:
# DATABASE_URL=postgresql://nearby:nearby@db/nearbynearby
# SECRET_KEY=dev_secret_key_change_in_production_32chars

# 4. Start all services with Docker
docker-compose up --build

# 5. Access the application
# - Frontend: http://localhost:5175
# - Backend API: http://localhost:8000  
# - API Documentation: http://localhost:8000/docs
```

**Default Admin Login:**
- Email: `test@nearbynearby.com`
- Password: `1234`

### Option 2: Hybrid Setup (Database in Docker, Code Local)

This setup runs PostgreSQL in Docker but keeps your frontend and backend running locally for faster development.

#### Additional Prerequisites for Hybrid Setup
- Node.js 18+ and npm
- Python 3.10+

#### Step 1: Start PostgreSQL Database
```bash
# Modify docker-compose.dev.yml to use an available port if needed
# If port 5432 is occupied, change to 5433 in both files:
# docker-compose.dev.yml: "5433:5432"
# .env: DATABASE_URL=postgresql://nearby:nearby@localhost:5433/nearbynearby

# Start only the database container
docker-compose -f docker-compose.dev.yml up -d

# Verify it's running
docker ps
# You should see postgis/postgis:15-3.4 running on your chosen port
```

#### Step 2: Setup Backend (Python/FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (Command Prompt):
venv\Scripts\activate
# On Windows (PowerShell):
venv\Scripts\Activate.ps1
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create backend .env file
echo 'DATABASE_URL=postgresql://nearby:nearby@localhost:5433/nearbynearby
SECRET_KEY=dev_secret_key_change_in_production_32chars
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ALLOWED_HOSTS=localhost,127.0.0.1' > .env

# Run database migrations
alembic upgrade head

# Start the backend server with hot reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Backend will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

#### Step 3: Setup Frontend (React/Vite)
Open a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# If npm fails with rollup issues on Windows, try:
# 1. Delete node_modules and package-lock.json
# 2. Run: npm install --include=optional
# 3. Or use pnpm instead: npm install -g pnpm && pnpm install

# Create frontend .env file
echo 'VITE_API_BASE_URL=http://localhost:8000' > .env

# Start the development server
npm run dev

# Frontend will be available at http://localhost:5173
```

## Development Workflow

### Access Points
- **Full Docker Setup:**
  - Frontend: http://localhost:5175
  - Backend API: http://localhost:8000
  - API Documentation: http://localhost:8000/docs
  
- **Hybrid Setup:**
  - Frontend: http://localhost:5173
  - Backend API: http://localhost:8000
  - API Documentation: http://localhost:8000/docs

### Default Admin Login
- Email: `test@nearbynearby.com`
- Password: `1234`

### Making Changes
- **Frontend**: Edit files in `frontend/src/` - Vite will hot reload automatically
- **Backend**: Edit files in `backend/app/` - Uvicorn will restart automatically (both setups)
- **Database**: Changes persist in Docker volumes

### User Management
```bash
# For Docker setup:
docker-compose exec backend python scripts/manage_users.py create admin@example.com password123

# For hybrid setup:
cd backend
python scripts/manage_users.py create admin@example.com password123
```

### Running Tests
```bash
# Full Docker setup:
docker-compose run --rm test

# Hybrid setup - Backend tests:
cd backend
pytest

# Frontend tests (if configured):
cd frontend
npm test
```

## Troubleshooting

### Port Conflicts
If you encounter port conflicts:

**For Full Docker Setup:**
1. Edit `docker-compose.yml`
2. Change port mappings (e.g., `"5176:5173"` for frontend, `"8001:8000"` for backend)
3. Access via the new ports

**For Hybrid Setup:**
1. Edit `docker-compose.dev.yml` to change database port (e.g., `"5434:5432"`)
2. Update `DATABASE_URL` in your .env files accordingly
3. Use different ports for your local services if needed

### Frontend Build Issues (Windows)
If you encounter Node.js/npm issues with rollup:
```bash
# Try these solutions in order:
cd frontend

# 1. Clean install
rm -rf node_modules package-lock.json
npm install --include=optional

# 2. Use pnpm instead
npm install -g pnpm
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install

# 3. Use the Full Docker setup instead (recommended)
```

### Database Connection Issues
- Ensure Docker Desktop is running
- Check if database container is healthy: `docker-compose ps`
- Verify DATABASE_URL matches your setup:
  - Docker: `postgresql://nearby:nearby@db/nearbynearby`
  - Hybrid: `postgresql://nearby:nearby@localhost:5433/nearbynearby`

## Stopping Services

### Full Docker Setup
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (careful - this deletes data)
docker-compose down -v
```

### Hybrid Setup
```bash
# Stop database
docker-compose -f docker-compose.dev.yml down

# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal
```

## Database Management

### Access Database Directly
```bash
# Full Docker setup:
docker-compose exec db psql -U nearby -d nearbynearby

# Hybrid setup:
docker exec -it nearby-nearby-db-1 psql -U nearby -d nearbynearby
```

### Database Migrations
```bash
# Full Docker setup:
docker-compose exec backend alembic revision --autogenerate -m "Description"
docker-compose exec backend alembic upgrade head

# Hybrid setup:
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## Advantages of Each Setup

### Full Docker Setup ✅
- **Zero local dependencies** - Only Docker required
- **Consistent environment** - Same containers for all developers
- **Easy setup** - One command to start everything
- **Production similarity** - Matches deployment environment

### Hybrid Setup ✅ 
- **Instant hot reload** - Changes appear immediately
- **Better debugging** - Use VS Code debugger, browser DevTools directly
- **Faster startup** - No container build time for code changes
- **Native performance** - No virtualization overhead for code
- **Direct file editing** - No sync issues with Docker volumes

## Production Deployment
For production deployment instructions, see `DEPLOYMENT.md`.