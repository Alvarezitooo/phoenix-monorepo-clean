"""
🔄 Endpoints Refund - Garantie Satisfaction Luna
Directive Oracle: Everything is Event, Security by Default
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from typing import Optional, List, Dict, Any
import time
import uuid
import structlog

from ..models.billing import RefundRequestInput, RefundRequestOutput
from ..core.energy_manager import energy_manager
from ..core.supabase_client import event_store
from ..core.security_guardian import SecurityGuardian

logger = structlog.get_logger("refund_endpoints")

router = APIRouter(prefix="/luna/energy", tags=["refund"])

# ====== DEPENDENCIES ======

def get_bearer_token(authorization: Optional[str] = Header(None)) -> str:
    """Extraction et validation du token Bearer"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    return authorization.split(" ", 1)[1]

def get_correlation_id(request: Request) -> str:
    """Récupère le correlation_id depuis le middleware"""
    return getattr(request.state, 'correlation_id', str(uuid.uuid4()))

# ====== HELPER FUNCTIONS ======

async def _get_consumed_event(user_id: str, event_id: str) -> Optional[Dict[str, Any]]:
    """Récupère un événement EnergyConsumed spécifique"""
    try:
        events = await event_store.get_user_events(
            user_id=user_id,
            event_type="EnergyConsumed"
        )
        
        for event in events:
            if event.get("event_id") == event_id:
                return event
        
        return None
        
    except Exception as e:
        logger.error("Error getting consumed event",
                    user_id=user_id,
                    event_id=event_id,
                    error=str(e))
        return None

async def _refund_already_exists(action_event_id: str) -> bool:
    """Vérifie si un remboursement existe déjà pour cette action"""
    try:
        # Recherche globale d'événements EnergyRefunded
        events = await event_store.get_user_events(
            user_id="*",  # Recherche globale
            event_type="EnergyRefunded"
        )
        
        for event in events:
            event_data = event.get("event_data", {})
            if event_data.get("original_action_event_id") == action_event_id:
                return True
        
        return False
        
    except Exception as e:
        logger.error("Error checking refund existence",
                    action_event_id=action_event_id,
                    error=str(e))
        return False

async def _validate_refund_eligibility(event: Dict[str, Any]) -> tuple[bool, str]:
    """Valide l'éligibilité au remboursement"""
    try:
        event_data = event.get("event_data", {})
        created_at = event.get("created_at")
        
        # Vérification âge de l'action (7 jours max)
        from datetime import datetime, timezone, timedelta
        
        if created_at:
            event_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            max_refund_date = datetime.now(timezone.utc) - timedelta(days=7)
            
            if event_date < max_refund_date:
                return False, "Refund period expired (7 days maximum)"
        
        # Vérification type d'action éligible
        action_name = event_data.get("action_name", "")
        ineligible_actions = ["conseil_rapide", "verification_format"]  # Actions gratuites
        
        if action_name in ineligible_actions:
            return False, f"Action {action_name} not eligible for refund"
        
        # Vérification énergie consommée
        energy_consumed = event_data.get("energy_consumed", 0)
        if energy_consumed <= 0:
            return False, "No energy consumed to refund"
        
        return True, "Eligible for refund"
        
    except Exception as e:
        logger.error("Error validating refund eligibility", error=str(e))
        return False, "Error validating eligibility"

# ====== ENDPOINTS ======

