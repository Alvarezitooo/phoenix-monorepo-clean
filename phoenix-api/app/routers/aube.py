from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from app.clients.hub_client import get_hub_client, HubClient
from app.clients.gemini_client import get_gemini_client, GeminiClient
from app.dependencies import get_current_user_id

router = APIRouter()

# --- Enhanced Aube Models for Career Transition ---

@router.get("/", summary="Aube Module status")
async def aube_status():
    return {
        "module": "Aube", 
        "status": "active",
        "features": ["chat", "skill-transfer-analysis", "career-discovery", "transition-roadmap"],
        "version": "2.0.0"
    }

class ChatRequest(BaseModel):
    message: str
    persona: str = "jeune_diplome"
    context: Optional[Dict[str, Any]] = None

class SkillTransferRequest(BaseModel):
    current_role: str
    current_industry: str
    years_experience: int
    target_role: str
    target_industry: str
    key_skills: List[str]
    key_achievements: Optional[List[str]] = []

class CareerDiscoveryRequest(BaseModel):
    current_role: str
    current_industry: str
    years_experience: int
    interests: List[str]
    preferred_work_environment: Optional[str] = None
    salary_expectations: Optional[str] = None

class TransitionRoadmapRequest(BaseModel):
    current_profile: Dict[str, Any]
    target_career: Dict[str, Any]
    timeline_months: Optional[int] = 12

@router.post("/chat", summary="Interact with the Luna copilot for Aube")
async def chat_with_luna(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client)
):
    """
    Hub-centric architecture: Delegate AI interactions to Luna Hub
    Phoenix API acts as pure orchestration layer
    """
    try:
        # Delegate all AI processing to Luna Hub
        # This implements the "Hub = Roi" principle correctly
        ai_response = await hub.ai_chat_interaction(
            user_id=user_id,
            app="aube", 
            message=request.message,
            persona=request.persona,
            context=request.context or {}
        )

        return {
            "user_id": ai_response["user_id"],
            "user_message": ai_response["user_message"], 
            "luna_response": ai_response["luna_response"],
            "energy_consumed": ai_response.get("energy_consumed", 0)
        }

    except HTTPException as e:
        raise e # Re-raise exceptions from Hub (e.g., 402, 401, 503)
    except Exception as e:
        # Log the full error here in a real application
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# --- NEW: Enhanced Career Transition Endpoints ---

