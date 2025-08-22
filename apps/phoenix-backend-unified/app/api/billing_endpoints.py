"""
💳 Endpoints Billing Phoenix Luna Hub
Directive Oracle: Hub = Roi, API Contract, Everything is Event
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from typing import Optional, Dict, Any
import time
import uuid
import structlog

from ..models.billing import (
    CreateIntentInput, CreateIntentOutput,
    ConfirmPaymentInput, ConfirmPaymentOutput,
    PurchaseHistoryOutput, PACK_CATALOG,
    get_pack_info, calculate_first_purchase_bonus
)
from ..billing.stripe_manager import StripeManager, StripeError
from ..core.energy_manager import energy_manager
from ..core.supabase_client import event_store
from ..core.security_guardian import SecurityGuardian

logger = structlog.get_logger("billing_endpoints")

router = APIRouter(prefix="/billing", tags=["billing"])

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

async def _intent_already_processed(intent_id: str) -> bool:
    """Vérifie si un PaymentIntent a déjà été traité (idempotence)"""
    try:
        events = await event_store.get_user_events(
            user_id="*",  # Recherche globale
            event_type="EnergyPurchased"
        )
        
        for event in events:
            event_data = event.get("event_data", {})
            if event_data.get("stripe_intent_id") == intent_id:
                return True
        
        return False
        
    except Exception as e:
        logger.error("Error checking intent processing", 
                    intent_id=intent_id, 
                    error=str(e))
        return False

async def _is_first_cafe_purchase(user_id: str) -> bool:
    """Vérifie si c'est le premier achat café de l'utilisateur"""
    try:
        events = await event_store.get_user_events(
            user_id=user_id,
            event_type="EnergyPurchased"
        )
        
        for event in events:
            event_data = event.get("event_data", {})
            if event_data.get("pack") == "cafe_luna":
                return False
        
        return True
        
    except Exception as e:
        logger.error("Error checking first purchase", 
                    user_id=user_id, 
                    error=str(e))
        return False

# ====== ENDPOINTS ======

@router.post("/create-intent", response_model=CreateIntentOutput)
async def create_payment_intent(
    body: CreateIntentInput,
    token: str = Depends(get_bearer_token),
    correlation_id: str = Depends(get_correlation_id)
):
    """
    💳 Crée un PaymentIntent Stripe pour achat d'énergie Luna
    """
    start_time = time.time()
    
    logger.info("Creating payment intent",
               user_id=body.user_id,
               pack=body.pack,
               currency=body.currency,
               correlation_id=correlation_id)
    
    try:
        # Validation du pack
        if body.pack == "luna_unlimited":
            raise HTTPException(
                status_code=422, 
                detail="Luna Unlimited requires subscription flow, not PaymentIntent"
            )
        
        if not StripeManager.validate_pack_support(body.pack):
            raise HTTPException(
                status_code=422,
                detail=f"Pack {body.pack} not supported"
            )
        
        # Validation sécurisée de l'user_id
        clean_user_id = SecurityGuardian.validate_user_id(body.user_id)
        
        # Création PaymentIntent via Stripe
        intent_id, client_secret, amount_cents, currency, energy_units = StripeManager.create_payment_intent(
            user_id=clean_user_id,
            pack=body.pack,
            currency=body.currency
        )
        
        # Création événement d'intention billing
        await event_store.create_event(
            user_id=clean_user_id,
            event_type="BillingIntentCreated",
            app_source="luna_hub",
            event_data={
                "stripe_intent_id": intent_id,
                "pack": body.pack,
                "amount_cents": amount_cents,
                "currency": currency,
                "energy_units": energy_units,
                "correlation_id": correlation_id
            },
            metadata={
                "billing_action": "create_intent",
                "stripe_environment": "live" if "sk_live" in StripeManager.STRIPE_SECRET_KEY else "test"
            }
        )
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        logger.info("Payment intent created successfully",
                   intent_id=intent_id,
                   user_id=clean_user_id,
                   pack=body.pack,
                   amount_cents=amount_cents,
                   duration_ms=duration_ms)
        
        pack_info = get_pack_info(body.pack)
        
        return CreateIntentOutput(
            success=True,
            intent_id=intent_id,
            client_secret=client_secret,
            amount=amount_cents,
            currency=currency,
            pack=body.pack,
            energy_units=energy_units
        )
        
    except StripeError as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error("Stripe error creating intent",
                    user_id=body.user_id,
                    pack=body.pack,
                    error=str(e),
                    duration_ms=duration_ms)
        raise HTTPException(status_code=502, detail=f"Payment service error: {str(e)}")
        
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error("Unexpected error creating intent",
                    user_id=body.user_id,
                    pack=body.pack,
                    error=str(e),
                    duration_ms=duration_ms)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/confirm-payment", response_model=ConfirmPaymentOutput)
async def confirm_payment(
    body: ConfirmPaymentInput,
    token: str = Depends(get_bearer_token),
    correlation_id: str = Depends(get_correlation_id)
):
    """
    ✅ Confirme un paiement et crédite l'énergie Luna
    """
    start_time = time.time()
    
    logger.info("Confirming payment",
               user_id=body.user_id,
               intent_id=body.intent_id,
               correlation_id=correlation_id)
    
    try:
        # Validation sécurisée
        clean_user_id = SecurityGuardian.validate_user_id(body.user_id)
        clean_intent_id = SecurityGuardian.sanitize_string(body.intent_id, 100)
        
        # Vérification idempotence
        if await _intent_already_processed(clean_intent_id):
            logger.info("Payment already processed (idempotent)",
                       intent_id=clean_intent_id,
                       user_id=clean_user_id)
            
            return ConfirmPaymentOutput(
                success=True,
                status="already_credited",
                energy_added=0,
                bonus_applied=False,
                bonus_units=0,
                new_energy_balance=0,  # TODO: récupérer depuis le dernier événement
                event_id=""
            )
        
        # Récupération PaymentIntent Stripe
        try:
            intent = StripeManager.retrieve_payment_intent(clean_intent_id)
        except StripeError as e:
            raise HTTPException(status_code=404, detail=f"Payment not found: {str(e)}")
        
        # Validation statut paiement
        if intent.status not in ("succeeded", "requires_capture"):
            logger.warning("Invalid payment status",
                          intent_id=clean_intent_id,
                          status=intent.status)
            raise HTTPException(
                status_code=409, 
                detail=f"Payment not completed. Status: {intent.status}"
            )
        
        # Extraction métadonnées
        pack = intent.metadata.get("pack")
        base_energy_units = int(intent.metadata.get("energy_units", "0"))
        
        if not pack or base_energy_units <= 0:
            raise HTTPException(
                status_code=422,
                detail="Invalid payment metadata"
            )
        
        # Calcul bonus premier achat
        is_first_cafe = await _is_first_cafe_purchase(clean_user_id)
        bonus_units = 0
        bonus_applied = False
        
        if pack == "cafe_luna" and is_first_cafe:
            bonus_units = calculate_first_purchase_bonus(pack, base_energy_units)
            bonus_applied = True
            
            logger.info("First cafe purchase bonus applied",
                       user_id=clean_user_id,
                       base_units=base_energy_units,
                       bonus_units=bonus_units)
        
        total_energy = base_energy_units + bonus_units
        
        # Crédit énergie via Energy Manager
        energy_result = await energy_manager.add_energy(clean_user_id, total_energy)
        new_balance = energy_result["current_energy"]
        
        # Génération ID transaction
        transaction_id = f"tx_{uuid.uuid4().hex[:12]}"
        
        # Création événement EnergyPurchased
        event_id = await event_store.create_event(
            user_id=clean_user_id,
            event_type="EnergyPurchased",
            app_source="luna_hub",
            event_data={
                "stripe_intent_id": clean_intent_id,
                "transaction_id": transaction_id,
                "pack": pack,
                "base_energy_units": base_energy_units,
                "bonus_units": bonus_units,
                "total_energy_added": total_energy,
                "bonus_applied": bonus_applied,
                "stripe_amount_cents": intent.amount,
                "currency": intent.currency,
                "new_balance": new_balance,
                "correlation_id": correlation_id
            },
            metadata={
                "billing_action": "confirm_payment",
                "first_purchase_bonus": is_first_cafe,
                "payment_method": intent.payment_method,
                "receipt_url": getattr(intent.charges.data[0], 'receipt_url', None) if intent.charges.data else None
            }
        )
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        logger.info("Payment confirmed successfully",
                   user_id=clean_user_id,
                   intent_id=clean_intent_id,
                   energy_added=total_energy,
                   bonus_applied=bonus_applied,
                   new_balance=new_balance,
                   event_id=event_id,
                   duration_ms=duration_ms)
        
        return ConfirmPaymentOutput(
            success=True,
            status="credited",
            energy_added=total_energy,
            bonus_applied=bonus_applied,
            bonus_units=bonus_units,
            new_energy_balance=new_balance,
            event_id=event_id,
            transaction_id=transaction_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error("Unexpected error confirming payment",
                    user_id=body.user_id,
                    intent_id=body.intent_id,
                    error=str(e),
                    duration_ms=duration_ms)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/history/{user_id}", response_model=PurchaseHistoryOutput)
async def get_purchase_history(
    user_id: str,
    limit: int = 50,
    token: str = Depends(get_bearer_token)
):
    """
    📜 Récupère l'historique d'achats d'un utilisateur
    """
    logger.info("Getting purchase history", user_id=user_id, limit=limit)
    
    try:
        # Validation sécurisée
        clean_user_id = SecurityGuardian.validate_user_id(user_id)
        
        # Récupération événements EnergyPurchased
        events = await event_store.get_user_events(
            user_id=clean_user_id,
            limit=limit,
            event_type="EnergyPurchased"
        )
        
        # Traitement des données
        purchases = []
        total_spent_cents = 0
        total_energy_purchased = 0
        
        for event in events:
            event_data = event.get("event_data", {})
            
            purchase = {
                "event_id": event.get("event_id"),
                "date": event.get("created_at"),
                "pack": event_data.get("pack"),
                "energy_added": event_data.get("total_energy_added", 0),
                "amount_cents": event_data.get("stripe_amount_cents", 0),
                "currency": event_data.get("currency", "eur"),
                "bonus_applied": event_data.get("bonus_applied", False),
                "bonus_units": event_data.get("bonus_units", 0),
                "transaction_id": event_data.get("transaction_id")
            }
            
            purchases.append(purchase)
            total_spent_cents += purchase["amount_cents"]
            total_energy_purchased += purchase["energy_added"]
        
        logger.info("Purchase history retrieved",
                   user_id=clean_user_id,
                   total_purchases=len(purchases),
                   total_spent_cents=total_spent_cents)
        
        return PurchaseHistoryOutput(
            success=True,
            user_id=clean_user_id,
            total_purchases=len(purchases),
            total_spent_cents=total_spent_cents,
            total_energy_purchased=total_energy_purchased,
            purchases=purchases
        )
        
    except Exception as e:
        logger.error("Error getting purchase history",
                    user_id=user_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/packs")
async def get_available_packs():
    """
    📦 Récupère la liste des packs disponibles
    """
    return {
        "success": True,
        "packs": [pack_info.dict() for pack_info in PACK_CATALOG.values()],
        "currency": "eur",
        "unlimited_available": False  # Géré séparément via abonnements
    }

@router.get("/stats")
async def get_billing_stats(
    token: str = Depends(get_bearer_token)
):
    """
    📊 Statistiques billing (admin uniquement)
    """
    try:
        # Récupération stats Stripe
        stripe_stats = StripeManager.get_payment_stats()
        
        # Stats depuis Event Store
        # TODO: Implémenter agrégation événements pour analytics avancés
        
        return {
            "success": True,
            "stripe_stats": stripe_stats,
            "generated_at": time.time()
        }
        
    except Exception as e:
        logger.error("Error getting billing stats", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/health")
async def billing_health():
    """
    🏥 Health check des services billing
    """
    try:
        stripe_health = StripeManager.health_check()
        
        return {
            "status": "healthy" if stripe_health["stripe_connected"] else "degraded",
            "billing_service": "operational",
            "stripe": stripe_health,
            "timestamp": time.time()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "billing_service": "error",
            "error": str(e),
            "timestamp": time.time()
        }