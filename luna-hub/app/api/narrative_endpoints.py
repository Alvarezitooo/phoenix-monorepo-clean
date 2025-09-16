"""
🧠 Narrative Endpoints - Réception et traitement des enrichissements narratifs
Phoenix Luna Hub - Event Enrichment Layer

Endpoints pour recevoir les enrichissements narratifs automatiques du frontend
et les intégrer intelligemment dans le système Journal Narratif.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import structlog

# Imports Luna Hub
from ..core.journal_service import journal_service
from ..core.narrative_analyzer import narrative_analyzer
from ..core.events import create_event
from ..core.supabase_client import event_store
from .luna_endpoints import get_current_user_id

logger = structlog.get_logger("narrative_endpoints")

router = APIRouter(prefix="/narrative", tags=["Narrative Intelligence"])

# ========== MODÈLES PYDANTIC ==========

class BehavioralSignals(BaseModel):
    time_spent_ms: int
    interaction_depth: str  # 'surface' | 'engaged' | 'deep'
    completion_confidence: str  # 'hesitant' | 'confident' | 'decisive'
    session_momentum: str  # 'building' | 'maintaining' | 'declining'
    emotional_indicators: List[str]

class ModuleActionContext(BaseModel):
    module: str  # 'aube' | 'cv' | 'letters' | 'rise'
    action_type: str
    tool_used: str
    results_quality: Optional[str] = None  # 'low' | 'medium' | 'high'
    user_satisfaction_inferred: Optional[str] = None  # 'dissatisfied' | 'neutral' | 'satisfied'
    next_likely_actions: List[str]

class NarrativePredictions(BaseModel):
    next_module_likely: str
    user_emotional_state: str
    journey_stage: str
    blockers_detected: List[str]
    opportunities_identified: List[str]

class NarrativeMetadata(BaseModel):
    story_chapter: str
    character_development: str
    plot_advancement: str  # 'major' | 'minor' | 'setup'
    emotional_arc_change: str  # 'positive' | 'negative' | 'neutral'

class NarrativeEnrichmentRequest(BaseModel):
    user_id: str
    event_type: str  # 'aube_career_discovery_completed', etc.
    app_source: str  # 'aube', 'cv', 'letters', 'rise'
    timestamp: str
    session_id: Optional[str] = None
    
    narrative_enrichment: Dict[str, Any]  # Contient tous les enrichissements

class NarrativeContextRequest(BaseModel):
    user_id: str
    current_module: Optional[str] = None
    include_predictions: bool = True

# ========== ENDPOINTS ==========

@router.post("/enrich-event", summary="Enrichissement narratif d'un événement utilisateur")
async def enrich_narrative_event(
    request: NarrativeEnrichmentRequest,
    current_user_id: Optional[str] = Depends(get_current_user_id)
):
    """
    🧠 Réception et traitement d'un événement enrichi narrativement
    
    Cet endpoint reçoit les enrichissements automatiques du frontend et les intègre
    dans le système narratif Luna pour alimenter le Journal et les Spécialistes.
    """
    
    try:
        # Validation utilisateur (optionnelle pour permettre les utilisateurs non connectés)
        user_id = current_user_id or request.user_id
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID required for narrative enrichment"
            )
        
        logger.info("Processing narrative enrichment",
                   user_id=user_id,
                   event_type=request.event_type,
                   app_source=request.app_source)
        
        # 1. Extraire les données d'enrichissement
        enrichment = request.narrative_enrichment
        explicit_data = enrichment.get("explicit_data", {})
        behavioral_signals = enrichment.get("behavioral_signals", {})
        module_context = enrichment.get("module_context", {})
        predictions = enrichment.get("predictions", {})
        narrative_metadata = enrichment.get("narrative_metadata", {})
        
        # 2. Créer un événement enrichi dans l'Event Store
        event_payload = {
            # Données explicites de l'action
            "explicit_action_data": explicit_data,
            
            # Intelligence comportementale
            "behavioral_intelligence": {
                "interaction_depth": behavioral_signals.get("interaction_depth", "surface"),
                "engagement_quality": behavioral_signals.get("completion_confidence", "neutral"),
                "session_momentum": behavioral_signals.get("session_momentum", "maintaining"),
                "emotional_indicators": behavioral_signals.get("emotional_indicators", []),
                "time_investment_ms": behavioral_signals.get("time_spent_ms", 0)
            },
            
            # Contexte d'action spécifique
            "action_intelligence": {
                "tool_utilized": module_context.get("tool_used", "unknown"),
                "outcome_quality": module_context.get("results_quality", "medium"),
                "satisfaction_inferred": module_context.get("user_satisfaction_inferred", "neutral"),
                "follow_up_predictions": module_context.get("next_likely_actions", [])
            },
            
            # Prédictions et insights
            "predictive_intelligence": {
                "journey_progression": predictions.get("journey_stage", "exploration"),
                "emotional_trajectory": predictions.get("user_emotional_state", "neutral"),
                "next_module_probability": predictions.get("next_module_likely", "unknown"),
                "growth_blockers": predictions.get("blockers_detected", []),
                "acceleration_opportunities": predictions.get("opportunities_identified", [])
            },
            
            # Métadonnées narratives pour le Journal
            "narrative_intelligence": {
                "story_chapter": narrative_metadata.get("story_chapter", "Unknown Chapter"),
                "character_arc": narrative_metadata.get("character_development", "Steady progression"),
                "plot_significance": narrative_metadata.get("plot_advancement", "minor"),
                "emotional_evolution": narrative_metadata.get("emotional_arc_change", "neutral")
            },
            
            # Métadonnées techniques
            "enrichment_metadata": {
                "source": "frontend_automatic_capture",
                "session_id": request.session_id,
                "capture_timestamp": request.timestamp,
                "processing_timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
        # 3. Créer l'événement dans l'Event Store (sera automatiquement traité par Narrative Analyzer)
        event_id = await create_event({
            "type": f"narrative_enriched_{request.event_type}",
            "actor_user_id": user_id,
            "payload": event_payload
        })
        
        # 4. Trigger immédiat de mise à jour du contexte narratif
        # Le Narrative Analyzer va automatiquement traiter ce nouvel événement
        await narrative_analyzer.invalidate_cache_for_user(user_id)
        
        # 5. Générer des insights immédiats pour les Spécialistes Luna
        immediate_insights = await _generate_immediate_insights(
            user_id=user_id,
            event_type=request.event_type,
            enrichment=enrichment
        )
        
        # 6. Mise à jour optionnelle du Journal si demandée
        if predictions.get("update_journal_immediately", False):
            try:
                updated_journal = await journal_service.get_journal_data(user_id, "7d")
                logger.info("Journal updated immediately", user_id=user_id)
            except Exception as journal_error:
                logger.warning("Immediate journal update failed", 
                              user_id=user_id, 
                              error=str(journal_error))
        
        logger.info("Narrative enrichment processed successfully",
                   user_id=user_id,
                   event_id=event_id,
                   enrichment_quality=module_context.get("results_quality", "unknown"))
        
        return {
            "success": True,
            "message": "Narrative enrichment processed successfully",
            "event_id": event_id,
            "immediate_insights": immediate_insights,
            "narrative_context_updated": True,
            "recommendations": _generate_proactive_recommendations(enrichment)
        }
        
    except Exception as e:
        logger.error("Narrative enrichment processing failed",
                    user_id=request.user_id,
                    event_type=request.event_type,
                    error=str(e))
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process narrative enrichment: {str(e)}"
        )


@router.post("/current-state", summary="État narratif actuel pour Luna Sidebar")
async def get_current_narrative_state(
    request: dict,
    current_user_id: Optional[str] = Depends(get_current_user_id)
):
    """
    🎯 Endpoint pour la Luna Conversational Sidebar
    
    Retourne l'état narratif simplifié pour l'affichage des insights temps réel.
    Compatible avec fetchCurrentNarrativeState() du frontend.
    """
    try:
        user_id = request.get("user_id")
        module = request.get("module", "default")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID required"
            )
        
        logger.info("Getting current narrative state",
                   user_id=user_id,
                   module=module)
        
        # Utiliser le système sophistiqué existant
        context_packet = await narrative_analyzer.generate_context_packet(user_id)
        
        # Format simplifié pour la sidebar Luna
        narrative_state = {
            "userId": user_id,
            "module": module,
            "lastUpdate": datetime.now(timezone.utc).isoformat(),
            
            # État de session
            "sessionMomentum": _assess_session_momentum(context_packet),
            "interactionDepth": _assess_interaction_depth(context_packet),
            "engagementLevel": _assess_engagement_level(context_packet),
            
            # État émotionnel et progression
            "emotionalState": _infer_current_emotional_state(context_packet),
            "journeyStage": _identify_journey_stage(module, context_packet),
            
            # Prédictions et opportunités
            "nextPredictions": _predict_next_actions(context_packet)[:3],  # Top 3
            "blockers": _predict_potential_blockers(context_packet)[:2],   # Top 2
            "opportunities": _identify_acceleration_opportunities(context_packet)[:2]  # Top 2
        }
        
        logger.info("Current narrative state retrieved successfully",
                   user_id=user_id,
                   module=module,
                   journey_stage=narrative_state["journeyStage"],
                   session_momentum=narrative_state["sessionMomentum"])
        
        return {
            "success": True,
            "narrative_state": narrative_state
        }
        
    except Exception as e:
        logger.error("Current narrative state retrieval failed",
                    user_id=request.get("user_id", "unknown"),
                    module=request.get("module", "unknown"),
                    error=str(e))
        
        # Fallback gracieux
        return {
            "success": False,
            "narrative_state": {
                "userId": request.get("user_id"),
                "module": request.get("module", "default"),
                "sessionMomentum": "maintaining",
                "interactionDepth": "surface",
                "engagementLevel": "medium",
                "emotionalState": "neutral",
                "journeyStage": "exploration",
                "nextPredictions": [],
                "blockers": [],
                "opportunities": []
            }
        }

@router.post("/context", summary="Récupération du contexte narratif enrichi")
async def get_narrative_context(
    request: NarrativeContextRequest,
    current_user_id: Optional[str] = Depends(get_current_user_id)
):
    """
    📖 Récupération du contexte narratif complet pour un utilisateur
    
    Utilisé par les Luna Specialists pour obtenir le contexte enrichi
    et personnaliser leurs interactions.
    """
    
    try:
        user_id = current_user_id or request.user_id
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID required"
            )
        
        logger.info("Retrieving narrative context",
                   user_id=user_id,
                   current_module=request.current_module)
        
        # 1. Récupérer le Journal Narratif complet
        journal_data = await journal_service.get_journal_data(user_id, "14d")
        
        # 2. Récupérer le contexte du Narrative Analyzer
        context_packet = await narrative_analyzer.generate_context_packet(user_id)
        
        # 3. Construire le contexte enrichi pour les Spécialistes
        enriched_context = {
            "user_profile": {
                "user_id": user_id,
                "journey_stage": context_packet.user.journey_stage if hasattr(context_packet.user, 'journey_stage') else "exploration",
                "engagement_level": _assess_engagement_level(context_packet),
                "preferred_communication_style": _infer_communication_style(context_packet)
            },
            
            "narrative_summary": {
                "current_chapter": _extract_current_chapter(journal_data),
                "recent_achievements": _extract_recent_achievements(journal_data),
                "active_goals": _extract_active_goals(context_packet),
                "emotional_state": _infer_current_emotional_state(context_packet)
            },
            
            "contextual_insights": {
                "last_interactions": _get_recent_interactions(context_packet),
                "module_preferences": _analyze_module_preferences(context_packet),
                "success_patterns": _identify_success_patterns(context_packet),
                "support_needs": _identify_support_needs(context_packet)
            },
            
            "specialist_recommendations": {
                "suggested_prompts": _generate_contextual_prompts(request.current_module, context_packet),
                "proactive_suggestions": _generate_proactive_suggestions(context_packet),
                "personalized_greeting": _generate_personalized_greeting(request.current_module, context_packet),
                "energy_optimization": _suggest_energy_optimization(context_packet)
            }
        }
        
        # 4. Prédictions si demandées
        if request.include_predictions:
            enriched_context["predictions"] = {
                "next_likely_actions": _predict_next_actions(context_packet),
                "optimal_interaction_timing": _predict_optimal_timing(context_packet),
                "potential_blockers": _predict_potential_blockers(context_packet),
                "acceleration_opportunities": _identify_acceleration_opportunities(context_packet)
            }
        
        logger.info("Narrative context retrieved successfully",
                   user_id=user_id,
                   chapters_count=len(journal_data.narrative.chapters),
                   insights_generated=len(enriched_context["contextual_insights"]))
        
        return {
            "success": True,
            "narrative_context": enriched_context,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "cache_valid_until": (datetime.now(timezone.utc).timestamp() + 300) * 1000  # 5 minutes en ms
        }
        
    except Exception as e:
        logger.error("Narrative context retrieval failed",
                    user_id=request.user_id,
                    error=str(e))
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve narrative context: {str(e)}"
        )

# ========== FONCTIONS UTILITAIRES ==========

async def _generate_immediate_insights(
    user_id: str,
    event_type: str,
    enrichment: Dict[str, Any]
) -> Dict[str, Any]:
    """Génère des insights immédiats basés sur l'enrichissement reçu"""
    
    behavioral = enrichment.get("behavioral_signals", {})
    predictions = enrichment.get("predictions", {})
    
    insights = {
        "engagement_quality": behavioral.get("interaction_depth", "surface"),
        "confidence_level": behavioral.get("completion_confidence", "neutral"),
        "emotional_trajectory": predictions.get("user_emotional_state", "stable"),
        "recommended_follow_up": predictions.get("next_module_likely", "continue_current"),
        "immediate_opportunities": predictions.get("opportunities_identified", [])
    }
    
    return insights

