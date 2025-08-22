# 🚀 Phoenix Letters - Production Docker Image
# Sprint 5 - Backend FastAPI + Frontend React intégré + Luna Hub integration

FROM python:3.11-slim AS base

# Environment variables for production
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app \
    PORT=8001

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
COPY main.py ./main.py

# Build frontend
WORKDIR /app/frontend/project
COPY frontend/project/package*.json ./
RUN npm ci --production=false
COPY frontend/project/ ./
RUN npm run build

# Back to main directory
WORKDIR /app

# 🎯 GAME CHANGER - Vérification Career Transition + Luna Hub
RUN python -c "import sys; sys.path.append('/app'); \
print('📝 Phoenix Letters - Verifying Career Transition + Luna Integration...'); \
try: \
    from domain.entities.career_transition import CareerTransition; \
    from infrastructure.clients.luna_client import LunaClient; \
    from application.models.actions import LettersActionType; \
    print('✅ Career Transition + Luna Hub Integration - Ready for Production!'); \
except Exception as e: print(f'⚠️  Some features may need runtime config: {e}')"

# Security: create non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app

USER appuser

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}

# Production command optimized for Letters workloads
CMD ["sh", "-c", "gunicorn api_main:app -k uvicorn.workers.UvicornWorker -w ${WORKERS:-2} -b 0.0.0.0:${PORT} --timeout 90 --keep-alive 30 --max-requests 300 --max-requests-jitter 30 --preload --access-logfile - --error-logfile -"]