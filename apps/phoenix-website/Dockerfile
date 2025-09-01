# 🚀 Phoenix Website - Railway Compatible Architecture
# FastAPI + Static Serving (matches Phoenix CV/Letters)

FROM python:3.11-slim AS base

# Environment variables for Railway compatibility
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Build React frontend
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Copy FastAPI backend (using app_main.py as primary)
COPY app_main.py ./

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

EXPOSE $PORT

# Railway-compatible command (using app_main.py as primary)
CMD ["sh", "-c", "gunicorn app_main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:${PORT} --timeout 120 --keep-alive 30 --max-requests 200 --max-requests-jitter 20 --preload --access-logfile - --error-logfile -"]