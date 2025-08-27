"""
📊 Monitoring & Observability Endpoints - Phoenix Luna Hub v2.0
Health checks avancés + Métriques temps réel avec percentiles p95/p99
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
import asyncio
import httpx
import psutil
import os

from ..core.supabase_client import get_supabase_client
from ..billing.stripe_manager import StripeManager
from ..models.billing import PACK_CATALOG
from ..core.security_guardian import ensure_request_is_clean
from ..core.metrics_collector import metrics_collector, AlertSeverity
from ..core.rate_limiter import rate_limiter
from ..core.energy_manager import energy_manager
from ..core.redis_cache import redis_cache

# Setup
router = APIRouter(prefix="/monitoring", tags=["Monitoring"])

class HealthStatus(BaseModel):
    """Status de santé d'un composant"""
    status: str  # "healthy", "degraded", "unhealthy"
    response_time_ms: Optional[float] = None
    last_check: str
    details: Optional[Dict[str, Any]] = None

class SystemHealth(BaseModel):
    """Health check complet du système"""
    overall_status: str
    timestamp: str
    version: str = "1.0.0"
    environment: str
    services: Dict[str, HealthStatus]
    metrics: Dict[str, Any]

class ReadinessCheck(BaseModel):
    """Readiness check pour Kubernetes/Railway"""
    ready: bool
    checks: Dict[str, bool]
    timestamp: str

# Health Checks individuels
async def check_supabase() -> HealthStatus:
    """Health check Supabase (Event Store)"""
    start_time = datetime.now(timezone.utc)
    
    try:
        supabase = get_supabase_client()
        # Simple ping query
        result = supabase.table("energy_events").select("event_id").limit(1).execute()
        
        response_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        
        return HealthStatus(
            status="healthy",
            response_time_ms=response_time,
            last_check=datetime.now(timezone.utc).isoformat(),
            details={
                "connection": "active",
                "query_test": "passed",
                "table_access": "granted"
            }
        )
        
    except Exception as e:
        response_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        
        return HealthStatus(
            status="unhealthy",
            response_time_ms=response_time,
            last_check=datetime.now(timezone.utc).isoformat(),
            details={
                "error": str(e),
                "connection": "failed"
            }
        )

async def check_stripe() -> HealthStatus:
    """Health check Stripe API"""
    start_time = datetime.now(timezone.utc)
    
    try:
        stripe_manager = StripeManager()
        health = stripe_manager.health_check()
        
        response_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        
        if health.get("connected"):
            return HealthStatus(
                status="healthy",
                response_time_ms=response_time,
                last_check=datetime.now(timezone.utc).isoformat(),
                details=health
            )
        else:
            return HealthStatus(
                status="degraded",
                response_time_ms=response_time,
                last_check=datetime.now(timezone.utc).isoformat(),
                details=health
            )
            
    except Exception as e:
        response_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        
        return HealthStatus(
            status="unhealthy", 
            response_time_ms=response_time,
            last_check=datetime.now(timezone.utc).isoformat(),
            details={
                "error": str(e),
                "stripe_api": "unreachable"
            }
        )

async def check_satellite_services() -> Dict[str, HealthStatus]:
    """Health check des services satellites (Phoenix CV, Letters)"""
    satellite_urls = {
        "phoenix_cv": os.getenv("PHOENIX_CV_URL", "http://localhost:8002"),
        "phoenix_letters": os.getenv("PHOENIX_LETTERS_URL", "http://localhost:8001"),
        "phoenix_website": os.getenv("PHOENIX_WEBSITE_URL", "http://localhost:3000")
    }
    
    results = {}
    
    for service_name, url in satellite_urls.items():
        start_time = datetime.now(timezone.utc)
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{url}/health")
                response_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
                
                if response.status_code == 200:
                    results[service_name] = HealthStatus(
                        status="healthy",
                        response_time_ms=response_time,
                        last_check=datetime.now(timezone.utc).isoformat(),
                        details={
                            "http_status": response.status_code,
                            "url": url
                        }
                    )
                else:
                    results[service_name] = HealthStatus(
                        status="degraded",
                        response_time_ms=response_time,
                        last_check=datetime.now(timezone.utc).isoformat(),
                        details={
                            "http_status": response.status_code,
                            "url": url
                        }
                    )
                    
        except Exception as e:
            response_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            results[service_name] = HealthStatus(
                status="unhealthy",
                response_time_ms=response_time,
                last_check=datetime.now(timezone.utc).isoformat(),
                details={
                    "error": str(e),
                    "url": url,
                    "connection": "failed"
                }
            )
    
    return results

