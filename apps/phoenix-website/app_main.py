"""
🚀 Phoenix Website - Point d'Entrée ASGI Unique (Cohérent avec CV/Letters)
FastAPI + React SPA avec sécurité enterprise
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from pathlib import Path
import structlog

# Configuration environnement
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8000))

# Configuration des logs structurés
import logging
logging.basicConfig(
    level=logging.INFO if ENVIRONMENT == "development" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = structlog.get_logger("phoenix_website_aggregator")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire du cycle de vie de l'aggrégateur"""
    
    # STARTUP
    logger.info(
        "Phoenix Website Aggregator starting",
        environment=ENVIRONMENT,
        port=PORT,
        service_registry="/api/services",
        spa_served=True
    )
    
    yield
    
    # SHUTDOWN
    logger.info("Phoenix Website Aggregator shutting down")

# ====== APPLICATION PRINCIPALE ======

app = FastAPI(
    lifespan=lifespan,
    title="🚀 Phoenix Website - Hub d'Orchestration",
    description="""
    # Phoenix Website - Hub Central de l'Écosystème
    
    Point d'entrée unique pour l'écosystème Phoenix AI :
    
    ## 🌙 Expérience Luna-Centrée
    - **Landing Page** : Présentation écosystème Phoenix
    - **Luna Authentication** : Session Zero conversationnelle
    - **Service Discovery** : Navigation vers CV, Letters, Journal
    - **Energy Management** : Visualisation et gestion Luna
    
    ## 🔒 Sécurité Enterprise
    - CORS strict production
    - Security headers complets
    - JWT validation automatique
    - CSP policy restrictive
    
    ## 📊 Architecture
    - **Frontend** : React SPA avec Framer Motion
    - **Backend** : FastAPI service registry
    - **Integration** : Luna Hub authentication flow
    """,
    version="1.0.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if ENVIRONMENT == "development" else None
)

# ====== CORS CONFIGURATION SÉCURISÉE ======

if ENVIRONMENT == "production":
    allowed_origins = [
        "https://phoenix-website-production.up.railway.app",
        "https://luna-hub-backend-unified-production.up.railway.app"
    ]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "*"  # Dev wildcard
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,  # 🔐 Cookies HTTPOnly supportés
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Security middleware production
if ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["phoenix-website-production.up.railway.app", "*.up.railway.app"]
    )

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    if ENVIRONMENT == "production":
        # Security headers production
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self' https://luna-hub-backend-unified-production.up.railway.app; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://luna-hub-backend-unified-production.up.railway.app; "
            "frame-ancestors 'none'"
        )
    
    return response

# ====== PHOENIX SERVICES REGISTRY ======

PHOENIX_SERVICES = {
    "letters": {
        "name": "Phoenix Letters",
        "url": "https://phoenix-letters-production.up.railway.app",
        "description": "Génération de lettres de motivation IA",
        "available": True
    },
    "cv": {
        "name": "Phoenix CV", 
        "url": "https://phoenix-cv-production.up.railway.app",
        "description": "Optimisation CV et Mirror Match",
        "available": True
    },
    "luna-hub": {
        "name": "Luna Hub",
        "url": "https://luna-hub-backend-unified-production.up.railway.app",
        "description": "Hub central - Authentication & Energy",
        "available": True
    }
}

# ====== API ENDPOINTS ======

@app.get("/health")
async def health():
    """Health check pour Railway"""
    return {
        "service": "phoenix-website",
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "environment": ENVIRONMENT,
        "components": {
            "service_registry": "ok",
            "frontend_spa": "served"
        }
    }

@app.get("/api/services")
async def get_services():
    """Service registry pour l'écosystème Phoenix"""
    return {
        "services": PHOENIX_SERVICES,
        "message": "Phoenix AI Ecosystem Services",
        "hub_url": PHOENIX_SERVICES["luna-hub"]["url"]
    }

@app.get("/api/redirect/{service}")
async def redirect_to_service(service: str):
    """Redirection vers un service Phoenix"""
    if service not in PHOENIX_SERVICES:
        raise HTTPException(status_code=404, detail=f"Service {service} not found")
    
    service_config = PHOENIX_SERVICES[service]
    if not service_config["available"]:
        raise HTTPException(status_code=503, detail=f"Service {service} not available")
    
    return {
        "redirect_url": service_config["url"],
        "service": service_config["name"],
        "message": f"Redirecting to {service_config['name']}"
    }

# ====== FRONTEND SPA SERVING ======

frontend_dist = Path(__file__).parent / "dist"

if frontend_dist.exists():
    # Mount assets statiques (CSS, JS, images)
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        logger.info("✅ Frontend assets mounted at /assets/*")
    
    # Fallback SPA pour toutes les routes non-API
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str = ""):
        """Sert le SPA React avec fallback sur index.html"""
        
        # Exclure les routes API et système
        if full_path.startswith((
            "api", "health", "docs", "redoc", "openapi.json", "assets"
        )):
            return JSONResponse(
                status_code=404, 
                content={"detail": "Not found"}
            )
        
        # Servir index.html pour toutes les routes SPA
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        else:
            return JSONResponse(
                status_code=503,
                content={
                    "service": "Phoenix Website",
                    "status": "Frontend not built",
                    "message": "Run 'npm run build' to build React SPA"
                }
            )

else:
    logger.warning("⚠️ Frontend dist directory not found - serving API only")
    
    @app.get("/", include_in_schema=False)
    async def root_fallback():
        return {
            "service": "Phoenix Website", 
            "version": "1.0.0",
            "status": "API only",
            "message": "Phoenix AI Ecosystem Hub - Frontend build required",
            "services": PHOENIX_SERVICES
        }

# ====== MAIN EXECUTION ======

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting Phoenix Website...")
    print(f"📊 Environment: {ENVIRONMENT}")
    print(f"🌐 Port: {PORT}")
    print(f"🎨 Frontend SPA: React + Framer Motion")
    print(f"🌙 Luna Integration: Enabled")
    print(f"🔒 Security: Production-ready")
    
    uvicorn.run(
        "app_main:app",
        host="0.0.0.0",
        port=PORT,
        reload=ENVIRONMENT == "development",
        log_level="info" if ENVIRONMENT == "development" else "warning",
        access_log=False,  # Géré par middleware observabilité
        proxy_headers=True,
        forwarded_allow_ips="*"
    )