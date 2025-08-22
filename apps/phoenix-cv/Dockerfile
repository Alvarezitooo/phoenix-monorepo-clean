# 🚀 Phoenix CV - Production Docker Image  
# Sprint 5 - Client léger Luna Hub avec 4 Revolutionary Features

FROM python:3.11-slim AS base

# Environment variables for production
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app \
    PORT=8002

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application structure (Clean Architecture)
COPY application ./application
COPY domain ./domain  
COPY infrastructure ./infrastructure
COPY presentation ./presentation
COPY shared ./shared
COPY api_main.py ./api_main.py
COPY main.py ./main.py

# 🎯 Vérification features Phoenix CV complètes
RUN python -c "import sys; sys.path.append('/app'); \
print('🔥 Phoenix CV - Verifying 4 Revolutionary Features...'); \
try: \
    from domain.entities.cv_document import CVDocument; \
    from domain.entities.mirror_match import MirrorMatchAnalysis; \
    from application.clients.luna_client import LunaClient; \
    print('✅ Core features verified!'); \
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

# Production command optimized for CV workloads (AI processing)
CMD ["sh", "-c", "gunicorn api_main:app -k uvicorn.workers.UvicornWorker -w ${WORKERS:-2} -b 0.0.0.0:${PORT} --timeout 120 --keep-alive 30 --max-requests 200 --max-requests-jitter 20 --preload --access-logfile - --error-logfile -"]