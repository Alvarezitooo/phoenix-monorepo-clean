"""
⚡ Rate Limiter - Anti-Brute Force Protection
Phoenix Backend Unified - Event Store Based Rate Limiting
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple
import hashlib
from enum import Enum

from .supabase_client import sb
from .events import create_event
from .logging_config import logger

class RateLimitScope(Enum):
    AUTH_LOGIN = "auth_login"
    AUTH_REGISTER = "auth_register"
    PASSWORD_RESET = "password_reset"
    API_GENERAL = "api_general"

class RateLimitResult(Enum):
    ALLOWED = "allowed"
    LIMITED = "limited"
    BLOCKED = "blocked"

class RateLimiter:
    """
    Enterprise rate limiting using Event Store aggregation
    No Redis dependency - uses Supabase for persistence
    """
    
    # Rate limit configurations
    LIMITS = {
        RateLimitScope.AUTH_LOGIN: {
            "attempts": 5,
            "window_minutes": 15,
            "block_minutes": 30
        },
        RateLimitScope.AUTH_REGISTER: {
            "attempts": 3,
            "window_minutes": 60,
            "block_minutes": 120
        },
        RateLimitScope.PASSWORD_RESET: {
            "attempts": 3,
            "window_minutes": 60,
            "block_minutes": 60
        },
        RateLimitScope.API_GENERAL: {
            "attempts": 100,
            "window_minutes": 1,
            "block_minutes": 5
        }
    }
    
    @staticmethod
    def get_identifier_hash(identifier: str, scope: RateLimitScope) -> str:
        """Create hashed identifier for privacy"""
        combined = f"{scope.value}:{identifier}"
        return hashlib.sha256(combined.encode()).hexdigest()[:16]
    
    @staticmethod
    async def check_rate_limit(
        identifier: str,
        scope: RateLimitScope,
        user_agent: str = "",
        additional_context: Dict[str, Any] = None
    ) -> Tuple[RateLimitResult, Dict[str, Any]]:
        """
        Check if request should be rate limited
        
        Args:
            identifier: IP address, email, or user_id
            scope: Type of operation being rate limited
            user_agent: User agent string for context
            additional_context: Extra data for audit
            
        Returns:
            Tuple of (result, context_data)
        """
        try:
            now = datetime.now(timezone.utc)
            config = RateLimiter.LIMITS.get(scope, RateLimiter.LIMITS[RateLimitScope.API_GENERAL])
            
            window_start = now - timedelta(minutes=config["window_minutes"])
            identifier_hash = RateLimiter.get_identifier_hash(identifier, scope)
            
            # Check existing rate limit record
            existing_result = sb.table("rate_limits").select("*").eq("scope", scope.value).eq("identifier", identifier_hash).gte("window_end", now.isoformat()).execute()
            
            if existing_result.data:
                rate_limit = existing_result.data[0]
                blocked_until = rate_limit.get("blocked_until")
                
                if blocked_until:
                    blocked_until_dt = datetime.fromisoformat(blocked_until.replace('Z', '+00:00'))
                    if now < blocked_until_dt:
                        # Still blocked
                        return RateLimitResult.BLOCKED, {
                            "blocked_until": blocked_until,
                            "attempts": rate_limit["attempts"],
                            "scope": scope.value
                        }
            
            # Count attempts in current window using events (adapt to your schema)
            # Your events table uses 'ts' instead of 'occurred_at'
            attempts_result = sb.table("events").select("id").eq("type", f"{scope.value}_attempt").gte("ts", window_start.isoformat()).execute()
            
            # Filter by identifier in payload (since we can't query JSONB efficiently without indexes)
            current_attempts = 0
            if attempts_result.data:
                for event in attempts_result.data:
                    # This would be more efficient with proper JSONB indexing
                    event_detail = sb.table("events").select("payload").eq("id", event["id"]).execute()
                    if event_detail.data:
                        payload = event_detail.data[0].get("payload", {})
                        if payload.get("identifier_hash") == identifier_hash:
                            current_attempts += 1
            
            # Check if limit exceeded
            if current_attempts >= config["attempts"]:
                # Block the identifier
                block_until = now + timedelta(minutes=config["block_minutes"])
                window_end = now + timedelta(minutes=config["window_minutes"])
                
                # Update or create rate limit record
                rate_limit_data = {
                    "scope": scope.value,
                    "identifier": identifier_hash,
                    "attempts": current_attempts + 1,
                    "window_start": window_start.isoformat(),
                    "window_end": window_end.isoformat(),
                    "blocked_until": block_until.isoformat(),
                    "updated_at": now.isoformat()
                }
                
                if existing_result.data:
                    sb.table("rate_limits").update(rate_limit_data).eq("id", existing_result.data[0]["id"]).execute()
                else:
                    sb.table("rate_limits").insert(rate_limit_data).execute()
                
                # Create rate limited event
                await create_event({
                    "type": "rate_limited",
                    "occurred_at": now.isoformat(),
                    "actor_user_id": None,
                    "payload": {
                        "scope": scope.value,
                        "identifier_hash": identifier_hash,
                        "attempts": current_attempts + 1,
                        "window_minutes": config["window_minutes"],
                        "threshold": config["attempts"],
                        "blocked_until": block_until.isoformat(),
                        "user_agent": user_agent,
                        **(additional_context or {})
                    }
                })
                
                logger.warning(f"Rate limit exceeded for {scope.value}: {identifier_hash}")
                
                return RateLimitResult.LIMITED, {
                    "blocked_until": block_until.isoformat(),
                    "attempts": current_attempts + 1,
                    "max_attempts": config["attempts"],
                    "window_minutes": config["window_minutes"],
                    "scope": scope.value
                }
            
            # Record attempt
            await create_event({
                "type": f"{scope.value}_attempt",
                "occurred_at": now.isoformat(),
                "actor_user_id": None,
                "payload": {
                    "identifier_hash": identifier_hash,
                    "user_agent": user_agent,
                    "scope": scope.value,
                    **(additional_context or {})
                }
            })
            
            return RateLimitResult.ALLOWED, {
                "attempts": current_attempts + 1,
                "max_attempts": config["attempts"],
                "window_minutes": config["window_minutes"],
                "scope": scope.value
            }
            
        except Exception as e:
            logger.error(f"Rate limit check failed for {scope.value}: {str(e)}")
            # Fail open - allow request if rate limiting fails
            return RateLimitResult.ALLOWED, {}
    
    @staticmethod
    async def reset_rate_limit(identifier: str, scope: RateLimitScope) -> bool:
        """
        Reset rate limit for identifier (admin function)
        """
        try:
            identifier_hash = RateLimiter.get_identifier_hash(identifier, scope)
            
            # Remove rate limit record
            sb.table("rate_limits").delete().eq("scope", scope.value).eq("identifier", identifier_hash).execute()
            
            logger.info(f"Rate limit reset for {scope.value}: {identifier_hash}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reset rate limit: {str(e)}")
            return False
    
    @staticmethod
    async def get_rate_limit_status(identifier: str, scope: RateLimitScope) -> Dict[str, Any]:
        """
        Get current rate limit status for identifier
        """
        try:
            identifier_hash = RateLimiter.get_identifier_hash(identifier, scope)
            now = datetime.now(timezone.utc)
            
            # Get rate limit record
            result = sb.table("rate_limits").select("*").eq("scope", scope.value).eq("identifier", identifier_hash).execute()
            
            if not result.data:
                config = RateLimiter.LIMITS.get(scope, RateLimiter.LIMITS[RateLimitScope.API_GENERAL])
                return {
                    "blocked": False,
                    "attempts": 0,
                    "max_attempts": config["attempts"],
                    "window_minutes": config["window_minutes"],
                    "reset_time": None
                }
            
            rate_limit = result.data[0]
            blocked_until = rate_limit.get("blocked_until")
            is_blocked = False
            
            if blocked_until:
                blocked_until_dt = datetime.fromisoformat(blocked_until.replace('Z', '+00:00'))
                is_blocked = now < blocked_until_dt
            
            return {
                "blocked": is_blocked,
                "attempts": rate_limit["attempts"],
                "max_attempts": RateLimiter.LIMITS.get(scope, RateLimiter.LIMITS[RateLimitScope.API_GENERAL])["attempts"],
                "window_minutes": rate_limit.get("window_end"),
                "reset_time": blocked_until if is_blocked else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get rate limit status: {str(e)}")
            return {}

# Global instance
rate_limiter = RateLimiter()