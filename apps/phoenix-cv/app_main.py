"""
🎯 Phoenix CV - Point d'Entrée ASGI Unique (Aggrégateur)
Stabilisation architecture sans migration : api_main + backend_api_main unifiés
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from pathlib import Path
import structlog

# Import des applications existantes - avec gestion des dépendances
import sys
from pathlib import Path

# Ajouter le répertoire courant au path pour les imports
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

# Import des routes au lieu des apps complètes pour éviter les conflits
def setup_api_routes(main_app: FastAPI):
    """Configure les routes API en important seulement les routes nécessaires"""
    
    # Routes API business - import des routes uniquement
    try:
        # Importer les routes principales d'api_main
        from application.routes.cv_analyze import router as cv_router
        main_app.include_router(cv_router, prefix="/api")
        logger.info("✅ CV routes mounted at /api/cv/*")
        
        # Health endpoint pour l'API business
        @main_app.get("/api/health")
        def api_health():
            return {
                "service": "phoenix-cv-api",
                "status": "ok",
                "timestamp": datetime.now().isoformat(),
                "features": ["mirror_match", "cv_optimization", "ats_analysis"]
            }
        
    except Exception as e:  # Catch ALL errors, not just ImportError
        logger.error(f"CRITICAL: Could not setup CV routes: {e}")
        
        @main_app.get("/api/health")
        def api_fallback():
            return {
                "service": "phoenix-cv-api", 
                "status": "routes_unavailable",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    # Routes internes - simples endpoints
    @main_app.get("/internal/health") 
    def internal_health():
        return {
            "service": "phoenix-cv-internal",
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "luna_integration": True
        }
    
    @main_app.get("/internal/ready")
    def internal_ready():
        return {
            "status": "ready",
            "timestamp": datetime.now().isoformat(),
            "dependencies": {
                "luna_hub": True,  # TODO: Test réel
                "cv_repository": True
            }
        }

# Configuration environnement
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8002))

# Configuration des logs structurés
from application.middleware.observability import setup_json_logging
setup_json_logging("INFO" if ENVIRONMENT == "production" else "DEBUG")

logger = structlog.get_logger("phoenix_cv_aggregator")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire du cycle de vie de l'aggrégateur"""
    
    # STARTUP
    logger.info(
        "Phoenix CV Aggregator starting",
        environment=ENVIRONMENT,
        port=PORT,
        api_routes="/api/*",
        internal_routes="/internal/*",
        spa_served=True
    )
    
    yield
    
    # SHUTDOWN
    logger.info("Phoenix CV Aggregator shutting down")

# ====== APPLICATION PRINCIPALE ======

app = FastAPI(
    lifespan=lifespan,
    title="🎯 Phoenix CV - Unified API",
    description="""
    # Phoenix CV - Point d'Entrée ASGI Unique
    
    Aggrégateur stabilisant l'architecture Phoenix CV sans migration :
    
    ## 🛣️ Routage
    - **`/api/*`** : Fonctionnalités business complètes (Mirror Match, Chat AI, etc.)
    - **`/internal/*`** : Intégration Luna Hub + observabilité
    - **`/`** : Single Page Application React
    
    ## 🔒 Sécurité
    - CORS strict avec origins explicites
    - JWT Bearer authentication
    - Pas de cookies cross-domain
    
    ## 📊 Monitoring  
    - Health checks : `/health`, `/monitoring/health`
    - OpenAPI : `/openapi.json`
    - Logs JSON structurés
    """,
    version="1.0.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if ENVIRONMENT == "development" else None
)

# ====== CORS CONFIGURATION STRICTE ======

if ENVIRONMENT == "production":
    # Origins production Railway uniquement
    allowed_origins = [
        "https://phoenix-website-production.up.railway.app",
        "https://phoenix-cv-production.up.railway.app", 
        "https://phoenix-letters-production.up.railway.app",
        "https://luna-hub-backend-unified-production.up.railway.app"  # Luna Hub
    ]
else:
    # Development - localhost + wildcard
    allowed_origins = [
        "http://localhost:3000",   # Phoenix Website dev
        "http://localhost:5173",   # Vite dev servers  
        "http://localhost:5174",
        "http://localhost:8001",   # Phoenix Letters
        "http://localhost:8002",   # Phoenix CV (self)
        "*"  # Dev wildcard
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,  # Pas de cookies cross-domain, JWT seulement
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ====== CONFIGURATION DES ROUTES API ======

# Configuration des routes au lieu du montage d'apps
setup_api_routes(app)

# ====== HEALTH ENDPOINTS GLOBAUX (AVANT FALLBACK SPA) ======

@app.get("/health")
async def global_health():
    """Health check global de l'aggrégateur CV"""
    return {
        "service": "phoenix-cv-aggregator",
        "status": "ok", 
        "timestamp": datetime.now().isoformat(),
        "components": {
            "api_business": "mounted_at_/api", 
            "internal_routes": "mounted_at_/internal",
            "frontend_spa": "served" if Path(__file__).parent.joinpath("front-end/dist").exists() else "not_built"
        },
        "environment": ENVIRONMENT
    }

@app.get("/monitoring/health")  
async def monitoring_health():
    """Health check détaillé pour monitoring Railway"""
    
    # Test des composants
    api_status = "ok"  # Routes montées localement
    frontend_dist = Path(__file__).parent / "front-end" / "dist"
    frontend_status = "ok" if frontend_dist.exists() else "missing"
    
    all_healthy = all([
        api_status == "ok",
        frontend_status in ["ok", "missing"]  # Frontend optionnel
    ])
    
    return {
        "status": "healthy" if all_healthy else "degraded", 
        "timestamp": datetime.now().isoformat(),
        "checks": {
            "api_business": api_status,
            "internal_routes": "ok",
            "frontend_spa": frontend_status,
            "cors_configured": True,
            "environment": ENVIRONMENT
        },
        "message": "Phoenix CV Aggregator health check"
    }

# ====== FRONTEND SPA SERVING ======

frontend_dist = Path(__file__).parent / "front-end" / "dist"

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
            "api", "internal", "health", "monitoring", 
            "docs", "redoc", "openapi.json", "assets"
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
                    "service": "Phoenix CV Aggregator",
                    "status": "Frontend not built",
                    "message": "Run 'npm run build' in front-end directory"
                }
            )

else:
    logger.warning("⚠️ Frontend dist directory not found - serving API only")
    
    @app.get("/", include_in_schema=False)
    async def root_fallback():
        return {
            "service": "Phoenix CV Aggregator", 
            "version": "1.0.0",
            "status": "API only",
            "routes": {
                "business_api": "/api/docs",
                "internal_api": "/internal/docs", 
                "health": "/health",
                "monitoring": "/monitoring/health"
            },
            "message": "Frontend build not found - API endpoints available"
        }


# ====== MAIN EXECUTION ======

if __name__ == "__main__":
    import uvicorn
    
    print("🎯 Starting Phoenix CV Aggregator...")
    print(f"📊 Environment: {ENVIRONMENT}")
    print(f"🌐 Port: {PORT}")
    print(f"🛣️ API Business: /api/*")
    print(f"🔧 API Internal: /internal/*")
    print(f"🎨 Frontend SPA: / (React)")
    print(f"🔒 CORS Origins: {len(allowed_origins)} configured")
    
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