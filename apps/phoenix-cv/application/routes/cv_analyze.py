"""
🎯 Routes CV avec intégration Luna Hub complète
Directive Oracle: Hub = Roi, API Contract, Everything is Event, Zero Frontend Logic
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid
import time
import structlog

from ..clients.luna_client import (
    LunaClient, CheckRequest, ConsumeRequest, 
    LunaInsufficientEnergy, LunaAuthError, LunaClientError
)
from ..models.actions import ActionType, ActionValidator
from ..middleware.observability import business_logger
from ..use_cases.mirror_match_use_case import MirrorMatchUseCase, MirrorMatchCommand
from ...domain.services.mirror_match_service import MirrorMatchService
from ...infrastructure.database.mock_cv_repository import MockCVRepository

logger = structlog.get_logger("cv_routes")

router = APIRouter(prefix="/cv", tags=["cv"])

# ====== DEPENDENCIES ======

def get_token(authorization: Optional[str] = Header(None)) -> str:
    """Extraction et validation du token Bearer"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    return authorization.split(" ", 1)[1]

def get_correlation_id(request: Request) -> str:
    """Récupère le correlation_id depuis le middleware"""
    return getattr(request.state, 'correlation_id', str(uuid.uuid4()))

def get_luna_client(
    token: str = Depends(get_token),
    correlation_id: str = Depends(get_correlation_id)
) -> LunaClient:
    """Client Luna avec corrélation"""
    return LunaClient(
        token_provider=lambda: token,
        request_id_provider=lambda: correlation_id
    )

def get_mirror_match_use_case() -> MirrorMatchUseCase:
    """Use case Mirror Match avec dépendances"""
    cv_repository = MockCVRepository()
    mirror_match_service = MirrorMatchService()
    return MirrorMatchUseCase(cv_repository, mirror_match_service)

# ====== SCHEMAS ======

class CVAnalyzeInput(BaseModel):
    """Schéma d'entrée pour analyse CV"""
    user_id: str = Field(..., description="UUID utilisateur", min_length=1)
    cv_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), description="UUID du CV")
    action_type: ActionType = Field(default=ActionType.ANALYSE_CV_COMPLETE, description="Type d'action CV")
    content: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Contenu et métadonnées CV")
    
    class Config:
        use_enum_values = True

class CVAnalyzeOutput(BaseModel):
    """Schéma de sortie pour analyse CV"""
    success: bool
    result: Dict[str, Any]
    energy_consumed: Optional[int] = None
    energy_remaining: Optional[int] = None
    event_id: Optional[str] = None
    processing_time_ms: Optional[int] = None

class MirrorMatchInput(BaseModel):
    """Schéma d'entrée pour Mirror Match"""
    user_id: str = Field(..., description="UUID utilisateur")
    cv_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    job_description: str = Field(..., description="Description du poste", min_length=50)
    job_title: Optional[str] = Field(default="", description="Titre du poste")
    company_name: Optional[str] = Field(default="", description="Nom de l'entreprise")
    industry: Optional[str] = Field(default="", description="Secteur d'activité")

class HealthCheckOutput(BaseModel):
    """Schéma pour health check"""
    status: str
    service: str
    luna_hub_connected: bool
    dependencies: Dict[str, bool]

# ====== ROUTES PRINCIPALES ======

@router.get("/health", response_model=HealthCheckOutput)
async def health_check():
    """🏥 Health check Phoenix CV avec vérification Luna Hub"""
    try:
        # Test basique de connectivité Luna Hub
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get("http://localhost:8003/health")
            luna_connected = (200 <= response.status_code < 300)
    except:
        luna_connected = False
    
    return HealthCheckOutput(
        status="ok" if luna_connected else "degraded",
        service="phoenix-cv",
        luna_hub_connected=luna_connected,
        dependencies={
            "luna_hub": luna_connected,
            "cv_repository": True,  # Mock toujours OK
            "mirror_match_service": True
        }
    )

