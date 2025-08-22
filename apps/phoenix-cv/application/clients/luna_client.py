"""
🌙 Luna Client - Connexion robuste au Hub Central
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
LUNA_BASE_URL = os.getenv("LUNA_HUB_URL", "http://localhost:8003")
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
    required_pack: Optional[str] = None

@dataclass
class ConsumeRequest:
    """Requête de consommation d'énergie"""
    user_id: str
    action_name: str
    context: Optional[Dict[str, Any]] = None
    idempotency_key: Optional[str] = None

@dataclass
class ConsumeResponse:
    """Réponse de consommation d'énergie"""
    success: bool
    energy_consumed: int
    energy_remaining: int
    event_id: Optional[str] = None

class LunaClient:
    """
    🌙 Client robuste pour Luna Hub avec retry et observabilité
    """
    
    def __init__(self, token_provider: Callable[[], str], request_id_provider: Optional[Callable[[], str]] = None):
        """
        Args:
            token_provider: Fonction retournant un JWT Bearer valide
            request_id_provider: Fonction retournant le X-Request-ID courant
        """
        self._token_provider = token_provider
        self._request_id_provider = request_id_provider or (lambda: str(uuid.uuid4()))
        self._client = httpx.Client(timeout=LUNA_TIMEOUT_S)
        
        logger.info("Luna client initialized", luna_hub_url=LUNA_BASE_URL)
    
    def _headers(self, idem_key: Optional[str] = None) -> Dict[str, str]:
        """Headers standard pour Luna Hub"""
        headers = {
            "Authorization": f"Bearer {self._token_provider()}",
            "Content-Type": "application/json",
            "X-Request-ID": self._request_id_provider(),
            "X-Correlation-ID": self._request_id_provider()
        }
        
        if idem_key:
            headers["X-Idempotency-Key"] = idem_key
            
        return headers
    
    def _retry(self, func, *args, **kwargs):
        """Retry logic pour appels Luna Hub"""
        last_exc = None
        
        for attempt in range(LUNA_RETRIES + 1):
            try:
                logger.debug("Luna Hub call attempt", attempt=attempt + 1, max_retries=LUNA_RETRIES + 1)
                return func(*args, **kwargs)
                
            except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
                last_exc = e
                logger.warning("Luna Hub call failed, retrying", 
                             attempt=attempt + 1, 
                             error=str(e),
                             remaining_retries=LUNA_RETRIES - attempt)
                continue
                
        logger.error("Luna Hub call failed after all retries", error=str(last_exc))
        raise last_exc
    
    def check_energy(self, req: CheckRequest) -> CheckResponse:
        """
        🔋 Vérifie si l'utilisateur peut effectuer l'action
        """
        url = f"{LUNA_BASE_URL}/luna/energy/can-perform"
        payload = {
            "user_id": req.user_id, 
            "action_name": req.action_name
        }
        
        logger.info("Checking energy with Luna Hub", 
                   user_id=req.user_id, 
                   action_name=req.action_name,
                   url=url)
        
        try:
            response = self._retry(self._client.post, url, headers=self._headers(), json=payload)
            
            if response.status_code == 401:
                logger.error("Luna Hub authentication failed", status_code=response.status_code)
                raise LunaAuthError("Unauthorized with Luna Hub")
                
            if response.status_code >= 500:
                logger.error("Luna Hub server error", status_code=response.status_code, response=response.text)
                raise LunaClientError(f"Luna Hub 5xx: {response.text}")
            
            if response.status_code == 422:
                logger.error("Luna Hub validation error", status_code=response.status_code, response=response.text)
                raise LunaContractError(f"Invalid request to Luna Hub: {response.text}")
                
            data = response.json()
            
            # Validation du contrat API
            if not {"success", "can_perform"}.issubset(data.keys()):
                logger.error("Invalid Luna Hub response contract", response_data=data)
                raise LunaContractError("Invalid contract from /luna/energy/can-perform")
            
            if not data.get("success"):
                logger.warning("Luna Hub returned failure", response_data=data)
                
            # Gestion énergie insuffisante
            if not data.get("can_perform") and data.get("deficit", 0) > 0:
                logger.warning("Insufficient energy detected", 
                             deficit=data.get("deficit"),
                             required_pack="cafe_luna")
                raise LunaInsufficientEnergy("cafe_luna")
            
            logger.info("Energy check completed successfully", 
                       can_perform=data.get("can_perform"),
                       energy_required=data.get("energy_required"),
                       current_energy=data.get("current_energy"))
            
            return CheckResponse(
                can_perform=data.get("can_perform", False),
                energy_required=data.get("energy_required"),
                current_energy=data.get("current_energy"),
                required_pack=data.get("required_pack")
            )
            
        except (LunaAuthError, LunaInsufficientEnergy, LunaContractError):
            raise
        except Exception as e:
            logger.error("Unexpected error during energy check", error=str(e))
            raise LunaClientError(f"Unexpected error: {str(e)}")
    
    def consume_energy(self, req: ConsumeRequest) -> ConsumeResponse:
        """
        ⚡ Consomme l'énergie et génère un événement
        """
        url = f"{LUNA_BASE_URL}/luna/energy/consume"
        idem = req.idempotency_key or str(uuid.uuid4())
        payload = {
            "user_id": req.user_id,
            "action_name": req.action_name,
            "context": req.context or {}
        }
        
        logger.info("Consuming energy with Luna Hub",
                   user_id=req.user_id,
                   action_name=req.action_name,
                   idempotency_key=idem,
                   url=url)
        
        try:
            response = self._retry(self._client.post, url, headers=self._headers(idem_key=idem), json=payload)
            
            if response.status_code == 401:
                logger.error("Luna Hub authentication failed", status_code=response.status_code)
                raise LunaAuthError("Unauthorized with Luna Hub")
                
            if response.status_code == 402:
                logger.warning("Insufficient energy for consumption", status_code=response.status_code)
                data = response.json()
                required_pack = data.get("detail", {}).get("required_pack", "cafe_luna")
                raise LunaInsufficientEnergy(required_pack)
                
            if response.status_code >= 500:
                logger.error("Luna Hub server error", status_code=response.status_code, response=response.text)
                raise LunaClientError(f"Luna Hub 5xx: {response.text}")
            
            if response.status_code == 422:
                logger.error("Luna Hub validation error", status_code=response.status_code, response=response.text)
                raise LunaContractError(f"Invalid request to Luna Hub: {response.text}")
                
            data = response.json()
            
            # Validation du contrat API
            if not {"success"}.issubset(data.keys()):
                logger.error("Invalid Luna Hub response contract", response_data=data)
                raise LunaContractError("Invalid contract from /luna/energy/consume")
            
            if not data.get("success"):
                logger.error("Energy consumption failed", response_data=data)
                raise LunaClientError(f"Energy consumption failed: {data}")
                
            logger.info("Energy consumed successfully",
                       energy_consumed=data.get("energy_consumed"),
                       energy_remaining=data.get("energy_remaining"),
                       event_id=data.get("event_id"))
            
            return ConsumeResponse(
                success=data.get("success", False),
                energy_consumed=data.get("energy_consumed", 0),
                energy_remaining=data.get("energy_remaining", 0),
                event_id=data.get("event_id")
            )
            
        except (LunaAuthError, LunaInsufficientEnergy, LunaContractError):
            raise
        except Exception as e:
            logger.error("Unexpected error during energy consumption", error=str(e))
            raise LunaClientError(f"Unexpected error: {str(e)}")
    
    def get_narrative(self, user_id: str) -> Dict[str, Any]:
        """
        📚 Récupère le Capital Narratif de l'utilisateur
        """
        url = f"{LUNA_BASE_URL}/luna/narrative/{user_id}"
        
        logger.info("Getting user narrative from Luna Hub", user_id=user_id, url=url)
        
        try:
            response = self._retry(self._client.get, url, headers=self._headers())
            
            if response.status_code == 401:
                logger.error("Luna Hub authentication failed", status_code=response.status_code)
                raise LunaAuthError("Unauthorized with Luna Hub")
                
            if response.status_code >= 500:
                logger.error("Luna Hub server error", status_code=response.status_code, response=response.text)
                raise LunaClientError(f"Luna Hub 5xx: {response.text}")
            
            data = response.json()
            
            logger.info("User narrative retrieved successfully", user_id=user_id)
            return data
            
        except (LunaAuthError, LunaContractError):
            raise
        except Exception as e:
            logger.error("Unexpected error during narrative retrieval", error=str(e))
            raise LunaClientError(f"Unexpected error: {str(e)}")
    
    def __del__(self):
        """Fermeture propre du client HTTP"""
        if hasattr(self, '_client'):
            self._client.close()