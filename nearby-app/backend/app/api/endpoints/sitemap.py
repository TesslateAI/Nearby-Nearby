# app/api/endpoints/sitemap.py
"""Sitemap endpoints for SEO."""

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from ...database import get_db
from ... import models

router = APIRouter()

_EXCLUDED_STATUSES = ("Canceled", "Rescheduled")
_BASE_URL = "https://nearbynearby.com"


@router.get("/sitemap-events.xml")
def sitemap_events(db: Session = Depends(get_db)):
    """Generate XML sitemap for published event POIs."""
    now = datetime.now(timezone.utc)

    # Query published EVENT POIs with event relationship
    pois = db.query(models.poi.PointOfInterest).options(
        joinedload(models.poi.PointOfInterest.event)
    ).filter(
        models.poi.PointOfInterest.poi_type == "EVENT",
        models.poi.PointOfInterest.publication_status == "published",
    ).all()

    urls = []
    for poi in pois:
        event = poi.event
        if not event:
            continue

        # Exclude cancelled/rescheduled
        if getattr(event, 'event_status', None) in _EXCLUDED_STATUSES:
            continue

        slug = poi.slug or str(poi.id)
        loc = f"{_BASE_URL}/events/{slug}"

        # Determine if upcoming or past
        end_dt = event.end_datetime or event.start_datetime
        is_upcoming = end_dt and end_dt > now

        priority = "0.8" if is_upcoming else "0.4"
        changefreq = "daily" if is_upcoming else "monthly"

        urls.append(
            f"  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <priority>{priority}</priority>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            f"  </url>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n"
        '</urlset>'
    )

    return Response(content=xml, media_type="application/xml")
