from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from ..core.supabase_client import event_store
from ..core.security_guardian import SecurityGuardian
from .auth_endpoints import get_current_user_dependency

router = APIRouter(prefix="/narrative", tags=["Narrative Capital"])

CurrentUser = get_current_user_dependency()

# --- Pydantic Models for the new API Contract ---

class EventPayload(BaseModel):
    app_source: str = Field(..., description="Source application of the event (e.g., 'phoenix-api')")
    event_data: Dict[str, Any] = Field(..., description="The actual data of the event.")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata.")

class EventCreationRequest(BaseModel):
    user_id: str # The user the event belongs to
    event_type: str
    payload: EventPayload

class NarrativeContextResponse(BaseModel):
    user_id: str
    event_count: int
    recent_events: List[Dict[str, Any]]
    # In the future, this can be enriched with more analyzed data
    # e.g., personality_traits: Dict[str, Any]

# --- Refactored Endpoints ---

@router.get("/context/{user_id}", response_model=NarrativeContextResponse)
async def get_narrative_context(
    user_id: str,
    current_user: dict = Depends(CurrentUser) # Protects the endpoint
):
    """
    Provides the full narrative context for a given user.
    This is the single source of truth for Luna's memory.
    """
    if current_user["id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another user\'s narrative context.")

    try:
        events = await event_store.get_user_events(user_id, limit=50)
        return NarrativeContextResponse(
            user_id=user_id,
            event_count=len(events),
            recent_events=events
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_new_event(
    request: EventCreationRequest,
    current_user: dict = Depends(CurrentUser) # Protects the endpoint
):
    """
    Single, secure endpoint for creating a new event in the user's narrative.
    """
    if current_user["id"] != request.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create events for another user.")

    try:
        event_id = await event_store.create_event(
            user_id=request.user_id,
            event_type=request.event_type, # CORRECTED: was request.payload.event_type
            app_source=request.payload.app_source,
            event_data=request.payload.event_data,
            metadata=request.payload.metadata
        )
        return {"status": "event created", "event_id": event_id}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))