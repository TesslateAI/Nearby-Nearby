# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from .core.config import settings
from .api.endpoints import pois, waitlist
from .database import engine, get_db
from sqlalchemy import text
from sqlalchemy.orm import Session
import os
import re
from pathlib import Path
from . import models

app = FastAPI(
    title="Nearby Nearby API",
    description="API for the Nearby Nearby platform.",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    """Test database connection and enable extensions on startup"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("[SUCCESS] Database connection successful!")
            print(f"[SUCCESS] Connected to: {settings.DATABASE_URL.split('@')[1].split('/')[0]}")

            # Enable pg_trgm extension for fuzzy search
            try:
                connection.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
                connection.commit()
                print("[SUCCESS] pg_trgm extension enabled for fuzzy search!")
            except Exception as ext_error:
                print(f"[WARNING] Could not enable pg_trgm extension: {ext_error}")
                print("[INFO] Fuzzy search will still work with basic matching")

            # Enable pgvector extension for semantic search
            try:
                connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                connection.commit()
                print("[SUCCESS] pgvector extension enabled for semantic search!")
            except Exception as ext_error:
                print(f"[WARNING] Could not enable pgvector extension: {ext_error}")
                print("[INFO] Semantic search will not be available")

            # Create trigram indexes for better search performance
            try:
                connection.execute(text(
                    "CREATE INDEX IF NOT EXISTS poi_name_trgm_idx ON points_of_interest USING gin (name gin_trgm_ops)"
                ))
                connection.execute(text(
                    "CREATE INDEX IF NOT EXISTS poi_city_trgm_idx ON points_of_interest USING gin (address_city gin_trgm_ops)"
                ))
                connection.commit()
                print("[SUCCESS] Search indexes created for optimal performance!")
            except Exception as idx_error:
                print(f"[WARNING] Could not create search indexes: {idx_error}")

    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        raise

    # Load embedding model for semantic search
    print("\n[EMBEDDING] Loading michaelfeil/embeddinggemma-300m model...")
    try:
        from sentence_transformers import SentenceTransformer
        import time
        start_time = time.time()
        app.state.embedding_model = SentenceTransformer("michaelfeil/embeddinggemma-300m")
        load_time = time.time() - start_time
        print(f"[SUCCESS] Embedding model loaded in {load_time:.1f}s and ready for fast searches!")
        print(f"[INFO] Model will stay in memory (~1GB RAM) for instant search responses")
    except Exception as e:
        print(f"[WARNING] Could not load embedding model: {e}")
        print("[INFO] Semantic search will fall back to keyword search")
        app.state.embedding_model = None

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(pois.router, prefix="/api", tags=["Points of Interest"])
app.include_router(waitlist.router, prefix="/api", tags=["Waitlist"])

# Static files configuration
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

# Mount static files (CSS, JS, images, etc.)
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

def get_poi_from_path(path: str, db: Session):
    """Extract POI identifier from path and fetch POI data"""
    # Match patterns: /places/{slug}, /parks/{slug}, /trails/{slug}, /events/{slug}, /poi/{uuid}
    patterns = [
        (r'^places/(.+)$', 'slug'),
        (r'^parks/(.+)$', 'slug'),
        (r'^trails/(.+)$', 'slug'),
        (r'^events/(.+)$', 'slug'),
        (r'^poi/([a-f0-9-]{36})$', 'uuid'),
    ]

    for pattern, id_type in patterns:
        match = re.match(pattern, path)
        if match:
            identifier = match.group(1)
            if id_type == 'uuid':
                return db.query(models.poi.PointOfInterest).filter(
                    models.poi.PointOfInterest.id == identifier,
                    models.poi.PointOfInterest.publication_status == 'published'
                ).first()
            else:
                return db.query(models.poi.PointOfInterest).filter(
                    models.poi.PointOfInterest.slug == identifier,
                    models.poi.PointOfInterest.publication_status == 'published'
                ).first()
    return None


def generate_og_meta_tags(poi, base_url: str) -> str:
    """Generate Open Graph meta tags for a POI"""
    title = f"{poi.name} | NearbyNearby"
    description = (
        poi.teaser_paragraph or
        poi.description_short or
        (poi.description_long[:150] + '...' if poi.description_long and len(poi.description_long) > 150 else poi.description_long) or
        f"Discover {poi.name} in {poi.address_city or 'your area'}. Find local businesses, parks, trails, and events on NearbyNearby."
    )
    # Strip HTML tags from description
    description = re.sub(r'<[^>]+>', '', description or '')

    # Determine URL based on slug or fallback to UUID
    if poi.slug:
        type_prefixes = {
            'BUSINESS': 'places',
            'SERVICES': 'places',
            'PARK': 'parks',
            'TRAIL': 'trails',
            'EVENT': 'events',
        }
        prefix = type_prefixes.get(poi.poi_type.value if hasattr(poi.poi_type, 'value') else poi.poi_type, 'places')
        url = f"{base_url}/{prefix}/{poi.slug}"
    else:
        url = f"{base_url}/poi/{poi.id}"

    # Get image URL (featured image or default logo)
    image_url = poi.featured_image if poi.featured_image else f"{base_url}/Logo.png"

    return f'''
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{url}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:image" content="{image_url}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="NearbyNearby" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="{url}" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{description}" />
    <meta name="twitter:image" content="{image_url}" />
    <meta name="twitter:site" content="@itsnearbynearby" />

    <!-- Standard Meta -->
    <meta name="description" content="{description}" />
    <title>{title}</title>
'''


def inject_meta_tags(html: str, meta_tags: str) -> str:
    """Inject meta tags into HTML, replacing defaults"""
    # Remove existing OG tags, Twitter tags, and title
    html = re.sub(r'<meta property="og:[^"]*"[^>]*>', '', html)
    html = re.sub(r'<meta name="twitter:[^"]*"[^>]*>', '', html)
    html = re.sub(r'<meta name="description"[^>]*>', '', html)
    html = re.sub(r'<title>[^<]*</title>', '', html)

    # Inject new meta tags after <head>
    html = html.replace('<head>', f'<head>{meta_tags}', 1)
    return html


# Catch-all route for SPA (must be last)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    Serve the React SPA for all non-API routes.
    This enables client-side routing with dynamic meta tags for social sharing.
    """
    # If it's an API route, let FastAPI handle it (shouldn't reach here)
    if full_path.startswith("api/"):
        return {"message": "API route not found"}

    # Check if the requested file exists in static directory (images, fonts, etc.)
    file_path = STATIC_DIR / full_path
    if file_path.is_file():
        return FileResponse(str(file_path))

    # Check if this is a POI detail page - if so, inject dynamic meta tags
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        return {"message": "Frontend not built yet. Run 'npm run build' in the app directory."}

    # Check if this is a POI page that needs dynamic meta tags
    poi_patterns = ['places/', 'parks/', 'trails/', 'events/', 'poi/']
    is_poi_page = any(full_path.startswith(p) for p in poi_patterns)

    if is_poi_page:
        # Get database session
        db = next(get_db())
        try:
            poi = get_poi_from_path(full_path, db)
            if poi:
                # Read HTML and inject dynamic meta tags
                with open(index_file, 'r') as f:
                    html = f.read()

                base_url = "https://nearbynearby.com"
                meta_tags = generate_og_meta_tags(poi, base_url)
                html = inject_meta_tags(html, meta_tags)

                return HTMLResponse(content=html)
        except Exception as e:
            print(f"[ERROR] Failed to generate meta tags: {e}")
        finally:
            db.close()

    # Default: serve index.html for client-side routing
    return FileResponse(str(index_file))