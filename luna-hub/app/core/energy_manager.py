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
        # ... (implementation exists)
        pass

    async def _is_unlimited_user(self, user_id: str) -> bool:
        # ... (implementation exists)
        pass

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
        await self._create_narrative_event(user_id, action_name, 0, context, is_unlimited=True)
        return {
            "energy_consumed": 0,
            "energy_remaining": 999.0,
            "unlimited": True
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
            await self._execute_atomic_consumption(user_id, action_name, energy_required, energy_before, energy_after, context)
            return {
                "energy_consumed": energy_required,
                "energy_remaining": energy_after,
                "unlimited": False
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
        update_data = {"current_energy": energy_after, "total_consumed": sb.sql(f'total_consumed + {energy_consumed}')}
        updated_user = sb.table("user_energy").update(update_data).eq("user_id", user_id).execute()

        if not updated_user.data:
            raise EnergyManagerError("Failed to update user energy in DB.")

        # 2. Create the narrative event
        try:
            await self._create_narrative_event(user_id, action_name, energy_consumed, context)
        except Exception as event_error:
            logger.error("Failed to create narrative event, attempting to revert energy consumption.", user_id=user_id, error=str(event_error))
            # Attempt to revert the energy change
            revert_data = {"current_energy": energy_before, "total_consumed": sb.sql(f'total_consumed - {energy_consumed}')}
            sb.table("user_energy").update(revert_data).eq("user_id", user_id).execute()
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

# Singleton instance
energy_manager = EnergyManager()
