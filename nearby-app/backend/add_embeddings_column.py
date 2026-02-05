#!/usr/bin/env python3
"""
Migration script to add embedding column to points_of_interest table.
This enables semantic search functionality using pgvector.

Run this once after installing pgvector extension:
    python add_embeddings_column.py
"""

from sqlalchemy import create_engine, text
from app.core.config import settings
import sys

def add_embedding_column():
    """Add embedding column to points_of_interest table"""

    print("=" * 60)
    print("Adding embedding column for semantic search")
    print("=" * 60)

    try:
        # Create database engine
        engine = create_engine(settings.DATABASE_URL)

        with engine.connect() as connection:
            # Check if pgvector extension is installed
            print("\n[1/4] Checking pgvector extension...")
            result = connection.execute(text(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
            ))
            has_pgvector = result.scalar()

            if not has_pgvector:
                print("[ERROR] pgvector extension is not installed!")
                print("[INFO] Please install pgvector first:")
                print("       sudo apt install postgresql-16-pgvector")
                print("       or enable it in main.py startup")
                sys.exit(1)

            print("[SUCCESS] pgvector extension found!")

            # Check if column already exists
            print("\n[2/4] Checking if embedding column exists...")
            result = connection.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='points_of_interest'
                AND column_name='embedding'
            """))
            has_column = result.fetchone() is not None

            if has_column:
                print("[INFO] Embedding column already exists, dropping and recreating with new dimensions...")
                # Drop the old column (it was 1536 dimensions for Qwen3)
                connection.execute(text("""
                    ALTER TABLE points_of_interest
                    DROP COLUMN IF EXISTS embedding CASCADE
                """))
                connection.commit()
                print("[INFO] Old embedding column dropped")

            # Add embedding column (768 dimensions for michaelfeil/embeddinggemma-300m)
            print("[INFO] Adding embedding column (vector type with 768 dimensions)...")
            connection.execute(text("""
                ALTER TABLE points_of_interest
                ADD COLUMN embedding vector(768)
            """))
            connection.commit()
            print("[SUCCESS] Embedding column added!")

            # Check for index
            print("\n[3/4] Checking for vector index...")
            result = connection.execute(text("""
                SELECT indexname
                FROM pg_indexes
                WHERE tablename='points_of_interest'
                AND indexname='poi_embedding_hnsw_idx'
            """))
            has_index = result.fetchone() is not None

            if has_index:
                print("[INFO] HNSW index already exists")
            else:
                print("[INFO] Creating HNSW index for fast vector search...")
                print("[INFO] This may take a few minutes for large datasets...")
                # HNSW index parameters:
                # m=16: number of connections per layer (higher = better recall, more memory)
                # ef_construction=64: size of dynamic candidate list (higher = better quality, slower build)
                connection.execute(text("""
                    CREATE INDEX IF NOT EXISTS poi_embedding_hnsw_idx
                    ON points_of_interest
                    USING hnsw (embedding vector_cosine_ops)
                    WITH (m = 16, ef_construction = 64)
                """))
                connection.commit()
                print("[SUCCESS] HNSW index created!")

            # Verify setup
            print("\n[4/4] Verifying setup...")
            result = connection.execute(text("""
                SELECT column_name, data_type, udt_name
                FROM information_schema.columns
                WHERE table_name='points_of_interest'
                AND column_name='embedding'
            """))
            column_info = result.fetchone()

            if column_info:
                print(f"[SUCCESS] Column: {column_info[0]}")
                print(f"[SUCCESS] Type: {column_info[1]} ({column_info[2]})")

            # Count POIs to be embedded
            result = connection.execute(text("""
                SELECT COUNT(*) FROM points_of_interest
            """))
            poi_count = result.scalar()
            print(f"[INFO] Total POIs to embed: {poi_count}")

            # Count POIs without embeddings
            result = connection.execute(text("""
                SELECT COUNT(*) FROM points_of_interest
                WHERE embedding IS NULL
            """))
            null_count = result.scalar()
            print(f"[INFO] POIs needing embeddings: {null_count}")

            print("\n" + "=" * 60)
            print("✅ Migration completed successfully!")
            print("=" * 60)
            print("\nNext steps:")
            print("1. Run: python generate_embeddings.py")
            print("2. This will generate embeddings for all POIs")
            print("3. Test semantic search at: /api/pois/semantic-search")

    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    add_embedding_column()
