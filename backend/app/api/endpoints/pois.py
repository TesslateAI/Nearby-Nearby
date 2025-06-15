from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

# The __init__.py files now allow these cleaner imports
from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/pois/", response_model=schemas.PointOfInterest, status_code=201)
def create_poi(poi: schemas.PointOfInterestCreate, db: Session = Depends(get_db)):
    # Simple check to ensure subtype data matches poi_type
    if poi.poi_type == 'business' and not poi.business:
        raise HTTPException(status_code=400, detail="Business data required for poi_type 'business'")
    if poi.poi_type == 'outdoors' and not poi.outdoors:
        raise HTTPException(status_code=400, detail="Outdoors data required for poi_type 'outdoors'")
    if poi.poi_type == 'event' and not poi.event:
        raise HTTPException(status_code=400, detail="Event data required for poi_type 'event'")

    # Notice the call is now simpler: crud.create_poi instead of crud.crud_poi.create_poi
    return crud.create_poi(db=db, poi=poi)


@router.get("/pois/", response_model=List[schemas.PointOfInterest])
def read_pois(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    pois = crud.get_pois(db, skip=skip, limit=limit)
    return pois


@router.get("/pois/{poi_id}", response_model=schemas.PointOfInterest)
def read_poi(poi_id: uuid.UUID, db: Session = Depends(get_db)):
    db_poi = crud.get_poi(db, poi_id=poi_id)
    if db_poi is None:
        raise HTTPException(status_code=404, detail="Point of Interest not found")
    return db_poi

@router.put("/pois/{poi_id}", response_model=schemas.PointOfInterest)
def update_poi(poi_id: uuid.UUID, poi_in: schemas.PointOfInterestUpdate, db: Session = Depends(get_db)):
    db_poi = crud.get_poi(db, poi_id=poi_id)
    if not db_poi:
        raise HTTPException(status_code=404, detail="Point of Interest not found")
    
    updated_poi = crud.update_poi(db=db, db_obj=db_poi, obj_in=poi_in)
    return updated_poi


@router.delete("/pois/{poi_id}", response_model=schemas.PointOfInterest)
def delete_poi(poi_id: uuid.UUID, db: Session = Depends(get_db)):
    db_poi = crud.delete_poi(db, poi_id=poi_id)
    if db_poi is None:
        raise HTTPException(status_code=404, detail="Point of Interest not found")
    return db_poi