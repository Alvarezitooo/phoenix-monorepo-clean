"""
🔥 Phoenix CV API - FastAPI
Clean Architecture exposée via API REST - Game Changer Features
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path
import os
import structlog

# Configuration Luna Hub
LUNA_HUB_URL = os.getenv("LUNA_HUB_URL", "https://luna-hub-backend-unified-production.up.railway.app")

# Import de notre Clean Architecture
from shared.config.settings import config
from shared.exceptions.business_exceptions import (
    PhoenixCVException, 
    ValidationError, 
    QuotaExceededError,
    AIServiceError,
    CVNotFoundError,
    OptimizationError
)

# Middleware Luna Hub
from application.middleware.observability import ObservabilityMiddleware, setup_json_logging

# Use Cases (Business Logic)
from application.use_cases.mirror_match_use_case import (
    MirrorMatchUseCase, 
    MirrorMatchCommand,
    MirrorMatchResult
)

# Infrastructure
from infrastructure.ai.cv_gemini_service import CVGeminiService
from infrastructure.ai.chat_ai_service import ChatAIService
from infrastructure.ai.salary_ai_service import SalaryAIService
from infrastructure.integrations.linkedin_service import LinkedInService
from infrastructure.database.mock_cv_repository import MockCVRepository
from domain.services.mirror_match_service import MirrorMatchService
from domain.entities.chat_conversation import ChatConversation, ConversationContext, ChatMessage
from domain.entities.salary_analysis import SalaryAnalysisResult
from domain.entities.linkedin_integration import LinkedInIntegrationResult, LinkedInConnection

# DTOs pour l'API
from pydantic import BaseModel, Field
from enum import Enum

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================================================
# DTOs ET MODÈLES PYDANTIC
# =============================================================================

class CVStatus(str, Enum):
    DRAFT = "draft"
    OPTIMIZED = "optimized" 
    ATS_READY = "ats_ready"
    PUBLISHED = "published"


class MirrorMatchRequest(BaseModel):
    cv_id: str = Field(..., description="ID du CV à analyser")
    job_description: str = Field(..., min_length=50, max_length=10000, description="Description de l'offre d'emploi")
    job_title: Optional[str] = Field(None, max_length=200, description="Titre du poste")
    company_name: Optional[str] = Field(None, max_length=200, description="Nom de l'entreprise")
    industry: Optional[str] = Field(None, max_length=100, description="Secteur d'activité")
    
    # Options avancées
    include_salary_insights: bool = Field(True, description="Inclure analyse salariale")
    include_culture_fit: bool = Field(True, description="Inclure analyse fit culturel")


class CVOptimizationRequest(BaseModel):
    cv_id: str = Field(..., description="ID du CV à optimiser")
    optimization_type: str = Field("comprehensive", description="Type d'optimisation")
    target_job_title: Optional[str] = Field(None, description="Poste cible pour optimisation")
    target_industry: Optional[str] = Field(None, description="Secteur cible")
    focus_areas: List[str] = Field(default_factory=list, description="Domaines focus")


class ATSAnalysisRequest(BaseModel):
    cv_id: str = Field(..., description="ID du CV pour analyse ATS")
    target_ats_system: str = Field("generic", description="Système ATS ciblé")
    optimization_level: str = Field("standard", description="Niveau d'optimisation")


class MirrorMatchResponse(BaseModel):
    success: bool
    analysis_id: Optional[str] = None
    overall_compatibility: Optional[float] = None
    match_type: Optional[str] = None
    processing_time_ms: int = 0
    
    # Résumé exécutif
    executive_summary: Dict[str, Any] = Field(default_factory=dict)
    
    # Détails complets
    detailed_analysis: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class CVOptimizationResponse(BaseModel):
    success: bool
    optimization_id: Optional[str] = None
    current_score: Optional[float] = None
    optimized_score: Optional[float] = None
    improvement_percentage: Optional[float] = None
    
    # Suggestions d'amélioration
    suggestions: List[Dict[str, Any]] = Field(default_factory=list)
    priority_fixes: List[str] = Field(default_factory=list)
    
    error_message: Optional[str] = None


# =============================================================================
# CHAT AI DTOs - NOUVELLE FEATURE RÉVOLUTIONNAIRE 🤖
# =============================================================================

class ChatStartRequest(BaseModel):
    user_id: str = Field(..., description="ID utilisateur")
    context: str = Field("general", description="Contexte de conversation")
    personality: str = Field("professional", description="Personnalité IA")
    cv_id: Optional[str] = Field(None, description="ID CV actuel")
    user_profile: Dict[str, Any] = Field(default_factory=dict, description="Profil utilisateur")


class ChatMessageRequest(BaseModel):
    conversation_id: str = Field(..., description="ID conversation")
    message: str = Field(..., min_length=1, max_length=2000, description="Message utilisateur")
    cv_id: Optional[str] = Field(None, description="ID CV contextuel")


class ChatResponse(BaseModel):
    success: bool
    conversation_id: str
    message_id: Optional[str] = None
    ai_response: Optional[str] = None
    suggestions: List[str] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    context_changed: bool = False
    new_context: Optional[str] = None
    response_time_ms: int = 0
    error_message: Optional[str] = None


class ConversationListResponse(BaseModel):
    success: bool
    conversations: List[Dict[str, Any]] = Field(default_factory=list)
    total_count: int = 0
    active_count: int = 0


# =============================================================================
# SALARY ANALYSIS DTOs - NOUVELLE FEATURE RÉVOLUTIONNAIRE 💰
# =============================================================================

class SalaryAnalysisRequest(BaseModel):
    user_id: str = Field(..., description="ID utilisateur")
    cv_id: str = Field(..., description="ID du CV à analyser")
    target_role: Optional[str] = Field(None, description="Poste cible pour l'analyse")
    target_location: str = Field("france", description="Localisation cible")
    current_salary: Optional[float] = Field(None, description="Salaire actuel (optionnel)")


class SalaryAnalysisResponse(BaseModel):
    success: bool
    analysis_id: Optional[str] = None
    
    # Résultats principaux
    salary_range: Optional[Dict[str, float]] = None  # min, max, median
    recommended_ask: Optional[float] = None
    market_position: Optional[str] = None  # below, at, above_market
    
    # Insights
    market_insights: List[Dict[str, Any]] = Field(default_factory=list)
    negotiation_tips: List[Dict[str, Any]] = Field(default_factory=list)
    skill_premiums: Dict[str, float] = Field(default_factory=dict)
    
    # Métadonnées
    confidence_score: float = 0.0
    analysis_date: Optional[str] = None
    processing_time_ms: int = 0
    
    error_message: Optional[str] = None


# =============================================================================
# LINKEDIN INTEGRATION DTOs - NOUVELLE FEATURE RÉVOLUTIONNAIRE 🔗
# =============================================================================

class LinkedInAuthRequest(BaseModel):
    user_id: str = Field(..., description="ID utilisateur")
    return_url: Optional[str] = Field(None, description="URL de retour après auth")


class LinkedInCallbackRequest(BaseModel):
    code: str = Field(..., description="Code d'autorisation LinkedIn")
    state: str = Field(..., description="État de sécurité")
    error: Optional[str] = Field(None, description="Erreur OAuth")


class LinkedInSyncRequest(BaseModel):
    user_id: str = Field(..., description="ID utilisateur")
    sections: List[str] = Field(default_factory=lambda: ["basic_info", "experience", "education", "skills"])
    cv_id: Optional[str] = Field(None, description="ID CV pour synchronisation croisée")


class LinkedInResponse(BaseModel):
    success: bool
    connection_id: Optional[str] = None
    auth_url: Optional[str] = None
    
    # Données de profil
    profile_data: Optional[Dict[str, Any]] = None
    sync_results: Optional[Dict[str, Any]] = None
    
    # Analyse
    completeness_score: float = 0.0
    cv_match_score: float = 0.0
    recommendations: List[str] = Field(default_factory=list)
    
    # Métadonnées
    last_sync: Optional[str] = None
    processing_time_ms: int = 0
    
    error_message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    services: Dict[str, Any]


# =============================================================================
# SERVICES CONTAINER (DEPENDENCY INJECTION)
# =============================================================================

class ServicesContainer:
    """Container pour l'injection de dépendances"""
    
    def __init__(self):
        self.ai_service = None
        self.cv_repository = None
        self.mirror_match_service = None
        self.mirror_match_use_case = None
        self.optimize_cv_use_case = None
    
    async def initialize(self):
        """Initialise tous les services"""
        
        logger.info("🚀 Initialisation des services Phoenix CV...")
        
        # Services infrastructure
        self.ai_service = CVGeminiService()
        self.cv_repository = MockCVRepository()
        
        # Services domaine
        self.mirror_match_service = MirrorMatchService(self.ai_service)
        self.chat_ai_service = ChatAIService()
        self.salary_ai_service = SalaryAIService()
        self.linkedin_service = LinkedInService()
        
        # Use Cases
        self.mirror_match_use_case = MirrorMatchUseCase(
            self.cv_repository,
            self.mirror_match_service
        )
        
        # TODO: Implémenter OptimizeCVUseCase
        # self.optimize_cv_use_case = OptimizeCVUseCase(...)
        
        # Chat AI - Conversations en mémoire (TODO: persister en DB)
        self.active_conversations: Dict[str, ChatConversation] = {}
        
        # LinkedIn - Connexions en mémoire (TODO: persister en DB)
        self.linkedin_connections: Dict[str, LinkedInConnection] = {}
        
        logger.info("✅ Services Phoenix CV initialisés")


