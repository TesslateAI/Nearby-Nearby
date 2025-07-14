from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app import crud, schemas
from app.database import get_db
from app.core.security import get_current_user

router = APIRouter()


@router.post("/attributes/", response_model=schemas.Attribute, status_code=201)
def create_attribute(
    attribute: schemas.AttributeCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return crud.create_attribute(db=db, attribute=attribute)


@router.get("/attributes/", response_model=List[schemas.Attribute])
def read_attributes(
    skip: int = 0, 
    limit: int = 100,
    attribute_type: Optional[str] = Query(None, description="Filter by attribute type"),
    applicable_to: Optional[str] = Query(None, description="Filter by applicable POI type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    attributes = crud.get_attributes(
        db, 
        skip=skip, 
        limit=limit,
        attribute_type=attribute_type,
        applicable_to=applicable_to,
        is_active=is_active
    )
    return attributes


@router.get("/attributes/by-type/{attribute_type}", response_model=List[schemas.Attribute])
def read_attributes_by_type(attribute_type: str, db: Session = Depends(get_db)):
    """Get all attributes of a specific type"""
    attributes = crud.get_attributes_by_type(db, attribute_type=attribute_type)
    return attributes


@router.get("/attributes/for-poi-type/{poi_type}", response_model=List[schemas.Attribute])
def read_attributes_for_poi_type(poi_type: str, db: Session = Depends(get_db)):
    """Get all attributes that apply to a specific POI type"""
    attributes = crud.get_attributes_for_poi_type(db, poi_type=poi_type)
    return attributes


@router.get("/attributes/hierarchy", response_model=List[schemas.Attribute])
def read_attribute_hierarchy(
    attribute_type: Optional[str] = Query(None, description="Filter by attribute type"),
    db: Session = Depends(get_db)
):
    """Get attributes organized in a hierarchy"""
    attributes = crud.get_attribute_hierarchy(db, attribute_type=attribute_type)
    return attributes


@router.get("/attributes/{attribute_id}", response_model=schemas.Attribute)
def read_attribute(attribute_id: uuid.UUID, db: Session = Depends(get_db)):
    db_attribute = crud.get_attribute(db, attribute_id=attribute_id)
    if db_attribute is None:
        raise HTTPException(status_code=404, detail="Attribute not found")
    return db_attribute


@router.put("/attributes/{attribute_id}", response_model=schemas.Attribute)
def update_attribute(
    attribute_id: uuid.UUID, 
    attribute_in: schemas.AttributeUpdate, 
    db: Session = Depends(get_db)
):
    db_attribute = crud.get_attribute(db, attribute_id=attribute_id)
    if not db_attribute:
        raise HTTPException(status_code=404, detail="Attribute not found")
    
    updated_attribute = crud.update_attribute(db=db, db_obj=db_attribute, obj_in=attribute_in)
    return updated_attribute


@router.delete("/attributes/{attribute_id}", response_model=schemas.Attribute)
def delete_attribute(attribute_id: uuid.UUID, db: Session = Depends(get_db)):
    try:
        db_attribute = crud.delete_attribute(db, attribute_id=attribute_id)
        if db_attribute is None:
            raise HTTPException(status_code=404, detail="Attribute not found")
        return db_attribute
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) 