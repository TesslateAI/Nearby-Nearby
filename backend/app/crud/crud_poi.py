from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, func
from fastapi import HTTPException
import uuid
from typing import Dict, Any

from app import models, schemas
from app.crud.crud_category import get_category
from geoalchemy2.types import Geography


def get_poi(db: Session, poi_id: uuid.UUID):
    return db.query(models.PointOfInterest).options(
        joinedload(models.PointOfInterest.business),
        joinedload(models.PointOfInterest.park),
        joinedload(models.PointOfInterest.trail),
        joinedload(models.PointOfInterest.event),
        joinedload(models.PointOfInterest.categories),
        joinedload(models.PointOfInterest.main_category)
    ).filter(models.PointOfInterest.id == poi_id).first()


def get_pois(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.PointOfInterest).order_by(
        models.PointOfInterest.last_updated.desc()
    ).offset(skip).limit(limit).all()


def get_poi_by_slug(db: Session, slug: str):
    return db.query(models.PointOfInterest).filter(models.PointOfInterest.slug == slug).first()


def search_pois(db: Session, query_str: str):
    search = f"%{query_str}%"
    return db.query(models.PointOfInterest).filter(
        or_(
            models.PointOfInterest.name.ilike(search),
            models.PointOfInterest.description_long.ilike(search),
            models.PointOfInterest.description_short.ilike(search)
        )
    ).limit(20).all()


def search_pois_by_location(db: Session, location_str: str, limit: int = 8):
    """
    A simplified location search. It finds a POI that matches the location string
    and then finds other POIs near that one.
    """
    search = f"%{location_str}%"
    # Find a POI that matches the text query
    first_match_poi = db.query(models.PointOfInterest).filter(
        or_(
            models.PointOfInterest.address_city.ilike(search),
            models.PointOfInterest.address_street.ilike(search),
            models.PointOfInterest.address_zip.ilike(search)
        )
    ).first()

    if not first_match_poi:
        return []

    # Now find POIs near this location's coordinates
    distance_meters = 20000  # 20km radius for a general area search
    
    nearby_pois = db.query(models.PointOfInterest).filter(
        func.ST_DWithin(
            models.PointOfInterest.location,
            first_match_poi.location,
            distance_meters,
            use_spheroid=False  # Use faster box comparison for broad search
        )
    ).limit(limit).all()
    
    return nearby_pois


def get_pois_nearby(db: Session, *, poi_id: uuid.UUID, distance_km: float = 5.0, limit: int = 12):
    origin_poi = get_poi(db, poi_id)
    if not origin_poi:
        raise HTTPException(status_code=404, detail="Origin POI not found.")

    origin_point = origin_poi.location
    distance_meters = distance_km * 1000

    nearby_pois = db.query(models.PointOfInterest).filter(
        func.ST_DWithin(
            origin_point,
            models.PointOfInterest.location,
            distance_meters,
            use_spheroid=True
        )
    ).filter(
        models.PointOfInterest.id != origin_poi.id
    ).limit(limit).all()

    return nearby_pois


def create_poi(db: Session, poi: schemas.PointOfInterestCreate):
    # Create the POI with location
    poi_data = poi.model_dump(exclude={'location', 'business', 'park', 'trail', 'event', 'category_ids', 'main_category_id'})
    db_poi = models.PointOfInterest(**poi_data)
    
    # Set the location geometry
    db_poi.location = f'POINT({poi.location.coordinates[0]} {poi.location.coordinates[1]})'

    # Set main category
    if poi.main_category_id:
        main_category = get_category(db, poi.main_category_id)
        if main_category and main_category.is_main_category:
            db_poi.main_category_id = poi.main_category_id
        else:
            raise HTTPException(status_code=400, detail="Invalid main category")

    # Add categories
    if poi.category_ids:
        for cat_id in poi.category_ids:
            category = get_category(db, cat_id)
            if category:
                db_poi.categories.append(category)

    # Create subtype based on poi_type
    if poi.poi_type == 'BUSINESS' and poi.business:
        db_poi.business = models.Business(**poi.business.model_dump())
    elif poi.poi_type == 'PARK' and poi.park:
        db_poi.park = models.Park(**poi.park.model_dump())
    elif poi.poi_type == 'TRAIL' and poi.trail:
        db_poi.trail = models.Trail(**poi.trail.model_dump())
    elif poi.poi_type == 'EVENT' and poi.event:
        db_poi.event = models.Event(**poi.event.model_dump())

    try:
        db.add(db_poi)
        db.commit()
        db.refresh(db_poi)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {e.orig}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

    return db_poi


