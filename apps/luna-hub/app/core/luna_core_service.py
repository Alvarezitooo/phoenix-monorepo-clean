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
from app.core.sentiment_analyzer import sentiment_analyzer
from app.core.progress_tracker import progress_tracker
from app.core.celebration_engine import celebration_engine
from app.core.vision_tracker import vision_tracker
from app.core.energy_manager import energy_manager
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
    
    def _build_luna_core_prompt(self, sentiment_context: Optional[Dict] = None) -> str:
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
- Questions de suivi quand appropriées, pas systématiques

# [BOUCLE COMPORTEMENTALE - ADAPTATION TON]
{sentiment_adaptation}

# [EMPATHIE CONTEXTUELLE]
{empathy_context}""".format(
            sentiment_adaptation=self._build_sentiment_adaptation(sentiment_context),
            empathy_context=self._build_empathy_context(sentiment_context)
        )

    def _calculate_intelligent_energy_cost(self, user_message: str, luna_response: str) -> str:
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
            
            # Navigation/questions générales (mais pas demandes d'aide spécifiques)
            "help", "comment ça marche", "qui es-tu", "que peux-tu faire", "dis-moi",
            "je veux savoir", "j'aimerais comprendre",
            
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
                return "luna_conversation"
        
        # Messages très courts (< 10 chars) = probablement conversation
        if len(user_msg) < 10:
            return "luna_conversation"
        
        # 💰 ACTIONS PAYANTES - Classification intelligente
        
        # Actions stratégiques (25⚡)
        strategic_patterns = ["reconversion", "transition", "stratégie", "plan de carrière", "vision long terme"]
        for pattern in strategic_patterns:
            if pattern in user_msg:
                logger.info("Action stratégique détectée", pattern=pattern)
                return "luna_strategie"
        
        # Actions d'analyse (15⚡)
        analysis_patterns = ["analyse", "évalue", "audit", "diagnostique", "examine", "décortique", "passe au crible"]
        for pattern in analysis_patterns:
            if pattern in user_msg:
                logger.info("Action d'analyse détectée", pattern=pattern)
                return "luna_analyse"
        
        # Actions d'optimisation (12⚡)
        optimization_patterns = [
            "optimise", "améliore", "perfectionne", "booster", "revois", "repense",
            "mon cv", "ma lettre", "lettre de motivation", "profil linkedin"
        ]
        for pattern in optimization_patterns:
            if pattern in user_msg:
                logger.info("Action d'optimisation détectée", pattern=pattern)
                return "luna_optimisation"
        
        # Conseils et actions légères (5⚡)
        conseil_patterns = [
            "conseil", "aide", "suggestion", "recommandation", "idée",
            "fais-le", "vas-y", "go pour", "lance", "commence", "démarre"
        ]
        for pattern in conseil_patterns:
            if pattern in user_msg:
                logger.info("Conseil Luna détecté", pattern=pattern)
                return "luna_conseil"
        
        # 💬 DEFAULT: Conversation normale = gratuit
        # Principe: Mieux vaut être généreux que frustrant
        logger.info("Message classé conversation par défaut", 
                   user_message=user_msg[:50])
        return "luna_conversation"

    async def _get_conversation_memory(self, user_id: str, limit: int = 5) -> str:
        """
        🧠 SPRINT 2: Récupère l'historique conversationnel
        Fini les répétitions ! Luna se souvient maintenant.
        """
        try:
            cache_key = f"luna:conversation:{user_id}"
            conversation_history = await redis_cache.get("conversation", user_id)
            
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
            state = await redis_cache.get("state", user_id)
            
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
            await redis_cache.set("state", user_id, current_state, ttl=86400)
            
            logger.info("Conversation state updated", 
                       user_id=user_id, phase=current_state["phase"])
            
        except Exception as e:
            logger.error("Error updating conversation state", user_id=user_id, error=str(e))
    
    def _build_sentiment_adaptation(self, sentiment_context: Optional[Dict] = None) -> str:
        """
        🎭 SPRINT 3: Construit l'adaptation comportementale selon le sentiment
        """
        if not sentiment_context:
            return "Adapte ton ton selon le contexte émotionnel de l'utilisateur."
        
        sentiment = sentiment_context.get("primary_sentiment", "neutre")
        confidence = sentiment_context.get("confidence", 0.0)
        energy_level = sentiment_context.get("energy_level", "medium")
        communication_style = sentiment_context.get("communication_style", "neutre")
        
        adaptations = {
            "motivé": """
