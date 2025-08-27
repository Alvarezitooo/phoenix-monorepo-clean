from __future__ import annotations
from typing import Dict, Any

def compute_futureproof_stub(job_code: str) -> Dict[str, Any]:
    mapping = {
        "UXD": {"score_0_1": 0.76, "drivers": [
            {"factor": "taches_routinisables", "direction": "down", "phrase": "Tâches routinisables ↓"},
            {"factor": "interaction_humaine", "direction": "up", "phrase": "Interaction humaine ↑"},
        ]},
        "PO": {"score_0_1": 0.68, "drivers": [{"factor": "coordination", "direction": "up", "phrase": "Coordination humaine ↑"}]},
    }
    return mapping.get(job_code, {"score_0_1": 0.5, "drivers": [{"factor":"incertitude","direction":"down","phrase":"Données insuffisantes"}]})

class AubeFutureProofService:
    def __init__(self, repo):
        self.repo = repo
    
    def score(self, user_id: str, job_code: str) -> Dict[str, Any]:
        fp = compute_futureproof_stub(job_code)
        out = {"score_0_1": fp["score_0_1"], "drivers": fp["drivers"]}
        self.repo.insert_event({"type": "AubeFutureProofScored", "user_id": user_id, "data": {"job_code": job_code, "score": out["score_0_1"]}})
        return out