@router.post("/analyze", response_model=CVAnalyzeOutput)
async def analyze_cv(
    body: CVAnalyzeInput,
    luna: LunaClient = Depends(get_luna_client),
    correlation_id: str = Depends(get_correlation_id),
    request: Request = Request
):
    """
    🎯 Analyse CV complète avec orchestration Luna Hub
    Workflow Oracle: check → execute → consume → return
    """
    start_time = time.time()
    
    logger.info("CV analysis requested", 
               user_id=body.user_id, 
               action_type=str(body.action_type),
               cv_id=body.cv_id,
               correlation_id=correlation_id)
    
    try:
        # 1. VALIDATION DES PARAMÈTRES
        if not ActionValidator.validate_action_request(body.action_type, body.content):
            missing_fields = ActionValidator.get_required_context_fields(body.action_type)
            raise HTTPException(
                status_code=422, 
                detail=f"Missing required fields for {body.action_type}: {missing_fields}"
            )
        
        # 2. CHECK ÉNERGIE (HUB DÉCIDE)
        logger.info("Checking energy with Luna Hub", action_type=str(body.action_type))
        
        try:
            check_start = time.time()
            luna.check_energy(CheckRequest(
                user_id=body.user_id, 
                action_name=str(body.action_type)
            ))
            check_duration = int((time.time() - check_start) * 1000)
            
            business_logger.log_luna_interaction(
                correlation_id=correlation_id,
                user_id=body.user_id,
                action_type=str(body.action_type),
                luna_operation="check_energy",
                status="success",
                latency_ms=check_duration
            )
            
        except LunaInsufficientEnergy as e:
            logger.warning("Insufficient energy", required_pack=e.required_pack)
            business_logger.log_luna_interaction(
                correlation_id=correlation_id,
                user_id=body.user_id,
                action_type=str(body.action_type),
                luna_operation="check_energy",
                status="insufficient_energy",
                latency_ms=0,
                metadata={"required_pack": e.required_pack}
            )
            raise HTTPException(
                status_code=402, 
                detail={
                    "error": "insufficient_energy", 
                    "required_pack": e.required_pack,
                    "message": f"Énergie insuffisante. Pack requis: {e.required_pack}"
                }
            )
        except LunaAuthError:
            logger.error("Luna Hub authentication failed")
            raise HTTPException(status_code=401, detail="Unauthorized with Luna Hub")
        except LunaClientError as e:
            logger.error("Luna Hub client error", error=str(e))
            raise HTTPException(status_code=502, detail=f"Luna Hub error: {str(e)}")
        
        # 3. EXÉCUTION MÉTIER LOCALE (ZERO LOGIQUE ÉNERGIE)
        logger.info("Executing CV analysis business logic", action_type=str(body.action_type))
        
        business_start = time.time()
        
        if body.action_type == ActionType.ANALYSE_CV_COMPLETE:
            result = await _execute_cv_analysis(body.cv_id, body.content)
        elif body.action_type == ActionType.OPTIMISATION_CV:
            result = await _execute_cv_optimization(body.cv_id, body.content)
        elif body.action_type == ActionType.SALARY_ANALYSIS:
            result = await _execute_salary_analysis(body.cv_id, body.content)
        else:
            # Action générique
            result = {
                "cv_id": body.cv_id,
                "analysis": f"Analysis completed for {body.action_type}",
                "recommendations": [],
                "score": 75
            }
        
        business_duration = int((time.time() - business_start) * 1000)
        
        business_logger.log_cv_action(
            correlation_id=correlation_id,
            user_id=body.user_id,
            action_type=str(body.action_type),
            status="completed",
            latency_ms=business_duration,
            metadata={
                "cv_id": body.cv_id,
                "score": result.get("score", 0)
            }
        )
        
        # 4. CONSUME ÉNERGIE (GÉNÉRATION ÉVÉNEMENT)
        logger.info("Consuming energy with Luna Hub")
        
        try:
            consume_start = time.time()
            consume_response = luna.consume_energy(ConsumeRequest(
                user_id=body.user_id,
                action_name=str(body.action_type),
                context={
                    "cv_id": body.cv_id,
                    "app_source": "phoenix_cv",
                    "correlation_id": correlation_id,
                    **body.content
                }
            ))
            consume_duration = int((time.time() - consume_start) * 1000)
            
            business_logger.log_luna_interaction(
                correlation_id=correlation_id,
                user_id=body.user_id,
                action_type=str(body.action_type),
                luna_operation="consume_energy",
                status="success",
                latency_ms=consume_duration,
                metadata={
                    "energy_consumed": consume_response.energy_consumed,
                    "energy_remaining": consume_response.energy_remaining,
                    "event_id": consume_response.event_id
                }
            )
            
        except LunaAuthError:
            logger.error("Luna Hub authentication failed during consume")
            raise HTTPException(status_code=401, detail="Unauthorized with Luna Hub")
        except LunaClientError as e:
            logger.error("Luna Hub client error during consume", error=str(e))
            raise HTTPException(status_code=502, detail=f"Luna Hub error: {str(e)}")
        
        # 5. RETOUR UTILISATEUR
        total_duration = int((time.time() - start_time) * 1000)
        
        logger.info("CV analysis completed successfully", 
                   total_duration_ms=total_duration,
                   business_duration_ms=business_duration,
                   energy_consumed=consume_response.energy_consumed)
        
        return CVAnalyzeOutput(
            success=True,
            result=result,
            energy_consumed=consume_response.energy_consumed,
            energy_remaining=consume_response.energy_remaining,
            event_id=consume_response.event_id,
            processing_time_ms=total_duration
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (déjà gérées)
        raise
    except Exception as e:
        total_duration = int((time.time() - start_time) * 1000)
        logger.error("Unexpected error during CV analysis", 
                    error=str(e), 
                    duration_ms=total_duration)
        
        business_logger.log_cv_action(
            correlation_id=correlation_id,
            user_id=body.user_id,
            action_type=str(body.action_type),
            status="error",
            latency_ms=total_duration,
            metadata={"error": str(e)}
        )
        
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/mirror-match", response_model=CVAnalyzeOutput)
async def mirror_match_analysis(
    body: MirrorMatchInput,
    luna: LunaClient = Depends(get_luna_client),
    correlation_id: str = Depends(get_correlation_id),
    mirror_match_use_case: MirrorMatchUseCase = Depends(get_mirror_match_use_case)
):
    """
    🎯 Mirror Match - Correspondance CV-Offre avec IA
    """
    start_time = time.time()
    action_type = ActionType.MIRROR_MATCH
    
    logger.info("Mirror Match analysis requested",
               user_id=body.user_id,
               cv_id=body.cv_id,
               job_title=body.job_title,
               correlation_id=correlation_id)
    
    try:
        # 1. CHECK ÉNERGIE
        try:
            luna.check_energy(CheckRequest(
                user_id=body.user_id,
                action_name=str(action_type)
            ))
        except LunaInsufficientEnergy as e:
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "insufficient_energy",
                    "required_pack": e.required_pack,
                    "message": "Énergie insuffisante pour Mirror Match"
                }
            )
        except (LunaAuthError, LunaClientError) as e:
            raise HTTPException(status_code=502, detail=str(e))
        
        # 2. EXÉCUTION MIRROR MATCH
        command = MirrorMatchCommand(
            cv_id=body.cv_id,
            job_description_text=body.job_description,
            job_title=body.job_title,
            company_name=body.company_name,
            industry=body.industry,
            user_id=body.user_id
        )
        
        mirror_result = await mirror_match_use_case.execute(command)
        
        if not mirror_result.success:
            raise HTTPException(status_code=422, detail=mirror_result.error_message)
        
        # 3. CONSUME ÉNERGIE
        try:
            consume_response = luna.consume_energy(ConsumeRequest(
                user_id=body.user_id,
                action_name=str(action_type),
                context={
                    "cv_id": body.cv_id,
                    "job_title": body.job_title,
                    "company_name": body.company_name,
                    "app_source": "phoenix_cv",
                    "correlation_id": correlation_id,
                    "match_score": mirror_result.analysis.overall_compatibility if mirror_result.analysis else 0
                }
            ))
        except (LunaAuthError, LunaClientError) as e:
            raise HTTPException(status_code=502, detail=str(e))
        
        # 4. FORMATAGE RÉSULTAT
        result = {
            "mirror_match_analysis": {
                "overall_compatibility": mirror_result.analysis.overall_compatibility,
                "match_type": mirror_result.analysis.match_type.value,
                "executive_summary": mirror_result.executive_summary,
                "skill_matches": [
                    {
                        "cv_skill": match.cv_skill,
                        "job_requirement": match.job_requirement,
                        "match_score": match.match_score,
                        "match_type": match.match_type.value
                    }
                    for match in mirror_result.analysis.skill_matches[:10]  # Top 10
                ],
                "priority_improvements": mirror_result.analysis.priority_improvements[:5],
                "application_success_probability": mirror_result.analysis.application_success_probability
            },
            "processing_metrics": {
                "ai_calls_made": mirror_result.ai_calls_made,
                "processing_time_ms": mirror_result.processing_time_ms
            }
        }
        
        total_duration = int((time.time() - start_time) * 1000)
        
        logger.info("Mirror Match completed successfully",
                   match_score=mirror_result.analysis.overall_compatibility,
                   duration_ms=total_duration)
        
        return CVAnalyzeOutput(
            success=True,
            result=result,
            energy_consumed=consume_response.energy_consumed,
            energy_remaining=consume_response.energy_remaining,
            event_id=consume_response.event_id,
            processing_time_ms=total_duration
        )
        
    except HTTPException:
        raise
    except Exception as e:
        total_duration = int((time.time() - start_time) * 1000)
        logger.error("Error during Mirror Match", error=str(e), duration_ms=total_duration)
        raise HTTPException(status_code=500, detail="Internal server error")

