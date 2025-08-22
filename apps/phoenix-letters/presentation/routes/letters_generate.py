"""
📝 Routes Letters avec intégration Luna Hub complète
Directive Oracle: Hub = Roi, API Contract, Everything is Event, Zero Frontend Logic
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid
import time
import structlog

from infrastructure.clients.luna_client import (
    LunaClient, CheckRequest, ConsumeRequest, 
    LunaInsufficientEnergy, LunaAuthError, LunaClientError
)
from application.models.actions import LettersActionType, LettersActionValidator
from application.use_cases.generate_letter_use_case import GenerateLetterUseCase
from domain.services.letter_service import LetterService
from infrastructure.database.mock_letter_repository import MockLetterRepository

logger = structlog.get_logger("letters_routes")

router = APIRouter(prefix="/letters", tags=["letters"])

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

def get_letter_service() -> LetterService:
    """Service de génération de lettres"""
    return LetterService()

def get_generate_letter_use_case() -> GenerateLetterUseCase:
    """Use case génération lettre avec dépendances"""
    letter_repository = MockLetterRepository()
    letter_service = LetterService()
    return GenerateLetterUseCase(letter_repository, letter_service)

# ====== SCHEMAS ======

class LettersGenerateInput(BaseModel):
    """Schéma d'entrée pour génération lettre"""
    user_id: str = Field(..., description="UUID utilisateur", min_length=1)
    action_type: LettersActionType = Field(default=LettersActionType.LETTRE_MOTIVATION, description="Type d'action")
    job_title: Optional[str] = Field(None, description="Titre du poste")
    company_name: Optional[str] = Field(None, description="Nom de l'entreprise")
    job_offer_text: Optional[str] = Field(None, description="Texte de l'offre d'emploi")
    user_profile: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Profil utilisateur")
    additional_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Contexte additionnel")
    
    class Config:
        use_enum_values = True

class LettersGenerateOutput(BaseModel):
    """Schéma de sortie pour génération lettre"""
    success: bool
    result: Dict[str, Any]
    energy_consumed: Optional[int] = None
    energy_remaining: Optional[int] = None
    event_id: Optional[str] = None
    processing_time_ms: Optional[int] = None

class AnalyzeOfferInput(BaseModel):
    """Schéma d'entrée pour analyse d'offre"""
    user_id: str = Field(..., description="UUID utilisateur")
    job_offer_text: str = Field(..., description="Texte de l'offre d'emploi", min_length=50)
    company_name: Optional[str] = Field(None, description="Nom de l'entreprise")
    job_title: Optional[str] = Field(None, description="Titre du poste")

class TransitionCareerInput(BaseModel):
    """Schéma d'entrée pour transition carrière"""
    user_id: str = Field(..., description="UUID utilisateur")
    current_industry: str = Field(..., description="Secteur actuel")
    target_industry: str = Field(..., description="Secteur cible")
    current_role: Optional[str] = Field(None, description="Poste actuel")
    target_role: Optional[str] = Field(None, description="Poste cible")
    experience_years: Optional[int] = Field(None, description="Années d'expérience")

class HealthCheckOutput(BaseModel):
    """Schéma pour health check"""
    status: str
    service: str
    luna_hub_connected: bool
    dependencies: Dict[str, bool]

# ====== ROUTES PRINCIPALES ======

@router.get("/health", response_model=HealthCheckOutput)
async def health_check():
    """🏥 Health check Phoenix Letters avec vérification Luna Hub"""
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
        service="phoenix-letters",
        luna_hub_connected=luna_connected,
        dependencies={
            "luna_hub": luna_connected,
            "letter_repository": True,  # Mock toujours OK
            "letter_service": True,
            "ai_service": True
        }
    )

