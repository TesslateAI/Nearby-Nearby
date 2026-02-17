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

## Current Test Suite

The monorepo has **225 integration tests** in the root `tests/` directory covering admin CRUD, cross-app data flow, real S3 (MinIO) image uploads, and admin form features (Tasks 2-41).

### Running Tests

```bash
# 1. Start test containers (PostGIS + MinIO)
docker compose -f tests/docker-compose.test.yml up -d

# 2. Wait for healthy (usually ~5 seconds)
docker compose -f tests/docker-compose.test.yml ps

# 3. Run all tests
pytest tests/ -v

# Run a specific file
pytest tests/test_admin_business.py -v

# Stop on first failure
pytest tests/ -v -x

# 4. Stop test containers when done
docker compose -f tests/docker-compose.test.yml down
```

Environment variables are handled automatically by `tests/conftest.py` — no manual exports needed on any OS.

### Test Containers

Defined in `tests/docker-compose.test.yml`:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| test-db | `postgis/postgis:15-3.3` | 5434 | PostGIS database (pg_trgm enabled, no pgvector) |
| test-minio | `minio/minio:latest` | 9100 (S3), 9101 (console) | Real S3-compatible storage for image tests |

Ports are offset from production to avoid collisions (5434 instead of 5432, 9100 instead of 9000).

### Test Files

| File | Tests | What it covers |
|------|-------|----------------|
| `test_admin_business.py` | 6 | Business POI creation — minimal, all fields, links, JSONB |
| `test_admin_park.py` | 6 | Park POI creation — minimal, outdoor, hunting/fishing, facilities |
| `test_admin_trail.py` | 5 | Trail POI creation — minimal, all fields, coordinates, surfaces |
| `test_admin_event.py` | 5 | Event POI creation — minimal, all fields, repeating, vendors, cost |
| `test_admin_categories.py` | 10 | Category CRUD, tree, assignment, deletion |
| `test_admin_publish.py` | 7 | Draft/published/archived lifecycle, visibility filtering |
| `test_admin_update.py` | 13 | Update every field type, subtypes, slugs, partial updates |
| `test_admin_delete.py` | 4 | Delete POI, cascade, preserve categories |
| `test_admin_search.py` | 6 | Public search, admin search, location search, validation |
| `test_admin_images.py` | 10 | Real MinIO uploads, metadata, reorder, delete, all 12 image types |
| `test_admin_relationships.py` | 7 | POI-to-POI links, cascade delete, validation |
| `test_admin_venues.py` | 5 | Venue list, venue data for events |
| `test_crossapp_read.py` | 13 | Admin writes data, app reads it — the core cross-app contract |
| `test_new_poi_fields.py` | 20 | New POI fields: teaser_paragraph, lat_long_most_accurate, alcohol_policy_details, parking/playground/restroom locations |
| `test_admin_form_tasks.py` | 20 | Tasks 17-41: short description limit, free biz category limit, multiple playgrounds, article links, trail head/exit max count |
| `test_search_engine.py` | 14 | Multi-signal search: exact/fuzzy/city/type/ordering/empty/fallback/published-only |
| `test_query_processor.py` | 13 | Query parsing: amenity/type/location/difficulty extraction, edge cases |
| `test_fulltext_search.py` | 11 | tsvector column, stemming, description-only matches |
| `test_form_endpoints.py` | 23 | All 5 public forms: happy path, validation, duplicates, file uploads |
| `test_event_lifecycle.py` | varies | Event creation and lifecycle |

### How Tests Work

**Database isolation**: Each test gets a fresh database (DROP SCHEMA → CREATE SCHEMA → CREATE TABLES). No test data leaks between tests.

**Auth**: Admin authentication is mocked — all admin API requests run as an admin user.

**Cross-app tests**: Data is created directly via SQLAlchemy ORM (admin models imported at module level) and read via the nearby-app TestClient. This avoids the `sys.modules` collision that occurs when both apps share the `app.*` namespace.

**Image tests**: Use a real MinIO container — images are actually uploaded to and deleted from S3-compatible storage.