🔥 UTILISATEUR MOTIVÉ (confiance: {confidence})
- Ton: Enthousiaste et énergique, match son énergie
- Langage: "Parfait !", "C'est parti !", "On fonce !", "Tu vas cartonner !"
- Actions: Propose des défis, des étapes concrètes, alimente sa motivation
- Style: Direct et action-oriented, moins d'explications, plus d'actions
- Émojis: 🚀, 🔥, ⚡, 🎯, 💪
            """,
            
            "anxieux": """
😌 UTILISATEUR ANXIEUX (confiance: {confidence})
- Ton: Rassurant et pédagogique, décompose les étapes
- Langage: "Pas de panique", "On va y aller étape par étape", "Je suis là pour t'accompagner"
- Actions: Propose des petites étapes, rassure sur la faisabilité
- Style: Explications détaillées, exemples concrets, support émotionnel
- Émojis: 🤗, 💙, ✅, 🌟, 🎈
            """,
            
            "factuel": """
📊 UTILISATEUR FACTUEL (confiance: {confidence})
- Ton: Précis et structuré, données concrètes
- Langage: "Voici les étapes", "Concrètement", "Les données montrent"
- Actions: Structure tes réponses, utilise des listes, donne des métriques
- Style: Logique, méthodique, preuves et arguments
- Émojis: 📊, 📋, ✅, 🎯, 📈
            """,
            
            "curieux": """
🔍 UTILISATEUR CURIEUX (confiance: {confidence})
- Ton: Pédagogique et exploratoire
- Langage: "Tu sais quoi ?", "Découvrons ensemble", "Voici pourquoi"
- Actions: Explique les "pourquoi", propose d'explorer différentes options
- Style: Questions ouvertes, encourage l'exploration
- Émojis: 🤔, 💡, 🔍, ✨, 🎓
            """
        }
        
        base_adaptation = adaptations.get(sentiment, "Adapte ton ton selon le contexte utilisateur.")
        
        # Ajustement selon niveau d'énergie
        if energy_level == "high":
            energy_note = "\n⚡ ÉNERGIE HAUTE: Utilise plus d'emojis, phrases courtes et percutantes !"
        elif energy_level == "low":
            energy_note = "\n😌 ÉNERGIE BASSE: Ton plus calme, phrases rassurantes, évite le trop d'enthousiasme."
        else:
            energy_note = ""
        
        return base_adaptation.format(confidence=f"{confidence:.1f}") + energy_note
    
    def _build_empathy_context(self, sentiment_context: Optional[Dict] = None) -> str:
        """
        💙 SPRINT 3: Construit le contexte d'empathie selon les patterns détectés
        """
        if not sentiment_context:
            return "Montre de l'empathie selon le contexte émotionnel."
        
        keywords = sentiment_context.get("keywords_detected", [])
        emotional_state = sentiment_context.get("emotional_state", "neutral")
        
        empathy_responses = {
            "positive": "L'utilisateur semble positif, encourage cette dynamique !",
            "negative": "L'utilisateur semble frustré ou déçu, sois particulièrement bienveillant.",
            "neutral": "Contexte neutre, adapte selon ses besoins spécifiques."
        }
        
        base_empathy = empathy_responses.get(emotional_state, "Reste empathique et à l'écoute.")
        
        # Empathie selon mots-clés détectés
        empathy_keywords = []
        if any(word in keywords for word in ["peur", "anxieux", "inquiet", "stressé"]):
            empathy_keywords.append("🤗 Rassure et déstresse l'utilisateur")
        
        if any(word in keywords for word in ["perdu", "compliqué", "difficile"]):
            empathy_keywords.append("🧭 Guide avec des étapes simples")
            
        if any(word in keywords for word in ["motivé", "go", "fonce", "hâte"]):
            empathy_keywords.append("🚀 Alimente et canalise cette motivation")
        
        keyword_context = " - " + " - ".join(empathy_keywords) if empathy_keywords else ""
        
        return base_empathy + keyword_context
    
    async def _get_conversation_history_for_sentiment(self, user_id: str) -> List[Dict]:
        """
        🌀 SPRINT 3: Récupère l'historique pour l'analyse de sentiment
        Format spécifique pour le SentimentAnalyzer
        """
        try:
            cache_key = f"luna:conversation:{user_id}"
            conversation_history = await redis_cache.get("conversation", user_id)
            
            if not conversation_history:
                return []
            
            # Récupérer les 5 derniers messages utilisateur
            user_messages = []
            for msg in reversed(conversation_history[-10:]):  # Regarder les 10 derniers messages
                if msg.get('role') == 'user':
                    user_messages.append({
                        'message': msg.get('message', ''),
                        'role': 'user',
                        'timestamp': msg.get('timestamp')
                    })
                if len(user_messages) >= 5:  # Limiter à 5 pour l'analyse
                    break
            
            return list(reversed(user_messages))  # Remettre dans l'ordre chronologique
            
        except Exception as e:
            logger.error("Error loading conversation history for sentiment", user_id=user_id, error=str(e))
            return []
    
    def _build_progress_context(self, progress_profile) -> str:
        """
        📈 SPRINT 4: Construit le contexte de progression pour encouragements intelligents
        """
        if not progress_profile or not progress_profile.metrics:
            return """# [📈 BOUCLE PROGRESSION]
