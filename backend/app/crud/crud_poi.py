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
        joinedload(models.PointOfInterest.location),
        joinedload(models.PointOfInterest.business),
        joinedload(models.PointOfInterest.outdoors),
        joinedload(models.PointOfInterest.event),
        joinedload(models.PointOfInterest.categories)
    ).filter(models.PointOfInterest.id == poi_id).first()

def get_pois(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.PointOfInterest).options(
        joinedload(models.PointOfInterest.location)
    ).order_by(models.PointOfInterest.updated_at.desc()).offset(skip).limit(limit).all()

def get_poi_by_slug(db: Session, slug: str):
    return db.query(models.PointOfInterest).filter(models.PointOfInterest.slug == slug).first()

def search_pois(db: Session, query_str: str):
    search = f"%{query_str}%"
    return db.query(models.PointOfInterest).filter(
        or_(
            models.PointOfInterest.name.ilike(search),
            models.PointOfInterest.description.ilike(search)
        )
    ).options(joinedload(models.PointOfInterest.location)).limit(20).all()

def search_pois_by_location(db: Session, location_str: str, limit: int = 8):
    """
    A simplified location search. It finds a POI that matches the location string
    and then finds other POIs near that one.
    """
    search = f"%{location_str}%"
    # Find a location that matches the text query
    first_match_location = db.query(models.Location).filter(
        or_(
            models.Location.city.ilike(search),
            models.Location.address_line1.ilike(search),
            models.Location.postal_code.ilike(search)
        )
    ).first()

    if not first_match_location:
        return []

    # Now find POIs near this location's coordinates
    distance_meters = 20000 # 20km radius for a general area search
    
    nearby_pois = db.query(models.PointOfInterest).join(models.Location).filter(
        func.ST_DWithin(
            models.Location.coordinates,
            first_match_location.coordinates,
            distance_meters,
            use_spheroid=False # Use faster box comparison for broad search
        )
    ).options(joinedload(models.PointOfInterest.location)).limit(limit).all()
    
    return nearby_pois


def get_pois_nearby(db: Session, *, poi_id: uuid.UUID, distance_km: float = 5.0, limit: int = 12):
    origin_poi = get_poi(db, poi_id)
    if not origin_poi or not origin_poi.location:
        raise HTTPException(status_code=404, detail="Origin POI not found or has no location.")

    origin_point = origin_poi.location.coordinates
    distance_meters = distance_km * 1000

    nearby_pois = db.query(models.PointOfInterest).join(models.Location).filter(
        func.ST_DWithin(
            origin_point,
            models.Location.coordinates,
            distance_meters,
            use_spheroid=True
        )
    ).filter(
        models.PointOfInterest.id != origin_poi.id
    ).options(joinedload(models.PointOfInterest.location)).limit(limit).all()

    return nearby_pois


def create_poi(db: Session, poi: schemas.PointOfInterestCreate):
    if get_poi_by_slug(db, poi.slug):
        raise HTTPException(status_code=400, detail=f"POI with slug '{poi.slug}' already exists.")

    db_location = models.Location(**poi.location.model_dump())
    db_location.coordinates = f'POINT({poi.location.coordinates.coordinates[0]} {poi.location.coordinates.coordinates[1]})'
    
    poi_data = poi.model_dump(exclude={'location', 'business', 'outdoors', 'event', 'category_ids'})
    db_poi = models.PointOfInterest(**poi_data)
    db_poi.location = db_location

    if poi.category_ids:
        for cat_id in poi.category_ids:
            category = get_category(db, cat_id)
            if category: db_poi.categories.append(category)

    if poi.poi_type == 'business' and poi.business:
        db_poi.business = models.Business(**poi.business.model_dump())
    elif poi.poi_type == 'outdoors' and poi.outdoors:
        db_poi.outdoors = models.Outdoors(**poi.outdoors.model_dump())
    elif poi.poi_type == 'event' and poi.event:
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

    if 'location' in update_data:
        location_data = update_data.pop('location')
        if db_obj.location:
            for key, value in location_data.items():
                if key == 'coordinates' and value:
                    setattr(db_obj.location, key, f'POINT({value["coordinates"][0]} {value["coordinates"][1]})')
                else:
                    setattr(db_obj.location, key, value)
    
    if 'business' in update_data and db_obj.poi_type == 'business':
        business_data = update_data.pop('business')
        if db_obj.business:
            for key, value in business_data.items():
                setattr(db_obj.business, key, value)

    if 'outdoors' in update_data and db_obj.poi_type == 'outdoors':
        outdoors_data = update_data.pop('outdoors')
        if db_obj.outdoors:
            for key, value in outdoors_data.items():
                setattr(db_obj.outdoors, key, value)

    if 'category_ids' in update_data:
        category_ids = update_data.pop('category_ids')
        db_obj.categories.clear()
        for cat_id in category_ids:
            category = get_category(db, cat_id)
            if category: db_obj.categories.append(category)
        db.flush()

    for field, value in update_data.items():
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
    if not db_poi:
        return None
    db.delete(db_poi)
    db.commit()
    return db_poi