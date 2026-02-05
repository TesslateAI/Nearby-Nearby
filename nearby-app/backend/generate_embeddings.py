#!/usr/bin/env python3
"""
Generate embeddings for all POIs using michaelfeil/embeddinggemma-300m model.

This script:
1. Loads the michaelfeil/embeddinggemma-300m model from Hugging Face
2. Fetches all POIs from the database
3. Creates searchable text from POI attributes
4. Generates embeddings
5. Stores embeddings in the database

Usage:
    python generate_embeddings.py [--batch-size 32] [--force]

Options:
    --batch-size: Number of POIs to process at once (default: 32)
    --force: Regenerate embeddings even if they already exist
"""

import argparse
from sqlalchemy import create_engine, text
from sentence_transformers import SentenceTransformer
import sys
import time
from typing import List, Tuple
from app.core.config import settings

# Model configuration
MODEL_NAME = "michaelfeil/embeddinggemma-300m"

def create_searchable_text(poi: dict) -> str:
    """
    Create searchable text from POI attributes.
    Combines the most relevant fields for semantic search.
    """
    parts = []

    # Name (most important)
    if poi.get('name'):
        parts.append(f"Name: {poi['name']}")

    # Type
    if poi.get('poi_type'):
        parts.append(f"Type: {poi['poi_type']}")

    # Short description
    if poi.get('description_short'):
        parts.append(f"Description: {poi['description_short']}")

    # Long description (limit to first 500 chars to avoid token limits)
    if poi.get('description_long'):
        desc = poi['description_long'][:500]
        parts.append(f"Details: {desc}")

    # Amenities
    amenities = []
    if poi.get('amenities'):
        amenities.extend(poi['amenities'])
    if poi.get('ideal_for'):
        amenities.extend(poi['ideal_for'])
    if amenities:
        parts.append(f"Amenities: {', '.join(amenities)}")

    # Accessibility features
    accessibility = []
    if poi.get('wheelchair_accessible'):
        accessibility.append("wheelchair accessible")
    if poi.get('wifi_options'):
        accessibility.extend(poi['wifi_options'])
    if poi.get('pet_options'):
        accessibility.extend(poi['pet_options'])
    if accessibility:
        parts.append(f"Features: {', '.join(accessibility)}")

    # Location
    if poi.get('address_city'):
        parts.append(f"Location: {poi['address_city']}")

    return " | ".join(parts)

def load_model():
    """Load the michaelfeil/embeddinggemma-300m model"""
    print(f"\n[MODEL] Loading {MODEL_NAME}...")
    print("[INFO] First run will download ~300MB from Hugging Face")
    print("[INFO] This may take a minute or two...")

    start_time = time.time()
    try:
        model = SentenceTransformer(MODEL_NAME)
        load_time = time.time() - start_time
        print(f"[SUCCESS] Model loaded in {load_time:.1f}s")

        # Get embedding dimension
        test_embedding = model.encode("test", show_progress_bar=False)
        embedding_dim = len(test_embedding)
        print(f"[INFO] Embedding dimension: {embedding_dim}")

        return model, embedding_dim
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        sys.exit(1)

def fetch_pois(engine, force: bool = False) -> List[Tuple[str, dict]]:
    """Fetch POIs from database that need embeddings"""
    with engine.connect() as connection:
        # Build query based on force flag
        if force:
            query = text("SELECT * FROM points_of_interest ORDER BY id")
            print("[INFO] Force mode: regenerating all embeddings")
        else:
            query = text("""
                SELECT * FROM points_of_interest
                WHERE embedding IS NULL
                ORDER BY id
            """)
            print("[INFO] Fetching POIs without embeddings")

        result = connection.execute(query)
        rows = result.fetchall()
        columns = result.keys()

        # Convert to list of (id, dict)
        pois = []
        for row in rows:
            poi_dict = dict(zip(columns, row))
            pois.append((str(poi_dict['id']), poi_dict))

        print(f"[INFO] Found {len(pois)} POIs to process")
        return pois

