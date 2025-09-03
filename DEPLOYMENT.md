# 🚀 Phoenix Deployment Guide

> Production-ready deployment on Railway with JAMstack Multi-SPA architecture

## 🎯 Overview

Phoenix deploys as **3 independent Railway services** with intelligent routing:

```
🌍 Internet (HTTPS)
    ↓
🌐 phoenix.ai (Custom Domain)
    ↓
🚀 Phoenix Frontend (React SPA + Nginx Proxy)
    ├── /aube, /cv, /letters → React Router
    ├── /api/* → Proxy to phoenix-api
    └── /hub/* → Proxy to luna-hub
    ↓
🎯 Phoenix API (FastAPI Gateway)
    ↓
🌙 Luna Hub (AI Services + Database)
```

## 🏗️ Services Architecture

### 1. Phoenix Frontend
- **Tech**: React SPA + Nginx reverse proxy
- **Port**: 80 (production)
- **Routing**: Client-side + API proxying
- **CDN**: Railway static asset optimization

### 2. Phoenix API  
- **Tech**: FastAPI orchestration gateway
- **Port**: 8000
- **Role**: Request routing to Luna Hub
- **Dependencies**: Luna Hub connection

### 3. Luna Hub
- **Tech**: FastAPI + PostgreSQL + Redis
- **Port**: 8001
- **Role**: AI services + business logic + data
- **Dependencies**: Database, Redis, Gemini API

## 🌐 Railway Deployment

### Prerequisites
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
```

### Step 1: Create Services

```bash
# Create 3 Railway services
railway create phoenix-frontend
railway create phoenix-api  
railway create luna-hub
```

### Step 2: Environment Variables

#### Luna Hub Environment
```env
# Database (Railway PostgreSQL)
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# AI Services
GEMINI_API_KEY=your_gemini_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
JWT_SECRET_KEY=your-super-secure-jwt-secret-256-bit
SECURITY_GUARDIAN_ENABLED=true

# External APIs
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Performance
ENABLE_REDIS_CACHE=true
LOG_LEVEL=INFO
```

#### Phoenix API Environment
```env
# Luna Hub Connection
LUNA_HUB_URL=https://luna-hub-production.railway.app

# Security
CORS_ORIGINS=["https://phoenix-frontend.railway.app","https://phoenix.ai"]
ALLOWED_HOSTS=["phoenix-api.railway.app","phoenix.ai"]

# Performance
ENABLE_COMPRESSION=true
CACHE_MIDDLEWARE=true
```

#### Phoenix Frontend Environment
```env
# API Endpoints
VITE_API_BASE_URL=https://phoenix-api.railway.app
VITE_HUB_BASE_URL=https://luna-hub-production.railway.app

# Environment
VITE_NODE_ENV=production
VITE_ENABLE_ANALYTICS=true

# Feature Flags
VITE_ENABLE_AUBE=true
VITE_ENABLE_CV=true
VITE_ENABLE_LETTERS=true
```

### Step 3: Database Setup

```bash
# Add PostgreSQL to Luna Hub
railway add -s luna-hub postgresql
railway add -s luna-hub redis

# Run migrations (automatically via startup)
# Migrations are in luna-hub/migrations/
```

### Step 4: Deploy Services

```bash
# Deploy in order (dependencies first)
cd luna-hub
railway link phoenix-luna-hub-production
railway up

cd ../phoenix-api  
railway link phoenix-api-production
railway up

cd ../phoenix-frontend
railway link phoenix-frontend-production
railway up
```

### Step 5: Custom Domain Setup

```bash
# Add custom domain to frontend service
railway domain add phoenix.ai -s phoenix-frontend

# Configure DNS (A/CNAME records)
# Point phoenix.ai to Railway-provided domain
```

## ⚙️ Production Configuration

### Nginx Configuration (Frontend)
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass ${PHOENIX_API_URL};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Hub proxy
    location /hub/ {
        proxy_pass ${LUNA_HUB_URL};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000";
}
```

### Health Checks
```http
GET /health          # Phoenix API health
GET /hub/health      # Luna Hub health  
GET /               # Frontend availability
```

## 🔒 Security Configuration

### CORS Setup
```python
# In both phoenix-api and luna-hub
CORS_ORIGINS = [
    "https://phoenix.ai",
    "https://phoenix-frontend.railway.app"
]
```

### Rate Limiting
```python
# Luna Hub - per user limits
RATE_LIMIT_PER_USER = "10/minute"
RATE_LIMIT_AI_ENDPOINTS = "5/minute"
```

### SSL/TLS
- **Automatic**: Railway handles SSL certificates
- **HSTS**: Enabled by default
- **Security Headers**: Configured in Nginx

## 📊 Monitoring & Observability

### Railway Metrics
- **CPU Usage**: Monitor < 70%
- **Memory**: Monitor < 80%  
- **Response Times**: Target < 500ms
- **Error Rate**: Keep < 1%

### Custom Metrics
```python
# Built-in Phoenix metrics
/metrics            # Prometheus format
/health/detailed    # System status
```

### Alerts Setup
```yaml
# Railway webhook alerts
- service_down
- high_cpu_usage
- memory_threshold
- deployment_failure
```

## 🚀 Deployment Pipeline

### Automatic Deployments
```yaml
# Railway auto-deploys on:
- main branch push
- environment variable changes
- service restarts
```

### Manual Deployment
```bash
# Deploy specific service
railway up -s luna-hub

# Deploy with build logs
railway up --verbose

# Rollback if needed
railway rollback -s phoenix-frontend
```

## 🔧 Troubleshooting

### Common Issues

#### Service Connection Errors
```bash
# Check service URLs
railway vars -s phoenix-api
railway logs -s luna-hub --tail
```

#### Database Connection
```bash
# Test database connectivity
railway connect postgresql -s luna-hub
```

#### Build Failures
```bash
# Check build logs
railway logs -s phoenix-frontend --deployment
```

### Performance Optimization
```bash
# Monitor resource usage
railway status -s all
railway metrics -s luna-hub
```

## 📈 Scaling

### Horizontal Scaling
- **Frontend**: Railway auto-scales static assets
- **API Gateway**: Stateless, scales automatically  
- **Luna Hub**: Database connection pooling

### Vertical Scaling
```bash
# Upgrade service resources
railway resource-allocation -s luna-hub
```

## ✅ Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates active
- [ ] Custom domain configured
- [ ] Health checks passing
- [ ] Performance metrics within targets
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Monitoring alerts setup
- [ ] Backup strategy implemented

---

**Phoenix is production-ready with enterprise-grade scalability and security!** 🌟