**ML model**: Not loaded in tests (test PostGIS image doesn't have pgvector). Semantic search falls back to keyword search automatically.

### Bugs Found by Tests

The test suite exposed and fixed these real bugs:

| Bug | Impact | Root Cause |
|-----|--------|------------|
| Empty subtype `{}` rejected on create | 422 on park/trail creation with no optional fields | `not values.get('park')` treats `{}` as falsy |
| Enum vs string comparison in updates | 500 on subtype updates | `POIType.BUSINESS == 'BUSINESS'` is always `False` |
| `EventCreate` used for partial updates | 422 when updating any event field | Required `start_datetime` even for partial update |
| `/api/nearby` returns raw WKB geometry | 500 on coordinate-based nearby search | Missing `PointGeometry.from_wkb()` conversion |
| Events page blank white screen | Can't create events | Missing `TextInput` import in `LocationSection.jsx` |
| Corporate compliance radios not clickable | Can't toggle yes/no | Mantine v8 broke click handling with cursor styles on Radio |
| Short description DB rejection | 500 when HTML + text > 250 bytes | `String(250)` column too small for HTML — changed to `Text` |
| Free biz category tests broke | 2 existing tests failed | New free-biz 1-category limit needed `listing_type="paid"` in tests |
| Suggestions endpoint obsolete | Test failures after deletion | Old `test_suggestions.py` tested deleted endpoint → deleted test file |

---

## Test Folder Structure

```
NearbyNearby/
├── tests/                               # Integration & cross-app tests (225 tests)
│   ├── conftest.py                      # Shared fixtures, auth mocking, ORM helpers
│   ├── docker-compose.test.yml          # PostGIS + MinIO test containers
│   ├── test_admin_business.py
│   ├── test_admin_park.py
│   ├── test_admin_trail.py
│   ├── test_admin_event.py
│   ├── test_admin_categories.py
│   ├── test_admin_publish.py
│   ├── test_admin_update.py
│   ├── test_admin_delete.py
│   ├── test_admin_search.py
│   ├── test_admin_images.py
│   ├── test_admin_relationships.py
│   ├── test_admin_venues.py
│   ├── test_crossapp_read.py
│   ├── test_new_poi_fields.py           # New fields: teaser, lat_long flag, alcohol, locations
│   ├── test_admin_form_tasks.py         # Tasks 17-41: validators, limits, playgrounds
│   ├── test_search_engine.py            # Multi-signal search engine tests
│   ├── test_query_processor.py          # Query processor extraction tests
│   ├── test_fulltext_search.py          # tsvector / full-text search tests
│   ├── test_form_endpoints.py           # Public form API tests (23 tests)
│   └── test_event_lifecycle.py          # Event lifecycle tests
│
├── nearby-admin/
│   └── backend/
│       └── tests/                       # Original admin-only tests (pytest + httpx)
│           ├── conftest.py
│           ├── test_auth.py
│           ├── test_pois_api.py
│           ├── test_crud_poi.py
│           ├── test_image_upload.py
│           └── test_attributes.py
│
├── nearby-app/
│   ├── backend/tests/                   # Not yet created
│   └── app/tests/                       # Not yet created
```

---

## Priority Tiers

### Tier 1 - "If these break, production is down" (DONE)

| # | What to Test | Status | Where |
|---|-------------|--------|-------|
| 1 | POI CRUD (all 4 types, all fields) | Done | `test_admin_business/park/trail/event.py` |
| 1b | Public form endpoints (all 5 forms) | Done | `test_form_endpoints.py` |
| 2 | Update every field type | Done | `test_admin_update.py` |
| 3 | Publication status filtering | Done | `test_admin_publish.py` |
| 4 | Cross-app data flow (admin writes, app reads) | Done | `test_crossapp_read.py` |
| 5 | Search (public + admin, name + location) | Done | `test_admin_search.py` |
| 6 | Image upload to S3 | Done | `test_admin_images.py` |

### Tier 2 - "Users will notice" (DONE)

| # | What to Test | Status | Where |
|---|-------------|--------|-------|
| 7 | Categories CRUD and tree | Done | `test_admin_categories.py` |
| 8 | POI relationships | Done | `test_admin_relationships.py` |
| 9 | Venue list + venue data | Done | `test_admin_venues.py` |
| 10 | Delete + cascade | Done | `test_admin_delete.py` |

### Tier 3 - "Nice to have" (TODO)

| # | What to Test | App | Type |
|---|-------------|-----|------|
| 11 | Auth & RBAC (login, roles, permissions) | nearby-admin | Integration |
| 12 | Frontend smoke tests (NearbySection, NearbyCard) | nearby-app | Component |
| 13 | POI form validation | nearby-admin | Component |
| 14 | Search result ranking quality | nearby-app | Unit |

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

The nearby-app loads a ~1GB embedding model (`embeddinggemma-300m`) on startup. The test PostGIS container does not have pgvector, so semantic search automatically falls back to keyword search. No mocking needed.

For future tests that need the real model:
```python
@pytest.mark.slow
def test_real_semantic_search(db_session, client):
    """Only runs with: pytest -m slow"""
    pass
```

```bash
# CI (every push) - fast, no ML model
pytest -m "not slow"

# Nightly/weekly - includes ML model tests
pytest -m slow
```

### Database Test Isolation

The `tests/conftest.py` handles isolation automatically:

1. Each test drops and recreates the `public` schema
2. Creates PostGIS and pg_trgm extensions
3. Creates the `imagetype` enum
4. Runs `Base.metadata.create_all()` to create all tables
5. Yields a fresh `db_session`
6. Closes the session after the test

### Cross-App Module Collision

Both `nearby-admin` and `nearby-app` define `app.*` modules. Python can only have one set loaded at a time. The `conftest.py` handles this with `sys.path` and `sys.modules` swapping for the `app_client` fixture.

Cross-app tests use **ORM helpers** (not `admin_client`) to create test data. This avoids the collision because only the app-side modules need to be loaded during the test.

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

---

## CI/CD Integration

Tests are integrated directly into the **nearby-app deployment workflow** at `.github/workflows/deploy-app.yml`. There is no separate test workflow file. The `test` job gates the `build-and-deploy` job -- if tests fail, the deploy does not proceed.

The **nearby-admin deployment workflow** (`.github/workflows/deploy-admin.yml`) has **no test job** -- it builds and deploys immediately on push.

### How Tests Gate Deployment (nearby-app)

```
push to main (nearby-app/** or shared/**)
    |
    v
  [test job]  ──failed──>  deploy blocked
    |
  passed / skipped
    |
    v
  [build-and-deploy job]  ──>  ECR push + ECS force deploy
```

- **Push-triggered deploys** always run the test job (no way to skip).
- **Manual dispatches** (`workflow_dispatch`) offer a `skip_tests` checkbox. When checked, the test job is skipped and deploy proceeds directly.
- The `build-and-deploy` job uses `if: always() && (needs.test.result == 'success' || needs.test.result == 'skipped')` so it runs when tests pass OR when the test job was skipped via the input flag.

### Actual Workflow Configuration

```yaml
# .github/workflows/deploy-app.yml (simplified — secrets/ECR/ECS details omitted)
name: Deploy nearby-app to AWS ECR/ECS

on:
  push:
    branches: [ "main" ]
    paths:
      - 'nearby-app/**'
      - 'shared/**'
  workflow_dispatch:
    inputs:
      skip_tests:
        description: 'Skip integration tests'
        required: false
        type: boolean
        default: false

jobs:
  test:
    if: ${{ github.event_name == 'push' || !inputs.skip_tests }}
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:15-3.4
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_nearbynearby
        ports:
          - 5434:5432
        options: >-
          --health-cmd "pg_isready -U test -d test_nearbynearby"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r nearby-app/backend/requirements.txt
          pip install -r nearby-admin/backend/requirements.txt
          pip install pytest httpx

      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5434/test_nearbynearby
          PYTHONPATH: .
        run: pytest tests/ -v --tb=short -x

  build-and-deploy:
    needs: test
    if: ${{ always() && (needs.test.result == 'success' || needs.test.result == 'skipped') }}
    runs-on: ubuntu-latest
    steps:
      # ... AWS OIDC auth, ECR login, Docker Buildx, build+push, ECS force deploy
```

### Key Details

| Detail | Value |
|--------|-------|
| PostGIS service image | `postgis/postgis:15-3.4` |
| PostGIS port mapping | `5434:5432` (offset to avoid collisions) |
| Test database name | `test_nearbynearby` |
| Python version | 3.11 |
| Dependencies installed | Both `nearby-app/backend/requirements.txt` AND `nearby-admin/backend/requirements.txt`, plus `pytest httpx` |
| Environment variables | `DATABASE_URL`, `PYTHONPATH=.` |
| Test command | `pytest tests/ -v --tb=short -x` (`-x` = stop on first failure) |
| MinIO service | Not included in CI (image tests skipped; only PostGIS-dependent tests run) |

### nearby-admin Workflow (No Tests)

The admin workflow at `.github/workflows/deploy-admin.yml` has a single `build-and-deploy` job with no test gate. It triggers on pushes to `main` that touch `nearby-admin/**` or `shared/**`, and also supports manual `workflow_dispatch` (without a `skip_tests` option since there are no tests to skip).

### Pipeline Timing

| Stage | Duration | Notes |
|-------|----------|-------|
| App test job | ~12 minutes | PostGIS container startup + 225 integration tests |
| App build-and-deploy job | ~8 minutes | Multi-stage Docker build (~5.7GB image including ML model) |
| **App total end-to-end** | **~20 minutes** | Test + build + ECS force deploy |
| App with `skip_tests` | ~8 minutes | Manual dispatch only, skips test job |
| Admin build-and-deploy | ~2 minutes | No tests, lighter images (separate backend + frontend) |

### Runner Infrastructure

All CI/CD jobs run on **GitHub-hosted Ubuntu runners** (`runs-on: ubuntu-latest`). Nothing runs on AWS infrastructure, local machines, or self-hosted runners. The PostGIS service container is spun up ephemerally by GitHub Actions alongside the runner.

GitHub Actions free tier provides **2,000 minutes/month for private repos** and **unlimited minutes for public repos**. At ~20 minutes per app deploy, the free tier supports ~100 deployments/month.

---

## Coverage Goals

For a startup, aim for practical coverage, not a number:

- **Tier 1 features**: 80%+ coverage on happy paths + key error cases
- **Tier 2 features**: 60%+ coverage on happy paths
- **Tier 3 features**: Smoke tests only

Don't chase 100% coverage. A well-tested happy path for your flagship feature is worth more than 90% coverage on utilities.
