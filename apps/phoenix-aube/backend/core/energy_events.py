from typing import Dict, Any

def emit_energy_event(repo, user_id: str, action: str, tier: str, cost: float):
    return repo.insert_event({
        "type": "EnergyConsumed",
        "user_id": user_id,
        "data": {"action": action, "tier": tier, "cost_pct": cost},
    })