def update_poi(db: Session, *, db_obj: models.PointOfInterest, obj_in: schemas.PointOfInterestUpdate) -> models.PointOfInterest:
    update_data = obj_in.model_dump(exclude_unset=True)

    # Handle location update
    if 'location' in update_data:
        location_data = update_data.pop('location')
        # Accept both dict and object with coordinates
        if isinstance(location_data, dict):
            coords = location_data.get('coordinates')
        else:
            coords = location_data.coordinates
        db_obj.location = f'POINT({coords[0]} {coords[1]})'
    
    # Handle subtype updates
    if 'business' in update_data and db_obj.poi_type == 'BUSINESS':
        business_data = update_data.pop('business')
        if db_obj.business:
            for key, value in business_data.items():
                setattr(db_obj.business, key, value)
        else:
            db_obj.business = models.Business(**business_data)

    if 'park' in update_data and db_obj.poi_type == 'PARK':
        park_data = update_data.pop('park')
        if db_obj.park:
            for key, value in park_data.items():
                setattr(db_obj.park, key, value)
        else:
            db_obj.park = models.Park(**park_data)

    if 'trail' in update_data and db_obj.poi_type == 'TRAIL':
        trail_data = update_data.pop('trail')
        if db_obj.trail:
            for key, value in trail_data.items():
                setattr(db_obj.trail, key, value)
        else:
            db_obj.trail = models.Trail(**trail_data)

    if 'event' in update_data and db_obj.poi_type == 'EVENT':
        event_data = update_data.pop('event')
        if db_obj.event:
            for key, value in event_data.items():
                setattr(db_obj.event, key, value)
        else:
            db_obj.event = models.Event(**event_data)

    # Handle main category update
    if 'main_category_id' in update_data:
        main_category_id = update_data.pop('main_category_id')
        if main_category_id:
            main_category = get_category(db, main_category_id)
            if main_category and main_category.is_main_category:
                db_obj.main_category_id = main_category_id
            else:
                raise HTTPException(status_code=400, detail="Invalid main category")
        else:
            db_obj.main_category_id = None

    # Handle category updates
    if 'category_ids' in update_data:
        category_ids = update_data.pop('category_ids')
        db_obj.categories.clear()
        for cat_id in category_ids:
            category = get_category(db, cat_id)
            if category:
                db_obj.categories.append(category)
        db.flush()

    # Update remaining fields
    for field, value in update_data.items():
        # For relationship fields, ensure we assign model instances, not dicts
        if field == "event" and db_obj.poi_type == "EVENT":
            if isinstance(value, dict):
                if db_obj.event:
                    for k, v in value.items():
                        setattr(db_obj.event, k, v)
                else:
                    db_obj.event = models.Event(**value)
            else:
                db_obj.event = value
        elif field == "business" and db_obj.poi_type == "BUSINESS":
            if isinstance(value, dict):
                if db_obj.business:
                    for k, v in value.items():
                        setattr(db_obj.business, k, v)
                else:
                    db_obj.business = models.Business(**value)
            else:
                db_obj.business = value
        elif field == "park" and db_obj.poi_type == "PARK":
            if isinstance(value, dict):
                if db_obj.park:
                    for k, v in value.items():
                        setattr(db_obj.park, k, v)
                else:
                    db_obj.park = models.Park(**value)
            else:
                db_obj.park = value
        elif field == "trail" and db_obj.poi_type == "TRAIL":
            if isinstance(value, dict):
                if db_obj.trail:
                    for k, v in value.items():
                        setattr(db_obj.trail, k, v)
                else:
                    db_obj.trail = models.Trail(**value)
            else:
                db_obj.trail = value
        else:
            setattr(db_obj, field, value)

    try:
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred during update: {e}")

    return db_obj


def delete_poi(db: Session, poi_id: uuid.UUID):
    db_poi = get_poi(db, poi_id)
    if db_poi:
        # First, delete all relationships that reference this POI
        from app.models.poi import POIRelationship
        relationships_to_delete = db.query(POIRelationship).filter(
            or_(
                POIRelationship.source_poi_id == poi_id,
                POIRelationship.target_poi_id == poi_id
            )
        ).all()
        
        for relationship in relationships_to_delete:
            db.delete(relationship)
        
        # Now delete the POI
        db.delete(db_poi)
        db.commit()
    return db_poi


def create_poi_relationship(db: Session, source_poi_id: uuid.UUID, target_poi_id: uuid.UUID, relationship_type: str):
    """Create a relationship between two POIs"""
    relationship = models.POIRelationship(
        source_poi_id=source_poi_id,
        target_poi_id=target_poi_id,
        relationship_type=relationship_type
    )
    db.add(relationship)
    db.commit()
    return relationship


def get_poi_relationships(db: Session, poi_id: uuid.UUID):
    """Get all relationships for a POI"""
    return db.query(models.POIRelationship).filter(
        or_(
            models.POIRelationship.source_poi_id == poi_id,
            models.POIRelationship.target_poi_id == poi_id
        )
    ).all()