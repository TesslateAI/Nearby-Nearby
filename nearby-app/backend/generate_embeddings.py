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

def _json_list(val) -> list:
    """Safely extract a list from a JSONB value (may be list, dict, str, or None)."""
    if isinstance(val, list):
        return [str(v) for v in val if v]
    if isinstance(val, dict):
        return [str(v) for v in val.values() if v]
    return []


def create_searchable_text(poi: dict, categories: list = None,
                           trail: dict = None, event: dict = None,
                           business: dict = None, park: dict = None) -> str:
    """
    Create rich searchable text from POI attributes and related tables.
    Includes categories, amenities, facilities, trail/park/event specifics, etc.
    """
    parts = []

    # Name (most important)
    if poi.get('name'):
        parts.append(f"Name: {poi['name']}")

    # Type
    if poi.get('poi_type'):
        parts.append(f"Type: {poi['poi_type']}")

    # Categories
    if categories:
        parts.append(f"Categories: {', '.join(categories)}")

    # Short description
    if poi.get('description_short'):
        parts.append(f"Description: {poi['description_short']}")

    # Long description (limit to first 500 chars)
    if poi.get('description_long'):
        parts.append(f"Details: {poi['description_long'][:500]}")

    # --- Business amenities ---
    biz_amenities = _json_list(poi.get('business_amenities'))
    if biz_amenities:
        parts.append(f"Business amenities: {', '.join(biz_amenities)}")

    entertainment = _json_list(poi.get('entertainment_options'))
    if entertainment:
        parts.append(f"Entertainment: {', '.join(entertainment)}")

    youth = _json_list(poi.get('youth_amenities'))
    if youth:
        parts.append(f"Youth amenities: {', '.join(youth)}")

    # General amenities / ideal_for
    amenities = _json_list(poi.get('amenities'))
    ideal = _json_list(poi.get('ideal_for'))
    ideal_key = _json_list(poi.get('ideal_for_key'))
    all_amenities = amenities + ideal + ideal_key
    if all_amenities:
        parts.append(f"Amenities: {', '.join(all_amenities)}")

    # Key facilities
    key_fac = _json_list(poi.get('key_facilities'))
    if key_fac:
        parts.append(f"Key facilities: {', '.join(key_fac)}")

    # --- Accessibility & features ---
    features = []
    wheelchair = _json_list(poi.get('wheelchair_accessible'))
    if wheelchair and wheelchair != ['No'] and wheelchair != ['Unknown']:
        features.append("wheelchair accessible")
    wifi = _json_list(poi.get('wifi_options'))
    if wifi:
        features.extend(wifi)
    pet = _json_list(poi.get('pet_options'))
    if pet:
        features.extend(pet)
    public_toilets = _json_list(poi.get('public_toilets'))
    if public_toilets:
        features.extend(public_toilets)
    if features:
        parts.append(f"Features: {', '.join(features)}")

    # --- Park specifics ---
    facilities = _json_list(poi.get('facilities_options'))
    if facilities:
        parts.append(f"Park facilities: {', '.join(facilities)}")

    things = _json_list(poi.get('things_to_do'))
    if things:
        parts.append(f"Things to do: {', '.join(things)}")

    natural = _json_list(poi.get('natural_features'))
    if natural:
        parts.append(f"Natural features: {', '.join(natural)}")

    outdoor = _json_list(poi.get('outdoor_types'))
    if outdoor:
        parts.append(f"Outdoor types: {', '.join(outdoor)}")

    if poi.get('playground_available'):
        parts.append("Playground available")

    if poi.get('camping_lodging'):
        parts.append(f"Camping/lodging: {str(poi['camping_lodging'])[:200]}")

    # --- Trail specifics ---
    if trail:
        if trail.get('difficulty'):
            parts.append(f"Trail difficulty: {trail['difficulty']}")
        if trail.get('length_text'):
            parts.append(f"Trail length: {trail['length_text']}")
        if trail.get('route_type'):
            parts.append(f"Route type: {trail['route_type']}")
        surfaces = _json_list(trail.get('trail_surfaces'))
        if surfaces:
            parts.append(f"Trail surfaces: {', '.join(surfaces)}")
        experiences = _json_list(trail.get('trail_experiences'))
        if experiences:
            parts.append(f"Trail experiences: {', '.join(experiences)}")

    # --- Event specifics ---
    if event:
        venue_settings = _json_list(event.get('venue_settings'))
        if venue_settings:
            parts.append(f"Venue: {', '.join(venue_settings)}")

    # --- Business specifics ---
    if business and business.get('price_range'):
        parts.append(f"Price range: {business['price_range']}")

    # --- Pricing ---
    if poi.get('cost'):
        parts.append(f"Cost: {poi['cost']}")
    if poi.get('price_range_per_person'):
        parts.append(f"Price per person: {poi['price_range_per_person']}")

    # Alcohol
    alcohol = _json_list(poi.get('alcohol_options'))
    if alcohol:
        parts.append(f"Alcohol: {', '.join(alcohol)}")

    # Discounts
    discounts = _json_list(poi.get('discounts'))
    if discounts:
        parts.append(f"Discounts: {', '.join(discounts)}")

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
    """Fetch POIs from database with related table data for richer embeddings."""
    with engine.connect() as connection:
        # Build WHERE clause based on force flag
        where_clause = "" if force else "WHERE p.embedding IS NULL"
        mode = "Force mode: regenerating all" if force else "Fetching POIs without"
        print(f"[INFO] {mode} embeddings")

        query = text(f"""
            SELECT p.*,
                   t.difficulty AS trail_difficulty,
                   t.length_text AS trail_length_text,
                   t.route_type AS trail_route_type,
                   t.trail_surfaces AS trail_surfaces,
                   t.trail_experiences AS trail_experiences,
                   e.venue_settings AS event_venue_settings,
                   b.price_range AS biz_price_range,
                   COALESCE(
                       (SELECT string_agg(c.name, ', ')
                        FROM categories c
                        JOIN poi_categories pc ON c.id = pc.category_id
                        WHERE pc.poi_id = p.id), ''
                   ) AS category_names
            FROM points_of_interest p
            LEFT JOIN trails t ON t.poi_id = p.id
            LEFT JOIN events e ON e.poi_id = p.id
            LEFT JOIN businesses b ON b.poi_id = p.id
            {where_clause}
            ORDER BY p.id
        """)

        result = connection.execute(query)
        rows = result.fetchall()
        columns = result.keys()

        pois = []
        for row in rows:
            row_dict = dict(zip(columns, row))
            poi_id = str(row_dict['id'])

            # Separate related table data from POI data
            trail = None
            if row_dict.get('trail_difficulty') or row_dict.get('trail_length_text'):
                trail = {
                    'difficulty': row_dict.get('trail_difficulty'),
                    'length_text': row_dict.get('trail_length_text'),
                    'route_type': row_dict.get('trail_route_type'),
                    'trail_surfaces': row_dict.get('trail_surfaces'),
                    'trail_experiences': row_dict.get('trail_experiences'),
                }

            event = None
            if row_dict.get('event_venue_settings'):
                event = {'venue_settings': row_dict.get('event_venue_settings')}

            business = None
            if row_dict.get('biz_price_range'):
                business = {'price_range': row_dict.get('biz_price_range')}

            categories = []
            if row_dict.get('category_names'):
                categories = [c.strip() for c in row_dict['category_names'].split(',') if c.strip()]

            # Store enrichment data alongside the POI dict
            row_dict['_trail'] = trail
            row_dict['_event'] = event
            row_dict['_business'] = business
            row_dict['_categories'] = categories

            pois.append((poi_id, row_dict))

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

        # Create searchable text for batch (with enrichment data)
        texts = [
            create_searchable_text(
                poi_data,
                categories=poi_data.get('_categories'),
                trail=poi_data.get('_trail'),
                event=poi_data.get('_event'),
                business=poi_data.get('_business'),
            )
            for poi_id, poi_data in batch
        ]
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
