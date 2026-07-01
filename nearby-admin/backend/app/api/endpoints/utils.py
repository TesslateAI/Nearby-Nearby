"""
Miscellaneous admin utility endpoints.

Currently exposes:
- POST /api/utils/what3words-to-coords: resolve a what3words 3-word address
  to lat/lng via the what3words v3 API. Admin-only.
- POST /api/utils/coords-to-what3words: reverse lookup — given lat/lng,
  return the matching 3-word address. Admin-only.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re
import httpx

from app.core.config import settings
from app.core.permissions import require_admin

router = APIRouter(prefix="/utils", tags=["Utils"])

# Three dot-separated lowercase words. The canonical form users copy/paste from
# what3words.com is prefixed with "///" — we accept and strip it.
_W3W_RE = re.compile(r'^[a-z]+\.[a-z]+\.[a-z]+$')


class W3WIn(BaseModel):
    words: str

    @field_validator('words', mode='before')
    @classmethod
    def _normalize_words(cls, v):
        if not isinstance(v, str):
            raise ValueError('what3words address must be a string')
        # Strip the leading "///" (and any stray whitespace) before validating.
        cleaned = v.strip().lstrip('/').strip()
        if not _W3W_RE.match(cleaned):
            raise ValueError(
                'Invalid what3words address — expected three dot-separated '
                'lowercase words, e.g. "filled.count.soap" or '
                '"///filled.count.soap".'
            )
        return cleaned


class CoordsIn(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class W3WOut(BaseModel):
    latitude: float
    longitude: float
    nearest_place: Optional[str] = None
    country: Optional[str] = None
    words: str


def _raise_for_w3w(r: httpx.Response) -> dict:
    """
    Return the parsed JSON body of a successful what3words response, or raise a
    descriptive HTTPException for an error response.

    what3words signals errors via the HTTP status and/or an ``{"error": {...}}``
    body, e.g. ``{"error": {"code": "QuotaExceeded", "message": "..."}}``. The
    previous code collapsed every non-200 into an opaque "HTTP 502", which made
    the Free-plan and bad-key cases impossible to diagnose from the admin UI.
    """
    try:
        j = r.json()
    except Exception:
        j = {}

    err = j.get("error") if isinstance(j, dict) else None
    if r.status_code == 200 and not err:
        return j if isinstance(j, dict) else {}

    err_dict = err if isinstance(err, dict) else {}
    code = err_dict.get("code")
    message = err_dict.get("message")

    if code == "QuotaExceeded":
        # Free plan, or monthly quota exhausted: convert-to-coordinates and
        # convert-to-3wa require a paid what3words plan.
        raise HTTPException(
            status_code=402,
            detail="what3words: this API plan does not include coordinate "
                   "conversion (or the quota is exhausted). Upgrade the plan at "
                   "https://accounts.what3words.com/select-plan.",
        )
    if code in ("InvalidKey", "MissingKey"):
        raise HTTPException(
            status_code=502,
            detail="what3words: the API key was rejected — check "
                   "WHAT3WORDS_API_KEY (dev .env / prod SSM).",
        )
    if code in ("BadWords", "BadCoordinates", "BadInput", "BadLanguage", "NotFound"):
        raise HTTPException(
            status_code=400,
            detail=message or f"what3words rejected the request ({code}).",
        )

    detail = f"what3words upstream error ({code or r.status_code})"
    if message:
        detail += f": {message}"
    raise HTTPException(status_code=502, detail=detail)


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

    j = _raise_for_w3w(r)
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

    j = _raise_for_w3w(r)
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
