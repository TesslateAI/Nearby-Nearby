from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app import models, schemas


def get_primary_type(db: Session, primary_type_id: uuid.UUID) -> Optional[models.PrimaryType]:
    return db.query(models.PrimaryType).filter(models.PrimaryType.id == primary_type_id).first()


def get_primary_type_by_slug(db: Session, slug: str) -> Optional[models.PrimaryType]:
    return db.query(models.PrimaryType).filter(models.PrimaryType.slug == slug).first()


def list_primary_types(db: Session, *, skip: int = 0, limit: int = 100) -> List[models.PrimaryType]:
    q = db.query(models.PrimaryType)
    return q.order_by(models.PrimaryType.name.asc()).offset(skip).limit(limit).all()


def create_primary_type(db: Session, *, obj_in: schemas.PrimaryTypeCreate) -> models.PrimaryType:
    db_obj = models.PrimaryType(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_primary_type(db: Session, *, db_obj: models.PrimaryType, obj_in: schemas.PrimaryTypeUpdate) -> models.PrimaryType:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_primary_type(db: Session, *, db_obj: models.PrimaryType) -> None:
    db.delete(db_obj)
    db.commit()
