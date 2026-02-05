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

@router.get("/tree/{poi_type}", response_model=List[schemas.CategoryWithChildren])
def get_category_tree_for_poi_type(
    poi_type: str,
    db: Session = Depends(get_db)
):
    """
    Get category tree structure for a specific POI type.
    Returns hierarchical tree with all levels of categories.
    """
    return crud.get_category_tree_by_poi_type(db=db, poi_type=poi_type)

@router.get("/{category_id}", response_model=schemas.Category)
def get_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Get a single category by ID.
    """
    category = crud.get_category(db=db, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.put("/{category_id}", response_model=schemas.Category)
def update_category(
    category_id: uuid.UUID,
    category_update: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Update an existing category.
    """
    return crud.update_category(db=db, category_id=category_id, category_update=category_update)

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