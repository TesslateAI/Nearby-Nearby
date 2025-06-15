from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
import uuid
from typing import Dict, Any

# Changed this import to be more explicit
from app import models, schemas
# FIX: Import the specific function needed to avoid circular dependencies
from app.crud.crud_category import get_category

def get_poi(db: Session, poi_id: uuid.UUID):
    return db.query(models.PointOfInterest).options(
        joinedload(models.PointOfInterest.location),
        joinedload(models.PointOfInterest.business),
        joinedload(models.PointOfInterest.outdoors),
        joinedload(models.PointOfInterest.event),
        joinedload(models.PointOfInterest.categories) # Eager load categories
    ).filter(models.PointOfInterest.id == poi_id).first()

def get_pois(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.PointOfInterest).options(
        joinedload(models.PointOfInterest.location)
    ).offset(skip).limit(limit).all()

def get_poi_by_slug(db: Session, slug: str):
    return db.query(models.PointOfInterest).filter(models.PointOfInterest.slug == slug).first()

def create_poi(db: Session, poi: schemas.PointOfInterestCreate):
    # Check if slug already exists
    if get_poi_by_slug(db, poi.slug):
        raise HTTPException(status_code=400, detail=f"POI with slug '{poi.slug}' already exists.")

    # Create Location
    db_location = models.Location(**poi.location.model_dump())
    # GeoAlchemy2 expects WKT format for point
    db_location.coordinates = f'POINT({poi.location.coordinates.coordinates[0]} {poi.location.coordinates.coordinates[1]})'
    
    # Create base POI
    poi_data = poi.model_dump(exclude={'location', 'business', 'outdoors', 'event', 'category_ids'}) # Exclude category_ids
    db_poi = models.PointOfInterest(**poi_data)
    db_poi.location = db_location

    # Handle categories
    if poi.category_ids:
        for cat_id in poi.category_ids:
            # Use the directly imported function
            category = get_category(db, cat_id)
            if category:
                db_poi.categories.append(category)

    # Create subtype based on poi_type
    if poi.poi_type == 'business' and poi.business:
        db_business = models.Business(**poi.business.model_dump())
        db_poi.business = db_business
    elif poi.poi_type == 'outdoors' and poi.outdoors:
        db_outdoors = models.Outdoors(**poi.outdoors.model_dump())
        db_poi.outdoors = db_outdoors
    elif poi.poi_type == 'event' and poi.event:
        db_event = models.Event(**poi.event.model_dump())
        db_poi.event = db_event

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
    # Use exclude_unset=True to only update provided fields
    update_data = obj_in.model_dump(exclude_unset=True)

    # Handle nested Location updates
    if 'location' in update_data:
        location_data = update_data.pop('location')
        if db_obj.location:
            for key, value in location_data.items():
                # Handle special case for coordinates
                if key == 'coordinates' and value:
                    wkt_point = f'POINT({value["coordinates"][0]} {value["coordinates"][1]})'
                    setattr(db_obj.location, key, wkt_point)
                else:
                    setattr(db_obj.location, key, value)
    
    # Handle nested Business updates
    if 'business' in update_data and db_obj.poi_type == 'business':
        business_data = update_data.pop('business')
        if db_obj.business:
            for key, value in business_data.items():
                setattr(db_obj.business, key, value)
    
    # Handle other nested types (outdoors, event) similarly if needed
    
    # Handle category updates
    if 'category_ids' in update_data:
        category_ids = update_data.pop('category_ids')
        # Clear existing categories and add new ones
        db_obj.categories.clear()
        for cat_id in category_ids:
            category = get_category(db, cat_id)
            if category:
                db_obj.categories.append(category)
        # Flush to ensure the many-to-many relationship is updated before commit
        db.flush()

    # Update remaining fields on the main POI object
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