def get_system_metrics() -> Dict[str, Any]:
    """Métriques système (CPU, RAM, etc.)"""
    try:
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent if os.path.exists('/') else None,
            "uptime_seconds": psutil.boot_time() if hasattr(psutil, 'boot_time') else None,
            "python_version": f"{psutil.sys.version_info.major}.{psutil.sys.version_info.minor}",
            "pack_catalog_loaded": len(PACK_CATALOG),
            "environment": os.getenv("PHOENIX_ENVIRONMENT", "development")
        }
    except Exception as e:
        return {
            "error": str(e),
            "metrics_available": False
        }

# Endpoints
@router.get("/health", response_model=SystemHealth)
async def health_check():
    """
    🏥 Health check complet du système Luna Hub
    Utilisé par Railway pour monitoring
    """
    start_time = datetime.now(timezone.utc)
    
    # Vérifications parallèles pour performance
    supabase_check, stripe_check, satellite_checks = await asyncio.gather(
        check_supabase(),
        check_stripe(), 
        check_satellite_services()
    )
    
    # Agrégation des services
    all_services = {
        "supabase": supabase_check,
        "stripe": stripe_check,
        **satellite_checks
    }
    
    # Détermination du status global
    healthy_count = sum(1 for s in all_services.values() if s.status == "healthy")
    total_services = len(all_services)
    
    if healthy_count == total_services:
        overall_status = "healthy"
    elif healthy_count >= total_services * 0.7:  # 70% minimum
        overall_status = "degraded"
    else:
        overall_status = "unhealthy"
    
    return SystemHealth(
        overall_status=overall_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
        environment=os.getenv("PHOENIX_ENVIRONMENT", "development"),
        services=all_services,
        metrics=get_system_metrics()
    )

