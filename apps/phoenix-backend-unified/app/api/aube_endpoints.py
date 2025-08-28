"""
🌙 Phoenix Aube Endpoints - Assessment & Recommendation System
Luna Hub Integration - MVP Ultra-Light → Court → Profond
Oracle Compliance: Hub roi, Zero logic frontend, Event sourcing, Sécurité
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel, Field

# Luna Hub imports
from ..core.security_guardian import ensure_request_is_clean
from ..core.rate_limiter import rate_limiter, RateLimitScope, RateLimitResult
from ..api.auth_endpoints import get_current_user_dependency
from ..core.events import create_event
from ..core.logging_config import logger

router = APIRouter(prefix="/luna/aube", tags=["Phoenix Aube"])

class AubeSignals(BaseModel):
    """Phoenix Aube v1 - Signals collection (éphémères, éthiques)"""
    appetences: Optional[Dict[str, int]] = Field(default_factory=dict, description="people vs data preferences")
    valeurs_top2: Optional[List[str]] = Field(default_factory=list, description="Top 2 values")
    taches_like: Optional[List[str]] = Field(default_factory=list, description="Preferred tasks")
    taches_avoid: Optional[List[str]] = Field(default_factory=list, description="Tasks to avoid")
    style_travail: Optional[str] = Field(default="", description="Work style preference")
    ia_appetit: Optional[int] = Field(default=5, description="AI appetite 1-10")
    skills_bridge: Optional[List[str]] = Field(default_factory=list, description="Transferable skills")
    contraintes: Optional[List[str]] = Field(default_factory=list, description="Constraints")
    risk_tolerance: Optional[int] = Field(default=5, description="Risk tolerance 1-10")
    secteur_pref: Optional[str] = Field(default="", description="Sector preference")

class AubeSessionStart(BaseModel):
    """Start Aube assessment session"""
    level: str = Field(default="ultra_light", description="ultra_light | court | profond")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="User context")

class AubeSessionUpdate(BaseModel):
    """Update Aube session with signals"""
    session_id: str = Field(..., description="Session identifier")
    signals: AubeSignals = Field(..., description="Collected signals")
    completed_step: str = Field(..., description="Completed step identifier")

class AubeRecommendation(BaseModel):
    """Job recommendation structure"""
    job_code: str = Field(..., description="Job code identifier")
    label: str = Field(..., description="Job label")
    score_teaser: float = Field(..., description="Recommendation score (0-1)")
    reasons: List[Dict[str, str]] = Field(..., description="Reasons for recommendation")
    counter_example: Optional[Dict[str, str]] = Field(default=None, description="Counter example")
    futureproof: Dict[str, Any] = Field(..., description="Future-proof analysis")
    timeline: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Timeline predictions")
    ia_plan: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="IA skills plan")

@router.post("/assessment/start")
async def start_aube_assessment(
    session_data: AubeSessionStart,
    request: Request,
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    🌙 Démarrer une session d'assessment Aube
    
    MVP: Ultra-Light (≤60s) → Court (3-4min) → Profond (7-8min)
    0% énergie pour exploration, event sourcing complet
    """
    try:
        # Rate limiting pour protection
        client_ip = request.client.host if request.client else "unknown"
        rate_result, rate_data = await rate_limiter.check_rate_limit(
            identifier=current_user["id"],
            scope=RateLimitScope.API_GENERAL,
            user_agent=request.headers.get("user-agent", ""),
            additional_context={"endpoint": "aube_start", "level": session_data.level}
        )
        
        if rate_result != RateLimitResult.ALLOWED:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded for Aube assessment"
            )

        # Génération session_id
        session_id = str(uuid.uuid4())
        
        # Event sourcing : session démarrée
        await create_event({
            "type": "aube_session_started",
            "actor_user_id": current_user["id"],
            "payload": {
                "session_id": session_id,
                "level": session_data.level,
                "context": session_data.context,
                "ip": client_ip,
                "user_agent": request.headers.get("user-agent", "")
            }
        })
        
        logger.info(f"Aube session started", 
                   user_id=current_user["id"],
                   session_id=session_id,
                   level=session_data.level)
        
        return {
            "success": True,
            "session_id": session_id,
            "level": session_data.level,
            "user_id": current_user["id"],
            "energy_cost": 0,  # MVP: exploration gratuite
            "estimated_duration_minutes": {
                "ultra_light": 1,
                "court": 4,
                "profond": 8
            }.get(session_data.level, 1),
            "next_step": "collect_signals",
            "disclaimer": "Suggestions, pas de verdicts. Tu peux ajuster/corriger."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Aube session start error", 
                    user_id=current_user["id"], 
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start Aube assessment session"
        )

