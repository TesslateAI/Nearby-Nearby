# app/api/endpoints/pois.py
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid
from ... import schemas, crud, models
from ...database import get_db
from ...schemas.poi import PointGeometry
from ...models.image import Image

router = APIRouter()


def get_poi_images(db: Session, poi_id: uuid.UUID) -> List[dict]:
    """Get all images for a POI, returning only original images (not variants)"""
    # Get original images
    images = db.query(Image).filter(
        Image.poi_id == poi_id,
        Image.parent_image_id.is_(None)  # Only original images, not variants
    ).order_by(Image.display_order).all()

    result = []
    for img in images:
        if not img.storage_url:
            continue

        # Try to find thumbnail variant
        thumbnail_url = None
        thumbnail = db.query(Image).filter(
            Image.parent_image_id == img.id,
            Image.image_size_variant == 'thumbnail'
        ).first()
        if thumbnail and thumbnail.storage_url:
            thumbnail_url = thumbnail.storage_url

        result.append({
            'id': str(img.id),
            'url': img.storage_url,
            'thumbnail_url': thumbnail_url,
            'type': img.image_type.value if hasattr(img.image_type, 'value') else img.image_type,
            'alt_text': img.alt_text,
            'caption': img.caption,
            'width': img.width,
            'height': img.height
        })

    return result

