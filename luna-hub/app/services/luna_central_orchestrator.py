"""
🌙 Luna Central Orchestrator - Simplifié et Unifié
Phoenix Production - Luna unifiée avec context awareness

Orchestrateur simplifié qui utilise Luna unifiée avec context module.
Plus de spécialistes séparés - Luna s'adapte selon le contexte !
"""

import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import uuid
import structlog

# Imports des composants core
from ..core.luna_personality_engine import luna_personality
from ..core.luna_voice_validator import luna_voice_validator
from ..core.llm_gateway import llm_gateway
from ..core.events import create_event
from ..core.energy_manager import energy_manager

logger = structlog.get_logger("luna_orchestrator")

class LunaCentralOrchestrator:
    """
    🌙 Orchestrateur Luna Unifié - Une seule Luna context-aware
    
    Responsabilités:
    1. Réception requêtes utilisateur
    2. Adaptation contexte selon module (aube/cv/letters/rise)
    3. Génération réponse Luna unifiée
    4. Maintien personnalité cohérente
    """
    
    def __init__(self):
        self.voice_validator = luna_voice_validator
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        
        # Context adaptations par module
        self.module_contexts = {
            "aube": {
                "personality": "Coach carrière bienveillante, experte découverte métiers",
                "tone": "Encourageante, exploratoire, orientée potentiel",
                "expertise": "Orientation professionnelle, reconversion, compétences transférables"
            },
            "cv": {
                "personality": "Experte optimisation CV, précise et technique",
                "tone": "Professionnelle, analytique, orientée résultats",
                "expertise": "Optimisation CV, ATS, profils candidats"
            },
            "letters": {
                "personality": "Maître des mots, persuasive et créative",
                "tone": "Inspirante, narrative, orientée storytelling",
                "expertise": "Lettres motivation, storytelling, persuasion écrite"
            },
            "rise": {
                "personality": "Coach entretiens, confiante et stratégique",
                "tone": "Motivante, technique, orientée performance",
                "expertise": "Préparation entretiens, simulations, coaching confidence"
            }
        }
        
        logger.info("Luna Central Orchestrator initialized - Unified Architecture")

    async def handle_user_message(
        self,
        user_message: str,
        user_context: Dict[str, Any],
        central_token: str,
        session_id: str = None
    ) -> Dict[str, Any]:
        """
        🎯 Point d'entrée principal Luna unifiée
        """
        try:
            session_id = session_id or str(uuid.uuid4())
            
            # Détecter module depuis le contexte
            current_module = user_context.get("luna_context", {}).get("current_module", "aube")
            
            # Construire prompt contextualisé
            context_prompt = self._build_contextual_prompt(current_module, user_context)
            
            logger.info("Luna unified processing",
                       user_id=user_context.get("user_id"),
                       session_id=session_id,
                       module=current_module,
                       message_preview=user_message[:50])
            
            # Générer réponse Luna avec context
            luna_response = await self._generate_luna_response(
                user_message=user_message,
                context_prompt=context_prompt,
                user_context=user_context,
                session_id=session_id
            )
            
            # Validation cohérence personnalité
            validation_result = self.voice_validator.validate_response(
                response=luna_response["content"],
                user_context=user_context,
                specialist=f"luna-{current_module}",
                context_type="conversation"
            )
            
            # Event sourcing simplifié
            await create_event({
                "type": "luna_unified_conversation",
                "actor_user_id": user_context.get("user_id"),
                "payload": {
                    "session_id": session_id,
                    "module": current_module,
                    "validation_score": validation_result.score,
                    "energy_consumed": luna_response.get("energy_consumed", 0)
                }
            })
            
            return {
                "success": True,
                "luna_response": luna_response["content"],
                "module": current_module,
                "energy_consumed": luna_response.get("energy_consumed", 0),
                "validation": validation_result,
                "meta": {
                    "session_id": session_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "orchestrator_version": "3.0.0-unified"
                }
            }
            
        except Exception as e:
            logger.error("Luna orchestrator error",
                        user_id=user_context.get("user_id"),
                        session_id=session_id,
                        error=str(e))
            
            return await self._create_error_response(str(e), session_id)

    def _build_contextual_prompt(self, module: str, user_context: Dict[str, Any]) -> str:
        """
        🎨 Construction prompt contextualisé selon module
        """
        module_config = self.module_contexts.get(module, self.module_contexts["aube"])
        
        base_prompt = f"""Tu es Luna 🌙, l'IA de Phoenix.

# CONTEXTE ACTUEL
Module: {module.upper()}
Personnalité: {module_config['personality']}
Ton: {module_config['tone']}
Expertise: {module_config['expertise']}

# TON STYLE
- Phrases courtes et engageantes
- Émojis sobres: 🌙🎯✨🚀
- Toujours bienveillante et encourageante
- Évite le jargon, reste accessible

# TA MISSION
Aide l'utilisateur dans le contexte {module} avec ton expertise spécialisée.
Adapte tes réponses selon le module sans perdre ta personnalité Luna.

Réponds maintenant avec ton expertise {module}:"""

        return base_prompt

    async def _generate_luna_response(
        self,
        user_message: str,
        context_prompt: str,
        user_context: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        🧠 Génération réponse Luna unifiée
        """
        try:
            # Vérifier énergie disponible
            user_id = user_context.get("user_id")
            estimated_cost = 5  # Coût base conversation
            
            energy_check = await energy_manager.check_energy(user_id, estimated_cost)
            if not energy_check.can_proceed:
                return {
                    "content": f"🌙 Tu n'as plus assez d'énergie ! Il te faut {estimated_cost}⚡ mais tu n'en as que {energy_check.current}. Recharge-toi ! ⚡",
                    "energy_consumed": 0
                }
            
            # Appel LLM avec prompt contextualisé
            llm_response = await llm_gateway.call_llm(
                messages=[
                    {"role": "system", "content": context_prompt},
                    {"role": "user", "content": user_message}
                ],
                model="gemini-pro",
                max_tokens=500,
                temperature=0.7
            )
            
            # Consommer énergie si succès
            if llm_response.get("success"):
                await energy_manager.consume(
                    user_id=user_id,
                    action_name="conseil_rapide",
                    context={
                        "module": user_context.get('luna_context', {}).get('current_module', 'general'),
                        "session_id": session_id
                    }
                )
            
            return {
                "content": llm_response.get("content", "🌙 Erreur technique ! Réessaie ! ⚡"),
                "energy_consumed": estimated_cost if llm_response.get("success") else 0
            }
            
        except Exception as e:
            logger.error("Luna response generation failed", error=str(e))
            return {
                "content": "🌙 Petit problème technique ! Relance-moi ! 🔧",
                "energy_consumed": 0
            }

    async def _create_error_response(self, error: str, session_id: str) -> Dict[str, Any]:
        """
        ❌ Réponse d'erreur gracieuse
        """
        error_responses = [
            "🌙 Oups ! Bug technique momentané. Réessaie ! 🔧",
            "🌙 Problème dans mes circuits ! Relance-moi ! ⚡",
            "🌙 Erreur détectée ! Ça devrait marcher maintenant ! 🚀"
        ]
        
        import random
        
        return {
            "success": False,
            "luna_response": random.choice(error_responses),
            "energy_consumed": 0,
            "error": error,
            "meta": {
                "session_id": session_id,
                "error_handled": True
            }
        }

# Instance globale Luna unifiée
luna_orchestrator = LunaCentralOrchestrator()