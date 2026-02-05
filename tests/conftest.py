"""
Shared test fixtures for cross-app integration tests.

Both nearby-admin and nearby-app share the same PostgreSQL database.
This conftest sets up sys.path so we can import from both backends,
creates a clean database per test, and provides TestClient fixtures
for both apps.
"""

import os
import sys
import uuid
import pytest
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# 1. Environment variables (must be set before any app code is imported)
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://test:test@localhost:5434/test_nearby",
)

# Admin backend settings
os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-integration-tests-minimum-32-characters-long")
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("TESTING", "true")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

# App backend settings
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")

# MinIO / S3 settings for image tests
MINIO_ENDPOINT = os.environ.get("AWS_S3_ENDPOINT_URL", "http://localhost:9100")
MINIO_BUCKET = os.environ.get("AWS_S3_BUCKET", "test-nearby-images")
MINIO_ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID", "testminio")
MINIO_SECRET_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "testminio123")

os.environ.setdefault("STORAGE_PROVIDER", "s3")
os.environ.setdefault("AWS_S3_BUCKET", MINIO_BUCKET)
os.environ.setdefault("AWS_ACCESS_KEY_ID", MINIO_ACCESS_KEY)
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", MINIO_SECRET_KEY)
os.environ.setdefault("AWS_S3_ENDPOINT_URL", MINIO_ENDPOINT)
os.environ.setdefault("AWS_USE_SSL", "false")
os.environ.setdefault("AWS_REGION", "us-east-1")

# ---------------------------------------------------------------------------
# 2. sys.path setup - add monorepo root and both backends
# ---------------------------------------------------------------------------
MONOREPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ADMIN_BACKEND = os.path.join(MONOREPO_ROOT, "nearby-admin", "backend")
APP_BACKEND = os.path.join(MONOREPO_ROOT, "nearby-app", "backend")

for path in [MONOREPO_ROOT, ADMIN_BACKEND]:
    if path not in sys.path:
        sys.path.insert(0, path)

# ---------------------------------------------------------------------------
# 3. Import admin backend (primary app for writes)
# ---------------------------------------------------------------------------
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app as admin_app
from app.database import Base as AdminBase, get_db as admin_get_db
from app.core.security import get_current_user
from app.core.permissions import get_current_user_with_role

# Admin ORM models — imported at module level (before any sys.modules swap)
# so they can be used to create test data directly for cross-app tests.
from app.models.poi import PointOfInterest as AdminPOI, Business, Park, Trail, Event
from app.models.category import Category as AdminCategory, poi_category_association

# ---------------------------------------------------------------------------
# 4. Database engine & session (shared between admin and app clients)
# ---------------------------------------------------------------------------
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# 5. Auth override for admin endpoints
# ---------------------------------------------------------------------------
def _mock_get_current_user():
    return "test@example.com"


class _MockUser:
    def __init__(self):
        self.email = "test@example.com"
        self.role = "admin"
        self.id = "test-user-id"


def _mock_get_current_user_with_role():
    return _MockUser()


# ---------------------------------------------------------------------------
# 6. Create test user helper
# ---------------------------------------------------------------------------
def _setup_test_user(db_session):
    """Create a test user in the database for tests that need it."""
    from app import crud, schemas
    existing = crud.get_user_by_email(db_session, email="test@example.com")
    if not existing:
        test_user = schemas.UserCreate(
            email="test@example.com",
            password="testpassword123",
            role="admin",
        )
        crud.create_user(db=db_session, user=test_user)


