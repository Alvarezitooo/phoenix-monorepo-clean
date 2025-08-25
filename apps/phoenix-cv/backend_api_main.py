"""
🎯 Phoenix CV - API Main avec intégration Luna Hub
FastAPI backend avec middleware observabilité et corrélation bout-en-bout
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from datetime import datetime
import structlog

# Configuration logs structurés
from application.middleware.observability import setup_json_logging, ObservabilityMiddleware

# Import des routes
from application.routes.cv_analyze import router as cv_router

# Configuration environnement
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8002))  # Port distinct pour Phoenix CV
LUNA_HUB_URL = os.getenv("LUNA_HUB_URL", "https://luna-hub-backend-unified-production.up.railway.app")

# Configuration des logs structurés
setup_json_logging("INFO" if ENVIRONMENT == "production" else "DEBUG")

# Logger principal
logger = structlog.get_logger("phoenix_cv")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager pour startup/shutdown"""
    # STARTUP
    logger.info(
        "Phoenix CV API starting",
        environment=ENVIRONMENT,
        port=PORT,
        luna_hub_url=LUNA_HUB_URL,
        service_version="1.0.0"
    )
    
    # Test de connectivité Luna Hub au démarrage
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{LUNA_HUB_URL}/health")
            luna_status = "connected" if (200 <= response.status_code < 300) else "disconnected"
    except Exception as e:
        logger.warning("Luna Hub connection failed at startup", error=str(e))
        luna_status = "disconnected"
    
    logger.info(
        "Phoenix CV API initialization complete",
        middleware_status="active",
        luna_hub_status=luna_status,
        cors_origins=len(allowed_origins),
        docs_enabled=(ENVIRONMENT == "development")
    )
    
    yield
    
    # SHUTDOWN
    logger.info(
        "Phoenix CV API shutting down",
        environment=ENVIRONMENT,
        graceful_shutdown=True
    )

# FastAPI app avec documentation
app = FastAPI(
    lifespan=lifespan,
    title="🎯 Phoenix CV API",
    description="""
    # Phoenix CV - API d'Optimisation CV Intelligente
    
    API sécurisée intégrée au **Luna Hub** pour l'analyse et l'optimisation de CV.
    
    ## 🔒 Architecture Oracle
    - **Hub Central** : Luna Hub gère toute la logique énergie
    - **API Contract** : Respect strict check → execute → consume
    - **Zero Frontend Logic** : CV = pure business logic uniquement
    - **Everything is Event** : Chaque action génère un événement Luna
    - **Security by Default** : Middleware sécurisé + corrélation
    
    ## 🎯 Fonctionnalités
    - **Analyse CV Complète** : Scoring ATS, recommandations, highlights
    - **Optimisation CV** : Suggestions d'amélioration ciblées
    - **Mirror Match** : Correspondance CV-Offre avec IA
    - **Analyse Salariale** : Benchmarking marché par localisation
    
    ## 🌙 Gestion Luna
    - Vérification énergie automatique avant chaque action
    - Consommation trackée dans le Capital Narratif
    - Support Luna Unlimited (actions illimitées)
    
    ## 📊 Observabilité
    - Logs JSON structurés conformes schéma unifié v1.0
    - Corrélation bout-en-bout avec X-Request-ID
    - Métriques business et performance
    """,
    version="1.0.0",
    contact={
        "name": "Phoenix CV Team",
        "email": "cv@phoenix.ai"
    },
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if ENVIRONMENT == "development" else None,
    openapi_tags=[
        {
            "name": "cv",
            "description": "🎯 Endpoints d'analyse et optimisation CV"
        },
        {
            "name": "health",
            "description": "🏥 Endpoints de santé et monitoring"
        }
    ]
)

# CORS - Configuration sécurisée
allowed_origins = [
    "http://localhost:3000",  # Phoenix Website
    "http://localhost:5173",  # Vite dev servers
    "http://localhost:5174",
    "http://localhost:8001",  # Phoenix Letters
    "http://localhost:8002",  # Phoenix CV frontend
]

if ENVIRONMENT == "development":
    allowed_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Middleware d'observabilité (MUST BE BEFORE ROUTES)
app.add_middleware(ObservabilityMiddleware, service_name="phoenix-cv")

# Include routers
app.include_router(cv_router)

# ====== ENDPOINTS PRINCIPAUX ======

@app.get("/", tags=["health"])
async def root():
    """Information sur le service Phoenix CV"""
    return {
        "service": "Phoenix CV API",
        "description": "API d'optimisation CV intelligente intégrée au Luna Hub",
        "version": "1.0.0",
        "status": "operational",
        "features": [
            "Analyse CV complète",
            "Optimisation ATS",
            "Mirror Match CV-Offre",
            "Analyse salariale",
            "Intégration Luna Hub"
        ],
        "environment": ENVIRONMENT,
        "luna_hub": LUNA_HUB_URL
    }

@app.get("/health", tags=["health"])
async def health_check():
    """Simple health check"""
    return {"status": "ok", "service": "phoenix-cv", "timestamp": datetime.now().isoformat()}

@app.get("/ready", tags=["health"])
async def readiness_check():
    """
    Readiness check avec vérification des dépendances
    """
    dependencies = {}
    
    # Test Luna Hub
    try:
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{LUNA_HUB_URL}/health")
            dependencies["luna_hub"] = (200 <= response.status_code < 300)
    except:
        dependencies["luna_hub"] = False
    
    # Test autres dépendances
    dependencies.update({
        "cv_repository": True,  # Mock toujours OK
        "mirror_match_service": True,
        "observability_middleware": True
    })
    
    all_healthy = all(dependencies.values())
    status = "ready" if all_healthy else "degraded"
    
    return {
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "dependencies": dependencies,
        "critical_deps": ["luna_hub"]
    }

# ====== EXCEPTION HANDLERS ======

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handler pour erreurs de validation Pydantic"""
    logger.warning("Request validation error", 
                   path=request.url.path,
                   errors=exc.errors())
    
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "validation_error",
            "message": "Données de requête invalides",
            "details": exc.errors(),
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    """Handler pour exceptions HTTP génériques"""
    logger.error("HTTP exception",
                path=request.url.path,
                status_code=exc.status_code,
                detail=str(exc.detail))
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": "http_error",
            "message": str(exc.detail),
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    """Handler pour erreurs serveur 500"""
    logger.error("Internal server error",
                path=request.url.path,
                error=str(exc))
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "internal_server_error",
            "message": "Erreur interne du serveur CV",
            "timestamp": datetime.now().isoformat()
        }
    )

# ====== LIFESPAN EVENTS (MIGRATED ABOVE) ======

# ====== MAIN ======

if __name__ == "__main__":
    import uvicorn
    
    print("🎯 Starting Phoenix CV API...")
    print(f"🌙 Luna Hub: {LUNA_HUB_URL}")
    print(f"📊 Logs: JSON structured")
    print(f"🔒 CORS: {len(allowed_origins)} origins allowed")
    
    uvicorn.run(
        "backend_api_main:app",
        host="0.0.0.0",
        port=PORT,
        reload=ENVIRONMENT == "development",
        log_level="info" if ENVIRONMENT == "development" else "warning",
        access_log=False  # Géré par notre middleware
    )