# Instance globale du container
services_container = ServicesContainer()


# =============================================================================
# LIFECYCLE MANAGEMENT
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire du cycle de vie de l'application"""
    
    # Startup - Configuration logs structurés
    setup_json_logging("INFO" if os.getenv("ENVIRONMENT") == "production" else "DEBUG")
    
    # Test connectivité Luna Hub au démarrage
    luna_status = "disconnected"
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{LUNA_HUB_URL}/health")
            luna_status = "connected" if (200 <= response.status_code < 300) else "disconnected"
    except Exception as e:
        structlog.get_logger().warning("Luna Hub connection failed at startup", error=str(e))
    
    await services_container.initialize()
    structlog.get_logger().info(
        "🔥 Phoenix CV API démarrée",
        luna_hub_url=LUNA_HUB_URL,
        luna_hub_status=luna_status
    )
    
    yield
    
    # Shutdown
    logger.info("👋 Arrêt Phoenix CV API")


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="🔥 Phoenix CV API",
    description="API REST pour optimisation CV et Mirror Match avec IA - Game Changer Features",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS pour le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.app.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware d'observabilité Luna Hub (MUST BE AFTER CORS)
app.add_middleware(ObservabilityMiddleware, service_name="phoenix-cv")

# Configuration Frontend Static Files (si disponible) 
static_dir = Path(__file__).parent / "front-end" / "dist"
if static_dir.exists():
    # Mount assets directory for CSS/JS files
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    # Serve index.html for SPA routes
    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str = ""):
        # Don't serve index.html for API routes
        if full_path.startswith(("api", "health", "docs", "openapi.json", "assets")):
            raise HTTPException(status_code=404, detail="Not found")
        
        index_file = static_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        else:
            return {"message": "Phoenix CV API", "version": "1.0.0", "docs": "/docs"}