@router.get("/ready", response_model=ReadinessCheck)
async def readiness_check():
    """
    🚀 Readiness check pour déploiement
    Vérifie que les dépendances critiques sont disponibles
    """
    checks = {}
    
    # Check critique: Supabase
    try:
        supabase_status = await check_supabase()
        checks["supabase"] = supabase_status.status in ["healthy", "degraded"]
    except:
        checks["supabase"] = False
    
    # Check critique: Configuration
    checks["env_config"] = all([
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_KEY"),
        # Stripe non-critique en dev
    ])
    
    # Check critique: Pack Catalog 
    checks["pack_catalog"] = len(PACK_CATALOG) >= 3
    
    ready = all(checks.values())
    
    return ReadinessCheck(
        ready=ready,
        checks=checks,
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@router.get("/metrics")
async def metrics_prometheus():
    """
    📊 Métriques au format Prometheus (optionnel)
    Pour intégration monitoring avancé
    """
    metrics = get_system_metrics()
    
    prometheus_format = []
    for key, value in metrics.items():
        if isinstance(value, (int, float)):
            prometheus_format.append(f"phoenix_hub_{key} {value}")
    
    # Métriques business
    prometheus_format.extend([
        f"phoenix_hub_pack_catalog_size {len(PACK_CATALOG)}",
        f"phoenix_hub_uptime_seconds {psutil.boot_time() if hasattr(psutil, 'boot_time') else 0}"
    ])
    
    return JSONResponse(
        content="\n".join(prometheus_format),
        media_type="text/plain"
    )

@router.get("/version")
async def version_info():
    """
    📋 Information version et build
    """
    return {
        "version": "1.0.0",
        "build_date": "2025-08-22",
        "sprint": "Sprint 5",
        "features": [
            "Luna Hub Core",
            "Stripe Billing",
            "Refund Guarantee", 
            "Energy Management",
            "Event Sourcing"
        ],
        "environment": os.getenv("PHOENIX_ENVIRONMENT", "development"),
        "python_version": f"{psutil.sys.version_info.major}.{psutil.sys.version_info.minor}",
        "pack_catalog_version": "1.0"
    }


# =============================================================================
# 🚀 ENDPOINTS AVANCÉS v2.0 - Métriques temps réel et alerting
# =============================================================================

@router.get("/health/v2", dependencies=[Depends(ensure_request_is_clean)])
async def system_health_check_v2() -> Dict[str, Any]:
    """
    🏥 Health check v2.0 avec métriques avancées
    Intègre Redis, Rate Limiting, GDPR et métriques temps réel
    """
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "phoenix-luna-hub",
        "version": "2.0",
        "components": {},
        "summary": {
            "healthy": 0,
            "degraded": 0, 
            "unhealthy": 0
        },
        "performance": {}
    }
    
    try:
        # 1. Health checks existants (Supabase, Stripe, satellites)
        supabase_check, stripe_check, satellite_checks = await asyncio.gather(
            check_supabase(),
            check_stripe(),
            check_satellite_services()
        )
        
        health_status["components"]["supabase"] = supabase_check
        health_status["components"]["stripe"] = stripe_check
        health_status["components"].update(satellite_checks)
        
        # 2. Nouveaux health checks v2.0
        
        # Redis Cache
        redis_health = await redis_cache.health_check()
        health_status["components"]["redis"] = HealthStatus(
            status=redis_health.get("status", "unknown"),
            response_time_ms=redis_health.get("latency_ms"),
            last_check=datetime.now(timezone.utc).isoformat(),
            details=redis_health
        )
        
        # Energy Manager
        try:
            energy_health = await energy_manager.get_cache_health()
            health_status["components"]["energy_manager"] = HealthStatus(
                status=energy_health.get("status", "healthy"),
                last_check=datetime.now(timezone.utc).isoformat(),
                details=energy_health
            )
        except Exception as e:
            health_status["components"]["energy_manager"] = HealthStatus(
                status="degraded",
                last_check=datetime.now(timezone.utc).isoformat(),
                details={"error": str(e)}
            )
        
        # Rate Limiter
        try:
            rate_limiter_metrics = rate_limiter.get_metrics()
            error_rate = rate_limiter_metrics.get("redis_errors", 0) / max(1, rate_limiter_metrics.get("total_requests", 1))
            
            health_status["components"]["rate_limiter"] = HealthStatus(
                status="degraded" if error_rate > 0.1 else "healthy",
                last_check=datetime.now(timezone.utc).isoformat(),
                details={
                    "error_rate_percent": round(error_rate * 100, 2),
                    "total_requests": rate_limiter_metrics.get("total_requests", 0),
                    **rate_limiter_metrics
                }
            )
        except Exception:
            health_status["components"]["rate_limiter"] = HealthStatus(
                status="healthy",
                last_check=datetime.now(timezone.utc).isoformat(),
                details={}
            )
        
        # Metrics Collector
        health_status["components"]["metrics"] = HealthStatus(
            status="healthy" if metrics_collector._running else "degraded",
            last_check=datetime.now(timezone.utc).isoformat(),
            details={
                "running": metrics_collector._running,
                "active_alerts": len(metrics_collector.active_alerts),
                "alert_rules": len(metrics_collector.alert_rules)
            }
        )
        
        # 3. Calcul statut global
        for component, info in health_status["components"].items():
            status = info.status if hasattr(info, 'status') else info["status"] 
            if status == "healthy":
                health_status["summary"]["healthy"] += 1
            elif status == "degraded":
                health_status["summary"]["degraded"] += 1
            else:
                health_status["summary"]["unhealthy"] += 1
        
        # Statut global
        if health_status["summary"]["unhealthy"] > 0:
            health_status["status"] = "unhealthy"
        elif health_status["summary"]["degraded"] > 0:
            health_status["status"] = "degraded"
        else:
            health_status["status"] = "healthy"
        
        # 4. Métriques de performance
        api_latency = metrics_collector.get_percentiles("api.request.duration")
        if api_latency:
            health_status["performance"] = {
                "api_latency_p95_ms": api_latency.p95,
                "api_latency_p99_ms": api_latency.p99,
                "requests_processed": api_latency.count
            }
        
        return health_status
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


