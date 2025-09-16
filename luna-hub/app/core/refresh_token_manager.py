"""
🔄 Refresh Token Manager - Enterprise JWT Rotation
Phoenix Backend Unified - Secure Token Management
"""

import hashlib
import secrets
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import uuid
from jose import jwt

from .supabase_client import sb
from .jwt_manager import JWT_SECRET_KEY, JWT_ALGORITHM, create_jwt_token
from .logging_config import logger
from .events import create_event

# Configuration
REFRESH_TOKEN_DURATION_DAYS = int(os.getenv("REFRESH_TOKEN_DURATION_DAYS", "30"))
ACCESS_TOKEN_DURATION_MINUTES = int(os.getenv("ACCESS_TOKEN_DURATION_MINUTES", "15"))

class RefreshTokenManager:
    """
    Enterprise-grade refresh token management with rotation
    """
    
    @staticmethod
    def hash_token(token: str) -> str:
        """Hash refresh token for secure storage"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    @staticmethod
    def generate_refresh_token() -> str:
        """Generate cryptographically secure refresh token"""
        return secrets.token_urlsafe(64)
    
    @staticmethod
    def extract_device_info(user_agent: str) -> str:
        """Extract human-readable device info from user agent"""
        if not user_agent:
            return "Unknown Device"
        
        # Basic device detection
        if "Mobile" in user_agent:
            if "iPhone" in user_agent:
                return "📱 iPhone"
            elif "Android" in user_agent:
                return "📱 Android"
            else:
                return "📱 Mobile"
        elif "iPad" in user_agent:
            return "📱 iPad"
        elif "Macintosh" in user_agent:
            return "💻 Mac"
        elif "Windows" in user_agent:
            return "💻 Windows"
        elif "Linux" in user_agent:
            return "💻 Linux"
        else:
            return "🖥️ Desktop"
    
    @staticmethod
    async def create_refresh_token(
        user_id: str,
        ip: str,
        user_agent: str,
        parent_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create new refresh token with session tracking
        """
        try:
            # Generate tokens
            refresh_token = RefreshTokenManager.generate_refresh_token()
            token_hash = RefreshTokenManager.hash_token(refresh_token)
            jti = str(uuid.uuid4())
            device_label = RefreshTokenManager.extract_device_info(user_agent)
            
            # Token expiration
            expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DURATION_DAYS)
            
            # Store refresh token - Enterprise Security by Design
            refresh_token_data = {
                "user_id": user_id,
                "token_hash": token_hash,
                "jti": jti,
                "device_label": device_label,
                "user_agent": user_agent or "",
                "ip": ip,
                "geo_location": {},  # Enterprise: IP geolocation for security
                "expires_at": expires_at.isoformat(),
                "parent_id": parent_id  # Enterprise: Token rotation chain tracking
            }
            
            result = sb.table("refresh_tokens").insert(refresh_token_data).execute()
            if not result.data:
                raise RuntimeError("Failed to create refresh token")
            
            refresh_token_id = result.data[0]["id"]
            
            # Create session - Enterprise Multi-Device Management
            session_data = {
                "user_id": user_id,
                "refresh_token_id": refresh_token_id,
                "device_label": device_label,
                "user_agent": user_agent or "",
                "ip": ip,
                "geo_location": {},  # Enterprise: Geographic tracking for suspicious activity
                "expires_at": expires_at.isoformat()
            }
            
            session_result = sb.table("sessions").insert(session_data).execute()
            if not session_result.data:
                raise RuntimeError("Failed to create session")
            
            session_id = session_result.data[0]["id"]
            
            # Create audit events
            await create_event({
                "type": "session_created",
                "actor_user_id": user_id,
                "payload": {
                    "session_id": session_id,
                    "refresh_token_id": refresh_token_id,
                    "device_label": device_label,
                    "ip": ip,
                    "user_agent": user_agent or "",
                    "jti": jti
                }
            })
            
            logger.info(f"Refresh token created for user {user_id}, session {session_id}")
            
            return {
                "refresh_token": refresh_token,
                "refresh_token_id": refresh_token_id,
                "session_id": session_id,
                "jti": jti,
                "expires_at": expires_at
            }
            
        except Exception as e:
            logger.error(f"Failed to create refresh token for user {user_id}: {str(e)}")
            raise
    
    @staticmethod
    async def verify_refresh_token(refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Verify refresh token and return user data if valid
        """
        try:
            token_hash = RefreshTokenManager.hash_token(refresh_token)
            
            # Get token from database
            result = sb.table("refresh_tokens").select("*").eq("token_hash", token_hash).execute()
            
            if not result.data:
                return None
            
            token_data = result.data[0]
            
            # Check if token is expired or revoked
            now = datetime.now(timezone.utc)
            expires_at = datetime.fromisoformat(token_data["expires_at"].replace('Z', '+00:00'))
            
            if token_data["revoked_at"] or now > expires_at:
                return None
            
            # Mark token as used
            sb.table("refresh_tokens").update({
                "used_at": now.isoformat()
            }).eq("id", token_data["id"]).execute()
            
            # Update session last_seen
            sb.table("sessions").update({
                "last_seen": now.isoformat()
            }).eq("refresh_token_id", token_data["id"]).execute()
            
            return token_data
            
        except Exception as e:
            logger.error(f"Failed to verify refresh token: {str(e)}")
            return None
    
    @staticmethod
    async def rotate_refresh_token(
        old_refresh_token: str,
        ip: str,
        user_agent: str
    ) -> Optional[Dict[str, Any]]:
        """
        Rotate refresh token - revoke old, create new
        """
        try:
            # Verify old token
            old_token_data = await RefreshTokenManager.verify_refresh_token(old_refresh_token)
            if not old_token_data:
                return None
            
            user_id = old_token_data["user_id"]
            
            # Revoke old token
            now = datetime.now(timezone.utc)
            sb.table("refresh_tokens").update({
                "revoked_at": now.isoformat()
            }).eq("id", old_token_data["id"]).execute()
            
            # Create new token (with rotation chain)
            new_token_data = await RefreshTokenManager.create_refresh_token(
                user_id=user_id,
                ip=ip,
                user_agent=user_agent,
                parent_id=old_token_data["id"]
            )
            
            # Create audit event
            await create_event({
                "type": "session_refreshed",
                "actor_user_id": user_id,
                "payload": {
                    "session_id": new_token_data["session_id"],
                    "jti_old": old_token_data["jti"],
                    "jti_new": new_token_data["jti"],
                    "rotation_chain": old_token_data["id"]
                }
            })
            
            logger.info(f"Refresh token rotated for user {user_id}")
            # Include user_id in response for JWT generation
            new_token_data["user_id"] = user_id
            return new_token_data
            
        except Exception as e:
            logger.error(f"Failed to rotate refresh token: {str(e)}")
            return None
    
    @staticmethod
    async def revoke_session(session_id: str, user_id: str, revoked_by: str = "user") -> bool:
        """
        Revoke specific session and its refresh token
        """
        try:
            now = datetime.now(timezone.utc)
            
            # Get session
            session_result = sb.table("sessions").select("*").eq("id", session_id).eq("user_id", user_id).execute()
            if not session_result.data:
                return False
            
            session = session_result.data[0]
            
            # Revoke session
            sb.table("sessions").update({
                "revoked_at": now.isoformat()
            }).eq("id", session_id).execute()
            
            # Revoke associated refresh token
            sb.table("refresh_tokens").update({
                "revoked_at": now.isoformat()
            }).eq("id", session["refresh_token_id"]).execute()
            
            # Create audit event
            await create_event({
                "type": "session_revoked",
                "actor_user_id": user_id,
                "payload": {
                    "session_id": session_id,
                    "revoked_by": revoked_by,
                    "device_label": session.get("device_label")
                }
            })
            
            logger.info(f"Session {session_id} revoked for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke session {session_id}: {str(e)}")
            return False
    
    @staticmethod
    async def revoke_all_sessions(user_id: str, except_session_id: Optional[str] = None) -> int:
        """
        Revoke all user sessions except current one
        """
        try:
            now = datetime.now(timezone.utc)
            
            # Get all active sessions
            query = sb.table("sessions").select("*").eq("user_id", user_id).is_("revoked_at", "null")
            if except_session_id:
                query = query.neq("id", except_session_id)
            
            sessions_result = query.execute()
            if not sessions_result.data:
                return 0
            
            revoked_count = 0
            
            for session in sessions_result.data:
                # Revoke session
                sb.table("sessions").update({
                    "revoked_at": now.isoformat()
                }).eq("id", session["id"]).execute()
                
                # Revoke associated refresh token
                sb.table("refresh_tokens").update({
                    "revoked_at": now.isoformat()
                }).eq("id", session["refresh_token_id"]).execute()
                
                revoked_count += 1
            
            # Create audit event
            await create_event({
                "type": "session_revoked_all",
                "actor_user_id": user_id,
                "payload": {
                    "sessions_revoked": revoked_count,
                    "except_session_id": except_session_id
                }
            })
            
            logger.info(f"Revoked {revoked_count} sessions for user {user_id}")
            return revoked_count
            
        except Exception as e:
            logger.error(f"Failed to revoke all sessions for user {user_id}: {str(e)}")
            return 0
    
    @staticmethod
    async def get_user_sessions(user_id: str) -> List[Dict[str, Any]]:
        """
        Get all active sessions for user
        """
        try:
            result = sb.table("sessions").select(
                "id, device_label, ip, user_agent, created_at, last_seen, geo_location"
            ).eq("user_id", user_id).is_("revoked_at", "null").order("last_seen", desc=True).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Failed to get sessions for user {user_id}: {str(e)}")
            return []

# Global instance
refresh_manager = RefreshTokenManager()