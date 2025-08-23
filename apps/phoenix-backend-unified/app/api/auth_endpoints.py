"""
🔐 Authentication Endpoints for Luna Session Zero
Phoenix Backend Unified - Registration & Login
"""

from fastapi import APIRouter, HTTPException, Depends, status, Header
from typing import Optional
import uuid
from datetime import datetime, timezone
import logging

# Internal imports
from ..models.auth import UserRegistrationIn, UserRegistrationOut, User
from ..core.jwt_manager import hash_password, create_jwt_token, get_bearer_token, extract_user_from_token
from ..core.security_guardian import ensure_request_is_clean
from ..core.supabase_client import sb
from ..core.logging_config import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserRegistrationOut, status_code=status.HTTP_201_CREATED)
async def register_user(
    registration_data: UserRegistrationIn,
    _: None = Depends(ensure_request_is_clean)  # Security Guardian
):
    """
    Register a new user for Luna Session Zero
    
    Creates user account and returns JWT token for immediate authentication
    """
    try:
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
        
        # Create user record
        user_data = {
            "id": user_id,
            "email": registration_data.email,
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
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
        
        # Generate JWT token
        jwt_token = create_jwt_token({
            "id": user_id,
            "email": registration_data.email,
            "luna_energy": 100,
            "capital_narratif_started": False
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
        "created_at": user["created_at"]
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