else:
    logger.warning("⚠️ Frontend dist directory not found - serving API only")


# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================

@app.exception_handler(PhoenixCVException)
async def phoenix_exception_handler(request, exc: PhoenixCVException):
    return JSONResponse(
        status_code=400,
        content=exc.to_dict()
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content=exc.to_dict()
    )


@app.exception_handler(CVNotFoundError)
async def cv_not_found_handler(request, exc: CVNotFoundError):
    return JSONResponse(
        status_code=404,
        content=exc.to_dict()
    )


@app.exception_handler(QuotaExceededError)
async def quota_exceeded_handler(request, exc: QuotaExceededError):
    return JSONResponse(
        status_code=429,
        content=exc.to_dict()
    )


# =============================================================================
# ENDPOINTS - HEALTH & STATUS
# =============================================================================

@app.get("/health")
async def health_check():
    """Railway-optimized health check - GET only"""
    return {
        "status": "ok",
        "service": "phoenix-cv",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/railway-health")  
async def railway_health_check():
    """Dedicated Railway health endpoint - Industry Standard 2024"""
    return {"status": "ok"}

@app.get("/health-full", response_model=HealthResponse, tags=["Health"])
async def health_check_full():
    """Health check complet des services"""
    
    health_data = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {}
    }
    
    try:
        # Vérification service IA
        if services_container.ai_service:
            ai_health = await services_container.ai_service.health_check()
            health_data["services"]["ai"] = ai_health
        else:
            health_data["services"]["ai"] = {"status": "unavailable"}
        
        # Vérification repository
        if services_container.cv_repository:
            repo_stats = services_container.cv_repository.get_stats()
            health_data["services"]["database"] = {
                "status": "healthy",
                "type": "mock",
                **repo_stats
            }
        
        # Vérification Luna Hub
        try:
            import httpx
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(f"{LUNA_HUB_URL}/health")
                health_data["services"]["luna_hub"] = {
                    "status": "healthy" if (200 <= response.status_code < 300) else "degraded",
                    "url": LUNA_HUB_URL,
                    "response_time_ms": response.elapsed.total_seconds() * 1000 if response.elapsed else 0
                }
        except Exception as e:
            health_data["services"]["luna_hub"] = {
                "status": "unhealthy", 
                "url": LUNA_HUB_URL,
                "error": str(e)
            }
        
        # Configuration
        health_data["services"]["configuration"] = {
            "environment": config.app.environment,
            "features": config.get_feature_config(),
            "is_valid": config.is_valid
        }
        
        # Statut global
        unhealthy_services = [
            name for name, service in health_data["services"].items()
            if service.get("status") != "healthy"
        ]
        
        if unhealthy_services:
            health_data["status"] = "degraded"
            health_data["issues"] = unhealthy_services
        
        return health_data
        
    except Exception as e:
        logger.error(f"❌ Erreur health check: {e}")
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.now().isoformat(),
            version="1.0.0",
            services={"error": str(e)}
        )


@app.get("/", tags=["Root"])
async def root():
    """Point d'entrée de l'API"""
    
    return {
        "message": "🔥 Phoenix CV API - Game Changer Features",
        "version": "1.0.0",
        "status": "operational",
        "features": [
            "🎯 Mirror Match Engine - CV-Job compatibility analysis",
            "📊 ATS Optimization - Boost your CV for applicant tracking systems", 
            "🏗️ AI Trajectory Builder - Career path optimization",
            "🤖 Smart CV Enhancement - AI-powered content improvement"
        ],
        "documentation": "/docs",
        "health": "/health"
    }


# =============================================================================
# ENDPOINTS - MIRROR MATCH (GAME CHANGER #1)
# =============================================================================

