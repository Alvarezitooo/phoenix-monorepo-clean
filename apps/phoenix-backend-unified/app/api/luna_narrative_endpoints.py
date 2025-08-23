"""
🌙 Luna Capital Narratif Endpoints
Phoenix Backend Unified - Narrative Journey Management
"""

from fastapi import APIRouter, HTTPException, Depends, status
import uuid
from datetime import datetime, timezone
from typing import Dict, Any

# Internal imports
from ..models.auth import NarrativeStartIn, NarrativeStartOut
from ..core.events import create_narrative_started_event, create_energy_granted_event
from ..core.security_guardian import ensure_request_is_clean
from ..core.supabase_client import sb
from ..core.logging_config import logger
from ..api.auth_endpoints import get_current_user_dependency

router = APIRouter(prefix="/luna", tags=["Luna Capital Narratif"])

# Get authenticated user dependency
CurrentUser = get_current_user_dependency()

@router.post("/narrative/start", response_model=NarrativeStartOut, status_code=status.HTTP_201_CREATED)
async def start_capital_narratif(
    narrative_data: NarrativeStartIn,
    current_user: dict = Depends(CurrentUser),
    _: None = Depends(ensure_request_is_clean)  # Security Guardian
):
    """
    Start the Capital Narratif journey for Luna Session Zero
    
    Creates immutable NarrativeStarted event and grants initial energy
    This becomes the foundation of the user's transformation story
    """
    try:
        user_id = current_user["id"]
        
        # Check if user has already started their narrative
        if current_user.get("capital_narratif_started", False):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Capital Narratif already started for this user"
            )
        
        # Generate unique narrative journey ID
        narrative_id = f"narrative_{user_id}_{int(datetime.now(timezone.utc).timestamp())}"
        
        # Create immutable NarrativeStarted event (source of truth)
        event_id = await create_narrative_started_event(
            user_id=user_id,
            motivation=narrative_data.motivation,
            narrative_id=narrative_id
        )
        
        # Grant welcome energy gift
        energy_granted = 100
        await create_energy_granted_event(
            user_id=user_id,
            amount=energy_granted,
            reason="welcome_gift_narrative_start"
        )
        
        # Update user state to reflect narrative started
        await update_user_narrative_status(user_id, narrative_id, energy_granted)
        
        logger.info(f"Capital Narratif started for user {user_id}: {narrative_id}")
        
        return NarrativeStartOut(
            narrative_id=narrative_id,
            status="started",
            energy_granted=energy_granted
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting Capital Narratif for user {current_user['id']}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start Capital Narratif journey"
        )

@router.get("/narrative/status")
async def get_narrative_status(
    current_user: dict = Depends(CurrentUser),
    _: None = Depends(ensure_request_is_clean)
):
    """
    Get current narrative status for authenticated user
    """
    try:
        user_id = current_user["id"]
        
        # Get fresh user data from database
        result = sb.table("users").select("*").eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user = result.data[0]
        
        response = {
            "narrative_started": user.get("capital_narratif_started", False),
            "narrative_id": user.get("narrative_id"),
            "luna_energy": user.get("luna_energy", 0),
            "motivation": user.get("initial_motivation"),
            "started_at": user.get("narrative_started_at")
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching narrative status for user {current_user['id']}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch narrative status"
        )

# Helper functions

async def update_user_narrative_status(user_id: str, narrative_id: str, energy_amount: int) -> None:
    """
    Update user record with narrative start information
    """
    try:
        update_data = {
            "capital_narratif_started": True,
            "narrative_id": narrative_id,
            "initial_motivation": None,  # Will be filled by consuming the event
            "narrative_started_at": datetime.now(timezone.utc).isoformat(),
            "luna_energy": energy_amount,  # Set initial energy gift
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = sb.table("users").update(update_data).eq("id", user_id).execute()
        
        if not result.data:
            raise RuntimeError("Failed to update user narrative status")
        
        logger.info(f"User narrative status updated: {user_id}")
        
    except Exception as e:
        logger.error(f"Error updating user narrative status {user_id}: {str(e)}")
        raise