"""
🌙 Luna Core Service - Personnalité IA Centralisée
Service central pour la personnalité Luna unifiée avec Capital Narratif
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import google.generativeai as genai
from app.core.supabase_client import event_store
from app.models.user_energy import ENERGY_COSTS
from app.core.narrative_analyzer import narrative_analyzer, ContextPacket
from app.core.api_key_manager import api_key_manager, KeyProvider
from app.core.redis_cache import redis_cache
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
            "salut", "bonjour", "bonsoir", "hello", "coucou", "hey",
            "comment ça va", "ça va", "comment vas-tu", "comment allez-vous",
            
            # Questions sur le service
            "c'est quoi", "comment ça marche", "peux-tu m'expliquer", "explique-moi",
            "que peux-tu faire", "quelles sont tes fonctionnalités", "tu peux faire quoi",
            "comment tu fonctionnes", "quel est ton rôle",
            
            # Réponses courtes/clarifications
            "ok", "d'accord", "merci", "non", "oui", "bien", "super",
            "peux-tu préciser", "je ne comprends pas", "pas clair",
            "continue", "vas-y", "raconte",
            
            # Navigation/aide/questions
            "aide", "help", "comment", "pourquoi", "qui", "quand", "où",
            "je veux savoir", "j'aimerais comprendre", "dis-moi",
            
            # Réactions émotionnelles (conversations, pas actions)
            "génial", "cool", "intéressant", "ah bon", "vraiment",
            "je vois", "je comprends", "effectivement",
            
            # Questions de suivi conversationnel
            "et toi", "et après", "et puis", "ensuite", "donc"
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
            # Demandes d'optimisation/amélioration
            ("optimise", 12), ("améliore", 12), ("perfectionne", 15), ("booster", 12),
            ("corrige", 8), ("revois", 8), ("repense", 10),
            
            # Analyses approfondies
            ("analyse", 15), ("évalue", 15), ("audit", 20), ("diagnostique", 15),
            ("examine", 15), ("décortique", 20), ("passe au crible", 20),
            
            # Génération de contenu  
            ("écris", 15), ("rédige", 15), ("crée", 15), ("compose", 15),
            ("génère", 15), ("produis", 15), ("conçois", 15),
            ("construis", 15), ("bâtis", 15),
            
            # Actions spécifiques par domaine
            ("mon cv", 12), ("ma lettre", 15), ("lettre de motivation", 15),
            ("profil linkedin", 10), ("cette offre", 10), ("offre d'emploi", 10),
            ("ma candidature", 15), ("reconversion", 25), ("transition", 25),
            
            # Actions directes (signaux forts)
            ("fais-le", 15), ("vas-y", 10), ("go pour", 10), ("lance", 12),
            ("commence", 10), ("démarre", 10), ("je veux que tu", 15)
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

    async def _get_conversation_memory(self, user_id: str, limit: int = 5) -> str:
        """
        🧠 SPRINT 2: Récupère l'historique conversationnel
        Fini les répétitions ! Luna se souvient maintenant.
        """
        try:
            cache_key = f"luna:conversation:{user_id}"
            conversation_history = await redis_cache.get_json(cache_key)
            
            if not conversation_history:
                return "[NOUVELLE CONVERSATION] Pas d'historique précédent."
            
            # Formater les derniers messages
            recent_messages = conversation_history[-limit:] if len(conversation_history) > limit else conversation_history
            
            formatted_history = []
            for msg in recent_messages:
                timestamp = msg.get('timestamp', 'Récent')
                role = "👤 User" if msg.get('role') == 'user' else "🌙 Luna"
                message = msg.get('message', '')[:100]  # Tronquer pour pas surcharger
                formatted_history.append(f"{role}: {message}")
            
            history_text = '\n'.join(formatted_history)
            
            logger.info("Conversation memory loaded", 
                       user_id=user_id, messages_count=len(recent_messages))
            
            return f"""[HISTORIQUE CONVERSATION RÉCENTE]
{history_text}

