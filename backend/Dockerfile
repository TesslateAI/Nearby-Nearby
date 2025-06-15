# Stage 1: Build stage
FROM python:3.10-slim as builder

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install build dependencies
RUN pip install --upgrade pip

# Copy and install requirements
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# Stage 2: Final stage
FROM python:3.10-slim

WORKDIR /app

# Copy built wheels from the builder stage
COPY --from=builder /app/wheels /wheels

# Install dependencies from wheels
RUN pip install --no-cache /wheels/*

# Copy application code
COPY . .

# Run uvicorn server
# The host 0.0.0.0 is important to make the server accessible from outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]