@router.post("/skill-transfer-analysis", summary="Analyze skill transferability for career transition")
async def analyze_skill_transfer(
    request: SkillTransferRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    THE GOLD of career transition - Skill Transfer Matrix Analysis
    """
    if not await hub.can_perform(user_id=user_id, action="AUBE_SKILL_TRANSFER"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    prompt = f"""
    MISSION: Analyser la transférabilité des compétences pour une reconversion professionnelle.
    
    PROFIL ACTUEL:
    - Poste: {request.current_role}
    - Secteur: {request.current_industry} 
    - Expérience: {request.years_experience} ans
    - Compétences clés: {', '.join(request.key_skills)}
    - Réalisations: {', '.join(request.key_achievements or [])}
    
    CIBLE:
    - Nouveau poste: {request.target_role}
    - Nouveau secteur: {request.target_industry}
    
    ANALYSE DEMANDÉE:
    1. **Compétences directement transférables** (90-100% compatibles)
    2. **Compétences adaptables** (60-89% - formation courte nécessaire)  
    3. **Compétences à acquérir** (0-59% - apprentissage important)
    4. **Avantages cachés** (compétences sous-estimées mais précieuses)
    5. **Score de faisabilité** (/100) avec justification
    6. **Recommandations prioritaires** (3 actions concrètes)
    
    Format la réponse en JSON structuré pour interface.
    """
    
    analysis_result = await gemini.generate_content(prompt)

    await hub.track_event(
        user_id=user_id,
        event_type="SKILL_TRANSFER_ANALYZED",
        event_data={
            "current_role": request.current_role,
            "target_role": request.target_role,
            "years_experience": request.years_experience
        }
    )

    return {
        "message": "Skill transfer analysis complete",
        "analysis": analysis_result,
        "energy_consumed": 25
    }

@router.post("/career-discovery", summary="Discover compatible career paths")
async def discover_compatible_careers(
    request: CareerDiscoveryRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Career Discovery - Find compatible career paths based on current profile
    """
    if not await hub.can_perform(user_id=user_id, action="AUBE_CAREER_DISCOVERY"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    prompt = f"""
    MISSION: Identifier les métiers compatibles pour une évolution/reconversion.
    
    PROFIL:
    - Poste actuel: {request.current_role}
    - Secteur: {request.current_industry}
    - Expérience: {request.years_experience} ans
    - Centres d'intérêt: {', '.join(request.interests)}
    - Environnement préféré: {request.preferred_work_environment or 'Non précisé'}
    - Attentes salariales: {request.salary_expectations or 'Non précisées'}
    
    LIVRABLE:
    1. **Top 5 métiers compatibles** avec score de compatibilité (/100)
    2. **Pour chaque métier:**
       - Descriptif en 2 lignes
       - Compétences requises vs acquises
       - Fourchette salarielle
       - Facilité de transition (Facile/Moyen/Difficile)
       - Secteurs qui recrutent
    3. **Métier surprise** (non évident mais très compatible)
    4. **Red flags** (métiers à éviter et pourquoi)
    
    Sois concret et actionnable. Format JSON structuré.
    """
    
    discovery_result = await gemini.generate_content(prompt)

    await hub.track_event(
        user_id=user_id,
        event_type="CAREER_DISCOVERY_COMPLETED",
        event_data={
            "current_role": request.current_role,
            "interests_count": len(request.interests),
            "years_experience": request.years_experience
        }
    )

    return {
        "message": "Career discovery complete",
        "compatible_careers": discovery_result,
        "energy_consumed": 15
    }

@router.post("/transition-roadmap", summary="Generate detailed transition roadmap")
async def generate_transition_roadmap(
    request: TransitionRoadmapRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client),
    gemini: GeminiClient = Depends(get_gemini_client)
):
    """
    Generate a concrete, actionable roadmap for career transition
    """
    if not await hub.can_perform(user_id=user_id, action="AUBE_TRANSITION_ROADMAP"):
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient Luna energy.")

    prompt = f"""
    MISSION: Créer un plan d'action concret pour une reconversion professionnelle.
    
    PROFIL ACTUEL: {request.current_profile}
    CIBLE: {request.target_career}
    TIMELINE: {request.timeline_months} mois
    
    ROADMAP À CRÉER:
    
    **PHASE 1 - PRÉPARATION (0-2 mois)**
    - Actions concrètes avec deadlines
    - Formations/certifications à commencer
    - Réseau à activer
    
    **PHASE 2 - DÉVELOPPEMENT (2-8 mois)**  
    - Compétences à acquérir (priorisées)
    - Projets personnels/portfolio
    - Premières expériences (stage, freelance, bénévolat)
    
    **PHASE 3 - TRANSITION (8-12 mois)**
    - Stratégie recherche emploi
    - Candidatures ciblées
    - Négociation et intégration
    
    **JALONS CRITIQUES**
    - 5 étapes de validation avec dates
    - Indicateurs de réussite mesurables
    - Plan B si blocage
    
    **BUDGET & RESSOURCES**
    - Coût formations/certifications
    - Temps hebdomadaire nécessaire
    - Ressources gratuites à exploiter
    
    Sois ultra-concret avec dates, actions, et métriques.
    """
    
    roadmap_result = await gemini.generate_content(prompt)

    await hub.track_event(
        user_id=user_id,
        event_type="TRANSITION_ROADMAP_GENERATED",
        event_data={
            "timeline_months": request.timeline_months,
            "current_role": request.current_profile.get("role", "unknown"),
            "target_role": request.target_career.get("role", "unknown")
        }
    )

    return {
        "message": "Transition roadmap generated",
        "roadmap": roadmap_result,
        "energy_consumed": 40
    }
