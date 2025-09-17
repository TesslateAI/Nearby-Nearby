# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nearby Nearby is a comprehensive full-stack geospatial Points of Interest (POI) platform built with:
- **Backend**: FastAPI (Python 3.10) with PostgreSQL 15 + PostGIS
- **Frontend**: React 18 + Vite with Mantine UI
- **Infrastructure**: Docker Compose with microservices architecture

## Common Development Commands

### Running the Application
```bash
# Start all services (frontend, backend, database)
docker-compose up --build

# Run in background
docker-compose up -d
```

### Testing
```bash
# Run all tests
docker-compose run --rm test

# Run specific test file
docker-compose run --rm test pytest tests/test_pois_api.py

# Run tests with coverage
docker-compose run --rm test pytest --cov=app
```

### Database Management
```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations (automatic on backend startup)
docker-compose up backend

# Manual migration
docker-compose exec backend alembic upgrade head
```

### User Management
```bash
# Create admin user
docker-compose exec backend python scripts/manage_users.py create admin@example.com password123

# Create test user
docker-compose exec backend python scripts/manage_users.py test-user

# List users
docker-compose exec backend python scripts/manage_users.py list
```

### Frontend Development
```bash
# Install dependencies
cd frontend && npm install

# Run development server (if not using Docker)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## High-Level Architecture

### Domain Model
The system manages four POI types with shared base attributes and type-specific fields:
- **Business**: Pricing tiers, business hours, payment methods
- **Park**: Drone policies, outdoor amenities, facilities
- **Trail**: Difficulty levels, trail length, route types
- **Event**: Start/end times, venue relationships, costs

### Data Architecture
- **PostGIS Integration**: All POIs have geospatial `location` field for proximity queries
- **JSONB Fields**: Flexible schema for photos, hours, amenities, compliance, custom fields
- **Relationship System**: POI-to-POI relationships with type validation (venue, trail-in-park, service provider)
- **Dynamic Attributes**: Admin-configurable attributes and categories without code changes

### API Structure
- **RESTful Design**: `/api/pois/`, `/api/categories/`, `/api/attributes/`, `/api/relationships/`
- **Authentication**: JWT-based with `/api/auth/` endpoints
- **Search Capabilities**: Text search, location-based search, nearby POI discovery
- **Auto-documentation**: Swagger UI at `http://localhost:8000/docs`

### Frontend Architecture

#### Organization Structure
- **Hybrid Architecture**: Feature-based modules (`/features/`) for domain logic, component-type organization (`/components/`) for reusable UI
- **Features**: `auth`, `poi`, `categories`, `relationships` with self-contained business logic
- **Components**: `common`, `forms`, `maps` for cross-feature reusable elements
- **Pages**: Route-level containers that compose features and components

#### State Management
- **Context API**: `AuthContext` for global authentication state with JWT token management
- **Mantine Forms**: `useForm` hook for complex local form state with validation
- **Custom Hooks**: Domain-specific API hooks (`usePOI`, `useCategories`, `useRelationships`) with integrated loading/error states

#### Component Patterns
- **Multi-Step Forms**: POIForm with step-based architecture in `/poi/POIForm/steps/`
- **Step Validation**: Progressive form validation with stepper UI component
- **Form Controllers**: Centralized form logic with `constants.js` and `utils.js` per form

#### Routing & Navigation
- **React Router v6**: Public routes (`/poi/detail/{id}`) and protected admin routes
- **Route Protection**: `ProtectedRoute` component with authentication checks
- **Conditional Layouts**: AppShell for admin, minimal layout for public pages
- **Dynamic Parameters**: Edit/detail views with programmatic navigation

#### API Layer Architecture
- **Base API Service**: Centralized HTTP client with automatic auth headers and token expiration handling
- **Domain Hooks**: `useApi` with specialized hooks per feature (POI, categories, relationships)
- **Secure Storage**: JWT persistence with client-side expiration checking
- **Notification Integration**: Automatic success/error feedback via Mantine notifications

#### Design System
- **Mantine UI**: Custom theme with brand colors (deep-purple, brand-green)
- **Component Theming**: Consistent styling patterns across Button, Paper, Table components
- **Animation System**: CSS transitions in `/styles/animations.css`
- **Responsive Design**: Mobile-first approach with Mantine's responsive utilities

#### Performance & UX
- **Error Boundaries**: Component-level error containment
- **Loading States**: Consistent loading management through custom hooks
- **Optimistic Updates**: Client-side state updates with API synchronization
- **Code Organization**: Structured for potential lazy loading and code splitting

### Testing Strategy
- **Isolated Test Environment**: Separate `test-db` container
- **Clean State**: Each test gets fresh database via schema drop/recreate
- **Auth Mocking**: Tests bypass authentication with override dependencies
- **Fixtures**: `conftest.py` provides `client` and `db_session` fixtures

