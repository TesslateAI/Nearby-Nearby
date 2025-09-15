from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app import crud, schemas
from app.database import get_db
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.Category, status_code=201)
def create_category(
    category: schemas.CategoryCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    # Simple logic to prevent duplicate slugs could be added here if needed
    return crud.create_category(db=db, category=category)

@router.get("/tree", response_model=List[schemas.CategoryWithChildren])
def read_category_tree(db: Session = Depends(get_db)):
    """
    Returns all categories in a nested tree structure.
    """
    return crud.get_all_categories_as_tree(db=db)

@router.get("/by-poi-type/{poi_type}", response_model=List[schemas.Category])
def get_categories_by_poi_type(
    poi_type: str,
    db: Session = Depends(get_db)
):
    """
    Get all categories applicable to a specific POI type.
    """
    return crud.get_categories_by_poi_type(db=db, poi_type=poi_type)

@router.get("/main/{poi_type}", response_model=List[schemas.Category])
def get_main_categories(
    poi_type: str,
    db: Session = Depends(get_db)
):
    """
    Get only main (parent) categories for a specific POI type.
    """
    return crud.get_main_categories_by_poi_type(db=db, poi_type=poi_type)

@router.get("/secondary/{poi_type}", response_model=List[schemas.Category])
def get_secondary_categories(
    poi_type: str,
    parent_id: uuid.UUID = None,
    db: Session = Depends(get_db)
):
    """
    Get secondary (child) categories for a specific POI type.
    Optionally filter by parent_id.
    """
    return crud.get_secondary_categories_by_poi_type(db=db, poi_type=poi_type, parent_id=parent_id)

@router.delete("/{category_id}", status_code=204)
def delete_category_endpoint(
    category_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Deletes a category. Will fail if the category has subcategories.
    """
    try:
        crud.delete_category(db=db, category_id=category_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return None # Return 204 No Content on success