def generate_and_store_embeddings(engine, model, pois: List[Tuple[str, dict]], batch_size: int):
    """Generate embeddings and store in database"""
    total = len(pois)
    if total == 0:
        print("[INFO] No POIs to process!")
        return

    print(f"\n[EMBEDDING] Processing {total} POIs in batches of {batch_size}...")

    start_time = time.time()
    processed = 0

    for i in range(0, total, batch_size):
        batch = pois[i:i + batch_size]
        batch_size_actual = len(batch)

        # Create searchable text for batch
        texts = [create_searchable_text(poi_data) for poi_id, poi_data in batch]
        ids = [poi_id for poi_id, poi_data in batch]

        # Generate embeddings for batch
        embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)

        # Store in database
        with engine.connect() as connection:
            for poi_id, embedding in zip(ids, embeddings):
                # Convert numpy array to list for PostgreSQL
                embedding_list = embedding.tolist()

                connection.execute(
                    text("""
                        UPDATE points_of_interest
                        SET embedding = CAST(:embedding AS vector)
                        WHERE id = :id
                    """),
                    {"embedding": str(embedding_list), "id": poi_id}
                )
            connection.commit()

        processed += batch_size_actual
        elapsed = time.time() - start_time
        rate = processed / elapsed
        remaining = (total - processed) / rate if rate > 0 else 0

        print(f"[PROGRESS] {processed}/{total} ({100*processed/total:.1f}%) | "
              f"Rate: {rate:.1f} POIs/s | ETA: {remaining:.0f}s")

    total_time = time.time() - start_time
    print(f"\n[SUCCESS] Generated embeddings for {total} POIs in {total_time:.1f}s")
    print(f"[INFO] Average rate: {total/total_time:.1f} POIs/s")

def verify_embeddings(engine):
    """Verify embeddings were created successfully"""
    print("\n[VERIFY] Checking embeddings...")
    with engine.connect() as connection:
        # Count total POIs
        result = connection.execute(text("SELECT COUNT(*) FROM points_of_interest"))
        total = result.scalar()

        # Count POIs with embeddings
        result = connection.execute(text("""
            SELECT COUNT(*) FROM points_of_interest WHERE embedding IS NOT NULL
        """))
        with_embeddings = result.scalar()

        # Count POIs without embeddings
        result = connection.execute(text("""
            SELECT COUNT(*) FROM points_of_interest WHERE embedding IS NULL
        """))
        without_embeddings = result.scalar()

        print(f"[INFO] Total POIs: {total}")
        print(f"[INFO] With embeddings: {with_embeddings} ({100*with_embeddings/total:.1f}%)")
        print(f"[INFO] Without embeddings: {without_embeddings}")

        if without_embeddings == 0:
            print("[SUCCESS] All POIs have embeddings!")
        else:
            print(f"[WARNING] {without_embeddings} POIs still need embeddings")

def main():
    parser = argparse.ArgumentParser(description="Generate embeddings for POIs")
    parser.add_argument("--batch-size", type=int, default=32,
                       help="Number of POIs to process at once (default: 32)")
    parser.add_argument("--force", action="store_true",
                       help="Regenerate embeddings even if they exist")
    args = parser.parse_args()

    print("=" * 60)
    print("POI Embedding Generation")
    print("=" * 60)

    # Load model
    model, embedding_dim = load_model()

    # Create database engine
    print(f"\n[DB] Connecting to database...")
    engine = create_engine(settings.DATABASE_URL)
    print("[SUCCESS] Connected to database")

    # Fetch POIs
    pois = fetch_pois(engine, force=args.force)

    if len(pois) > 0:
        # Generate and store embeddings
        generate_and_store_embeddings(engine, model, pois, args.batch_size)

    # Verify
    verify_embeddings(engine)

    print("\n" + "=" * 60)
    print("✅ Embedding generation complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Test semantic search: GET /api/pois/semantic-search?q=your+query")
    print("2. Compare with keyword search: GET /api/pois/search?q=your+query")

if __name__ == "__main__":
    main()