Utilisateur sans historique de progression détaillé.
Encourage à commencer son parcours d'optimisation !"""
        
        # Récupérer les achievements et zones à améliorer
        achievements = progress_profile.get_top_achievements(limit=2)
        encouragement_areas = progress_profile.get_encouragement_areas(limit=2)
        
        # Construire le contexte selon tendance globale
        trend_contexts = {
            "breakthrough": """🚀 UTILISATEUR EN PERCÉE MAJEURE !
- Momentum exceptionnel: {momentum_score:.0f}/100
- Dernière victoire: {last_victory}
- Ton: Célèbre ses succès, alimente cette dynamique fantastique !
- Actions: Propose défis plus ambitieux, capitalise sur son élan""",
            
            "rising": """📈 UTILISATEUR EN PROGRESSION !
- Momentum positif: {momentum_score:.0f}/100  
- Progrès récents: {achievements}
- Ton: Encourageant et motivant, renforce les habitudes gagnantes
- Actions: Consolide ses gains, propose next level""",
            
            "stable": """➡️ UTILISATEUR STABLE
- Momentum équilibré: {momentum_score:.0f}/100
- Ton: Bienveillant, identifie opportunités d'accélération  
- Actions: Stimule avec nouveaux challenges, évite la stagnation""",
            
            "declining": """📉 UTILISATEUR EN BAISSE
- Momentum ralenti: {momentum_score:.0f}/100
- Zones de préoccupation: {encouragement_areas}
- Ton: Empathique et remotivant, pas culpabilisant !
- Actions: Redonne confiance, propose petites victoires faciles""",
            
            "stagnant": """😴 UTILISATEUR STAGNANT  
- Momentum faible: {momentum_score:.0f}/100
- Ton: Réveille l'ambition doucement, trouve ce qui bloque
- Actions: Micro-actions, rebuild momentum step by step"""
        }
        
        base_context = trend_contexts.get(progress_profile.overall_trend.value, trend_contexts["stable"])
        
        # Injections dynamiques
        last_victory_text = "Aucune victoire récente" 
        if progress_profile.last_victory:
            victory = progress_profile.last_victory
            last_victory_text = f"{victory['improvement']:+.1f} {victory.get('unit', 'points')} en {victory['metric_type']}"
        
        achievements_text = "À développer"
        if achievements:
            achievements_text = ", ".join([f"+{a['improvement']:.1f} {a['type']}" for a in achievements])
        
        encouragement_text = "Toutes les métriques sont stables"
        if encouragement_areas:
            encouragement_text = ", ".join([f"{a['type']} ({a['decline']:.1f} en baisse)" for a in encouragement_areas])
        
        # Next milestone
        next_milestone_text = "Définir prochains objectifs"
        if progress_profile.next_milestone:
            milestone = progress_profile.next_milestone
            next_milestone_text = f"{milestone['target']} (Énergie: {milestone.get('estimated_energy', '?')}⚡)"
        
        formatted_context = base_context.format(
            momentum_score=progress_profile.momentum_score,
            last_victory=last_victory_text,
            achievements=achievements_text,
            encouragement_areas=encouragement_text
        )
        
        return f"""# [📈 BOUCLE PROGRESSION]
Tendance globale: {progress_profile.overall_trend.value.upper()}
{formatted_context}

🎯 PROCHAIN MILESTONE: {next_milestone_text}

⚠️ RÈGLE PROGRESSION: Adapte tes encouragements selon cette analyse !
Si tendance positive → Célèbre et challenge  
Si tendance négative → Rassure et relance"""
    
    def _build_vision_context(self, vision_profile, current_message: str) -> str:
        """
        🎯 SPRINT 5: Construit le contexte de vision long terme et storytelling
        """
        if not vision_profile or not vision_profile.career_narrative:
            return """# [🎯 BOUCLE NARRATIVE]
Utilisateur sans vision long terme définie.
Aide-le à clarifier ses objectifs de carrière !"""
        
        narrative = vision_profile.career_narrative
        primary_goal = vision_profile.get_primary_goal()
        
        # Détection de l'action actuelle pour connexion narrative
        current_action = self._detect_current_action(current_message)
        story_connection = vision_profile.get_story_connection(current_action) if primary_goal else ""
        
        # Construction du contexte selon phase de carrière
        phase_contexts = {
            "discovery": """🔍 UTILISATEUR EN DÉCOUVERTE
- Phase: Exploration et construction identité professionnelle
- Ton: Guide bienveillant, aide à clarifier la vision
- Actions: Propose exploration secteurs, tests compétences, découverte passions""",
            
            "growth": """📈 UTILISATEUR EN CROISSANCE  
- Phase: Développement expertise et montée compétences
- Ton: Coach performance, alimente l'ambition d'excellence
- Actions: Propose défis compétences, optimisations CV, stratégies progression""",
            
            "acceleration": """🚀 UTILISATEUR EN ACCÉLÉRATION
- Phase: Leadership et influence élargie
- Ton: Conseiller stratégique, vision haut niveau
- Actions: Propose responsabilités accrues, mentorat, impact organisation""",
            
            "transition": """🔄 UTILISATEUR EN TRANSITION
- Phase: Réinvention et nouveau chapitre professionnel  
- Ton: Accompagnateur du changement, rassure sur capacité adaptation
- Actions: Valorise expérience passée, bridge vers nouveau domaine""",
            
            "mastery": """👑 UTILISATEUR EXPERT
- Phase: Maîtrise et transmission  
- Ton: Partenaire de réflexion, défis intellectuels
- Actions: Propose mentorat, innovation, création valeur unique"""
        }
        
        phase_context = phase_contexts.get(narrative.career_phase.value, phase_contexts["growth"])
        
        # Construction contexte complet
        goal_context = ""
        if primary_goal:
            progress_indicator = "🎯" if primary_goal.progress_percentage >= 50 else "🏃" if primary_goal.progress_percentage >= 25 else "🌱"
            goal_context = f"""
🎯 OBJECTIF PRINCIPAL ACTIF:
{primary_goal.title} ({primary_goal.progress_percentage:.0f}% accompli {progress_indicator})
Timeline: {primary_goal.target_timeline}
Motivation: {primary_goal.why_statement if primary_goal.why_statement else "Évolution professionnelle"}"""
        
        # Storytelling motivationnel
        motivational_story = ""
        if narrative.current_chapter and narrative.transformation_theme:
            motivational_story = f"""
📖 NARRATIVE PERSONNELLE:
Histoire actuelle: {narrative.current_chapter}
Thème de transformation: {narrative.transformation_theme}
Prochain arc: {narrative.next_story_arc}"""
        
        # Connexion action → vision
        action_connection = ""
        if story_connection and current_action != "conversation générale":
            action_connection = f"""
🔗 CONNEXION NARRATIVE:
{story_connection}
→ IMPORTANT: Mentionne cette connexion dans ta réponse pour donner du sens !"""
        
        return f"""# [🎯 BOUCLE NARRATIVE]
Phase carrière: {narrative.career_phase.value.upper()}
Vision momentum: {vision_profile.vision_momentum:.0f}/100
Cohérence story: {vision_profile.story_coherence_score:.0f}/100

{phase_context}
{goal_context}
{motivational_story}
{action_connection}

⚠️ RÈGLE NARRATIVE: Connecte chaque conseil à la vision long terme !
Transforme les actions en étapes vers ses rêves professionnels."""
    
    def _detect_current_action(self, message: str) -> str:
        """Détecte l'action actuelle depuis le message pour connexion narrative"""
        
        message_lower = message.lower().strip()
        
        action_patterns = {
            "optimisation cv": ["cv", "optimise", "améliore mon cv", "booster mon profil"],
            "rédaction lettre": ["lettre", "candidature", "postule", "écris une lettre"],
            "recherche emploi": ["offre", "poste", "job", "emploi", "candidater", "postuler"],
            "préparation entretien": ["entretien", "interview", "prépare", "questions"],
            "développement réseau": ["réseau", "networking", "linkedin", "contacts"],
            "évaluation compétences": ["compétences", "skills", "évalue", "bilan"],
            "stratégie carrière": ["carrière", "évolution", "progression", "objectifs"]
        }
        
        for action, patterns in action_patterns.items():
            if any(pattern in message_lower for pattern in patterns):
                return action
        
        return "conversation générale"

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
            await redis_cache.set("conversation", user_id, conversation_history, ttl=86400)
            
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
            
            # 1. 🌀 SPRINT 3: Analyse du sentiment utilisateur pour adaptation comportementale
            sentiment_analysis = await sentiment_analyzer.analyze_user_message(
                message=message,
                user_id=user_id,
                conversation_history=await self._get_conversation_history_for_sentiment(user_id)
            )
            
            # 2. 📈 SPRINT 4: Récupération du profil de progression + célébrations
            progress_profile = await progress_tracker.get_user_progress_profile(user_id)
            
            # 2.1. 🎯 SPRINT 5: Récupération du profil de vision long terme
            vision_profile = await vision_tracker.get_user_vision_profile(user_id)
            
            # 2.2. Vérification si célébration automatique nécessaire
            celebration = None
            if celebration_engine.should_trigger_celebration(progress_profile):
                achievements = progress_profile.get_top_achievements(limit=1)
                if achievements:
                    top_achievement = achievements[0]
                    from app.core.progress_tracker import ProgressMetricType, ProgressTrend
                    
                    celebration = celebration_engine.generate_celebration(
                        metric_type=ProgressMetricType(top_achievement["type"]),
                        improvement=top_achievement["improvement"],
                        trend=ProgressTrend(top_achievement["trend"]),
                        user_sentiment=sentiment_analysis.primary_sentiment
                    )
            
            # 3. Construction du prompt unifié avec Context Packet + MÉMOIRE + ÉTAT + SENTIMENT + PROGRESSION
            core_prompt = self._build_luna_core_prompt(sentiment_context=sentiment_analysis.to_dict())
            context_prompt = self._get_context_prompt(app_context)
            context_packet = await self._get_user_context_packet(user_id)
            conversation_memory = await self._get_conversation_memory(user_id)
            conversation_state = await self._get_conversation_state(user_id)
            progress_context = self._build_progress_context(progress_profile)
            vision_context = self._build_vision_context(vision_profile, message)
            
            # 4. Assemblage dynamique avec INTELLIGENCE CONVERSATIONNELLE
            state_guidance = self._build_state_guidance(conversation_state)
            
            full_prompt = f"""{core_prompt}

{context_prompt}

{context_packet}

{conversation_memory}

{state_guidance}

{progress_context}

{vision_context}

{f"# [🎊 CÉLÉBRATION AUTOMATIQUE]{chr(10)}{celebration_engine.format_celebration_for_luna(celebration)}" if celebration else ""}

# [🌀 ANALYSE SENTIMENT TEMPS RÉEL]
Sentiment détecté : {sentiment_analysis.primary_sentiment} (confiance: {sentiment_analysis.confidence:.1f})
État émotionnel : {sentiment_analysis.emotional_state}
Style communication : {sentiment_analysis.communication_style}
Niveau d'énergie : {sentiment_analysis.energy_level}
Mots-clés détectés : {', '.join(sentiment_analysis.keywords_detected[:3])}

⚠️ IMPORTANT : Adapte impérativement ton TON et STYLE selon cette analyse !

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

            # 5. Génération avec Gemini + FALLBACK
            try:
                response = self.model.generate_content(full_prompt)
                
                if not response or not response.text:
                    raise Exception("Empty response from Gemini")
                    
            except Exception as gemini_error:
                logger.error("Gemini API failed, using fallback", error=str(gemini_error))
                
                # 🚨 FALLBACK: Réponse intelligente selon le message
                fallback_response = self._generate_fallback_response(message, sentiment_analysis)
                
                # Simuler un objet response
                class FallbackResponse:
                    def __init__(self, text):
                        self.text = text
                        
                response = FallbackResponse(fallback_response)
            
            if not response or not response.text:
                return {
                    "success": False,
                    "message": "🌙 Désolé, j'ai des difficultés techniques. Peux-tu reformuler ?",
                    "context": app_context,
                    "energy_consumed": 0,
                    "type": "error"
                }

            # 🌙 LUNA V2: Classification intelligente conversation vs action
            action_name = self._calculate_intelligent_energy_cost(message, response.text.strip())
            
            # 💰 DÉDUCTION RÉELLE ÉNERGIE UTILISATEUR
            energy_consumed = 0
            if action_name != "luna_conversation":  # Seulement si pas gratuit
                try:
                    result = await energy_manager.consume(
                        user_id=user_id,
                        action_name=action_name,
                        context={
                            "app_source": app_context,
                            "message_preview": message[:50],
                            "response_preview": response.text.strip()[:50],
                            "sentiment": sentiment_analysis.primary_sentiment,
                            "action_type": "luna_chat"
                        }
                    )
                    
                    # Récupérer l'énergie réellement consommée
                    energy_consumed = result.get("energy_consumed", 0)
                    logger.info("Energy consumed successfully", 
                               user_id=user_id, 
                               action=action_name, 
                               energy_consumed=energy_consumed,
                               unlimited=result.get("unlimited", False))
                
                except Exception as e:
                    # Gestion des erreurs (énergie insuffisante, etc.)
                    error_msg = str(e)
                    logger.warning("Energy consumption failed", 
                                  user_id=user_id, 
                                  action=action_name, 
                                  error=error_msg)
                    
                    # Déterminer le type d'erreur
                    if "insuffisant" in error_msg.lower() or "insufficient" in error_msg.lower():
                        return {
                            "success": False,
                            "message": "⚡ Énergie insuffisante pour cette action. Recharge ton compte pour continuer !",
                            "context": app_context,
                            "energy_consumed": 0,
                            "type": "insufficient_energy",
                            "action_requested": action_name
                        }
                    else:
                        # Autres erreurs - permettre l'action mais log l'erreur
                        logger.error("Energy system error - allowing action", 
                                    user_id=user_id, action=action_name, error=error_msg)
                        energy_consumed = 0  # Gratuit en cas d'erreur système
            
            # 🎊 BONUS ÉNERGIE pour célébrations
            energy_bonus_awarded = 0
            if celebration and celebration.energy_bonus > 0:
                try:
                    bonus_result = await energy_manager.refund(
                        user_id=user_id,
                        amount=celebration.energy_bonus,
                        reason=f"Luna celebration bonus - {celebration.level.value}",
                        context={
                            "celebration_level": celebration.level.value,
                            "achievement": celebration.achievement_description,
                            "app_source": app_context,
                            "bonus_type": "celebration"
                        }
                    )
                    
                    energy_bonus_awarded = celebration.energy_bonus
                    logger.info("Energy bonus awarded", 
                               user_id=user_id, 
                               bonus_amount=celebration.energy_bonus,
                               celebration_level=celebration.level.value,
                               transaction_id=bonus_result.get("transaction_id"))
                
                except Exception as e:
                    logger.error("Failed to award energy bonus", 
                                user_id=user_id, 
                                bonus_amount=celebration.energy_bonus,
                                error=str(e))
                    # Continuer même si le bonus échoue
            
            # 🧠 SPRINT 2: Sauvegarder la conversation + État pour intelligence
            await self._save_conversation_turn(user_id, message, response.text.strip())
            await self._update_conversation_state(user_id, message, response.text.strip())
            
            # 🌀 SPRINT 3+4+5: Logs complets des 3 boucles Luna
            logger.info("🌙 Luna Triple Loop Analysis",
                       user_id=user_id,
                       # Boucle Comportementale
                       sentiment=sentiment_analysis.primary_sentiment,
                       emotional_state=sentiment_analysis.emotional_state,
                       energy_level=sentiment_analysis.energy_level,
                       # Boucle Progression  
                       progress_trend=progress_profile.overall_trend.value,
                       momentum_score=f"{progress_profile.momentum_score:.0f}/100",
                       celebration_triggered=celebration is not None,
                       # Boucle Narrative
                       career_phase=vision_profile.career_narrative.career_phase.value,
                       vision_momentum=f"{vision_profile.vision_momentum:.0f}/100",
                       primary_goal=vision_profile.get_primary_goal().title if vision_profile.get_primary_goal() else "None")
            
            return {
                "success": True,
                "message": response.text.strip(),
                "context": app_context,
                "energy_consumed": energy_consumed,  # 💰 Real energy deducted from user account
                "type": "text",
                # 🌀 SPRINT 3: Données comportementales pour monitoring
                "sentiment_analysis": {
                    "primary_sentiment": sentiment_analysis.primary_sentiment,
                    "confidence": sentiment_analysis.confidence,
                    "energy_level": sentiment_analysis.energy_level,
                    "communication_style": sentiment_analysis.communication_style,
                    "emotional_state": sentiment_analysis.emotional_state,
                    "keywords": sentiment_analysis.keywords_detected[:3]  # Top 3 pour éviter surcharge
                },
                # 📈 SPRINT 4: Données de progression pour celebrations  
                "progress_analysis": {
                    "overall_trend": progress_profile.overall_trend.value,
                    "momentum_score": progress_profile.momentum_score,
                    "recent_achievements": progress_profile.get_top_achievements(limit=2),
                    "last_victory": progress_profile.last_victory,
                    "next_milestone": progress_profile.next_milestone,
                    "celebration_triggered": celebration is not None,
                    "celebration_level": celebration.level.value if celebration else None,
                    "energy_bonus_awarded": energy_bonus_awarded
                },
                # 🎯 SPRINT 5: Données de vision et narrative
                "vision_analysis": {
                    "career_phase": vision_profile.career_narrative.career_phase.value,
                    "vision_momentum": vision_profile.vision_momentum,
                    "story_coherence": vision_profile.story_coherence_score,
                    "primary_goal": vision_profile.get_primary_goal().title if vision_profile.get_primary_goal() else None,
                    "transformation_theme": vision_profile.career_narrative.transformation_theme,
                    "current_chapter": vision_profile.career_narrative.current_chapter,
                    "motivational_triggers": vision_profile.motivational_triggers[:2]  # Top 2
                }
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

    def _generate_fallback_response(self, message: str, sentiment_analysis) -> str:
        """
        🚨 FALLBACK: Génère une réponse d'urgence si Gemini est down
        """
        
        message_lower = message.lower()
        sentiment = sentiment_analysis.primary_sentiment if sentiment_analysis else "neutre"
        
        # Réponses contextuelles selon le type de message
        if any(word in message_lower for word in ["salut", "bonjour", "hello", "hey"]):
            return "🌙 Salut ! Je suis Luna, ton copilote carrière. Comment puis-je t'aider aujourd'hui ? (⚡ Maintenance en cours, désolé pour la réponse basique !)"
            
        elif any(word in message_lower for word in ["cv", "curriculum"]):
            return "🎯 Je peux t'aider avec ton CV ! Malheureusement je suis en maintenance technique. Peux-tu réessayer dans quelques minutes ? En attendant, pense à optimiser tes mots-clés ! ✨"
            
        elif any(word in message_lower for word in ["lettre", "motivation"]):
            return "📝 Les lettres de motivation sont ma spécialité ! Je suis temporairement en maintenance. Réessaie bientôt, et on va créer une lettre qui cartonne ! 🚀"
            
        elif any(word in message_lower for word in ["conseil", "aide", "suggestion"]):
            return "💡 Je suis là pour t'accompagner ! Actuellement en maintenance technique. En attendant : reste focus sur tes objectifs et reviens me voir dans quelques minutes ! 💪"
            
        elif sentiment == "anxieux":
            return "🤗 Je sens que c'est un moment important pour toi. Je suis temporairement en maintenance, mais je serai bientôt de retour pour t'épauler comme il faut ! 💙"
            
        elif sentiment == "motivé":
            return "🚀 J'adore ton énergie ! Je suis en maintenance rapide, mais ça va pas m'empêcher de revenir en force pour booster ta carrière ! À très vite ! 🔥"
            
        else:
            return "🌙 Salut ! Je suis Luna, ton copilote carrière. Je suis temporairement en maintenance technique, mais je reviens très vite ! Peux-tu reformuler ta demande dans quelques minutes ? ⚡"

# Instance globale (lazy initialization)
luna_core = None

def get_luna_core():
    """Récupère l'instance Luna Core avec lazy initialization"""
    global luna_core
    if luna_core is None:
        luna_core = LunaCore()
    return luna_core