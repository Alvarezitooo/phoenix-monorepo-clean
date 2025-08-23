"""
📚 Event Store Management for Luna Capital Narratif
Phoenix Backend Unified - Event Sourcing & Immutable Events
"""

from typing import Dict, Any
from datetime import datetime, timezone
import uuid
import logging
from .supabase_client import sb
from .logging_config import logger

async def create_event(event: Dict[str, Any]) -> str:
    """
    Create an immutable event in the Event Store (Supabase)
    
    Adapté pour votre schéma existant : table events avec ts_ms
    Events are the single source of truth for all Luna Capital Narratif
    Follows the "Tout est un Événement" Oracle principle
    
    Args:
        event: Event data dictionary
        
    Returns:
        Event ID
        
    Raises:
        RuntimeError: If event creation fails
    """
    try:
        # Adapter au schéma existant : events table avec user_id, type, payload, ts_ms
        event_id = str(uuid.uuid4())
        current_time = datetime.now(timezone.utc)
        
        # Enterprise Event Store - Security by Design
        # Support pour événements sans utilisateur (rate limiting, system events)
        user_id = event.get("actor_user_id")  # Peut être null après ALTER COLUMN
        
        event_data = {
            "id": event_id,
            "user_id": user_id,  # Enterprise: Audit trail avec utilisateur ou null pour events système
            "type": event["type"],
            "payload": event.get("payload", {}),
            "ts_ms": int(current_time.timestamp() * 1000)  # Timestamp précis en millisecondes
        }
        
        # Skip if no Supabase client
        if sb is None:
            logger.warning("Supabase not available, event logged locally", event_id=event_id)
            return event_id
        
        # Insert into your existing events table
        result = sb.table("events").insert(event_data).execute()
        
        if not result.data:
            raise RuntimeError("Failed to create event - no data returned")
        
        logger.info(f"Event created successfully: {event['type']} - {event_id}")
        return event_id
        
    except Exception as e:
        logger.error(f"Failed to create event {event.get('type', 'unknown')}: {str(e)}")
        raise RuntimeError(f"Event creation failed: {str(e)}")

async def create_narrative_started_event(user_id: str, motivation: str, narrative_id: str) -> str:
    """
    Create a NarrativeStarted event for Luna Capital Narratif
    
    This event marks the beginning of a user's transformation journey
    and becomes part of their permanent Capital Narratif record
    """
    event = {
        "type": "NarrativeStarted",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "actor_user_id": user_id,
        "payload": {
            "narrative_id": narrative_id,
            "motivation": motivation,
            "initial_energy_granted": 100,
            "source": "luna_modal_session_zero"
        },
        "meta": {
            "event_category": "capital_narratif",
            "luna_session": "zero",
            "importance": "high"
        }
    }
    
    return await create_event(event)

async def create_energy_granted_event(user_id: str, amount: int, reason: str) -> str:
    """
    Create an EnergyGranted event for Luna energy management
    """
    event = {
        "type": "EnergyGranted",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "actor_user_id": user_id,
        "payload": {
            "energy_amount": amount,
            "reason": reason,
            "source": "luna_gift_system"
        },
        "meta": {
            "event_category": "energy_management",
            "luna_gift": True
        }
    }
    
    return await create_event(event)

async def get_user_narrative_events(user_id: str) -> list:
    """
    Get all narrative events for a user to reconstruct their Capital Narratif
    """
    try:
        result = sb.table("events").select("*").eq("actor_user_id", user_id).order("occurred_at").execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Failed to fetch narrative events for user {user_id}: {str(e)}")
        return []