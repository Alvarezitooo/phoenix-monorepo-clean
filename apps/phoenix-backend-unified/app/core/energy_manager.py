"""
🌙 Phoenix Luna - Energy Manager
Logique métier centrale pour la gestion de l'énergie Luna
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.models.user_energy import (
    UserEnergyModel, 
    EnergyTransactionModel, 
    EnergyPurchaseModel,
    EnergyActionType,
    EnergyPackType,
    ENERGY_COSTS,
    ENERGY_PACKS
)
from app.core.supabase_client import event_store, sb
import structlog

# Logger structuré
logger = structlog.get_logger()


class EnergyManagerError(Exception):
    """Exception personnalisée pour les erreurs de gestion d'énergie"""
    pass


class InsufficientEnergyError(EnergyManagerError):
    """Erreur quand l'énergie est insuffisante"""
    pass


class EnergyManager:
    """
    Gestionnaire central de l'énergie Luna
    Implémente la logique métier selon la grille Oracle
    """
    
    def __init__(self):
        # TODO: Intégrer avec Supabase en Sprint 2
        # Pour l'instant, stockage en mémoire pour le développement
        self._user_energies: Dict[str, UserEnergyModel] = {}
        self._transactions: List[EnergyTransactionModel] = []
        self._purchases: List[EnergyPurchaseModel] = []
    
    async def _get_user_energy(self, user_id: str) -> Optional[UserEnergyModel]:
        """Méthode interne pour récupérer l'énergie utilisateur (mockable pour tests)"""
        return self._user_energies.get(user_id)
    
    async def _is_unlimited_user(self, user_id: str) -> bool:
        """
        🌙 Vérifie si un utilisateur a un abonnement Luna Unlimited actif
        Oracle-compliant : source unique de vérité depuis Supabase
        """
        try:
            user_result = sb.table("users").select(
                "subscription_type, is_active"
            ).eq("id", user_id).execute()
            
            if not user_result.data:
                return False
            
            user_data = user_result.data[0]
            subscription_type = user_data.get("subscription_type")
            is_active = user_data.get("is_active", True)
            
            # Unlimited actif si type=luna_unlimited ET utilisateur actif
            is_unlimited = (
                subscription_type == "luna_unlimited" and 
                is_active is True
            )
            
            logger.info("Unlimited status checked",
                       user_id=user_id,
                       subscription_type=subscription_type,
                       subscription_status=subscription_status,
                       is_unlimited=is_unlimited)
            
            return is_unlimited
            
        except Exception as e:
            logger.error("Error checking unlimited status", 
                        user_id=user_id, 
                        error=str(e))
            # En cas d'erreur, on considère que l'utilisateur n'est pas unlimited
            return False
    
    async def get_user_energy(self, user_id: str) -> UserEnergyModel:
        """Récupère l'énergie d'un utilisateur"""
        if user_id not in self._user_energies:
            # Nouvel utilisateur : créer avec énergie de départ
            self._user_energies[user_id] = UserEnergyModel(
                user_id=user_id,
                current_energy=85.0,  # Énergie de départ généreuse
                max_energy=100.0
            )
        
        return self._user_energies[user_id]
    
    async def check_balance(self, user_id: str) -> Dict[str, Any]:
        """Vérifie le solde d'énergie d'un utilisateur"""
        try:
            user_energy = await self._get_user_energy(user_id)
            if user_energy is None:
                user_energy = await self.get_user_energy(user_id)
        except Exception as e:
            raise EnergyManagerError(f"Database error: {str(e)}")
        
        return {
            "user_id": user_id,
            "current_energy": user_energy.current_energy,
            "max_energy": user_energy.max_energy,
            "percentage": (user_energy.current_energy / user_energy.max_energy) * 100,
            "can_perform_basic_action": user_energy.current_energy >= 5,
            "last_recharge": user_energy.last_recharge_date,
            "total_consumed": user_energy.total_consumed,
            "subscription_type": user_energy.subscription_type
        }
    
    async def can_perform_action(self, user_id: str, action_name: str) -> Dict[str, Any]:
        """
        ✅ Vérifie si un utilisateur peut effectuer une action
        🌙 Logique Unlimited Oracle-compliant : bypass complet + journalisation
        """
        if action_name not in ENERGY_COSTS:
            raise EnergyManagerError(f"Unknown action: {action_name}")
            
        energy_required = ENERGY_COSTS[action_name]
        
        # 🔥 ORACLE PRIORITY: Vérification Unlimited en premier (source unique de vérité)
        is_unlimited = await self._is_unlimited_user(user_id)
        
        if is_unlimited:
            # Utilisateur Unlimited : TOUJOURS autorisé, coût énergétique = 0
            logger.info("Unlimited user action authorized",
                       user_id=user_id,
                       action=action_name,
                       energy_required=energy_required,
                       unlimited=True)
            
            return {
                "user_id": user_id,
                "action": action_name,
                "energy_required": 0,  # Coût = 0 pour unlimited
                "current_energy": 999.0,  # Énergie = très élevée (JSON compliant)
                "can_perform": True,
                "deficit": 0.0,
                "unlimited": True,
                "subscription_type": "luna_unlimited"
            }
        
        # Utilisateur standard : logique énergie classique
        user_energy = await self._get_user_energy(user_id)
        if user_energy is None:
            user_energy = await self.get_user_energy(user_id)
        
        can_perform = user_energy.can_perform_action(energy_required)
        deficit = max(0, energy_required - user_energy.current_energy) if not can_perform else 0
        
        logger.info("Standard user action checked",
                   user_id=user_id,
                   action=action_name,
                   energy_required=energy_required,
                   current_energy=user_energy.current_energy,
                   can_perform=can_perform,
                   unlimited=False)
        
        return {
            "user_id": user_id,
            "action": action_name,
            "energy_required": energy_required,
            "current_energy": user_energy.current_energy,
            "can_perform": can_perform,
            "deficit": deficit,
            "unlimited": False,
            "subscription_type": user_energy.subscription_type
        }
    
    async def consume(
        self, 
        user_id: str, 
        action_name: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        ⚡ Consomme de l'énergie pour une action
        🌙 Cœur de la logique métier Luna avec gestion Unlimited Oracle-compliant
        """
        if action_name not in ENERGY_COSTS:
            raise EnergyManagerError(f"Unknown action: {action_name}")
            
        energy_required = ENERGY_COSTS[action_name]
        
        # 🔥 ORACLE PRIORITY: Vérification Unlimited en premier
        is_unlimited = await self._is_unlimited_user(user_id)
        
        if is_unlimited:
            # 🌙 UTILISATEUR UNLIMITED: Pas de décompte, mais ÉVÉNEMENT OBLIGATOIRE
            transaction_id = str(uuid.uuid4())
            
            # Création événement EnergyActionPerformed pour traçabilité complète
            try:
                await event_store.create_event(
                    user_id=user_id,
                    event_type="EnergyActionPerformed",
                    app_source=context.get("app_source") if context else "luna_hub",
                    event_data={
                        "transaction_id": transaction_id,
                        "action": action_name,
                        "energy_cost": 0,  # Coût = 0 pour unlimited
                        "energy_before": float('inf'),
                        "energy_after": float('inf'),
                        "unlimited": True,
                        "context": context or {}
                    },
                    metadata={
                        "energy_action": "consume_unlimited",
                        "action_category": "unlimited",
                        "original_cost": energy_required
                    }
                )
                
                logger.info("Unlimited user action performed",
                           user_id=user_id,
                           action=action_name,
                           transaction_id=transaction_id,
                           unlimited=True,
                           original_cost=energy_required)
                
            except Exception as e:
                logger.error("Error creating unlimited action event", 
                            user_id=user_id, 
                            action=action_name, 
                            error=str(e))
                # Ne pas bloquer l'action même si l'événement échoue
            
            return {
                "transaction_id": transaction_id,
                "energy_consumed": 0,
                "energy_remaining": float('inf'),
                "action": action_name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "unlimited": True,
                "subscription_type": "luna_unlimited"
            }
        
        # 💎 UTILISATEUR STANDARD: Logique énergie classique
        user_energy = await self._get_user_energy(user_id)
        if user_energy is None:
            user_energy = await self.get_user_energy(user_id)
            
        energy_before = user_energy.current_energy
        
        # Vérification + décompte
        if not user_energy.can_perform_action(energy_required):
            raise InsufficientEnergyError(
                f"Énergie insuffisante. Requis: {energy_required}%, "
                f"Disponible: {user_energy.current_energy}%"
            )
        
        # Consommation réelle
        success = user_energy.consume_energy(energy_required, reason=action_name)
        
        if not success:
            raise EnergyManagerError("Échec de la consommation d'énergie")
            
        energy_consumed = energy_required  # Toujours égal à energy_required après succès
        energy_after = user_energy.current_energy
        
        # Mettre à jour en base
        await self._update_user_energy(user_id, user_energy.current_energy)
        
        # 🎯 ORACLE: TOUJOURS enregistrer la transaction ET l'événement (même pour Unlimited)
        transaction = EnergyTransactionModel(
            transaction_id=str(uuid.uuid4()),
            user_id=user_id,
            action_type=EnergyActionType.CONSUME,
            amount=energy_consumed,  # 0 pour unlimited, energy_required pour standard
            reason=action_name,
            context=context or {},
            app_source=context.get("app_source") if context else None,
            feature_used=action_name,
            energy_before=energy_before,
            energy_after=energy_after
        )
        
        transaction_id = await self._create_transaction(transaction)
        
        # 🎯 ORACLE: Créer événement pour Capital Narratif (Sprint 2)
        await self._create_event_for_narrative(user_id, action_name, {
            "energy_required": energy_required,
            "energy_consumed": energy_consumed,
            "subscription_type": user_energy.subscription_type,
            "context": context or {}
        })
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "energy_consumed": energy_consumed,
            "energy_remaining": energy_after,
            "action": action_name,
            "subscription_type": user_energy.subscription_type,
            "timestamp": transaction.created_at.isoformat()
        }
    
    async def refund(
        self, 
        user_id: str, 
        amount: float, 
        reason: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Rembourse de l'énergie (ex: en cas d'erreur)"""
        user_energy = await self._get_user_energy(user_id)
        if user_energy is None:
            user_energy = await self.get_user_energy(user_id)
        energy_before = user_energy.current_energy
        
        # Remboursement
        user_energy.add_energy(amount, EnergyActionType.REFUND)
        
        # Mettre à jour en base
        await self._update_user_energy(user_id, user_energy.current_energy)
        
        # Transaction
        transaction = EnergyTransactionModel(
            transaction_id=str(uuid.uuid4()),
            user_id=user_id,
            action_type=EnergyActionType.REFUND,
            amount=amount,
            reason=reason,
            context=context or {},
            energy_before=energy_before,
            energy_after=user_energy.current_energy
        )
        
        transaction_id = await self._create_transaction(transaction)
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "energy_refunded": amount,
            "new_energy_balance": user_energy.current_energy,
            "reason": reason
        }
    
    async def purchase_energy(
        self, 
        user_id: str, 
        pack_type: EnergyPackType,
        stripe_payment_intent_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Achat d'énergie via packs Luna"""
        user_energy = await self._get_user_energy(user_id)
        if user_energy is None:
            user_energy = await self.get_user_energy(user_id)
            
        # Vérification abonnement unlimited
        if user_energy.subscription_type == "unlimited":
            raise EnergyManagerError("Users with unlimited subscription cannot purchase energy packs")
            
        pack_config = ENERGY_PACKS[pack_type]
        
        # Vérification pour abonnement unlimited
        if pack_type == EnergyPackType.LUNA_UNLIMITED:
            user_energy.subscription_type = "unlimited"
            user_energy.max_energy = float('inf')
            user_energy.current_energy = 100.0  # Reset à 100% pour unlimited
        else:
            energy_to_add = pack_config["energy_amount"]
            
            # Bonus premier achat Café Luna
            bonus = 0.0
            if (pack_type == EnergyPackType.CAFE_LUNA and 
                user_energy.total_purchased == 0):
                bonus = pack_config["bonus_first_purchase"]
                energy_to_add += bonus
            
            user_energy.add_energy(energy_to_add, EnergyActionType.PURCHASE)
        
        # Traitement paiement Stripe
        payment_success = await self._process_stripe_payment(stripe_payment_intent_id)
        if not payment_success:
            raise EnergyManagerError("Payment processing failed")
        
        # Enregistrement achat
        purchase = EnergyPurchaseModel(
            purchase_id=str(uuid.uuid4()),
            user_id=user_id,
            pack_type=pack_type,
            amount_euro=pack_config["price_euro"],
            energy_amount=pack_config["energy_amount"],
            stripe_payment_intent_id=stripe_payment_intent_id,
            payment_status="completed",
            bonus_energy=bonus if 'bonus' in locals() else 0.0,
            processed_at=datetime.now(timezone.utc)
        )
        
        purchase_id = await self._create_purchase_record(purchase)
        
        return {
            "success": True,
            "purchase_id": purchase_id,
            "pack_type": pack_type.value,
            "energy_added": pack_config["energy_amount"],
            "bonus_energy": purchase.bonus_energy,
            "current_energy": user_energy.current_energy,
            "amount_paid": pack_config["price_euro"]
        }
    
    async def get_user_transactions(
        self, 
        user_id: str, 
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Récupère l'historique des transactions d'un utilisateur"""
        return await self._fetch_user_transactions(user_id, limit)
    
    async def get_energy_analytics(self, user_id: str) -> Dict[str, Any]:
        """Analytics de consommation d'énergie pour un utilisateur"""
        return await self._calculate_analytics(user_id)
    
    # Helper methods for tests and internal use
    async def _update_user_energy(self, user_id: str, new_energy: float) -> bool:
        """Met à jour l'énergie d'un utilisateur"""
        if user_id in self._user_energies:
            self._user_energies[user_id].current_energy = new_energy
            return True
        return False
    
    async def _create_transaction(self, transaction: EnergyTransactionModel) -> str:
        """Crée une transaction d'énergie"""
        self._transactions.append(transaction)
        return transaction.transaction_id
    
    async def _process_stripe_payment(self, payment_intent_id: str) -> bool:
        """Mock pour traitement paiement Stripe (implémentation Sprint 4)"""
        return True
    
    async def _create_purchase_record(self, purchase: EnergyPurchaseModel) -> str:
        """Enregistre un achat d'énergie"""
        self._purchases.append(purchase)
        return purchase.purchase_id
    
    async def _fetch_user_transactions(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Récupère les transactions depuis la base de données"""
        user_transactions = [
            tx for tx in self._transactions 
            if tx.user_id == user_id
        ]
        
        # Tri par date décroissante
        user_transactions.sort(key=lambda x: x.created_at, reverse=True)
        
        return [
            {
                "transaction_id": tx.transaction_id,
                "action_type": tx.action_type.value,
                "amount": tx.amount,
                "reason": tx.reason,
                "app_source": tx.app_source,
                "feature_used": tx.feature_used,
                "energy_before": tx.energy_before,
                "energy_after": tx.energy_after,
                "created_at": tx.created_at.isoformat(),
                "context": tx.context
            }
            for tx in user_transactions[:limit]
        ]
    
    async def _calculate_analytics(self, user_id: str) -> Dict[str, Any]:
        """Calcule les analytics d'un utilisateur"""
        transactions = await self._fetch_user_transactions(user_id, limit=1000)
        user_energy = await self._get_user_energy(user_id)
        if user_energy is None:
            user_energy = await self.get_user_energy(user_id)
        
        # Calculs analytics
        total_consumed = sum(tx["amount"] for tx in transactions if tx["action_type"] == "consume")
        total_purchased = sum(tx["amount"] for tx in transactions if tx["action_type"] == "purchase")
        
        # Top actions
        action_counts = {}
        for tx in transactions:
            if tx["action_type"] == "consume":
                action = tx["feature_used"]
                action_counts[action] = action_counts.get(action, 0) + 1
        
        top_actions = sorted(action_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "user_id": user_id,
            "current_energy": user_energy.current_energy,
            "total_consumed": total_consumed,
            "total_purchased": total_purchased,
            "total_transactions": len(transactions),
            "top_actions": [{"action": action, "count": count} for action, count in top_actions],
            "subscription_type": user_energy.subscription_type,
            "member_since": user_energy.created_at.isoformat()
        }
    
    def _calculate_percentage(self, current: float, maximum: float) -> float:
        """Calcule le pourcentage d'énergie"""
        if maximum == 0:
            return 0.0
        if maximum == float('inf'):
            return 100.0
        return round((current / maximum) * 100, 2)
    
    def _generate_transaction_id(self) -> str:
        """Génère un ID de transaction unique"""
        return f"luna_{uuid.uuid4().hex[:8]}_{int(datetime.now().timestamp())}"
    
    async def _create_event_for_narrative(self, user_id: str, action_name: str, event_data: Dict[str, Any]) -> str:
        """
        🎯 ORACLE: Crée un événement pour le Capital Narratif avec Supabase Event Store
        Sprint 2: Vraie implémentation avec stockage persistant
        """
        try:
            event_id = await event_store.create_event(
                user_id=user_id,
                event_type="EnergyAction",
                app_source=event_data.get("context", {}).get("app_source", "luna_hub"),
                event_data={
                    "action": action_name,
                    "energy_required": event_data["energy_required"], 
                    "energy_consumed": event_data["energy_consumed"],
                    "subscription_type": event_data["subscription_type"],
                    "context": event_data["context"]
                },
                metadata={
                    "luna_version": "1.0.0",
                    "energy_manager": True
                }
            )
            
            logger.info(
                "Event created for Capital Narratif",
                event_id=event_id,
                user_id=user_id,
                action=action_name
            )
            
            return event_id
            
        except Exception as e:
            logger.error(
                "Failed to create event for Capital Narratif",
                user_id=user_id,
                action=action_name,
                error=str(e)
            )
            # En cas d'erreur, continuer sans bloquer l'action
            return f"fallback_{uuid.uuid4().hex[:8]}"


# Instance globale du gestionnaire d'énergie
energy_manager = EnergyManager()