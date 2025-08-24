"""
🌙 Phoenix Luna - User Energy Model
Modèle de données pour l'énergie Luna
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class EnergyActionType(str, Enum):
    """Types d'actions sur l'énergie"""
    CONSUME = "consume"
    REFUND = "refund"
    PURCHASE = "purchase"
    BONUS = "bonus"


class EnergyPackType(str, Enum):
    """Types de packs d'énergie Luna"""
    CAFE_LUNA = "cafe_luna"          # 2,99€ = 100% énergie
    PETIT_DEJ_LUNA = "petit_dej_luna"  # 5,99€ = 100% énergie
    REPAS_LUNA = "repas_luna"        # 9,99€ = 100% énergie
    LUNA_UNLIMITED = "luna_unlimited"  # 29,99€/mois = illimité


class UserEnergyModel(BaseModel):
    """Modèle principal de l'énergie utilisateur"""
    
    user_id: str = Field(..., description="ID unique de l'utilisateur")
    current_energy: float = Field(default=100.0, ge=0, le=100, description="Énergie actuelle (0-100%)")
    max_energy: float = Field(default=100.0, description="Énergie maximum")
    last_recharge_date: Optional[datetime] = Field(None, description="Date du dernier rechargement")
    total_purchased: float = Field(default=0.0, description="Total d'énergie achetée")
    total_consumed: float = Field(default=0.0, description="Total d'énergie consommée")
    subscription_type: Optional[str] = Field(None, description="Type d'abonnement (premium, etc.)")
    
    # Méta-données
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    def can_perform_action(self, energy_required: float) -> bool:
        """Vérifie si l'utilisateur peut effectuer une action"""
        return self.current_energy >= energy_required
    
    def consume_energy(self, amount: float, reason: Optional[str] = None) -> bool:
        """Consomme de l'énergie"""
        if not self.can_perform_action(amount):
            return False
        
        self.current_energy = max(0, self.current_energy - amount)
        self.total_consumed += amount
        self.updated_at = datetime.now(timezone.utc)
        return True
    
    def add_energy(self, amount: float, action_type: EnergyActionType = EnergyActionType.PURCHASE):
        """Ajoute de l'énergie"""
        self.current_energy = min(self.max_energy, self.current_energy + amount)
        
        if action_type == EnergyActionType.PURCHASE:
            self.total_purchased += amount
            self.last_recharge_date = datetime.now(timezone.utc)
        
        self.updated_at = datetime.now(timezone.utc)


class EnergyTransactionModel(BaseModel):
    """Modèle pour les transactions d'énergie"""
    
    transaction_id: str = Field(..., description="ID unique de la transaction")
    user_id: str = Field(..., description="ID de l'utilisateur")
    action_type: EnergyActionType = Field(..., description="Type d'action")
    amount: float = Field(..., description="Montant d'énergie")
    reason: Optional[str] = Field(None, description="Raison de la transaction")
    
    # Contexte de la transaction
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Contexte métier")
    app_source: Optional[str] = Field(None, description="App d'origine (letters, cv, etc.)")
    feature_used: Optional[str] = Field(None, description="Fonctionnalité utilisée")
    
    # État avant/après
    energy_before: float = Field(..., description="Énergie avant transaction")
    energy_after: float = Field(..., description="Énergie après transaction")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class EnergyPurchaseModel(BaseModel):
    """Modèle pour les achats d'énergie"""
    
    purchase_id: str = Field(..., description="ID unique de l'achat")
    user_id: str = Field(..., description="ID de l'utilisateur")
    pack_type: EnergyPackType = Field(..., description="Type de pack acheté")
    
    # Détails financiers
    amount_euro: float = Field(..., description="Montant en euros")
    energy_amount: float = Field(..., description="Quantité d'énergie achetée")
    
    # Détails Stripe
    stripe_payment_intent_id: Optional[str] = Field(None, description="ID Stripe du paiement")
    payment_status: str = Field(default="pending", description="Statut du paiement")
    
    # Bonus
    bonus_energy: float = Field(default=0.0, description="Énergie bonus (premier achat, etc.)")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed_at: Optional[datetime] = Field(None, description="Date de traitement")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Configuration des coûts d'énergie selon la grille Oracle
ENERGY_COSTS = {
    # Actions simples (5-10%)
    "conseil_rapide": 5,
    "correction_ponctuelle": 5,
    "format_lettre": 8,
    "verification_format": 3,        # Phoenix CV - Vérification format gratuite
    
    # Actions moyennes (10-20%)
    "lettre_motivation": 15,
    "optimisation_cv": 12,
    "analyse_offre": 10,
    
    # Actions complexes (20-40%)
    "analyse_cv_complete": 25,
    "mirror_match": 30,
    "salary_analysis": 20,           # Phoenix CV - Analyse salariale
    "transition_carriere": 35,       # Phoenix Letters - Stratégie reconversion
    "strategie_candidature": 35,
    
    # Actions premium (35-50%)
    "audit_complet_profil": 45,
    "plan_reconversion": 50,
    "simulation_entretien": 40,
}

# Configuration des packs d'énergie
ENERGY_PACKS = {
    EnergyPackType.CAFE_LUNA: {
        "price_euro": 2.99,
        "energy_amount": 100.0,
        "bonus_first_purchase": 10.0,
        "name": "Café Luna"
    },
    EnergyPackType.PETIT_DEJ_LUNA: {
        "price_euro": 5.99,
        "energy_amount": 100.0,
        "bonus_first_purchase": 0.0,
        "name": "Petit-déj Luna",
        "popular": True
    },
    EnergyPackType.REPAS_LUNA: {
        "price_euro": 9.99,
        "energy_amount": 100.0,
        "bonus_first_purchase": 0.0,
        "name": "Repas Luna",
        "best_deal": True
    },
    EnergyPackType.LUNA_UNLIMITED: {
        "price_euro": 29.99,
        "energy_amount": -1,  # Illimité
        "name": "Luna Unlimited",
        "subscription": True
    }
}