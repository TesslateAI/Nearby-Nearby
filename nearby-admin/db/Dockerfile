# Local-dev PostGIS image WITH pgvector, so a developer can exercise real
# semantic search locally (mirrors prod, where RDS provides pgvector).
#
# Base stays on postgis/postgis:15-3.4 to match the previous stock `db` image
# and keep the existing `postgres_data` volume / PG15 catalog compatible.
# (tests/Dockerfile.testdb uses 15-3.3 — same idea, different patch line.)
FROM postgis/postgis:15-3.4

# Install the pgdg pgvector package for PostgreSQL 15. The `vector` extension is
# then available via `CREATE EXTENSION vector;` (Alembic migration k_embedding_001
# creates it and the HNSW index at upgrade time).
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-15-pgvector \
    && rm -rf /var/lib/apt/lists/*
