import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add the project root to the Python path so 'app' can be imported.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.database import Base, get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.core.permissions import get_current_user_with_role

# Test user override - bypasses authentication for tests
def get_current_user_override():
    return "test@example.com"

# Test user with role override - bypasses permission checks for tests  
def get_current_user_with_role_override():
    class MockUser:
        def __init__(self):
            self.email = "test@example.com"
            self.role = "admin"
            self.id = "test-user-id"
    return MockUser()

# Test data setup
def setup_test_user(db_session):
    """Create a test user in the database for tests that need it"""
    from app import crud, schemas
    from app.core.security import get_password_hash
    
    # Check if test user already exists
    existing_user = crud.get_user_by_email(db_session, email="test@example.com")
    if not existing_user:
        # Create test user
        test_user = schemas.UserCreate(
            email="test@example.com",
            password="testpassword123",
            role="admin"
        )
        crud.create_user(db=db_session, user=test_user)
    return existing_user or crud.get_user_by_email(db_session, email="test@example.com")

# Use the database URL from the environment, which will be set by docker-compose
engine = create_engine(settings.DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """
    Fixture to create all tables for a test, and drop them after.
    This ensures every test gets a clean database.
    """
    # Drop and recreate the public schema for a clean slate
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))

        # Create enum types that might be needed
        conn.execute(text("""
            CREATE TYPE imagetype AS ENUM (
                'main', 'gallery', 'entry', 'parking', 'restroom',
                'rental', 'playground', 'menu', 'trail_head',
                'trail_exit', 'map', 'downloadable_map'
            );
        """))

    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # No need to drop tables here, schema is dropped at start of each test


@pytest.fixture(scope="function")
def client(db_session):
    """
    Fixture to create a test client that uses the clean database session.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    # Setup test user
    setup_test_user(db_session)

    # Override dependencies for testing
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = get_current_user_override
    app.dependency_overrides[get_current_user_with_role] = get_current_user_with_role_override
    
    with TestClient(app) as c:
        yield c
    
    # Clean up overrides
    app.dependency_overrides.clear()
        
    app.dependency_overrides.clear()