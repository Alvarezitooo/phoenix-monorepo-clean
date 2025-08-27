"""
🛡️ Décorateur Rate Limiting - Phoenix Luna Hub  
Intégration transparente du rate limiting dans les endpoints FastAPI
"""

from functools import wraps
from typing import Optional, Dict, Any, Union
from fastapi import Request, HTTPException, Response
from fastapi.responses import JSONResponse
import structlog

from .rate_limiter import rate_limiter, RateLimitScope, RateLimitResult

logger = structlog.get_logger("rate_limit_decorator")


def rate_limit(
    scope: RateLimitScope,
    get_identifier: Optional[callable] = None,
    additional_context: Optional[callable] = None
):
    """
    Décorateur pour appliquer le rate limiting à un endpoint FastAPI
    
    Args:
        scope: Scope de rate limiting à appliquer
        get_identifier: Fonction pour extraire l'identifiant (par défaut: IP client)
        additional_context: Fonction pour ajouter du contexte à l'audit
    
    Usage:
        @rate_limit(RateLimitScope.AUTH_LOGIN)
        async def login_endpoint():
            pass
        
        @rate_limit(RateLimitScope.API_ENERGY, get_identifier=lambda req: req.state.user_id)
        async def energy_endpoint():
            pass
    """
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Trouver l'objet Request dans les arguments
            request = None
            response = None
            
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # Chercher dans kwargs
                request = kwargs.get('request')
            
            if not request:
                logger.error("Rate limit decorator: Request object not found")
                # Continuer sans rate limiting si pas de Request
                return await func(*args, **kwargs)
            
            try:
                # Extraire l'identifiant
                if get_identifier:
                    identifier = get_identifier(request)
                else:
                    # Par défaut: utiliser l'IP client
                    identifier = _get_client_ip(request)
                
                # Extraire le user agent
                user_agent = request.headers.get("user-agent", "")
                
                # Contexte additionnel
                context = {}
                if additional_context:
                    try:
                        context = additional_context(request)
                    except Exception as e:
                        logger.warning("Failed to get additional context", error=str(e))
                
                # Ajouter contexte technique
                context.update({
                    "endpoint": f"{request.method} {request.url.path}",
                    "client_ip": _get_client_ip(request),
                    "forwarded_for": request.headers.get("x-forwarded-for"),
                    "user_agent": user_agent
                })
                
                # Vérifier le rate limit
                result, limit_context = await rate_limiter.check_rate_limit(
                    identifier=identifier,
                    scope=scope,
                    user_agent=user_agent,
                    additional_context=context
                )
                
                # Gérer le résultat
                if result == RateLimitResult.BLOCKED:
                    return _create_rate_limit_response(429, "Identifiant temporairement bloqué", limit_context)
                elif result == RateLimitResult.LIMITED:
                    return _create_rate_limit_response(429, "Limite de taux dépassée", limit_context)
                
                # Requête autorisée - ajouter headers de rate limit
                response_obj = await func(*args, **kwargs)
                
                # Ajouter headers informatifs si c'est une réponse JSON
                if isinstance(response_obj, (JSONResponse, Response)):
                    _add_rate_limit_headers(response_obj, limit_context)
                
                return response_obj
                
            except Exception as e:
                logger.error("Rate limit check failed", scope=scope.value, error=str(e))
                # Fail open - continuer sans rate limiting en cas d'erreur
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def _get_client_ip(request: Request) -> str:
    """Extrait l'IP du client en tenant compte des proxies"""
    
    # Vérifier les headers de proxy courants
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Prendre la première IP (client original)
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    
    # Fallback vers l'IP de connexion
    if hasattr(request, "client") and request.client:
        return request.client.host
    
    return "unknown"


