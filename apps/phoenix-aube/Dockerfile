# 🌅 Phoenix Aube - Full Stack Dockerfile  
# Frontend Next.js + Backend FastAPI - Déploiement unifié

# ============================================================================
# STAGE 1: Frontend Build (Next.js from Bolt.new)
# ============================================================================
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy frontend package files (créés par Bolt.new)
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy frontend source et build
COPY frontend/ ./
RUN npm run build

# ============================================================================
# STAGE 2: Backend + Frontend Production Runtime
# ============================================================================
FROM python:3.11-slim as production

# Metadata & Labels
LABEL maintainer="Phoenix Team <support@phoenix-ia.com>"
LABEL service="phoenix-aube-fullstack"
LABEL version="2.0.0"
LABEL description="Phoenix Aube Full Stack - Next.js Frontend + FastAPI Backend"

# System Dependencies & Security
RUN groupadd -r phoenix && useradd -r -g phoenix phoenix

RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    curl \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Python Environment Setup
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install Python Dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy Backend Code
COPY backend/ /app/backend/

# Copy Frontend Build from Stage 1
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/package.json /app/frontend/package.json

# Nginx Configuration for Frontend + API Proxy
COPY <<EOF /etc/nginx/sites-available/default
server {
    listen \$PORT;
    server_name _;
    
    # Frontend Next.js Static Files
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API Routes
    location /aube {
        proxy_pass http://localhost:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health Check Global
    location /health {
        proxy_pass http://localhost:8001/aube/health;
    }
}
EOF

# Supervisor Configuration - Multi-Process
COPY <<EOF /etc/supervisor/conf.d/phoenix-aube.conf
[program:backend]
command=uvicorn api_main:app --host 127.0.0.1 --port 8001 --workers 1
directory=/app/backend
user=phoenix
autostart=true
autorestart=true
stderr_logfile=/var/log/backend.err.log
stdout_logfile=/var/log/backend.out.log

[program:frontend]
command=npm start
directory=/app/frontend
user=phoenix
autostart=true
autorestart=true
stderr_logfile=/var/log/frontend.err.log
stdout_logfile=/var/log/frontend.out.log

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/var/log/nginx.err.log
stdout_logfile=/var/log/nginx.out.log
EOF

# Install Node.js for Frontend Runtime
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install Frontend Dependencies for Runtime
WORKDIR /app/frontend
RUN npm ci --only=production

# Security & Permissions
RUN chown -R phoenix:phoenix /app && \
    mkdir -p /var/log /app/logs && \
    chown -R phoenix:phoenix /var/log /app/logs && \
    chmod +x /usr/bin/supervisord

# Health Check - Global endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Runtime Configuration - Railway auto-assigns PORT
EXPOSE $PORT

# Railway Labels
LABEL railway.service="phoenix-aube-fullstack"
LABEL railway.healthcheck="/health"

# Startup Command - Supervisor manages all processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/phoenix-aube.conf", "-n"]