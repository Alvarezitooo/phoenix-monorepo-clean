from __future__ import annotations
import yaml
import os
from dataclasses import dataclass

@dataclass
class EnergyStatus:
    plan: str = "standard"  # or "unlimited"
    balance_pct: float = 100.0
    last_purchase: str | None = None

class EnergyGrid:
    def __init__(self, path: str | None = None):
        path = path or os.getenv("ENERGY_GRID_FILE", "apps/phoenix-backend-unified/config/energy_grid.yaml")
        with open(path, "r", encoding="utf-8") as f:
            self.grid = yaml.safe_load(f)
    
    def cost(self, tier: str, action: str, default: float = 0.0) -> float:
        return float(self.grid.get(tier, {}).get(action, default))

class AubeEnergyManager:
    """Gestionnaire d'énergie spécifique à Aube avec intégration YAML"""
    def __init__(self, grid: EnergyGrid | None = None):
        self._status_by_user: dict[str, EnergyStatus] = {}
        self.grid = grid or EnergyGrid()
    
    def get_status(self, user_id: str) -> EnergyStatus:
        return self._status_by_user.setdefault(user_id, EnergyStatus())
    
    def can_perform(self, user_id: str, action: str, tier: str = "simple") -> bool:
        st = self.get_status(user_id)
        cost = self.grid.cost(tier, action, 0.0)
        return st.plan == "unlimited" or st.balance_pct >= cost
    
    def consume(self, user_id: str, action: str, tier: str = "simple") -> EnergyStatus:
        st = self.get_status(user_id)
        cost = self.grid.cost(tier, action, 0.0)
        if st.plan != "unlimited":
            st.balance_pct = max(0.0, st.balance_pct - cost)
        return st