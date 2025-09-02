# 🚀 Phoenix CV - Production Docker Image  
# Sprint 5 - Client léger Luna Hub avec 4 Revolutionary Features

FROM python:3.11-slim AS base

# Environment variables for production
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Node.js for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application structure (Clean Architecture)
COPY application ./application
COPY domain ./domain  
COPY infrastructure ./infrastructure
COPY shared ./shared
COPY api_main.py ./api_main.py

# Build frontend
WORKDIR /app/front-end
COPY front-end/package*.json ./

# Install frontend dependencies with robust fallback
RUN npm ci --production=false || \
    (echo "npm ci failed, cleaning and retrying..." && \
     rm -rf node_modules package-lock.json && \
     npm install --production=false)

COPY front-end/ ./
RUN npm run build

# Back to main directory
WORKDIR /app

# 🎯 Phoenix CV features will be verified at runtime

# Security: create non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app

USER appuser

# Health check for Railway - Enterprise Standard 2024
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/railway-health || exit 1

EXPOSE $PORT

# Railway-compatible command - Use Clean Architecture with Luna Hub integration
CMD ["python", "api_main.py"]