@router.post("/generate", response_model=LettersGenerateOutput)
async def generate_letter(
    body: LettersGenerateInput,
    luna: LunaClient = Depends(get_luna_client),
    correlation_id: str = Depends(get_correlation_id),
    use_case: GenerateLetterUseCase = Depends(get_generate_letter_use_case)
):
    """
    📝 Génération de lettre avec orchestration Luna Hub
    Workflow Oracle: check → execute → consume → return
    """
    start_time = time.time()
    
    logger.info("Letter generation requested", 
               user_id=body.user_id, 
               action_type=str(body.action_type),
               job_title=body.job_title,
               company_name=body.company_name,
               correlation_id=correlation_id)
    
    try:
        # 1. VALIDATION DES PARAMÈTRES
        context = {
            "job_title": body.job_title,
            "company_name": body.company_name,
            "job_offer_text": body.job_offer_text,
            "user_profile": body.user_profile,
            **body.additional_context
        }
        
        if not LettersActionValidator.validate_action_request(body.action_type, context):
            missing_fields = LettersActionValidator.get_required_context_fields(body.action_type)
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
            
            logger.info("Energy check successful", 
                       action_type=str(body.action_type),
                       duration_ms=check_duration)
            
        except LunaInsufficientEnergy as e:
            logger.warning("Insufficient energy", required_pack=e.required_pack)
            raise HTTPException(
                status_code=402, 
                detail={
                    "error": "insufficient_energy", 
                    "required_pack": e.required_pack,
                    "message": f"Énergie insuffisante pour {body.action_type}. Pack requis: {e.required_pack}"
                }
            )
        except LunaAuthError:
            logger.error("Luna Hub authentication failed")
            raise HTTPException(status_code=401, detail="Unauthorized with Luna Hub")
        except LunaClientError as e:
            logger.error("Luna Hub client error", error=str(e))
            raise HTTPException(status_code=502, detail=f"Luna Hub error: {str(e)}")
        
        # 3. EXÉCUTION MÉTIER LOCALE (ZERO LOGIQUE ÉNERGIE)
        logger.info("Executing letter generation business logic", action_type=str(body.action_type))
        
        business_start = time.time()
        
        if body.action_type == LettersActionType.LETTRE_MOTIVATION:
            result = await _execute_letter_generation(body, use_case)
        elif body.action_type == LettersActionType.ANALYSE_OFFRE:
            result = await _execute_offer_analysis(body, context)
        elif body.action_type == LettersActionType.TRANSITION_CARRIERE:
            result = await _execute_career_transition(body, context)
        elif body.action_type == LettersActionType.FORMAT_LETTRE:
            result = await _execute_letter_formatting(body, context)
        else:
            # Action générique
            result = await _execute_generic_action(body, context)
        
        business_duration = int((time.time() - business_start) * 1000)
        
        logger.info("Letter generation completed",
                   action_type=str(body.action_type),
                   duration_ms=business_duration)
        
        # 4. CONSUME ÉNERGIE (GÉNÉRATION ÉVÉNEMENT)
        logger.info("Consuming energy with Luna Hub")
        
        try:
            consume_start = time.time()
            consume_response = luna.consume_energy(ConsumeRequest(
                user_id=body.user_id,
                action_name=str(body.action_type),
                context={
                    "job_title": body.job_title,
                    "company_name": body.company_name,
                    "app_source": "phoenix_letters",
                    "correlation_id": correlation_id,
                    "processing_time_ms": business_duration,
                    **context
                }
            ))
            consume_duration = int((time.time() - consume_start) * 1000)
            
            logger.info("Energy consumed successfully",
                       energy_consumed=consume_response.energy_consumed,
                       energy_remaining=consume_response.energy_remaining,
                       event_id=consume_response.event_id,
                       duration_ms=consume_duration)
            
        except LunaAuthError:
            logger.error("Luna Hub authentication failed during consume")
            raise HTTPException(status_code=401, detail="Unauthorized with Luna Hub")
        except LunaClientError as e:
            logger.error("Luna Hub client error during consume", error=str(e))
            raise HTTPException(status_code=502, detail=f"Luna Hub error: {str(e)}")
        
        # 5. RETOUR UTILISATEUR
        total_duration = int((time.time() - start_time) * 1000)
        
        logger.info("Letter generation completed successfully", 
                   total_duration_ms=total_duration,
                   business_duration_ms=business_duration,
                   energy_consumed=consume_response.energy_consumed)
        
        return LettersGenerateOutput(
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
        logger.error("Unexpected error during letter generation", 
                    error=str(e), 
                    duration_ms=total_duration)
        
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/analyze-offer", response_model=LettersGenerateOutput)
async def analyze_job_offer(
    body: AnalyzeOfferInput,
    luna: LunaClient = Depends(get_luna_client),
    correlation_id: str = Depends(get_correlation_id)
):
    """
    🔍 Analyse d'offre d'emploi avec IA
    """
    start_time = time.time()
    action_type = LettersActionType.ANALYSE_OFFRE
    
    logger.info("Job offer analysis requested",
               user_id=body.user_id,
               job_title=body.job_title,
               company_name=body.company_name,
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
                    "message": "Énergie insuffisante pour l'analyse d'offre"
                }
            )
        except (LunaAuthError, LunaClientError) as e:
            raise HTTPException(status_code=502, detail=str(e))
        
        # 2. EXÉCUTION ANALYSE OFFRE
        analysis_result = await _execute_offer_analysis_detailed(body)
        
        # 3. CONSUME ÉNERGIE
        try:
            consume_response = luna.consume_energy(ConsumeRequest(
                user_id=body.user_id,
                action_name=str(action_type),
                context={
                    "job_title": body.job_title,
                    "company_name": body.company_name,
                    "app_source": "phoenix_letters",
                    "correlation_id": correlation_id,
                    "offer_length": len(body.job_offer_text)
                }
            ))
        except (LunaAuthError, LunaClientError) as e:
            raise HTTPException(status_code=502, detail=str(e))
        
        total_duration = int((time.time() - start_time) * 1000)
        
        return LettersGenerateOutput(
            success=True,
            result=analysis_result,
            energy_consumed=consume_response.energy_consumed,
            energy_remaining=consume_response.energy_remaining,
            event_id=consume_response.event_id,
            processing_time_ms=total_duration
        )
        
    except HTTPException:
        raise
    except Exception as e:
        total_duration = int((time.time() - start_time) * 1000)
        logger.error("Error during job offer analysis", 
                    error=str(e), 
                    duration_ms=total_duration)
        raise HTTPException(status_code=500, detail="Internal server error")