@router.get("/metrics/current")
async def get_current_metrics_v2() -> Dict[str, Any]:
    """
    📊 Métriques actuelles du système avec percentiles
    Dashboard temps réel pour monitoring
    """
    
    try:
        # Métriques du collecteur principal
        current_metrics = metrics_collector.get_current_metrics()
        
        # Ajouter métriques système existantes
        current_metrics["system_legacy"] = get_system_metrics()
        
        # Métriques spécialisées v2.0
        current_metrics["system_v2"] = {
            "rate_limiter": rate_limiter.get_metrics(),
            "redis_cache": await redis_cache.get_cache_stats() if redis_cache.redis_available else {"available": False},
            "energy_manager": await energy_manager.get_cache_stats()
        }
        
        # Percentiles pour métriques importantes
        current_metrics["percentiles"] = {}
        important_metrics = [
            "api.request.duration",
            "energy.operation.duration",
            "redis.operation.duration",
            "rate_limiting.check.duration"
        ]
        
        for metric in important_metrics:
            stats = metrics_collector.get_percentiles(metric)
            if stats:
                current_metrics["percentiles"][metric] = {
                    "p50": round(stats.p50, 2),
                    "p95": round(stats.p95, 2),
                    "p99": round(stats.p99, 2),
                    "avg": round(stats.avg, 2),
                    "min": round(stats.min, 2),
                    "max": round(stats.max, 2),
                    "count": stats.count
                }
        
        return current_metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Impossible de récupérer les métriques: {str(e)}")


