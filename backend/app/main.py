from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import pois, categories, attributes, auth, relationships
from app.database import engine, Base

# This line can be used to create tables if not using Alembic,
# but with Alembic it's better to manage schema via migrations.
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nearby Nearby API")

# Set up CORS
origins = [
    "http://localhost",
    "http://localhost:5173", # Default Vite dev server port
    "http://127.0.0.1:5173", # Alternative localhost
    "https://nearbynearby.tesslate.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pois.router, prefix="/api", tags=["Points of Interest"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(attributes.router, prefix="/api", tags=["Attributes"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(relationships.router, prefix="/api", tags=["POI Relationships"])

@app.get("/")
def read_root():
    return {"message": "Nearby Nearby API"}
