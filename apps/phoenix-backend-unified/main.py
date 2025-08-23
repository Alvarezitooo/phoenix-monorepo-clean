"""
🌙 Phoenix Backend Unified - Luna Hub Central
API centralisée pour tout l'écosystème Phoenix avec gestion énergie Luna
"""

import os
from datetime import datetime
from typing import Dict, Any
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Configuration logs structurés (doit être fait en premier)
from app.core.logging_config import logger, performance_logger, business_logger

# Import des modules Luna
from app.api.luna_endpoints import luna_router
from app.api.capital_narratif_endpoints import narratif_router
from app.api.billing_endpoints import router as billing_router
from app.api.refund_endpoints import router as refund_router
from app.api.monitoring_endpoints import router as monitoring_router
# Luna Session Zero - New endpoints
from app.api.auth_endpoints import router as auth_router
from app.api.luna_narrative_endpoints import router as luna_narrative_router
from app.middleware.security_middleware import security_middleware

# Load environment
load_dotenv()

# Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8003))  # Port distinct pour le hub Luna

# FastAPI app avec documentation Oracle-compliant
app = FastAPI(
    title="🌙 Phoenix Luna Hub",
    description="""
    # Hub Central pour l'Écosystème Phoenix
    
    API sécurisée conforme aux **Directives Oracle** pour la gestion de l'énergie Luna et du Capital Narratif.
    
    ## 🔒 Sécurité
    - **Security Guardian** intégré sur tous les endpoints
    - Validation stricte des inputs (anti-XSS, anti-injection SQL)
    - Rate limiting et authentification (Sprint 3)
    
    ## 🎯 Principes Architecturaux
    1. **Hub Central** : Toute logique métier réside ici
    2. **Event Sourcing** : Chaque action génère un événement immuable
    3. **API Contract** : Respect strict du contrat défini
    4. **Zero Frontend Logic** : Frontend = View + Controller uniquement
    5. **Security by Default** : Sécurité fondation, pas option
    
    ## 🌙 Gestion Luna Unlimited
    - Aucun décompte d'énergie pour les utilisateurs Unlimited
    - Événements toujours enregistrés pour Capital Narratif
    - Actions illimitées mais trackées pour analytics
    """,
    version="1.0.0",
    contact={
        "name": "Oracle Phoenix - Architecte",
        "email": "oracle@phoenix.ai"
    },
    license_info={
        "name": "Phoenix License",
        "url": "https://phoenix.ai/license"
    },
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if ENVIRONMENT == "development" else None,
    openapi_tags=[
        {
            "name": "Luna Energy Management",
            "description": "🔋 Gestion centrale de l'énergie Luna avec Security Guardian intégré"
        },
        {
            "name": "Health & Status",
            "description": "🏥 Endpoints de santé et monitoring du hub"
        },
        {
            "name": "Event Store",
            "description": "📚 Capital Narratif et Event Sourcing (Sprint 2)"
        },
        {
            "name": "Authentication", 
            "description": "🔐 Auth centralisée pour l'écosystème (Sprint 3)"
        },
        {
            "name": "Billing",
            "description": "💳 Facturation et paiements Stripe (Sprint 4)"
        }
    ]
)

