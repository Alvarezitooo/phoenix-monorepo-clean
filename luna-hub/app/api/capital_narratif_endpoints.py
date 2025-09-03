"""
📚 Capital Narratif - API Endpoints
Event Sourcing pur selon Directive Oracle #4
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator
from app.core.supabase_client import event_store
from app.core.security_guardian import SecurityGuardian
import structlog

# Logger structuré
logger = structlog.get_logger()

# Router Capital Narratif
narratif_router = APIRouter(prefix="/luna", tags=["Event Store"])


# ============================================================================
# MODELS DE REQUÊTE/RÉPONSE
# ============================================================================

class EventRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur", min_length=1, max_length=50)
    event_type: str = Field(..., description="Type d'événement", min_length=1, max_length=100)
    app_source: str = Field(..., description="Application source", min_length=1, max_length=50)
    event_data: Dict[str, Any] = Field(..., description="Données de l'événement")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Métadonnées optionnelles")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        return SecurityGuardian.validate_user_id(v)
    
    @validator('event_type')
    def validate_event_type(cls, v):
        return SecurityGuardian.sanitize_string(v, 100)
    
    @validator('app_source')
    def validate_app_source(cls, v):
        return SecurityGuardian.sanitize_string(v, 50)
    
    @validator('event_data')
    def validate_event_data(cls, v):
        return SecurityGuardian.validate_context(v)
    
    @validator('metadata')
    def validate_metadata(cls, v):
        return SecurityGuardian.validate_context(v) if v else {}


class EventResponse(BaseModel):
    success: bool
    event_id: str
    message: str
    timestamp: str


class UserEventsResponse(BaseModel):
    success: bool
    user_id: str
    events: List[Dict[str, Any]]
    total_count: int
    event_type_filter: Optional[str] = None


class CapitalNarratifResponse(BaseModel):
    success: bool
    user_id: str
    capital_narratif: Dict[str, Any]
    last_updated: str
    source: str = "event_store_real_time"


# ============================================================================
# ENDPOINTS EVENT STORE
# ============================================================================

@narratif_router.post("/events", 
                     response_model=EventResponse,
                     summary="Créer un événement dans l'Event Store",
                     description="""
📚 **Crée un événement immuable dans l'Event Store Supabase**

### Principe Oracle #4
- **Tout est un Événement** : Chaque action du système génère un événement
- **Immutabilité** : Les événements ne peuvent jamais être modifiés
- **Source de Vérité** : Base du Capital Narratif et analytics

### Sécurité
- **Security Guardian** : Validation et nettoyage de tous les inputs
- **Structured Logs** : Traçabilité complète des créations d'événements

### Cas d'usage
- Actions utilisateur (génération lettre, analyse CV)
- Événements système (login, achat, erreur)
- Analytics et tracking pour API Iris
                     """,
                     responses={
                         400: {"description": "Données invalides (Security Guardian)"},
                         500: {"description": "Erreur Event Store"}
                     })
async def create_event(request: EventRequest) -> EventResponse:
    """📚 Crée un événement immuable dans l'Event Store"""
    try:
        event_id = await event_store.create_event(
            user_id=request.user_id,
            event_type=request.event_type,
            app_source=request.app_source,
            event_data=request.event_data,
            metadata=request.metadata
        )
        
        logger.info(
            "Event created via API",
            event_id=event_id,
            user_id=request.user_id,
            event_type=request.event_type,
            app_source=request.app_source
        )
        
        return EventResponse(
            success=True,
            event_id=event_id,
            message="Event created successfully",
            timestamp=event_id  # Utilise l'event_id comme timestamp de référence
        )
        
    except Exception as e:
        logger.error(
            "Failed to create event via API",
            user_id=request.user_id,
            event_type=request.event_type,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Event Store error: {str(e)}"
        )


@narratif_router.get("/events/{user_id}",
                    response_model=UserEventsResponse,
                    summary="Récupérer les événements d'un utilisateur",
                    description="""
📚 **Récupère les événements bruts d'un utilisateur depuis l'Event Store**

### Event Sourcing
- **Événements bruts** : Données non transformées depuis Supabase
- **Filtrage optionnel** : Par type d'événement
- **Ordre chronologique** : Plus récent en premier

### Différence avec /narrative
- `/events` = événements bruts pour debugging/admin
- `/narrative` = Capital Narratif reconstruit pour l'utilisateur
                    """)
