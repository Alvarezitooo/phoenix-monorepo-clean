"""
🔐 Luna Authentication Bootstrap for Phoenix CV
Token handoff from Luna Session Zero
"""

import os
from typing import Optional, Dict, Any
import httpx
from jose import jwt
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Luna Hub configuration
LUNA_HUB_URL = os.getenv("LUNA_HUB_URL", "https://luna-hub-backend-unified-production.up.railway.app")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-secret-key")
JWT_ALGORITHM = "HS256"

class LunaAuthBootstrap:
    """
    Handle Luna authentication token bootstrap for Phoenix CV
    """
    
    def __init__(self):
        self.hub_url = LUNA_HUB_URL
        self.secret_key = JWT_SECRET_KEY
        
    def verify_luna_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify Luna JWT token locally
        
        Args:
            token: JWT token from Luna Session Zero
            
        Returns:
            User data or None if token is invalid
        """
        try:
            # Decode and verify JWT
            payload = jwt.decode(token, self.secret_key, algorithms=[JWT_ALGORITHM])
            
            # Check if token is expired
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp, timezone.utc) < datetime.now(timezone.utc):
                logger.warning("Luna token expired")
                return None
            
            # Extract user information
            user_data = {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "luna_energy": payload.get("luna_energy", 0),
                "narrative_started": payload.get("narrative_started", False)
            }
            
            logger.info(f"Luna token verified for user: {user_data['email']}")
            return user_data
            
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid Luna token: {str(e)}")
            return None
    
    async def validate_with_hub(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate token with Luna Hub (optional double-check)
        
        Args:
            token: JWT token to validate
            
        Returns:
            User data from Hub or None
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.hub_url}/auth/me",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    logger.info(f"Luna token validated with Hub for user: {user_data['email']}")
                    return user_data
                else:
                    logger.warning(f"Hub validation failed: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error validating token with Hub: {str(e)}")
            return None
    
    def extract_token_from_fragment(self, url_fragment: str) -> Optional[str]:
        """
        Extract token from URL fragment (#token=...)
        
        Args:
            url_fragment: URL fragment containing token
            
        Returns:
            Token string or None
        """
        if not url_fragment:
            return None
        
        # Remove # if present
        fragment = url_fragment.lstrip('#')
        
        # Parse fragment parameters
        params = {}
        for param in fragment.split('&'):
            if '=' in param:
                key, value = param.split('=', 1)
                params[key] = value
        
        return params.get('token')
    
    async def bootstrap_user_session(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Bootstrap Phoenix CV user session from Luna token
        
        Args:
            token: JWT token from Luna Session Zero
            
        Returns:
            User session data or None
        """
        # First verify token locally
        user_data = self.verify_luna_token(token)
        if not user_data:
            return None
        
        # Optional: validate with Hub for extra security
        hub_data = await self.validate_with_hub(token)
        if hub_data:
            # Use Hub data as it might be more up-to-date
            user_data.update(hub_data)
        
        # Create Phoenix CV session context
        session_data = {
            "user_id": user_data["id"],
            "email": user_data["email"],
            "luna_energy": user_data.get("luna_energy", 0),
            "narrative_started": user_data.get("narrative_started", False),
            "source": "luna_session_zero",
            "authenticated_at": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"Phoenix CV session bootstrapped for user: {session_data['email']}")
        return session_data

# Global instance
luna_auth = LunaAuthBootstrap()

# Helper functions for FastAPI integration

async def get_luna_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Get Luna user data from JWT token
    For use in FastAPI dependencies
    """
    return await luna_auth.bootstrap_user_session(token)

def extract_token_from_request_fragment(fragment: str) -> Optional[str]:
    """
    Extract token from URL fragment for frontend handoff
    """
    return luna_auth.extract_token_from_fragment(fragment)