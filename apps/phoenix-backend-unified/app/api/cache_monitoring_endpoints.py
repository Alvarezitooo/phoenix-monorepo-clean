"""
🗄️ Cache Monitoring Endpoints - Phoenix Luna Hub
Monitoring et administration du cache Redis
"""

from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, Optional
from app.core.security_guardian import ensure_request_is_clean
from app.core.energy_manager import energy_manager
from app.core.redis_cache import redis_cache, initialize_redis_cache
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/monitoring/cache", tags=["Cache Monitoring"])


@router.get("/health", dependencies=[Depends(ensure_request_is_clean)])
async def get_cache_health() -> Dict[str, Any]:
    """
    🏥 Health check du système de cache Redis
    Utilisé par Grafana et monitoring externe
    """
    
    try:
        health = await energy_manager.get_cache_health()
        
        return {
            "timestamp": "2025-08-27T11:00:00Z",
            "service": "phoenix-luna-hub",
            "cache_system": "redis",
            **health
        }
        
    except Exception as e:
        logger.error("Cache health check failed", error=str(e))
        return {
            "status": "error",
            "message": "Health check failed",
            "error": str(e),
            "timestamp": "2025-08-27T11:00:00Z"
        }


@router.get("/stats", dependencies=[Depends(ensure_request_is_clean)])
async def get_cache_statistics() -> Dict[str, Any]:
    """
    📊 Statistiques complètes du cache Redis
    Performance metrics pour monitoring
    """
    
    try:
        stats = await energy_manager.get_cache_stats()
        
        return {
            "timestamp": "2025-08-27T11:00:00Z",
            "service": "phoenix-luna-hub",
            "cache_system": "redis",
            **stats,
            "recommendations": _get_cache_recommendations(stats)
        }
        
    except Exception as e:
        logger.error("Failed to get cache statistics", error=str(e))
        return {
            "error": "Failed to retrieve cache statistics",
            "timestamp": "2025-08-27T11:00:00Z"
        }


@router.post("/invalidate/{user_id}", dependencies=[Depends(ensure_request_is_clean)])
async def invalidate_user_cache(user_id: str) -> Dict[str, Any]:
    """
    🧹 Invalide le cache d'un utilisateur spécifique
    Utile pour debug ou après changement de subscription
    """
    
    try:
        success = await energy_manager.clear_user_cache(user_id)
        
        if success:
            logger.info("User cache invalidated successfully", user_id=user_id)
            return {
                "success": True,
                "message": f"Cache invalidated for user {user_id[:8]}***",
                "timestamp": "2025-08-27T11:00:00Z"
            }
        else:
            return {
                "success": False,
                "message": "Cache invalidation failed",
                "timestamp": "2025-08-27T11:00:00Z"
            }
            
    except Exception as e:
        logger.error("Cache invalidation error", user_id=user_id, error=str(e))
        return {
            "success": False,
            "error": str(e),
            "timestamp": "2025-08-27T11:00:00Z"
        }


@router.get("/test-performance")
async def test_cache_performance(
    user_id: str = Query(..., description="User ID for performance test"),
    iterations: int = Query(5, ge=1, le=20, description="Number of test iterations")
) -> Dict[str, Any]:
    """
    ⚡ Test de performance du cache
    Compare les temps avec et sans cache
    """
    
    try:
        import time
        
        # Test sans cache (invalidation d'abord)
        await energy_manager.clear_user_cache(user_id)
        
        # Premier appel (pas de cache)
        start_time = time.time()
        stats_first = await energy_manager.get_user_energy_stats(user_id)
        first_call_duration = time.time() - start_time
        
        # Appels suivants (avec cache)
        cached_durations = []
        for _ in range(iterations):
            start_time = time.time()
            stats_cached = await energy_manager.get_user_energy_stats(user_id)
            cached_durations.append(time.time() - start_time)
        
        avg_cached_duration = sum(cached_durations) / len(cached_durations)
        speedup = first_call_duration / avg_cached_duration if avg_cached_duration > 0 else float('inf')
        
        return {
            "performance_test": {
                "user_id": user_id[:8] + "***",
                "first_call_ms": round(first_call_duration * 1000, 2),
                "avg_cached_call_ms": round(avg_cached_duration * 1000, 2),
                "speedup": round(speedup, 2),
                "iterations": iterations,
                "cache_efficiency": "excellent" if speedup > 5 else "good" if speedup > 2 else "poor"
            },
            "timestamp": "2025-08-27T11:00:00Z"
        }
        
    except Exception as e:
        logger.error("Cache performance test failed", error=str(e))
        return {
            "error": "Performance test failed",
            "details": str(e),
            "timestamp": "2025-08-27T11:00:00Z"
        }


@router.post("/initialize", dependencies=[Depends(ensure_request_is_clean)])
async def initialize_cache_system() -> Dict[str, Any]:
    """
    🔧 Initialise ou réinitialise la connexion Redis
    Admin endpoint pour maintenance
    """
    
    try:
        success = await initialize_redis_cache()
        
        if success:
            return {
                "success": True,
                "message": "Redis cache initialized successfully",
                "redis_available": True,
                "timestamp": "2025-08-27T11:00:00Z"
            }
        else:
            return {
                "success": False,
                "message": "Failed to initialize Redis, using fallback cache",
                "redis_available": False,
                "timestamp": "2025-08-27T11:00:00Z"
            }
            
    except Exception as e:
        logger.error("Cache initialization failed", error=str(e))
        return {
            "success": False,
            "error": str(e),
            "timestamp": "2025-08-27T11:00:00Z"
        }


def _get_cache_recommendations(stats: Dict[str, Any]) -> list[str]:
    """💡 Recommandations d'optimisation basées sur les stats"""
    
    recommendations = []
    
    # Hit rate analysis
    hit_rate = stats.get("hit_rate_pct", 0)
    if hit_rate < 60:
        recommendations.append(f"Low cache hit rate ({hit_rate}%) - consider increasing TTL values")
    elif hit_rate < 80:
        recommendations.append(f"Moderate cache hit rate ({hit_rate}%) - monitor cache patterns")
    else:
        recommendations.append(f"Good cache hit rate ({hit_rate}%) - cache working efficiently")
    
    # Error rate analysis
    errors = stats.get("errors", 0)
    total_requests = stats.get("total_requests", 1)
    error_rate = (errors / total_requests * 100) if total_requests > 0 else 0
    
    if error_rate > 5:
        recommendations.append(f"High cache error rate ({error_rate:.1f}%) - check Redis connectivity")
    elif error_rate > 1:
        recommendations.append(f"Moderate cache error rate ({error_rate:.1f}%) - monitor Redis health")
    
    # Fallback usage
    fallback_uses = stats.get("fallback_uses", 0)
    if fallback_uses > total_requests * 0.1:
        recommendations.append("High fallback cache usage - Redis may be unstable")
    
    # Redis memory
    redis_memory = stats.get("redis_memory_mb", 0)
    if redis_memory > 100:
        recommendations.append(f"High Redis memory usage ({redis_memory}MB) - consider cache cleanup")
    
    # Redis availability
    if not stats.get("redis_available", False):
        recommendations.append("Redis unavailable - using fallback memory cache only")
    
    if not recommendations:
        recommendations.append("Cache performance is optimal")
    
    return recommendations