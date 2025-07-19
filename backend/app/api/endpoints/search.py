from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import logging
import time

from app.database import get_db
from app.schemas.search import (
    SearchRequest, 
    SearchResponse, 
    BulkIngestRequest, 
    BulkIngestResponse,
    SearchStats
)
from app.services.search_service import LocationSearchService
from app.services.vector_db_manager import VectorDBManager
from app.services.embedding_service import EmbeddingService
from app.services.text_processor import TextProcessor

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/search", response_model=SearchResponse)
async def search_locations(
    search_request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Main search endpoint for natural language location search
    """
    try:
        # Initialize search service
        search_service = LocationSearchService(db)
        
        # Perform search
        search_result = search_service.search(
            query=search_request.query,
            user_location=search_request.user_location,
            radius_km=search_request.radius_km,
            top_n=search_request.limit,
            category_filter=search_request.category_filter
        )
        
        # Apply sorting if specified
        if search_request.sort_by == "distance" and search_result["results"]:
            search_result["results"].sort(key=lambda x: x.get("distance_km", float("inf")))
        elif search_request.sort_by == "rating" and search_result["results"]:
            # Note: Rating sorting would need to be implemented based on your rating system
            pass  # Default to relevance sorting
        
        return SearchResponse(**search_result)
        
    except Exception as e:
        logger.error(f"Search endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/locations/bulk", response_model=BulkIngestResponse)
async def bulk_ingest_locations(
    ingest_request: BulkIngestRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Bulk ingest locations with automatic embedding generation
    """
    start_time = time.time()
    
    try:
        # Initialize services
        embedding_service = EmbeddingService()
        text_processor = TextProcessor()
        vector_db = VectorDBManager()
        
        success_count = 0
        error_count = 0
        errors = []
        vectors_to_upsert = []
        
        for location_data in ingest_request.locations:
            try:
                # Create searchable text
                searchable_text = text_processor.create_searchable_text(location_data)
                
                if not searchable_text:
                    error_count += 1
                    errors.append(f"Location {location_data.get('id', 'unknown')}: Empty searchable text")
                    continue
                
                # Generate embedding
                embedding = embedding_service.generate_embedding(searchable_text)
                
                # Prepare vector data
                vector_data = {
                    'id': str(location_data.get('id')),
                    'embedding': embedding,
                    'searchable_text': searchable_text,
                    'poi_type': location_data.get('poi_type', ''),
                    'category': location_data.get('category', ''),
                    'city': location_data.get('address_city', ''),
                    'state': location_data.get('address_state', ''),
                    'is_active': location_data.get('is_active', True)
                }
                
                vectors_to_upsert.append(vector_data)
                success_count += 1
                
            except Exception as e:
                error_count += 1
                errors.append(f"Location {location_data.get('id', 'unknown')}: {str(e)}")
        
        # Batch upsert vectors
        if vectors_to_upsert:
            vector_db.upsert_vectors(vectors_to_upsert)
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return BulkIngestResponse(
            success_count=success_count,
            error_count=error_count,
            errors=errors[:10],  # Limit error messages
            processing_time_ms=processing_time_ms
        )
        
    except Exception as e:
        logger.error(f"Bulk ingest error: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk ingest failed: {str(e)}")

@router.get("/search/stats", response_model=SearchStats)
async def get_search_stats():
    """
    Get search system statistics
    """
    try:
        vector_db = VectorDBManager()
        stats = vector_db.get_collection_stats()
        
        return SearchStats(
            total_vectors=stats['total_vectors'],
            collection_name=stats['collection_name']
        )
        
    except Exception as e:
        logger.error(f"Failed to get search stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get search stats: {str(e)}")

@router.post("/search/rebuild-index")
async def rebuild_search_index(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Rebuild the search index from all POIs in the database
    """
    try:
        # This would be a background task in production
        # For now, we'll do it synchronously
        from app.models.poi import PointOfInterest
        
        # Get all POIs
        pois = db.query(PointOfInterest).all()
        
        # Initialize services
        embedding_service = EmbeddingService()
        text_processor = TextProcessor()
        vector_db = VectorDBManager()
        
        # Reset collection
        vector_db.reset_collection()
        
        # Process POIs in batches
        batch_size = 100
        vectors_to_upsert = []
        
        for poi in pois:
            try:
                # Convert POI to dict
                poi_dict = {
                    'id': str(poi.id),
                    'name': poi.name,
                    'poi_type': poi.poi_type,
                    'description_long': poi.description_long,
                    'description_short': poi.description_short,
                    'address_street': poi.address_street,
                    'address_city': poi.address_city,
                    'address_state': poi.address_state,
                    'is_active': poi.status == 'ACTIVE'
                }
                
                # Create searchable text
                searchable_text = text_processor.create_searchable_text(poi_dict)
                
                if searchable_text:
                    # Generate embedding
                    embedding = embedding_service.generate_embedding(searchable_text)
                    
                    # Prepare vector data
                    vector_data = {
                        'id': str(poi.id),
                        'embedding': embedding,
                        'searchable_text': searchable_text,
                        'poi_type': poi.poi_type,
                        'category': '',  # Would need to join with categories
                        'city': poi.address_city or '',
                        'state': poi.address_state or '',
                        'is_active': poi.status == 'ACTIVE'
                    }
                    
                    vectors_to_upsert.append(vector_data)
                    
                    # Batch upsert
                    if len(vectors_to_upsert) >= batch_size:
                        vector_db.upsert_vectors(vectors_to_upsert)
                        vectors_to_upsert = []
                
            except Exception as e:
                logger.error(f"Error processing POI {poi.id}: {e}")
        
        # Upsert remaining vectors
        if vectors_to_upsert:
            vector_db.upsert_vectors(vectors_to_upsert)
        
        return {"message": "Search index rebuilt successfully"}
        
    except Exception as e:
        logger.error(f"Error rebuilding search index: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to rebuild index: {str(e)}")

@router.delete("/search/location/{location_id}")
async def delete_location_from_index(location_id: str):
    """
    Delete a location from the search index
    """
    try:
        vector_db = VectorDBManager()
        success = vector_db.delete_vector(location_id)
        
        if success:
            return {"message": f"Location {location_id} deleted from search index"}
        else:
            raise HTTPException(status_code=404, detail="Location not found in search index")
            
    except Exception as e:
        logger.error(f"Error deleting location from index: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete location: {str(e)}") 