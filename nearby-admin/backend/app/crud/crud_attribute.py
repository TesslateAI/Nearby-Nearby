from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
import uuid

from app import models, schemas


def get_attribute(db: Session, attribute_id: uuid.UUID):
    return db.query(models.Attribute).filter(models.Attribute.id == attribute_id).first()


def get_attributes(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    attribute_type: Optional[str] = None,
    applicable_to: Optional[str] = None,
    is_active: Optional[bool] = None
):
    query = db.query(models.Attribute)
    
    if attribute_type:
        query = query.filter(models.Attribute.type == attribute_type)
    
    if applicable_to:
        query = query.filter(models.Attribute.applicable_to.contains([applicable_to]))
    
    if is_active is not None:
        query = query.filter(models.Attribute.is_active == is_active)
    
    return query.order_by(models.Attribute.sort_order, models.Attribute.name).offset(skip).limit(limit).all()


def get_attributes_by_type(db: Session, attribute_type: str):
    """Get all attributes of a specific type"""
    return db.query(models.Attribute).filter(
        and_(
            models.Attribute.type == attribute_type,
            models.Attribute.is_active == True
        )
    ).order_by(models.Attribute.sort_order, models.Attribute.name).all()


def get_attributes_for_poi_type(db: Session, poi_type: str):
    """Get all attributes that apply to a specific POI type"""
    return db.query(models.Attribute).filter(
        and_(
            models.Attribute.applicable_to.contains([poi_type]),
            models.Attribute.is_active == True
        )
    ).order_by(models.Attribute.sort_order, models.Attribute.name).all()


def create_attribute(db: Session, attribute: schemas.AttributeCreate):
    db_attribute = models.Attribute(**attribute.model_dump())
    db.add(db_attribute)
    db.commit()
    db.refresh(db_attribute)
    return db_attribute


def update_attribute(db: Session, *, db_obj: models.Attribute, obj_in: schemas.AttributeUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_attribute(db: Session, attribute_id: uuid.UUID):
    db_attribute = get_attribute(db, attribute_id)
    if not db_attribute:
        return None
    
    # Check if this attribute has children
    children = db.query(models.Attribute).filter(models.Attribute.parent_id == attribute_id).all()
    if children:
        raise ValueError("Cannot delete attribute with children. Delete children first.")
    
    db.delete(db_attribute)
    db.commit()
    return db_attribute


def get_attribute_hierarchy(db: Session, attribute_type: Optional[str] = None):
    """Get attributes organized in a hierarchy (parent-child relationships)"""
    query = db.query(models.Attribute).filter(models.Attribute.parent_id.is_(None))
    
    if attribute_type:
        query = query.filter(models.Attribute.type == attribute_type)
    
    return query.filter(models.Attribute.is_active == True).order_by(
        models.Attribute.sort_order, 
        models.Attribute.name
    ).all() 