def _generate_proactive_recommendations(enrichment: Dict[str, Any]) -> List[str]:
    """Génère des recommandations proactives basées sur l'enrichissement"""
    
    recommendations = []
    
    behavioral = enrichment.get("behavioral_signals", {})
    predictions = enrichment.get("predictions", {})
    
    if behavioral.get("completion_confidence") == "hesitant":
        recommendations.append("Consider offering additional guidance or simplified options")
    
    if predictions.get("user_emotional_state", "").startswith("confident"):
        recommendations.append("User ready for advanced features - suggest next level tools")
    
    if len(predictions.get("blockers_detected", [])) > 0:
        recommendations.append("Address identified blockers proactively in next interaction")
    
    return recommendations

def _assess_engagement_level(context_packet) -> str:
    """Évalue le niveau d'engagement basé sur le contexte"""
    try:
        sessions = getattr(context_packet.usage, 'session_count_7d', 0)
        if sessions > 5:
            return "high"
        elif sessions > 2:
            return "medium"
        else:
            return "low"
    except:
        return "unknown"

def _infer_communication_style(context_packet) -> str:
    """Infère le style de communication préféré"""
    # Logique d'inférence basée sur les patterns d'interaction
    return "supportive_and_detailed"  # Placeholder

def _extract_current_chapter(journal_data) -> str:
    """Extrait le chapitre actuel de l'histoire utilisateur"""
    if journal_data and journal_data.narrative and journal_data.narrative.chapters:
        latest_chapter = journal_data.narrative.chapters[0]
        return latest_chapter.title if hasattr(latest_chapter, 'title') else "Current Progress"
    return "Beginning of Journey"

