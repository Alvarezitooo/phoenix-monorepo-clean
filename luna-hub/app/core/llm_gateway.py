from __future__ import annotations
import os
import json
import httpx
from abc import ABC, abstractmethod
from typing import Any, Dict

class LLMGateway(ABC):
    @abstractmethod
    def generate(self, *, system: str, user: str, context: Dict[str, Any]) -> str: ...

class GeminiProvider(LLMGateway):
    def __init__(self, model: str = "gemini-1.5-flash-latest") -> None:
        self.model = model
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
    
    def _read(self, path: str) -> str:
        with open(path, "r", encoding="utf-8") as f: 
            return f.read()
    
    def assemble_prompt(self, narrative_json: str, persona_profile: Dict[str,Any]) -> Dict[str,str]:
        system_core = self._read("apps/luna-hub/config/llm_prompts/luna_core_system.txt")
        # playbook simple (j2 simplifiée inline)
        playbook = f"[TONE]={persona_profile.get('mode')} | [READING_LEVEL]={persona_profile.get('reading_level')}"
        context = f"[CONTEXT_NARRATIF]\n{narrative_json}\n[PERSONA_PROFILE]\n{json.dumps(persona_profile)}"
        return {"system": system_core + "\n" + playbook, "context": context}
    
    async def generate(self, *, system: str, user: str, context: Dict[str, Any]) -> str:
        """
        Génération de réponse Luna via Gemini API
        """
        if not self.api_key:
            return "🌙 Erreur de configuration API Gemini ! Clé manquante. 🔧"
        
        try:
            # Construire le prompt complet
            full_prompt = f"{system}\n\nUtilisateur: {user}\n\nRéponds en tant que Luna:"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": full_prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 500,
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/{self.model}:generateContent?key={self.api_key}",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if "candidates" in result and len(result["candidates"]) > 0:
                        content = result["candidates"][0]["content"]["parts"][0]["text"]
                        return content.strip()
                    else:
                        return "🌙 Gemini n'a pas pu générer de réponse. Réessaie ! ⚡"
                else:
                    return f"🌙 Erreur API Gemini ({response.status_code}). Réessaie ! 🔧"
                    
        except Exception as e:
            return f"🌙 Problème technique avec Gemini : {str(e)} 🔧"
    
    async def call_llm(self, *, messages: list, model: str = "gemini-pro", max_tokens: int = 500, temperature: float = 0.7) -> Dict[str, Any]:
        """
        Méthode call_llm pour compatibilité avec luna_central_orchestrator
        """
        try:
            # Extraire system et user des messages
            system_message = ""
            user_message = ""
            
            for msg in messages:
                if msg.get("role") == "system":
                    system_message = msg.get("content", "")
                elif msg.get("role") == "user":
                    user_message = msg.get("content", "")
            
            # Appeler generate avec le format attendu
            response_content = await self.generate(
                system=system_message,
                user=user_message,
                context={}
            )
            
            return {
                "success": True,
                "content": response_content
            }
            
        except Exception as e:
            return {
                "success": False,
                "content": f"🌙 Erreur technique ! {str(e)} 🔧",
                "error": str(e)
            }

# Instance globale exportée
llm_gateway = GeminiProvider()