import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import logging
import os
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class VectorDBManager:
    """
    Manages vector database operations using ChromaDB
    """
    
    def __init__(self, collection_name: str = "poi_embeddings", persist_directory: str = "./chroma_db"):
        """
        Initialize the vector database manager
        
        Args:
            collection_name: Name of the ChromaDB collection
            persist_directory: Directory to persist ChromaDB data
        """
        self.logger = logging.getLogger(__name__)
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.client = None
        self.collection = None
        
        try:
            self._initialize_client()
            self._get_or_create_collection()
        except Exception as e:
            self.logger.error(f"Failed to initialize vector database: {e}")
            raise
    
    def _initialize_client(self):
        """Initialize ChromaDB client"""
        try:
            # Create persist directory if it doesn't exist
            os.makedirs(self.persist_directory, exist_ok=True)
            
            # Initialize client with persistence
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            self.logger.info(f"Initialized ChromaDB client with persist directory: {self.persist_directory}")
            
        except Exception as e:
            self.logger.error(f"Error initializing ChromaDB client: {e}")
            raise
    
    def _get_or_create_collection(self):
        """Get existing collection or create a new one"""
        try:
            # Try to get existing collection
            self.collection = self.client.get_collection(name=self.collection_name)
            self.logger.info(f"Retrieved existing collection: {self.collection_name}")
            
        except Exception:
            # Collection doesn't exist, create it
            try:
                self.collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"description": "POI embeddings for semantic search"}
                )
                self.logger.info(f"Created new collection: {self.collection_name}")
                
            except Exception as e:
                self.logger.error(f"Error creating collection: {e}")
                raise
    
    def upsert_vectors(self, vectors_data: List[Dict[str, Any]]) -> bool:
        """
        Upsert (insert or update) vectors in the database
        
        Args:
            vectors_data: List of dictionaries containing vector data
                Each dict should have: id, embedding, searchable_text, metadata
        
        Returns:
            True if successful, False otherwise
        """
        if not vectors_data:
            self.logger.warning("No vectors data provided for upsert")
            return False
        
        try:
            # Prepare data for ChromaDB
            ids = []
            embeddings = []
            documents = []
            metadatas = []
            
            for vector_data in vectors_data:
                poi_id = str(vector_data.get('id'))
                embedding = vector_data.get('embedding')
                searchable_text = vector_data.get('searchable_text', '')
                metadata = vector_data.get('metadata', {})
                
                if not poi_id or not embedding:
                    self.logger.warning(f"Skipping vector with missing id or embedding: {poi_id}")
                    continue
                
                ids.append(poi_id)
                embeddings.append(embedding)
                documents.append(searchable_text)
                metadatas.append(metadata)
            
            if not ids:
                self.logger.warning("No valid vectors to upsert")
                return False
            
            # Upsert to ChromaDB
            self.collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            
            self.logger.info(f"Successfully upserted {len(ids)} vectors")
            return True
            
        except Exception as e:
            self.logger.error(f"Error upserting vectors: {e}")
            return False
    
    def search_vectors(self, query_embedding: List[float], n_results: int = 50, 
                      where_filter: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """
        Search for similar vectors
        
        Args:
            query_embedding: Query embedding vector
            n_results: Number of results to return
            where_filter: Optional metadata filter
            
        Returns:
            List of search results with metadata
        """
        try:
            # Perform search
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_filter,
                include=['metadatas', 'documents', 'distances']
            )
            
            # Format results
            formatted_results = []
            if results['ids'] and results['ids'][0]:
                for i in range(len(results['ids'][0])):
                    result = {
                        'id': results['ids'][0][i],
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                        'document': results['documents'][0][i] if results['documents'] else '',
                        'distance': results['distances'][0][i] if results['distances'] else 0.0,
                        'similarity_score': 1.0 - (results['distances'][0][i] if results['distances'] else 0.0)
                    }
                    formatted_results.append(result)
            
            self.logger.debug(f"Found {len(formatted_results)} similar vectors")
            return formatted_results
            
        except Exception as e:
            self.logger.error(f"Error searching vectors: {e}")
            return []
    
    def delete_vector(self, vector_id: str) -> bool:
        """
        Delete a vector by ID
        
        Args:
            vector_id: ID of the vector to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.collection.delete(ids=[vector_id])
            self.logger.info(f"Deleted vector with ID: {vector_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error deleting vector {vector_id}: {e}")
            return False
    
    def get_vector(self, vector_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific vector by ID
        
        Args:
            vector_id: ID of the vector to retrieve
            
        Returns:
            Vector data or None if not found
        """
        try:
            results = self.collection.get(ids=[vector_id])
            
            if results['ids']:
                return {
                    'id': results['ids'][0],
                    'embedding': results['embeddings'][0] if results['embeddings'] else None,
                    'document': results['documents'][0] if results['documents'] else '',
                    'metadata': results['metadatas'][0] if results['metadatas'] else {}
                }
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting vector {vector_id}: {e}")
            return None
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the collection
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            count = self.collection.count()
            
            return {
                'collection_name': self.collection_name,
                'total_vectors': count,
                'persist_directory': self.persist_directory,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting collection stats: {e}")
            return {
                'collection_name': self.collection_name,
                'total_vectors': 0,
                'error': str(e)
            }
    
    def reset_collection(self) -> bool:
        """
        Reset the collection (delete all vectors)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Delete the collection
            self.client.delete_collection(name=self.collection_name)
            
            # Recreate it
            self._get_or_create_collection()
            
            self.logger.info(f"Reset collection: {self.collection_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error resetting collection: {e}")
            return False
    
    def list_collections(self) -> List[str]:
        """
        List all collections in the database
        
        Returns:
            List of collection names
        """
        try:
            collections = self.client.list_collections()
            return [col.name for col in collections]
            
        except Exception as e:
            self.logger.error(f"Error listing collections: {e}")
            return [] 