def _create_rate_limit_response(status_code: int, message: str, context: Dict[str, Any]) -> JSONResponse:
    """Crée une réponse HTTP de rate limiting standardisée"""
    
    content = {
        "error": {
            "code": "RATE_LIMIT_EXCEEDED",
            "message": message,
            "type": "rate_limiting"
        },
        "details": {
            "scope": context.get("scope", "unknown"),
            "strategy": context.get("strategy", "unknown"),
            "limit": context.get("limit"),
            "window_seconds": context.get("window_seconds"),
            "blocked_until": context.get("blocked_until"),
            "reset_at": context.get("reset_at")
        },
        "timestamp": "2025-08-27T11:00:00Z"
    }
    
    headers = {}
    
    # Headers standards de rate limiting (RFC 6585 + draft IETF)
    if "limit" in context:
        headers["X-RateLimit-Limit"] = str(context["limit"])
    
    if "current_count" in context:
        remaining = max(0, context.get("limit", 0) - context.get("current_count", 0))
        headers["X-RateLimit-Remaining"] = str(remaining)
    
    if "reset_at" in context:
        headers["X-RateLimit-Reset"] = context["reset_at"]
    
    if "window_seconds" in context:
        headers["X-RateLimit-Window"] = str(context["window_seconds"])
    
    # Header de retry (standard HTTP)
    if "blocked_until" in context:
        # Calculer les secondes jusqu'au déblocage
        try:
            from datetime import datetime, timezone
            blocked_until = datetime.fromisoformat(context["blocked_until"].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            retry_after_seconds = max(1, int((blocked_until - now).total_seconds()))
            headers["Retry-After"] = str(retry_after_seconds)
        except Exception:
            headers["Retry-After"] = "300"  # 5 minutes par défaut
    
    return JSONResponse(
        status_code=status_code,
        content=content,
        headers=headers
    )


def _add_rate_limit_headers(response: Union[Response, JSONResponse], context: Dict[str, Any]):
    """Ajoute les headers de rate limiting aux réponses réussies"""
    
    try:
        # Headers informatifs pour les requêtes autorisées
        if "limit" in context:
            response.headers["X-RateLimit-Limit"] = str(context["limit"])
        
        if "current_count" in context:
            remaining = max(0, context.get("limit", 0) - context.get("current_count", 0))
            response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        if "reset_at" in context:
            response.headers["X-RateLimit-Reset"] = context["reset_at"]
        
        if "window_seconds" in context:
            response.headers["X-RateLimit-Window"] = str(context["window_seconds"])
        
        # Header custom pour la stratégie utilisée
        if "strategy" in context:
            response.headers["X-RateLimit-Strategy"] = context["strategy"]
            
    except Exception as e:
        logger.warning("Failed to add rate limit headers", error=str(e))


# Décorateurs spécialisés pour endpoints courants
def auth_rate_limit(get_identifier: Optional[callable] = None):
    """Rate limiting pour les endpoints d'authentification"""
    return rate_limit(
        RateLimitScope.AUTH_LOGIN,
        get_identifier=get_identifier or (lambda req: _get_client_ip(req))
    )


def api_rate_limit(get_identifier: Optional[callable] = None):
    """Rate limiting pour les endpoints d'API générale"""
    return rate_limit(
        RateLimitScope.API_GENERAL,
        get_identifier=get_identifier or (lambda req: _get_client_ip(req))
    )


def energy_rate_limit(get_identifier: Optional[callable] = None):
    """Rate limiting pour les endpoints d'énergie"""
    return rate_limit(
        RateLimitScope.API_ENERGY,
        get_identifier=get_identifier or (lambda req: getattr(req.state, 'user_id', _get_client_ip(req)))
    )


def luna_chat_rate_limit(get_identifier: Optional[callable] = None):
    """Rate limiting pour les endpoints de chat Luna"""
    return rate_limit(
        RateLimitScope.API_LUNA_CHAT,
        get_identifier=get_identifier or (lambda req: getattr(req.state, 'user_id', _get_client_ip(req)))
    )


def cv_generation_rate_limit(get_identifier: Optional[callable] = None):
    """Rate limiting pour la génération de CV (coûteuse)"""
    return rate_limit(
        RateLimitScope.API_CV_GENERATION,
        get_identifier=get_identifier or (lambda req: getattr(req.state, 'user_id', _get_client_ip(req)))
    )