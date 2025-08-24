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
    get_pack_info, calculate_first_purchase_bonus,
    # Subscription models
    CreateSubscriptionInput, CreateSubscriptionOutput,
    SubscriptionStatusOutput, CancelSubscriptionInput, CancelSubscriptionOutput
)
from ..billing.stripe_manager import StripeManager, StripeError
from ..core.energy_manager import energy_manager
from ..core.supabase_client import event_store, sb
from ..core.security_guardian import SecurityGuardian, ensure_request_is_clean

logger = structlog.get_logger("billing_endpoints")

router = APIRouter(prefix="/billing", tags=["billing"])

# ====== DEPENDENCIES ======

def get_bearer_token(authorization: Optional[str] = Header(None)) -> str:
    """Extraction et validation du token Bearer"""
    logger.info("🔍 DEBUG: get_bearer_token called",
               has_auth=bool(authorization),
               auth_length=len(authorization) if authorization else 0,
               starts_with_bearer=authorization.startswith("Bearer ") if authorization else False,
               debug_step="token_extraction")
    
    if not authorization or not authorization.startswith("Bearer "):
        logger.error("🔍 DEBUG: Missing or invalid Bearer token",
                    authorization=authorization[:20] + "..." if authorization and len(authorization) > 20 else authorization,
                    debug_step="token_extraction_failed")
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    
    token = authorization.split(" ", 1)[1]
    logger.info("🔍 DEBUG: Bearer token extracted",
               token_length=len(token),
               debug_step="token_extraction_success")
    return token

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

# ============================================================================
# ENDPOINTS SUBSCRIPTION (LUNA UNLIMITED)
# ============================================================================

