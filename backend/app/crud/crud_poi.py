from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
import uuid

# Changed this import to be more explicit
from app import models, schemas

def get_poi(db: Session, poi_id: uuid.UUID):
    return db.query(models.PointOfInterest).options(
        joinedload(models.PointOfInterest.location),
        joinedload(models.PointOfInterest.business),
        joinedload(models.PointOfInterest.outdoors),
        joinedload(models.PointOfInterest.event)
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
    poi_data = poi.model_dump(exclude={'location', 'business', 'outdoors', 'event'})
    db_poi = models.PointOfInterest(**poi_data)
    db_poi.location = db_location

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

def delete_poi(db: Session, poi_id: uuid.UUID):
    db_poi = get_poi(db, poi_id)
    if not db_poi:
        return None
    db.delete(db_poi)
    db.commit()
    return db_poi