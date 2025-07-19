from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import pois, categories, attributes, auth, relationships, search
from app.database import engine, Base
from app.core.middleware import add_security_middleware
from app.core.config import settings

# This line can be used to create tables if not using Alembic,
# but with Alembic it's better to manage schema via migrations.
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nearby Nearby API",
    description="Secure API for Nearby Nearby application",
    version="1.0.0"
)

# Add security middleware
add_security_middleware(app)

# Set up CORS with centralized settings
allowed_origins = settings.allowed_origins_list.copy()

# Add production domain if specified
if settings.PRODUCTION_DOMAIN:
    # Support both HTTP and HTTPS for production domain
    allowed_origins.append(f"http://{settings.PRODUCTION_DOMAIN}")
    allowed_origins.append(f"https://{settings.PRODUCTION_DOMAIN}")
    
    # Also add with common ports
    allowed_origins.append(f"http://{settings.PRODUCTION_DOMAIN}:5173")
    allowed_origins.append(f"https://{settings.PRODUCTION_DOMAIN}:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Restrict methods
    allow_headers=["Authorization", "Content-Type"],  # Restrict headers
)

app.include_router(pois.router, prefix="/api", tags=["Points of Interest"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(attributes.router, prefix="/api", tags=["Attributes"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(relationships.router, prefix="/api", tags=["POI Relationships"])
app.include_router(search.router, prefix="/api", tags=["Search"])

@app.get("/")
def read_root():
    return {"message": "Nearby Nearby API"}
