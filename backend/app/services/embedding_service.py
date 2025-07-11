import numpy as np
from typing import List, Optional
import logging
from sentence_transformers import SentenceTransformer
import os

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Service for generating text embeddings using Sentence Transformers
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding service
        
        Args:
            model_name: Name of the Sentence Transformers model to use
        """
        self.logger = logging.getLogger(__name__)
        self.model_name = model_name
        self.model = None
        self.embedding_dimension = 384  # Default for all-MiniLM-L6-v2
        
        try:
            self._load_model()
        except Exception as e:
            self.logger.error(f"Failed to load embedding model: {e}")
            raise
    
    def _load_model(self):
        """Load the Sentence Transformers model"""
        try:
            self.logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            self.logger.info(f"Successfully loaded model: {self.model_name}")
        except Exception as e:
            self.logger.error(f"Error loading model {self.model_name}: {e}")
            # Try fallback model
            try:
                self.logger.info("Trying fallback model: all-MiniLM-L6-v2")
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
                self.model_name = "all-MiniLM-L6-v2"
                self.logger.info("Successfully loaded fallback model")
            except Exception as fallback_error:
                self.logger.error(f"Failed to load fallback model: {fallback_error}")
                raise
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text string
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        if not text or not text.strip():
            self.logger.warning("Empty text provided for embedding")
            return [0.0] * self.embedding_dimension
        
        try:
            # Generate embedding
            embedding = self.model.encode(text, convert_to_numpy=True)
            
            # Convert to list of floats
            embedding_list = embedding.tolist()
            
            self.logger.debug(f"Generated embedding of dimension {len(embedding_list)} for text: {text[:50]}...")
            
            return embedding_list
            
        except Exception as e:
            self.logger.error(f"Error generating embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * self.embedding_dimension
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (more efficient than individual calls)
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        # Filter out empty texts
        valid_texts = [text for text in texts if text and text.strip()]
        
        if not valid_texts:
            return []
        
        try:
            # Generate embeddings in batch
            embeddings = self.model.encode(valid_texts, convert_to_numpy=True)
            
            # Convert to list of lists
            embedding_lists = embeddings.tolist()
            
            self.logger.debug(f"Generated {len(embedding_lists)} embeddings in batch")
            
            return embedding_lists
            
        except Exception as e:
            self.logger.error(f"Error generating batch embeddings: {e}")
            # Return zero vectors as fallback
            return [[0.0] * self.embedding_dimension] * len(valid_texts)
    
    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Compute cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score between 0 and 1
        """
        try:
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Compute cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            
            # Ensure result is between 0 and 1
            return max(0.0, min(1.0, similarity))
            
        except Exception as e:
            self.logger.error(f"Error computing similarity: {e}")
            return 0.0
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings generated by this model"""
        return self.embedding_dimension
    
    def get_model_info(self) -> dict:
        """Get information about the loaded model"""
        return {
            "model_name": self.model_name,
            "embedding_dimension": self.embedding_dimension,
            "model_loaded": self.model is not None
        } 