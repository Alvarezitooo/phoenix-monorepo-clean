# 🚀 Phoenix Backend Unified - Production Docker Image
# Sprint 5 - Optimized for Railway deployment with Luna Hub

FROM python:3.11-slim AS base

# Environment variables for production
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8003

WORKDIR /app

# System dependencies for production
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies - FORCE REBUILD 2025-08-23
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install email-validator==2.2.0

# Copy application code
COPY app ./app
COPY main.py ./main.py

# Security: create non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app

USER appuser

# Health check for Railway monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}

# Production command with Gunicorn + Uvicorn workers
# Optimized for Railway: auto-scaling workers based on CPU
CMD ["python", "main.py"]