# ====== HELPERS MÉTIER ======

async def _execute_letter_generation(body: LettersGenerateInput, use_case: GenerateLetterUseCase) -> Dict[str, Any]:
    """Exécute la génération de lettre de motivation"""
    await _simulate_ai_processing(3000)  # 3s
    
    return {
        "letter_type": "motivation",
        "job_title": body.job_title,
        "company_name": body.company_name,
        "generated_content": f"""Madame, Monsieur,

Actuellement en recherche active d'un poste de {body.job_title}, je vous fais part de ma candidature au sein de {body.company_name}.

Fort de mon expérience et de ma motivation, je suis convaincu que mon profil correspond parfaitement aux exigences du poste.

[Contenu généré par IA basé sur le profil utilisateur et l'offre]

Je reste à votre disposition pour un entretien et vous prie d'agréer mes salutations distinguées.""",
        "personalization_score": 92,
        "suggestions": [
            "Ajouter des exemples concrets de réalisations",
            "Personnaliser l'accroche selon l'entreprise",
            "Mettre en avant les compétences techniques requises"
        ],
        "estimated_impact": "Très forte probabilité de retour positif"
    }

async def _execute_offer_analysis(body: LettersGenerateInput, context: Dict[str, Any]) -> Dict[str, Any]:
    """Exécute l'analyse d'offre d'emploi"""
    await _simulate_ai_processing(2000)  # 2s
    
    return {
        "analysis_type": "job_offer",
        "offer_summary": {
            "position": body.job_title or "Non spécifié",
            "company": body.company_name or "Non spécifiée",
            "contract_type": "CDI (détecté)",
            "salary_range": "Non mentionné",
            "remote_work": "Hybride possible"
        },
        "required_skills": [
            "Python", "FastAPI", "React", "PostgreSQL", "Docker"
        ],
        "nice_to_have": [
            "AWS", "Kubernetes", "TypeScript"
        ],
        "company_culture": {
            "keywords": ["innovation", "équipe", "agilité"],
            "values": ["Collaboration", "Excellence technique", "Innovation"],
            "work_environment": "Startup en croissance"
        },
        "match_score": 85,
        "recommendations": [
            "Mettre en avant votre expérience Python",
            "Préparer des exemples de projets FastAPI",
            "Insister sur votre adaptabilité en équipe agile"
        ]
    }

