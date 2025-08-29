"""
🌅 Phoenix Aube - API Endpoints
Career discovery and psychological mapping service
Standalone Phoenix application with enterprise grade matching
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
import structlog
from datetime import datetime, timezone

from backend.models.aube_models import (
    AubeSignals, AubeAssessmentRequest, AubeAssessmentResponse,
    AubeCareerMatch, AubePersonalityProfile, AubeRecommendation
)
from backend.core.aube_matching_service import AubeMatchingService
from backend.core.security import validate_user_id, ensure_request_is_clean

# Logger structuré
logger = structlog.get_logger("aube_endpoints")

# Router Aube
router = APIRouter(prefix="/aube", tags=["Phoenix Aube Career Discovery"])

# Instance de service
matching_service = AubeMatchingService()


# ============================================================================
# MODELS DE REQUÊTE/RÉPONSE SPÉCIFIQUES
# ============================================================================

class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
    matching_engine: str
    timestamp: str


class AssessmentStatusRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur", min_length=1, max_length=50)
    
    
class AssessmentStatusResponse(BaseModel):
    success: bool
    user_id: str
    has_assessment: bool
    completion_date: Optional[str] = None
    confidence_score: Optional[float] = None
    last_updated: Optional[str] = None


class CareerRecommendationsRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur")
    limit: int = Field(default=5, ge=1, le=20, description="Nombre de recommandations max")
    include_analysis: bool = Field(default=True, description="Inclure l'analyse détaillée")


class CareerRecommendationsResponse(BaseModel):
    success: bool
    user_id: str
    recommendations: List[AubeRecommendation]
    personality_insights: Optional[Dict[str, Any]] = None
    generated_at: str


# ============================================================================
# ENDPOINTS PRINCIPAUX PHOENIX AUBE
# ============================================================================

@router.get("/health", 
           response_model=HealthCheckResponse,
           dependencies=[Depends(ensure_request_is_clean)],
           summary="Health check Phoenix Aube service")
async def aube_health_check() -> HealthCheckResponse:
    """🌅 Health check pour Phoenix Aube - Service de découverte carrière"""
    return HealthCheckResponse(
        status="healthy",
        service="phoenix-aube",
        version="1.0.0",
        matching_engine="enterprise-v2",
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@router.post("/assessment", 
            response_model=AubeAssessmentResponse,
            dependencies=[Depends(ensure_request_is_clean)],
            summary="Évaluation psychologique complète",
            description="""
🧠 **Assessment Phoenix Aube - Découverte de Carrière Psychologique**

### Méthodologie Enterprise
- **Matrice Multidimensionnelle** : 8 dimensions psycho-professionnelles
- **Pain Points Mapping** : Identification des tensions carrière actuelles  
- **Algorithme ML** : Matching avec +500 métiers référencés
- **Ethical AI** : Suggestions non-discriminatoires, orientation positive

### Dimensions Évaluées
1. **Appétences** : People vs Data orientation
2. **Valeurs** : Top 2 valeurs professionnelles prioritaires
3. **Environnement** : Préférences organisationnelles
4. **Autonomie** : Niveau d'indépendance souhaité
5. **Créativité** : Besoin d'innovation et expression
6. **Stabilité** : Tolérance au changement et incertitude
7. **Impact** : Motivation contribution sociale/environnementale
8. **Apprentissage** : Rythme et modes d'acquisition compétences

### Output
Profil psychologique structuré + 5-20 recommandations métiers avec scores de compatibilité
            """,
            responses={
                200: {"description": "Assessment complété avec succès"},
                400: {"description": "Données d'assessment invalides"},
                500: {"description": "Erreur traitement assessment"}
            })
async def process_aube_assessment(
    request: AubeAssessmentRequest
) -> AubeAssessmentResponse:
    """🧠 Processus d'évaluation psychologique Phoenix Aube"""
    try:
        # Validation utilisateur
        validated_user_id = validate_user_id(request.user_id)
        
        # Processing via service métier
        logger.info("Processing Aube assessment", user_id=validated_user_id)
        
        assessment_result = await matching_service.process_full_assessment(
            user_id=validated_user_id,
            signals=request.signals,
            context=request.context or {}
        )
        
        logger.info("Aube assessment completed", 
                   user_id=validated_user_id,
                   matches_count=len(assessment_result.career_matches),
                   confidence=assessment_result.confidence_score)
        
        return assessment_result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Assessment data invalid: {str(e)}"
        )
    except Exception as e:
        logger.error("Aube assessment error", user_id=request.user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assessment processing error: {str(e)}"
        )


@router.get("/assessment/status/{user_id}",
           response_model=AssessmentStatusResponse,
           dependencies=[Depends(ensure_request_is_clean)],
           summary="Statut de l'assessment utilisateur")
