"""
Miscellaneous admin utility endpoints.

Currently exposes:
- POST /api/utils/what3words-to-coords: resolve a what3words 3-word address
  to lat/lng via the what3words v3 API. Admin-only.
- POST /api/utils/coords-to-what3words: reverse lookup — given lat/lng,
  return the matching 3-word address. Admin-only.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import httpx

from app.core.config import settings
from app.core.permissions import require_admin

router = APIRouter(prefix="/utils", tags=["Utils"])


class W3WIn(BaseModel):
    words: str = Field(..., pattern=r'^[a-z]+\.[a-z]+\.[a-z]+$')


class CoordsIn(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class W3WOut(BaseModel):
    latitude: float
    longitude: float
    nearest_place: Optional[str] = None
    country: Optional[str] = None
    words: str


@router.post("/what3words-to-coords", response_model=W3WOut)
async def what3words_to_coords(
    body: W3WIn,
    current_user = Depends(require_admin()),
):
    api_key = getattr(settings, 'what3words_api_key', None)
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="WHAT3WORDS_API_KEY not configured — set in .env (dev) "
                   "or SSM SecureString /nearbynearby/prod/what3words-api-key (prod).",
        )

    url = "https://api.what3words.com/v3/convert-to-coordinates"
    params = {"words": body.words, "key": api_key}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(url, params=params)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"what3words upstream error: {e}")

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"what3words returned {r.status_code}")

    j = r.json()
    coords = j.get("coordinates") or {}
    lat = coords.get("lat")
    lng = coords.get("lng")
    if lat is None or lng is None:
        raise HTTPException(status_code=502, detail="what3words response missing coordinates")

    return W3WOut(
        latitude=float(lat),
        longitude=float(lng),
        nearest_place=j.get("nearestPlace"),
        country=j.get("country"),
        words=j.get("words", body.words),
    )


@router.post("/coords-to-what3words", response_model=W3WOut)
async def coords_to_what3words(
    body: CoordsIn,
    current_user = Depends(require_admin()),
):
    """Reverse W3W lookup: lat/lng → 3-word address via what3words v3."""
    api_key = getattr(settings, 'what3words_api_key', None)
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="WHAT3WORDS_API_KEY not configured — set in .env (dev) "
                   "or SSM SecureString /nearbynearby/prod/what3words-api-key (prod).",
        )

    url = "https://api.what3words.com/v3/convert-to-3wa"
    params = {
        "coordinates": f"{body.latitude},{body.longitude}",
        "key": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(url, params=params)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"what3words upstream error: {e}")

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"what3words returned {r.status_code}")

    j = r.json()
    words = j.get("words")
    if not words:
        raise HTTPException(status_code=502, detail="what3words response missing words")

    coords = j.get("coordinates") or {}

    return W3WOut(
        latitude=float(coords.get("lat", body.latitude)),
        longitude=float(coords.get("lng", body.longitude)),
        nearest_place=j.get("nearestPlace"),
        country=j.get("country"),
        words=words,
    )
