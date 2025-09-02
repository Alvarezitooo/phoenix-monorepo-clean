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

@dataclass
class EventRequest:
    """Requête pour créer un événement dans l'Event Store"""
    user_id: str
    event_type: str
    app_source: str = "phoenix_aube"
    event_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class EventResponse:
    """Réponse création événement"""
    success: bool
    event_id: Optional[str] = None

@dataclass
class SessionRequest:
    """Requête pour démarrer une session Aube"""
    user_id: str
    level: str  # "ultra_light", "court", "profond"
    context: Optional[Dict[str, Any]] = None

@dataclass
class SessionResponse:
    """Réponse création session"""
    success: bool
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

@dataclass
class NarrativeContext:
    """Capital narratif utilisateur récupéré"""
    user_profile: Dict[str, Any]
    usage_analytics: Dict[str, Any]
    professional_journey: Dict[str, Any]
    ai_insights: Dict[str, Any]

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

    def track_event(self, request: EventRequest) -> EventResponse:
        """📊 Event Sourcing - Créer événement immutable"""
        try:
            response = self._client.post(
                f"{LUNA_BASE_URL}/luna/events",
                json={
                    "user_id": request.user_id,
                    "event_type": request.event_type,
                    "app_source": request.app_source,
                    "event_data": request.event_data or {},
                    "metadata": request.metadata or {}
                },
                headers=self._get_headers()
            )
            
            if response.status_code == 401:
                raise LunaAuthError("Authentication failed")
            elif response.status_code != 201:
                raise LunaContractError(f"Event creation failed: {response.status_code}")
                
            data = response.json()
            return EventResponse(
                success=data.get("success", True),
                event_id=data.get("event_id")
            )
            
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
            logger.error("Event tracking failed", error=str(e))
            # Event sourcing graceful degradation
            return EventResponse(success=False)

    def get_narrative_context(self, user_id: str) -> Optional[NarrativeContext]:
        """🧠 Capital Narratif - Récupérer mémoire utilisateur"""
        try:
            response = self._client.get(
                f"{LUNA_BASE_URL}/luna/narrative/{user_id}",
                headers=self._get_headers()
            )
            
            if response.status_code == 401:
                raise LunaAuthError("Authentication failed")
            elif response.status_code == 404:
                logger.info("No narrative context found", user_id=user_id)
                return None
            elif response.status_code != 200:
                raise LunaContractError(f"Narrative fetch failed: {response.status_code}")
                
            data = response.json()
            capital = data.get("capital_narratif", {})
            
            return NarrativeContext(
                user_profile=capital.get("user_profile", {}),
                usage_analytics=capital.get("usage_analytics", {}),
                professional_journey=capital.get("professional_journey", {}),
                ai_insights=capital.get("ai_insights", {})
            )
            
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
            logger.warning("Narrative context unavailable", error=str(e))
            return None

    def start_aube_session(self, request: SessionRequest) -> SessionResponse:
        """🎯 Session Aube - Démarrer assessment avec contexte"""
        try:
            response = self._client.post(
                f"{LUNA_BASE_URL}/luna/aube/assessment/start",
                json={
                    "user_id": request.user_id,
                    "level": request.level,
                    "context": request.context or {}
                },
                headers=self._get_headers()
            )
            
            if response.status_code == 401:
                raise LunaAuthError("Authentication failed")
            elif response.status_code == 402:
                raise LunaInsufficientEnergy()
            elif response.status_code != 201:
                raise LunaContractError(f"Session start failed: {response.status_code}")
                
            data = response.json()
            return SessionResponse(
                success=data.get("success", True),
                session_id=data.get("session_id"),
                context=data.get("context")
            )
            
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
            logger.error("Session start failed", error=str(e))
            raise LunaClientError(f"Connection failed: {e}")

    def update_aube_session(self, session_id: str, signals: Dict[str, Any], step: str) -> bool:
        """🔄 Update session avec nouveaux signaux"""
        try:
            response = self._client.post(
                f"{LUNA_BASE_URL}/luna/aube/assessment/update",
                json={
                    "session_id": session_id,
                    "signals": signals,
                    "completed_step": step
                },
                headers=self._get_headers()
            )
            
            return response.status_code == 200
            
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
            logger.warning("Session update failed", error=str(e))
            return False

    def get_aube_recommendations(self, session_id: str) -> Optional[Dict[str, Any]]:
        """🎯 Recommandations finales avec Luna Hub"""
        try:
            response = self._client.post(
                f"{LUNA_BASE_URL}/luna/aube/recommendations/{session_id}",
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning("Recommendations failed", status=response.status_code)
                return None
                
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
            logger.warning("Recommendations unavailable", error=str(e))
            return None

    def __del__(self):
        """Cleanup HTTP client"""
        if hasattr(self, '_client'):
            self._client.close()