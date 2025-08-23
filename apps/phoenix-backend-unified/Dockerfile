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

# Create requirements.txt with production dependencies
RUN echo "fastapi>=0.104.0" > requirements.txt && \
    echo "uvicorn[standard]>=0.24.0" >> requirements.txt && \
    echo "gunicorn>=21.2.0" >> requirements.txt && \
    echo "pydantic>=2.5.0" >> requirements.txt && \
    echo "stripe>=7.0.0" >> requirements.txt && \
    echo "supabase>=2.0.0" >> requirements.txt && \
    echo "structlog>=23.2.0" >> requirements.txt && \
    echo "httpx>=0.25.0" >> requirements.txt && \
    echo "python-multipart>=0.0.6" >> requirements.txt && \
    echo "python-jose[cryptography]>=3.3.0" >> requirements.txt && \
    echo "bleach>=6.0.0" >> requirements.txt && \
    echo "psutil>=5.9.0" >> requirements.txt

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

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
