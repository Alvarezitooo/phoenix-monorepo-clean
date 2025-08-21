"""
🔥 Phoenix Letters API - FastAPI
Clean Architecture exposée via API REST
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from pathlib import Path
import logging
from typing import List, Optional
from datetime import datetime

# Import de notre Clean Architecture
from shared.config.settings import config
from shared.exceptions.business_exceptions import (
    PhoenixLettersException, 
    ValidationError, 
    QuotaExceededError,
    AIServiceError
)
from application.use_cases.generate_letter_use_case import (
    GenerateLetterUseCase, 
    GenerateLetterCommand,
    GenerateLetterResult
)
from application.use_cases.get_user_letters_use_case import (
    GetUserLettersUseCase, 
    GetUserLettersQuery,
    GetLetterByIdUseCase,
    GetLetterByIdQuery
)
from application.use_cases.analyze_career_transition_use_case import (
    AnalyzeCareerTransitionUseCase,
    AnalyzeCareerTransitionCommand,
    AnalyzeCareerTransitionResult
)
from domain.services.letter_service import LetterService
from domain.services.skill_mapping_service import SkillMappingService
from infrastructure.ai.gemini_service import GeminiService
from infrastructure.database.mock_letter_repository import MockLetterRepository
from infrastructure.database.mock_user_repository import MockUserRepository

# DTOs pour l'API
from pydantic import BaseModel, Field
from enum import Enum

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# === DTOs API === 

class ExperienceLevelDTO(str, Enum):
    JUNIOR = "junior"
    INTERMEDIATE = "intermédiaire" 
    SENIOR = "senior"

class LetterToneDTO(str, Enum):
    PROFESSIONAL = "professionnel"
    ENTHUSIASTIC = "enthousiaste"
    CREATIVE = "créatif"
    CASUAL = "décontracté"

class GenerateLetterRequest(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=100)
    position_title: str = Field(..., min_length=1, max_length=100) 
    job_description: Optional[str] = Field(None, max_length=2000)
    experience_level: ExperienceLevelDTO = ExperienceLevelDTO.INTERMEDIATE
    desired_tone: LetterToneDTO = LetterToneDTO.PROFESSIONAL
    max_words: int = Field(350, ge=200, le=500)
    use_ai: bool = True

class LetterResponse(BaseModel):
    id: str
    content: str
    company_name: Optional[str]
    position_title: Optional[str]
    status: str
    word_count: int
    estimated_read_time_seconds: int
    ai_generated: bool
    generation_model: Optional[str]
    created_at: str
    updated_at: str
    quality_indicators: dict
    filename: str

class GenerationResponse(BaseModel):
    letter: LetterResponse
    generation_info: dict
    user_updated: bool

class UserStatistics(BaseModel):
    total_letters: int
    this_month: int
    average_quality: float
    productivity_trend: str
    current_month_usage: dict
    account_info: dict

class AnalyzeCareerTransitionRequest(BaseModel):
    previous_role: str = Field(..., min_length=1, max_length=100)
    target_role: str = Field(..., min_length=1, max_length=100)
    previous_industry: Optional[str] = Field(None, max_length=100)
    target_industry: Optional[str] = Field(None, max_length=100)
    include_industry_analysis: bool = True
    include_narrative_bridges: bool = True
    max_transferable_skills: int = Field(10, ge=3, le=15)
    max_skill_gaps: int = Field(8, ge=3, le=12)
    max_narrative_bridges: int = Field(5, ge=2, le=8)

class CareerTransitionResponse(BaseModel):
    career_transition: dict
    analysis_metadata: dict

class HealthCheck(BaseModel):
    status: str
    version: str
    environment: str
    ai_service: dict
    timestamp: str

# === Services Container ===

class ServicesContainer:
    """Container pour l'injection de dépendances"""
    
    def __init__(self):
        self.initialized = False
        
    async def initialize(self):
        """Initialise tous les services"""
        if self.initialized:
            return
            
        logger.info("🚀 Initialisation des services API...")
        
        # Infrastructure
        self.ai_service = GeminiService()
        self.letter_repository = MockLetterRepository()
        self.user_repository = MockUserRepository()
        
        # Ajout de lettres de démo
        self.letter_repository.add_demo_letters("demo-user")
        
        # Domain Services  
        self.letter_service = LetterService(self.letter_repository)
        self.skill_mapping_service = SkillMappingService(self.ai_service)
        
        # Use Cases
        self.generate_letter_use_case = GenerateLetterUseCase(
            letter_service=self.letter_service,
            user_repository=self.user_repository,
            ai_service=self.ai_service
        )
        
        self.get_letters_use_case = GetUserLettersUseCase(
            letter_service=self.letter_service,
            user_repository=self.user_repository
        )
        
        self.get_letter_by_id_use_case = GetLetterByIdUseCase(
            letter_service=self.letter_service
        )
        
        self.analyze_career_transition_use_case = AnalyzeCareerTransitionUseCase(
            skill_mapping_service=self.skill_mapping_service,
            user_repository=self.user_repository
        )
        
        self.initialized = True
        logger.info("✅ Services API initialisés")

