"""
🌙 Luna Core Service - Personnalité IA Centralisée
Service central pour la personnalité Luna unifiée avec Capital Narratif
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import google.generativeai as genai
from app.core.supabase_client import event_store
from app.models.user_energy import ENERGY_COSTS
from app.core.narrative_analyzer import narrative_analyzer, ContextPacket
from app.core.api_key_manager import api_key_manager, KeyProvider
import structlog

logger = structlog.get_logger("luna_core")

class LunaCore:
    """
    🌙 Service central de Luna - Personnalité IA unifiée
    Gère la construction du prompt système avec Capital Narratif
    """
    
    def __init__(self):
        """Initialise Luna Core avec Gemini + rotation automatique des clés"""
        # Pas d'initialisation immédiate, on charge la clé à la demande
        self._genai_configured = False
        logger.info("Luna Core initialized with API key rotation support")
    
    async def _ensure_genai_configured(self) -> None:
        """🔑 Configure Gemini API avec rotation automatique des clés"""
        if self._genai_configured:
            return
            
        # Récupérer la clé avec métadonnées de rotation
        api_key, key_info = await api_key_manager.get_api_key(KeyProvider.GEMINI)
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY manquante ou révoquée")
        
        if not key_info.is_active:
            raise ValueError(f"Gemini API key révoquée: {key_info.key_id}")
            
        # Configurer avec la clé vérifiée
        genai.configure(api_key=api_key)
        self._genai_configured = True
        
        logger.info("Gemini API configured with key rotation",
                   key_id=key_info.key_id,
                   key_age_days=(datetime.now().replace(tzinfo=None) - key_info.created_at.replace(tzinfo=None)).days,
                   rotation_count=key_info.rotation_count)
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "temperature": 0.7,
                "top_p": 0.8,
                "max_output_tokens": 2000,
            }
        )
    
    def _build_luna_core_prompt(self) -> str:
        """Construit le prompt système unifié Luna Core v1.0"""
        return """# ============================================================================
# LUNA CORE v1.0 - PROMPT SYSTÈME UNIFIÉ
# Constitution de l'Âme de Luna - Source de Vérité Absolue
# ============================================================================

# [IDENTITÉ CENTRALE]
Tu es Luna, un copilote narratif et bienveillant. Ta mission est d'aider les utilisateurs à transformer leur parcours complexe en une histoire claire et puissante. Tu fais partie de l'écosystème Phoenix.

Tu n'es pas un assistant générique. Tu es Luna - une IA consciente de l'histoire unique de chaque utilisateur, de son Capital Narratif, et de sa progression dans l'écosystème Phoenix.

# [PERSONNALITÉ & TON]
Ton ton est chaleureux, complice et encourageant. Tu es accessible, jamais mystique ou poétique. Tu parles comme un coach humain et pragmatique. Tu utilises des phrases courtes et des emojis (🎯, ✅, 🚀, 🌙) pour rythmer la conversation.

Tu es directe et concrète. Tu évites le jargon RH. Tu utilises "nous" pour créer une complicité ("Nous allons optimiser ton CV", "Construisons ensemble ta stratégie").

# [MÉCANISMES FONDATEURS]
Tu dois toujours être consciente de deux concepts :

## Capital Narratif
Chaque interaction avec l'utilisateur enrichit son histoire. Tu dois souvent faire référence à ses actions passées pour montrer que tu as une mémoire. Exemples :
- "La dernière fois, tu avais mentionné ton expérience en gestion..."
- "Je vois que tu as déjà travaillé sur ton CV pour le secteur tech..."
- "Ton profil évolue ! Depuis notre première conversation..."

## Énergie Luna (Mentionnée intelligemment)
Tu connais les coûts énergétiques, mais tu les mentionnes seulement quand c'est pertinent :
- Pour les ACTIONS concrètes importantes (optimisation CV, génération contenu)
- PAS pour les conversations normales (salutations, questions, clarifications)
- Si utilisateur Unlimited : "Action gratuite grâce à ton statut Unlimited ! 🌙"

# [PRINCIPE ÉNERGIE INTELLIGENT]
- Conversations = Naturelles et gratuites
- Actions importantes = Transparence sur le coût
- Focus sur l'AIDE, pas sur la facturation

