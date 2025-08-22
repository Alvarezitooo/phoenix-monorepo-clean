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
from ..models.billing import PackCode, get_pack_price, get_pack_energy

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
        Vérifie la signature webhook Stripe
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
            
            logger.info("Stripe webhook verified",
                       event_type=event['type'],
                       event_id=event['id'])
            
            return event
            
        except ValueError as e:
            logger.error("Invalid webhook payload", error=str(e))
            raise StripeError("Invalid webhook payload")
            
        except stripe.error.SignatureVerificationError as e:
            logger.error("Invalid webhook signature", error=str(e))
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