IMPORTANT: Tu as déjà interagi avec cet utilisateur. Évite de répéter les mêmes informations (sessions, plan, onboarding). Continue la conversation naturellement."""
            
        except Exception as e:
            logger.error("Error loading conversation memory", user_id=user_id, error=str(e))
            return "[NOUVELLE CONVERSATION] Historique non disponible."
    
    async def _get_conversation_state(self, user_id: str) -> Dict[str, Any]:
        """
        🎭 SPRINT 2: Récupère l'état de la conversation
        Évite les boucles répétitives et adapte le comportement Luna
        """
        try:
            cache_key = f"luna:state:{user_id}"
            state = await redis_cache.get_json(cache_key)
            
            if not state:
                # Nouvel utilisateur : état par défaut
                return {
                    "phase": "greeting",  # greeting, exploring, action_mode, follow_up
                    "last_topic": None,
                    "actions_proposed": 0,
                    "user_engagement": "new",  # new, active, returning
                    "onboarding_done": False
                }
            
            return state
            
        except Exception as e:
            logger.error("Error loading conversation state", user_id=user_id, error=str(e))
            return {"phase": "greeting", "onboarding_done": False}
    
    async def _update_conversation_state(self, user_id: str, user_message: str, luna_response: str):
        """
        🎭 Met à jour l'état conversationnel selon l'interaction
        """
        try:
            current_state = await self._get_conversation_state(user_id)
            
            # Analyser l'intention du message user
            user_msg = user_message.lower().strip()
            
            # Détection des patterns pour ajuster l'état
            if any(pattern in user_msg for pattern in ["salut", "bonjour", "hello"]):
                if current_state["onboarding_done"]:
                    current_state["phase"] = "returning"
                else:
                    current_state["phase"] = "greeting"
            
            elif any(pattern in user_msg for pattern in ["go", "oui", "d'accord", "fait", "fais"]):
                current_state["phase"] = "action_mode"
                current_state["user_engagement"] = "active"
            
            elif any(pattern in user_msg for pattern in ["optimise", "analyse", "écris", "génère"]):
                current_state["phase"] = "action_mode"
                current_state["last_topic"] = "action_request"
            
            elif any(pattern in user_msg for pattern in ["comment", "pourquoi", "c'est quoi"]):
                current_state["phase"] = "exploring"
            
            # Marquer onboarding comme fait après première vraie interaction
            if not current_state["onboarding_done"] and len(user_msg) > 5:
                current_state["onboarding_done"] = True
            
            # Compter les actions proposées (détection dans réponse Luna)
            if "action" in luna_response.lower() or "puis-je" in luna_response.lower():
                current_state["actions_proposed"] = current_state.get("actions_proposed", 0) + 1
            
            # Sauvegarder avec TTL 24h
            cache_key = f"luna:state:{user_id}"
            await redis_cache.set_json(cache_key, current_state, ttl=86400)
            
            logger.info("Conversation state updated", 
                       user_id=user_id, phase=current_state["phase"])
            
        except Exception as e:
            logger.error("Error updating conversation state", user_id=user_id, error=str(e))

    async def _save_conversation_turn(self, user_id: str, user_message: str, luna_response: str):
        """
        💾 Sauvegarde le tour de conversation pour la mémoire
        """
        try:
            cache_key = f"luna:conversation:{user_id}"
            
            # Récupérer historique existant
            conversation_history = await redis_cache.get_json(cache_key) or []
            
            # Ajouter les nouveaux messages
            timestamp = datetime.now(timezone.utc).isoformat()
            
            conversation_history.append({
                "role": "user",
                "message": user_message,
                "timestamp": timestamp
            })
            
            conversation_history.append({
                "role": "luna", 
                "message": luna_response,
                "timestamp": timestamp
            })
            
            # Garder seulement les 20 derniers messages (10 tours)
            if len(conversation_history) > 20:
                conversation_history = conversation_history[-20:]
            
            # Sauvegarder avec TTL de 24h
            await redis_cache.set_json(cache_key, conversation_history, ttl=86400)
            
            logger.info("Conversation turn saved", 
                       user_id=user_id, total_messages=len(conversation_history))
            
        except Exception as e:
            logger.error("Error saving conversation turn", user_id=user_id, error=str(e))

    def _build_state_guidance(self, conversation_state: Dict[str, Any]) -> str:
        """
        🎭 SPRINT 2: Guide le comportement Luna selon l'état conversationnel
        Casse les boucles répétitives !
        """
        phase = conversation_state.get("phase", "greeting")
        onboarding_done = conversation_state.get("onboarding_done", False)
        actions_proposed = conversation_state.get("actions_proposed", 0)
        
        guidance_map = {
            "greeting": """[MODE ACCUEIL]
Si c'est la première fois : Accueil chaleureux mais bref.
Si utilisateur récurrent : "Content de te revoir !" et continue la conversation.""",
            
            "returning": """[MODE RETOUR]  
L'utilisateur revient. PAS de re-onboarding ! Salue brièvement et demande comment tu peux aider aujourd'hui.""",
            
            "action_mode": """[MODE ACTION]
L'utilisateur veut passer à l'action (dit "go", "oui", "fais"). 
ARRÊTE les propositions, AGIS ! Demande les détails nécessaires et commence le travail.""",
            
            "exploring": """[MODE EXPLORATION]
L'utilisateur explore (pose des questions). Réponds clairement, puis propose naturellement des actions pertinentes."""
        }
        
        base_guidance = guidance_map.get(phase, guidance_map["greeting"])
        
        # Ajustements selon historique
        if onboarding_done:
            base_guidance += "\nONBOARDING DÉJÀ FAIT: Ne répète pas les informations de base."
        
        if actions_proposed > 2:
            base_guidance += "\nASSEZ D'ACTIONS PROPOSÉES: L'utilisateur connaît tes capacités. Sois plus direct."
        
        return f"""[GUIDANCE COMPORTEMENTALE]
Phase conversation: {phase}
{base_guidance}

RÈGLE OR: Si utilisateur dit une action directe ("optimise mon CV"), ne propose plus de menu, FAIS-LE !"""

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
            
            # 1. Construction du prompt unifié avec Context Packet + MÉMOIRE + ÉTAT
            core_prompt = self._build_luna_core_prompt()
            context_prompt = self._get_context_prompt(app_context)
            context_packet = await self._get_user_context_packet(user_id)
            conversation_memory = await self._get_conversation_memory(user_id)
            conversation_state = await self._get_conversation_state(user_id)
            
            # 2. Assemblage dynamique avec INTELLIGENCE CONVERSATIONNELLE
            state_guidance = self._build_state_guidance(conversation_state)
            
            full_prompt = f"""{core_prompt}

{context_prompt}

{context_packet}

{conversation_memory}

{state_guidance}

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
            
            # 🧠 SPRINT 2: Sauvegarder la conversation + État pour intelligence
            await self._save_conversation_turn(user_id, message, response.text.strip())
            await self._update_conversation_state(user_id, message, response.text.strip())
            
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