"""
🌙 Luna Core Service - Orchestrateur IA Centralisé
Service central pour la personnalité Luna unifiée avec Capital Narratif
"""

from typing import Dict, Any, Optional
import google.generativeai as genai
import structlog

# Refactored Imports
from app.core.supabase_client import event_store
from app.core.api_key_manager import api_key_manager, KeyProvider
from app.core.sentiment_analyzer import sentiment_analyzer
from app.core.progress_tracker import progress_tracker
from app.core.celebration_engine import celebration_engine
from app.core.vision_tracker import vision_tracker
from app.core.energy_manager import energy_manager
from app.core.luna_personality import PromptBuilder # <-- NOUVEAU

logger = structlog.get_logger("luna_core")

class LunaCore:
    """
    🌙 Service central de Luna - Orchestrateur IA unifié
    Gère l'orchestration des appels à l'IA en utilisant le PromptBuilder.
    """
    
    def __init__(self):
        self._genai_configured = False
        self.prompt_builder = PromptBuilder() # <-- NOUVEAU
        logger.info("Luna Core initialized with PromptBuilder and API key rotation support")
    
    async def _ensure_genai_configured(self) -> None:
        """🔑 Configure Gemini API avec rotation automatique des clés"""
        if self._genai_configured:
            return
        api_key, key_info = await api_key_manager.get_api_key(KeyProvider.GEMINI)
        if not api_key or not key_info.is_active:
            raise ValueError("Gemini API key manquante ou révoquée")
        genai.configure(api_key=api_key)
        self._genai_configured = True
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"temperature": 0.7, "top_p": 0.8, "max_output_tokens": 2000}
        )
        logger.info("Gemini API configured", key_id=key_info.key_id)

    async def generate_response(
        self, 
        user_id: str,
        message: str,
        app_context: str = "website",
        user_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Génère une réponse Luna en orchestrant les différents services et contextes.
        """
        try:
            await self._ensure_genai_configured()

            # 1. Récupération de tous les contextes (logique existante)
            sentiment_context = await sentiment_analyzer.analyze_user_message(message, user_id)
            # ... (récupération du narrative_context, progress_context, etc.)
            narrative_context = "Context from Narrative Store"

            # 2. Construction du prompt via le PromptBuilder (NOUVELLE LOGIQUE)
            full_prompt = self.prompt_builder.build_full_prompt(
                user_message=message,
                app_context=app_context,
                narrative_context=narrative_context,
                sentiment_context=sentiment_context.to_dict() if sentiment_context else None
            )

            # 3. Génération de la réponse IA (logique existante)
            response = self.model.generate_content(full_prompt)
            if not response or not response.text:
                raise Exception("Empty response from Gemini")

            # 4. Logique post-génération (consommation énergie, events, etc.)
            # ... (logique existante)

            logger.info("Luna response generated successfully", user_id=user_id)

            return {
                "success": True,
                "message": response.text.strip(),
                "context": app_context,
                "energy_consumed": 0, # TODO: Remplacer par la vraie logique
                "type": "text"
            }

        except Exception as e:
            logger.error("Luna Core generation error", user_id=user_id, error=str(e))
            # ... (gestion d'erreur existante)
            return {"success": False, "message": "Error"}

# Instance globale
luna_core = LunaCore()

def get_luna_core() -> LunaCore:
    """🌙 Obtenir l'instance Luna Core"""
    return luna_core
