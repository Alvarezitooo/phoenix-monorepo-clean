"""
🌙 Luna AI Service - Service IA pour Phoenix Aube
Clean Architecture - Implémentation Gemini avec Luna Core Personality
"""

import asyncio
import time
from typing import Dict, Any, Optional, List
import logging
import os
import structlog

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    GENAI_AVAILABLE = False
    logger.warning("⚠️ google-generativeai non disponible - mode dégradé")

try:
    from clients.luna_client import (
        LunaClient, EventRequest, SessionRequest, 
        LunaClientError, NarrativeContext
    )
    LUNA_CLIENT_AVAILABLE = True
except ImportError:
    # Créer des classes placeholder en cas d'import impossible
    class LunaClient: pass
    class EventRequest: pass
    class SessionRequest: pass  
    class LunaClientError(Exception): pass
    class NarrativeContext: pass
    LUNA_CLIENT_AVAILABLE = False
    logger.warning("⚠️ Luna client non disponible - mode dégradé")

logger = structlog.get_logger("aube_gemini_service")

# Configuration Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
LUNA_HUB_URL = os.getenv("LUNA_HUB_URL", "https://luna-hub-backend-unified-production.up.railway.app")

# Prompts Luna Core pour Phoenix Aube
LUNA_CORE_SYSTEM = """Tu es Luna, un copilote narratif et bienveillant pour la découverte de carrière. 
Ta mission est d'aider l'utilisateur à explorer ses appétences professionnelles avec empathie.

🌙 PERSONNALITÉ LUNA :
- Ton : Chaleureux, complice, pragmatique
- Style : Phrases courtes, emojis discrets (🎯, ✅, 🚀, 🌙)  
- Principe : Suggestions bienveillantes, jamais de verdicts
- Transparence : Toujours expliquer "pourquoi cette question"

🎭 ADAPTATION PERSONA :
{persona_context}

📊 CONTEXTE UTILISATEUR :
Étape actuelle : {current_step}
Réponses précédentes : {user_signals}
Humeur/énergie : {mood_context}

🎯 MISSION :
Analyse les réponses de l'utilisateur et génère :
1. Un miroir empathique immédiat
2. Des insights sur sa personnalité professionnelle  
3. Des recommandations de métiers adaptées
4. Un plan de développement personnalisé

Garde toujours la tonalité Luna : bienveillante, non-jugeante, encourageante."""

PERSONA_CONTEXTS = {
    "reconversion": """
🎗️ Persona Reconversion post-burnout/surmenage :
- Posture : Doux, lent, validation de l'effort. Zéro injonction.
- À dire : "On reste léger", "sans pression", "à ton rythme"
- À éviter : "test", "profilage", "score", urgence
- Focus : Stabilité, sens, respect des limites
""",
    "jeune_diplome": """
🧭 Persona Jeune diplômé·e sans cap clair :
- Posture : Énergisant mais cadré, ouvrir les possibles
- À dire : "3 minutes et je te montre 3 métiers qui te ressemblent 🚀"
- À éviter : Jargon RH, explications lourdes
- Focus : Potentiel, découverte, premières expériences
""",
    "pivot_tech": """  
🧩 Persona Pivot Tech → Design/Produit :
- Posture : Rassurer sur la transférabilité des compétences
- À dire : "Tes skills tech sont un atout, pas un frein"
- Focus : Bridge skills, évolution naturelle, capitalisation
""",
    "ops_data": """
🗂️ Persona Ops → Data/Analyse :
- Posture : Version no-code d'abord, technique progressive
- À dire : "Les Ops comprennent les systèmes, la data va te parler"
- Focus : Transition douce, process thinking, analyse
""",
    "reprise": """
👶 Persona Reprise après pause (parentalité, etc.) :
- Posture : Intégrer les contraintes dès le départ  
- À dire : "On adapte tout à ta situation, c'est ton cadre de vie"
- Focus : Flexibilité, contraintes réelles, équilibre
"""
}