# Instance globale
services = ServicesContainer()

# === Lifecycle Management ===

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    # Startup
    await services.initialize()
    yield
    # Shutdown
    logger.info("👋 Arrêt de l'API Phoenix Letters")

# === FastAPI App ===

app = FastAPI(
    title="🔥 Phoenix Letters API",
    description="API REST pour le générateur de lettres de motivation avec IA",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS pour le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En prod: spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Configuration Frontend Static Files ===
# Servir les fichiers statiques React buildés
static_dir = Path(__file__).parent / "frontend" / "project" / "dist"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    # Route pour servir l'app React (SPA)
    @app.get("/", include_in_schema=False)
    @app.get("/dashboard", include_in_schema=False)
    @app.get("/generate", include_in_schema=False)
    async def serve_frontend():
        index_file = static_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        else:
            return {"message": "Frontend not built yet", "api_docs": "/docs"}
else:
    logger.warning("⚠️ Frontend dist directory not found - serving API only")

# === Exception Handlers ===

@app.exception_handler(PhoenixLettersException)
async def phoenix_exception_handler(request, exc: PhoenixLettersException):
    return JSONResponse(
        status_code=400 if isinstance(exc, ValidationError) else 500,
        content=exc.to_dict()
    )

@app.exception_handler(QuotaExceededError) 
async def quota_exceeded_handler(request, exc: QuotaExceededError):
    return JSONResponse(
        status_code=429,
        content=exc.to_dict()
    )

@app.exception_handler(AIServiceError)
async def ai_service_error_handler(request, exc: AIServiceError):
    return JSONResponse(
        status_code=503 if exc.details.get("is_temporary") else 500,
        content=exc.to_dict()
    )

# === Dependency Injection ===

async def get_services():
    """Injection des services"""
    if not services.initialized:
        await services.initialize()
    return services

# === API Routes ===

@app.get("/", response_model=dict)
async def root():
    """Point d'entrée de l'API"""
    return {
        "message": "🔥 Phoenix Letters API",
        "version": "2.0.0", 
        "architecture": "Clean Architecture",
        "docs": "/docs",
        "status": "operational"
    }

@app.get("/health", response_model=HealthCheck)
async def health_check(services_container = Depends(get_services)):
    """Health check complet de l'API"""
    ai_health = await services_container.ai_service.health_check()
    
    return HealthCheck(
        status="healthy",
        version="2.0.0",
        environment=config.app.environment,
        ai_service=ai_health,
        timestamp=datetime.now().isoformat()
    )

@app.post("/api/letters/generate", response_model=GenerationResponse)
async def generate_letter(
    request: GenerateLetterRequest,
    user_id: str = "demo-user",  # En prod: extraire du JWT
    services_container = Depends(get_services)
):
    """Génère une nouvelle lettre de motivation"""
    try:
        # Conversion DTO vers Command
        command = GenerateLetterCommand(
            user_id=user_id,
            company_name=request.company_name,
            position_title=request.position_title,
            job_description=request.job_description,
            experience_level=request.experience_level,
            desired_tone=request.desired_tone,
            max_words=request.max_words,
            use_ai=request.use_ai
        )
        
        # Exécution Use Case
        result: GenerateLetterResult = await services_container.generate_letter_use_case.execute(command)
        
        # Conversion vers DTO Response
        letter_dto = LetterResponse(
            id=result.letter.id,
            content=result.letter.content,
            company_name=result.letter.job_context.company_name if result.letter.job_context else None,
            position_title=result.letter.job_context.position_title if result.letter.job_context else None,
            status=result.letter.status.value,
            word_count=result.letter.metadata.word_count,
            estimated_read_time_seconds=result.letter.metadata.estimated_read_time_seconds,
            ai_generated=result.letter.metadata.ai_generated,
            generation_model=result.letter.metadata.generation_model,
            created_at=result.letter.metadata.created_at.isoformat(),
            updated_at=result.letter.metadata.updated_at.isoformat(),
            quality_indicators=result.letter.get_quality_indicators(),
            filename=result.letter.get_filename()
        )
        
        return GenerationResponse(
            letter=letter_dto,
            generation_info=result.generation_info,
            user_updated=result.user_updated
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur génération API: {e}")
        raise

@app.get("/api/letters/user/{user_id}", response_model=List[LetterResponse])
async def get_user_letters(
    user_id: str,
    limit: Optional[int] = 20,
    include_recent_only: bool = False,
    services_container = Depends(get_services)
):
    """Récupère les lettres d'un utilisateur"""
    try:
        query = GetUserLettersQuery(
            user_id=user_id,
            limit=limit,
            include_recent_only=include_recent_only,
            include_stats=False
        )
        
        result = await services_container.get_letters_use_case.execute(query)
        
        # Conversion vers DTOs
        letters_dto = []
        for letter in result.letters:
            letters_dto.append(LetterResponse(
                id=letter.id,
                content=letter.content[:500] + "..." if len(letter.content) > 500 else letter.content,  # Preview
                company_name=letter.job_context.company_name if letter.job_context else None,
                position_title=letter.job_context.position_title if letter.job_context else None,
                status=letter.status.value,
                word_count=letter.metadata.word_count,
                estimated_read_time_seconds=letter.metadata.estimated_read_time_seconds,
                ai_generated=letter.metadata.ai_generated,
                generation_model=letter.metadata.generation_model,
                created_at=letter.metadata.created_at.isoformat(),
                updated_at=letter.metadata.updated_at.isoformat(),
                quality_indicators=letter.get_quality_indicators(),
                filename=letter.get_filename()
            ))
        
        return letters_dto
        
    except Exception as e:
        logger.error(f"❌ Erreur récupération lettres: {e}")
        raise

@app.get("/api/letters/{letter_id}", response_model=LetterResponse)
async def get_letter_by_id(
    letter_id: str,
    user_id: str = "demo-user",
    services_container = Depends(get_services)
):
    """Récupère une lettre spécifique par ID"""
    try:
        query = GetLetterByIdQuery(
            letter_id=letter_id,
            user_id=user_id,
            include_versions=False
        )
        
        result = await services_container.get_letter_by_id_use_case.execute(query)
        
        if not result:
            raise HTTPException(status_code=404, detail="Lettre introuvable")
        
        return LetterResponse(
            id=result.letter.id,
            content=result.letter.content,
            company_name=result.letter.job_context.company_name if result.letter.job_context else None,
            position_title=result.letter.job_context.position_title if result.letter.job_context else None,
            status=result.letter.status.value,
            word_count=result.letter.metadata.word_count,
            estimated_read_time_seconds=result.letter.metadata.estimated_read_time_seconds,
            ai_generated=result.letter.metadata.ai_generated,
            generation_model=result.letter.metadata.generation_model,
            created_at=result.letter.metadata.created_at.isoformat(),
            updated_at=result.letter.metadata.updated_at.isoformat(),
            quality_indicators=result.letter.get_quality_indicators(),
            filename=result.letter.get_filename()
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur récupération lettre {letter_id}: {e}")
        raise

@app.get("/api/user/{user_id}/statistics", response_model=UserStatistics)
async def get_user_statistics(
    user_id: str,
    services_container = Depends(get_services)
):
    """Récupère les statistiques utilisateur"""
    try:
        query = GetUserLettersQuery(
            user_id=user_id,
            include_stats=True,
            limit=None
        )
        
        result = await services_container.get_letters_use_case.execute(query)
        
        if not result.statistics:
            raise HTTPException(status_code=404, detail="Statistiques non disponibles")
        
        return UserStatistics(
            total_letters=result.statistics.get("total", 0),
            this_month=result.statistics.get("this_month", 0),
            average_quality=result.statistics.get("average_quality", 0.5),
            productivity_trend=result.statistics.get("productivity_trend", "stable"),
            current_month_usage=result.statistics.get("current_month_usage", {}),
            account_info=result.statistics.get("account_info", {})
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur statistiques utilisateur: {e}")
        raise

@app.post("/api/skills/analyze-transition", response_model=CareerTransitionResponse)
async def analyze_career_transition(
    request: AnalyzeCareerTransitionRequest,
    user_id: str = "demo-user",
    services_container = Depends(get_services)
):
    """🎯 GAME CHANGER - Analyse des compétences transversales pour transition de carrière"""
    try:
        # Conversion DTO vers Command
        command = AnalyzeCareerTransitionCommand(
            user_id=user_id,
            previous_role=request.previous_role,
            target_role=request.target_role,
            previous_industry=request.previous_industry,
            target_industry=request.target_industry,
            include_industry_analysis=request.include_industry_analysis,
            include_narrative_bridges=request.include_narrative_bridges,
            max_transferable_skills=request.max_transferable_skills,
            max_skill_gaps=request.max_skill_gaps,
            max_narrative_bridges=request.max_narrative_bridges
        )
        
        # Exécution Use Case
        result: AnalyzeCareerTransitionResult = await services_container.analyze_career_transition_use_case.execute(command)
        
        # Retour response
        return CareerTransitionResponse(
            career_transition=result.career_transition.to_dict(),
            analysis_metadata=result.analysis_metadata
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur analyse transition API: {e}")
        raise

@app.get("/api/skills/preview-transition")
async def preview_career_transition(
    previous_role: str,
    target_role: str,
    previous_industry: Optional[str] = None,
    target_industry: Optional[str] = None,
    services_container = Depends(get_services)
):
    """Aperçu gratuit d'analyse de transition - pour l'UX"""
    try:
        command = AnalyzeCareerTransitionCommand(
            user_id="preview",
            previous_role=previous_role,
            target_role=target_role,
            previous_industry=previous_industry,
            target_industry=target_industry
        )
        
        preview = await services_container.analyze_career_transition_use_case.get_analysis_preview(command)
        return preview
        
    except Exception as e:
        logger.error(f"❌ Erreur preview transition: {e}")
        return {"error": "Preview indisponible"}

@app.get("/api/ai/status")
async def ai_service_status(services_container = Depends(get_services)):
    """Status du service IA"""
    try:
        health = await services_container.ai_service.health_check()
        model_info = services_container.ai_service.get_model_info()
        
        return {
            "status": "available" if services_container.ai_service.is_available() else "unavailable",
            "health": health,
            "model_info": model_info
        }
    except Exception as e:
        logger.error(f"❌ Erreur status IA: {e}")
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Configuration pour production Railway
    port = int(os.environ.get("PORT", 8001))
    host = os.environ.get("HOST", "0.0.0.0")
    is_production = os.environ.get("PHOENIX_LETTERS_ENVIRONMENT", "development") == "production"
    
    uvicorn.run(
        "api_main:app", 
        host=host, 
        port=port, 
        reload=not is_production,  # Pas de reload en production
        log_level=os.environ.get("PHOENIX_LETTERS_LOG_LEVEL", "info"),
        workers=1 if not is_production else 4  # Plus de workers en prod
    )
