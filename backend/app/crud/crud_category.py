from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from typing import List, Dict
import uuid

from app import models, schemas

def get_all_categories(db: Session) -> List[models.Category]:
    return db.query(models.Category).order_by(models.Category.name).all()

def get_category(db: Session, category_id: str) -> models.Category:
    return db.query(models.Category).filter(models.Category.id == category_id).first()

def create_category(db: Session, category: schemas.CategoryCreate) -> models.Category:
    db_category = models.Category(
        name=category.name,
        slug=category.slug,
        parent_id=category.parent_id
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_all_categories_as_tree(db: Session) -> List[schemas.CategoryWithChildren]:
    """
    Fetches all categories and organizes them into a parent-child tree structure.
    This revised logic prevents nodes from appearing at the root and as a child simultaneously.
    """
    all_categories = db.query(models.Category).options(joinedload(models.Category.children)).order_by(models.Category.name).all()
    category_map = {str(c.id): schemas.CategoryWithChildren.model_validate(c) for c in all_categories}

    root_nodes: List[schemas.CategoryWithChildren] = []
    
    for category in category_map.values():
        if category.parent_id and str(category.parent_id) in category_map:
            # This is a child, it has already been added to its parent's 'children' by the relationship loader.
            # We just need to ensure we don't add it to the root.
            pass
        else:
            # This is a root node (no parent or parent not in map)
            root_nodes.append(category)
            
    return root_nodes

def delete_category(db: Session, category_id: uuid.UUID):
    """
    Deletes a category from the database.
    Raises an HTTPException if the category has subcategories.
    """
    # Eagerly load children to check for subcategories
    db_category = db.query(models.Category).options(joinedload(models.Category.children)).filter(models.Category.id == category_id).first()

    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found.")

    # Check if the category has any children (subcategories)
    if db_category.children:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete a category that has subcategories. Please delete or reassign its children first."
        )
    
    # If no children, proceed with deletion
    db.delete(db_category)
    db.commit()