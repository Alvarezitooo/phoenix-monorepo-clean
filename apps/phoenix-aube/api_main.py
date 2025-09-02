"""
🌅 Phoenix Aube - API Main
Career Discovery Service - Standalone Phoenix Application  
Production-ready FastAPI server with enterprise security
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import structlog
from datetime import datetime, timezone

# Configuration du path pour les imports locaux
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from api.aube_endpoints import router as aube_router
from api.routes.luna import router as luna_router
from core.security import ensure_request_is_clean

# Configuration structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger("phoenix_aube")

# Configuration environnement
ENVIRONMENT = os.getenv("RAILWAY_ENVIRONMENT", os.getenv("ENVIRONMENT", "development"))
PORT = int(os.getenv("PORT", "8001"))  # Railway auto-assigns port
HOST = os.getenv("HOST", "0.0.0.0")

# Détection production automatique
is_production = (
    ENVIRONMENT == "production" or 
    "railway.app" in os.getenv("RAILWAY_STATIC_URL", "") or
    "railway.app" in os.getenv("RAILWAY_PUBLIC_DOMAIN", "")
)

# Configuration CORS
if is_production:
    ALLOWED_ORIGINS = [
        "https://phoenix-website-production.up.railway.app",
        "https://phoenix-aube-frontend.up.railway.app",  # Future frontend Aube
        "https://aube.phoenix-ia.com"  # Domain personnalisé futur
    ]
    logger.info("Production CORS configured", origins=ALLOWED_ORIGINS)
else:
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    logger.info("Development CORS configured", origins=ALLOWED_ORIGINS)

# Configuration hosts autorisés
if is_production:
    ALLOWED_HOSTS = [
        "phoenix-aube-backend.up.railway.app",
        "aube-api.phoenix-ia.com",  # Domain API futur
        "localhost",  # Railway internal health checks
        "127.0.0.1",  # Railway internal health checks
        "0.0.0.0",    # Railway internal health checks
        "*"           # Temporary fix for Railway health checks
    ]
else:
    ALLOWED_HOSTS = ["*"]  # Développement permissif

# ============================================================================
# LIFESPAN EVENTS (Modern FastAPI)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern FastAPI lifespan management"""
    # Startup
    logger.info("Phoenix Aube starting up",
               version="1.0.0",
               environment=ENVIRONMENT,
               port=PORT,
               is_production=is_production)
    
    # TODO: Initialisation connexions DB/Cache si nécessaire
    # TODO: Chargement base de données métiers
    # TODO: Validation configuration algorithme matching
    
    logger.info("Phoenix Aube startup completed")
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("Phoenix Aube shutting down")
    
    # TODO: Fermeture connexions propres
    # TODO: Sauvegarde état si nécessaire
    
    logger.info("Phoenix Aube shutdown completed")


# ============================================================================
# CONFIGURATION FASTAPI
# ============================================================================

app = FastAPI(
    title="Phoenix Aube API",
    description="""
    🌅 **Phoenix Aube - Career Discovery Service**
    
    Service autonome de découverte carrière avec intelligence psychologique.
    
    ## 🎯 Fonctionnalités
    - **Assessment Psychologique** : 8 dimensions d'évaluation
    - **Matching Intelligent** : +500 métiers référencés
    - **Recommandations ML** : Algorithme propriétaire enterprise
    - **Pain Points Mapping** : Identification blocages carrière
    
    ## 🏗️ Architecture Oracle
    - **Standalone Service** : Application Phoenix indépendante
    - **Security First** : Validation fail-secure sur tous endpoints
    - **Event Sourcing** : Audit trail complet (futur Luna Hub)
    - **Scalable Design** : Ready pour charge enterprise
    
    ## 📊 Algorithme Matching
    Base de données métiers enrichie avec :
    - Compétences techniques requises
    - Soft skills valorisées  
    - Contexte géographique (France focus)
    - Tendances marché 2025
    - Parcours de transition suggérés
    """,
    version="1.0.0",
    contact={
        "name": "Phoenix Team",
        "email": "support@phoenix-ia.com",
    },
    license_info={
        "name": "Proprietary",
        "identifier": "Phoenix-Enterprise-License"
    },
    lifespan=lifespan
)

# ============================================================================
# MIDDLEWARES DE SÉCURITÉ
# ============================================================================