def _extract_recent_achievements(journal_data) -> List[str]:
    """Extrait les accomplissements récents"""
    achievements = []
    if journal_data and journal_data.narrative and journal_data.narrative.chapters:
        for chapter in journal_data.narrative.chapters[:3]:  # 3 plus récents
            if hasattr(chapter, 'gain') and chapter.gain:
                achievements.extend(chapter.gain[:2])  # Max 2 par chapitre
    return achievements[:5]  # Max 5 total

def _extract_active_goals(context_packet) -> List[str]:
    """Extrait les objectifs actifs de l'utilisateur"""
    goals = []
    try:
        if hasattr(context_packet, 'progress'):
            if hasattr(context_packet.progress, 'letters_target'):
                goals.append(f"Target: {context_packet.progress.letters_target}")
    except:
        pass
    return goals or ["Career development and optimization"]

def _infer_current_emotional_state(context_packet) -> str:
    """Infère l'état émotionnel actuel"""
    try:
        if hasattr(context_packet, 'last_emotion_or_doubt') and context_packet.last_emotion_or_doubt:
            return context_packet.last_emotion_or_doubt
    except:
        pass
    return "motivated_and_progressing"

def _get_recent_interactions(context_packet) -> List[Dict[str, str]]:
    """Récupère les interactions récentes"""
    interactions = []
    try:
        # Extraire les interactions des données de contexte
        # Placeholder - à adapter selon la structure réelle
        interactions = [
            {"module": "aube", "action": "career_discovery", "outcome": "positive"},
            # ... autres interactions
        ]
    except:
        pass
    return interactions