@app.post("/api/cv/mirror-match", 
         response_model=MirrorMatchResponse,
         tags=["Mirror Match"],
         summary="🎯 Mirror Match Analysis - GAME CHANGER")
async def analyze_mirror_match(request: MirrorMatchRequest):
    """
    🎯 **MIRROR MATCH ENGINE - GAME CHANGER**
    
    Analyse la compatibilité entre un CV et une offre d'emploi avec IA avancée.
    
    **Features révolutionnaires:**
    - Analyse IA des compétences avec Gemini
    - Score de compatibilité détaillé (0-100%)
    - Recommandations d'optimisation personnalisées
    - Prédictions de succès de candidature
    - Analyse de fit culturel
    
    **Perfect pour:**
    - Ciblage intelligent des candidatures
    - Optimisation CV pour poste spécifique
    - Stratégie de recherche d'emploi data-driven
    """
    
    try:
        # Création de la commande Use Case
        command = MirrorMatchCommand(
            cv_id=request.cv_id,
            job_description_text=request.job_description,
            job_title=request.job_title or "",
            company_name=request.company_name or "",
            industry=request.industry or "",
            include_salary_insights=request.include_salary_insights,
            include_culture_fit=request.include_culture_fit,
            analysis_source="api"
        )
        
        # Exécution de l'analyse
        logger.info(f"🎯 Démarrage Mirror Match pour CV {request.cv_id}")
        result = await services_container.mirror_match_use_case.execute(command)
        
        # Formatage de la réponse
        response = MirrorMatchResponse(
            success=result.success,
            processing_time_ms=result.processing_time_ms
        )
        
        if result.success and result.analysis:
            response.analysis_id = result.analysis.id
            response.overall_compatibility = result.analysis.overall_compatibility
            response.match_type = result.analysis.match_type.value
            response.executive_summary = result.executive_summary
            response.detailed_analysis = result.analysis.to_dict()
            
            logger.info(f"✅ Mirror Match terminé - Score: {result.analysis.overall_compatibility}%")
        else:
            response.error_message = result.error_message
            logger.error(f"❌ Erreur Mirror Match: {result.error_message}")
        
        return response
        
    except ValidationError as e:
        logger.warning(f"❌ Validation Mirror Match: {e}")
        raise e
        
    except Exception as e:
        logger.error(f"❌ Erreur inattendue Mirror Match: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erreur interne lors de l'analyse Mirror Match"
        )


@app.get("/api/cv/{cv_id}/mirror-matches",
         tags=["Mirror Match"],
         summary="Historique des analyses Mirror Match")
