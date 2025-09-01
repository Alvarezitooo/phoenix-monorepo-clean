# 🚀 Phoenix Letters - Production Docker Image
# Sprint 5 - Backend FastAPI + Frontend React intégré + Luna Hub integration

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

# Node.js for frontend build (Force rebuild - v20 compatible)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Python dependencies
COPY requirements_api.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements_api.txt

# Copy backend code (Clean Architecture)
COPY application ./application
COPY domain ./domain
COPY infrastructure ./infrastructure
COPY presentation ./presentation
COPY shared ./shared
COPY api_main.py ./api_main.py

# Build frontend
WORKDIR /app/frontend/project
COPY frontend/project/package*.json ./
RUN npm ci --production=false
COPY frontend/project/ ./
RUN npm run build

# Back to main directory
WORKDIR /app

# 🎯 Career Transition + Luna Hub Integration will be verified at runtime

# Security: create non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app

USER appuser

# Health check for Railway (use GET method)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f -X GET http://localhost:$PORT/health || exit 1

EXPOSE $PORT

# Railway-compatible command - Use Clean Architecture with Luna Hub integration
CMD ["python", "api_main.py"]