# CORS - Configuration sécurisée
allowed_origins = [
    "http://localhost:3000",  # Phoenix Website
    "http://localhost:5173",  # Vite dev servers (Letters, CV)
    "http://localhost:5174", 
    "http://localhost:8001",  # Phoenix Letters
    "http://localhost:8002",  # Phoenix CV
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

# Security Middleware (Directive Oracle #5)
app.middleware("http")(security_middleware)

# Include Luna routers
app.include_router(luna_router)
app.include_router(narratif_router)
app.include_router(billing_router)
app.include_router(refund_router)
app.include_router(monitoring_router)  # Sprint 5 - Monitoring avancé
# Luna Session Zero routers
app.include_router(auth_router)
app.include_router(luna_narrative_router)

# Models de base
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str
    environment: str
    version: str
    luna_status: str

class ServiceInfoResponse(BaseModel):
    service: str
    description: str
    version: str
    status: str
    features: list
    environment: str

# ============================================================================
# ROUTES PRINCIPALES
# ============================================================================

@app.get("/", response_model=ServiceInfoResponse, tags=["Health & Status"])
async def root():
    """Information sur le service Luna Hub"""
    return ServiceInfoResponse(
        service="Phoenix Luna Hub",
        description="Hub central pour l'écosystème Phoenix avec gestion énergie Luna",
        version="1.0.0",
        status="operational",
        features=[
            "Gestion énergie Luna",
            "Event Store (Sprint 2)",
            "Billing Stripe (Sprint 4)", 
            "Auth centralisée (Sprint 3)",
            "APIs pour Letters/CV"
        ],
        environment=ENVIRONMENT
    )

@app.get("/health", response_model=HealthResponse, tags=["Health & Status"])
async def health_check():
    """Health check complet du hub Luna"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        service="phoenix-luna-hub",
        environment=ENVIRONMENT,
        version="1.0.0",
        luna_status="operational"
    )

# ============================================================================
# ENDPOINTS FUTURES (Sprints 2-4)
# ============================================================================

@app.get("/api/security/stats", tags=["Health & Status"])
async def security_stats():
    """📊 Statistiques de sécurité du Hub Luna"""
    return {
        "security_middleware": security_middleware.get_security_stats(),
        "oracle_compliance": {
            "directive_5": "Security by Default ✅",
            "rate_limiting": "Active ✅",
            "attack_detection": "Active ✅",
            "ip_protection": "Active ✅"
        }
    }

@app.get("/api/status", tags=["Health & Status"])
async def api_status():
    """Statut des fonctionnalités par sprint"""
    return {
        "sprint_1": {
            "status": "✅ Completed",
            "features": [
                "Luna Energy Management",
                "Energy consumption/purchase APIs",
                "Transaction tracking",
                "Energy analytics"
            ]
        },
        "sprint_2": {
            "status": "⏳ Next",
            "features": [
                "Supabase Event Store integration",
                "Security middleware",
                "Capital Narratif endpoints"
            ]
        },
        "sprint_3": {
            "status": "📋 Planned", 
            "features": [
                "Letters app integration",
                "CV app integration",
                "Real-time energy sync"
            ]
        },
        "sprint_4": {
            "status": "✅ Completed",
            "features": [
                "Stripe billing integration",
                "Payment intents & confirmation",
                "Refund guarantee system",
                "Bonus first purchase",
                "Phoenix Website billing page"
            ]
        },
        "sprint_5": {
            "status": "📋 Planned",
            "features": [
                "Production deployment",
                "CI/CD pipeline",
                "Beta user management"
            ]
        }
    }

# ============================================================================
# HANDLERS D'ERREUR
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": "endpoint_not_found",
            "message": "L'endpoint demandé n'existe pas dans Luna Hub",
            "available_endpoints": [
                "/docs - Documentation API",
                "/health - Health check",
                "/luna/* - Endpoints énergie Luna"
            ]
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "internal_server_error",
            "message": "Erreur interne du hub Luna",
            "timestamp": datetime.now().isoformat()
        }
    )

# ============================================================================
# STARTUP & MAIN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialisation du hub Luna avec logs structurés"""
    logger.info(
        "Phoenix Luna Hub starting",
        environment=ENVIRONMENT,
        port=PORT,
        sprint="2",
        oracle_compliant=True
    )
    
    # Vérifications de santé au démarrage
    from app.core.supabase_client import event_store
    supabase_health = await event_store.health_check()
    
    logger.info(
        "Luna Hub initialization complete",
        energy_manager="ready",
        event_store_status=supabase_health["status"],
        security_middleware="active",
        structured_logs="configured"
    )
    
    business_logger.log_user_onboarding("system", "startup")

@app.on_event("shutdown")
async def shutdown_event():
    """Arrêt propre du hub Luna avec logs structurés"""
    logger.info(
        "Phoenix Luna Hub shutting down",
        environment=ENVIRONMENT,
        graceful_shutdown=True
    )

if __name__ == "__main__":
    import uvicorn
    
    print("🌙 Starting Phoenix Luna Hub...")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=ENVIRONMENT == "development",
        log_level="info" if ENVIRONMENT == "development" else "warning"
    )
