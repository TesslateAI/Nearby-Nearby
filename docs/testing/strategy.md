# Testing Strategy

Testing recommendations for the Nearby Nearby monorepo, designed for a small startup team.

---

## Philosophy

Test what would break production, not everything. Prioritize:
1. Revenue-critical paths (search, nearby feature, POI management)
2. Data integrity (publication status filtering, auth)
3. Integration points (API endpoints, database queries)

Skip low-ROI tests: visual regression, snapshot tests, exhaustive unit tests for simple CRUD.

---

## Test Folder Structure

```
NearbyNearby/
├── nearby-admin/
│   ├── backend/
│   │   └── tests/                    # EXISTS - keep and expand
│   │       ├── conftest.py           # EXISTS - shared fixtures
│   │       ├── unit/                 # Pure logic tests (no DB needed)
│   │       │   ├── test_security.py  # Password hashing, JWT creation/validation
│   │       │   └── test_schemas.py   # Pydantic schema validation
│   │       ├── integration/          # API + DB tests
│   │       │   ├── test_auth.py      # Login, token, RBAC
│   │       │   ├── test_pois_api.py  # POI CRUD endpoints
│   │       │   ├── test_crud_poi.py  # Direct CRUD operations
│   │       │   ├── test_images.py    # Image upload/retrieval
│   │       │   ├── test_categories.py
│   │       │   └── test_attributes.py
│   │       └── pytest.ini
│   └── frontend/
│       └── tests/                    # NEW - add when ready
│           ├── setup.js              # Vitest setup
│           └── components/           # Component smoke tests
│
├── nearby-app/
│   ├── backend/
│   │   └── tests/                    # NEW - high priority
│   │       ├── conftest.py           # Fixtures with ML model mocking
│   │       ├── unit/
│   │       │   └── test_search_logic.py  # Search scoring, ranking
│   │       └── integration/
│   │           ├── test_nearby_api.py           # Flagship feature
│   │           ├── test_search_api.py           # Keyword/semantic/hybrid
│   │           └── test_publication_filter.py   # Draft vs published
│   └── app/
│       └── tests/                    # NEW - lower priority
│           ├── setup.js
│           └── components/
│               └── NearbySection.test.jsx
│
└── tests/                            # FUTURE - cross-app E2E
    └── e2e/
        └── test_admin_to_app_flow.py  # Publish in admin -> visible in app
```

### Migrating Existing Tests

The existing tests in `nearby-admin/backend/tests/` are flat (all in one directory). When adding new tests, organize into `unit/` and `integration/` subdirectories. Existing tests can stay flat initially and be moved when convenient.

---

## Priority Tiers

### Tier 1 - "If these break, production is down"

Write these tests first. They cover the core value proposition.

| # | What to Test | App | Type | Why |
|---|-------------|-----|------|-----|
| 1 | Nearby API (`/api/pois/{id}/nearby`) | nearby-app | Integration | Flagship feature |
| 2 | Search endpoints (keyword, semantic, hybrid) | nearby-app | Integration | Core user flow |
| 3 | Authentication (login, token validation) | nearby-admin | Integration | Gate to all admin ops |
| 4 | RBAC (admin/editor/viewer permissions) | nearby-admin | Integration | Security |
| 5 | POI CRUD (create, update, delete) | nearby-admin | Integration | Core data management |
| 6 | Publication status filtering | nearby-app | Integration | Draft POIs must NOT leak to users |

### Tier 2 - "Users will notice"

Write these after Tier 1 is solid.

| # | What to Test | App | Type |
|---|-------------|-----|------|
| 7 | Image upload and retrieval | nearby-admin | Integration |
| 8 | Categories CRUD and tree structure | nearby-admin | Integration |
| 9 | SEO meta tag injection | nearby-app | Integration |
| 10 | Map data endpoints | nearby-app | Integration |
| 11 | POI relationships | nearby-admin | Integration |

### Tier 3 - "Nice to have"

Write these when the team grows or before a major launch.

| # | What to Test | App | Type |
|---|-------------|-----|------|
| 12 | Frontend smoke tests (NearbySection, NearbyCard) | nearby-app | Component |
| 13 | POI form validation | nearby-admin | Component |
| 14 | Cross-app E2E (admin publish -> user visibility) | Both | E2E |
| 15 | Search result ranking quality | nearby-app | Unit |

---

## Recommended Frameworks

| Layer | Tool | Why |
|-------|------|-----|
| Backend (both apps) | **pytest** + **httpx** | Already used in nearby-admin, FastAPI's recommended stack |
| Frontend (both apps) | **Vitest** + **React Testing Library** | Same ecosystem as Vite (already used for builds), fast |
| E2E (future) | **Playwright** | Cross-browser, reliable, good API |

### Backend Dependencies

Already in `nearby-admin/backend/requirements.txt`:
```
pytest
httpx
```

Add to `nearby-app/backend/requirements.txt`:
```
pytest
httpx
pytest-asyncio  # if using async endpoints
```

### Frontend Dependencies (when ready)

