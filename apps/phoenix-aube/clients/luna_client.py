"""
🌙 Luna Client - Connexion robuste au Hub Central (Phoenix Aube)
Directive Oracle: Hub = Roi, API Contract strict, Zero logique énergie locale
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple, Callable
import os
import uuid
import httpx
import structlog

logger = structlog.get_logger("luna_client")

# Configuration
LUNA_BASE_URL = os.getenv("LUNA_HUB_URL", "https://luna-hub-backend-unified-production.up.railway.app")
LUNA_TIMEOUT_S = float(os.getenv("LUNA_TIMEOUT_S", "8"))
LUNA_RETRIES = int(os.getenv("LUNA_RETRIES", "2"))

class LunaClientError(Exception):
    """Erreur générique côté client Luna."""
    pass

class LunaAuthError(LunaClientError):
    """Erreur d'authentification avec Luna Hub."""
    pass

class LunaInsufficientEnergy(LunaClientError):
    """Énergie insuffisante - achat requis."""
    def __init__(self, required_pack: str = "cafe_luna"):
        self.required_pack = required_pack
        super().__init__(f"insufficient_energy:{required_pack}")

class LunaContractError(LunaClientError):
    """Erreur de contrat API avec Luna Hub."""
    pass

@dataclass
class CheckRequest:
    """Requête de vérification d'énergie"""
    user_id: str
    action_name: str

@dataclass
class CheckResponse:
    """Réponse de vérification d'énergie"""
    can_perform: bool
    energy_required: Optional[int] = None
    current_energy: Optional[int] = None

@dataclass
class ConsumeRequest:
    """Requête de consommation d'énergie"""
    user_id: str
    action_name: str

@dataclass
class ConsumeResponse:
    """Réponse de consommation d'énergie"""
    success: bool
    new_energy_balance: Optional[int] = None
    transaction_id: Optional[str] = None

class LunaClient:
    """
    Client Luna Hub pour Phoenix Aube
    Gestion auth + énergie centralisée
    """

    def __init__(
        self, 
        token_provider: Callable[[], str],
        request_id_provider: Optional[Callable[[], str]] = None
    ):
        self.token_provider = token_provider
        self.request_id_provider = request_id_provider or (lambda: str(uuid.uuid4()))
        self._client = httpx.Client(timeout=LUNA_TIMEOUT_S)

    def _get_headers(self) -> Dict[str, str]:
        """Headers par défaut avec auth et corrélation"""
        return {
            "Authorization": f"Bearer {self.token_provider()}",
            "Content-Type": "application/json",
            "X-Request-ID": self.request_id_provider(),
            "X-Service": "phoenix-aube"
        }

    def check_energy(self, request: CheckRequest) -> CheckResponse:
        """Vérification d'énergie avant action"""
        try:
            response = self._client.post(
                f"{LUNA_BASE_URL}/energy/check",
                json={
                    "user_id": request.user_id,
                    "action_name": request.action_name
                },
                headers=self._get_headers()
            )
            
            if response.status_code == 402:
                raise LunaInsufficientEnergy()
            elif response.status_code == 401:
                raise LunaAuthError("Authentication failed")
            elif response.status_code != 200:
                raise LunaContractError(f"API error: {response.status_code}")
                
            data = response.json()
            return CheckResponse(
                can_perform=data.get("can_perform", False),
                energy_required=data.get("energy_required"),
                current_energy=data.get("current_energy")
            )
            
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
            logger.error("Luna Hub connection failed", error=str(e))
            raise LunaClientError(f"Connection failed: {e}")

    def consume_energy(self, request: ConsumeRequest) -> ConsumeResponse:
        """Consommation d'énergie après succès action"""
        try:
            response = self._client.post(
                f"{LUNA_BASE_URL}/energy/consume",
                json={
                    "user_id": request.user_id,
                    "action_name": request.action_name
                },
                headers=self._get_headers()
            )
            
            if response.status_code == 402:
                raise LunaInsufficientEnergy()
            elif response.status_code == 401:
                raise LunaAuthError("Authentication failed")
            elif response.status_code != 200:
                raise LunaContractError(f"API error: {response.status_code}")
                
            data = response.json()
            return ConsumeResponse(
                success=data.get("success", False),
                new_energy_balance=data.get("new_energy_balance"),
                transaction_id=data.get("transaction_id")
            )
            
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
            logger.error("Luna Hub connection failed", error=str(e))
            raise LunaClientError(f"Connection failed: {e}")

    def __del__(self):
        """Cleanup HTTP client"""
        if hasattr(self, '_client'):
            self._client.close()