@router.post("/create-subscription", response_model=CreateSubscriptionOutput)
async def create_subscription(
    body: CreateSubscriptionInput,
    token: str = Depends(get_bearer_token),
    correlation_id: str = Depends(get_correlation_id),
    _: None = Depends(ensure_request_is_clean)
):
    """
    🌙 Crée un abonnement Luna Unlimited via Stripe
    """
    start_time = time.time()
    
    # DEBUG: Log détaillé entrée endpoint
    logger.info("🔍 DEBUG: create_subscription endpoint called",
               user_id=getattr(body, 'user_id', 'MISSING'),
               plan=getattr(body, 'plan', 'MISSING'),
               currency=getattr(body, 'currency', 'MISSING'),
               correlation_id=correlation_id,
               token_provided=bool(token),
               token_length=len(token) if token else 0,
               debug_step="endpoint_entry")
    
    logger.info("Creating Luna Unlimited subscription",
               user_id=body.user_id,
               plan=body.plan,
               correlation_id=correlation_id)
    
    try:
        logger.info("🔍 DEBUG: Validating plan",
                   plan=body.plan,
                   debug_step="plan_validation")
        
        if body.plan != "luna_unlimited":
            logger.error("🔍 DEBUG: Invalid plan provided",
                        plan=body.plan,
                        expected="luna_unlimited",
                        debug_step="plan_validation_failed")
            raise HTTPException(
                status_code=422,
                detail="Only luna_unlimited plan is supported"
            )
        
        logger.info("🔍 DEBUG: Validating user_id with SecurityGuardian",
                   user_id=body.user_id,
                   debug_step="security_validation")
        
        # Validation sécurisée de l'user_id
        try:
            clean_user_id = SecurityGuardian.validate_user_id(body.user_id)
            logger.info("🔍 DEBUG: SecurityGuardian validation passed",
                       user_id=body.user_id,
                       clean_user_id=clean_user_id,
                       debug_step="security_validation_success")
        except Exception as security_error:
            logger.error("🔍 DEBUG: SecurityGuardian validation failed",
                        user_id=body.user_id,
                        error=str(security_error),
                        error_type=type(security_error).__name__,
                        debug_step="security_validation_failed")
            raise
        
        # 1. Récupérer/créer le customer Stripe
        logger.info("🔍 DEBUG: Fetching user from Supabase",
                   user_id=clean_user_id,
                   debug_step="user_fetch")
        try:
            user_result = sb.table("users").select("*").eq("id", clean_user_id).execute()
            logger.info("🔍 DEBUG: Supabase user query result",
                       user_id=clean_user_id,
                       has_data=bool(user_result.data),
                       data_count=len(user_result.data) if user_result.data else 0,
                       debug_step="user_fetch_result")
            
            if not user_result.data:
                logger.error("🔍 DEBUG: User not found in Supabase",
                            user_id=clean_user_id,
                            debug_step="user_fetch_failed")
                raise HTTPException(status_code=404, detail="User not found")
            
            user = user_result.data[0]
            stripe_customer_id = user.get("stripe_customer_id")
            
            if not stripe_customer_id:
                # Créer le customer Stripe
                stripe_customer_id = StripeManager.create_customer(
                    user_id=clean_user_id,
                    email=user.get("email", "")
                )
                
                # Sauvegarder le customer_id dans la DB
                sb.table("users").update({
                    "stripe_customer_id": stripe_customer_id
                }).eq("id", clean_user_id).execute()
                
                logger.info("Stripe customer created and saved",
                           user_id=clean_user_id,
                           customer_id=stripe_customer_id)
        
        except Exception as e:
            logger.error("Error handling Stripe customer", error=str(e), user_id=clean_user_id)
            raise HTTPException(status_code=500, detail="Customer creation failed")
        
        # 2. Créer la subscription Stripe
        try:
            subscription_id, status, current_period_end, client_secret = StripeManager.create_subscription(
                user_id=clean_user_id,
                customer_id=stripe_customer_id,
                plan=body.plan
            )
        
        except StripeError as e:
            logger.error("Stripe subscription creation failed", error=str(e), user_id=clean_user_id)
            raise HTTPException(status_code=502, detail=f"Subscription service error: {str(e)}")
        
        # 3. Créer l'événement BillingSubscriptionCreated
        try:
            event_id = await event_store.create_event(
                user_id=clean_user_id,
                event_type="BillingSubscriptionCreated",
                app_source="luna_hub",
                event_data={
                    "stripe_subscription_id": subscription_id,
                    "stripe_customer_id": stripe_customer_id,
                    "plan": body.plan,
                    "status": status,
                    "current_period_end": current_period_end,
                    "correlation_id": correlation_id
                },
                metadata={
                    "billing_action": "create_subscription",
                    "subscription_plan": body.plan,
                    "stripe_environment": "live" if "sk_live" in StripeManager.STRIPE_SECRET_KEY else "test"
                }
            )
            
            logger.info("BillingSubscriptionCreated event created", 
                       event_id=event_id, 
                       subscription_id=subscription_id)
        
        except Exception as e:
            logger.error("Error creating subscription event", error=str(e), subscription_id=subscription_id)
            # N'interrompons pas le flow, l'abonnement Stripe est créé
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        logger.info("Luna Unlimited subscription created successfully",
                   subscription_id=subscription_id,
                   user_id=clean_user_id,
                   status=status,
                   duration_ms=duration_ms)
        
        # Obtenir le prix pour la réponse
        from ..models.billing import get_subscription_price
        price_cents = get_subscription_price("luna_unlimited")
        
        return CreateSubscriptionOutput(
            success=True,
            subscription_id=subscription_id,
            client_secret=client_secret or "",
            status=status,
            plan=body.plan,
            price_cents=price_cents,
            current_period_end=current_period_end
        )
        
    except HTTPException as http_exc:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error("🔍 DEBUG: HTTPException in create_subscription",
                    user_id=getattr(body, 'user_id', 'UNKNOWN'),
                    status_code=http_exc.status_code,
                    detail=http_exc.detail,
                    duration_ms=duration_ms,
                    debug_step="http_exception")
        raise
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error("🔍 DEBUG: Unexpected error creating subscription",
                    user_id=getattr(body, 'user_id', 'UNKNOWN'),
                    error=str(e),
                    error_type=type(e).__name__,
                    duration_ms=duration_ms,
                    debug_step="unexpected_exception")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    🔗 Webhook Stripe pour synchronisation des abonnements
    """
    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature", "")
        
        # Vérification signature Stripe
        try:
            event = StripeManager.verify_webhook_signature(payload, sig_header)
        except StripeError as e:
            logger.error("Invalid webhook signature", error=str(e))
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        event_type = event["type"]
        event_data = event["data"]["object"]
        
        logger.info("Processing Stripe webhook",
                   event_type=event_type,
                   event_id=event["id"])
        
        # Traitement des événements subscription
        if event_type in ["customer.subscription.created", "customer.subscription.updated"]:
            await _handle_subscription_updated(event_data)
            
        elif event_type == "customer.subscription.deleted":
            await _handle_subscription_deleted(event_data)
            
        elif event_type == "invoice.payment_succeeded":
            await _handle_invoice_payment_succeeded(event_data)
            
        elif event_type == "invoice.payment_failed":
            await _handle_invoice_payment_failed(event_data)
        
        return {"received": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error processing webhook", error=str(e))
        raise HTTPException(status_code=500, detail="Webhook processing failed")

# ============================================================================
# HELPER FUNCTIONS WEBHOOK
# ============================================================================

async def _handle_subscription_updated(subscription_data: Dict[str, Any]) -> None:
    """Gère les mises à jour de subscription"""
    try:
        # Récupération user_id
        user_id = None
        metadata = subscription_data.get("metadata", {})
        if "user_id" in metadata:
            user_id = metadata["user_id"]
        else:
            # Fallback: recherche par customer_id
            customer_id = subscription_data.get("customer")
            if customer_id:
                user_result = sb.table("users").select("id").eq("stripe_customer_id", customer_id).execute()
                if user_result.data:
                    user_id = user_result.data[0]["id"]
        
        if not user_id:
            logger.error("Cannot find user for subscription update",
                        subscription_id=subscription_data.get("id"),
                        customer_id=subscription_data.get("customer"))
            return
        
        # Extraction des données subscription
        subscription_id = subscription_data["id"]
        status = subscription_data["status"]
        current_period_end = subscription_data.get("current_period_end")
        
        # Mise à jour de l'utilisateur
        subscription_type = "luna_unlimited" if status in ["active", "trialing"] else None
        
        update_data = {
            "subscription_type": subscription_type,
            "subscription_status": status,
            "subscription_ends_at": None
        }
        
        if current_period_end:
            from datetime import datetime, timezone
            update_data["subscription_ends_at"] = datetime.fromtimestamp(
                current_period_end, tz=timezone.utc
            ).isoformat()
        
        sb.table("users").update(update_data).eq("id", user_id).execute()
        
        # Création événement
        await event_store.create_event(
            user_id=user_id,
            event_type="BillingSubscriptionUpdated",
            app_source="stripe_webhook",
            event_data={
                "stripe_subscription_id": subscription_id,
                "status": status,
                "current_period_end": current_period_end,
                "subscription_type": subscription_type
            },
            metadata={
                "webhook_event": "subscription_updated",
                "stripe_event_id": subscription_data.get("id")
            }
        )
        
        logger.info("Subscription updated successfully",
                   user_id=user_id,
                   subscription_id=subscription_id,
                   status=status,
                   subscription_type=subscription_type)
        
    except Exception as e:
        logger.error("Error handling subscription update", error=str(e))

async def _handle_subscription_deleted(subscription_data: Dict[str, Any]) -> None:
    """Gère l'annulation définitive d'une subscription"""
    try:
        # Même logique de récupération user_id
        user_id = None
        metadata = subscription_data.get("metadata", {})
        if "user_id" in metadata:
            user_id = metadata["user_id"]
        else:
            customer_id = subscription_data.get("customer")
            if customer_id:
                user_result = sb.table("users").select("id").eq("stripe_customer_id", customer_id).execute()
                if user_result.data:
                    user_id = user_result.data[0]["id"]
        
        if not user_id:
            return
        
        # Retirer le statut unlimited
        sb.table("users").update({
            "subscription_type": None,
            "subscription_status": "canceled",
            "subscription_ends_at": None
        }).eq("id", user_id).execute()
        
        # Événement de cancellation
        await event_store.create_event(
            user_id=user_id,
            event_type="BillingSubscriptionCanceled",
            app_source="stripe_webhook",
            event_data={
                "stripe_subscription_id": subscription_data["id"],
                "canceled_at": subscription_data.get("canceled_at")
            },
            metadata={
                "webhook_event": "subscription_deleted"
            }
        )
        
        logger.info("Subscription canceled",
                   user_id=user_id,
                   subscription_id=subscription_data["id"])
        
    except Exception as e:
        logger.error("Error handling subscription deletion", error=str(e))

async def _handle_invoice_payment_succeeded(invoice_data: Dict[str, Any]) -> None:
    """Gère le paiement réussi d'une facture (renouvellement)"""
    try:
        customer_id = invoice_data.get("customer")
        if not customer_id:
            return
            
        user_result = sb.table("users").select("id").eq("stripe_customer_id", customer_id).execute()
        if not user_result.data:
            return
            
        user_id = user_result.data[0]["id"]
        
        # Événement de paiement réussi
        await event_store.create_event(
            user_id=user_id,
            event_type="BillingInvoicePaid",
            app_source="stripe_webhook",
            event_data={
                "invoice_id": invoice_data["id"],
                "amount_paid": invoice_data["amount_paid"],
                "currency": invoice_data["currency"],
                "subscription_id": invoice_data.get("subscription")
            },
            metadata={
                "webhook_event": "invoice_payment_succeeded",
                "billing_reason": invoice_data.get("billing_reason")
            }
        )
        
        logger.info("Invoice payment succeeded",
                   user_id=user_id,
                   invoice_id=invoice_data["id"],
                   amount_paid=invoice_data["amount_paid"])
        
    except Exception as e:
        logger.error("Error handling invoice payment", error=str(e))