## Key Development Patterns

### Adding New POI Fields
1. Update SQLAlchemy model in `backend/app/models/poi.py`
2. Create Alembic migration
3. Update Pydantic schemas in `backend/app/schemas/poi.py`
4. Add field to appropriate POIForm step in `frontend/src/features/poi/POIForm/steps/`
5. Update form constants and validation in `frontend/src/features/poi/POIForm/constants.js` and `utils.js`
6. Extend field options if needed in `frontend/src/utils/fieldOptions.js`

### Creating API Endpoints
1. Add endpoint in `backend/app/api/endpoints/`
2. Use dependency injection for auth: `current_user = Depends(get_current_user_with_role)`
3. Follow CRUD pattern in `backend/app/crud/`
4. Add tests in `backend/tests/`

### Frontend Data Flow
1. **API Layer**: Base service in `frontend/src/services/api.js` and utilities in `frontend/src/utils/api.js`
2. **Custom Hooks**: Domain-specific hooks in `frontend/src/hooks/useApi.js` with integrated loading/error states
3. **Authentication**: Global state via `AuthContext.jsx` with secure token management in `secureStorage.js`
4. **Form Management**: Multi-step forms with `useForm` hook, validation utilities, and step-based architecture
5. **State Updates**: Optimistic updates with automatic sync and error rollback
6. **User Feedback**: Integrated notifications via `@mantine/notifications` for all API operations

## Important Considerations

### Security
- JWT tokens with configurable expiry (`ACCESS_TOKEN_EXPIRE_MINUTES`)
- Password hashing with bcrypt
- CORS configuration in `backend/app/main.py`
- Input validation via Pydantic schemas

### Performance
- PostGIS spatial indexing for geospatial queries
- JSONB indexing for flexible attribute queries
- Pagination support in list endpoints
- Docker layer caching for faster builds

### Environment Configuration
- `.env` file required with database credentials
- Separate test database configuration
- CORS origins configurable via `ALLOWED_ORIGINS`
- Production domain support via `PRODUCTION_DOMAIN`

## Workflow Preferences
- Focus only on task-relevant code areas
- Write tests for major functionality
- Maintain existing patterns unless explicitly changing architecture
- Keep files under 300 lines (refactor when larger)
- Never mock data for dev/prod environments
- Always preserve existing `.env` configuration

## AI Coding Conventions

### Core Development Principles
- **Incremental Development**: Build features incrementally, testing after each component/endpoint addition
- **Context-First Approach**: Understand high-level requirements and architecture before implementation
- **Idiomatic Code**: Follow language-specific conventions and official style guides
- **Functional Patterns**: Prefer functional/declarative programming over OOP where appropriate
- **Self-Documenting Code**: Write clear, readable code with descriptive variable names

### Code Quality Standards
- **Single Responsibility**: Each function/component should do one thing well
- **DRY Principle**: Avoid duplication, extract common logic into reusable utilities
- **Early Returns**: Use guard clauses and fail fast with clear error messages
- **Immutability**: Prefer immutable data structures and pure functions
- **Type Safety**: Use TypeScript/Pydantic schemas for runtime validation

### AI Assistant Best Practices
- **Verify Before Modifying**: Always read existing code before editing
- **Preserve Existing Patterns**: Match the codebase's style and conventions
- **Test-Driven Changes**: Write or update tests for modified functionality
- **Incremental Commits**: Make atomic commits with clear messages
- **Error Handling**: Implement comprehensive error handling with meaningful messages

### Security & Performance
- **Input Validation**: Always validate and sanitize user inputs
- **Secret Management**: Never hardcode secrets or expose sensitive data
- **Query Optimization**: Use database indexes and avoid N+1 queries
- **Caching Strategy**: Implement caching for expensive operations
- **Rate Limiting**: Add rate limiting to public endpoints

### Documentation Standards
- **Code Comments**: Add comments only for complex logic, not obvious code
- **API Documentation**: Keep OpenAPI/Swagger docs up-to-date
- **README Updates**: Update documentation when adding features
- **Migration Notes**: Document database changes in migration files
- **Changelog**: Maintain a changelog for significant changes

### Testing Philosophy
- **Coverage Goals**: Aim for 80%+ coverage on critical paths
- **Test Isolation**: Each test should be independent and idempotent
- **Mock External Services**: Mock third-party APIs and services
- **Edge Cases**: Test boundary conditions and error scenarios
- **Performance Tests**: Include benchmarks for critical operations

### Development Workflow
- **Branch Strategy**: Feature branches from develop, hotfixes from main
- **PR Reviews**: All changes require code review before merge
- **CI/CD Pipeline**: Automated testing, linting, and deployment
- **Monitoring**: Add logging and metrics for production debugging
- **Rollback Plan**: Ensure changes can be safely reverted