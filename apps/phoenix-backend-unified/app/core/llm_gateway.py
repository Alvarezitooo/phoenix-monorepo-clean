from __future__ import annotations
import os
import json
from abc import ABC, abstractmethod
from typing import Any, Dict

class LLMGateway(ABC):
    @abstractmethod
    def generate(self, *, system: str, user: str, context: Dict[str, Any]) -> str: ...

class GeminiProvider(LLMGateway):
    def __init__(self, model: str = "gemini-pro") -> None:
        self.model = model
        # TODO: SDK officiel via env GEMINI_API_KEY
    
    def _read(self, path: str) -> str:
        with open(path, "r", encoding="utf-8") as f: 
            return f.read()
    
    def assemble_prompt(self, narrative_json: str, persona_profile: Dict[str,Any]) -> Dict[str,str]:
        system_core = self._read("apps/phoenix-backend-unified/config/llm_prompts/luna_core_system.txt")
        # playbook simple (j2 simplifiée inline)
        playbook = f"[TONE]={persona_profile.get('mode')} | [READING_LEVEL]={persona_profile.get('reading_level')}"
        context = f"[CONTEXT_NARRATIF]\n{narrative_json}\n[PERSONA_PROFILE]\n{json.dumps(persona_profile)}"
        return {"system": system_core + "\n" + playbook, "context": context}
    
    def generate(self, *, system: str, user: str, context: Dict[str, Any]) -> str:
        # Stub DEV — renvoie l'assemblage (pour vérif wiring)
        return f"[Luna/Gemini STUB]\nSYSTEM=\n{system}\nCTX_KEYS={list(context.keys())}\nUSER={user}"