@router.get("/pois/search", response_model=List[schemas.poi.POISearchResult])
def api_search_pois(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    pois = crud.crud_poi.search_pois(db, query=q)
    return pois

@router.get("/pois/semantic-search", response_model=List[schemas.poi.POISearchResult])
def api_semantic_search_pois(
    request: Request,
    q: str = Query(..., min_length=1, description="Natural language search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return"),
    db: Session = Depends(get_db)
):
    """
    Semantic search for POIs using natural language queries.

    Examples:
    - "dog friendly cafe with wifi"
    - "romantic dinner spot"
    - "outdoor activities for kids"
    - "rainy day indoor fun"

    Returns POIs ranked by semantic similarity to the query.
    """
    embedding_model = getattr(request.app.state, 'embedding_model', None)
    pois = crud.crud_poi.semantic_search_pois(db, query=q, limit=limit, model=embedding_model)
    return pois

@router.get("/pois/hybrid-search", response_model=List[schemas.poi.POISearchResult])
def api_hybrid_search_pois(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return"),
    keyword_weight: float = Query(0.3, ge=0, le=1, description="Weight for keyword search (0-1)"),
    semantic_weight: float = Query(0.7, ge=0, le=1, description="Weight for semantic search (0-1)"),
    db: Session = Depends(get_db)
):
    """
    Hybrid search combining keyword matching and semantic understanding.

    Combines traditional keyword search (finds exact matches) with semantic search
    (understands meaning) for best of both worlds.

    Default weights: 30% keyword, 70% semantic
    """
    embedding_model = getattr(request.app.state, 'embedding_model', None)
    pois = crud.crud_poi.hybrid_search_pois(
        db,
        query=q,
        limit=limit,
        keyword_weight=keyword_weight,
        semantic_weight=semantic_weight,
        model=embedding_model
    )
    return pois

@router.get("/pois/{poi_id}", response_model=schemas.poi.POIDetail)
def api_get_poi(poi_id: uuid.UUID, db: Session = Depends(get_db)):
    db_poi = crud.crud_poi.get_poi(db, poi_id=str(poi_id))
    if db_poi is None:
        raise HTTPException(status_code=404, detail="Point of Interest not found")

    # Convert the POI model to a dict and handle special fields
    poi_dict = {
        column.name: getattr(db_poi, column.name)
        for column in db_poi.__table__.columns
    }

    # Convert geometry field
    poi_dict['location'] = PointGeometry.from_wkb(db_poi.location)

    # Convert poi_type enum if needed
    if hasattr(db_poi.poi_type, 'value'):
        poi_dict['poi_type'] = db_poi.poi_type.value

    # Add relationships
    poi_dict['business'] = db_poi.business
    poi_dict['park'] = db_poi.park
    poi_dict['trail'] = db_poi.trail
    poi_dict['event'] = db_poi.event
    poi_dict['categories'] = db_poi.categories

    # Add images from images table (S3 URLs)
    poi_dict['images'] = get_poi_images(db, poi_id)

    return schemas.poi.POIDetail.model_validate(poi_dict)

@router.get("/pois/by-slug/{slug}", response_model=schemas.poi.POIDetail)
def api_get_poi_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Get POI by slug for SEO-friendly URLs
    Example: /api/pois/by-slug/best-coffee-shop-downtown
    """
    db_poi = db.query(models.poi.PointOfInterest).filter(
        models.poi.PointOfInterest.slug == slug,
        models.poi.PointOfInterest.publication_status == 'published'
    ).first()

    if db_poi is None:
        raise HTTPException(status_code=404, detail="Point of Interest not found")

    # Convert the POI model to a dict and handle special fields
    poi_dict = {
        column.name: getattr(db_poi, column.name)
        for column in db_poi.__table__.columns
    }

    # Convert geometry field
    poi_dict['location'] = PointGeometry.from_wkb(db_poi.location)

    # Convert poi_type enum if needed
    if hasattr(db_poi.poi_type, 'value'):
        poi_dict['poi_type'] = db_poi.poi_type.value

    # Add relationships
    poi_dict['business'] = db_poi.business
    poi_dict['park'] = db_poi.park
    poi_dict['trail'] = db_poi.trail
    poi_dict['event'] = db_poi.event
    poi_dict['categories'] = db_poi.categories

    # Add images from images table (S3 URLs)
    poi_dict['images'] = get_poi_images(db, db_poi.id)

    return schemas.poi.POIDetail.model_validate(poi_dict)

@router.get("/nearby", response_model=List[schemas.poi.POINearbyResult])
def api_get_nearby_pois(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    db: Session = Depends(get_db)
):
    from sqlalchemy import literal_column

    # Use geography type for accurate distance in meters
    distance_expr = literal_column(
        f"ST_Distance(location::geography, ST_MakePoint({longitude}, {latitude})::geography)"
    )

    # Find the 8 nearest published POIs
    nearby_pois_with_distance = db.query(
        models.poi.PointOfInterest,
        distance_expr.label('distance_meters')
    ).filter(
        models.poi.PointOfInterest.publication_status == 'published'
    ).order_by('distance_meters').limit(8).all()

    # Format results with distance
    results = []
    for poi, distance in nearby_pois_with_distance:
        poi_dict = {
            'id': poi.id,
            'name': poi.name,
            'address_city': poi.address_city,
            'distance_meters': distance,
            'location': PointGeometry.from_wkb(poi.location) if poi.location else None,
            'poi_type': poi.poi_type.value if hasattr(poi.poi_type, 'value') else poi.poi_type,
            'hours': poi.hours,
            'wheelchair_accessible': poi.wheelchair_accessible,
            'wifi_options': poi.wifi_options,
            'pet_options': poi.pet_options,
        }
        results.append(schemas.poi.POINearbyResult.model_validate(poi_dict))

    return results

@router.get("/pois/{poi_id}/nearby", response_model=List[schemas.poi.POINearbyResult])
def api_get_nearby_pois_by_id(
    poi_id: uuid.UUID,
    radius_miles: float = Query(5.0, description="Search radius in miles"),
    db: Session = Depends(get_db)
):
    nearby_pois = crud.crud_poi.get_nearby_pois(db, poi_id=str(poi_id), radius_miles=radius_miles)

    # Convert location data for each POI
    results = []
    for poi in nearby_pois:
        # Get categories for this POI
        categories_data = []
        if hasattr(poi, 'categories') and poi.categories:
            for cat in poi.categories:
                categories_data.append({
                    'id': str(cat.id),
                    'name': cat.name,
                    'slug': cat.slug
                })

        poi_dict = {
            'id': poi.id,
            'name': poi.name,
            'address_city': poi.address_city,
            'distance_meters': poi.distance_meters,
            'location': PointGeometry.from_wkb(poi.location) if poi.location else None,
            'poi_type': poi.poi_type.value if hasattr(poi.poi_type, 'value') else poi.poi_type,
            'hours': poi.hours,
            'wheelchair_accessible': poi.wheelchair_accessible,
            'wifi_options': poi.wifi_options,
            'pet_options': poi.pet_options,
            'categories': categories_data
        }
        results.append(schemas.poi.POINearbyResult.model_validate(poi_dict))

    return results

@router.get("/categories")
def api_get_categories(db: Session = Depends(get_db)):
    """Get all active categories with POI counts"""
    # Get all active main categories (parent categories only)
    categories = db.query(models.poi.Category).filter(
        models.poi.Category.is_active == True,
        models.poi.Category.parent_id == None
    ).order_by(models.poi.Category.sort_order, models.poi.Category.name).all()

    result = []
    for cat in categories:
        # Count published POIs for this category
        poi_count = db.query(models.poi.PointOfInterest).join(
            models.poi.poi_category_association
        ).filter(
            models.poi.poi_category_association.c.category_id == cat.id,
            models.poi.PointOfInterest.publication_status == 'published'
        ).count()

        category_data = {
            'id': str(cat.id),
            'name': cat.name,
            'slug': cat.slug,
            'poi_count': poi_count,
            'is_main_category': cat.parent_id is None,
            'sort_order': cat.sort_order
        }
        result.append(category_data)

    return result

@router.get("/pois/by-category/{category_slug}")
def api_get_pois_by_category(category_slug: str, db: Session = Depends(get_db)):
    """Get all POIs for a specific category"""
    # Find the category by slug
    category = db.query(models.poi.Category).filter(
        models.poi.Category.slug == category_slug,
        models.poi.Category.is_active == True
    ).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Get all published POIs for this category
    pois = db.query(models.poi.PointOfInterest).join(
        models.poi.poi_category_association
    ).filter(
        models.poi.poi_category_association.c.category_id == category.id,
        models.poi.PointOfInterest.publication_status == 'published'
    ).all()

    # Format results
    results = []
    for poi in pois:
        poi_dict = {
            'id': poi.id,
            'name': poi.name,
            'poi_type': poi.poi_type.value if hasattr(poi.poi_type, 'value') else poi.poi_type,
            'address_city': poi.address_city,
            'address_street': poi.address_street,
            'description_short': poi.description_short,
            'location': PointGeometry.from_wkb(poi.location) if poi.location else None,
            'hours': poi.hours,
            'wheelchair_accessible': poi.wheelchair_accessible,
        }

        # Add event-specific data if it's an event
        if poi.event:
            poi_dict['event'] = {
                'start_date': poi.event.start_date.isoformat() if poi.event.start_date else None,
                'end_date': poi.event.end_date.isoformat() if poi.event.end_date else None,
                'start_time': poi.event.start_time,
                'end_time': poi.event.end_time,
                'is_recurring': poi.event.is_recurring,
                'status': poi.event.status
            }

        results.append(poi_dict)

    return {
        'category': {
            'id': str(category.id),
            'name': category.name,
            'slug': category.slug
        },
        'pois': results
    }

@router.get("/pois/by-type/{poi_type}")
def api_get_pois_by_type(poi_type: str, db: Session = Depends(get_db)):
    """Get all POIs for a specific type (BUSINESS, PARK, TRAIL, EVENT)"""
    # Validate poi_type
    valid_types = ['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
    if poi_type.upper() not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid POI type")

    # Get all published POIs for this type
    pois = db.query(models.poi.PointOfInterest).filter(
        models.poi.PointOfInterest.poi_type == poi_type.upper(),
        models.poi.PointOfInterest.publication_status == 'published'
    ).all()

    # Format results
    results = []
    for poi in pois:
        poi_dict = {
            'id': poi.id,
            'name': poi.name,
            'poi_type': poi.poi_type.value if hasattr(poi.poi_type, 'value') else poi.poi_type,
            'address_city': poi.address_city,
            'address_street': poi.address_street,
            'description_short': poi.description_short,
            'location': PointGeometry.from_wkb(poi.location) if poi.location else None,
        }
        results.append(poi_dict)

    return results