Add to `devDependencies` in both `nearby-admin/frontend/package.json` and `nearby-app/app/package.json`:
```json
{
  "vitest": "latest",
  "@testing-library/react": "latest",
  "@testing-library/jest-dom": "latest",
  "jsdom": "latest"
}
```

---

## Key Strategies

### Handling the ML Model in Tests

The nearby-app loads a ~1GB embedding model (`embeddinggemma-300m`) on startup. Loading this for every test is too slow.

**Strategy: Mock by default, test real model separately.**

```python
# nearby-app/backend/tests/conftest.py
import pytest
from unittest.mock import patch, MagicMock
import numpy as np

@pytest.fixture(autouse=True)
def mock_embedding_model():
    """Mock the ML model for all tests by default."""
    fake_embedding = np.random.rand(256).tolist()
    mock_model = MagicMock()
    mock_model.encode.return_value = [fake_embedding]

    with patch("app.main.embedding_model", mock_model):
        yield mock_model

# For tests that need the real model:
@pytest.mark.slow
def test_real_semantic_search(db_session, client):
    """Only runs with: pytest -m slow"""
    pass
```

Run fast tests in CI, slow tests on a schedule:
```bash
# CI (every push) - fast, no ML model
pytest -m "not slow"

# Nightly/weekly - includes ML model tests
pytest -m slow
```

### Database Test Isolation

Use the existing pattern from `nearby-admin/backend/tests/conftest.py`:

1. Each test gets a clean database (drop schema -> recreate -> run test)
2. Use a dedicated test database container, never production
3. The test DB needs PostGIS extension (use `postgis/postgis:15-3.4` image)

**Add a test compose file at the monorepo root:**

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  test-db:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test_nearbynearby
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test -d test_nearbynearby"]
      interval: 5s
      timeout: 3s
      retries: 5
```

```bash
# Run tests
docker compose -f docker-compose.test.yml up -d
DATABASE_URL=postgresql://test:test@localhost:5433/test_nearbynearby pytest nearby-admin/backend/tests/
DATABASE_URL=postgresql://test:test@localhost:5433/test_nearbynearby pytest nearby-app/backend/tests/
docker compose -f docker-compose.test.yml down
```

### Frontend Testing Approach

Keep it minimal. For a small team, frontend tests have the worst ROI unless you have complex client-side logic.

**What to test:**
- Critical components render without crashing (smoke tests)
- The NearbySection component with mocked API data
- Form validation logic (if complex)

**What NOT to test:**
- Every component in isolation
- Visual regression / snapshots (high maintenance)
- Simple presentational components

**Example Vitest config:**

```js
// vitest.config.js (in each frontend directory)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
  },
})
```

---

## CI/CD Integration

Add a test job that runs before deployment. Tests gate the deploy.

```yaml
# .github/workflows/test.yml
name: Run Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-admin-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:15-3.4
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_nearbynearby
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - run: pip install -r nearby-admin/backend/requirements.txt
      - run: pytest nearby-admin/backend/tests/
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_nearbynearby

  test-app-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:15-3.4
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_nearbynearby
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r nearby-app/backend/requirements.txt
      - run: pytest nearby-app/backend/tests/ -m "not slow"
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_nearbynearby
```

### Running Tests Locally

```bash
# Start test database
docker compose -f docker-compose.test.yml up -d

# Run all backend tests
DATABASE_URL=postgresql://test:test@localhost:5433/test_nearbynearby pytest nearby-admin/backend/tests/ -v
DATABASE_URL=postgresql://test:test@localhost:5433/test_nearbynearby pytest nearby-app/backend/tests/ -v -m "not slow"

# Run frontend tests (when set up)
cd nearby-admin/frontend && npx vitest run
cd nearby-app/app && npx vitest run

# Cleanup
docker compose -f docker-compose.test.yml down
```

---

## What to Test for Each Feature

### Nearby API (Flagship)
- Returns POIs within specified radius
- Respects radius parameter (1, 3, 5, 10, 15 miles)
- Only returns published POIs
- Excludes the current POI from results
- Results are sorted by distance
- Handles POIs with no location gracefully
- Returns correct distance calculations

### Search
- Keyword search returns relevant results
- Empty query returns empty results (not all POIs)
- Publication status filtering works
- Search handles special characters gracefully

### Auth & RBAC
- Login with valid credentials returns JWT token
- Login with invalid credentials returns 401
- Expired token returns 401
- Admin can create/edit/delete POIs
- Editor can create/edit but not delete
- Viewer can only read

### Publication Status
- Draft POIs do NOT appear in nearby-app endpoints
- Published POIs appear in all nearby-app endpoints
- Changing status from published to draft removes from nearby-app
- All nearby-app list endpoints filter correctly

---

## Coverage Goals

For a startup, aim for practical coverage, not a number:

- **Tier 1 features**: 80%+ coverage on happy paths + key error cases
- **Tier 2 features**: 60%+ coverage on happy paths
- **Tier 3 features**: Smoke tests only

Don't chase 100% coverage. A well-tested happy path for your flagship feature is worth more than 90% coverage on utilities.
