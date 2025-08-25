"""
🔍 Monitoring & Observability Endpoints - Sprint 5
Health checks avancés pour Railway deployment
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import asyncio
import httpx
import psutil
import os

from ..core.supabase_client import get_supabase_client
from ..billing.stripe_manager import StripeManager
from ..models.billing import PACK_CATALOG

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
        result = supabase.table("energy_transactions").select("id").limit(1).execute()
        
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