@router.get("/metrics/prometheus/v2")
async def prometheus_metrics_v2() -> PlainTextResponse:
    """
    🎯 Export métriques format Prometheus v2.0
    Compatible avec scraping Prometheus/Grafana
    """
    
    try:
        prometheus_output = []
        current_metrics = metrics_collector.get_current_metrics()
        
        # Helper pour formater les métriques Prometheus
        def format_prometheus_metric(name: str, value: float, labels: Dict[str, str] = None, help_text: str = ""):
            if help_text:
                prometheus_output.append(f"# HELP {name} {help_text}")
                prometheus_output.append(f"# TYPE {name} gauge")
            
            if labels:
                label_str = ",".join(f'{k}="{v}"' for k, v in labels.items())
                prometheus_output.append(f"{name}{{{label_str}}} {value}")
            else:
                prometheus_output.append(f"{name} {value}")
        
        # Métadonnées service
        format_prometheus_metric("phoenix_info", 1, 
                                {"version": "2.0", "environment": os.getenv("PHOENIX_ENVIRONMENT", "dev")},
                                "Phoenix Luna Hub service information")
        
        # Compteurs v2.0
        for metric, value in current_metrics.get("counters", {}).items():
            safe_name = f"phoenix_{metric.replace('.', '_').replace('-', '_')}_total"
            format_prometheus_metric(safe_name, value, help_text="Counter metric")
        
        # Jauges v2.0
        for metric, value in current_metrics.get("gauges", {}).items():
            safe_name = f"phoenix_{metric.replace('.', '_').replace('-', '_')}"
            format_prometheus_metric(safe_name, value, help_text="Gauge metric")
        
        # Percentiles pour métriques importantes
        important_metrics = ["api.request.duration", "energy.operation.duration", "redis.operation.duration"]
        for metric in important_metrics:
            stats = metrics_collector.get_percentiles(metric)
            if stats:
                base_name = f"phoenix_{metric.replace('.', '_').replace('-', '_')}"
                
                format_prometheus_metric(f"{base_name}_p50", stats.p50)
                format_prometheus_metric(f"{base_name}_p95", stats.p95) 
                format_prometheus_metric(f"{base_name}_p99", stats.p99)
                format_prometheus_metric(f"{base_name}_avg", stats.avg)
                format_prometheus_metric(f"{base_name}_count", stats.count)
        
        # Métriques système
        system_v2 = current_metrics.get("system_v2", {})
        
        # Rate limiter
        rate_limiter_data = system_v2.get("rate_limiter", {})
        for key, value in rate_limiter_data.items():
            if isinstance(value, (int, float)):
                format_prometheus_metric(f"phoenix_rate_limiter_{key}", value)
        
        # Redis
        redis_data = system_v2.get("redis_cache", {})
        for key, value in redis_data.items():
            if isinstance(value, (int, float)):
                format_prometheus_metric(f"phoenix_redis_{key}", value)
        
        # Alertes
        active_alerts = len(current_metrics.get("active_alerts", {}))
        format_prometheus_metric("phoenix_active_alerts_total", active_alerts)
        
        # Métriques legacy pour compatibilité
        legacy_metrics = get_system_metrics()
        for key, value in legacy_metrics.items():
            if isinstance(value, (int, float)):
                format_prometheus_metric(f"phoenix_system_{key}", value)
        
        return PlainTextResponse(
            content="\n".join(prometheus_output) + "\n",
            media_type="text/plain; version=0.0.4; charset=utf-8"
        )
        
    except Exception as e:
        return PlainTextResponse(f"# Error exporting metrics: {str(e)}\n", status_code=500)