async def get_user_events(
    user_id: str,
    limit: int = 50,
    event_type: Optional[str] = None
) -> UserEventsResponse:
    """📚 Récupère les événements bruts d'un utilisateur"""
    try:
        # Validation Security Guardian
        clean_user_id = SecurityGuardian.validate_user_id(user_id)
        
        events = await event_store.get_user_events(
            user_id=clean_user_id,
            limit=limit,
            event_type=event_type
        )
        
        logger.info(
            "User events retrieved via API",
            user_id=clean_user_id,
            count=len(events),
            event_type=event_type
        )
        
        return UserEventsResponse(
            success=True,
            user_id=clean_user_id,
            events=events,
            total_count=len(events),
            event_type_filter=event_type
        )
        
    except Exception as e:
        logger.error(
            "Failed to retrieve user events",
            user_id=user_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Event Store error: {str(e)}"
        )


@narratif_router.get("/narrative/{user_id}",
                    response_model=CapitalNarratifResponse,
                    summary="Capital Narratif - Event Sourcing pur",
                    description="""
🎯 **ENDPOINT ORACLE CRITIQUE : Capital Narratif reconstruit en temps réel**

### Event Sourcing Pur
- **TOUJOURS** reconstruit depuis l'Event Store à chaque appel
- **Aucun état intermédiaire** stocké (conformité Oracle)
- **Source de vérité unique** : les événements Supabase

### Reconstruction Intelligente
1. Récupère TOUS les événements de l'utilisateur
2. Analyse les patterns d'usage et compétences
3. Génère insights et recommandations
4. Retourne le Capital Narratif enrichi

### Utilisation par API Iris
Cet endpoint alimente l'IA Phoenix Iris pour :
- Conseils personnalisés
- Stratégies de candidature
- Évolution professionnelle
                    """)
async def get_capital_narratif(user_id: str) -> CapitalNarratifResponse:
    """
    🎯 ORACLE CRITIQUE: Reconstruit le Capital Narratif en temps réel
    Event Sourcing pur - aucun état intermédiaire stocké
    """
    try:
        # Validation Security Guardian
        clean_user_id = SecurityGuardian.validate_user_id(user_id)
        
        # Récupération de TOUS les événements (Event Sourcing pur)
        events = await event_store.get_user_events(
            user_id=clean_user_id,
            limit=1000  # Large limit pour reconstruction complète
        )
        
        # 🎯 RECONSTRUCTION DU CAPITAL NARRATIF
        capital_narratif = await _reconstruct_capital_narratif(clean_user_id, events)
        
        logger.info(
            "Capital Narratif reconstructed",
            user_id=clean_user_id,
            events_count=len(events),
            narratif_sections=len(capital_narratif)
        )
        
        return CapitalNarratifResponse(
            success=True,
            user_id=clean_user_id,
            capital_narratif=capital_narratif,
            last_updated=datetime.now().isoformat(),
            source="event_store_real_time"
        )
        
    except Exception as e:
        logger.error(
            "Failed to reconstruct Capital Narratif",
            user_id=user_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Capital Narratif reconstruction error: {str(e)}"
        )


# ============================================================================
# LOGIQUE DE RECONSTRUCTION DU CAPITAL NARRATIF
# ============================================================================

