from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

# The __init__.py files now allow these cleaner imports
from app import crud, schemas
from app.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_admin_or_editor

router = APIRouter()

@router.post("/pois/", response_model=schemas.PointOfInterest, status_code=201)
def create_poi(
    poi: schemas.PointOfInterestCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin_or_editor())
):
    if poi.poi_type == 'BUSINESS' and poi.business is None:
        raise HTTPException(status_code=400, detail="Business data required for poi_type 'BUSINESS'")
    if poi.poi_type == 'PARK' and poi.park is None:
        raise HTTPException(status_code=400, detail="Park data required for poi_type 'PARK'")
    if poi.poi_type == 'TRAIL' and poi.trail is None:
        raise HTTPException(status_code=400, detail="Trail data required for poi_type 'TRAIL'")
    if poi.poi_type == 'EVENT' and poi.event is None:
        raise HTTPException(status_code=400, detail="Event data required for poi_type 'EVENT'")

    return crud.create_poi(db=db, poi=poi)


@router.get("/pois/", response_model=List[schemas.PointOfInterest])
def read_pois(
    skip: int = 0,
    limit: int = 100,
    search: str = Query(None, description="Search query for POI names"),
    db: Session = Depends(get_db),
    current_user: Optional[str] = Depends(lambda: None)  # Try to get current user but don't require it
):
    # Public view - only show published POIs
    if search:
        return crud.search_pois(db=db, query_str=search, include_drafts=False)
    pois = crud.get_pois(db, skip=skip, limit=limit, include_drafts=False)
    return pois

@router.get("/admin/pois/", response_model=List[schemas.PointOfInterest])
def read_pois_admin(
    skip: int = 0,
    limit: int = 100,
    search: str = Query(None, description="Search query for POI names"),
    db: Session = Depends(get_db),
    current_user = Depends(require_admin_or_editor())  # Require admin or editor role
):
    # Admin view - show all POIs including drafts
    if search:
        return crud.search_pois(db=db, query_str=search, include_drafts=True)
    pois = crud.get_pois(db, skip=skip, limit=limit, include_drafts=True)
    return pois


@router.get("/pois/search", response_model=List[schemas.PointOfInterest], summary="Search for POIs by text")
def search_pois_endpoint(q: str = Query(..., min_length=3, description="Search query string"), db: Session = Depends(get_db)):
    # Public search - only published POIs
    return crud.search_pois(db=db, query_str=q, include_drafts=False)

@router.get("/admin/pois/search", response_model=List[schemas.PointOfInterest], summary="Admin search for POIs by text")
def search_pois_admin_endpoint(
    q: str = Query(..., min_length=3, description="Search query string"),
    db: Session = Depends(get_db),
    current_user = Depends(require_admin_or_editor())
):
    # Admin search - include drafts
    return crud.search_pois(db=db, query_str=q, include_drafts=True)

@router.get("/pois/search-by-location", response_model=List[schemas.PointOfInterest], summary="Search for POIs by location text")
def search_pois_by_location_endpoint(q: str = Query(..., min_length=3, description="Search location string"), db: Session = Depends(get_db)):
    # Public search - only published POIs
    return crud.search_pois_by_location(db=db, location_str=q, include_drafts=False)


@router.get("/pois/{poi_id}", response_model=schemas.PointOfInterest)
def read_poi(poi_id: uuid.UUID, db: Session = Depends(get_db)):
    db_poi = crud.get_poi(db, poi_id=poi_id)
    if db_poi is None:
        raise HTTPException(status_code=404, detail="Point of Interest not found")
    return db_poi


@router.get("/pois/{poi_id}/nearby", response_model=List[schemas.PointOfInterest], summary="Find nearby POIs")
def get_nearby_pois_endpoint(
    poi_id: uuid.UUID,
    distance_km: float = Query(5.0, description="Search radius in kilometers"),
    limit: int = Query(12, description="Maximum number of results to return"),
    db: Session = Depends(get_db)
):
    # Public endpoint - only show published nearby POIs
    return crud.get_pois_nearby(db=db, poi_id=poi_id, distance_km=distance_km, limit=limit, include_drafts=False)


@router.put("/pois/{poi_id}", response_model=schemas.PointOfInterest)
def update_poi(
    poi_id: uuid.UUID,
    poi_in: schemas.PointOfInterestUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin_or_editor())
):
    db_poi = crud.get_poi(db, poi_id=poi_id)
    if not db_poi:
        raise HTTPException(status_code=404, detail="Point of Interest not found")
    
    updated_poi = crud.update_poi(db=db, db_obj=db_poi, obj_in=poi_in)
    return updated_poi


