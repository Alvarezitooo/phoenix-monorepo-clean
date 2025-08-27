from __future__ import annotations
from typing import List, Dict, Any

class AubeMatchingService:
    def __init__(self, repo):
        self.repo = repo
    
    def recommend(self, user_id: str, features: Dict[str, Any], k: int = 5) -> Dict[str, Any]:
        recos = _rank_jobs_stub(features, k)
        self.repo.insert_event({"type": "AubeRecommendationsGenerated", "user_id": user_id, "data": {"job_codes": [r["job_code"] for r in recos]}})
        return {"recommendations": recos}

def _rank_jobs_stub(features: Dict[str, Any], k: int) -> List[Dict[str, Any]]:
    appet = (features or {}).get("appetences", {})
    prefers_people = (appet.get("people", 0) >= appet.get("data", 0))
    base = [
        {
            "job_code": "UXD", "label": "UX Designer",
            "reasons": [
                {"feature": "valeurs", "phrase": "Autonomie + impact → métiers à ownership"},
                {"feature": "taches_like", "phrase": "Ateliers usagers → UX terrain"},
            ],
            "counter_example": {"risk": "reporting_pur", "phrase": "Si tu évites le reporting pur… Alternative : UX Research junior"},
            "futureproof": {"score_0_1": 0.76, "drivers": [
                {"factor": "taches_routinisables", "direction": "down", "phrase": "Tâches routinisables ↓"},
                {"factor": "interaction_humaine", "direction": "up", "phrase": "Interaction humaine ↑"},
            ]},
            "timeline": [
                {"year": 2026, "change": "↑ design ops outillé IA", "signal": "adoption", "confidence": 2},
                {"year": 2028, "change": "↑ co‑création homme‑IA", "signal": "pratiques établies", "confidence": 3},
            ],
            "ia_plan": [
                {"skill": "Prompting avancé", "micro_action": "Créer 3 gabarits", "effort_min_per_day": 20, "resource_hint": "kb://ia/prompting", "benefit_phrase": "Vitesse + Qualité", "difficulty": 1},
            ],
        },
        {
            "job_code": "PO", "label": "Product Owner",
            "reasons": [{"feature": "valeurs", "phrase": "Autonomie + impact → ownership"}],
            "futureproof": {"score_0_1": 0.68, "drivers": [{"factor": "coordination", "direction": "up", "phrase": "Coordination humaine ↑"}]},
            "timeline": [], "ia_plan": []
        },
    ]
    if not prefers_people:
        base.insert(0, {
            "job_code": "DA","label":"Data Analyst (light)",
            "reasons":[{"feature":"taches_like","phrase":"Analyse & optimisation → Data light"}],
            "futureproof": {"score_0_1": 0.55, "drivers": [{"factor":"automatisation", "direction":"down", "phrase":"Automatisation ↑ sur tâches routinières"}]},
            "timeline": [{"year": 2027, "change":"↑ auto‑BI", "signal":"outillage", "confidence":1}],
            "ia_plan": [{"skill":"Automatisation simple","micro_action":"1 workflow no‑code","effort_min_per_day":25,"resource_hint":"kb://automation/no-code","benefit_phrase":"Moins de tâches répétitives","difficulty":1}]
        })
    return base[:k]