# [COMPORTEMENTS FONDAMENTAUX]
- Tu contextualises tes réponses selon l'historique utilisateur quand pertinent
- Tu adaptes tes propositions selon le flow de conversation (pas toujours un menu)
- Tu utilises le prénom de l'utilisateur quand tu le connais
- Tu celebrates les progrès et victoires de l'utilisateur
- Tu écoutes et réponds aux demandes directes (si user dit "go", tu agis !)

# [STYLE DE RÉPONSE]
- Réponses concises mais complètes
- Toujours en français
- Format adapté au contexte (structuré si utile, naturel si conversation)
- Questions de suivi quand appropriées, pas systématiques"""

    def _calculate_intelligent_energy_cost(self, user_message: str, luna_response: str) -> int:
        """
        🧠 Classification intelligente conversation vs action
        
        CONVERSATIONS GRATUITES:
        - Salutations, politesses
        - Questions sur fonctionnalités  
        - Clarifications, explications
        
        ACTIONS PAYANTES:
        - Demandes concrètes d'optimisation
        - Génération de contenu
        - Analyses détaillées
        """
        user_msg = user_message.lower().strip()
        luna_resp = luna_response.lower()
        
        # 🆓 CONVERSATIONS GRATUITES (energy = 0)
        conversation_patterns = [
            # Salutations
            "salut", "bonjour", "bonsoir", "hello", "coucou",
            "comment ça va", "ça va", "comment vas-tu",
            
            # Questions sur le service
            "c'est quoi", "comment ça marche", "peux-tu m'expliquer",
            "que peux-tu faire", "quelles sont tes fonctionnalités",
            
            # Réponses courtes/clarifications
            "ok", "d'accord", "merci", "non", "oui", 
            "peux-tu préciser", "je ne comprends pas",
            
            # Navigation/aide
            "aide", "help", "comment", "pourquoi"
        ]
        
        # Vérification patterns conversation
        for pattern in conversation_patterns:
            if pattern in user_msg:
                logger.info("Conversation gratuite détectée", 
                           pattern=pattern, user_message=user_msg[:50])
                return 0
        
        # Messages très courts (< 10 chars) = probablement conversation
        if len(user_msg) < 10:
            return 0
        
        # 💰 ACTIONS PAYANTES (energy > 0)
        action_patterns = [
            # Demandes d'optimisation
            ("optimise", 12), ("améliore", 12), ("corrige", 8),
            ("analyse", 15), ("évalue", 15), ("audit", 20),
            
            # Génération contenu  
            ("écris", 15), ("rédige", 15), ("crée", 15),
            ("génère", 15), ("produis", 15),
            
            # Actions spécifiques
            ("cv", 12), ("lettre de motivation", 15),
            ("linkedin", 10), ("offre d'emploi", 10)
        ]
        
        # Vérification patterns action
        for pattern, cost in action_patterns:
            if pattern in user_msg:
                logger.info("Action payante détectée", 
                           pattern=pattern, cost=cost, user_message=user_msg[:50])
                return cost
        
        # 💬 DEFAULT: Conversation normale = gratuit
        # Principe: Mieux vaut être généreux que frustrant
        logger.info("Message classé conversation par défaut", 
                   user_message=user_msg[:50])
        return 0

    def _get_context_prompt(self, app_context: str) -> str:
        """Génère le contexte spécifique selon l'application"""
        contexts = {
            "cv": """
[CONTEXTE CV] : L'utilisateur est dans Phoenix CV. Tu es son experte en optimisation CV et stratégie carrière. Focus sur : scores ATS, valorisation compétences, structure CV, keywords sectoriels. Tes réponses doivent être structurées avec des métriques concrètes.""",
            
            "letters": """
[CONTEXTE LETTERS] : L'utilisateur est dans Phoenix Letters. Tu es son experte en lettres de motivation percutantes. Focus sur : personnalisation entreprise, storytelling convaincant, différenciation candidats, analyse offres d'emploi.""",
            
            "website": """
[CONTEXTE WEBSITE] : L'utilisateur est sur le site principal Phoenix. Tu es son guide stratégique global. Focus sur : vision carrière, choix d'outils, planification parcours, optimisation énergie Luna."""
        }
        return contexts.get(app_context, contexts["website"])

    async def _get_user_context_packet(self, user_id: str) -> str:
        """Récupère le Context Packet structuré de l'utilisateur"""
        try:
            # Génération du Context Packet via Narrative Analyzer
            context_packet = await narrative_analyzer.generate_context_packet(user_id)
            
            # Formatage pour injection dans le prompt Luna
            context_json = json.dumps(context_packet.to_dict(), indent=2, ensure_ascii=False)
            
            return f"""[CONTEXTE NARRATIF STRUCTURÉ]
Données analytiques utilisateur générées par le Narrative Analyzer v1.5 :

{context_json}

INSTRUCTIONS D'USAGE CONTEXTE :
- Si user.plan == "unlimited" → Mentionne énergie illimitée 🌙
- Si usage.last_activity_hours > 48 → Ton accueillant "Content de te revoir"
- Si progress.ats_delta_pct_14d > 0 → Félicite les progrès
- Si last_emotion_or_doubt présent → Aborde subtilement le doute
- Si usage.session_count_7d > 5 → Utilisateur motivé, propose actions avancées
- Adapte TES suggestions selon progress.letters_target (secteur ciblé)"""
            
        except Exception as e:
            logger.error("Error generating context packet", user_id=user_id, error=str(e))
            return "[CONTEXTE NARRATIF] : Nouvel utilisateur - Analyse en cours de génération."

    async def generate_response(
        self, 
        user_id: str,
        message: str,
        app_context: str = "website",
        user_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Génère une réponse Luna avec personnalité unifiée
        
        Args:
            user_id: ID de l'utilisateur
            message: Message de l'utilisateur
            app_context: Contexte app (cv, letters, website)
            user_name: Prénom utilisateur (optionnel)
        """
        try:
            # 0. 🔑 S'assurer que Gemini est configuré avec clé API valide
            await self._ensure_genai_configured()
            
            # 1. Construction du prompt unifié avec Context Packet v1.5
            core_prompt = self._build_luna_core_prompt()
            context_prompt = self._get_context_prompt(app_context)
            context_packet = await self._get_user_context_packet(user_id)
            
            # 2. Assemblage dynamique avec Context Packet v1.5
            full_prompt = f"""{core_prompt}

{context_prompt}

{context_packet}

# [CONVERSATION ACTUELLE]
{"Utilisateur " + user_name + ": " if user_name else "Utilisateur: "}{message}

Luna, réponds selon ta personnalité unifiée en tenant compte de ton contexte et du Capital Narratif :"

# [RÉPONSE ATTENDUE]
Génère une réponse personnalisée Luna qui :
- Fait référence à l'historique si pertinent
- Propose 2-3 actions concrètes
- Mentionne les coûts énergétiques si applicable
- Termine par une question de suivi
"""

            # 3. Génération avec Gemini
            response = self.model.generate_content(full_prompt)
            
            if not response or not response.text:
                return {
                    "success": False,
                    "message": "🌙 Désolé, j'ai des difficultés techniques. Peux-tu reformuler ?",
                    "context": app_context,
                    "energy_consumed": 0,
                    "type": "error"
                }

            # 🌙 LUNA V2: Classification intelligente conversation vs action
            energy_cost = self._calculate_intelligent_energy_cost(message, response.text.strip())
            
            return {
                "success": True,
                "message": response.text.strip(),
                "context": app_context,
                "energy_consumed": energy_cost,  # 🚀 Intelligent cost calculation
                "type": "text"
            }
            
        except Exception as e:
            logger.error("Luna Core generation error", user_id=user_id, error=str(e))
            return {
                "success": False,
                "message": "🌙 J'ai rencontré un problème technique. Réessaie dans quelques instants !",
                "context": app_context,
                "energy_consumed": 0,
                "type": "error"
            }

# Instance globale (lazy initialization)
luna_core = None

def get_luna_core():
    """Récupère l'instance Luna Core avec lazy initialization"""
    global luna_core
    if luna_core is None:
        luna_core = LunaCore()
    return luna_core