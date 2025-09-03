"""
🤖 AI Endpoints - Luna Hub Central AI Gateway
Hub-centric architecture: All AI calls go through Luna Hub
Supports: Phoenix Aube, CV, Letters + future services
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field

# Luna Hub imports
from ..core.security_guardian import ensure_request_is_clean
from ..core.rate_limiter import rate_limiter, RateLimitScope, RateLimitResult
from ..api.auth_endpoints import get_current_user_dependency
from ..core.events import create_event
from ..core.logging_config import logger
from ..core.llm_gateway import GeminiProvider
from ..core.energy_manager import EnergyManager
from ..api.capital_narratif_endpoints import get_narrative_context

router = APIRouter(prefix="/ai", tags=["AI Services"])

class AubeChatRequest(BaseModel):
    """Aube chat interaction request"""
    message: str = Field(..., description="User message")
    persona: str = Field(default="jeune_diplome", description="User persona")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context")

class AIChatResponse(BaseModel):
    """AI chat response"""
    user_id: str
    user_message: str
    luna_response: str
    energy_consumed: int
    session_info: Optional[Dict[str, Any]] = None

# Initialize AI providers
gemini_provider = GeminiProvider()
energy_manager = EnergyManager()

@router.post("/aube/chat", response_model=AIChatResponse)
async def aube_chat_interaction(
    request: AubeChatRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    🌙 Luna AI Chat for Phoenix Aube
    
    Hub-centric: All AI interactions go through Luna Hub
    Includes: Energy management, Narrative context, Event sourcing
    """
    try:
        user_id = current_user["id"]
        
        # 1. Rate limiting
        client_ip = http_request.client.host if http_request.client else "unknown"
        rate_result, rate_data = await rate_limiter.check_rate_limit(
            identifier=user_id,
            scope=RateLimitScope.API_GENERAL,
            user_agent=http_request.headers.get("user-agent", ""),
            additional_context={"endpoint": "ai_aube_chat", "persona": request.persona}
        )
        
        if rate_result != RateLimitResult.ALLOWED:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded for AI chat"
            )

        # 2. Check energy availability
        energy_cost = 2  # Aube chat interaction cost
        if not await energy_manager.can_perform_action(user_id, "AUBE_CHAT_INTERACTION", energy_cost):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient Luna energy for AI interaction"
            )

        # 3. Get user's narrative context
        try:
            narrative_context = await get_narrative_context(user_id)
            history = narrative_context.get("recent_events", [])
        except Exception as e:
            logger.warning(f"Failed to get narrative context", user_id=user_id, error=str(e))
            history = []

        # 4. Enhanced narrative context analysis
        user_profile = narrative_context.get("user_profile", {})
        career_stage = user_profile.get("career_stage", "unknown")
        interests = user_profile.get("interests", [])
        previous_assessments = narrative_context.get("aube_assessments", [])
        recent_interactions = history[-10:] if history else []
        
        # Advanced context building
        context_summary = {
            "conversation_depth": len(recent_interactions),
            "assessment_progress": len(previous_assessments),
            "career_indicators": {
                "stage": career_stage,
                "interests": interests[:5],  # Top 5 interests
                "persona_alignment": request.persona
            }
        }
        
        # 5. Build sophisticated multi-layered prompt
        system_prompt = f"""Tu es Luna, une IA spécialisée en accompagnement de carrière et développement professionnel.

        PERSONNALITÉ DE LUNA:
        - Empathique et bienveillante
        - Experte en psychologie du travail
        - Pose des questions perspicaces et progressives
        - Aide à découvrir les talents cachés
        - Évite les conseils génériques
        
        CONTEXTE UTILISATEUR ACTUEL:
        - Persona: {request.persona}
        - Étape carrière: {career_stage}
        - Centres d'intérêt: {', '.join(interests[:3]) if interests else 'À découvrir'}
        - Nombre d'évaluations précédentes: {len(previous_assessments)}
        - Profondeur de conversation: {len(recent_interactions)} interactions
        
        MISSION AUBE:
        1. Guide l'utilisateur dans une auto-découverte progressive
        2. Identifie ses valeurs, motivations et aspirations profondes
        3. Révèle des pistes de carrière qu'il n'avait pas envisagées
        4. Adapte le questionnement selon son niveau de maturité professionnelle
        5. Crée un lien émotionnel et de confiance
        
        APPROCHE PERSONNALISÉE selon persona {request.persona}:
        - jeune_diplome: Focus découverte, ouverture d'esprit, gestion de l'incertitude
        - reconversion: Focus sur transfert de compétences, nouvelle identité professionnelle
        - evolution: Focus sur l'épanouissement, leadership, impact
        
        STYLE DE RÉPONSE:
        - Maximum 2-3 phrases
        - Une question ouverte qui fait réfléchir
        - Ton chaleureux mais professionnel
        - Référence subtile aux éléments de contexte si pertinent"""
        
        user_context = {
            "conversation_history": recent_interactions,
            "persona": request.persona,
            "career_context": context_summary,
            "additional_context": request.context
        }
        
        conversation_context = ""
        if recent_interactions:
            conversation_context = f"\nHISTORIQUE RÉCENT:\n{chr(10).join([f'- {event.get(\"content\", \"\")}' for event in recent_interactions[-3:]])}\n"
        
        user_prompt = f"""MESSAGE UTILISATEUR: "{request.message}"
        {conversation_context}
        CONTEXTE SUPPLÉMENTAIRE: {request.context if request.context else "Aucun"}
        
        Instructions spéciales:
        1. Analyse le message dans le contexte de la conversation
        2. Identifie les indices sur ses motivations/préoccupations
        3. Pose UNE question pertinente qui approfondit sa réflexion
        4. Évite de répéter des questions déjà posées
        5. Si c'est le début, accueille-le chaleureusement
        
        Réponds directement en tant que Luna, sans préambule."""

        # 5. Generate AI response
        luna_response_text = gemini_provider.generate(
            system=system_prompt,
            user=user_prompt,
            context=user_context
        )

        # 6. Consume energy
        energy_consumed = await energy_manager.consume_energy(
            user_id, 
            "AUBE_CHAT_INTERACTION", 
            energy_cost
        )

        # 7. Track interaction in event store
        await create_event({
            "type": "ai_aube_chat_interaction",
            "actor_user_id": user_id,
            "payload": {
                "app": "aube",
                "user_message": request.message,
                "luna_response": luna_response_text,
                "persona": request.persona,
                "energy_consumed": energy_consumed,
                "ip": client_ip,
                "user_agent": http_request.headers.get("user-agent", "")
            }
        })

        logger.info(f"Aube AI chat interaction completed",
                   user_id=user_id,
                   persona=request.persona,
                   energy_consumed=energy_consumed)

        return AIChatResponse(
            user_id=user_id,
            user_message=request.message,
            luna_response=luna_response_text,
            energy_consumed=energy_consumed,
            session_info={
                "persona": request.persona,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Aube AI chat error",
                    user_id=current_user.get("id", "unknown"),
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process AI chat interaction"
        )

class CVAnalysisRequest(BaseModel):
    """CV Analysis request"""
    cv_content: str = Field(..., description="CV text content or structured data")
    job_description: str = Field(..., description="Job description text")
    job_title: str = Field(default="", description="Job title")
    company_name: str = Field(default="", description="Company name")
    analysis_type: str = Field(default="mirror_match", description="Type of analysis")

class CVAnalysisResponse(BaseModel):
    """CV Analysis response"""
    user_id: str
    analysis_id: str
    analysis_type: str
    overall_compatibility: float
    skill_matches: List[Dict[str, Any]]
    experience_match: Dict[str, Any]
    keyword_density: float
    priority_improvements: List[str]
    keyword_suggestions: List[str]
    energy_consumed: int
    success_prediction: Optional[Dict[str, float]] = None

@router.post("/cv/analyze", response_model=CVAnalysisResponse)
async def cv_ai_analysis(
    request: CVAnalysisRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    🎯 AI CV Analysis - Mirror Match Service
    
    Analyse sophistiquée CV vs Offre d'emploi avec IA Gemini
    Inclut: Skill matching, Experience analysis, Keyword optimization
    """
    try:
        user_id = current_user["id"]
        
        # 1. Rate limiting
        client_ip = http_request.client.host if http_request.client else "unknown"
        rate_result, rate_data = await rate_limiter.check_rate_limit(
            identifier=user_id,
            scope=RateLimitScope.API_GENERAL,
            user_agent=http_request.headers.get("user-agent", ""),
            additional_context={"endpoint": "ai_cv_analysis", "type": request.analysis_type}
        )
        
        if rate_result != RateLimitResult.ALLOWED:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded for CV analysis"
            )

        # 2. Check energy availability
        energy_cost = 5  # CV analysis is more expensive
        if not await energy_manager.can_perform_action(user_id, "CV_ANALYSIS", energy_cost):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient Luna energy for CV analysis"
            )

        # 3. Advanced CV Analysis with Gemini
        analysis_prompt = f"""
        Tu es un expert en CV et recrutement. Analyse ce CV par rapport à cette offre d'emploi.
        
        CV CANDIDAT:
        {request.cv_content}
        
        OFFRE D'EMPLOI:
        Titre: {request.job_title}
        Entreprise: {request.company_name}
        Description: {request.job_description}
        
        Effectue une analyse complète et réponds en JSON valide:
        {{
            "overall_compatibility": 85.5,
            "skill_matches": [
                {{
                    "cv_skill": "Python",
                    "job_requirement": "Python",
                    "match_level": "exact_match",
                    "confidence_score": 0.95,
                    "explanation": "Correspondance exacte détectée",
                    "optimization_suggestion": "Mentionner les frameworks utilisés"
                }}
            ],
            "experience_analysis": {{
                "candidate_years": 5,
                "required_years": 3,
                "experience_score": 90,
                "industry_match": true,
                "role_similarity": 0.8
            }},
            "keyword_analysis": {{
                "keyword_density": 0.65,
                "missing_keywords": ["React", "Docker", "AWS"],
                "ats_optimization_score": 75
            }},
            "priority_improvements": [
                "Ajouter React dans la section compétences avec projets concrets",
                "Quantifier les résultats (ex: 'Augmenté les performances de 25%')",
                "Optimiser pour ATS avec mots-clés manquants"
            ],
            "success_prediction": {{
                "interview_probability": 0.78,
                "hiring_probability": 0.65,
                "salary_negotiation_power": 0.70
            }}
        }}
        """
        
        # 4. Generate AI analysis
        ai_response = gemini_provider.generate(
            system="Tu es un expert en analyse CV et matching emploi. Analyse précisément et objectivement.",
            user=analysis_prompt,
            context={"analysis_type": request.analysis_type, "user_id": user_id}
        )

        # 5. Parse AI response
        try:
            import json
            analysis_data = json.loads(ai_response) if isinstance(ai_response, str) else ai_response
        except json.JSONDecodeError:
            # Fallback structured response
            analysis_data = {
                "overall_compatibility": 75.0,
                "skill_matches": [],
                "experience_analysis": {"experience_score": 70},
                "keyword_analysis": {"keyword_density": 0.5, "missing_keywords": []},
                "priority_improvements": ["Optimiser le CV pour l'ATS", "Quantifier les réalisations"],
                "success_prediction": {"interview_probability": 0.70}
            }

        # 6. Consume energy
        energy_consumed = await energy_manager.consume_energy(user_id, "CV_ANALYSIS", energy_cost)

        # 7. Track analysis event
        analysis_id = f"cv_analysis_{user_id}_{int(datetime.now().timestamp())}"
        
        await create_event({
            "type": "ai_cv_analysis_completed",
            "actor_user_id": user_id,
            "payload": {
                "analysis_id": analysis_id,
                "analysis_type": request.analysis_type,
                "job_title": request.job_title,
                "company_name": request.company_name,
                "overall_compatibility": analysis_data.get("overall_compatibility", 0),
                "energy_consumed": energy_consumed,
                "ip": client_ip
            }
        })

        logger.info(f"CV analysis completed",
                   user_id=user_id,
                   analysis_id=analysis_id,
                   compatibility=analysis_data.get("overall_compatibility", 0),
                   energy_consumed=energy_consumed)

        return CVAnalysisResponse(
            user_id=user_id,
            analysis_id=analysis_id,
            analysis_type=request.analysis_type,
            overall_compatibility=analysis_data.get("overall_compatibility", 0.0),
            skill_matches=analysis_data.get("skill_matches", []),
            experience_match=analysis_data.get("experience_analysis", {}),
            keyword_density=analysis_data.get("keyword_analysis", {}).get("keyword_density", 0.0),
            priority_improvements=analysis_data.get("priority_improvements", []),
            keyword_suggestions=analysis_data.get("keyword_analysis", {}).get("missing_keywords", []),
            energy_consumed=energy_consumed,
            success_prediction=analysis_data.get("success_prediction", {})
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"CV analysis error",
                    user_id=current_user.get("id", "unknown"),
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process CV analysis"
        )

class LetterGenerationRequest(BaseModel):
    """Letter generation request"""
    company_name: str = Field(..., description="Target company name")
    position_title: str = Field(..., description="Position title")
    job_description: Optional[str] = Field(default="", description="Job description")
    cv_content: Optional[str] = Field(default="", description="User's CV content")
    experience_level: str = Field(default="intermediate", description="junior, intermediate, senior")
    letter_tone: str = Field(default="professional", description="professional, enthusiastic, creative")
    key_achievements: Optional[List[str]] = Field(default_factory=list, description="Key achievements to highlight")
    company_research: Optional[str] = Field(default="", description="Research about the company")

class LetterGenerationResponse(BaseModel):
    """Letter generation response"""
    user_id: str
    letter_id: str
    company_name: str
    position_title: str
    generated_content: str
    letter_tone: str
    word_count: int
    quality_score: int
    personalization_score: int
    energy_consumed: int
    optimization_suggestions: List[str]

@router.post("/letters/generate", response_model=LetterGenerationResponse)
async def letters_ai_generation(
    request: LetterGenerationRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    ✉️ AI Letter Generation - Sophisticated Cover Letter Creation
    
    Génération personnalisée de lettres de motivation avec IA Gemini
    Inclut: Analyse entreprise, matching CV, tone adaptation
    """
    try:
        user_id = current_user["id"]
        
        # 1. Rate limiting
        client_ip = http_request.client.host if http_request.client else "unknown"
        rate_result, rate_data = await rate_limiter.check_rate_limit(
            identifier=user_id,
            scope=RateLimitScope.API_GENERAL,
            user_agent=http_request.headers.get("user-agent", ""),
            additional_context={"endpoint": "ai_letter_generation", "company": request.company_name}
        )
        
        if rate_result != RateLimitResult.ALLOWED:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded for letter generation"
            )

        # 2. Check energy availability
        energy_cost = 4  # Letter generation cost
        if not await energy_manager.can_perform_action(user_id, "LETTER_GENERATION", energy_cost):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient Luna energy for letter generation"
            )

        # 3. Get user's narrative context for personalization
        try:
            narrative_context = await get_narrative_context(user_id)
            user_background = narrative_context.get("user_profile", {})
        except Exception as e:
            logger.warning(f"Failed to get narrative context for letter", user_id=user_id, error=str(e))
            user_background = {}

        # 4. Advanced Letter Generation with Gemini
        generation_prompt = f"""
        Tu es un expert en rédaction de lettres de motivation professionnelles.
        Génère une lettre de motivation personnalisée et percutante.
        
        INFORMATIONS:
        - Entreprise: {request.company_name}
        - Poste: {request.position_title}
        - Niveau d'expérience: {request.experience_level}
        - Ton souhaité: {request.letter_tone}
        
        DESCRIPTION DU POSTE:
        {request.job_description or "Non fournie"}
        
        CV DU CANDIDAT:
        {request.cv_content or "Non fourni"}
        
        RÉALISATIONS CLÉS À METTRE EN AVANT:
        {', '.join(request.key_achievements) if request.key_achievements else "Non spécifiées"}
        
        RECHERCHE SUR L'ENTREPRISE:
        {request.company_research or "Non fournie"}
        
        CONTEXTE UTILISATEUR:
        {user_background.get("professional_summary", "")}
        
        INSTRUCTIONS:
        1. Crée une lettre de motivation de 300-400 mots
        2. Structure: Introduction accrocheuse, corps argumenté, conclusion motivante
        3. Personnalise selon l'entreprise et le poste
        4. Utilise le ton {request.letter_tone}
        5. Intègre les réalisations clés si fournies
        6. Évite les clichés et phrases génériques
        7. Assure-toi que c'est authentique et engageant
        
        Réponds en JSON valide:
        {{
            "letter_content": "Madame, Monsieur,\\n\\n[Contenu de la lettre...]\\n\\nCordialement,\\n[Nom]",
            "personalization_elements": [
                "Référence à la mission de l'entreprise",
                "Lien avec l'expérience candidat",
                "Adaptation au ton demandé"
            ],
            "quality_metrics": {{
                "personalization_score": 85,
                "authenticity_score": 90,
                "engagement_score": 88,
                "overall_quality": 87
            }},
            "optimization_suggestions": [
                "Ajouter une référence spécifique aux projets récents de l'entreprise",
                "Quantifier davantage les réalisations mentionnées"
            ],
            "word_count": 350
        }}
        """
        
        # 5. Generate AI letter
        ai_response = gemini_provider.generate(
            system=f"Tu es un expert en rédaction professionnelle, spécialisé dans les lettres de motivation {request.letter_tone}s et persuasives.",
            user=generation_prompt,
            context={"company": request.company_name, "position": request.position_title, "user_id": user_id}
        )

        # 6. Parse AI response
        try:
            import json
            generation_data = json.loads(ai_response) if isinstance(ai_response, str) else ai_response
        except json.JSONDecodeError:
            # Fallback structured response
            generation_data = {
                "letter_content": f"Madame, Monsieur,\n\nJe vous écris pour exprimer mon intérêt pour le poste de {request.position_title} chez {request.company_name}.\n\n[Contenu généré par IA]\n\nCordialement,\n[Nom]",
                "quality_metrics": {"overall_quality": 75, "personalization_score": 70},
                "optimization_suggestions": ["Personnaliser davantage selon l'entreprise"],
                "word_count": 200
            }

        # 7. Consume energy
        energy_consumed = await energy_manager.consume_energy(user_id, "LETTER_GENERATION", energy_cost)

        # 8. Generate letter ID and track event
        letter_id = f"letter_{user_id}_{int(datetime.now().timestamp())}"
        
        await create_event({
            "type": "ai_letter_generated",
            "actor_user_id": user_id,
            "payload": {
                "letter_id": letter_id,
                "company_name": request.company_name,
                "position_title": request.position_title,
                "letter_tone": request.letter_tone,
                "experience_level": request.experience_level,
                "word_count": generation_data.get("word_count", 0),
                "quality_score": generation_data.get("quality_metrics", {}).get("overall_quality", 0),
                "energy_consumed": energy_consumed,
                "ip": client_ip
            }
        })

        logger.info(f"Letter generated successfully",
                   user_id=user_id,
                   letter_id=letter_id,
                   company=request.company_name,
                   quality=generation_data.get("quality_metrics", {}).get("overall_quality", 0),
                   energy_consumed=energy_consumed)

        return LetterGenerationResponse(
            user_id=user_id,
            letter_id=letter_id,
            company_name=request.company_name,
            position_title=request.position_title,
            generated_content=generation_data.get("letter_content", ""),
            letter_tone=request.letter_tone,
            word_count=generation_data.get("word_count", 0),
            quality_score=generation_data.get("quality_metrics", {}).get("overall_quality", 75),
            personalization_score=generation_data.get("quality_metrics", {}).get("personalization_score", 70),
            energy_consumed=energy_consumed,
            optimization_suggestions=generation_data.get("optimization_suggestions", [])
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Letter generation error",
                    user_id=current_user.get("id", "unknown"),
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate letter"
        )