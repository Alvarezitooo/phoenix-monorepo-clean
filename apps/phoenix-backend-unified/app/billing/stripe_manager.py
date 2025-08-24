"""
💳 Stripe Manager - Intégration sécurisée pour Luna Hub
Directive Oracle: Security by Default, Hub = Roi
"""

from __future__ import annotations
import os
import uuid
import structlog
from typing import Tuple, Dict, Any, Optional
from datetime import datetime, timezone

import stripe
from ..models.billing import PackCode, get_pack_price, get_pack_energy, get_subscription_price

# Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Initialisation Stripe
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
else:
    if ENVIRONMENT == "production":
        raise RuntimeError("STRIPE_SECRET_KEY required in production")

logger = structlog.get_logger("stripe_manager")

class StripeError(Exception):
    """Erreur Stripe personnalisée"""
    pass

class StripeManager:
    """
    💳 Gestionnaire Stripe pour Phoenix Luna Hub
    """
    
    @staticmethod
    def create_payment_intent(
        user_id: str, 
        pack: PackCode, 
        currency: str = "eur"
    ) -> Tuple[str, str, int, str, int]:
        """
        Crée un PaymentIntent Stripe pour un pack Luna
        
        Returns:
            (intent_id, client_secret, amount_cents, currency, energy_units)
        """
        try:
            amount_cents = get_pack_price(pack)
            energy_units = get_pack_energy(pack)
            
            # Métadonnées pour traçabilité
            metadata = {
                "user_id": user_id,
                "pack": pack,
                "energy_units": str(energy_units),
                "luna_hub_version": "1.0.0",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Clé d'idempotence pour éviter duplicatas
            idempotency_key = f"luna_intent_{user_id}_{pack}_{uuid.uuid4().hex[:8]}"
            
            logger.info("Creating Stripe PaymentIntent",
                       user_id=user_id,
                       pack=pack,
                       amount_cents=amount_cents,
                       currency=currency,
                       idempotency_key=idempotency_key)
            
            # Création PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                metadata=metadata,
                description=f"Luna Energy Pack: {pack}",
                idempotency_key=idempotency_key,
                # Configuration sécurisée
                confirm=False,
                capture_method="automatic"
            )
            
            logger.info("Stripe PaymentIntent created successfully",
                       intent_id=intent.id,
                       user_id=user_id,
                       pack=pack,
                       amount_cents=amount_cents)
            
            return (
                intent.id,
                intent.client_secret,
                amount_cents,
                currency,
                energy_units
            )
            
        except stripe.error.CardError as e:
            logger.error("Stripe card error", error=str(e), user_id=user_id)
            raise StripeError(f"Card error: {e.user_message}")
            
        except stripe.error.RateLimitError as e:
            logger.error("Stripe rate limit", error=str(e), user_id=user_id)
            raise StripeError("Too many requests, please try again later")
            
        except stripe.error.InvalidRequestError as e:
            logger.error("Stripe invalid request", error=str(e), user_id=user_id)
            raise StripeError(f"Invalid request: {str(e)}")
            
        except stripe.error.AuthenticationError as e:
            logger.error("Stripe authentication error", error=str(e))
            raise StripeError("Payment service authentication failed")
            
        except stripe.error.APIConnectionError as e:
            logger.error("Stripe connection error", error=str(e))
            raise StripeError("Payment service unavailable")
            
        except stripe.error.StripeError as e:
            logger.error("General Stripe error", error=str(e), user_id=user_id)
            raise StripeError(f"Payment error: {str(e)}")
            
        except Exception as e:
            logger.error("Unexpected error creating PaymentIntent", 
                        error=str(e), 
                        user_id=user_id,
                        pack=pack)
            raise StripeError("Unexpected payment error")
    
    @staticmethod
    def retrieve_payment_intent(intent_id: str) -> stripe.PaymentIntent:
        """
        Récupère un PaymentIntent Stripe
        """
        try:
            logger.info("Retrieving Stripe PaymentIntent", intent_id=intent_id)
            
            intent = stripe.PaymentIntent.retrieve(intent_id)
            
            logger.info("Stripe PaymentIntent retrieved",
                       intent_id=intent_id,
                       status=intent.status,
                       amount=intent.amount)
            
            return intent
            
        except stripe.error.InvalidRequestError as e:
            logger.error("PaymentIntent not found", intent_id=intent_id, error=str(e))
            raise StripeError(f"Payment not found: {intent_id}")
            
        except stripe.error.StripeError as e:
            logger.error("Error retrieving PaymentIntent", 
                        intent_id=intent_id, 
                        error=str(e))
            raise StripeError(f"Error retrieving payment: {str(e)}")
            
        except Exception as e:
            logger.error("Unexpected error retrieving PaymentIntent",
                        intent_id=intent_id,
                        error=str(e))
            raise StripeError("Unexpected error retrieving payment")
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, sig_header: str) -> Dict[str, Any]:
        """
        🔒 Vérifie la signature webhook Stripe avec protection anti-replay
        Conforme aux directives Oracle de sécurité
        """
        import time
        
        try:
            # 1. Vérification cryptographique Stripe (POINT 1)
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
            
            # 2. Protection contre les attaques par rejeu (POINT 2)
            event_timestamp = event.get('created', 0)
            current_timestamp = int(time.time())
            time_difference = abs(current_timestamp - event_timestamp)
            
            # Rejeter si événement trop ancien (> 5 minutes = 300 secondes)
            if time_difference > 300:
                logger.warning("Webhook event too old - replay attack suspected",
                             event_id=event.get('id'),
                             event_timestamp=event_timestamp,
                             current_timestamp=current_timestamp,
                             time_difference=time_difference)
                raise StripeError(f"Event too old: {time_difference}s ago")
            
            # 3. Log réussite avec audit trail complet (POINT 3)
            logger.info("Stripe webhook verified - security compliant",
                       event_type=event['type'],
                       event_id=event['id'],
                       event_timestamp=event_timestamp,
                       time_difference=time_difference,
                       security_status="verified")
            
            return event
            
        except ValueError as e:
            # Log erreur payload avec détails sécurité
            logger.error("Invalid webhook payload - security violation",
                        error=str(e),
                        payload_length=len(payload) if payload else 0,
                        has_signature=bool(sig_header),
                        security_status="payload_invalid")
            raise StripeError("Invalid webhook payload")
            
        except stripe.error.SignatureVerificationError as e:
            # Log tentative signature invalide (potentielle attaque)
            logger.error("Invalid webhook signature - potential attack",
                        error=str(e),
                        signature_header=sig_header[:20] + "..." if len(sig_header) > 20 else sig_header,
                        payload_length=len(payload) if payload else 0,
                        security_status="signature_invalid",
                        threat_level="high")
            raise StripeError("Invalid webhook signature")
    
    @staticmethod
    def cancel_payment_intent(intent_id: str, reason: str = "requested_by_customer") -> bool:
        """
        Annule un PaymentIntent
        """
        try:
            logger.info("Canceling PaymentIntent", intent_id=intent_id, reason=reason)
            
            intent = stripe.PaymentIntent.cancel(
                intent_id,
                cancellation_reason=reason
            )
            
            logger.info("PaymentIntent canceled successfully",
                       intent_id=intent_id,
                       status=intent.status)
            
            return True
            
        except stripe.error.InvalidRequestError as e:
            logger.error("Cannot cancel PaymentIntent", 
                        intent_id=intent_id, 
                        error=str(e))
            return False
            
        except Exception as e:
            logger.error("Error canceling PaymentIntent",
                        intent_id=intent_id,
                        error=str(e))
            return False
    
    @staticmethod
    def get_payment_stats(start_date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Récupère les statistiques de paiement
        """
        try:
            # Requête Stripe pour les charges depuis start_date
            params = {
                "limit": 100,
                "expand": ["data.payment_intent"]
            }
            
            if start_date:
                params["created"] = {"gte": int(start_date.timestamp())}
            
            charges = stripe.Charge.list(**params)
            
            # Calcul des statistiques
            total_amount = sum(charge.amount for charge in charges.data if charge.paid)
            total_count = len([charge for charge in charges.data if charge.paid])
            
            # Analyse par pack (via metadata)
            pack_counts = {}
            for charge in charges.data:
                if charge.paid and charge.payment_intent:
                    pi = charge.payment_intent
                    if hasattr(pi, 'metadata') and 'pack' in pi.metadata:
                        pack = pi.metadata['pack']
                        pack_counts[pack] = pack_counts.get(pack, 0) + 1
            
            popular_pack = max(pack_counts.items(), key=lambda x: x[1])[0] if pack_counts else None
            
            logger.info("Payment stats calculated",
                       total_amount=total_amount,
                       total_count=total_count,
                       popular_pack=popular_pack)
            
            return {
                "total_revenue_cents": total_amount,
                "total_transactions": total_count,
                "pack_distribution": pack_counts,
                "popular_pack": popular_pack,
                "period_start": start_date.isoformat() if start_date else None
            }
            
        except Exception as e:
            logger.error("Error calculating payment stats", error=str(e))
            return {
                "total_revenue_cents": 0,
                "total_transactions": 0,
                "pack_distribution": {},
                "popular_pack": None,
                "error": str(e)
            }
    
    @staticmethod
    def validate_pack_support(pack: PackCode) -> bool:
        """
        Valide qu'un pack est supporté par Stripe
        """
        supported_packs = ["cafe_luna", "petit_dej_luna", "repas_luna"]
        return pack in supported_packs
    
    # ============================================================================
    # MÉTHODES SUBSCRIPTION (LUNA UNLIMITED)
    # ============================================================================
    
    @staticmethod
    def create_subscription(
        user_id: str,
        customer_id: str, 
        plan: str = "luna_unlimited"
    ) -> Tuple[str, str, str, Optional[str]]:
        """
        Crée une Subscription Stripe pour Luna Unlimited
        
        Returns:
            (subscription_id, status, current_period_end, client_secret)
        """
        try:
            # Récupération du price_id depuis les variables d'environnement
            price_id = os.getenv("STRIPE_PRICE_UNLIMITED")
            if not price_id:
                raise StripeError("STRIPE_PRICE_UNLIMITED not configured")
            
            logger.info("Creating Stripe Subscription",
                       user_id=user_id,
                       customer_id=customer_id,
                       plan=plan,
                       price_id=price_id)
            
            # Création de la subscription
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"],
                metadata={
                    "user_id": user_id,
                    "plan": plan,
                    "luna_hub_version": "1.0.0",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            # Extraction du client_secret pour finalisation paiement
            client_secret = None
            if subscription.latest_invoice and subscription.latest_invoice.payment_intent:
                pi = subscription.latest_invoice.payment_intent
                if hasattr(pi, 'client_secret'):
                    client_secret = pi.client_secret
            
            # Formatage de current_period_end
            current_period_end = datetime.fromtimestamp(
                subscription.current_period_end, 
                tz=timezone.utc
            ).isoformat()
            
            logger.info("Stripe Subscription created successfully",
                       subscription_id=subscription.id,
                       user_id=user_id,
                       status=subscription.status,
                       current_period_end=current_period_end)
            
            return (
                subscription.id,
                subscription.status,
                current_period_end,
                client_secret
            )
            
        except stripe.error.InvalidRequestError as e:
            logger.error("Stripe invalid subscription request", 
                        error=str(e), 
                        user_id=user_id)
            raise StripeError(f"Invalid subscription request: {str(e)}")
            
        except stripe.error.StripeError as e:
            logger.error("General Stripe subscription error", 
                        error=str(e), 
                        user_id=user_id)
            raise StripeError(f"Subscription error: {str(e)}")
            
        except Exception as e:
            logger.error("Unexpected error creating subscription",
                        error=str(e),
                        user_id=user_id)
            raise StripeError("Unexpected subscription error")
    
    @staticmethod
    def create_customer(user_id: str, email: str) -> str:
        """
        Crée un Customer Stripe
        
        Returns:
            customer_id
        """
        try:
            logger.info("Creating Stripe Customer", user_id=user_id, email=email)
            
            customer = stripe.Customer.create(
                email=email,
                metadata={
                    "user_id": user_id,
                    "luna_hub_version": "1.0.0"
                }
            )
            
            logger.info("Stripe Customer created successfully",
                       customer_id=customer.id,
                       user_id=user_id)
            
            return customer.id
            
        except stripe.error.StripeError as e:
            logger.error("Error creating Stripe customer", error=str(e), user_id=user_id)
            raise StripeError(f"Customer creation error: {str(e)}")
    
    @staticmethod
    def retrieve_subscription(subscription_id: str) -> stripe.Subscription:
        """
        Récupère une Subscription Stripe
        """
        try:
            logger.info("Retrieving Stripe Subscription", subscription_id=subscription_id)
            
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            logger.info("Stripe Subscription retrieved",
                       subscription_id=subscription_id,
                       status=subscription.status)
            
            return subscription
            
        except stripe.error.InvalidRequestError as e:
            logger.error("Subscription not found", subscription_id=subscription_id, error=str(e))
            raise StripeError(f"Subscription not found: {subscription_id}")
            
        except stripe.error.StripeError as e:
            logger.error("Error retrieving subscription", 
                        subscription_id=subscription_id, 
                        error=str(e))
            raise StripeError(f"Error retrieving subscription: {str(e)}")
    
    @staticmethod
    def cancel_subscription(subscription_id: str, cancel_immediately: bool = False) -> stripe.Subscription:
        """
        Annule une Subscription Stripe
        """
        try:
            logger.info("Canceling Stripe Subscription",
                       subscription_id=subscription_id,
                       cancel_immediately=cancel_immediately)
            
            if cancel_immediately:
                # Annulation immédiate
                subscription = stripe.Subscription.delete(subscription_id)
            else:
                # Annulation à la fin de la période
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            
            logger.info("Stripe Subscription canceled successfully",
                       subscription_id=subscription_id,
                       status=subscription.status)
            
            return subscription
            
        except stripe.error.InvalidRequestError as e:
            logger.error("Cannot cancel subscription", 
                        subscription_id=subscription_id, 
                        error=str(e))
            raise StripeError(f"Cannot cancel subscription: {str(e)}")
            
        except stripe.error.StripeError as e:
            logger.error("Error canceling subscription",
                        subscription_id=subscription_id,
                        error=str(e))
            raise StripeError(f"Error canceling subscription: {str(e)}")
    
    @staticmethod
    def health_check() -> Dict[str, Any]:
        """
        Vérifie la santé de la connexion Stripe
        """
        try:
            # Test basique avec Stripe
            stripe.Account.retrieve()
            
            return {
                "status": "healthy",
                "stripe_connected": True,
                "environment": ENVIRONMENT,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except stripe.error.AuthenticationError:
            return {
                "status": "unhealthy",
                "stripe_connected": False,
                "error": "Authentication failed",
                "environment": ENVIRONMENT
            }
            
        except Exception as e:
            return {
                "status": "degraded",
                "stripe_connected": False,
                "error": str(e),
                "environment": ENVIRONMENT
            }