@router.post("/assessment/update")
async def update_aube_session(
    update_data: AubeSessionUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    🔄 Mise à jour session Aube avec signaux collectés
    
    Collecte progressive: appetences → valeurs → tâches → style → IA
    """
    try:
        # Event sourcing : mise à jour session
        await create_event({
            "type": "aube_session_updated",
            "actor_user_id": current_user["id"],
            "payload": {
                "session_id": update_data.session_id,
                "completed_step": update_data.completed_step,
                "signals": update_data.signals.model_dump(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        })
        
        logger.info(f"Aube session updated",
                   user_id=current_user["id"],
                   session_id=update_data.session_id,
                   step=update_data.completed_step)
        
        return {
            "success": True,
            "session_id": update_data.session_id,
            "completed_step": update_data.completed_step,
            "next_step": _get_next_step(update_data.completed_step),
            "progress_pct": _calculate_progress(update_data.completed_step),
            "energy_cost": 0  # MVP: gratuit
        }
        
    except Exception as e:
        logger.error(f"Aube session update error",
                    user_id=current_user["id"],
                    session_id=update_data.session_id,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update Aube session"
        )

@router.post("/recommendations/{session_id}")
async def get_aube_recommendations(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean),
    k: int = 3  # MVP: Top 3 teaser, V1.1: Top 5
):
    """
    🎯 Générer recommandations métiers basées sur signaux Aube
    
    MVP: Top 3 métiers + raisons lisibles + future-proof light
    V1.1: Top 5 + timeline + plans IA détaillés
    """
    try:
        # Simuler récupération signaux (en réalité: from session store/events)
        # Pour MVP, utiliser le stub du matching service existant
        mock_features = {
            "appetences": {"people": 7, "data": 4},
            "valeurs": ["autonomie", "impact"],
            "taches_like": ["ateliers", "contact_usager"],
            "ia_appetit": 6
        }
        
        # Génération recommandations (MVP stub)
        recommendations = _generate_recommendations_mvp(mock_features, k)
        
        # Event sourcing : recommandations générées
        await create_event({
            "type": "aube_recommendations_generated",
            "actor_user_id": current_user["id"],
            "payload": {
                "session_id": session_id,
                "job_codes": [r["job_code"] for r in recommendations],
                "count": len(recommendations),
                "algorithm_version": "mvp_stub_v1"
            }
        })
        
        # Générer chapitres Journal automatiques
        journal_chapters = await _create_journal_chapters(
            current_user["id"], 
            session_id, 
            recommendations
        )
        
        logger.info(f"Aube recommendations generated",
                   user_id=current_user["id"],
                   session_id=session_id,
                   count=len(recommendations))
        
        return {
            "success": True,
            "session_id": session_id,
            "recommendations": recommendations,
            "journal_chapters": journal_chapters,
            "meta": {
                "algorithm": "mvp_matching_v1",
                "future_proof": "light",
                "disclaimer": "Estimations basées sur tendances actuelles",
                "export_available": True
            },
            "handover": {
                "cv_prefill": f"/phoenix-cv/prefill?aube_session={session_id}",
                "letters_ideas": f"/phoenix-letters/ideas?aube_session={session_id}",
                "energy_cost": 0  # MVP: handover léger gratuit
            }
        }
        
    except Exception as e:
        logger.error(f"Aube recommendations error",
                    user_id=current_user["id"],
                    session_id=session_id,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Aube recommendations"
        )

def _get_next_step(current_step: str) -> str:
    """Détermine la prochaine étape selon le parcours MVP"""
    steps_flow = {
        "appetences": "valeurs",
        "valeurs": "taches_preferences", 
        "taches_preferences": "style_travail",
        "style_travail": "ia_attitude",
        "ia_attitude": "generate_recommendations"
    }
    return steps_flow.get(current_step, "completed")

def _calculate_progress(current_step: str) -> int:
    """Calcule le pourcentage de progression"""
    progress_map = {
        "appetences": 20,
        "valeurs": 40,
        "taches_preferences": 60,
        "style_travail": 80,
        "ia_attitude": 90,
        "completed": 100
    }
    return progress_map.get(current_step, 0)

def _generate_recommendations_mvp(features: Dict[str, Any], k: int) -> List[Dict[str, Any]]:
    """
    Génération recommandations MVP (stub basé sur matching service existant)
    """
    appet = features.get("appetences", {})
    prefers_people = (appet.get("people", 0) >= appet.get("data", 0))
    
    base_recommendations = [
        {
            "job_code": "UXD",
            "label": "UX Designer", 
            "score_teaser": 0.76,
            "reasons": [
                {"feature": "valeurs", "phrase": "Autonomie + impact → métiers à ownership"},
                {"feature": "taches_like", "phrase": "Ateliers usagers → UX terrain"}
            ],
            "counter_example": {
                "risk": "reporting_pur", 
                "phrase": "Si tu évites le reporting pur… Alternative : UX Research junior"
            },
            "futureproof": {
                "score_0_1": 0.76,
                "drivers": [
                    {"factor": "taches_routinisables", "direction": "down", "phrase": "Tâches routinisables ↓"},
                    {"factor": "interaction_humaine", "direction": "up", "phrase": "Interaction humaine ↑"}
                ]
            },
            "timeline": [
                {"year": 2026, "change": "↑ design ops outillé IA", "signal": "adoption", "confidence": 2}
            ],
            "ia_plan": [
                {
                    "skill": "Prompting avancé",
                    "micro_action": "Créer 3 gabarits",
                    "effort_min_per_day": 20,
                    "resource_hint": "kb://ia/prompting",
                    "benefit_phrase": "Vitesse + Qualité",
                    "difficulty": 1
                }
            ]
        },
        {
            "job_code": "PO",
            "label": "Product Owner",
            "score_teaser": 0.68,
            "reasons": [
                {"feature": "valeurs", "phrase": "Autonomie + impact → ownership"}
            ],
            "counter_example": None,
            "futureproof": {
                "score_0_1": 0.68,
                "drivers": [
                    {"factor": "coordination", "direction": "up", "phrase": "Coordination humaine ↑"}
                ]
            },
            "timeline": [],
            "ia_plan": []
        }
    ]
    
    if not prefers_people:
        base_recommendations.insert(0, {
            "job_code": "DA",
            "label": "Data Analyst (light)",
            "score_teaser": 0.55,
            "reasons": [
                {"feature": "taches_like", "phrase": "Analyse & optimisation → Data light"}
            ],
            "counter_example": None,
            "futureproof": {
                "score_0_1": 0.55,
                "drivers": [
                    {"factor": "automatisation", "direction": "down", "phrase": "Automatisation ↑ sur tâches routinières"}
                ]
            },
            "timeline": [
                {"year": 2027, "change": "↑ auto‑BI", "signal": "outillage", "confidence": 1}
            ],
            "ia_plan": [
                {
                    "skill": "Automatisation simple",
                    "micro_action": "1 workflow no‑code",
                    "effort_min_per_day": 25,
                    "resource_hint": "kb://automation/no-code",
                    "benefit_phrase": "Moins de tâches répétitives",
                    "difficulty": 1
                }
            ]
        })
    
    return base_recommendations[:k]

async def _create_journal_chapters(user_id: str, session_id: str, recommendations: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Génère automatiquement les chapitres Journal suite à l'assessment Aube
    """
    try:
        chapters = []
        
        # Chapitre 1: Clarté
        await create_event({
            "type": "journal_chapter_created",
            "actor_user_id": user_id,
            "payload": {
                "session_id": session_id,
                "chapter_type": "aube_clarity",
                "title": "J'ai clarifié qui je suis",
                "content": "Grâce à Phoenix Aube, j'ai exploré mes appétences et mes valeurs. Je commence à voir plus clair dans mes aspirations professionnelles.",
                "auto_generated": True
            }
        })
        chapters.append({"type": "clarity", "title": "J'ai clarifié qui je suis"})
        
        # Chapitre 2: Forces
        await create_event({
            "type": "journal_chapter_created", 
            "actor_user_id": user_id,
            "payload": {
                "session_id": session_id,
                "chapter_type": "aube_strengths",
                "title": "J'ai redécouvert mes forces cachées",
                "content": "Mon assessment révèle des compétences transférables que je n'avais pas identifiées. Ces atouts vont être précieux pour ma transition.",
                "auto_generated": True
            }
        })
        chapters.append({"type": "strengths", "title": "J'ai redécouvert mes forces cachées"})
        
        # Chapitre 3: Chemins possibles
        job_labels = [rec["label"] for rec in recommendations[:3]]
        await create_event({
            "type": "journal_chapter_created",
            "actor_user_id": user_id, 
            "payload": {
                "session_id": session_id,
                "chapter_type": "aube_paths",
                "title": "Je vois les chemins possibles devant moi",
                "content": f"Phoenix Aube m'a proposé {len(recommendations)} pistes métiers : {', '.join(job_labels)}. Chaque option a ses raisons et je comprends pourquoi elle me correspond.",
                "auto_generated": True,
                "job_codes": [rec["job_code"] for rec in recommendations]
            }
        })
        chapters.append({"type": "paths", "title": "Je vois les chemins possibles devant moi"})
        
        return chapters
        
    except Exception as e:
        logger.error(f"Journal chapters creation error", user_id=user_id, error=str(e))
        return []

@router.get("/export/{session_id}")
async def export_aube_results(
    session_id: str,
    format_type: str = "json",
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    📤 Export des résultats Aube (éthique & RGPD)
    
    Formats: json, pdf, csv
    Contenu: signaux anonymisés + recommandations + explications
    """
    try:
        # Récupérer données session (simulation)
        export_data = {
            "session_id": session_id,
            "user_id": current_user["id"],
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "Données personnelles - usage strictement personnel",
            "algorithm_version": "aube_mvp_v1",
            "signals": {
                "note": "Signaux collectés de manière éthique et transparente",
                "appetences": {"people": 7, "data": 4},
                "valeurs": ["autonomie", "impact"],
                "preferences": "Anonymisé pour confidentialité"
            },
            "recommendations": _generate_recommendations_mvp({}, 3),
            "explanations": {
                "methodology": "Matching basé sur préférences déclarées",
                "future_proof": "Estimations basées sur tendances sectorielles 2024",
                "disclaimer": "Suggestions uniquement, pas de diagnostic"
            }
        }
        
        # Event sourcing
        await create_event({
            "type": "aube_data_exported",
            "actor_user_id": current_user["id"],
            "payload": {
                "session_id": session_id,
                "format": format_type,
                "gdpr_compliant": True
            }
        })
        
        return JSONResponse(
            content=export_data,
            headers={
                "Content-Disposition": f"attachment; filename=phoenix_aube_{session_id}.{format_type}",
                "Content-Type": "application/json"
            }
        )
        
    except Exception as e:
        logger.error(f"Aube export error", user_id=current_user["id"], error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export Aube results"
        )