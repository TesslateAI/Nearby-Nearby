#!/usr/bin/env python3
"""
Search System Initialization Script

This script initializes the natural language search system by:
1. Setting up ChromaDB vector database
2. Generating embeddings for all existing POIs
3. Building the initial search index

Usage:
    python scripts/initialize_search.py
"""

import sys
import os
import logging
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.poi import PointOfInterest
from app.services.embedding_service import EmbeddingService
from app.services.text_processor import TextProcessor
from app.services.vector_db_manager import VectorDBManager
from app.services.search_service import LocationSearchService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main initialization function"""
    logger.info("🚀 Starting search system initialization...")
    
    try:
        # Step 1: Check dependencies
        logger.info("🔍 Checking dependencies...")
        check_dependencies()
        
        # Step 2: Initialize services
        logger.info("⚙️ Initializing services...")
        embedding_service = EmbeddingService()
        text_processor = TextProcessor()
        vector_db = VectorDBManager()
        
        # Create a dummy database session for search service
        db = SessionLocal()
        search_service = LocationSearchService(db)
        
        # Step 3: Get database session
        logger.info("🗄️ Connecting to database...")
        db = SessionLocal()
        
        try:
            # Step 4: Get all POIs
            logger.info("📊 Fetching POIs from database...")
            pois = db.query(PointOfInterest).all()
            logger.info(f"Found {len(pois)} POIs in database")
            
            if not pois:
                logger.warning("No POIs found in database. Please add some POIs first.")
                return
            
            # Step 5: Reset vector database
            logger.info("🗑️ Resetting vector database...")
            vector_db.reset_collection()
            
            # Step 6: Process POIs in batches
            logger.info("🔄 Processing POIs and generating embeddings...")
            batch_size = 50
            total_processed = 0
            total_errors = 0
            
            for i in range(0, len(pois), batch_size):
                batch = pois[i:i + batch_size]
                logger.info(f"Processing batch {i//batch_size + 1}/{(len(pois) + batch_size - 1)//batch_size}")
                
                vectors_to_upsert = []
                
                for poi in batch:
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
                            'address_zip': poi.address_zip,
                            'status': poi.status,
                            'is_verified': poi.is_verified,
                            'website_url': poi.website_url,
                            'phone_number': poi.phone_number,
                            'email': poi.email,
                            'photos': poi.photos,
                            'hours': poi.hours,
                            'amenities': poi.amenities,
                            'contact_info': poi.contact_info,
                            'compliance': poi.compliance,
                            'custom_fields': poi.custom_fields,
                            'is_active': poi.status == 'ACTIVE'
                        }
                        
                        # Add categories
                        if poi.categories:
                            poi_dict['categories'] = [
                                {'id': str(cat.id), 'name': cat.name} 
                                for cat in poi.categories
                            ]
                        else:
                            poi_dict['categories'] = []
                        
                        # Pre-process POI data for enhanced search
                        enhanced_poi_data = search_service.preprocess_poi_for_vector_storage(poi_dict)
                        searchable_text = enhanced_poi_data.get('searchable_text', '')
                        
                        if not searchable_text:
                            logger.warning(f"Empty searchable text for POI: {poi.name}")
                            total_errors += 1
                            continue
                        
                        # Generate embedding
                        embedding = embedding_service.generate_embedding(searchable_text)
                        
                        # Prepare vector data
                        vector_data = {
                            'id': str(poi.id),
                            'embedding': embedding,
                            'searchable_text': searchable_text,
                            'metadata': {
                                'poi_type': poi.poi_type,
                                'category': ', '.join([cat.name for cat in poi.categories]) if poi.categories else '',
                                'city': poi.address_city or '',
                                'state': poi.address_state or '',
                                'is_active': poi.status == 'ACTIVE'
                            }
                        }
                        
                        vectors_to_upsert.append(vector_data)
                        total_processed += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing POI {poi.id}: {e}")
                        total_errors += 1
                
                # Upsert batch
                if vectors_to_upsert:
                    success = vector_db.upsert_vectors(vectors_to_upsert)
                    if success:
                        logger.info(f"Successfully upserted {len(vectors_to_upsert)} vectors")
                    else:
                        logger.error(f"Failed to upsert batch of {len(vectors_to_upsert)} vectors")
            
            # Step 7: Verify results
            logger.info("✅ Verifying search index...")
            stats = vector_db.get_collection_stats()
            logger.info(f"Vector database stats: {stats}")
            
            # Step 8: Test search functionality
            logger.info("🧪 Testing search functionality...")
            test_search(vector_db, embedding_service)
            
            # Step 9: Summary
            logger.info("🎉 Search system initialization completed!")
            logger.info(f"📈 Summary:")
            logger.info(f"   - Total POIs processed: {total_processed}")
            logger.info(f"   - Total errors: {total_errors}")
            logger.info(f"   - Vectors in database: {stats.get('total_vectors', 0)}")
            logger.info(f"   - Collection name: {stats.get('collection_name', 'N/A')}")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Search system initialization failed: {e}")
        sys.exit(1)

def check_dependencies():
    """Check if all required dependencies are available"""
    try:
        import chromadb
        import sentence_transformers
        import numpy
        logger.info("✅ All dependencies are available")
    except ImportError as e:
        logger.error(f"❌ Missing dependency: {e}")
        logger.error("Please install required packages: pip install chromadb sentence-transformers numpy")
        sys.exit(1)

def test_search(vector_db, embedding_service):
    """Test the search functionality with a sample query"""
    try:
        # Test query
        test_query = "coffee shop"
        test_embedding = embedding_service.generate_embedding(test_query)
        
        # Search
        results = vector_db.search_vectors(test_embedding, n_results=5)
        
        if results:
            logger.info(f"✅ Search test successful - found {len(results)} results for '{test_query}'")
            for i, result in enumerate(results[:3]):
                logger.info(f"   {i+1}. {result.get('metadata', {}).get('poi_type', 'Unknown')} - Score: {result.get('similarity_score', 0):.3f}")
        else:
            logger.warning("⚠️ Search test returned no results")
            
    except Exception as e:
        logger.error(f"❌ Search test failed: {e}")

if __name__ == "__main__":
    main() 