# ---------------------------------------------------------------------------
# 7. Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="function")
def db_session():
    """
    Create a clean database schema for every test.
    Drops and recreates public schema, creates the imagetype enum,
    then lets SQLAlchemy create all tables.
    """
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        # PostGIS extension
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        # pg_trgm for fuzzy search
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
        # Create the imagetype enum (must exist before table creation)
        conn.execute(text("""
            CREATE TYPE imagetype AS ENUM (
                'main', 'gallery', 'entry', 'parking', 'restroom',
                'rental', 'playground', 'menu', 'trail_head',
                'trail_exit', 'map', 'downloadable_map'
            );
        """))
        conn.commit()

    AdminBase.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def admin_client(db_session):
    """
    TestClient for nearby-admin FastAPI app.
    Auth is overridden so every request acts as an admin user.
    """
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass  # session closed by db_session fixture

    _setup_test_user(db_session)

    admin_app.dependency_overrides[admin_get_db] = _override_get_db
    admin_app.dependency_overrides[get_current_user] = _mock_get_current_user
    admin_app.dependency_overrides[get_current_user_with_role] = _mock_get_current_user_with_role

    with TestClient(admin_app) as c:
        yield c

    admin_app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def app_client(db_session):
    """
    TestClient for nearby-app FastAPI app.
    Uses the SAME db_session so it reads data written by admin_client.
    No auth required (public endpoints).

    IMPORTANT: Cross-app tests that use both admin_client and app_client
    must create data with admin_client BEFORE this fixture is set up.
    We achieve this by making app_client depend on admin_client indirectly
    through db_session, but the module swap means admin_client cannot be
    used AFTER app_client is set up in the same test.

    The workaround: tests that need both clients should create admin data
    first, then use app_client to read it. The admin_client TestClient
    still works because its FastAPI app object and endpoint handlers hold
    references to admin modules even after sys.modules is swapped.
    """
    _prev_path = sys.path.copy()

    # Remove admin backend, add app backend
    if ADMIN_BACKEND in sys.path:
        sys.path.remove(ADMIN_BACKEND)
    if APP_BACKEND not in sys.path:
        sys.path.insert(0, APP_BACKEND)

    # Save admin modules
    admin_modules = {}
    for mod_name in list(sys.modules.keys()):
        if mod_name == "app" or mod_name.startswith("app."):
            admin_modules[mod_name] = sys.modules.pop(mod_name)

    try:
        # Import app-side modules fresh
        os.environ["DATABASE_URL"] = TEST_DATABASE_URL
        from app.main import app as nearby_app
        from app.database import get_db as app_get_db

        def _override_app_get_db():
            try:
                yield db_session
            finally:
                pass

        nearby_app.dependency_overrides[app_get_db] = _override_app_get_db

        with TestClient(nearby_app, raise_server_exceptions=False) as c:
            yield c

        nearby_app.dependency_overrides.clear()

    finally:
        # Restore admin modules
        for mod_name in list(sys.modules.keys()):
            if mod_name == "app" or mod_name.startswith("app."):
                del sys.modules[mod_name]
        sys.modules.update(admin_modules)
        sys.path = _prev_path


# ---------------------------------------------------------------------------
# 8. Helper functions for creating test data
# ---------------------------------------------------------------------------
def create_business(client, name="Test Business", published=False, **overrides):
    """Create a business POI via the admin API."""
    payload = {
        "name": name,
        "poi_type": "BUSINESS",
        "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
        "business": {"price_range": "$$"},
    }
    if published:
        payload["publication_status"] = "published"
    payload.update(overrides)
    resp = client.post("/api/pois/", json=payload)
    assert resp.status_code == 201, f"Failed to create business: {resp.text}"
    return resp.json()


def create_park(client, name="Test Park", published=False, **overrides):
    """Create a park POI via the admin API."""
    payload = {
        "name": name,
        "poi_type": "PARK",
        "location": {"type": "Point", "coordinates": [-79.1, 35.9]},
        "park": {},
    }
    if published:
        payload["publication_status"] = "published"
    payload.update(overrides)
    resp = client.post("/api/pois/", json=payload)
    assert resp.status_code == 201, f"Failed to create park: {resp.text}"
    return resp.json()


def create_trail(client, name="Test Trail", published=False, **overrides):
    """Create a trail POI via the admin API."""
    payload = {
        "name": name,
        "poi_type": "TRAIL",
        "location": {"type": "Point", "coordinates": [-79.2, 35.7]},
        "trail": {},
    }
    if published:
        payload["publication_status"] = "published"
    payload.update(overrides)
    resp = client.post("/api/pois/", json=payload)
    assert resp.status_code == 201, f"Failed to create trail: {resp.text}"
    return resp.json()


def create_event(client, name="Test Event", published=False, **overrides):
    """Create an event POI via the admin API."""
    payload = {
        "name": name,
        "poi_type": "EVENT",
        "location": {"type": "Point", "coordinates": [-79.3, 35.6]},
        "event": {"start_datetime": "2026-06-15T18:00:00Z"},
    }
    if published:
        payload["publication_status"] = "published"
    payload.update(overrides)
    resp = client.post("/api/pois/", json=payload)
    assert resp.status_code == 201, f"Failed to create event: {resp.text}"
    return resp.json()


def create_category(client, name="Test Category", applicable_to=None):
    """Create a category via the admin API."""
    payload = {
        "name": name,
        "applicable_to": applicable_to or ["BUSINESS", "PARK", "TRAIL", "EVENT"],
    }
    resp = client.post("/api/categories/", json=payload)
    assert resp.status_code == 201, f"Failed to create category: {resp.text}"
    return resp.json()


def publish_poi(client, poi_id):
    """Publish a POI via admin API."""
    resp = client.put(f"/api/pois/{poi_id}", json={"publication_status": "published"})
    assert resp.status_code == 200, f"Failed to publish POI: {resp.text}"
    return resp.json()