# Trusted Host Middleware (protection contre Host Header Injection)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=ALLOWED_HOSTS
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Request-ID",
        "X-Phoenix-Version"
    ],
    expose_headers=["X-Request-ID", "X-Phoenix-Service"],
    max_age=86400,  # Cache preflight 24h
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """🔒 Ajoute les headers de sécurité enterprise"""
    response = await call_next(request)
    
    # Headers de sécurité
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()"
    
    # CSP adapté pour API pure
    response.headers["Content-Security-Policy"] = (
        "default-src 'none'; "
        "script-src 'none'; "
        "style-src 'none'; "
        "img-src 'none'; "
        "connect-src 'none'; "
        "font-src 'none'; "
        "object-src 'none'; "
        "frame-src 'none'; "
        "frame-ancestors 'none'; "
        "base-uri 'none';"
    )
    
    # Headers de service
    response.headers["X-Phoenix-Service"] = "aube"
    response.headers["X-Service-Version"] = "1.0.0"
    
    return response


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """📝 Logging sécurisé des requêtes"""
    start_time = datetime.now(timezone.utc)
    
    # Génération Request ID unique
    request_id = f"aube-{int(start_time.timestamp())}-{hash(str(request.url))}"[:32]
    
    # Log requête entrante (données non-sensibles seulement)
    logger.info("Request received",
               request_id=request_id,
               method=request.method,
               path=request.url.path,
               query_params=str(request.query_params) if request.query_params else None,
               ip=request.client.host if request.client else "unknown",
               user_agent=request.headers.get("user-agent", "unknown")[:100])
    
    try:
        response = await call_next(request)
        
        # Calculer durée traitement
        end_time = datetime.now(timezone.utc)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log réponse
        logger.info("Request completed",
                   request_id=request_id,
                   status_code=response.status_code,
                   duration_ms=duration_ms)
        
        # Ajouter Request ID en header
        response.headers["X-Request-ID"] = request_id
        
        return response
        
    except Exception as e:
        # Log erreur
        end_time = datetime.now(timezone.utc)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        logger.error("Request failed",
                    request_id=request_id,
                    error=str(e),
                    duration_ms=duration_ms)
        
        raise


# ============================================================================
# ROUTES PRINCIPALES
# ============================================================================

# Inclusion des routers
app.include_router(aube_router)
app.include_router(luna_router)

# ============================================================================
# FRONTEND STATIC FILES (Production)
# ============================================================================

# Servir les fichiers statiques du frontend Next.js en production
if is_production:
    frontend_dir = Path(__file__).parent / "frontend"
    static_dir = frontend_dir / ".next" / "static"
    
    if static_dir.exists():
        # Mount Next.js static files
        app.mount("/_next/static", StaticFiles(directory=str(static_dir)), name="static")
        logger.info("Next.js static files mounted", path=str(static_dir))
    
    # Serve Next.js pages (if using standalone build)
    server_dir = frontend_dir / ".next" / "server"
    if server_dir.exists():
        logger.info("Next.js server files found", path=str(server_dir))

# Health check endpoint (Railway optimized)
@app.get("/health")
async def health_check():
    """Railway-optimized health check - GET only"""
    return {
        "status": "ok",
        "service": "phoenix-aube",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/aube/health")
async def aube_health_check():
    """Phoenix Aube specific health check for Railway configuration"""
    return {
        "status": "ok",
        "service": "phoenix-aube",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Root endpoint - Frontend HTML ou redirection
@app.get("/", include_in_schema=False)
async def root():
    """🌅 Phoenix Aube Frontend - Redirection ou page d'accueil"""
    # En production, servir une page HTML simple ou rediriger
    if is_production:
        html_content = """
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Phoenix Aube - Découverte de Carrière</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .container { max-width: 800px; margin: 0 auto; text-align: center; }
                h1 { font-size: 3rem; margin-bottom: 1rem; }
                p { font-size: 1.2rem; margin-bottom: 2rem; }
                .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin: 3rem 0; }
                .feature { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 10px; }
                .api-link { background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 5px; margin: 2rem 0; }
                a { color: #ffd700; text-decoration: none; font-weight: bold; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🌅 Phoenix Aube</h1>
                <p>Service de Découverte de Carrière avec Intelligence Psychologique</p>
                
                <div class="features">
                    <div class="feature">
                        <h3>Assessment Psychologique</h3>
                        <p>8 dimensions d'évaluation personnalisées</p>
                    </div>
                    <div class="feature">
                        <h3>Matching Intelligent</h3>
                        <p>+500 métiers référencés avec IA</p>
                    </div>
                    <div class="feature">
                        <h3>Luna Hub Integration</h3>
                        <p>Système d'énergie et authentification</p>
                    </div>
                </div>
                
                <div class="api-link">
                    <p>🔗 <a href="/docs">Documentation API</a> | <a href="/health">Status Santé</a></p>
                    <p>Version 1.0.0 | Status: Opérationnel</p>
                </div>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    else:
        # En développement, afficher les infos API
        return {
            "service": "Phoenix Aube",
            "description": "Career Discovery Service avec intelligence psychologique",
            "version": "1.0.0",
            "documentation": "/docs",
            "health": "/health",
            "features": {
                "psychological_assessment": "/aube/assessment",
                "career_recommendations": "/aube/recommendations/{user_id}",
                "matching_analytics": "/aube/analytics/matching-stats"
            },
            "status": "operational"
        }


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Gestion centralisée des erreurs HTTP"""
    logger.warning("HTTP exception occurred",
                  status_code=exc.status_code,
                  detail=str(exc.detail),
                  path=request.url.path)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "service": "phoenix-aube",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Gestion globale des erreurs non-gérées"""
    logger.error("Unhandled exception",
                error_type=type(exc).__name__,
                error_message=str(exc),
                path=request.url.path)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "message": "Une erreur inattendue s'est produite",
            "service": "phoenix-aube",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


# ============================================================================
# POINT D'ENTRÉE
# ============================================================================

if __name__ == "__main__":
    logger.info("Starting Phoenix Aube server",
               host=HOST,
               port=PORT,
               environment=ENVIRONMENT)
    
    uvicorn.run(
        "api_main:app",
        host=HOST,
        port=PORT,
        reload=not is_production,
        log_config=None,  # Utilise structlog
        access_log=False  # Géré par notre middleware
    )