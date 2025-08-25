"""
🔐 Authentication Endpoints for Luna Session Zero
Phoenix Backend Unified - Registration & Login
"""

from fastapi import APIRouter, HTTPException, Depends, status, Header, Request
from fastapi.responses import JSONResponse
from typing import Optional, List
import uuid
from datetime import datetime, timezone
import logging

# Internal imports
from ..models.auth import UserRegistrationIn, UserRegistrationOut, User
from ..core.jwt_manager import hash_password, verify_password, create_jwt_token, get_bearer_token, extract_user_from_token
from ..core.refresh_token_manager import refresh_manager
from ..core.rate_limiter import rate_limiter, RateLimitScope, RateLimitResult
from ..core.security_guardian import ensure_request_is_clean
from ..core.supabase_client import sb
from ..core.logging_config import logger
from ..core.events import create_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserRegistrationOut, status_code=status.HTTP_201_CREATED)
async def register_user(
    registration_data: UserRegistrationIn,
    request: Request,
    _: None = Depends(ensure_request_is_clean)  # Security Guardian
):
    """
    Register a new user for Luna Session Zero
    
    Creates user account and returns JWT token for immediate authentication
    """
    try:
        # Get client info
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        # Rate limiting check
        rate_result, rate_context = await rate_limiter.check_rate_limit(
            identifier=client_ip,
            scope=RateLimitScope.AUTH_REGISTER,
            user_agent=user_agent,
            additional_context={"email": registration_data.email}
        )
        
        if rate_result == RateLimitResult.BLOCKED:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many registration attempts. Please try again later.",
                headers={"Retry-After": "7200"}  # 2 hours
            )
        elif rate_result == RateLimitResult.LIMITED:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Registration rate limit exceeded. Please try again later.",
                headers={"Retry-After": "3600"}  # 1 hour
            )
        # Check if user already exists
        existing_user = await get_user_by_email(registration_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        
        # Generate user ID and hash password
        user_id = str(uuid.uuid4())
        password_hash = hash_password(registration_data.password)
        
        # Create user record (adapt to your schema)
        user_data = {
            "id": user_id,
            "email": registration_data.email,
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "luna_energy": 100,  # Starting energy gift
            "capital_narratif_started": False
        }
        
        # Insert user into Supabase
        result = sb.table("users").insert(user_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user account"
            )
        
        # Create refresh token and session
        refresh_token_data = await refresh_manager.create_refresh_token(
            user_id=user_id,
            ip=client_ip,
            user_agent=user_agent
        )
        
        # Generate JWT token
        jwt_token = create_jwt_token({
            "id": user_id,
            "email": registration_data.email,
            "luna_energy": 100,
            "capital_narratif_started": False,
            "session_id": refresh_token_data["session_id"],
            "jti": refresh_token_data["jti"]
        })
        
        # Create success audit event
        await create_event({
            "type": "login_succeeded",
            "actor_user_id": user_id,
            "payload": {
                "session_id": refresh_token_data["session_id"],
                "registration": True,
                "ip": client_ip,
                "user_agent": user_agent
            }
        })
        
        # Log successful registration
        logger.info(f"User registered successfully: {registration_data.email}")
        
        return UserRegistrationOut(
            access_token=jwt_token,
            token_type="bearer",
            user_id=user_id,
            email=registration_data.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error for {registration_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during registration"
        )

@router.post("/login")
async def login_user(
    login_data: dict,
    request: Request,
    _: None = Depends(ensure_request_is_clean)
):
    """
    Login user with email and password
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        email = login_data.get("email")
        password = login_data.get("password")
        
        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required"
            )
        
        # Rate limiting check
        rate_result, rate_context = await rate_limiter.check_rate_limit(
            identifier=client_ip,
            scope=RateLimitScope.AUTH_LOGIN,
            user_agent=user_agent,
            additional_context={"email": email}
        )
        
        if rate_result == RateLimitResult.BLOCKED:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later.",
                headers={"Retry-After": "1800"}  # 30 minutes
            )
        elif rate_result == RateLimitResult.LIMITED:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Login rate limit exceeded. Please try again later.",
                headers={"Retry-After": "900"}  # 15 minutes
            )
        
        # Verify user credentials
        user = await get_user_by_email(email)
        if not user or not verify_password(password, user["password_hash"]):
            # Create failed login event
            await create_event({
                "type": "login_failed",
                "actor_user_id": user["id"] if user else None,
                "payload": {
                    "email": email,
                    "reason": "invalid_credentials",
                    "ip": client_ip,
                    "user_agent": user_agent
                }
            })
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create refresh token and session
        refresh_token_data = await refresh_manager.create_refresh_token(
            user_id=user["id"],
            ip=client_ip,
            user_agent=user_agent
        )
        
        # Generate JWT token
        jwt_token = create_jwt_token({
            "id": user["id"],
            "email": user["email"],
            "luna_energy": user["luna_energy"],
            "capital_narratif_started": user["capital_narratif_started"],
            "session_id": refresh_token_data["session_id"],
            "jti": refresh_token_data["jti"]
        })
        
        # Create success audit event
        await create_event({
            "type": "login_succeeded",
            "actor_user_id": user["id"],
            "payload": {
                "session_id": refresh_token_data["session_id"],
                "ip": client_ip,
                "user_agent": user_agent
            }
        })
        
        logger.info(f"User logged in successfully: {email}")
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "refresh_token": refresh_token_data["refresh_token"],
            "user_id": user["id"],
            "email": user["email"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {login_data.get('email', 'unknown')}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_access_token(
    refresh_data: dict,
    request: Request,
    _: None = Depends(ensure_request_is_clean)
):
    """
    Refresh access token using refresh token with rotation
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        refresh_token = refresh_data.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required"
            )
        
        # Rotate refresh token
        new_token_data = await refresh_manager.rotate_refresh_token(
            old_refresh_token=refresh_token,
            ip=client_ip,
            user_agent=user_agent
        )
        
        if not new_token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user data for JWT
        user = await get_user_by_id(new_token_data["user_id"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Generate new JWT
        jwt_token = create_jwt_token({
            "id": user["id"],
            "email": user["email"],
            "luna_energy": user["luna_energy"],
            "capital_narratif_started": user["capital_narratif_started"],
            "session_id": new_token_data["session_id"],
            "jti": new_token_data["jti"]
        })
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "refresh_token": new_token_data["refresh_token"],
            "expires_in": 900  # 15 minutes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during token refresh"
        )

@router.get("/sessions")
async def get_user_sessions(
    authorization: Optional[str] = Header(None),
    _: None = Depends(ensure_request_is_clean)
):
    """
    Get all active sessions for current user
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    token = get_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format"
        )
    
    user_data = extract_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    try:
        sessions = await refresh_manager.get_user_sessions(user_data["id"])
        return {"sessions": sessions}
        
    except Exception as e:
        logger.error(f"Failed to get user sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sessions"
        )

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    authorization: Optional[str] = Header(None),
    _: None = Depends(ensure_request_is_clean)
):
    """
    Revoke specific session
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    token = get_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format"
        )
    
    user_data = extract_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    try:
        success = await refresh_manager.revoke_session(
            session_id=session_id,
            user_id=user_data["id"],
            revoked_by="user"
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        return {"message": "Session revoked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to revoke session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke session"
        )

@router.post("/logout-all")
async def logout_all_sessions(
    authorization: Optional[str] = Header(None),
    _: None = Depends(ensure_request_is_clean)
):
    """
    Logout from all sessions except current one
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    token = get_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format"
        )
    
    user_data = extract_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    try:
        # Extract current session ID from JWT
        current_session_id = user_data.get("session_id")
        
        revoked_count = await refresh_manager.revoke_all_sessions(
            user_id=user_data["id"],
            except_session_id=current_session_id
        )
        
        return {
            "message": f"Successfully logged out from {revoked_count} sessions",
            "sessions_revoked": revoked_count
        }
        
    except Exception as e:
        logger.error(f"Failed to logout all sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout from all sessions"
        )

@router.get("/me")
async def get_current_user(
    authorization: Optional[str] = Header(None),
    _: None = Depends(ensure_request_is_clean)
):
    """
    Get current authenticated user information
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    token = get_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format"
        )
    
    user_data = extract_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get fresh user data from database
    user = await get_user_by_id(user_data["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user["id"],
        "email": user["email"],
        "luna_energy": user["luna_energy"],
        "narrative_started": user["capital_narratif_started"],
        "created_at": user["created_at"],
        "subscription_type": user.get("subscription_type"),
        "subscription_status": user.get("subscription_status"),
        "is_unlimited": user.get("subscription_type") == "luna_unlimited"
    }

# Helper functions

async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email from database"""
    try:
        result = sb.table("users").select("*").eq("email", email).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        logger.error(f"Error fetching user by email {email}: {str(e)}")
        return None

async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID from database"""
    try:
        result = sb.table("users").select("*").eq("id", user_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        logger.error(f"Error fetching user by ID {user_id}: {str(e)}")
        return None

def get_current_user_dependency():
    """
    Dependency to get current authenticated user
    Can be used with Depends() in other endpoints
    """
    async def _get_current_user(authorization: Optional[str] = Header(None)):
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header required"
            )
        
        token = get_bearer_token(authorization)
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization format"
            )
        
        user_data = extract_user_from_token(token)
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        user = await get_user_by_id(user_data["id"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    
    return _get_current_user