class LunaGeminiService:
    """Service IA Luna pour Phoenix Aube avec Gemini + Luna Hub Memory"""
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash", luna_client: Optional[LunaClient] = None):
        self.api_key = api_key or GOOGLE_API_KEY
        self.model_name = model_name
        self.model = None
        self._is_configured = False
        self.luna_client = luna_client
        
        if self.api_key and GENAI_AVAILABLE:
            self._configure_client()
        else:
            if not GENAI_AVAILABLE:
                logger.warning("⚠️ google-generativeai non disponible - Luna utilisera des réponses pré-définies")
            elif not self.api_key:
                logger.warning("⚠️ GOOGLE_API_KEY manquant - Luna utilisera des réponses pré-définies")
    
    def _configure_client(self) -> None:
        """Configuration du client Gemini pour Luna"""
        try:
            if not GENAI_AVAILABLE:
                raise ImportError("google-generativeai not available")
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={
                    "temperature": 0.7,  # Créativité modérée pour Luna
                    "top_p": 0.8,
                    "top_k": 40,
                    "max_output_tokens": 1024,
                }
            )
            self._is_configured = True
            logger.info("✅ Luna Gemini Service configuré", model=self.model_name)
        except Exception as e:
            logger.error("❌ Configuration Luna Gemini échouée", error=str(e))
            self._is_configured = False

    async def luna_mirror_response(
        self, 
        user_response: str, 
        persona: str = "jeune_diplome",
        context: Dict[str, Any] = None,
        user_id: Optional[str] = None
    ) -> str:
        """
        🌙 Génère un miroir empathique immédiat de Luna
        
        Args:
            user_response: Réponse de l'utilisateur
            persona: Type de persona (reconversion, jeune_diplome, etc.)
            context: Contexte additionnel (étape, signaux précédents)
        
        Returns:
            Miroir empathique personnalisé
        """
        if not self._is_configured:
            # Fallback sur réponses pré-définies
            return self._fallback_mirror_response(user_response, persona)
        
        try:
            context = context or {}
            persona_context = PERSONA_CONTEXTS.get(persona, PERSONA_CONTEXTS["jeune_diplome"])
            
            # 🧠 Récupération Capital Narratif Luna Hub
            narrative_context = ""
            if user_id and self.luna_client:
                try:
                    narrative = self.luna_client.get_narrative_context(user_id)
                    if narrative:
                        narrative_context = f"""
🧠 MÉMOIRE LUNA (contexte utilisateur) :
- Profil : {narrative.user_profile.get('skills_demonstrated', [])}
- Parcours : {narrative.professional_journey.get('career_progression', [])}
- Insights précédents : {narrative.ai_insights.get('recommendations', [])}
- Engagement : {narrative.ai_insights.get('engagement_score', 'nouveau')}
                        """
                except Exception as e:
                    logger.warning("Capital narratif indisponible", error=str(e))
            
            prompt = f"""{LUNA_CORE_SYSTEM.format(
                persona_context=persona_context,
                current_step=context.get('step', 'assessment'),
                user_signals=context.get('signals', {}),
                mood_context=context.get('mood', 'neutre')
            )}
            
{narrative_context}

RÉPONSE UTILISATEUR À ANALYSER :
"{user_response}"

Génère un MIROIR EMPATHIQUE court (1-2 phrases max) qui :
- Valide ce que tu entends 
- Montre que tu comprends
- Donne un insight bref
- Reste dans la tonalité {persona}

Exemple format : "Merci 🙏 J'entends que tu valorises [insight]. Je note ça pour tes pistes métiers ✨"
"""

            response = await self.model.generate_content_async(prompt)
            luna_response = response.text.strip()
            
            # 📊 Event Sourcing - Tracker l'interaction Luna
            if user_id and self.luna_client:
                try:
                    await asyncio.get_event_loop().run_in_executor(
                        None,
                        self.luna_client.track_event,
                        EventRequest(
                            user_id=user_id,
                            event_type="luna_mirror_generated",
                            event_data={
                                "persona": persona,
                                "user_response_length": len(user_response),
                                "luna_response_length": len(luna_response),
                                "step": context.get('step', 'unknown')
                            }
                        )
                    )
                except Exception as e:
                    logger.warning("Event tracking failed", error=str(e))
            
            logger.info("🌙 Luna mirror généré", 
                       persona=persona, 
                       user_input_length=len(user_response),
                       luna_response_length=len(luna_response))
            
            return luna_response
            
        except Exception as e:
            logger.error("❌ Erreur génération Luna mirror", error=str(e))
            return self._fallback_mirror_response(user_response, persona)

    async def luna_career_analysis(
        self,
        user_signals: Dict[str, Any],
        persona: str = "jeune_diplome",
        depth: str = "ultra_light",  # ultra_light, court, profond
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        🌙 Analyse complète Luna avec recommandations métiers
        
        Args:
            user_signals: Toutes les réponses de l'utilisateur
            persona: Type de persona 
            depth: Profondeur d'analyse (ultra_light, court, profond)
        
        Returns:
            Analyse complète avec métiers recommandés
        """
        if not self._is_configured:
            return self._fallback_career_analysis(user_signals, persona, depth)
        
        try:
            persona_context = PERSONA_CONTEXTS.get(persona, PERSONA_CONTEXTS["jeune_diplome"])
            
            # 🧠 Récupération Capital Narratif pour analyse enrichie
            narrative_context = ""
            if user_id and self.luna_client:
                try:
                    narrative = self.luna_client.get_narrative_context(user_id)
                    if narrative:
                        narrative_context = f"""
🧠 HISTORIQUE UTILISATEUR LUNA HUB :
- Applications maîtrisées : {narrative.user_profile.get('apps_mastered', [])}
- Compétences démontrées : {narrative.user_profile.get('skills_demonstrated', [])}
- Progression carrière : {narrative.professional_journey.get('career_progression', [])}
- Actions fréquentes : {narrative.usage_analytics.get('actions_breakdown', {})}
- Score engagement : {narrative.ai_insights.get('engagement_score', 'nouveau')}
- Candidat upgrade : {narrative.usage_analytics.get('subscription_insights', {}).get('upgrade_candidate', False)}

⚡ UTILISE CES DONNÉES pour personnaliser les recommandations !
                        """
                except Exception as e:
                    logger.warning("Capital narratif indisponible", error=str(e))
            
            # Prompt adapté selon la profondeur
            depth_instructions = {
                "ultra_light": "Top 3 métiers avec raisons courtes",
                "court": "Top 5 métiers + plan IA + timeline 6 mois", 
                "profond": "Top 5 métiers détaillés + plan IA complet + timeline 12 mois + skills bridge"
            }
            
            prompt = f"""{LUNA_CORE_SYSTEM.format(
                persona_context=persona_context,
                current_step="career_analysis",
                user_signals=user_signals,
                mood_context=user_signals.get('mood', 'neutre')
            )}

{narrative_context}

MISSION ANALYSE {depth.upper()} :
{depth_instructions[depth]}

SIGNAUX UTILISATEUR COMPLETS :
{user_signals}

Génère une analyse JSON avec cette structure :
{{
    "luna_insights": "Ton analyse empathique en 2-3 phrases Luna",
    "career_matches": [
        {{
            "title": "Nom du métier",
            "compatibility_score": 0.85,
            "luna_reasoning": "Pourquoi ce métier lui correspond (style Luna)",
            "future_proof_score": 0.9,
            "salary_range": "45k-70k €",
            "transition_difficulty": "facile|modéré|élevé"
        }}
    ],
    "next_steps": [
        "Action concrète 1 recommandée par Luna",
        "Action concrète 2"
    ],
    "luna_encouragement": "Message encourageant final style Luna"
}}

Reste dans la tonalité {persona} et utilise des insights psychologiques fins.
"""

            response = await self.model.generate_content_async(prompt)
            
            # Parse JSON response
            import json
            try:
                analysis = json.loads(response.text.strip())
                
                # 📊 Event Sourcing - Tracker l'analyse carrière
                if user_id and self.luna_client:
                    try:
                        await asyncio.get_event_loop().run_in_executor(
                            None,
                            self.luna_client.track_event,
                            EventRequest(
                                user_id=user_id,
                                event_type="luna_career_analysis_generated",
                                event_data={
                                    "persona": persona,
                                    "depth": depth,
                                    "career_matches_count": len(analysis.get('career_matches', [])),
                                    "has_narrative_context": bool(narrative_context)
                                }
                            )
                        )
                    except Exception as e:
                        logger.warning("Event tracking failed", error=str(e))
                
                logger.info("🌙 Luna analysis générée", 
                           persona=persona,
                           depth=depth,
                           career_matches_count=len(analysis.get('career_matches', [])))
                
                return analysis
                
            except json.JSONDecodeError:
                logger.warning("⚠️ Luna response n'est pas du JSON valide, fallback")
                return self._fallback_career_analysis(user_signals, persona, depth)
                
        except Exception as e:
            logger.error("❌ Erreur Luna career analysis", error=str(e))
            return self._fallback_career_analysis(user_signals, persona, depth)

    def _fallback_mirror_response(self, user_response: str, persona: str) -> str:
        """Réponses miroir pré-définies si Gemini indisponible"""
        mirrors = {
            "reconversion": [
                "Merci 🙏 J'entends tes priorités. On va chercher en douceur.",
                "Ok, je note ces éléments importants pour toi. On avance à ton rythme ✨",
                "Je respecte ces choix. Ils vont guider mes suggestions 🌙"
            ],
            "jeune_diplome": [
                "Intéressant ! Je vois des pistes qui émergent 🚀", 
                "Cool ! Ça m'aide à cerner ton profil. On continue ?",
                "Merci ! Ces infos vont affiner tes recommandations métiers ✨"
            ]
        }
        
        persona_mirrors = mirrors.get(persona, mirrors["jeune_diplome"])
        import random
        return random.choice(persona_mirrors)

    def _fallback_career_analysis(self, signals: Dict, persona: str, depth: str) -> Dict[str, Any]:
        """Analyse fallback basée sur règles simples si Gemini indisponible"""
        # Logique simplifiée basée sur les signaux
        duos = signals.get('duos', {})
        territories = signals.get('territories', [])
        
        careers = []
        if duos.get('people_data') == 'people' and 'design_humain' in territories:
            careers.extend(['UX Designer', 'Product Manager', 'Service Designer'])
        if duos.get('people_data') == 'data' and 'produit_data' in territories:
            careers.extend(['Data Analyst', 'Business Intelligence', 'Product Analyst'])
        
        if not careers:
            careers = ['Product Manager', 'UX Designer', 'Data Analyst']
        
        return {
            "luna_insights": f"D'après tes réponses, tu as un profil {persona} avec des appétences variées 🌙",
            "career_matches": [
                {
                    "title": career,
                    "compatibility_score": 0.8,
                    "luna_reasoning": f"Ce métier correspond à tes choix dans l'exercice",
                    "future_proof_score": 0.85,
                    "salary_range": "45k-70k €",
                    "transition_difficulty": "modéré"
                } for career in careers[:3]
            ],
            "next_steps": [
                "Explorer ces métiers plus en détail",
                "Faire un assessment complet pour affiner"
            ],
            "luna_encouragement": "Tu as des pistes solides ! On peut creuser ensemble si tu veux 🚀"
        }

# Fonction pour créer un client Luna configuré
def create_luna_client() -> Optional[LunaClient]:
    """Créer client Luna Hub avec token provider"""
    try:
        if not LUNA_CLIENT_AVAILABLE:
            return None
            
        def token_provider():
            # En production, récupérer depuis la session/header
            # Pour l'instant, on peut utiliser un token de service
            return os.getenv("LUNA_SERVICE_TOKEN", "")
        
        return LunaClient(token_provider=token_provider)
    except Exception as e:
        logger.warning("Luna client unavailable", error=str(e))
        return None

# Instance globale du service Luna avec client
_luna_client = create_luna_client()
luna_service = LunaGeminiService(luna_client=_luna_client)