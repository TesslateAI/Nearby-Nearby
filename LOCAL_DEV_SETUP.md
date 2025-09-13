# Local Development Setup (Without Docker for Code)

This setup runs PostgreSQL in Docker but keeps your frontend and backend running locally for faster development.

## Prerequisites
- Docker Desktop (for PostgreSQL only)
- Node.js 18+ and npm
- Python 3.10+
- Git

## Setup Instructions

### 1. Start PostgreSQL Database
```bash
# Start only the database container
docker-compose -f docker-compose.dev.yml up -d

# Verify it's running
docker ps
# You should see postgis/postgis:15-3.4 running on port 5432
```

### 2. Setup Backend (Python/FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (Windows PowerShell)
$env:DATABASE_URL="postgresql://nearby:nearby@localhost:5432/nearbynearby"
$env:SECRET_KEY="dev_secret_key_change_in_production_32chars"
$env:ACCESS_TOKEN_EXPIRE_MINUTES="30"
$env:ENVIRONMENT="development"
$env:ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
$env:ALLOWED_HOSTS="localhost,127.0.0.1"

# Or use .env file (create backend/.env)
# Copy the contents from ../.env.local

# Run database migrations
alembic upgrade head

# Start the backend server with hot reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Backend will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 3. Setup Frontend (React/Vite)
Open a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file for frontend (optional, as Vite can use shell env vars)
# Copy VITE_API_BASE_URL=http://localhost:8000 to frontend/.env

# Start the development server
npm run dev

# Frontend will be available at http://localhost:5173
```

## Development Workflow

### Making Changes
- **Frontend**: Edit files in `frontend/src/` - Vite will hot reload automatically
- **Backend**: Edit files in `backend/app/` - Uvicorn will restart automatically
- **Database**: Changes persist in Docker volume

### Default Admin Login
- Email: `test@nearbynearby.com`
- Password: `1234`

### Creating Admin User (if needed)
```bash
cd backend
python scripts/manage_users.py create admin@example.com password123
```

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests (if configured)
cd frontend
npm test
```

### Stopping Services
```bash
# Stop database
docker-compose -f docker-compose.dev.yml down

# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal
```

### Database Management
```bash
# View database logs
docker-compose -f docker-compose.dev.yml logs db

# Access PostgreSQL directly
docker exec -it nearby-nearby-db-1 psql -U nearby -d nearbynearby

# Create new migration
cd backend
alembic revision --autogenerate -m "Description of change"
```

## Advantages of This Setup
✅ **Instant hot reload** - Changes appear immediately
✅ **Better debugging** - Use VS Code debugger, browser DevTools directly
✅ **Faster startup** - No container build time
✅ **Direct file editing** - No sync issues with Docker volumes
✅ **Native performance** - No virtualization overhead for code

## Option 2: Full Docker Setup
If you prefer using full Docker setup (from original docker-compose.yml):
- Frontend and backend run in containers
- Files are mounted as volumes, so changes are reflected
- Backend has hot reload enabled
- Frontend uses Vite which also hot reloads
- Just run: `docker-compose up`

The full Docker approach also works well, but the hybrid approach (Option 1) is typically faster for active development.