@router.post("/refund", response_model=RefundRequestOutput)
async def refund_energy(
    body: RefundRequestInput,
    token: str = Depends(get_bearer_token),
    correlation_id: str = Depends(get_correlation_id)
):
    """
    🔄 Rembourse l'énergie d'une action - Garantie Satisfaction
    """
    start_time = time.time()
    
    logger.info("Processing energy refund request",
               user_id=body.user_id,
               action_event_id=body.action_event_id,
               reason=body.reason,
               correlation_id=correlation_id)
    
    try:
        # Validation sécurisée
        clean_user_id = SecurityGuardian.validate_user_id(body.user_id)
        clean_event_id = SecurityGuardian.sanitize_string(body.action_event_id, 100)
        clean_reason = SecurityGuardian.sanitize_string(body.reason or "", 280) if body.reason else None
        
        # Vérification double remboursement (idempotence)
        if await _refund_already_exists(clean_event_id):
            logger.warning("Refund already exists",
                          action_event_id=clean_event_id,
                          user_id=clean_user_id)
            raise HTTPException(
                status_code=409,
                detail="Refund already processed for this action"
            )
        
        # Récupération événement consommation original
        consumed_event = await _get_consumed_event(clean_user_id, clean_event_id)
        if not consumed_event:
            logger.warning("Consumed event not found",
                          user_id=clean_user_id,
                          event_id=clean_event_id)
            raise HTTPException(
                status_code=404,
                detail="Energy consumption event not found"
            )
        
        # Validation éligibilité remboursement
        eligible, eligibility_reason = await _validate_refund_eligibility(consumed_event)
        if not eligible:
            logger.warning("Refund not eligible",
                          user_id=clean_user_id,
                          event_id=clean_event_id,
                          reason=eligibility_reason)
            raise HTTPException(
                status_code=422,
                detail=f"Refund not eligible: {eligibility_reason}"
            )
        
        # Extraction données de consommation
        event_data = consumed_event.get("event_data", {})
        energy_consumed = event_data.get("energy_consumed", 0)
        original_action = event_data.get("action_name", "unknown")
        
        if energy_consumed <= 0:
            raise HTTPException(
                status_code=422,
                detail="No energy to refund"
            )
        
        # Remboursement énergie via Energy Manager
        energy_result = await energy_manager.add_energy(clean_user_id, energy_consumed)
        new_balance = energy_result["current_energy"]
        
        # Génération ID remboursement
        refund_id = f"refund_{uuid.uuid4().hex[:12]}"
        
        # Création événement EnergyRefunded
        refund_event_id = await event_store.create_event(
            user_id=clean_user_id,
            event_type="EnergyRefunded",
            app_source="luna_hub",
            event_data={
                "refund_id": refund_id,
                "original_action_event_id": clean_event_id,
                "original_action": original_action,
                "energy_refunded": energy_consumed,
                "reason": clean_reason,
                "new_balance": new_balance,
                "correlation_id": correlation_id,
                "refund_policy": "satisfaction_guarantee"
            },
            metadata={
                "refund_action": "energy_refund",
                "original_event_date": consumed_event.get("created_at"),
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        )
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        logger.info("Energy refund processed successfully",
                   user_id=clean_user_id,
                   refund_id=refund_id,
                   energy_refunded=energy_consumed,
                   new_balance=new_balance,
                   refund_event_id=refund_event_id,
                   duration_ms=duration_ms)
        
        return RefundRequestOutput(
            success=True,
            status="refunded",
            refunded_units=energy_consumed,
            new_energy_balance=new_balance,
            refund_event_id=refund_event_id,
            original_action=original_action
        )
        
    except HTTPException:
        raise
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error("Unexpected error processing refund",
                    user_id=body.user_id,
                    action_event_id=body.action_event_id,
                    error=str(e),
                    duration_ms=duration_ms)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/refund-history/{user_id}")
async def get_refund_history(
    user_id: str,
    limit: int = 20,
    token: str = Depends(get_bearer_token)
):
    """
    📜 Récupère l'historique des remboursements d'un utilisateur
    """
    logger.info("Getting refund history", user_id=user_id, limit=limit)
    
    try:
        # Validation sécurisée
        clean_user_id = SecurityGuardian.validate_user_id(user_id)
        
        # Récupération événements EnergyRefunded
        events = await event_store.get_user_events(
            user_id=clean_user_id,
            limit=limit,
            event_type="EnergyRefunded"
        )
        
        # Traitement des données
        refunds = []
        total_refunded = 0
        
        for event in events:
            event_data = event.get("event_data", {})
            
            refund = {
                "refund_event_id": event.get("event_id"),
                "refund_id": event_data.get("refund_id"),
                "date": event.get("created_at"),
                "original_action": event_data.get("original_action"),
                "energy_refunded": event_data.get("energy_refunded", 0),
                "reason": event_data.get("reason"),
                "status": "completed"
            }
            
            refunds.append(refund)
            total_refunded += refund["energy_refunded"]
        
        logger.info("Refund history retrieved",
                   user_id=clean_user_id,
                   total_refunds=len(refunds),
                   total_refunded=total_refunded)
        
        return {
            "success": True,
            "user_id": clean_user_id,
            "total_refunds": len(refunds),
            "total_energy_refunded": total_refunded,
            "refunds": refunds
        }
        
    except Exception as e:
        logger.error("Error getting refund history",
                    user_id=user_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/refund-eligibility/{user_id}/{action_event_id}")
async def check_refund_eligibility(
    user_id: str,
    action_event_id: str,
    token: str = Depends(get_bearer_token)
):
    """
    🔍 Vérifie l'éligibilité d'une action au remboursement
    """
    try:
        # Validation sécurisée
        clean_user_id = SecurityGuardian.validate_user_id(user_id)
        clean_event_id = SecurityGuardian.sanitize_string(action_event_id, 100)
        
        # Vérification remboursement existant
        already_refunded = await _refund_already_exists(clean_event_id)
        if already_refunded:
            return {
                "eligible": False,
                "reason": "Already refunded",
                "status": "already_processed"
            }
        
        # Récupération événement
        consumed_event = await _get_consumed_event(clean_user_id, clean_event_id)
        if not consumed_event:
            return {
                "eligible": False,
                "reason": "Action not found",
                "status": "not_found"
            }
        
        # Validation éligibilité
        eligible, reason = await _validate_refund_eligibility(consumed_event)
        
        event_data = consumed_event.get("event_data", {})
        
        return {
            "eligible": eligible,
            "reason": reason,
            "status": "eligible" if eligible else "not_eligible",
            "action_name": event_data.get("action_name"),
            "energy_consumed": event_data.get("energy_consumed", 0),
            "action_date": consumed_event.get("created_at")
        }
        
    except Exception as e:
        logger.error("Error checking refund eligibility",
                    user_id=user_id,
                    action_event_id=action_event_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/refund-policy")
async def get_refund_policy():
    """
    📋 Récupère la politique de remboursement Luna
    """
    return {
        "success": True,
        "policy": {
            "name": "Luna Satisfaction Guarantee",
            "refund_period_days": 7,
            "eligible_actions": [
                "analyse_cv_complete",
                "optimisation_cv", 
                "mirror_match",
                "salary_analysis",
                "lettre_motivation",
                "analyse_offre"
            ],
            "ineligible_actions": [
                "conseil_rapide",
                "verification_format"
            ],
            "terms": [
                "Remboursement dans les 7 jours suivant l'action",
                "Une seule demande de remboursement par action",
                "Actions gratuites non éligibles",
                "Remboursement automatique sous 24h",
                "Capital Narratif conservé"
            ],
            "contact": "support@phoenix.ai"
        }
    }