@router.delete("/pois/{poi_id}", response_model=schemas.PointOfInterest)
def delete_poi(
    poi_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin_or_editor())
):
    db_poi = crud.delete_poi(db, poi_id=poi_id)
    if db_poi is None:
        raise HTTPException(status_code=404, detail="Point of Interest not found")
    return db_poi


@router.get("/pois/venues/list", response_model=List[schemas.PointOfInterest])
def get_available_venues(
    skip: int = 0,
    limit: int = 500,
    search: str = Query(None, description="Search query for venue names"),
    db: Session = Depends(get_db),
    current_user = Depends(require_admin_or_editor())
):
    """
    Get all POIs that can be used as venues (BUSINESS and PARK types).
    Used for venue selection when creating events.
    """
    from app.models.poi import PointOfInterest, POIType

    query = db.query(PointOfInterest).filter(
        PointOfInterest.poi_type.in_([POIType.BUSINESS, POIType.PARK])
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(PointOfInterest.name.ilike(search_term))

    return query.order_by(PointOfInterest.name).offset(skip).limit(limit).all()


@router.get("/pois/{poi_id}/venue-data", response_model=schemas.VenueDataForEvent)
def get_venue_data_for_event(
    poi_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin_or_editor())
):
    """
    Get venue data that can be copied to an event.
    Only works for BUSINESS and PARK POI types.
    Returns address, contact, parking, accessibility, restroom info, hours, amenities, and photos.
    """
    from app.models.image import Image, ImageType
    from app.services.image_service import image_service
    from geoalchemy2.shape import to_shape

    db_poi = crud.get_poi(db, poi_id=poi_id)
    if db_poi is None:
        raise HTTPException(status_code=404, detail="POI not found")

    # Validate POI type - only BUSINESS and PARK can be venues
    poi_type = db_poi.poi_type.value if hasattr(db_poi.poi_type, 'value') else str(db_poi.poi_type)
    if poi_type not in ['BUSINESS', 'PARK']:
        raise HTTPException(
            status_code=400,
            detail=f"POI type '{poi_type}' cannot be used as a venue. Only BUSINESS and PARK are valid."
        )

    # Get copyable images (entry, parking, restroom)
    copyable_image_types = [ImageType.entry, ImageType.parking, ImageType.restroom]
    images = db.query(Image).filter(
        Image.poi_id == poi_id,
        Image.image_type.in_(copyable_image_types),
        Image.parent_image_id.is_(None)  # Only original images, not variants
    ).order_by(Image.image_type, Image.display_order).all()

    copyable_images = []
    for img in images:
        urls = image_service.get_image_urls(img)
        copyable_images.append({
            "id": str(img.id),
            "image_type": img.image_type.value,
            "filename": img.filename,
            "url": urls.get("url"),
            "thumbnail_url": urls.get("thumbnail_url")
        })

    # Build location geometry
    location = None
    if db_poi.location:
        point = to_shape(db_poi.location)
        coords = list(point.coords)[0]
        location = {"type": "Point", "coordinates": [coords[0], coords[1]]}

    return schemas.VenueDataForEvent(
        venue_id=db_poi.id,
        venue_name=db_poi.name,
        venue_type=poi_type,
        address_full=db_poi.address_full,
        address_street=db_poi.address_street,
        address_city=db_poi.address_city,
        address_state=db_poi.address_state,
        address_zip=db_poi.address_zip,
        address_county=db_poi.address_county,
        location=location,
        front_door_latitude=float(db_poi.front_door_latitude) if db_poi.front_door_latitude else None,
        front_door_longitude=float(db_poi.front_door_longitude) if db_poi.front_door_longitude else None,
        phone_number=db_poi.phone_number,
        email=db_poi.email,
        website_url=db_poi.website_url,
        parking_types=db_poi.parking_types,
        parking_notes=db_poi.parking_notes,
        parking_locations=db_poi.parking_locations,
        expect_to_pay_parking=db_poi.expect_to_pay_parking,
        public_transit_info=db_poi.public_transit_info,
        wheelchair_accessible=db_poi.wheelchair_accessible,
        wheelchair_details=db_poi.wheelchair_details,
        public_toilets=db_poi.public_toilets,
        toilet_description=db_poi.toilet_description,
        toilet_locations=db_poi.toilet_locations,
        hours=db_poi.hours,
        amenities=db_poi.amenities,
        copyable_images=copyable_images
    )