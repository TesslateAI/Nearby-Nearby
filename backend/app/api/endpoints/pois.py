from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import uuid

# The __init__.py files now allow these cleaner imports
from app import crud, schemas
from app.database import get_db
from app.core.security import get_current_user

router = APIRouter()

@router.post("/pois/", response_model=schemas.PointOfInterest, status_code=201)
def create_poi(
    poi: schemas.PointOfInterestCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    if poi.poi_type == 'BUSINESS' and not poi.business:
        raise HTTPException(status_code=400, detail="Business data required for poi_type 'BUSINESS'")
    if poi.poi_type == 'PARK' and not poi.park:
        raise HTTPException(status_code=400, detail="Park data required for poi_type 'PARK'")
    if poi.poi_type == 'TRAIL' and not poi.trail:
        raise HTTPException(status_code=400, detail="Trail data required for poi_type 'TRAIL'")
    if poi.poi_type == 'EVENT' and not poi.event:
        raise HTTPException(status_code=400, detail="Event data required for poi_type 'EVENT'")

    return crud.create_poi(db=db, poi=poi)


@router.get("/pois/", response_model=List[schemas.PointOfInterest])
def read_pois(
    skip: int = 0, 
    limit: int = 100, 
    search: str = Query(None, description="Search query for POI names"),
    db: Session = Depends(get_db)
):
    if search:
        return crud.search_pois(db=db, query_str=search)
    pois = crud.get_pois(db, skip=skip, limit=limit)
    return pois


@router.get("/pois/search", response_model=List[schemas.PointOfInterest], summary="Search for POIs by text")
def search_pois_endpoint(q: str = Query(..., min_length=3, description="Search query string"), db: Session = Depends(get_db)):
    return crud.search_pois(db=db, query_str=q)

@router.get("/pois/search-by-location", response_model=List[schemas.PointOfInterest], summary="Search for POIs by location text")
def search_pois_by_location_endpoint(q: str = Query(..., min_length=3, description="Search location string"), db: Session = Depends(get_db)):
    return crud.search_pois_by_location(db=db, location_str=q)


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
    return crud.get_pois_nearby(db=db, poi_id=poi_id, distance_km=distance_km, limit=limit)


@router.put("/pois/{poi_id}", response_model=schemas.PointOfInterest)
def update_poi(
    poi_id: uuid.UUID, 
    poi_in: schemas.PointOfInterestUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
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
    current_user: str = Depends(get_current_user)
):
    db_poi = crud.delete_poi(db, poi_id=poi_id)
    if db_poi is None:
        raise HTTPException(status_code=404, detail="Point of Interest not found")
    return db_poi