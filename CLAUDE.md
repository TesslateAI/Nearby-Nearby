# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nearby Nearby is a comprehensive full-stack geospatial Points of Interest (POI) platform built with:
- **Backend**: FastAPI (Python 3.10) with PostgreSQL 15 + PostGIS
- **Frontend**: React 18 + Vite with Mantine UI v8.3.1
- **Rich Text**: TipTap editor with @mantine/tiptap integration
- **Image Management**: Advanced file upload with binary storage and multiple image types
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

### Production Deployment
**NOTE**: There is no automated deployment script. Deployment is done manually using commands documented in `PRODUCTION_REBUILD.md`.

```bash
# Full production rebuild (after code changes)
cd /home/ubuntu/Nearby-Nearby
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d

# Restart services (no code changes)
docker compose -f docker-compose.prod.yml restart

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Frontend uses Dockerfile.prod (nginx with optimized build)
# Backend uses Dockerfile (with --reload removed for production)
```

## High-Level Architecture

### Domain Model
The system manages four POI types with shared base attributes and extensive type-specific fields:
- **Business**: Pricing tiers, business hours, payment methods, rich text descriptions, gallery images, menu/booking systems
- **Park**: Drone policies, outdoor amenities, facilities, entry photos, playground features, hunting/fishing options
- **Trail**: Difficulty levels, trail length, route types, trailhead coordinates, exit points, downloadable maps
- **Event**: Start/end times, venue relationships, costs, vendor management, entry details, event-specific amenities

### Data Architecture
- **PostGIS Integration**: All POIs have geospatial `location` field for proximity queries with front door coordinates
- **JSONB Fields**: Extensive flexible schema for photos, hours, amenities, compliance, facilities, venue settings
- **Image Storage**: Binary storage system with multiple image types (main, gallery, entry, parking, restroom, rental, playground, menu, trail_head, trail_exit, map, downloadable_map)
- **Rich Text Content**: HTML storage for long descriptions with TipTap editor integration
- **Relationship System**: POI-to-POI relationships with type validation (venue, trail-in-park, service provider)
- **Dynamic Attributes**: Admin-configurable attributes and categories without code changes
- **Publication System**: Draft/published states with complete form validation

### API Structure
- **RESTful Design**: `/api/pois/`, `/api/categories/`, `/api/attributes/`, `/api/relationships/`, `/api/images/`
- **Authentication**: JWT-based with `/api/auth/` endpoints
- **Image Management**: `/api/images/` with upload, retrieval, and metadata endpoints
- **Search Capabilities**: Text search, location-based search, nearby POI discovery
- **Auto-documentation**: Swagger UI at `http://localhost:8001/docs` (backend port 8001)

### Frontend Architecture

#### Organization Structure
- **Component-Focused Architecture**: Organized by component type with specialized directories
- **Core Components**: `POIForm/`, `maps/`, `common/`, `ImageUpload/`, `relationships/` for reusable UI elements
- **Modular POI Form**: Completely reorganized from single 3,400+ line file into structured sections:
  - `sections/`: CoreInformation, Categories, Contact, BusinessDetails, LocationSection, etc.
  - `hooks/`: usePOIForm, usePOIHandlers for form logic
  - `constants/`: initialValues, validationRules, helpers
  - `components/`: FormActions and other form-specific components
- **Pages**: Route-level containers (`pages/`) that compose components

#### State Management
- **Context API**: `AuthContext` for global authentication state with JWT token management
- **Mantine Forms**: `useForm` hook for complex local form state with validation
- **Custom Hooks**: Domain-specific API hooks (`usePOI`, `useCategories`, `useRelationships`) with integrated loading/error states

#### Component Patterns
- **Accordion-Based Forms**: POIForm with section-based architecture using Mantine Accordion
- **Rich Text Editing**: TipTap integration with @mantine/tiptap for HTML content editing
- **Image Management**: Dedicated ImageUpload component with drag-and-drop functionality
- **Section Validation**: Progressive form validation with conditional field rendering
- **Form Controllers**: Centralized form logic with `constants/`, `hooks/`, and `utils/` organization

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
- **Mantine UI v8.3.1**: Latest version with enhanced components and accessibility features
- **Component Theming**: Consistent styling patterns across Button, Paper, Table, Accordion components
- **Icon System**: @tabler/icons-react for consistent iconography
- **Animation System**: CSS transitions in `animations.css`
- **Responsive Design**: Mobile-first approach with Mantine's responsive utilities
- **Rich Media**: Advanced dropzone for file uploads with preview functionality

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
1. Update SQLAlchemy model in `backend/app/models/poi.py` (or specific type models like `business.py`, `event.py`, `trail.py`)
2. Create Alembic migration with `docker-compose exec backend alembic revision --autogenerate -m "Description"`
3. Update Pydantic schemas in `backend/app/schemas/poi.py`
4. Add field to appropriate POIForm section in `frontend/src/components/POIForm/sections/`
5. Update form constants and validation in `frontend/src/components/POIForm/constants/`
6. Consider image fields: update `backend/app/models/image.py` for new ImageType enum values
7. Extend field options if needed in `frontend/src/utils/fieldOptions.js`

