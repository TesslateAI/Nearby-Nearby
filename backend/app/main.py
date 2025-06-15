from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import pois
from app.database import engine, Base

# This line can be used to create tables if not using Alembic,
# but with Alembic it's better to manage schema via migrations.
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nearby Nearby API")

# Set up CORS
origins = [
    "http://localhost",
    "http://localhost:5173", # Default Vite dev server port
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

@app.get("/")
def read_root():
    return {"message": "Nearby Nearby API"}