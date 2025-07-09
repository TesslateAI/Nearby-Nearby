from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Category, status_code=201)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    # Simple logic to prevent duplicate slugs could be added here if needed
    return crud.create_category(db=db, category=category)

@router.get("/tree", response_model=List[schemas.CategoryWithChildren])
def read_category_tree(db: Session = Depends(get_db)):
    """
    Returns all categories in a nested tree structure.
    """
    return crud.get_all_categories_as_tree(db=db)

@router.delete("/{category_id}", status_code=204)
def delete_category_endpoint(category_id: uuid.UUID, db: Session = Depends(get_db)):
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