async def _handle_invoice_payment_failed(invoice_data: Dict[str, Any]) -> None:
    """Gère l'échec de paiement d'une facture"""
    try:
        customer_id = invoice_data.get("customer")
        if not customer_id:
            return
            
        user_result = sb.table("users").select("id").eq("stripe_customer_id", customer_id).execute()
        if not user_result.data:
            return
            
        user_id = user_result.data[0]["id"]
        
        # Événement de paiement échoué
        await event_store.create_event(
            user_id=user_id,
            event_type="BillingInvoicePaymentFailed",
            app_source="stripe_webhook",
            event_data={
                "invoice_id": invoice_data["id"],
                "amount_due": invoice_data["amount_due"],
                "currency": invoice_data["currency"],
                "subscription_id": invoice_data.get("subscription")
            },
            metadata={
                "webhook_event": "invoice_payment_failed"
            }
        )
        
        logger.warning("Invoice payment failed",
                      user_id=user_id,
                      invoice_id=invoice_data["id"],
                      amount_due=invoice_data["amount_due"])
        
    except Exception as e:
        logger.error("Error handling invoice payment failure", error=str(e))

@router.get("/packs")
async def get_available_packs():
    """
    📦 Récupère la liste des packs disponibles
    """
    return {
        "success": True,
        "packs": [pack_info.dict() for pack_info in PACK_CATALOG.values()],
        "currency": "eur",
        "unlimited_available": True  # Maintenant disponible via subscription
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