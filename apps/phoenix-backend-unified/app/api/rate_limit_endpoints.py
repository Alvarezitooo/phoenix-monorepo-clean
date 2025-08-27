"""
🛡️ Endpoints Rate Limiting - Phoenix Luna Hub
Administration et monitoring du système de rate limiting robuste
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Dict, Any, Optional
from app.core.security_guardian import ensure_request_is_clean
from app.core.rate_limiter import rate_limiter, RateLimitScope, RateLimitResult
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/admin/rate-limiting", tags=["Rate Limiting"])


@router.get("/health", dependencies=[Depends(ensure_request_is_clean)])
async def get_rate_limiter_health() -> Dict[str, Any]:
    """
    🏥 Health check du système de rate limiting
    Monitoring pour Grafana et alertes
    """
    
    try:
        metrics = rate_limiter.get_metrics()
        
        # Calculer le statut global
        redis_available = True  # TODO: Vérifier redis_cache.redis_available
        total_requests = metrics.get("total_requests", 0)
        
        status = "healthy"
        if metrics.get("redis_errors", 0) > total_requests * 0.1:  # >10% erreurs Redis
            status = "degraded"
        elif not redis_available:
            status = "fallback_only"
        
        return {
            "status": status,
            "redis_available": redis_available,
            "lua_scripts_loaded": rate_limiter.lua_scripts_loaded,
            "metrics": metrics,
            "rules_active": len([r for r in rate_limiter.RULES.values() if r.enabled]),
            "timestamp": "2025-08-27T11:00:00Z"
        }
        
    except Exception as e:
        logger.error("Rate limiter health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2025-08-27T11:00:00Z"
        }


@router.get("/metrics", dependencies=[Depends(ensure_request_is_clean)])
async def get_rate_limiting_metrics() -> Dict[str, Any]:
    """
    📊 Métriques détaillées du rate limiting
    Performance et statistiques pour monitoring
    """
    
    try:
        metrics = rate_limiter.get_metrics()
        
        # Ajouter informations sur les règles
        rules_info = {}
        for scope, rule in rate_limiter.RULES.items():
            rules_info[scope.value] = {
                "strategy": rule.strategy.value,
                "limit": rule.requests_per_window,
                "window_seconds": rule.window_seconds,
                "block_duration": rule.block_duration_seconds,
                "enabled": rule.enabled,
                "priority": rule.priority,
                "burst_size": rule.burst_size
            }
        
        return {
            "performance": metrics,
            "rules": rules_info,
            "system": {
                "redis_available": rate_limiter.lua_scripts_loaded,
                "total_scopes": len(rate_limiter.RULES),
                "active_rules": len([r for r in rate_limiter.RULES.values() if r.enabled])
            },
            "timestamp": "2025-08-27T11:00:00Z"
        }
        
    except Exception as e:
        logger.error("Failed to get rate limiting metrics", error=str(e))
        raise HTTPException(status_code=500, detail="Impossible d'obtenir les métriques")


@router.get("/status/{identifier}")
async def get_rate_limit_status(
    identifier: str,
    scope: str = Query(..., description="Scope de rate limiting (ex: auth_login)"),
    dependencies=[Depends(ensure_request_is_clean)]
) -> Dict[str, Any]:
    """
    📋 Statut de rate limiting pour un identifiant spécifique
    Diagnostic et debug des limites appliquées
    """
    
    try:
        # Valider le scope
        try:
            rate_scope = RateLimitScope(scope)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Scope invalide: {scope}")
        
        status = await rate_limiter.get_rate_limit_status(identifier, rate_scope)
        
        if "error" in status:
            raise HTTPException(status_code=404, detail=status["error"])
        
        return {
            "identifier": identifier[:8] + "***" if len(identifier) > 8 else identifier,
            "scope": scope,
            **status,
            "timestamp": "2025-08-27T11:00:00Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Rate limit status check failed", identifier=identifier[:8], scope=scope, error=str(e))
        raise HTTPException(status_code=500, detail="Échec vérification statut")


@router.post("/reset/{identifier}")
async def reset_rate_limit(
    identifier: str,
    scope: str = Query(..., description="Scope de rate limiting à réinitialiser"),
    dependencies=[Depends(ensure_request_is_clean)]
) -> Dict[str, Any]:
    """
    🔄 Réinitialise le rate limiting pour un identifiant
    Fonction d'administration pour débloquer un utilisateur
    """
    
    try:
        # Valider le scope
        try:
            rate_scope = RateLimitScope(scope)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Scope invalide: {scope}")
        
        success = await rate_limiter.reset_rate_limit(identifier, rate_scope)
        
        if success:
            logger.info("Rate limit reset by admin", identifier=identifier[:8], scope=scope)
            return {
                "success": True,
                "message": f"Rate limit réinitialisé pour {identifier[:8]}*** / {scope}",
                "timestamp": "2025-08-27T11:00:00Z"
            }
        else:
            raise HTTPException(status_code=500, detail="Échec réinitialisation rate limit")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Rate limit reset failed", identifier=identifier[:8], scope=scope, error=str(e))
        raise HTTPException(status_code=500, detail="Erreur lors de la réinitialisation")


@router.post("/test-check")
async def test_rate_limit_check(
    identifier: str = Query(..., description="Identifiant à tester"),
    scope: str = Query(..., description="Scope à tester"),
    user_agent: str = Query("test-client", description="User agent pour le test"),
    dependencies=[Depends(ensure_request_is_clean)]
) -> Dict[str, Any]:
    """
    🧪 Test du système de rate limiting
    Simule une vérification de rate limit sans enregistrer l'événement
    """
    
    try:
        # Valider le scope
        try:
            rate_scope = RateLimitScope(scope)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Scope invalide: {scope}")
        
        # Effectuer le test de rate limit
        result, context = await rate_limiter.check_rate_limit(
            identifier=identifier,
            scope=rate_scope,
            user_agent=user_agent,
            additional_context={"test": True, "admin_initiated": True}
        )
        
        return {
            "test_result": {
                "identifier": identifier[:8] + "***" if len(identifier) > 8 else identifier,
                "scope": scope,
                "result": result.value,
                "context": context
            },
            "interpretation": {
                "allowed": result == RateLimitResult.ALLOWED,
                "blocked": result == RateLimitResult.BLOCKED,
                "limited": result == RateLimitResult.LIMITED,
                "message": _interpret_result(result, context)
            },
            "timestamp": "2025-08-27T11:00:00Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Rate limit test failed", identifier=identifier[:8], scope=scope, error=str(e))
        raise HTTPException(status_code=500, detail="Échec du test de rate limiting")


@router.post("/cleanup")
async def cleanup_expired_blocks(dependencies=[Depends(ensure_request_is_clean)]) -> Dict[str, Any]:
    """
    🧹 Nettoie les enregistrements de blocage expirés
    Maintenance du système de rate limiting
    """
    
    try:
        cleaned_count = await rate_limiter.cleanup_expired_blocks()
        
        return {
            "success": True,
            "cleaned_records": cleaned_count,
            "message": f"Nettoyage terminé - {cleaned_count} enregistrements supprimés",
            "timestamp": "2025-08-27T11:00:00Z"
        }
        
    except Exception as e:
        logger.error("Cleanup failed", error=str(e))
        raise HTTPException(status_code=500, detail="Échec du nettoyage")


@router.get("/rules")
async def get_rate_limiting_rules(dependencies=[Depends(ensure_request_is_clean)]) -> Dict[str, Any]:
    """
    📋 Liste toutes les règles de rate limiting configurées
    Configuration et paramètres actuels
    """
    
    try:
        rules = {}
        for scope, rule in rate_limiter.RULES.items():
            rules[scope.value] = {
                "strategy": rule.strategy.value,
                "requests_per_window": rule.requests_per_window,
                "window_seconds": rule.window_seconds,
                "block_duration_seconds": rule.block_duration_seconds,
                "burst_size": rule.burst_size,
                "enabled": rule.enabled,
                "priority": rule.priority,
                "description": _get_rule_description(scope, rule)
            }
        
        return {
            "rules": rules,
            "summary": {
                "total_rules": len(rules),
                "active_rules": len([r for r in rate_limiter.RULES.values() if r.enabled]),
                "strategies": list(set(r.strategy.value for r in rate_limiter.RULES.values()))
            },
            "timestamp": "2025-08-27T11:00:00Z"
        }
        
    except Exception as e:
        logger.error("Failed to get rate limiting rules", error=str(e))
        raise HTTPException(status_code=500, detail="Impossible d'obtenir les règles")


def _interpret_result(result: RateLimitResult, context: Dict[str, Any]) -> str:
    """Interprète le résultat de rate limiting en français"""
    
    if result == RateLimitResult.ALLOWED:
        return "Requête autorisée - limite non atteinte"
    elif result == RateLimitResult.LIMITED:
        return f"Requête limitée - seuil dépassé, bloqué jusqu'à {context.get('blocked_until', 'inconnu')}"
    elif result == RateLimitResult.BLOCKED:
        return f"Identifiant bloqué jusqu'à {context.get('blocked_until', 'inconnu')}"
    else:
        return "Résultat inconnu"


def _get_rule_description(scope: RateLimitScope, rule) -> str:
    """Génère une description lisible de la règle"""
    
    descriptions = {
        RateLimitScope.AUTH_LOGIN: "Tentatives de connexion",
        RateLimitScope.AUTH_REGISTER: "Créations de comptes", 
        RateLimitScope.PASSWORD_RESET: "Réinitialisations de mot de passe",
        RateLimitScope.API_GENERAL: "Requêtes API générales",
        RateLimitScope.API_ENERGY: "API de gestion d'énergie",
        RateLimitScope.API_CV_GENERATION: "Génération de CV (coûteuse)",
        RateLimitScope.API_LUNA_CHAT: "Chat avec Luna",
        RateLimitScope.GLOBAL_DDOS: "Protection DDoS globale",
        RateLimitScope.IP_GENERAL: "Limite par IP"
    }
    
    base = descriptions.get(scope, scope.value)
    strategy = rule.strategy.value.replace("_", " ")
    return f"{base} - {rule.requests_per_window} req/{rule.window_seconds}s ({strategy})"