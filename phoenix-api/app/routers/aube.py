from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
import httpx

from app.clients.hub_client import get_hub_client, HubClient
from app.dependencies import get_current_user_id

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    persona: str = "jeune_diplome"
    context: Optional[Dict[str, Any]] = None

@router.post("/chat", summary="Interact with the Luna copilot for Aube")
async def chat_with_luna(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    hub: HubClient = Depends(get_hub_client)
):
    """
    Hub-centric architecture: Delegate AI interactions to Luna Hub
    Phoenix API acts as pure orchestration layer
    """
    try:
        # Delegate all AI processing to Luna Hub
        # This implements the "Hub = Roi" principle correctly
        ai_response = await hub.ai_chat_interaction(
            user_id=user_id,
            app="aube", 
            message=request.message,
            persona=request.persona,
            context=request.context or {}
        )

        return {
            "user_id": ai_response["user_id"],
            "user_message": ai_response["user_message"], 
            "luna_response": ai_response["luna_response"],
            "energy_consumed": ai_response.get("energy_consumed", 0)
        }

    except HTTPException as e:
        raise e # Re-raise exceptions from Hub (e.g., 402, 401, 503)
    except Exception as e:
        # Log the full error here in a real application
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
