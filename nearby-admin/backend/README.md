# Nearby Nearby Backend

This is the backend API for the Nearby Nearby Admin Portal, built with FastAPI and PostgreSQL.

## Project Structure

```
backend/
├── app/                    # Main application code
│   ├── api/               # API endpoints
│   ├── core/              # Core configuration and security
│   ├── crud/              # Database operations
│   ├── models/            # Database models
│   └── schemas/           # Pydantic schemas
├── scripts/               # Utility scripts
│   ├── create_test_user.py    # Create test user
│   ├── manage_users.py        # User management
│   ├── README.md              # Scripts documentation
│   └── USER_MANAGEMENT.md     # User management docs
├── tests/                 # Test files
├── alembic/               # Database migrations
├── requirements.txt       # Python dependencies
├── alembic.ini           # Alembic configuration
└── Dockerfile            # Docker configuration
```

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set up Database
```bash
# Run migrations
alembic upgrade head
```

### 3. Create Test User
```bash
cd scripts
python create_test_user.py
```

### 4. Start the Server
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Scripts

Utility scripts are located in the `scripts/` folder:

- **User Management**: See `scripts/README.md` for detailed usage
- **Test User**: `scripts/create_test_user.py` creates a test user
- **User Operations**: `scripts/manage_users.py` for comprehensive user management

### Quick Script Examples
```bash
# Create test user
cd scripts && python create_test_user.py

# List all users
cd scripts && python manage_users.py list

# Create new user
cd scripts && python manage_users.py create user@example.com password123
```

## Authentication

The API uses JWT tokens for authentication:
- Login endpoint: `POST /api/auth/login`
- Token format: `Authorization: Bearer <token>`

## Database

- **Database**: PostgreSQL with PostGIS extension
- **ORM**: SQLAlchemy with GeoAlchemy2
- **Migrations**: Alembic

## Development

### Running Tests
```bash
pytest
```

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

### Environment Variables
Create a `.env` file with:
```
DATABASE_URL=postgresql://user:password@localhost/nearbynearby
SECRET_KEY=your-secret-key
```

## Docker

Build and run with Docker:
```bash
docker build -t nearby-nearby-backend .
docker run -p 8000:8000 nearby-nearby-backend
``` 