async def _execute_career_transition(body: LettersGenerateInput, context: Dict[str, Any]) -> Dict[str, Any]:
    """Exécute l'analyse de transition carrière"""
    await _simulate_ai_processing(4000)  # 4s
    
    return {
        "transition_type": "career_change",
        "current_sector": context.get("current_industry", "Tech"),
        "target_sector": context.get("target_industry", "Finance"),
        "feasibility_score": 78,
        "transition_strategy": {
            "timeline": "6-12 mois",
            "priority_actions": [
                "Acquérir certifications secteur finance",
                "Développer réseau professionnel cible",
                "Adapter CV aux codes du secteur"
            ],
            "transferable_skills": [
                "Gestion de projet",
                "Analyse de données", 
                "Communication client"
            ],
            "skills_gap": [
                "Réglementation financière",
                "Outils sectoriels spécifiques",
                "Codes culturels du secteur"
            ]
        },
        "next_steps": [
            "Identifier 3-5 entreprises cibles",
            "Planifier formation complémentaire",
            "Adapter discours de motivation"
        ]
    }

async def _execute_letter_formatting(body: LettersGenerateInput, context: Dict[str, Any]) -> Dict[str, Any]:
    """Exécute le formatage de lettre"""
    await _simulate_ai_processing(1000)  # 1s
    
    return {
        "formatting_type": "letter_optimization",
        "original_length": len(context.get("letter_content", "")),
        "optimized_structure": {
            "header": "✅ Coordonnées complètes",
            "introduction": "✅ Accroche impactante",
            "body": "⚠️ Développement à structurer en 2-3 paragraphes",
            "conclusion": "✅ Formule de politesse appropriée"
        },
        "improvements": [
            "Réduire de 15% la longueur totale",
            "Ajouter des puces pour la lisibilité",
            "Harmoniser le niveau de langage"
        ],
        "readability_score": 87,
        "professional_score": 92
    }

async def _execute_generic_action(body: LettersGenerateInput, context: Dict[str, Any]) -> Dict[str, Any]:
    """Exécute une action générique"""
    await _simulate_ai_processing(500)  # 0.5s
    
    return {
        "action_type": str(body.action_type),
        "result": f"Action {body.action_type} exécutée avec succès",
        "context_processed": len(context),
        "recommendations": [
            "Voir les actions spécialisées pour plus de détails"
        ]
    }

async def _execute_offer_analysis_detailed(body: AnalyzeOfferInput) -> Dict[str, Any]:
    """Exécute l'analyse détaillée d'offre"""
    await _simulate_ai_processing(2500)  # 2.5s
    
    return {
        "job_title": body.job_title,
        "company_name": body.company_name,
        "analysis": {
            "offer_quality_score": 88,
            "clarity_score": 92,
            "attractiveness_score": 85,
            "requirements_analysis": {
                "must_have_skills": [
                    "5+ ans expérience",
                    "Maîtrise Python/Django",
                    "Expérience bases de données"
                ],
                "preferred_skills": [
                    "Expérience cloud AWS",
                    "Connaissance DevOps"
                ],
                "soft_skills": [
                    "Esprit d'équipe",
                    "Autonomie",
                    "Communication"
                ]
            },
            "compensation_analysis": {
                "salary_mentioned": False,
                "benefits": ["Mutuelle", "RTT", "Télétravail"],
                "career_evolution": "Mentions d'évolution vers lead dev"
            },
            "red_flags": [],
            "green_flags": [
                "Description claire des missions",
                "Équipe technique mentionnée",
                "Formation continue prévue"
            ]
        },
        "application_strategy": [
            "Mettre en avant votre expérience Python",
            "Préparer des exemples de projets similaires",
            "Questionner sur l'équipe et les technologies utilisées"
        ]
    }

async def _simulate_ai_processing(duration_ms: int):
    """Simule le traitement IA"""
    import asyncio
    await asyncio.sleep(duration_ms / 1000)