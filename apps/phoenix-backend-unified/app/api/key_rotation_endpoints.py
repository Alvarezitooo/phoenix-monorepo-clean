"""
🔑 API Key Rotation Endpoints - Phoenix Luna Hub
Monitoring et gestion des clés API avec rotation automatique
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any
from app.core.api_key_manager import api_key_manager, KeyProvider
from app.core.security_guardian import ensure_request_is_clean
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/monitoring/api-keys", tags=["API Keys"])


@router.get("/status", dependencies=[Depends(ensure_request_is_clean)])
async def get_api_keys_status() -> Dict[str, Any]:
    """
    📊 Status de rotation de toutes les clés API
    Endpoint de monitoring pour Grafana/Uptime Robot
    """
    try:
        status_data = await api_key_manager.get_rotation_status()
        
        # Calculer le status global
        global_status = "healthy"
        critical_keys = []
        warning_keys = []
        
        for provider, info in status_data.items():
            if info["status"] == "critical":
                global_status = "critical"
                critical_keys.append(provider)
            elif info["status"] == "warning" and global_status != "critical":
                global_status = "warning"
                warning_keys.append(provider)
        
        return {
            "global_status": global_status,
            "timestamp": "2025-08-27T10:35:00Z",
            "keys": status_data,
            "summary": {
                "total_keys": len(status_data),
                "healthy": len([k for k in status_data.values() if k["status"] == "healthy"]),
                "warning": len([k for k in status_data.values() if k["status"] == "warning"]), 
                "critical": len([k for k in status_data.values() if k["status"] == "critical"]),
                "missing": len([k for k in status_data.values() if k["status"] == "missing"])
            },
            "actions_required": {
                "critical_keys": critical_keys,
                "warning_keys": warning_keys,
                "next_rotation_days": min([
                    info.get("days_until_rotation", 999) 
                    for info in status_data.values() 
                    if info.get("days_until_rotation") is not None
                ], default=999)
            }
        }
        
    except Exception as e:
        logger.error("Failed to get API keys status", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve API keys status"
        )


@router.post("/revoke/{provider}", dependencies=[Depends(ensure_request_is_clean)])
async def revoke_api_key(provider: str, reason: str) -> Dict[str, Any]:
    """
    🚫 Révocation d'urgence d'une clé API
    ATTENTION: Utilisez seulement en cas de compromission
    """
    try:
        # Valider le provider
        try:
            key_provider = KeyProvider(provider.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown provider: {provider}. Valid providers: {[p.value for p in KeyProvider]}"
            )
        
        # Révocation
        success = await api_key_manager.revoke_key(key_provider, reason)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No active key found for provider {provider}"
            )
        
        logger.critical("API key revoked via endpoint",
                       provider=provider,
                       reason=reason,
                       revoked_by="api_endpoint")
        
        return {
            "success": True,
            "provider": provider,
            "reason": reason,
            "revoked_at": "2025-08-27T10:35:00Z",
            "warning": "Service may be impacted until key is replaced"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to revoke API key", provider=provider, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke API key"
        )


@router.get("/health-check", dependencies=[Depends(ensure_request_is_clean)])
async def health_check_keys() -> Dict[str, Any]:
    """
    🏥 Health check rapide pour monitoring externe
    Retourne 200 si toutes les clés sont healthy, 503 sinon
    """
    try:
        status_data = await api_key_manager.get_rotation_status()
        
        # Compter les problèmes
        critical_count = len([k for k in status_data.values() if k["status"] == "critical"])
        missing_count = len([k for k in status_data.values() if k["status"] == "missing"])
        
        if critical_count > 0 or missing_count > 0:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "status": "unhealthy",
                    "critical_keys": critical_count,
                    "missing_keys": missing_count,
                    "message": "API key rotation required or keys missing"
                }
            )
        
        return {
            "status": "healthy",
            "message": "All API keys are within rotation thresholds",
            "timestamp": "2025-08-27T10:35:00Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("API keys health check failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Health check failed"
        )