async def get_assessment_status(user_id: str) -> AssessmentStatusResponse:
    """📊 Vérifie si l'utilisateur a complété son assessment Phoenix Aube"""
    try:
        validated_user_id = validate_user_id(user_id)
        
        # Vérification via service
        status_data = await matching_service.get_user_assessment_status(validated_user_id)
        
        return AssessmentStatusResponse(
            success=True,
            user_id=validated_user_id,
            **status_data
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user ID: {str(e)}"
        )
    except Exception as e:
        logger.error("Assessment status error", user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status check error: {str(e)}"
        )


@router.get("/recommendations/{user_id}",
           response_model=CareerRecommendationsResponse,
           dependencies=[Depends(ensure_request_is_clean)],
           summary="Recommandations carrière personnalisées",
           description="""
🎯 **Recommandations Carrière Phoenix Aube**

### Intelligence Métier
- **Base de données** : +500 métiers référencés avec compétences
- **Algorithme propriétaire** : Matching multidimensionnel
- **Contexte géographique** : Adaptation marché local (France focus)
- **Évolution temporelle** : Métiers émergents et tendances 2025

### Personnalisation
- Basé sur assessment psychologique complet
- Prise en compte expérience actuelle
- Adaptation niveau de reconversion souhaité
- Suggestions parcours de transition

### Output Structure
Chaque recommandation inclut :
- Score de compatibilité (0-100%)
- Justification psychologique détaillée
- Compétences à acquérir/valoriser  
- Estimation difficulté transition
- Ressources apprentissage suggérées
           """)
async def get_career_recommendations(
    user_id: str,
    limit: int = Query(default=5, ge=1, le=20, description="Nombre max de recommandations"),
    include_analysis: bool = Query(default=True, description="Inclure analyse détaillée")
) -> CareerRecommendationsResponse:
    """🎯 Récupère les recommandations carrière personnalisées pour un utilisateur"""
    try:
        validated_user_id = validate_user_id(user_id)
        
        # Génération recommandations via service
        recommendations_data = await matching_service.get_career_recommendations(
            user_id=validated_user_id,
            limit=limit,
            include_analysis=include_analysis
        )
        
        return CareerRecommendationsResponse(
            success=True,
            user_id=validated_user_id,
            recommendations=recommendations_data["recommendations"],
            personality_insights=recommendations_data.get("personality_insights") if include_analysis else None,
            generated_at=datetime.now(timezone.utc).isoformat()
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid parameters: {str(e)}"
        )
    except Exception as e:
        logger.error("Recommendations error", user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendations generation error: {str(e)}"
        )


@router.post("/assessment/refresh",
            dependencies=[Depends(ensure_request_is_clean)],
            summary="Rafraîchir les recommandations existantes")
async def refresh_user_recommendations(request: AssessmentStatusRequest) -> Dict[str, Any]:
    """🔄 Rafraîchit les recommandations d'un utilisateur avec l'algorithme le plus récent"""
    try:
        validated_user_id = validate_user_id(request.user_id)
        
        # Refresh via service
        refresh_result = await matching_service.refresh_recommendations(validated_user_id)
        
        return {
            "success": True,
            "user_id": validated_user_id,
            "refreshed_at": datetime.now(timezone.utc).isoformat(),
            **refresh_result
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user ID: {str(e)}"
        )
    except Exception as e:
        logger.error("Refresh recommendations error", user_id=request.user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Refresh error: {str(e)}"
        )


# ============================================================================
# ENDPOINTS ANALYTIQUES & DEBUGGING
# ============================================================================

@router.get("/analytics/matching-stats",
           dependencies=[Depends(ensure_request_is_clean)],
           summary="Statistiques du moteur de matching")
async def get_matching_analytics() -> Dict[str, Any]:
    """📈 Statistiques globales du moteur de matching Phoenix Aube"""
    try:
        analytics = await matching_service.get_matching_analytics()
        
        return {
            "success": True,
            "analytics": analytics,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Analytics error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics generation error: {str(e)}"
        )


@router.get("/careers/database",
           dependencies=[Depends(ensure_request_is_clean)],
           summary="Base de données des métiers disponibles")
async def get_careers_database(
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    limit: int = Query(default=50, ge=1, le=500)
) -> Dict[str, Any]:
    """📚 Accès à la base de données des métiers Phoenix Aube"""
    try:
        careers_data = await matching_service.get_careers_database(
            category=category,
            limit=limit
        )
        
        return {
            "success": True,
            "careers": careers_data["careers"],
            "total_count": careers_data["total_count"],
            "categories": careers_data["categories"],
            "last_updated": careers_data["last_updated"]
        }
        
    except Exception as e:
        logger.error("Careers database error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database access error: {str(e)}"
        )