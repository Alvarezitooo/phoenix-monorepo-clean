"""
🔐 Authentication Endpoints for Luna Session Zero
Phoenix Backend Unified - Registration & Login
"""

from fastapi import APIRouter, HTTPException, Depends, status, Header, Request, Response
from fastapi.responses import JSONResponse
import os
from typing import Optional, List
import uuid
from datetime import datetime, timezone
import logging

# Internal imports
from ..models.auth import UserRegistrationIn, UserRegistrationOut, User, LoginRequest
from ..core.jwt_manager import hash_password, verify_password, create_jwt_token, get_bearer_token, extract_user_from_token
from ..core.specialist_token_manager import SpecialistTokenManager
from ..core.refresh_token_manager import refresh_manager
from ..core.rate_limiter import rate_limiter, RateLimitScope, RateLimitResult
from ..core.security_guardian import ensure_request_is_clean
from ..core.supabase_client import sb
from ..core.logging_config import logger
from ..core.events import create_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/check-user/{email}")
async def check_user_status(
    email: str,
    request: Request,
    _: None = Depends(ensure_request_is_clean)  # Security Guardian
):
    """
    Check user status for smart authentication
    
    Returns user type: 'new', 'first_time', or 'returning'
    """
    try:
        # Execute the Supabase function
        result = sb.rpc('check_user_status', {'user_email': email}).execute()
        
        if result.data and len(result.data) > 0:
            user_status = result.data[0]
            return {
                "user_exists": user_status.get("user_exists", False),
                "user_type": user_status.get("user_type", "new"),
                "last_login": user_status.get("last_login"),
                "login_count": user_status.get("login_count", 0),
                "needs_onboarding": user_status.get("needs_onboarding", True)
            }
        else:
            # Fallback if function fails
            return {
                "user_exists": False,
                "user_type": "new",
                "last_login": None,
                "login_count": 0,
                "needs_onboarding": True
            }
            
    except Exception as e:
        logger.error(f"Error checking user status: {str(e)}")
        # Fallback on error
        return {
            "user_exists": False,
            "user_type": "new",
            "last_login": None,
            "login_count": 0,
            "needs_onboarding": True
        }

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
    🔐 Dependency to get current authenticated user
    DUAL AUTH: Authorization header OR HTTPOnly cookie
    """
    async def _get_current_user(
        request: Request,
        authorization: Optional[str] = Header(None)
    ):
        token = None
        auth_source = None
        
        # 1️⃣ Try Authorization header first (backward compatibility)
        if authorization:
            token = get_bearer_token(authorization)
            auth_source = "header"
        
        # 2️⃣ Fallback to HTTPOnly cookie if no header
        if not token:
            token = request.cookies.get("phoenix_session")
            auth_source = "cookie"
        
        # 🚨 No authentication found
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required (header or secure cookie)"
            )
        
        # Validate token (same validation for both sources)
        user_data = extract_user_from_token(token)
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        # Get user from database
        user = await get_user_by_id(user_data["id"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Add auth metadata for logging/debugging
        user["_auth_source"] = auth_source
        
        return user
    
    return _get_current_user

# 🍪 HTTPOnly COOKIES SECURITY ENDPOINTS

@router.post("/secure-session", status_code=status.HTTP_200_OK)
async def set_secure_session(
    credentials: LoginRequest,
    response: Response,
    _: None = Depends(ensure_request_is_clean)
):
    """
    🔐 Set HTTPOnly secure session - REPLACES localStorage JWT
    
    This endpoint:
    1. Validates credentials (same as /login)
    2. Sets HTTPOnly cookie with JWT
    3. Returns user info only (NO JWT in response body)
    """
    try:
        # Reuse existing login logic
        login_result = await login_user(credentials)
        
        # Extract JWT and user from login result
        access_token = login_result["access_token"]
        user_data = login_result["user"]
        
        # Set HTTPOnly cookie - SECURE by default
        cookie_secure = os.getenv("ENVIRONMENT", "development") == "production"
        response.set_cookie(
            key="phoenix_session",
            value=access_token,
            httponly=True,          # 🛡️ Prevents XSS access
            secure=cookie_secure,   # 🛡️ HTTPS only in production
            samesite="strict",      # 🛡️ CSRF protection
            max_age=3600 * 24 * 7,  # 7 days
            path="/"
        )
        
        # Log security event
        logger.info(f"Secure session established for user {user_data['id']}")
        
        # Return user data ONLY (no JWT in body)
        return {
            "success": True,
            "user": user_data,
            "session_type": "httponly_secure"
        }
        
    except Exception as e:
        logger.error(f"Secure session error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

@router.post("/logout-secure")
async def logout_secure_session(
    response: Response,
    current_user: dict = Depends(get_current_user_dependency())
):
    """
    🔐 Logout secure session - Clears HTTPOnly cookie
    """
    try:
        # Clear the HTTPOnly cookie
        response.delete_cookie(
            key="phoenix_session",
            path="/",
            secure=os.getenv("ENVIRONMENT", "development") == "production",
            samesite="strict"
        )
        
        logger.info(f"Secure session cleared for user {current_user.get('id', 'unknown')}")
        
        return {
            "success": True,
            "message": "Session cleared securely"
        }
        
    except Exception as e:
        logger.error(f"Secure logout error: {str(e)}")
        return {
            "success": True,  # Always succeed logout for security
            "message": "Session cleared"
        }

@router.get("/session-status")
async def check_session_status(
    request: Request,
    current_user: dict = Depends(get_current_user_dependency())
):
    """
    🔐 Check current session status - For frontend validation
    """
    # Check if cookie exists
    has_cookie = "phoenix_session" in request.cookies
    
    return {
        "authenticated": True,  # If we reach here, JWT is valid
        "user": current_user,
        "session_type": "httponly" if has_cookie else "bearer",
        "secure": True
    }

# 🌙 LUNA MICROSERVICES AUTHENTICATION ENDPOINTS

@router.post("/luna/delegate-specialist")
async def delegate_specialist_token(
    delegation_request: dict,
    authorization: Optional[str] = Header(None),
    current_user: dict = Depends(get_current_user_dependency()),
    _: None = Depends(ensure_request_is_clean)
):
    """
    🎪 Délégation de token à un spécialiste Luna
    
    Permet à Luna Central de créer des tokens spécialisés pour les microservices.
    Réutilise l'infrastructure JWT existante.
    """
    try:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header required for delegation"
            )
        
        # Extraire token central
        central_token = get_bearer_token(authorization)
        if not central_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization format"
            )
        
        # Valider requête de délégation
        specialist_name = delegation_request.get("specialist")
        target_module = delegation_request.get("module") 
        user_intent = delegation_request.get("intent", "conversation")
        
        if not specialist_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specialist name required (luna-aube, luna-cv, luna-letters, luna-rise)"
            )
        
        # Valider format spécialiste
        if not specialist_name.startswith("luna-"):
            specialist_name = f"luna-{specialist_name}"
            
        valid_specialists = ["luna-aube", "luna-cv", "luna-letters", "luna-rise"]
        if specialist_name not in valid_specialists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid specialist. Must be one of: {', '.join(valid_specialists)}"
            )
        
        # Contexte de délégation
        delegation_context = {
            "target_module": target_module or specialist_name.split("-")[1],
            "journey_step": delegation_request.get("journey_step", "specialist_consultation"),
            "reason": f"user_intent_{user_intent}",
            "frontend_context": delegation_request.get("frontend_context", {})
        }
        
        # Créer token spécialisé
        specialist_token = SpecialistTokenManager.create_specialist_token(
            parent_token=central_token,
            specialist_name=specialist_name,
            delegation_context=delegation_context
        )
        
        if not specialist_token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create specialist token"
            )
        
        # Event sourcing
        await create_event({
            "type": "specialist_token_delegated",
            "actor_user_id": current_user["id"],
            "payload": {
                "specialist": specialist_name,
                "target_module": delegation_context["target_module"],
                "delegation_reason": delegation_context["reason"],
                "parent_session": current_user.get("session_id"),
                "frontend_context": delegation_context.get("frontend_context", {})
            }
        })
        
        logger.info(f"Specialist token delegated", 
                   user_id=current_user["id"],
                   specialist=specialist_name,
                   module=target_module)
        
        return {
            "success": True,
            "specialist_token": specialist_token,
            "specialist": specialist_name,
            "target_module": delegation_context["target_module"],
            "valid_for_minutes": SpecialistTokenManager.SPECIALIST_SCOPES.get(specialist_name, {}).get("session_duration_minutes", 60),
            "permissions": SpecialistTokenManager.SPECIALIST_SCOPES.get(specialist_name, {}).get("permissions", []),
            "energy_limit": SpecialistTokenManager.SPECIALIST_SCOPES.get(specialist_name, {}).get("energy_cost_limit", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Specialist delegation error", 
                    user_id=current_user.get("id", "unknown"),
                    specialist=delegation_request.get("specialist"),
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during specialist delegation"
        )

@router.post("/luna/validate-specialist")
async def validate_specialist_token(
    validation_request: dict,
    _: None = Depends(ensure_request_is_clean)
):
    """
    🛡️ Validation d'un token spécialisé
    
    Endpoint pour que les microservices Luna valident leurs tokens reçus.
    """
    try:
        specialist_token = validation_request.get("token")
        required_specialist = validation_request.get("specialist")
        required_permissions = validation_request.get("permissions", [])
        
        if not specialist_token or not required_specialist:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token and specialist name required"
            )
        
        # Valider le token
        validated_payload = SpecialistTokenManager.validate_specialist_token(
            token=specialist_token,
            required_specialist=required_specialist,
            required_permissions=required_permissions
        )
        
        if not validated_payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired specialist token"
            )
        
        # Extraire contexte pour le microservice
        delegation_context = SpecialistTokenManager.extract_delegation_context(specialist_token)
        
        return {
            "valid": True,
            "user_id": validated_payload.get("sub"),
            "specialist": required_specialist,
            "permissions": validated_payload.get("specialist_permissions", []),
            "luna_context": validated_payload.get("luna_context", {}),
            "delegation_context": delegation_context,
            "energy_limit": delegation_context.get("energy_limit", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Specialist validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during token validation"
        )