from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import uuid

from app import crud, schemas, models
from app.database import get_db

router = APIRouter()

# Define valid relationship combinations based on POI types
VALID_RELATIONSHIPS = {
    'EVENT': {
        'venue': ['BUSINESS', 'PARK'],
        'vendor': ['BUSINESS'],
        'sponsor': ['BUSINESS'],
        'related': ['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
    },
    'TRAIL': {
        'trail_in_park': ['PARK'],
        'service_provider': ['BUSINESS'],
        'related': ['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
    },
    'PARK': {
        'service_provider': ['BUSINESS'],
        'related': ['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
    },
    'BUSINESS': {
        'service_provider': ['PARK', 'TRAIL'],
        'vendor': ['EVENT'],
        'sponsor': ['EVENT'],
        'related': ['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
    }
}

def is_valid_relationship(source_poi_type: str, target_poi_type: str, relationship_type: str) -> bool:
    """Check if a relationship is valid based on POI types"""
    valid_relationships = VALID_RELATIONSHIPS.get(source_poi_type, {})
    valid_target_types = valid_relationships.get(relationship_type, [])
    return target_poi_type in valid_target_types

@router.post("/relationships/", response_model=schemas.POIRelationship, status_code=201)
def create_poi_relationship(
    source_poi_id: uuid.UUID,
    target_poi_id: uuid.UUID,
    relationship_type: str,
    db: Session = Depends(get_db)
):
    """Create a relationship between two POIs"""
    # Verify both POIs exist
    source_poi = crud.get_poi(db, source_poi_id)
    if not source_poi:
        raise HTTPException(status_code=404, detail="Source POI not found")
    
    target_poi = crud.get_poi(db, target_poi_id)
    if not target_poi:
        raise HTTPException(status_code=404, detail="Target POI not found")
    
    # Prevent self-relationships
    if source_poi_id == target_poi_id:
        raise HTTPException(status_code=400, detail="Cannot create a relationship with itself")
    
    # Validate relationship based on POI types
    source_type = source_poi.poi_type.value if hasattr(source_poi.poi_type, 'value') else str(source_poi.poi_type)
    target_type = target_poi.poi_type.value if hasattr(target_poi.poi_type, 'value') else str(target_poi.poi_type)
    if not is_valid_relationship(source_type, target_type, relationship_type):
        valid_relationships = VALID_RELATIONSHIPS.get(source_type, {})
        valid_types = valid_relationships.get(relationship_type, [])
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid relationship: Cannot create a '{relationship_type}' relationship between a {source_type} and a {target_type}. Valid target types for this relationship: {', '.join(valid_types)}"
        )
    
    # Check if relationship already exists
    existing = db.query(models.POIRelationship).filter(
        models.POIRelationship.source_poi_id == source_poi_id,
        models.POIRelationship.target_poi_id == target_poi_id,
        models.POIRelationship.relationship_type == relationship_type
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Relationship already exists")
    
    return crud.create_poi_relationship(db, source_poi_id, target_poi_id, relationship_type)

@router.get("/relationships/{poi_id}", response_model=List[schemas.POIRelationship])
def get_poi_relationships(poi_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all relationships for a specific POI"""
    # Verify POI exists
    poi = crud.get_poi(db, poi_id)
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")
    
    return crud.get_poi_relationships(db, poi_id)

@router.delete("/relationships/{source_poi_id}/{target_poi_id}/{relationship_type}", status_code=204)
def delete_poi_relationship(
    source_poi_id: uuid.UUID,
    target_poi_id: uuid.UUID,
    relationship_type: str,
    db: Session = Depends(get_db)
):
    """Delete a specific relationship between two POIs"""
    relationship = db.query(models.POIRelationship).filter(
        models.POIRelationship.source_poi_id == source_poi_id,
        models.POIRelationship.target_poi_id == target_poi_id,
        models.POIRelationship.relationship_type == relationship_type
    ).first()
    
    if not relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    db.delete(relationship)
    db.commit()
    return None

@router.get("/pois/{poi_id}/related", response_model=List[schemas.PointOfInterest])
def get_related_pois(
    poi_id: uuid.UUID,
    relationship_type: str = Query(None, description="Filter by relationship type"),
    db: Session = Depends(get_db)
):
    """Get all POIs related to a specific POI, optionally filtered by relationship type"""
    # Verify POI exists
    poi = crud.get_poi(db, poi_id)
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")
    
    relationships = crud.get_poi_relationships(db, poi_id)
    
    related_pois = []
    for rel in relationships:
        if relationship_type and rel.relationship_type != relationship_type:
            continue
            
        if rel.source_poi_id == poi_id:
            related_poi = crud.get_poi(db, rel.target_poi_id)
        else:
            related_poi = crud.get_poi(db, rel.source_poi_id)
        
        if related_poi:
            related_pois.append(related_poi)
    
    return related_pois 