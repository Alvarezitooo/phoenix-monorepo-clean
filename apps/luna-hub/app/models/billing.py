"""
💳 Modèles Billing Phoenix Luna Hub
Intégration Stripe sécurisée conforme Directive Oracle
"""

from __future__ import annotations
from pydantic import BaseModel, Field, validator
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime

# Codes officiels des packs Luna (alignés UI/UX)
PackCode = Literal["cafe_luna", "petit_dej_luna", "repas_luna", "luna_unlimited"]

class CreateIntentInput(BaseModel):
    """Requête création PaymentIntent Stripe"""
    user_id: str = Field(..., description="UUID utilisateur", min_length=1)
    pack: PackCode = Field(..., description="Code du pack Luna")
    currency: str = Field("eur", description="Devise ISO 3166", pattern=r"^[a-z]{3}$")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        """Validation UUID format"""
        import uuid
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError("user_id must be a valid UUID")

class CreateIntentOutput(BaseModel):
    """Réponse création PaymentIntent"""
    success: bool = True
    intent_id: str = Field(..., description="ID PaymentIntent Stripe")
    client_secret: str = Field(..., description="Client secret pour frontend")
    amount: int = Field(..., description="Montant en centimes")
    currency: str = Field(..., description="Devise")
    pack: PackCode = Field(..., description="Pack sélectionné")
    energy_units: int = Field(..., description="Unités d'énergie du pack")

class ConfirmPaymentInput(BaseModel):
    """Requête confirmation paiement"""
    user_id: str = Field(..., description="UUID utilisateur")
    intent_id: str = Field(..., description="ID PaymentIntent Stripe", min_length=1)
    
    @validator('user_id')
    def validate_user_id(cls, v):
        import uuid
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError("user_id must be a valid UUID")

class ConfirmPaymentOutput(BaseModel):
    """Réponse confirmation paiement"""
    success: bool = True
    status: str = Field(..., description="Statut de l'opération")
    energy_added: int = Field(..., description="Énergie ajoutée")
    bonus_applied: bool = Field(default=False, description="Bonus premier achat appliqué")
    bonus_units: int = Field(default=0, description="Unités bonus accordées")
    new_energy_balance: int = Field(..., description="Nouveau solde énergétique")
    event_id: str = Field(..., description="ID événement Event Store")
    transaction_id: Optional[str] = Field(None, description="ID transaction interne")

class PurchaseHistoryOutput(BaseModel):
    """Historique des achats utilisateur"""
    success: bool = True
    user_id: str
    total_purchases: int = Field(..., description="Nombre total d'achats")
    total_spent_cents: int = Field(..., description="Total dépensé en centimes")
    total_energy_purchased: int = Field(..., description="Total énergie achetée")
    purchases: List[Dict[str, Any]] = Field(..., description="Liste des achats")

class RefundRequestInput(BaseModel):
    """Requête de remboursement énergie"""
    user_id: str = Field(..., description="UUID utilisateur")
    action_event_id: str = Field(..., description="ID événement EnergyConsumed à rembourser")
    reason: Optional[str] = Field(None, description="Raison du remboursement", max_length=280)
    
    @validator('user_id')
    def validate_user_id(cls, v):
        import uuid
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError("user_id must be a valid UUID")

class RefundRequestOutput(BaseModel):
    """Réponse remboursement énergie"""
    success: bool = True
    status: str = Field(..., description="Statut du remboursement")
    refunded_units: int = Field(..., description="Unités remboursées")
    new_energy_balance: int = Field(..., description="Nouveau solde")
    refund_event_id: str = Field(..., description="ID événement remboursement")
    original_action: Optional[str] = Field(None, description="Action originale remboursée")

class PackInfo(BaseModel):
    """Informations sur un pack Luna"""
    code: PackCode
    name: str
    description: str
    price_cents: int
    energy_units: int
    savings_vs_cafe: Optional[float] = None
    popular: bool = False
    features: List[str] = []

class BillingStatsOutput(BaseModel):
    """Statistiques billing pour analytics"""
    success: bool = True
    total_revenue_cents: int
    total_transactions: int
    total_energy_sold: int
    popular_pack: str
    conversion_rate: float
    refund_rate: float
    first_purchase_bonus_applied: int

# ============================================================================
# MODÈLES SUBSCRIPTION (LUNA UNLIMITED)
# ============================================================================

class CreateSubscriptionInput(BaseModel):
    """Requête création Subscription Stripe pour Luna Unlimited"""
    user_id: str = Field(..., description="UUID utilisateur", min_length=1)
    plan: Literal["luna_unlimited"] = Field(..., description="Plan d'abonnement")
    currency: str = Field("eur", description="Devise ISO 3166", pattern=r"^[a-z]{3}$")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        """Validation UUID format"""
        import uuid
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError("user_id must be a valid UUID")

