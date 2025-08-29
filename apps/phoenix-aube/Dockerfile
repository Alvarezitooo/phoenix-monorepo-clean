# Phoenix Aube - Production Dockerfile
# Career Discovery Service - Enterprise Ready
FROM python:3.11-slim

# ============================================================================
# METADATA & LABELS
# ============================================================================
LABEL maintainer="Phoenix Team <support@phoenix-ia.com>"
LABEL service="phoenix-aube"
LABEL version="1.0.0"
LABEL description="Phoenix Aube Career Discovery Service"

# ============================================================================
# SYSTEM DEPENDENCIES & SECURITY
# ============================================================================

# Créer utilisateur non-root pour sécurité
RUN groupadd -r phoenix && useradd -r -g phoenix phoenix

# Installation des dépendances système minimales
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ============================================================================
# PYTHON ENVIRONMENT SETUP
# ============================================================================

# Configuration environnement Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Répertoire de travail
WORKDIR /app

# ============================================================================
# DEPENDENCIES INSTALLATION
# ============================================================================

# Copie et installation des requirements (layer cache optimized)
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ============================================================================
# APPLICATION CODE
# ============================================================================

# Copie du code source
COPY backend/ /app/

# ============================================================================
# SECURITY & PERMISSIONS
# ============================================================================

# Changement propriétaire des fichiers
RUN chown -R phoenix:phoenix /app

# Création des dossiers nécessaires avec permissions correctes
RUN mkdir -p /app/logs /app/data && \
    chown -R phoenix:phoenix /app/logs /app/data

# Passage à l'utilisateur non-root
USER phoenix

# ============================================================================
# HEALTH CHECK
# ============================================================================

# Health check intégré Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8001}/health || exit 1

# ============================================================================
# RUNTIME CONFIGURATION
# ============================================================================

# Exposition du port
EXPOSE ${PORT:-8001}

# Variables d'environnement par défaut
ENV HOST=0.0.0.0
ENV PORT=8001
ENV WORKERS=1

# ============================================================================
# STARTUP COMMAND
# ============================================================================

# Commande de démarrage production
CMD ["sh", "-c", "uvicorn api_main:app --host $HOST --port $PORT --workers ${WORKERS:-1} --log-config /dev/null"]

# ============================================================================
# RAILWAY DEPLOYMENT OPTIMIZATION
# ============================================================================

# Labels Railway pour auto-detection
LABEL railway.service="phoenix-aube"
LABEL railway.port="8001"
LABEL railway.healthcheck="/health"

# Optimisation build pour Railway
RUN python -m compileall /app