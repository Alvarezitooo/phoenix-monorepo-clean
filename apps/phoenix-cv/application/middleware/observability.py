"""
📊 Middleware Observabilité Phoenix CV
Logs structurés JSON conformes au schéma unifié v1.0
"""

from __future__ import annotations
import json
import logging
import time
import uuid
from typing import Callable, Awaitable, Optional, Dict, Any
from datetime import datetime, timezone

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import structlog

# Configuration du logger structuré
def setup_json_logging(level: str = "INFO") -> None:
    """Configure les logs JSON pour Phoenix CV"""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configuration du logger standard Python
    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, level.upper(), logging.INFO),
    )

# Headers sensibles à masquer
SENSITIVE_HEADERS = {"authorization", "cookie", "set-cookie", "x-api-key", "x-auth-token"}

def scrub_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """Masque les headers sensibles"""
    redacted = {}
    for k, v in headers.items():
        lk = k.lower()
        if lk in SENSITIVE_HEADERS:
            redacted[k] = "<redacted>"
        else:
            redacted[k] = v
    return redacted

def extract_user_id_from_request(request: Request) -> Optional[str]:
    """Extrait l'user_id de la requête si disponible"""
    try:
        # Essayer depuis le body JSON
        if hasattr(request, '_json_body'):
            return request._json_body.get('user_id')
        
        # Essayer depuis les query params
        return request.query_params.get('user_id')
    except:
        return None

def extract_action_type_from_request(request: Request) -> Optional[str]:
    """Extrait l'action_type de la requête si disponible"""
    try:
        # Mapping des paths vers actions
        path_action_map = {
            "/cv/analyze": "analyse_cv_complete",
            "/cv/optimize": "optimisation_cv",
            "/cv/mirror-match": "mirror_match",
            "/cv/salary": "salary_analysis"
        }
        
        # Recherche par path exact
        if request.url.path in path_action_map:
            return path_action_map[request.url.path]
            
        # Essayer depuis le body JSON
        if hasattr(request, '_json_body'):
            return request._json_body.get('action_type')
            
        return None
    except:
        return None

class ObservabilityMiddleware(BaseHTTPMiddleware):
    """
    📊 Middleware d'observabilité pour Phoenix CV
    Génère des logs JSON conformes au schéma unifié v1.0
    """
    
    def __init__(self, app: ASGIApp, service_name: str = "phoenix-cv") -> None:
        super().__init__(app)
        self.service_name = service_name
        self.logger = structlog.get_logger("observability")
        
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        started = time.time()
        
        # Génération ou récupération du Request ID
        correlation_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        # Stockage du correlation_id dans request.state pour réutilisation
        request.state.correlation_id = correlation_id
        
        # Parsing préliminaire pour extraction user_id/action_type
        try:
            if request.method in ["POST", "PUT", "PATCH"] and "application/json" in request.headers.get("content-type", ""):
                body = await request.body()
                if body:
                    json_body = json.loads(body.decode())
                    request._json_body = json_body
                    # Re-création du body pour FastAPI
                    request._body = body
        except Exception as e:
            # Body parsing failed - continue without JSON body
            logger.debug("Failed to parse request body as JSON", error=str(e))
        
        # Extraction des métadonnées de requête
        user_id = extract_user_id_from_request(request)
        action_type = extract_action_type_from_request(request)
        
        # Contexte de base pour les logs
        base_context = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service_name": self.service_name,
            "correlation_id": correlation_id,
            "user_id": user_id,
            "action_type": action_type,
            "environment": "development",  # TODO: depuis env var
            "service_version": "cv@1.0.0",  # TODO: depuis env var
            "schema_version": "1.0"
        }
        
        # Log de requête entrante
        self.logger.info(
            "http_request received",
            **base_context,
            log_level="INFO",
            status_code=None,
            latency_ms=None,
            metadata={
                "method": request.method,
                "path": request.url.path,
                "query": str(request.url.query),
                "headers": scrub_headers(dict(request.headers)),
                "client_ip": request.client.host if request.client else None
            }
        )
        
        try:
            # Traitement de la requête
            response = await call_next(request)
            
            # Calcul de la latence
            latency_ms = int((time.time() - started) * 1000)
            
            # Ajout des headers de corrélation à la réponse
            response.headers.setdefault("X-Request-ID", correlation_id)
            response.headers.setdefault("X-Correlation-ID", correlation_id)
            response.headers.setdefault("X-Service", self.service_name)
            
            # Log de réponse
            self.logger.info(
                "http_response OK",
                **base_context,
                log_level="INFO",
                status_code=response.status_code,
                latency_ms=latency_ms,
                metadata={
                    "response_headers": scrub_headers(dict(response.headers)),
                    "content_length": response.headers.get("content-length")
                }
            )
            
            return response
            
        except Exception as exc:
            # Calcul de la latence même en cas d'erreur
            latency_ms = int((time.time() - started) * 1000)
            
            # Log d'erreur
            self.logger.error(
                "http_exception",
                **base_context,
                log_level="ERROR",
                status_code=500,
                latency_ms=latency_ms,
                metadata={
                    "error": repr(exc),
                    "error_type": type(exc).__name__
                }
            )
            
            raise

class BusinessLogger:
    """
    💼 Logger spécialisé pour les actions métier Phoenix CV
    """
    
    def __init__(self, service_name: str = "phoenix-cv"):
        self.service_name = service_name
        self.logger = structlog.get_logger("business")
    
    def log_cv_action(
        self,
        correlation_id: str,
        user_id: str,
        action_type: str,
        status: str,
        latency_ms: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log d'action CV avec contexte business"""
        base_context = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service_name": self.service_name,
            "correlation_id": correlation_id,
            "user_id": user_id,
            "action_type": action_type,
            "log_level": "INFO",
            "status_code": None,
            "latency_ms": latency_ms,
            "environment": "development",
            "service_version": "cv@1.0.0",
            "schema_version": "1.0"
        }
        
        self.logger.info(
            f"business_action {status}",
            **base_context,
            metadata={
                "business_status": status,
                **(metadata or {})
            }
        )
    
    def log_luna_interaction(
        self,
        correlation_id: str,
        user_id: str,
        action_type: str,
        luna_operation: str,
        status: str,
        latency_ms: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log d'interaction avec Luna Hub"""
        base_context = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service_name": self.service_name,
            "correlation_id": correlation_id,
            "user_id": user_id,
            "action_type": action_type,
            "log_level": "INFO",
            "status_code": None,
            "latency_ms": latency_ms,
            "environment": "development",
            "service_version": "cv@1.0.0",
            "schema_version": "1.0"
        }
        
        self.logger.info(
            f"luna_interaction {status}",
            **base_context,
            metadata={
                "luna_operation": luna_operation,
                "interaction_status": status,
                **(metadata or {})
            }
        )

# Instance globale du business logger
business_logger = BusinessLogger()