async def _reconstruct_capital_narratif(user_id: str, events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    🧠 Reconstruit le Capital Narratif depuis les événements
    Logique métier pure Event Sourcing
    """
    from datetime import datetime
    
    # Analyse des événements pour extraire les insights
    actions_performed = {}
    skills_demonstrated = set()
    apps_used = set()
    energy_patterns = []
    timeline = []
    
    for event in events:
        event_data = event.get("event_data", {})
        app_source = event.get("app_source", "unknown")
        created_at = event.get("created_at", "")
        
        # Comptage des actions
        action = event_data.get("action")
        if action:
            actions_performed[action] = actions_performed.get(action, 0) + 1
        
        # Apps utilisées
        apps_used.add(app_source)
        
        # Patterns d'énergie
        if event_data.get("energy_consumed") is not None:
            energy_patterns.append({
                "action": action,
                "energy_consumed": event_data.get("energy_consumed", 0),
                "subscription_type": event_data.get("subscription_type", "free"),
                "timestamp": created_at
            })
        
        # Timeline des actions importantes
        if action and app_source != "luna_hub":
            timeline.append({
                "action": action,
                "app": app_source,
                "timestamp": created_at,
                "context": event_data.get("context", {})
            })
        
        # Extraction des compétences depuis le contexte
        context = event_data.get("context", {})
        if context.get("target_role"):
            skills_demonstrated.add(context["target_role"])
        if context.get("industry"):
            skills_demonstrated.add(context["industry"])
    
    # Construction du Capital Narratif enrichi
    capital_narratif = {
        "user_profile": {
            "user_id": user_id,
            "total_events": len(events),
            "apps_mastered": list(apps_used),
            "skills_demonstrated": list(skills_demonstrated),
            "most_frequent_action": max(actions_performed.items(), key=lambda x: x[1])[0] if actions_performed else None
        },
        "usage_analytics": {
            "actions_breakdown": actions_performed,
            "total_energy_consumed": sum(p["energy_consumed"] for p in energy_patterns),
            "average_energy_per_action": sum(p["energy_consumed"] for p in energy_patterns) / len(energy_patterns) if energy_patterns else 0,
            "subscription_insights": _analyze_subscription_patterns(energy_patterns)
        },
        "professional_journey": {
            "timeline": sorted(timeline, key=lambda x: x["timestamp"], reverse=True)[:10],
            "career_progression": _extract_career_progression(timeline),
            "expertise_areas": _identify_expertise_areas(events)
        },
        "ai_insights": {
            "engagement_score": _calculate_engagement_score(events),
            "growth_trajectory": _analyze_growth_trajectory(timeline),
            "recommendations": _generate_recommendations(actions_performed, skills_demonstrated)
        },
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "source": "event_store_reconstruction",
            "events_analyzed": len(events),
            "reconstruction_version": "2.0"
        }
    }
    
    return capital_narratif


def _analyze_subscription_patterns(energy_patterns: List[Dict]) -> Dict[str, Any]:
    """Analyse les patterns d'abonnement"""
    if not energy_patterns:
        return {"type": "no_data"}
    
    subscription_types = [p["subscription_type"] for p in energy_patterns]
    most_common = max(set(subscription_types), key=subscription_types.count)
    
    return {
        "primary_subscription": most_common,
        "upgrade_candidate": most_common == "free" and len(energy_patterns) > 10
    }


def _extract_career_progression(timeline: List[Dict]) -> List[str]:
    """Extrait la progression de carrière depuis la timeline"""
    roles = []
    for event in timeline:
        context = event.get("context", {})
        if context.get("target_role"):
            roles.append(context["target_role"])
    
    return list(dict.fromkeys(roles))  # Preserve order, remove duplicates


def _identify_expertise_areas(events: List[Dict]) -> List[str]:
    """Identifie les domaines d'expertise"""
    expertise = {}
    
    for event in events:
        event_data = event.get("event_data", {})
        action = event_data.get("action", "")
        
        # Mapping des actions vers domaines d'expertise
        if "cv" in action.lower():
            expertise["cv_optimization"] = expertise.get("cv_optimization", 0) + 1
        elif "lettre" in action.lower():
            expertise["cover_letters"] = expertise.get("cover_letters", 0) + 1
        elif "mirror" in action.lower():
            expertise["job_matching"] = expertise.get("job_matching", 0) + 1
        elif "analyse" in action.lower():
            expertise["strategic_analysis"] = expertise.get("strategic_analysis", 0) + 1
    
    return sorted(expertise.keys(), key=lambda k: expertise[k], reverse=True)


def _calculate_engagement_score(events: List[Dict]) -> float:
    """Calcule un score d'engagement de 0 à 100"""
    if not events:
        return 0.0
    
    # Score basé sur la diversité et fréquence d'utilisation
    unique_actions = len(set(e.get("event_data", {}).get("action") for e in events if e.get("event_data", {}).get("action")))
    total_events = len(events)
    
    # Facteur de diversité (plus d'actions différentes = meilleur engagement)
    diversity_score = min(unique_actions * 10, 50)
    
    # Facteur de volume (plus d'événements = meilleur engagement)
    volume_score = min(total_events * 2, 50)
    
    return round(diversity_score + volume_score, 1)


def _analyze_growth_trajectory(timeline: List[Dict]) -> str:
    """Analyse la trajectoire de croissance"""
    if len(timeline) < 3:
        return "early_user"
    
    # Analyse de la progression dans les actions
    action_complexity = {
        "conseil_rapide": 1,
        "format_lettre": 2, 
        "lettre_motivation": 3,
        "analyse_cv_complete": 4,
        "mirror_match": 5,
        "strategie_candidature": 5
    }
    
    recent_complexity = []
    for event in timeline[:5]:  # 5 dernières actions
        action = event.get("action", "")
        complexity = action_complexity.get(action, 1)
        recent_complexity.append(complexity)
    
    if not recent_complexity:
        return "exploring"
    
    avg_complexity = sum(recent_complexity) / len(recent_complexity)
    
    if avg_complexity >= 4:
        return "advanced_user"
    elif avg_complexity >= 2.5:
        return "progressing"
    else:
        return "beginner"


def _generate_recommendations(actions: Dict[str, int], skills: set) -> List[str]:
    """Génère des recommandations basées sur l'usage"""
    recommendations = []
    
    # Recommandations basées sur les actions les plus fréquentes
    if actions.get("lettre_motivation", 0) > 3:
        recommendations.append("Essayez notre fonction 'strategie_candidature' pour optimiser vos candidatures")
    
    if actions.get("analyse_cv_complete", 0) > 2:
        recommendations.append("Utilisez 'mirror_match' pour adapter votre CV aux offres spécifiques")
    
    if len(actions) == 1:
        recommendations.append("Explorez d'autres fonctionnalités Phoenix pour enrichir votre profil")
    
    # Recommandations basées sur les compétences
    if "tech" in skills:
        recommendations.append("Optimisez vos candidatures tech avec nos templates spécialisés")
    
    if not recommendations:
        recommendations.append("Continuez à utiliser Phoenix pour développer votre Capital Narratif")
    
    return recommendations[:3]  # Limite à 3 recommandations


async def get_narrative_context(user_id: str) -> Dict[str, Any]:
    """
    🧠 Récupère le contexte narratif pour l'IA
    Used by AI endpoints to get user context
    """
    try:
        # Get recent events for narrative context
        events = await event_store.get_user_events(user_id, limit=20)
        
        if not events:
            return {
                "recent_events": [],
                "user_profile": {"user_id": user_id, "new_user": True},
                "context_summary": "Nouvel utilisateur Phoenix"
            }
        
        # Build narrative context optimized for AI
        recent_events = []
        for event in events[-10:]:  # Last 10 events
            event_data = event.get("event_data", {})
            if event_data.get("action"):
                recent_events.append({
                    "action": event_data.get("action"),
                    "content": event_data.get("context", {}).get("summary", ""),
                    "timestamp": event.get("created_at"),
                    "app_source": event.get("app_source")
                })
        
        # Basic user profile for personalization
        user_profile = {
            "user_id": user_id,
            "total_interactions": len(events),
            "most_used_app": _get_most_used_app(events),
            "engagement_level": "active" if len(events) > 5 else "new"
        }
        
        return {
            "recent_events": recent_events,
            "user_profile": user_profile,
            "context_summary": f"Utilisateur actif avec {len(events)} interactions Phoenix"
        }
        
    except Exception as e:
        logger.error("Failed to get narrative context", user_id=user_id, error=str(e))
        return {
            "recent_events": [],
            "user_profile": {"user_id": user_id, "error": True},
            "context_summary": "Contexte indisponible"
        }


def _get_most_used_app(events: List[Dict]) -> str:
    """Trouve l'app la plus utilisée"""
    app_counts = {}
    for event in events:
        app = event.get("app_source", "unknown")
        app_counts[app] = app_counts.get(app, 0) + 1
    
    if not app_counts:
        return "none"
    
    return max(app_counts.items(), key=lambda x: x[1])[0]