# ====== HELPERS MÉTIER ======

async def _execute_cv_analysis(cv_id: str, content: Dict[str, Any]) -> Dict[str, Any]:
    """Exécute l'analyse CV complète"""
    # Simulation d'analyse IA
    await _simulate_ai_processing(2000)  # 2s
    
    return {
        "cv_id": cv_id,
        "analysis": {
            "overall_score": 82,
            "ats_compatibility": 78,
            "keyword_density": 0.45,
            "structure_score": 85,
            "content_quality": 80
        },
        "recommendations": [
            "Ajouter plus de mots-clés sectoriels",
            "Quantifier davantage les résultats",
            "Améliorer la section compétences techniques"
        ],
        "highlights": [
            "Excellente expérience professionnelle",
            "Formation pertinente",
            "Projets démontrés"
        ],
        "score": 82
    }

async def _execute_cv_optimization(cv_id: str, content: Dict[str, Any]) -> Dict[str, Any]:
    """Exécute l'optimisation CV"""
    await _simulate_ai_processing(1500)  # 1.5s
    
    return {
        "cv_id": cv_id,
        "optimization": {
            "ats_improvements": [
                "Ajouter 'Python' dans compétences techniques",
                "Reformuler titre avec mots-clés secteur",
                "Structurer expérience avec bullet points"
            ],
            "content_enhancements": [
                "Quantifier résultats avec métriques précises",
                "Ajouter section réalisations/projets",
                "Optimiser description profil"
            ],
            "format_suggestions": [
                "Réduire à 2 pages maximum",
                "Utiliser police Calibri 11pt",
                "Ajouter liens LinkedIn/portfolio"
            ]
        },
        "priority_score": 85,
        "estimated_improvement": "+15 points ATS",
        "score": 85
    }

async def _execute_salary_analysis(cv_id: str, content: Dict[str, Any]) -> Dict[str, Any]:
    """Exécute l'analyse salariale"""
    await _simulate_ai_processing(1000)  # 1s
    
    location = content.get("location", "Paris")
    experience = content.get("experience_years", 5)
    
    return {
        "cv_id": cv_id,
        "salary_analysis": {
            "market_range": {
                "min": 45000 + (experience * 2000),
                "max": 65000 + (experience * 3000),
                "median": 55000 + (experience * 2500)
            },
            "location": location,
            "experience_years": experience,
            "market_position": "Competitive" if experience >= 3 else "Entry level",
            "salary_negotiation_tips": [
                "Mettre en avant projets à impact mesurable",
                "Négocier package complet (formation, télétravail)",
                "Se positionner sur fourchette haute avec justifications"
            ]
        },
        "confidence_score": 78,
        "data_sources": ["glassdoor", "linkedin_insights", "apec_data"],
        "score": 78
    }

async def _simulate_ai_processing(duration_ms: int):
    """Simule le traitement IA"""
    import asyncio
    await asyncio.sleep(duration_ms / 1000)