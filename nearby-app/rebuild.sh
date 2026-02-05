#!/bin/bash

# Rebuild script for Nearby App container
# This script stops, rebuilds, and restarts the production container

echo "🛑 Stopping and removing existing container..."
docker stop nearby-app 2>/dev/null
docker rm nearby-app 2>/dev/null

echo "🔨 Building Docker image..."
# Build from monorepo root so shared/ package is in context
docker build -t nearby-app:latest -f Dockerfile ..

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Ensure the shared network exists
echo "🔗 Ensuring network exists..."
docker network create nearby-admin_default 2>/dev/null || true

echo "🚀 Starting container..."
docker run -d --name nearby-app \
  -p 8002:8000 \
  --network nearby-admin_default \
  -e DATABASE_URL="postgresql://postgres_admin:Tesslate123!@nearby-admin-db.ce3mwk2ymjh4.us-east-1.rds.amazonaws.com:5432/nearbynearby" \
  -e SECRET_KEY="424b57ecb9798c63e9b09b7595dc2f8f3ac313a13c40ef439afdeea6187d4722" \
  -e ENVIRONMENT="production" \
  -e ALLOWED_ORIGINS="https://nearbynearby.com,http://nearbynearby.com,http://localhost:8002,http://localhost:8003,http://localhost:5173" \
  -e ALLOWED_HOSTS="nearbynearby.com,backend,frontend,localhost,127.0.0.1,*" \
  -e PRODUCTION_DOMAIN="nearbynearby.com" \
  -e IMAGE_BASE_URL="/api/images" \
  -e IMAGE_STORAGE_PATH="/app/storage/images" \
  nearby-app:latest

if [ $? -ne 0 ]; then
    echo "❌ Container start failed!"
    exit 1
fi

echo ""
echo "✅ Container rebuilt and started successfully!"
echo ""
echo "📊 Container status:"
docker ps | grep nearby-app

echo ""
echo "📝 Checking logs..."
sleep 2
docker logs nearby-app 2>&1 | tail -10

echo ""
echo "✅ Done! Container is running on port 8002"
