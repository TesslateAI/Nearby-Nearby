from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app import schemas, models
from app.crud import crud_primary_type
from app.core.security import get_current_user


router = APIRouter()


@router.get("", response_model=list[schemas.PrimaryType])
def list_primary_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_primary_type.list_primary_types(db, skip=skip, limit=limit)


@router.post("", response_model=schemas.PrimaryType, status_code=201)
def create_primary_type(
    obj_in: schemas.PrimaryTypeCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    existing = crud_primary_type.get_primary_type_by_slug(db, obj_in.slug or "")
    if existing:
        raise HTTPException(status_code=400, detail="Primary type with this slug already exists")
    return crud_primary_type.create_primary_type(db, obj_in=obj_in)


@router.get("/{primary_type_id}", response_model=schemas.PrimaryType)
def get_primary_type(primary_type_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = crud_primary_type.get_primary_type(db, primary_type_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Primary type not found")
    return obj


@router.put("/{primary_type_id}", response_model=schemas.PrimaryType)
def update_primary_type(
    primary_type_id: uuid.UUID,
    obj_in: schemas.PrimaryTypeUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    db_obj = crud_primary_type.get_primary_type(db, primary_type_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Primary type not found")
    return crud_primary_type.update_primary_type(db, db_obj=db_obj, obj_in=obj_in)


@router.delete("/{primary_type_id}", status_code=204)
def delete_primary_type(
    primary_type_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    db_obj = crud_primary_type.get_primary_type(db, primary_type_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Primary type not found")
    crud_primary_type.delete_primary_type(db, db_obj=db_obj)
    return None
