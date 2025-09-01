from __future__ import annotations
from typing import Dict, Any

class PersonaOrchestrator:
    def build_profile(self, signals: Dict[str, Any]) -> Dict[str, Any]:
        # Profil léger, éphémère (TTL géré ailleurs). Aucune étiquette clinique.
        mood = signals.get("mood","neutral")
        reading = "B1" if mood=="tired" else "B2"
        tone = "doux" if mood=="tired" else "focus"
        return {
            "persona_weights": {"burnout": 0.6 if mood=="tired" else 0.2},
            "mode": tone,
            "reading_level": reading,
            "escalation_policy": "UL->Court" if mood!="tired" else "UL_only",
            "ttl_days": 7,
        }