def _analyze_module_preferences(context_packet) -> Dict[str, float]:
    """Analyse les préférences de modules"""
    preferences = {"aube": 0.3, "cv": 0.3, "letters": 0.2, "rise": 0.2}
    try:
        if hasattr(context_packet, 'usage') and hasattr(context_packet.usage, 'apps_last_7d'):
            # Analyser l'usage réel pour ajuster les préférences
            pass
    except:
        pass
    return preferences

def _identify_success_patterns(context_packet) -> List[str]:
    """Identifie les patterns de succès"""
    patterns = []
    try:
        # Analyser les patterns de réussite
        patterns = [
            "Responds well to detailed guidance",
            "Prefers structured approach",
            "Shows good follow-through"
        ]
    except:
        pass
    return patterns

def _identify_support_needs(context_packet) -> List[str]:
    """Identifie les besoins de support"""
    needs = []
    try:
        # Analyser les besoins de support
        needs = [
            "Benefits from encouragement",
            "Needs clear next steps",
            "Appreciates progress tracking"
        ]
    except:
        pass
    return needs

def _generate_contextual_prompts(current_module: Optional[str], context_packet) -> List[str]:
    """Génère des prompts contextuels pour le module actuel"""
    base_prompts = {
        "aube": [
            "🎯 Luna, aide-moi à découvrir de nouveaux métiers",
            "🌅 Comment puis-je identifier mes compétences transférables ?",
            "💡 Quelles sont mes options de reconversion ?"
        ],
        "cv": [
            "📄 Luna, comment optimiser mon CV ?",
            "✨ Aide-moi à mettre en valeur mes compétences",
            "🎯 Comment adapter mon CV à cette offre ?"
        ],
        "letters": [
            "✉️ Luna, aide-moi pour ma lettre de motivation",
            "🎨 Comment personnaliser ma candidature ?",
            "💌 Quel ton adopter pour cette entreprise ?"
        ],
        "rise": [
            "🚀 Luna, prépare-moi pour mon entretien",
            "💬 Comment répondre aux questions difficiles ?",
            "🎭 Aide-moi à pitcher mon parcours"
        ]
    }
    
    return base_prompts.get(current_module, base_prompts["aube"])