### Creating API Endpoints
1. Add endpoint in `backend/app/api/endpoints/`
2. Use dependency injection for auth: `current_user = Depends(get_current_user_with_role)`
3. Follow CRUD pattern in `backend/app/crud/`
4. Add tests in `backend/tests/`

### Frontend Data Flow
1. **API Layer**: Base service in `frontend/src/services/api.js` and utilities in `frontend/src/utils/api.js`
2. **Custom Hooks**: Domain-specific hooks for POI, categories, relationships with integrated loading/error states
3. **Authentication**: Global state via `AuthContext.jsx` with secure token management in `secureStorage.js`
4. **Form Management**: Accordion-based forms with `useForm` hook, organized in POIForm sections with `usePOIForm` and `usePOIHandlers` hooks
5. **Image Management**: Dedicated ImageUpload component with binary storage, drag-and-drop, and preview functionality
6. **Rich Text**: TipTap editor integration for HTML content with @mantine/tiptap
7. **State Updates**: Optimistic updates with automatic sync and error rollback
8. **User Feedback**: Integrated notifications via `@mantine/notifications` for all API operations

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
- `.env` file required with database credentials and image storage paths
- Separate test database configuration
- CORS origins configurable via `ALLOWED_ORIGINS`
- Production domain support via `PRODUCTION_DOMAIN`
- Image storage configuration: `IMAGE_STORAGE_PATH` and `IMAGE_BASE_URL`
- Frontend API base URL: `VITE_API_BASE_URL`

## Workflow Preferences
- Focus only on task-relevant code areas
- Write tests for major functionality
- Maintain existing patterns unless explicitly changing architecture
- Keep files under 300 lines (refactor when larger) - POIForm has been successfully modularized
- Never mock data for dev/prod environments
- Always preserve existing `.env` configuration
- Use component-based organization following the POIForm modular pattern
- Leverage TipTap for rich text editing needs
- Follow image upload patterns established in ImageUpload component
- **All utility scripts must be placed in the `scripts/` folder at the project root** (backend or frontend specific scripts stay in their respective folders)

## Current Key Technologies & Recent Changes

### Major Technology Stack Updates
- **Mantine UI v8.3.1**: Updated to latest version with enhanced components
- **TipTap Rich Text Editor**: @mantine/tiptap integration for HTML content editing
- **@hello-pangea/dnd**: Drag and drop functionality for UI components
- **DOMPurify**: HTML sanitization for rich text content
- **Binary Image Storage**: Advanced image management with multiple types and metadata

### Architecture Improvements
- **POI Form Modularization**: Successfully refactored from 3,400+ line monolith into organized sections
- **Component Organization**: Moved from feature-based to component-type organization
- **Image Management System**: Complete image upload, storage, and retrieval system
- **Rich Text Integration**: TipTap editor with character counting and link support
- **Enhanced Form Validation**: Improved validation patterns with section-based organization

### Recent Database Enhancements
- **Extended POI Fields**: Added numerous fields for all POI types (business, park, trail, event)
- **Image Storage Tables**: Complete image metadata and binary storage system
- **Enhanced JSONB Usage**: More flexible field storage for amenities, facilities, settings
- **Geospatial Improvements**: Front door coordinates, trailhead coordinates, and enhanced location data
- **Publication System**: Draft/published states with proper validation

### Current Development Status
- **Frontend**: Fully modularized with improved component architecture
- **Backend**: Enhanced API endpoints with comprehensive image management
- **Database**: Extended schema with all POI type requirements implemented
- **Testing**: Maintained test coverage through architectural changes

## Git Configuration

**IMPORTANT**: When making commits, ALWAYS use the user's identity:
- **Git User Name**: Manav M
- **Git User Email**: manavmaj2001@gmail.com

Claude is NEVER a contributor or co-author. All commits should be attributed to the user only.

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