# ---------------------------------------------------------------------------
# 9. ORM helpers for cross-app tests (bypass admin API to avoid module collision)
# ---------------------------------------------------------------------------
def orm_create_business(db, name="Test Business", published=False, slug=None, **kwargs):
    """Create a business POI directly via ORM. Returns the ORM object."""
    import re
    poi_id = uuid.uuid4()
    if slug is None:
        city = kwargs.get("address_city", "")
        base = f"{name} {city}".strip().lower()
        slug = re.sub(r'[^\w\s-]', '', base)
        slug = re.sub(r'[\s_]+', '-', slug)
        slug = re.sub(r'^-+|-+$', '', slug)
        slug = slug or str(poi_id)[:8]

    location = kwargs.pop("location", "POINT(-79.0 35.8)")
    price_range = kwargs.pop("price_range", "$$")

    poi = AdminPOI(
        id=poi_id,
        poi_type="BUSINESS",
        name=name,
        slug=slug,
        location=location,
        publication_status="published" if published else "draft",
        listing_type=kwargs.pop("listing_type", "free"),
        status=kwargs.pop("status", "Fully Open"),
        **kwargs,
    )
    db.add(poi)
    db.flush()

    biz = Business(poi_id=poi_id, price_range=price_range)
    db.add(biz)
    db.flush()
    return poi


def orm_create_park(db, name="Test Park", published=False, slug=None, **kwargs):
    """Create a park POI directly via ORM."""
    import re
    poi_id = uuid.uuid4()
    if slug is None:
        city = kwargs.get("address_city", "")
        base = f"{name} {city}".strip().lower()
        slug = re.sub(r'[^\w\s-]', '', base)
        slug = re.sub(r'[\s_]+', '-', slug)
        slug = slug or str(poi_id)[:8]

    location = kwargs.pop("location", "POINT(-79.1 35.9)")

    poi = AdminPOI(
        id=poi_id,
        poi_type="PARK",
        name=name,
        slug=slug,
        location=location,
        publication_status="published" if published else "draft",
        **kwargs,
    )
    db.add(poi)
    db.flush()

    park = Park(poi_id=poi_id)
    db.add(park)
    db.flush()
    return poi


def orm_create_trail(db, name="Test Trail", published=False, slug=None, trail_fields=None, **kwargs):
    """Create a trail POI directly via ORM."""
    import re
    poi_id = uuid.uuid4()
    if slug is None:
        city = kwargs.get("address_city", "")
        base = f"{name} {city}".strip().lower()
        slug = re.sub(r'[^\w\s-]', '', base)
        slug = re.sub(r'[\s_]+', '-', slug)
        slug = slug or str(poi_id)[:8]

    location = kwargs.pop("location", "POINT(-79.2 35.7)")

    poi = AdminPOI(
        id=poi_id,
        poi_type="TRAIL",
        name=name,
        slug=slug,
        location=location,
        publication_status="published" if published else "draft",
        **kwargs,
    )
    db.add(poi)
    db.flush()

    trail_kwargs = trail_fields or {}
    trail = Trail(poi_id=poi_id, **trail_kwargs)
    db.add(trail)
    db.flush()
    return poi


def orm_create_event(db, name="Test Event", published=False, slug=None, event_fields=None, **kwargs):
    """Create an event POI directly via ORM."""
    import re
    poi_id = uuid.uuid4()
    if slug is None:
        city = kwargs.get("address_city", "")
        base = f"{name} {city}".strip().lower()
        slug = re.sub(r'[^\w\s-]', '', base)
        slug = re.sub(r'[\s_]+', '-', slug)
        slug = slug or str(poi_id)[:8]

    location = kwargs.pop("location", "POINT(-79.3 35.6)")

    poi = AdminPOI(
        id=poi_id,
        poi_type="EVENT",
        name=name,
        slug=slug,
        location=location,
        publication_status="published" if published else "draft",
        **kwargs,
    )
    db.add(poi)
    db.flush()

    ev_kwargs = event_fields or {}
    if "start_datetime" not in ev_kwargs:
        ev_kwargs["start_datetime"] = datetime(2026, 6, 15, 18, 0, 0, tzinfo=timezone.utc)
    evt = Event(poi_id=poi_id, **ev_kwargs)
    db.add(evt)
    db.flush()
    return poi


def orm_create_category(db, name="Test Category", applicable_to=None):
    """Create a category directly via ORM."""
    import re
    cat_id = uuid.uuid4()
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[\s_]+', '-', slug)
    cat = AdminCategory(
        id=cat_id,
        name=name,
        slug=slug,
        applicable_to=applicable_to or ["BUSINESS", "PARK", "TRAIL", "EVENT"],
    )
    db.add(cat)
    db.flush()
    return cat


def orm_assign_main_category(db, poi_id, category_id):
    """Assign a main category to a POI via the association table."""
    db.execute(poi_category_association.insert().values(
        poi_id=poi_id, category_id=category_id, is_main=True
    ))
    db.flush()


def orm_publish_poi(db, poi):
    """Set a POI's publication_status to 'published'."""
    poi.publication_status = "published"
    db.flush()
