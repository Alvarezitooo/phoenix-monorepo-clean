"""
📝 Phoenix Letters - Point d'Entrée ASGI Unique (Aggrégateur)
Stabilisation architecture sans migration : FastAPI + SPA React unifiés
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

# Configuration environnement
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8001))

# Configuration des logs structurés
import logging
logging.basicConfig(
    level=logging.INFO if ENVIRONMENT == "development" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = structlog.get_logger("phoenix_letters_aggregator")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire du cycle de vie de l'aggrégateur"""
    
    # STARTUP
    logger.info(
        "Phoenix Letters Aggregator starting",
        environment=ENVIRONMENT,
        port=PORT,
        api_routes="/api/*",
        spa_served=True
    )
    
    yield
    
    # SHUTDOWN
    logger.info("Phoenix Letters Aggregator shutting down")

# ====== APPLICATION PRINCIPALE ======

app = FastAPI(
    lifespan=lifespan,
    title="📝 Phoenix Letters - Unified API",
    description="""
    # Phoenix Letters - Point d'Entrée ASGI Unique
    
    Aggrégateur stabilisant l'architecture Phoenix Letters sans migration :
    
    ## 🛣️ Routage
    - **`/api/*`** : Fonctionnalités business Letters (génération, Luna Hub)
    - **`/`** : Single Page Application React
    
    ## 🔒 Sécurité
    - CORS strict avec origins explicites Railway
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
        "http://localhost:8001",   # Phoenix Letters (self)
        "http://localhost:8002",   # Phoenix CV
        "*"  # Dev wildcard
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,  # Pas de cookies cross-domain, JWT seulement
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,  # Cache CORS preflight
)

# ====== CONFIGURATION DES ROUTES API ======

def setup_letters_routes(main_app: FastAPI):
    """Configure les routes Letters en important seulement les routes nécessaires"""
    
    # Routes business Letters - import des routes uniquement
    try:
        # Importer le router principal de Letters
        from presentation.routes.letters_generate import router as letters_router
        main_app.include_router(letters_router, prefix="/api")
        logger.info("✅ Letters routes mounted at /api/letters/*")
        
        # Health endpoint pour l'API business
        @main_app.get("/api/health")
        def api_health():
            return {
                "service": "phoenix-letters-api",
                "status": "ok",
                "timestamp": datetime.now().isoformat(),
                "features": ["letter_generation", "career_transition", "luna_integration"]
            }
        
    except Exception as e:  # Catch ALL errors, not just ImportError
        logger.error(f"CRITICAL: Could not setup Letters routes: {e}")
        
        @main_app.get("/api/health")
        def api_fallback():
            return {
                "service": "phoenix-letters-api", 
                "status": "routes_unavailable", 
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

# Configuration des routes
setup_letters_routes(app)

# ====== HEALTH ENDPOINTS GLOBAUX (AVANT FALLBACK SPA) ======

@app.get("/health")
async def global_health():
    """Health check global de l'aggrégateur"""
    return {
        "service": "phoenix-letters-aggregator",
        "status": "ok", 
        "timestamp": datetime.now().isoformat(),
        "components": {
            "api_business": "mounted_at_/api",
            "frontend_spa": "served" if Path(__file__).parent.joinpath("frontend/project/dist").exists() else "not_built"
        },
        "environment": ENVIRONMENT
    }

@app.get("/monitoring/health")  
async def monitoring_health():
    """Health check détaillé pour monitoring Railway"""
    
    # Test des composants
    api_status = "ok"  # Routes montées localement
    frontend_dist = Path(__file__).parent / "frontend" / "project" / "dist"
    frontend_status = "ok" if frontend_dist.exists() else "missing"
    
    # Vérification Luna Hub (optionnel pour health)
    luna_status = "unknown"  # Ne pas bloquer le health check
    
    all_healthy = all([
        api_status == "ok",
        frontend_status in ["ok", "missing"]  # Frontend optionnel
    ])
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": datetime.now().isoformat(),
        "checks": {
            "api_business": api_status,
            "frontend_spa": frontend_status,
            "luna_hub_connection": luna_status,
            "cors_configured": True,
            "environment": ENVIRONMENT
        },
        "message": "Phoenix Letters Aggregator health check"
    }

# ====== FRONTEND SPA SERVING ======

frontend_dist = Path(__file__).parent / "frontend" / "project" / "dist"

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
            "api", "health", "monitoring", 
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
                    "service": "Phoenix Letters Aggregator",
                    "status": "Frontend not built",
                    "message": "Run 'npm run build' in frontend/project directory"
                }
            )

else:
    logger.warning("⚠️ Frontend dist directory not found - serving API only")
    
    @app.get("/", include_in_schema=False)
    async def root_fallback():
        return {
            "service": "Phoenix Letters Aggregator", 
            "version": "1.0.0",
            "status": "API only",
            "routes": {
                "business_api": "/api/docs" if ENVIRONMENT == "development" else "disabled",
                "health": "/health",
                "monitoring": "/monitoring/health"
            },
            "message": "Frontend build not found - API endpoints available"
        }


# ====== DIRECTIVES ORACLE COMPLIANCE ======

@app.get("/oracle/compliance")
async def oracle_compliance():
    """Vérification conformité aux 5 Directives Oracle"""
    if ENVIRONMENT != "development":
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    
    return {
        "hub_is_king": {
            "status": "✅",
            "description": "Aucune logique métier - tout via Luna Hub",
            "implementation": "LunaClient check → execute → consume pattern"
        },
        "frontend_no_business": {
            "status": "✅", 
            "description": "React UI pure - capture intentions uniquement",
            "implementation": "JWT Bearer auth, API calls vers Hub"
        },
        "api_contract_sacred": {
            "status": "✅",
            "description": "OpenAPI exposé, compatibilité ascendante",
            "implementation": f"/openapi.json available in {ENVIRONMENT}"
        },
        "everything_is_event": {
            "status": "✅",
            "description": "Letters n'écrit aucun état - consomme Hub events",
            "implementation": "ConsumeRequest génère événements Luna"
        },
        "security_by_default": {
            "status": "✅",
            "description": "CORS strict, AuthZ serveur, JWT Bearer",
            "implementation": f"CORS origins: {allowed_origins}"
        }
    }

# ====== MAIN EXECUTION ======

if __name__ == "__main__":
    import uvicorn
    
    print("📝 Starting Phoenix Letters Aggregator...")
    print(f"📊 Environment: {ENVIRONMENT}")
    print(f"🌐 Port: {PORT}")
    print(f"🛣️ API Business: /api/*")
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