async def get_mirror_match_history(cv_id: str, limit: int = 10):
    """Récupère l'historique des analyses Mirror Match pour un CV"""
    
    try:
        analyses = await services_container.mirror_match_use_case.get_analysis_history(cv_id, limit)
        
        return {
            "cv_id": cv_id,
            "analyses_count": len(analyses),
            "analyses": [
                {
                    "id": analysis.id,
                    "overall_compatibility": analysis.overall_compatibility,
                    "match_type": analysis.match_type.value,
                    "created_at": analysis.created_at.isoformat(),
                    "job_title": getattr(analysis, 'job_title', 'Unknown'),
                    "company": getattr(analysis, 'company_name', 'Unknown')
                }
                for analysis in analyses
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur récupération historique: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# ENDPOINTS - CV OPTIMIZATION (GAME CHANGER #2) 
# =============================================================================

@app.post("/api/cv/optimize",
         response_model=CVOptimizationResponse,
         tags=["CV Optimization"],
         summary="🔥 CV Optimization avec IA")
async def optimize_cv(request: CVOptimizationRequest):
    """
    🔥 **CV OPTIMIZATION ENGINE**
    
    Optimise un CV avec l'IA pour maximiser l'impact et la compatibilité ATS.
    
    **Features:**
    - Analyse complète du contenu CV
    - Suggestions d'amélioration personnalisées
    - Optimisation mots-clés pour ATS
    - Quantification des réalisations
    - Enhancement de l'impact professionnel
    """
    
    try:
        # Pour l'instant, simulation de l'optimisation
        # TODO: Implémenter OptimizeCVUseCase complet
        
        cv = await services_container.cv_repository.get_cv_by_id(request.cv_id)
        if not cv:
            raise CVNotFoundError(request.cv_id)
        
        # Analyse basique avec service IA
        cv_content = cv.to_dict()
        optimization_result = await services_container.ai_service.analyze_cv_optimization(
            cv_content,
            target_job={"job_title": request.target_job_title} if request.target_job_title else None
        )
        
        # Formatage de la réponse
        analysis = optimization_result.get("cv_optimization", {})
        overall_assessment = analysis.get("overall_assessment", {})
        
        response = CVOptimizationResponse(
            success=True,
            current_score=overall_assessment.get("current_score", 0),
            optimized_score=overall_assessment.get("potential_score", 0),
            suggestions=[
                {
                    "category": improvement.get("section", "general"),
                    "title": improvement.get("reasoning", ""),
                    "current": improvement.get("current", ""),
                    "improved": improvement.get("improved", ""),
                    "impact": improvement.get("impact", "medium")
                }
                for improvement in analysis.get("content_improvements", [])
            ],
            priority_fixes=analysis.get("next_steps", [])[:5]
        )
        
        if response.current_score and response.optimized_score:
            response.improvement_percentage = round(
                ((response.optimized_score - response.current_score) / response.current_score) * 100, 1
            )
        
        logger.info(f"✅ CV optimisé: {request.cv_id} - Score: {response.current_score}→{response.optimized_score}")
        return response
        
    except CVNotFoundError:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur optimisation CV: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'optimisation CV")


# =============================================================================
# ENDPOINTS - ATS ANALYSIS (GAME CHANGER #3)
# =============================================================================

@app.post("/api/cv/ats-analysis",
         tags=["ATS Analysis"], 
         summary="📊 Analyse compatibilité ATS")
async def analyze_ats_compatibility(request: ATSAnalysisRequest):
    """
    📊 **ATS COMPATIBILITY ANALYSIS**
    
    Analyse la compatibilité d'un CV avec les systèmes de tracking (ATS).
    
    **Features:**
    - Score de compatibilité ATS détaillé
    - Identification des problèmes de format
    - Suggestions d'optimisation ATS
    - Support multi-systèmes (Workday, Greenhouse, etc.)
    """
    
    try:
        cv = await services_container.cv_repository.get_cv_by_id(request.cv_id)
        if not cv:
            raise CVNotFoundError(request.cv_id)
        
        # Analyse ATS avec service IA
        cv_content = cv.to_dict()
        ats_analysis = await services_container.ai_service.generate_ats_suggestions(
            cv_content,
            request.target_ats_system
        )
        
        # Formatage réponse
        analysis_data = ats_analysis.get("ats_analysis", {})
        
        return {
            "success": True,
            "cv_id": request.cv_id,
            "ats_system": request.target_ats_system,
            "compatibility_score": analysis_data.get("compatibility_score", 0),
            "score_breakdown": analysis_data.get("score_breakdown", {}),
            "critical_issues": [
                {
                    "issue": fix.get("issue", ""),
                    "solution": fix.get("solution", ""),
                    "impact": fix.get("impact", "medium"),
                    "difficulty": fix.get("difficulty", "medium")
                }
                for fix in analysis_data.get("critical_fixes", [])
            ],
            "optimization_suggestions": analysis_data.get("optimization_suggestions", []),
            "ats_tips": analysis_data.get("ats_specific_tips", {}).get(request.target_ats_system, [])
        }
        
    except CVNotFoundError:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur analyse ATS: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'analyse ATS")


# =============================================================================
# ENDPOINTS - CV MANAGEMENT
# =============================================================================

@app.get("/api/cv/{cv_id}",
         tags=["CV Management"],
         summary="Récupérer un CV")
async def get_cv(cv_id: str):
    """Récupère les détails d'un CV"""
    
    try:
        cv = await services_container.cv_repository.get_cv_by_id(cv_id)
        if not cv:
            raise CVNotFoundError(cv_id)
        
        return cv.to_dict()
        
    except CVNotFoundError:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur récupération CV: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération")


@app.get("/api/cv/{cv_id}/analytics",
         tags=["CV Management"],
         summary="Analytics d'un CV")
async def get_cv_analytics(cv_id: str):
    """Récupère les analytics et métriques d'un CV"""
    
    try:
        analytics = await services_container.cv_repository.get_cv_analytics(cv_id)
        if not analytics:
            raise CVNotFoundError(cv_id)
        
        return analytics
        
    except CVNotFoundError:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur analytics CV: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du calcul des analytics")


# =============================================================================
# ENDPOINTS - CHAT AI (NOUVELLE FEATURE RÉVOLUTIONNAIRE 🤖)
# =============================================================================

@app.post("/api/chat/start",
         tags=["Chat AI"],
         summary="Démarre une nouvelle conversation",
         response_model=ChatResponse)
async def start_chat_conversation(request: ChatStartRequest):
    """Démarre une nouvelle conversation avec l'assistant IA"""
    
    start_time = datetime.now()
    
    try:
        # Validation du contexte
        try:
            context_enum = ConversationContext(request.context)
        except ValueError:
            context_enum = ConversationContext.GENERAL
        
        # Création de la conversation
        conversation = ChatConversation(
            user_id=request.user_id,
            context=context_enum,
            personality=request.personality,
            current_cv_id=request.cv_id,
            user_profile=request.user_profile
        )
        
        # Stockage en mémoire
        services_container.active_conversations[conversation.id] = conversation
        
        # Génération de suggestions initiales
        cv_data = None
        if request.cv_id:
            cv_data = await services_container.cv_repository.get_by_id(request.cv_id)
        
        suggestions = await services_container.chat_ai_service.generate_conversation_suggestions(
            conversation, cv_data
        )
        
        response_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return ChatResponse(
            success=True,
            conversation_id=conversation.id,
            ai_response="Bonjour ! Je suis votre assistant IA personnel pour optimiser votre carrière. Comment puis-je vous aider aujourd'hui ?",
            suggestions=suggestions,
            response_time_ms=response_time
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur création conversation: {e}")
        return ChatResponse(
            success=False,
            conversation_id="",
            error_message=f"Erreur lors de la création de la conversation: {str(e)}"
        )


@app.post("/api/chat/message",
         tags=["Chat AI"],
         summary="Envoie un message dans une conversation",
         response_model=ChatResponse)
async def send_chat_message(request: ChatMessageRequest):
    """Envoie un message à l'assistant IA et reçoit une réponse"""
    
    start_time = datetime.now()
    
    try:
        # Récupération de la conversation
        conversation = services_container.active_conversations.get(request.conversation_id)
        if not conversation:
            return ChatResponse(
                success=False,
                conversation_id=request.conversation_id,
                error_message="Conversation non trouvée"
            )
        
        # Ajout du message utilisateur
        user_message = conversation.add_user_message(request.message, request.cv_id)
        
        # Analyse du contexte (changement possible)
        new_context = await services_container.chat_ai_service.analyze_conversation_context(
            conversation, request.message
        )
        
        context_changed = new_context != conversation.context
        if context_changed:
            conversation.context = new_context
        
        # Récupération des données CV si disponibles
        cv_data = None
        if request.cv_id or conversation.current_cv_id:
            cv_id = request.cv_id or conversation.current_cv_id
            cv_data = await services_container.cv_repository.get_by_id(cv_id)
        
        # Génération de la réponse IA
        ai_message = await services_container.chat_ai_service.generate_ai_response(
            conversation=conversation,
            user_message=request.message,
            cv_data=cv_data,
            context_data={}
        )
        
        # Ajout de la réponse à la conversation
        conversation.add_ai_response(
            content=ai_message.content,
            sources=ai_message.sources,
            suggestions=ai_message.suggestions,
            related_data=ai_message.related_data
        )
        
        response_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return ChatResponse(
            success=True,
            conversation_id=conversation.id,
            message_id=ai_message.id,
            ai_response=ai_message.content,
            suggestions=ai_message.suggestions,
            sources=ai_message.sources,
            context_changed=context_changed,
            new_context=new_context.value if context_changed else None,
            response_time_ms=response_time
        )
        
    except AIServiceError as e:
        logger.error(f"❌ Erreur service IA: {e}")
        return ChatResponse(
            success=False,
            conversation_id=request.conversation_id,
            error_message=f"Erreur du service IA: {e.message}"
        )
    except Exception as e:
        logger.error(f"❌ Erreur message chat: {e}")
        return ChatResponse(
            success=False,
            conversation_id=request.conversation_id,
            error_message=f"Erreur lors du traitement: {str(e)}"
        )


@app.get("/api/chat/conversations/{user_id}",
         tags=["Chat AI"],
         summary="Liste les conversations d'un utilisateur",
         response_model=ConversationListResponse)
async def get_user_conversations(user_id: str, include_inactive: bool = False):
    """Récupère la liste des conversations d'un utilisateur"""
    
    try:
        # Filtrage des conversations par utilisateur
        user_conversations = [
            conv for conv in services_container.active_conversations.values()
            if conv.user_id == user_id and (include_inactive or conv.is_active)
        ]
        
        # Génération des résumés
        conversations_data = [
            conv.generate_conversation_summary()
            for conv in user_conversations
        ]
        
        # Tri par dernière activité (plus récente en premier)
        conversations_data.sort(
            key=lambda x: datetime.fromisoformat(x["last_activity"]),
            reverse=True
        )
        
        active_count = sum(1 for conv in user_conversations if conv.is_active)
        
        return ConversationListResponse(
            success=True,
            conversations=conversations_data,
            total_count=len(conversations_data),
            active_count=active_count
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur récupération conversations: {e}")
        return ConversationListResponse(
            success=False,
            conversations=[],
            total_count=0,
            active_count=0
        )


@app.get("/api/chat/conversation/{conversation_id}",
         tags=["Chat AI"],
         summary="Détails d'une conversation",
         response_model=Dict[str, Any])
async def get_conversation_details(conversation_id: str):
    """Récupère les détails complets d'une conversation"""
    
    try:
        conversation = services_container.active_conversations.get(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation non trouvée")
        
        return {
            "success": True,
            "conversation": conversation.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur détails conversation: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération")


@app.delete("/api/chat/conversation/{conversation_id}",
           tags=["Chat AI"],
           summary="Supprime une conversation")
async def delete_conversation(conversation_id: str):
    """Supprime une conversation"""
    
    try:
        if conversation_id not in services_container.active_conversations:
            raise HTTPException(status_code=404, detail="Conversation non trouvée")
        
        del services_container.active_conversations[conversation_id]
        
        return {"success": True, "message": "Conversation supprimée"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur suppression conversation: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression")


# =============================================================================
# ENDPOINTS - SALARY ANALYSIS (NOUVELLE FEATURE RÉVOLUTIONNAIRE 💰)
# =============================================================================

@app.post("/api/salary/analyze",
         tags=["Salary Analysis"],
         summary="Analyse salariale complète",
         response_model=SalaryAnalysisResponse)
async def analyze_salary(request: SalaryAnalysisRequest):
    """Analyse le potentiel salarial basé sur le CV et le marché"""
    
    start_time = datetime.now()
    
    try:
        # Récupération des données CV
        cv_data = await services_container.cv_repository.get_by_id(request.cv_id)
        if not cv_data:
            return SalaryAnalysisResponse(
                success=False,
                error_message="CV non trouvé"
            )
        
        # Analyse salariale avec IA
        analysis_result = await services_container.salary_ai_service.analyze_salary_potential(
            cv_data=cv_data,
            target_role=request.target_role,
            target_location=request.target_location
        )
        
        # Construction de la réponse
        response_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return SalaryAnalysisResponse(
            success=True,
            analysis_id=analysis_result.id,
            salary_range={
                "min": analysis_result.benchmark_data.min_salary if analysis_result.benchmark_data else 0,
                "max": analysis_result.benchmark_data.max_salary if analysis_result.benchmark_data else 0,
                "median": analysis_result.benchmark_data.median_salary if analysis_result.benchmark_data else 0
            },
            recommended_ask=analysis_result.recommended_ask,
            market_position="at_market",  # TODO: calculer depuis gap_analysis
            market_insights=[
                {
                    "type": insight.insight_type,
                    "title": insight.title,
                    "description": insight.description,
                    "impact": insight.impact_score
                }
                for insight in analysis_result.market_insights
            ],
            negotiation_tips=[
                {
                    "category": tip.category,
                    "title": tip.title,
                    "content": tip.content,
                    "priority": tip.priority
                }
                for tip in analysis_result.negotiation_tips
            ],
            skill_premiums=analysis_result.skill_premiums,
            confidence_score=analysis_result.confidence_score,
            analysis_date=analysis_result.analysis_date.isoformat(),
            processing_time_ms=response_time
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur analyse salariale: {e}")
        return SalaryAnalysisResponse(
            success=False,
            error_message=f"Erreur lors de l'analyse: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Erreur inattendue analyse salariale: {e}")
        return SalaryAnalysisResponse(
            success=False,
            error_message=f"Erreur système: {str(e)}"
        )


@app.get("/api/salary/benchmark/{job_title}",
        tags=["Salary Analysis"],
        summary="Benchmark salarial pour un poste")
async def get_salary_benchmark(job_title: str, location: str = "france", experience_level: str = "mid_level"):
    """Récupère le benchmark salarial pour un poste donné"""
    
    try:
        benchmark = await services_container.salary_ai_service.get_salary_benchmark(
            job_title=job_title,
            location=location,
            experience_level=experience_level
        )
        
        return {
            "success": True,
            "benchmark": {
                "job_title": benchmark.job_title,
                "location": benchmark.location,
                "experience_level": benchmark.experience_level.value,
                "salary_range": {
                    "min": benchmark.min_salary,
                    "max": benchmark.max_salary,
                    "median": benchmark.median_salary,
                    "p25": benchmark.p25_salary,
                    "p75": benchmark.p75_salary
                },
                "sample_size": benchmark.sample_size,
                "confidence_score": benchmark.confidence_score,
                "last_updated": benchmark.last_updated.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur benchmark salarial: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération du benchmark")


# =============================================================================
# ENDPOINTS - LINKEDIN INTEGRATION (NOUVELLE FEATURE RÉVOLUTIONNAIRE 🔗)
# =============================================================================

@app.post("/api/linkedin/auth",
         tags=["LinkedIn Integration"],
         summary="Initie l'authentification LinkedIn",
         response_model=LinkedInResponse)
async def start_linkedin_auth(request: LinkedInAuthRequest):
    """Démarre le processus d'authentification LinkedIn OAuth"""
    
    try:
        # Génération de l'URL d'authentification
        auth_url = services_container.linkedin_service.generate_auth_url(
            user_id=request.user_id,
            state=f"user_{request.user_id}_{datetime.now().timestamp()}"
        )
        
        return LinkedInResponse(
            success=True,
            auth_url=auth_url
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur auth LinkedIn: {e}")
        return LinkedInResponse(
            success=False,
            error_message=f"Erreur lors de l'authentification: {str(e)}"
        )


@app.post("/api/linkedin/callback",
         tags=["LinkedIn Integration"],
         summary="Callback OAuth LinkedIn",
         response_model=LinkedInResponse)
async def linkedin_oauth_callback(request: LinkedInCallbackRequest):
    """Traite le callback OAuth LinkedIn et établit la connexion"""
    
    start_time = datetime.now()
    
    try:
        if request.error:
            return LinkedInResponse(
                success=False,
                error_message=f"Erreur OAuth LinkedIn: {request.error}"
            )
        
        # Échange du code contre un token
        token_data = await services_container.linkedin_service.exchange_code_for_token(
            code=request.code,
            state=request.state
        )
        
        # Extraction de l'user_id depuis le state
        user_id = request.state.split("_")[1] if "_" in request.state else "unknown"
        
        # Création de la connexion
        connection = await services_container.linkedin_service.create_connection(
            user_id=user_id,
            access_token=token_data["access_token"],
            expires_at=token_data["expires_at"]
        )
        
        # Stockage en mémoire
        services_container.linkedin_connections[connection.id] = connection
        
        response_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return LinkedInResponse(
            success=True,
            connection_id=connection.id,
            processing_time_ms=response_time
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur callback LinkedIn: {e}")
        return LinkedInResponse(
            success=False,
            error_message=f"Erreur lors de la connexion: {str(e)}"
        )


@app.post("/api/linkedin/sync",
         tags=["LinkedIn Integration"],
         summary="Synchronise le profil LinkedIn",
         response_model=LinkedInResponse)
async def sync_linkedin_profile(request: LinkedInSyncRequest):
    """Synchronise les données du profil LinkedIn"""
    
    start_time = datetime.now()
    
    try:
        # Recherche de la connexion utilisateur
        user_connection = None
        for connection in services_container.linkedin_connections.values():
            if connection.user_id == request.user_id:
                user_connection = connection
                break
        
        if not user_connection:
            return LinkedInResponse(
                success=False,
                error_message="Connexion LinkedIn non trouvée. Authentifiez-vous d'abord."
            )
        
        # Mapping des sections
        from domain.entities.linkedin_integration import ProfileSection
        section_mapping = {
            "basic_info": ProfileSection.BASIC_INFO,
            "experience": ProfileSection.EXPERIENCE,
            "education": ProfileSection.EDUCATION,
            "skills": ProfileSection.SKILLS,
            "certifications": ProfileSection.CERTIFICATIONS
        }
        
        sections_to_sync = [
            section_mapping[section] for section in request.sections 
            if section in section_mapping
        ]
        
        # Synchronisation du profil
        linkedin_profile = await services_container.linkedin_service.sync_linkedin_profile(
            connection=user_connection,
            sections=sections_to_sync
        )
        
        # Analyse de complétude et CV matching si demandé
        cv_data = None
        if request.cv_id:
            cv_data = await services_container.cv_repository.get_by_id(request.cv_id)
        
        analysis_result = await services_container.linkedin_service.analyze_profile_completeness(
            linkedin_profile=linkedin_profile,
            cv_data=cv_data
        )
        
        response_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return LinkedInResponse(
            success=True,
            connection_id=user_connection.id,
            profile_data={
                "name": f"{linkedin_profile.first_name} {linkedin_profile.last_name}",
                "headline": linkedin_profile.headline,
                "location": linkedin_profile.location,
                "connections_count": linkedin_profile.connections_count,
                "positions_count": len(linkedin_profile.positions),
                "skills_count": len(linkedin_profile.skills)
            },
            completeness_score=analysis_result.profile_completeness,
            cv_match_score=analysis_result.cv_linkedin_match_score,
            recommendations=analysis_result.improvement_suggestions,
            last_sync=user_connection.last_sync.isoformat() if user_connection.last_sync else None,
            processing_time_ms=response_time
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur sync LinkedIn: {e}")
        return LinkedInResponse(
            success=False,
            error_message=f"Erreur lors de la synchronisation: {str(e)}"
        )


@app.get("/api/linkedin/status/{user_id}",
        tags=["LinkedIn Integration"],
        summary="Statut de connexion LinkedIn",
        response_model=LinkedInResponse)
async def get_linkedin_status(user_id: str):
    """Récupère le statut de connexion LinkedIn d'un utilisateur"""
    
    try:
        # Recherche de la connexion
        user_connection = None
        for connection in services_container.linkedin_connections.values():
            if connection.user_id == user_id:
                user_connection = connection
                break
        
        if not user_connection:
            return LinkedInResponse(
                success=True,
                connection_id=None,
                profile_data=None,
                completeness_score=0.0
            )
        
        return LinkedInResponse(
            success=True,
            connection_id=user_connection.id,
            profile_data={
                "status": user_connection.status.value,
                "connected": user_connection.status.value == "connected",
                "token_valid": user_connection.is_token_valid,
                "last_sync": user_connection.last_sync.isoformat() if user_connection.last_sync else None,
                "sync_count": user_connection.sync_count
            },
            last_sync=user_connection.last_sync.isoformat() if user_connection.last_sync else None
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur statut LinkedIn: {e}")
        return LinkedInResponse(
            success=False,
            error_message=f"Erreur lors de la récupération du statut: {str(e)}"
        )


# =============================================================================
# MAIN EXECUTION
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Configuration pour production Railway
    port = int(os.environ.get("PORT", 8080))  # Railway standard port
    host = os.environ.get("HOST", "0.0.0.0")
    is_production = config.app.is_production
    
    uvicorn.run(
        "api_main:app",
        host=host,
        port=port,
        reload=not is_production,  # Pas de reload en production
        log_level=config.app.log_level.lower(),
        workers=1 if not is_production else 4  # Plus de workers en prod
    )