# Phoenix Aube - Full Stack Dockerfile  
# Career Discovery Service - Frontend Next.js + Backend FastAPI

# ============================================================================
# STAGE 1: Frontend Build
# ============================================================================
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

COPY frontend/ ./
RUN npm run build

# ============================================================================
# STAGE 2: Backend + Production Runtime
# ============================================================================
FROM python:3.11-slim as production

# Metadata & Labels
LABEL maintainer="Phoenix Team <support@phoenix-ia.com>"
LABEL service="phoenix-aube"
LABEL version="1.0.0"
LABEL description="Phoenix Aube Career Discovery Service - Full Stack"

# System Dependencies & Security
RUN groupadd -r phoenix && useradd -r -g phoenix phoenix

RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Python Environment Setup
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependencies Installation
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/ /app/

# Copy Frontend Build from previous stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next

# Security & Permissions
RUN chown -R phoenix:phoenix /app && \
    mkdir -p /app/logs /app/data && \
    chown -R phoenix:phoenix /app/logs /app/data

USER phoenix

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8001}/health || exit 1

# Runtime Configuration - Railway auto-assigns port
EXPOSE $PORT

ENV HOST=0.0.0.0
ENV WORKERS=1

# Railway Labels
LABEL railway.service="phoenix-aube"
LABEL railway.port="8001"
LABEL railway.healthcheck="/health"

# Optimize build
RUN python -m compileall /app

# Startup Command
CMD ["sh", "-c", "uvicorn api_main:app --host $HOST --port $PORT --workers ${WORKERS:-1}"]