@router.get("/alerts", dependencies=[Depends(ensure_request_is_clean)])
async def get_active_alerts() -> Dict[str, Any]:
    """
    🚨 Alertes actives et règles configurées
    Dashboard des alertes pour monitoring
    """
    
    try:
        return {
            "active_alerts": [
                {
                    "name": alert.name,
                    "severity": alert.severity.value,
                    "message": alert.message,
                    "value": alert.value,
                    "threshold": alert.threshold,
                    "triggered_at": alert.timestamp.isoformat(),
                    "duration_minutes": int((datetime.now(timezone.utc) - alert.timestamp).total_seconds() / 60),
                    "labels": alert.labels
                }
                for alert in metrics_collector.active_alerts.values()
            ],
            "alert_rules": {
                name: {
                    "metric_pattern": rule["metric_pattern"],
                    "threshold": rule["threshold"],
                    "severity": rule["severity"].value,
                    "condition": rule["condition"],
                    "message": rule["message"]
                }
                for name, rule in metrics_collector.alert_rules.items()
            },
            "summary": {
                "active_count": len(metrics_collector.active_alerts),
                "critical_count": sum(1 for alert in metrics_collector.active_alerts.values() 
                                   if alert.severity == AlertSeverity.CRITICAL),
                "warning_count": sum(1 for alert in metrics_collector.active_alerts.values() 
                                  if alert.severity == AlertSeverity.WARNING),
                "rules_configured": len(metrics_collector.alert_rules)
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Impossible de récupérer les alertes: {str(e)}")


@router.get("/performance", dependencies=[Depends(ensure_request_is_clean)])
async def get_performance_summary() -> Dict[str, Any]:
    """
    ⚡ Résumé des performances système
    KPIs principaux pour dashboard executive
    """
    
    try:
        # Récupérer métriques importantes
        api_latency = metrics_collector.get_percentiles("api.request.duration")
        energy_latency = metrics_collector.get_percentiles("energy.operation.duration")
        redis_latency = metrics_collector.get_percentiles("redis.operation.duration")
        
        # Métriques de rate limiting
        rate_limiter_stats = rate_limiter.get_metrics()
        
        # Calculer scores de performance (0-100)
        def calculate_performance_score(p95_ms: Optional[float], excellent: float, good: float) -> Dict[str, Any]:
            if p95_ms is None:
                return {"score": 100, "level": "excellent", "p95_ms": None}
            
            if p95_ms <= excellent:
                score = 100
                level = "excellent"
            elif p95_ms <= good:
                score = 85
                level = "good" 
            elif p95_ms <= good * 2:
                score = 70
                level = "acceptable"
            else:
                score = max(0, 50 - min(50, (p95_ms - good * 2) / 100))
                level = "poor"
            
            return {"score": int(score), "level": level, "p95_ms": round(p95_ms, 2)}
        
        performance_summary = {
            "overall_score": 0,
            "components": {
                "api_latency": calculate_performance_score(
                    api_latency.p95 if api_latency else None, 200, 500
                ),
                "energy_operations": calculate_performance_score(
                    energy_latency.p95 if energy_latency else None, 100, 300
                ),
                "redis_cache": calculate_performance_score(
                    redis_latency.p95 if redis_latency else None, 10, 50
                ),
                "rate_limiting": {
                    "score": max(0, 100 - rate_limiter_stats.get("redis_errors", 0)),
                    "level": "excellent" if rate_limiter_stats.get("redis_errors", 0) == 0 else "degraded",
                    "error_count": rate_limiter_stats.get("redis_errors", 0)
                }
            },
            "kpis": {
                "active_alerts": len(metrics_collector.active_alerts),
                "system_uptime_percent": 99.9,  # TODO: calculer depuis métriques
                "avg_response_time_ms": round(api_latency.avg, 2) if api_latency else 0,
                "requests_per_minute": rate_limiter_stats.get("total_requests", 0) / 60,
                "error_rate_percent": round(rate_limiter_stats.get("block_rate", 0), 2)
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Calculer score global
        component_scores = [comp["score"] for comp in performance_summary["components"].values()]
        if component_scores:
            performance_summary["overall_score"] = int(sum(component_scores) / len(component_scores))
        
        return performance_summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur performance summary: {str(e)}")


@router.get("/system-info", dependencies=[Depends(ensure_request_is_clean)])
async def get_system_info() -> Dict[str, Any]:
    """
    🖥️ Informations système complètes
    Diagnostic et troubleshooting avancé
    """
    
    try:
        import sys
        import platform
        
        return {
            "service": {
                "name": "Phoenix Luna Hub",
                "version": "2.0",
                "environment": os.getenv("PHOENIX_ENVIRONMENT", "development"),
                "started_at": "2025-08-27T11:00:00Z"  # TODO: timestamp réel de démarrage
            },
            "runtime": {
                "python_version": sys.version,
                "platform": platform.platform(),
                "architecture": platform.architecture()[0],
                "processor": platform.processor() or "unknown",
                "memory_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
                "disk_total_gb": round(psutil.disk_usage('/').total / (1024**3), 2) if os.path.exists('/') else None
            },
            "configuration": {
                "redis_available": redis_cache.redis_available,
                "metrics_collector_running": metrics_collector._running,
                "rate_limiting_enabled": True,
                "gdpr_compliance_enabled": True,
                "pack_catalog_size": len(PACK_CATALOG)
            },
            "components": {
                "total_alert_rules": len(metrics_collector.alert_rules),
                "rate_limiting_rules": len(rate_limiter.RULES),
                "active_alerts": len(metrics_collector.active_alerts),
                "supabase_connected": True  # TODO: vérifier depuis health check
            },
            "legacy_metrics": get_system_metrics(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur system info: {str(e)}")