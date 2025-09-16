"""
🌙 Phoenix Luna - Energy Manager
Logique métier centrale pour la gestion de l'énergie Luna
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.models.user_energy import UserEnergyModel, EnergyTransactionModel, EnergyActionType, ENERGY_COSTS
from app.core.supabase_client import event_store, sb
import structlog

logger = structlog.get_logger()

class EnergyManagerError(Exception):
    pass

class InsufficientEnergyError(EnergyManagerError):
    pass

class EnergyManager:
    def __init__(self):
        logger.info("EnergyManager initialized with DB persistence.")

    async def _get_user_energy(self, user_id: str) -> Optional[UserEnergyModel]:
        """Get user energy profile from database."""
        try:
            result = sb.table("user_energy").select("*").eq("user_id", user_id).execute()
            if result.data:
                energy_data = result.data[0]
                return UserEnergyModel(**energy_data)
            return None
        except Exception as e:
            logger.error("Error fetching user energy", user_id=user_id, error=str(e))
            return None

    async def _is_unlimited_user(self, user_id: str) -> bool:
        """Check if user has unlimited subscription."""
        try:
            result = sb.table("user_energy").select("subscription_type").eq("user_id", user_id).execute()
            if result.data:
                subscription_type = result.data[0].get("subscription_type")
                return subscription_type == "luna_unlimited"
            return False
        except Exception as e:
            logger.error("Error checking unlimited status", user_id=user_id, error=str(e))
            return False

    async def consume(self, user_id: str, action_name: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if action_name not in ENERGY_COSTS:
            raise EnergyManagerError(f"Unknown action: {action_name}")

        if await self._is_unlimited_user(user_id):
            return await self._handle_unlimited_consumption(user_id, action_name, context)
        else:
            return await self._handle_standard_consumption(user_id, action_name, context)

    async def _handle_unlimited_consumption(self, user_id: str, action_name: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Handles consumption for unlimited users (event only)."""
        logger.info("Unlimited user action authorized", user_id=user_id, action=action_name)
        transaction_id = str(uuid.uuid4())
        await self._create_narrative_event(user_id, action_name, 0, context, is_unlimited=True)
        
        return {
            "transaction_id": transaction_id,
            "energy_consumed": 0,
            "energy_remaining": 999.0,
            "unlimited": True,
            "action": action_name,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def _handle_standard_consumption(self, user_id: str, action_name: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Handles energy consumption for standard users atomically."""
        user_energy = await self._get_user_energy(user_id)
        if not user_energy:
            # This should ideally not happen if user exists
            raise EnergyManagerError(f"User energy profile not found for user {user_id}")

        energy_required = ENERGY_COSTS[action_name]
        if user_energy.current_energy < energy_required:
            raise InsufficientEnergyError("Insufficient energy")

        energy_before = user_energy.current_energy
        energy_after = energy_before - energy_required

        try:
            # This is the atomic transaction part
            transaction_id = str(uuid.uuid4())
            await self._execute_atomic_consumption(user_id, action_name, energy_required, energy_before, energy_after, context)
            return {
                "transaction_id": transaction_id,
                "energy_consumed": energy_required,
                "energy_remaining": energy_after,
                "unlimited": False,
                "action": action_name,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error("Atomic consumption failed", user_id=user_id, action=action_name, error=str(e))
            # The transaction logic in _execute_atomic_consumption should handle reverts.
            raise EnergyManagerError(f"Failed to process energy transaction: {e}")

    async def _execute_atomic_consumption(self, user_id, action_name, energy_consumed, energy_before, energy_after, context):
        """REFACTORED: Executes energy update and event creation as a single logical unit."""
        # In a real SQL DB, this would be a BEGIN/COMMIT/ROLLBACK transaction.
        # Here, we simulate it by performing critical operations and attempting to revert on failure.
        
        # 1. Update user energy in the database
        update_data = {"current_energy": energy_after}
        updated_user = sb.table("user_energy").update(update_data).eq("user_id", user_id).execute()

        if not updated_user.data:
            raise EnergyManagerError("Failed to update user energy in DB.")

        # 2. Create the narrative event
        try:
            await self._create_narrative_event(user_id, action_name, energy_consumed, context)
        except Exception as event_error:
            logger.error("Failed to create narrative event, attempting to revert energy consumption.", user_id=user_id, error=str(event_error))
            # Attempt to revert the energy change - récupérer d'abord la valeur actuelle
            try:
                current_result = sb.table("user_energy").select("total_consumed").eq("user_id", user_id).execute()
                if current_result.data:
                    current_total = current_result.data[0]["total_consumed"]
                    new_total = max(0, current_total - energy_consumed)  # Éviter les valeurs négatives
                    revert_data = {"current_energy": energy_before, "total_consumed": new_total}
                else:
                    revert_data = {"current_energy": energy_before}
                sb.table("user_energy").update(revert_data).eq("user_id", user_id).execute()
            except Exception as revert_error:
                logger.error("Failed to revert energy consumption", user_id=user_id, error=str(revert_error))
            raise EnergyManagerError(f"Event creation failed, energy consumption reverted. Original error: {event_error}")

    async def _create_narrative_event(self, user_id: str, action_name: str, energy_consumed: float, context: Optional[Dict[str, Any]], is_unlimited: bool = False):
        """Helper to create a standardized narrative event for an action."""
        event_data = {
            "action": action_name,
            "energy_consumed": energy_consumed,
            "unlimited_user": is_unlimited,
            "context": context or {}
        }
        await event_store.create_event(
            user_id=user_id,
            event_type="EnergyActionPerformed",
            app_source=context.get("app_source", "luna_hub") if context else "luna_hub",
            event_data=event_data
        )
    
    async def initialize_user_energy(self, user_id: str) -> bool:
        """Initialize energy profile for new user with default values."""
        try:
            # Check if user already has energy profile
            existing = sb.table("user_energy").select("*").eq("user_id", user_id).execute()
            if existing.data:
                return True  # Already exists
            
            # Create new energy profile with default values
            energy_profile = {
                "user_id": user_id,
                "current_energy": 100.0,  # Start with full energy
                "max_energy": 100.0,
                "total_purchased": 0.0,
                "total_consumed": 0.0,
                "subscription_type": None,
                "last_recharge_date": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = sb.table("user_energy").insert(energy_profile).execute()
            logger.info("Energy profile created for user", user_id=user_id, success=bool(result.data))
            return bool(result.data)
            
        except Exception as e:
            logger.error("Failed to initialize user energy profile", user_id=user_id, error=str(e))
            return False
    
    async def check_balance(self, user_id: str) -> Dict[str, Any]:
        """Check user's current energy balance."""
        try:
            # Auto-initialize if needed
            energy_profile = await self._get_user_energy(user_id)
            if not energy_profile:
                await self.initialize_user_energy(user_id)
                energy_profile = await self._get_user_energy(user_id)
            
            if not energy_profile:
                raise EnergyManagerError("Could not initialize energy profile")
            
            is_unlimited = await self._is_unlimited_user(user_id)
            
            return {
                "success": True,
                "user_id": user_id,
                "current_energy": energy_profile.current_energy,
                "max_energy": energy_profile.max_energy,
                "percentage": (energy_profile.current_energy / energy_profile.max_energy) * 100,
                "can_perform_basic_action": energy_profile.current_energy >= 5,  # Minimum action cost
                "last_recharge": energy_profile.last_recharge_date.isoformat() if energy_profile.last_recharge_date and hasattr(energy_profile.last_recharge_date, 'isoformat') else energy_profile.last_recharge_date,
                "total_consumed": energy_profile.total_consumed,
                "subscription_type": energy_profile.subscription_type,
                "unlimited": is_unlimited
            }
            
        except Exception as e:
            logger.error("Error checking energy balance", user_id=user_id, error=str(e))
            raise EnergyManagerError(f"Failed to check energy balance: {str(e)}")
    
    async def check_energy(self, user_id: str, estimated_cost: float) -> Any:
        """Check if user has enough energy for an action - compatible with orchestrator."""
        try:
            balance = await self.check_balance(user_id)
            current_energy = balance["current_energy"]
            can_proceed = current_energy >= estimated_cost or balance["unlimited"]
            
            # Return object with can_proceed and current attributes for orchestrator compatibility
            class EnergyCheckResult:
                def __init__(self, can_proceed: bool, current: float, unlimited: bool = False):
                    self.can_proceed = can_proceed
                    self.current = current
                    self.unlimited = unlimited
            
            return EnergyCheckResult(
                can_proceed=can_proceed,
                current=current_energy,
                unlimited=balance["unlimited"]
            )
            
        except Exception as e:
            logger.error("Error checking energy for action", user_id=user_id, cost=estimated_cost, error=str(e))
            # Return safe default that blocks action
            class EnergyCheckResult:
                def __init__(self, can_proceed: bool, current: float, unlimited: bool = False):
                    self.can_proceed = can_proceed
                    self.current = current
                    self.unlimited = unlimited
            
            return EnergyCheckResult(can_proceed=False, current=0, unlimited=False)
    
    async def add_energy(self, user_id: str, amount: float, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Ajoute de l'énergie au compte utilisateur (achat, remboursement, etc.)."""
        try:
            # Auto-initialize if needed
            energy_profile = await self._get_user_energy(user_id)
            if not energy_profile:
                await self.initialize_user_energy(user_id)
                energy_profile = await self._get_user_energy(user_id)
            
            if not energy_profile:
                raise EnergyManagerError("Could not initialize energy profile")
            
            energy_before = energy_profile.current_energy
            max_energy_before = energy_profile.max_energy
            
            # Si c'est un achat d'énergie (pas un remboursement), augmenter le max_energy  
            if context and context.get("source") == "pack_purchase":
                new_max_energy = max_energy_before + amount
                energy_after = energy_before + amount
                energy_actually_added = amount
            else:
                # Pour les remboursements, garder le plafond existant
                energy_after = min(energy_profile.max_energy, energy_before + amount)
                energy_actually_added = energy_after - energy_before
                new_max_energy = max_energy_before
            
            # Update in database
            update_data = {
                "current_energy": energy_after,
                "max_energy": new_max_energy,
                "total_purchased": sb.table("user_energy").select("total_purchased").eq("user_id", user_id).execute().data[0]["total_purchased"] + amount,
                "last_recharge_date": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = sb.table("user_energy").update(update_data).eq("user_id", user_id).execute()
            if not result.data:
                raise EnergyManagerError("Failed to update user energy in DB.")
            
            # Create narrative event
            await self._create_narrative_event(
                user_id=user_id,
                action_name="energy_purchase",
                energy_consumed=-amount,  # Negative = added
                context=context or {"source": "energy_purchase", "amount_added": amount}
            )
            
            logger.info("Energy added successfully", 
                       user_id=user_id, 
                       amount_requested=amount,
                       amount_added=energy_actually_added,
                       energy_before=energy_before,
                       energy_after=energy_after)
            
            return {
                "success": True,
                "current_energy": energy_after,
                "amount_added": energy_actually_added,
                "was_capped": energy_actually_added < amount
            }
            
        except Exception as e:
            logger.error("Error adding energy", user_id=user_id, amount=amount, error=str(e))
            raise EnergyManagerError(f"Failed to add energy: {str(e)}")
    
    async def purchase_energy(self, user_id: str, pack_type: str, stripe_payment_intent_id: Optional[str] = None) -> Dict[str, Any]:
        """Achat d'un pack d'énergie avec validation Stripe."""
        from app.models.user_energy import ENERGY_PACKS
        
        try:
            if pack_type not in ENERGY_PACKS:
                raise EnergyManagerError(f"Unknown pack type: {pack_type}")
            
            pack_config = ENERGY_PACKS[pack_type]
            energy_amount = pack_config["energy_amount"]
            bonus_energy = pack_config.get("bonus_first_purchase", 0.0)
            
            # TODO: Check if first purchase for bonus
            is_first_purchase = False  # Placeholder
            total_energy = energy_amount + (bonus_energy if is_first_purchase else 0)
            
            # Add energy to account
            result = await self.add_energy(
                user_id=user_id,
                amount=total_energy,
                context={
                    "source": "pack_purchase",
                    "pack_type": pack_type,
                    "stripe_intent_id": stripe_payment_intent_id,
                    "base_energy": energy_amount,
                    "bonus_energy": bonus_energy if is_first_purchase else 0,
                    "is_first_purchase": is_first_purchase
                }
            )
            
            purchase_id = str(uuid.uuid4())
            
            return {
                "purchase_id": purchase_id,
                "pack_type": pack_type,
                "energy_added": total_energy,
                "bonus_energy": bonus_energy if is_first_purchase else 0,
                "current_energy": result["current_energy"],
                "amount_paid": pack_config["price_euro"]
            }
            
        except Exception as e:
            logger.error("Error purchasing energy pack", user_id=user_id, pack_type=pack_type, error=str(e))
            raise EnergyManagerError(f"Failed to purchase energy pack: {str(e)}")

# Singleton instance
energy_manager = EnergyManager()