class CreateSubscriptionOutput(BaseModel):
    """Réponse création Subscription"""
    success: bool = True
    subscription_id: str = Field(..., description="ID Subscription Stripe")
    client_secret: str = Field(..., description="Client secret pour frontend")
    status: str = Field(..., description="Statut de l'abonnement")
    plan: str = Field(..., description="Plan souscrit")
    price_cents: int = Field(..., description="Prix mensuel en centimes")
    current_period_end: str = Field(..., description="Fin de la période actuelle")

class SubscriptionStatusOutput(BaseModel):
    """Statut de l'abonnement utilisateur"""
    success: bool = True
    user_id: str
    has_active_subscription: bool
    subscription_id: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    current_period_end: Optional[str] = None
    cancel_at_period_end: Optional[bool] = None

class CancelSubscriptionInput(BaseModel):
    """Requête annulation d'abonnement"""
    user_id: str = Field(..., description="UUID utilisateur")
    subscription_id: str = Field(..., description="ID Subscription Stripe")
    cancel_immediately: bool = Field(False, description="Annuler immédiatement ou à la fin de la période")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        import uuid
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError("user_id must be a valid UUID")

class CancelSubscriptionOutput(BaseModel):
    """Réponse annulation d'abonnement"""
    success: bool = True
    subscription_id: str
    status: str
    canceled_at: str
    ends_at: Optional[str] = None

# Constantes des packs
PACK_CATALOG: Dict[PackCode, PackInfo] = {
    "cafe_luna": PackInfo(
        code="cafe_luna",
        name="☕ Café Luna",
        description="Pack découverte parfait pour commencer",
        price_cents=299,
        energy_units=100,
        popular=True,
        features=["Bonus +10% premier achat", "Idéal pour tester", "Support communauté"]
    ),
    "petit_dej_luna": PackInfo(
        code="petit_dej_luna", 
        name="🥐 Petit-déj Luna",
        description="L'essentiel pour une semaine productive",
        price_cents=599,
        energy_units=220,
        savings_vs_cafe=15.0,
        features=["Économie 15% vs Café", "Semaine complète", "Accès prioritaire"]
    ),
    "repas_luna": PackInfo(
        code="repas_luna",
        name="🍕 Repas Luna", 
        description="Pack complet pour utilisateurs intensifs",
        price_cents=999,
        energy_units=400,
        savings_vs_cafe=33.0,
        popular=True,
        features=["Économie 33% vs Café", "Utilisateur power", "Fonctionnalités avancées"]
    ),
    "luna_unlimited": PackInfo(
        code="luna_unlimited",
        name="🌙 Luna Unlimited",
        description="Accès illimité à toutes les fonctionnalités Phoenix",
        price_cents=2999,  # 29.99€/mois
        energy_units=-1,  # -1 = illimité
        savings_vs_cafe=90.0,
        popular=True,
        features=["Énergie illimitée", "Accès prioritaire", "Support premium", "Fonctionnalités exclusives"]
    )
}

# Validation des constantes
def get_pack_info(pack_code: PackCode) -> PackInfo:
    """Récupère les informations d'un pack"""
    return PACK_CATALOG[pack_code]

def get_pack_price(pack_code: PackCode) -> int:
    """Récupère le prix d'un pack en centimes"""
    return PACK_CATALOG[pack_code].price_cents

def get_pack_energy(pack_code: PackCode) -> int:
    """Récupère les unités d'énergie d'un pack"""
    return PACK_CATALOG[pack_code].energy_units

def calculate_first_purchase_bonus(pack_code: PackCode, base_energy: int) -> int:
    """Calcule le bonus premier achat (seulement pour café)"""
    if pack_code == "cafe_luna":
        return round(base_energy * 0.10)  # +10% pour le café
    return 0

# ============================================================================
# FONCTIONS HELPER SUBSCRIPTION
# ============================================================================

def get_subscription_price(plan: Literal["luna_unlimited"]) -> int:
    """Récupère le prix d'un plan de subscription en centimes"""
    if plan == "luna_unlimited":
        return PACK_CATALOG["luna_unlimited"].price_cents
    raise ValueError(f"Unknown subscription plan: {plan}")

def is_unlimited_plan(plan: str) -> bool:
    """Vérifie si un plan est de type unlimited"""
    return plan == "luna_unlimited"

def get_subscription_features(plan: Literal["luna_unlimited"]) -> List[str]:
    """Récupère les fonctionnalités d'un plan de subscription"""
    if plan == "luna_unlimited":
        return PACK_CATALOG["luna_unlimited"].features
    return []