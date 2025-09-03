"""
📊 Connection Monitoring Endpoints - Phoenix Luna Hub
Monitoring du connection pooling et circuit breaker
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.core.connection_manager import connection_manager
from app.core.security_guardian import ensure_request_is_clean
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/monitoring/connections", tags=["Connection Monitoring"])


@router.get("/pool-stats", dependencies=[Depends(ensure_request_is_clean)])
async def get_connection_pool_stats() -> Dict[str, Any]:
    """
    📊 Statistiques complètes du pool de connexions
    Pour monitoring Grafana et debugging
    """
    
    try:
        stats = connection_manager.get_pool_stats()
        
        return {
            "timestamp": "2025-08-27T10:55:00Z",
            "service": "phoenix-luna-hub", 
            **stats,
            "recommendations": _get_performance_recommendations(stats)
        }
        
    except Exception as e:
        logger.error("Failed to get connection pool stats", error=str(e))
        return {
            "error": "Failed to retrieve connection pool statistics",
            "timestamp": "2025-08-27T10:55:00Z"
        }


@router.get("/health", dependencies=[Depends(ensure_request_is_clean)])
async def get_connection_health() -> Dict[str, Any]:
    """
    🏥 Health check des connexions pour monitoring externe
    """
    
    try:
        health = await connection_manager.health_check()
        
        return {
            "status": "healthy" if health["healthy"] else "unhealthy",
            "timestamp": "2025-08-27T10:55:00Z",
            **health,
            "service": "phoenix-luna-hub"
        }
        
    except Exception as e:
        logger.error("Connection health check failed", error=str(e))
        return {
            "status": "error",
            "message": "Health check failed",
            "error": str(e),
            "timestamp": "2025-08-27T10:55:00Z"
        }


@router.get("/circuit-breaker", dependencies=[Depends(ensure_request_is_clean)])
async def get_circuit_breaker_status() -> Dict[str, Any]:
    """
    ⚡ Status détaillé du circuit breaker
    """
    
    try:
        stats = connection_manager.get_pool_stats()
        pool_state = stats["pool_state"]
        statistics = stats["statistics"]
        
        return {
            "circuit_breaker_state": pool_state["circuit_breaker_state"],
            "failure_count": pool_state["circuit_failure_count"],
            "total_trips": statistics["circuit_breaker_trips"],
            "success_rate_pct": statistics["success_rate_pct"],
            "is_healthy": pool_state["circuit_breaker_state"] != "open",
            "last_error": statistics["last_error"],
            "recommendations": _get_circuit_breaker_recommendations(
                pool_state["circuit_breaker_state"],
                statistics["success_rate_pct"]
            ),
            "timestamp": "2025-08-27T10:55:00Z"
        }
        
    except Exception as e:
        logger.error("Failed to get circuit breaker status", error=str(e))
        return {
            "error": "Failed to retrieve circuit breaker status",
            "timestamp": "2025-08-27T10:55:00Z"
        }


def _get_performance_recommendations(stats: Dict[str, Any]) -> List[str]:
    """💡 Recommandations de performance basées sur les stats"""
    
    recommendations = []
    statistics = stats.get("statistics", {})
    pool_state = stats.get("pool_state", {})
    
    # Success rate
    success_rate = statistics.get("success_rate_pct", 100)
    if success_rate < 95:
        recommendations.append(f"Success rate is low ({success_rate}%) - investigate network issues")
    
    # Response time
    avg_response_time = statistics.get("avg_response_time_ms", 0)
    if avg_response_time > 1000:
        recommendations.append(f"High response time ({avg_response_time}ms) - consider connection optimization")
    elif avg_response_time > 500:
        recommendations.append(f"Moderate response time ({avg_response_time}ms) - monitor database performance")
    
    # Circuit breaker
    if pool_state.get("circuit_breaker_state") == "open":
        recommendations.append("Circuit breaker is OPEN - service degraded, check database connectivity")
    elif statistics.get("circuit_breaker_trips", 0) > 0:
        recommendations.append("Circuit breaker has tripped before - monitor stability")
    
    # Connection usage
    active_connections = pool_state.get("active_connections", 0)
    max_connections = stats.get("pool_config", {}).get("max_connections", 10)
    
    if active_connections >= max_connections * 0.8:
        recommendations.append(f"High connection usage ({active_connections}/{max_connections}) - consider increasing pool size")
    
    if not recommendations:
        recommendations.append("Connection pool performance is optimal")
    
    return recommendations


def _get_circuit_breaker_recommendations(state: str, success_rate: float) -> List[str]:
    """⚡ Recommandations spécifiques au circuit breaker"""
    
    recommendations = []
    
    if state == "open":
        recommendations.extend([
            "Circuit breaker is OPEN - all requests are being blocked",
            "Check database connectivity and network issues",
            "Wait for automatic recovery or restart service if needed"
        ])
    elif state == "half_open":
        recommendations.extend([
            "Circuit breaker is testing recovery - monitor closely",
            "Next request will determine if circuit closes"
        ])
    elif success_rate < 90:
        recommendations.append("Success rate is low - circuit breaker may trip soon")
    else:
        recommendations.append("Circuit breaker is healthy")
    
    return recommendations