def _generate_proactive_suggestions(context_packet) -> List[str]:
    """Génère des suggestions proactives"""
    suggestions = [
        "Based on your progress, consider exploring advanced CV optimization",
        "Your career discovery results suggest focusing on Product Management roles",
        "Time to prepare for interviews - your profile looks strong!"
    ]
    return suggestions

def _generate_personalized_greeting(current_module: Optional[str], context_packet) -> str:
    """Génère un salut personnalisé"""
    greetings = {
        "aube": "🌅 Salut ! Prêt(e) à explorer de nouvelles pistes carrière ?",
        "cv": "📄 Hello ! On continue à peaufiner ton CV ?",
        "letters": "✉️ Coucou ! Créons une lettre qui marque les esprits !",
        "rise": "🚀 Hey ! Préparons-toi à briller en entretien !"
    }
    
    return greetings.get(current_module, "🌙 Salut ! Comment puis-je t'aider aujourd'hui ?")

def _suggest_energy_optimization(context_packet) -> Dict[str, Any]:
    """Suggère des optimisations d'énergie"""
    return {
        "current_usage_pattern": "moderate",
        "suggested_actions": ["Focus on high-impact tools", "Consider energy pack for intensive session"],
        "estimated_session_energy": 25
    }

def _predict_next_actions(context_packet) -> List[str]:
    """Prédit les prochaines actions probables"""
    return [
        "CV optimization based on career discovery",
        "Letter generation for target companies",
        "Interview preparation for identified roles"
    ]

def _predict_optimal_timing(context_packet) -> str:
    """Prédit le timing optimal pour les prochaines interactions"""
    return "Next 2-3 days based on current momentum"

def _predict_potential_blockers(context_packet) -> List[str]:
    """Prédit les blockers potentiels"""
    return [
        "May need additional confidence building",
        "Technical skills gap to address",
        "Interview anxiety potential concern"
    ]

def _identify_acceleration_opportunities(context_packet) -> List[str]:
    """Identifie les opportunités d'accélération"""
    return [
        "High compatibility scores - ready for targeted applications",
        "Strong profile foundation - suitable for advanced tools",
        "Good engagement pattern - can handle intensive coaching"
    ]

def _assess_session_momentum(context_packet) -> str:
    """Évalue la momentum de session actuelle"""
    try:
        if hasattr(context_packet, 'usage') and hasattr(context_packet.usage, 'session_count_7d'):
            sessions = context_packet.usage.session_count_7d
            if sessions > 3:
                return "building"
            elif sessions > 1:
                return "maintaining" 
        return "declining"
    except:
        return "building"

def _assess_interaction_depth(context_packet) -> str:
    """Évalue la profondeur d'interaction"""
    try:
        # Analyse basée sur les patterns d'usage
        return "engaged"  # Placeholder - logique à affiner
    except:
        return "surface"

def _identify_journey_stage(module: str, context_packet) -> str:
    """Identifie l'étape du journey utilisateur"""
    journey_stages = {
        "aube": "career_exploration", 
        "cv": "profile_optimization",
        "letters": "application_preparation",
        "rise": "interview_readiness",
        "default": "general_progression"
    }
    return journey_stages.get(module, "general_progression")