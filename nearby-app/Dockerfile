# Multi-stage build for Nearby Nearby

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY app/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY app/ ./

# Build the frontend
RUN npm run build

# Stage 2: Setup Python backend and serve frontend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PostGIS/PostgreSQL
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy built frontend from stage 1
# Vite is configured to emit to ../backend/static, so copy from that location
COPY --from=frontend-builder /app/backend/static ./static

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV WAITLIST_DB_DIR=/app/data

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
