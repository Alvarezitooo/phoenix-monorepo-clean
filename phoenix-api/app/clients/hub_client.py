import httpx
from fastapi import status, HTTPException
from typing import List, Dict, Any, Optional

from app.core.config import settings

class HubClient:
    def __init__(self):
        self.base_url = settings.LUNA_HUB_URL
        self.api_key = settings.LUNA_HUB_INTERNAL_API_KEY
        self.headers = {"X-Internal-API-Key": self.api_key}

    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """A centralized method for making requests to the Hub."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(method, f"{self.base_url}{endpoint}", headers=self.headers, **kwargs)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"Error communicating with Luna Hub: {e.response.status_code} - {e.response.text}")
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"Error from Luna Hub: {e.response.text}"
                )
            except httpx.RequestError as e:
                print(f"Request error to Luna Hub: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Cannot connect to Luna Hub."
                )

    async def can_perform(self, user_id: str, action: str) -> bool:
        """Checks with Luna Hub if the user has enough energy for an action."""
        data = await self._make_request(
            "post", 
            "/luna/energy/can-perform", 
            json={"user_id": user_id, "action_name": action}
        )
        return data.get("can_perform", False)

    async def get_narrative_context(self, user_id: str) -> Dict[str, Any]:
        """Gets the user's narrative context from the Hub."""
        return await self._make_request("get", f"/narrative/context/{user_id}")

    async def track_event(self, user_id: str, event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Tracks a new event in the user's narrative journey."""
        request_body = {
            "user_id": user_id,
            "event_type": event_type,
            "payload": {
                "app_source": "phoenix-api",
                "event_data": event_data
            }
        }
        return await self._make_request("post", "/narrative/events", json=request_body)

    async def ai_chat_interaction(
        self, 
        user_id: str, 
        app: str, 
        message: str, 
        persona: str = "jeune_diplome",
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Delegate AI chat interaction to Luna Hub (Hub-centric architecture)"""
        request_body = {
            "message": message,
            "persona": persona,
            "context": context or {}
        }
        
        # Add user authentication header for Hub to identify user
        headers = {
            **self.headers,
            "X-User-ID": user_id
        }
        
        endpoint = f"/ai/{app}/chat"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}{endpoint}", 
                    json=request_body,
                    headers=headers,
                    timeout=30.0  # AI calls may take longer
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"Error communicating with Luna Hub AI: {e.response.status_code} - {e.response.text}")
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"Error from Luna Hub AI: {e.response.text}"
                )
            except httpx.RequestError as e:
                print(f"Request error to Luna Hub AI: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Cannot connect to Luna Hub AI service."
                )


hub_client = HubClient()