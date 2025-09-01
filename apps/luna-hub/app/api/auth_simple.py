"""
🔐 Authentication Simple - Compatible avec vos tables existantes
Utilise: users + events (votre schéma) + users_energy
"""

from fastapi import APIRouter, HTTPException, Depends, status, Header, Request
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
from datetime import datetime, timezone

# Internal imports
from ..models.auth import UserRegistrationIn, UserRegistrationOut
from ..core.jwt_manager import hash_password, verify_password, create_jwt_token, get_bearer_token, extract_user_from_token
from ..core.supabase_client import sb
from ..core.logging_config import logger
from ..core.events import create_event

router = APIRouter(prefix="/auth", tags=["Authentication Simple"])

@router.post("/register", response_model=UserRegistrationOut, status_code=status.HTTP_201_CREATED)
async def register_user(registration_data: UserRegistrationIn, request: Request):
    """
    Register user - Version simplifiée compatible avec vos tables
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        # Check if user exists
        if sb:
            result = sb.table("users").select("*").eq("email", registration_data.email).execute()
            if result.data:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User already exists"
                )
        
        # Create user
        user_id = str(uuid.uuid4())
        password_hash = hash_password(registration_data.password)
        
        user_data = {
            "id": user_id,
            "email": registration_data.email,
            "password_hash": password_hash,
            "name": registration_data.name if hasattr(registration_data, 'name') else None,
            "luna_energy": 100,
            "capital_narratif_started": False
        }
        
        if sb:
            result = sb.table("users").insert(user_data).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create user")
        
        # Create JWT (simple, sans refresh token pour l'instant)
        jwt_token = create_jwt_token({
            "id": user_id,
            "email": registration_data.email,
            "luna_energy": 100,
            "capital_narratif_started": False
        })
        
        # Log event dans votre table events
        await create_event({
            "type": "user_registered",
            "actor_user_id": user_id,
            "payload": {
                "email": registration_data.email,
                "ip": client_ip,
                "user_agent": user_agent
            }
        })
        
        # Sync avec users_energy si elle existe
        if sb:
            try:
                sb.table("users_energy").upsert({
                    "user_id": user_id,
                    "current_energy": 100,
                    "is_unlimited": False
                }, on_conflict="user_id").execute()
            except Exception as e:
                logger.warning("Failed to create user energy record", error=str(e), user_id=user_id)
                # users_energy optionnelle - continue without failing
        
        logger.info(f"User registered: {registration_data.email}")
        
        return UserRegistrationOut(
            access_token=jwt_token,
            token_type="bearer",
            user_id=user_id,
            email=registration_data.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
async def login_user(login_data: dict, request: Request):
    """
    Login user - Version simplifiée
    """
    try:
        email = login_data.get("email")
        password = login_data.get("password")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # Get user
        if not sb:
            raise HTTPException(status_code=500, detail="Database not available")
            
        result = sb.table("users").select("*").eq("email", email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = result.data[0]
        
        # Verify password
        if not verify_password(password, user["password_hash"]):
            await create_event({
                "type": "login_failed",
                "actor_user_id": user["id"],
                "payload": {"email": email, "reason": "invalid_password"}
            })
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create JWT
        jwt_token = create_jwt_token({
            "id": user["id"],
            "email": user["email"],
            "luna_energy": user.get("luna_energy", 100),
            "capital_narratif_started": user.get("capital_narratif_started", False)
        })
        
        # Log success
        await create_event({
            "type": "login_succeeded",
            "actor_user_id": user["id"],
            "payload": {"email": email}
        })
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user_id": user["id"],
            "email": user["email"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Get current user info
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")
    
    token = get_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    user_data = extract_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get fresh user data
    if sb:
        result = sb.table("users").select("*").eq("id", user_data["id"]).execute()
        if result.data:
            user = result.data[0]
            return {
                "id": user["id"],
                "email": user["email"],
                "luna_energy": user.get("luna_energy", 100),
                "narrative_started": user.get("capital_narratif_started", False),
                "created_at": user["created_at"]
            }
    
    return user_data

# Helper functions
async def get_user_by_email(email: str):
    """Get user by email"""
    if not sb:
        return None
    try:
        result = sb.table("users").select("*").eq("email", email).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.warning("Failed to get user by email", error=str(e), email=email)
        return None

async def get_user_by_id(user_id: str):
    """Get user by ID"""
    if not sb:
        return None
    try:
        result = sb.table("users").select("*").eq("id", user_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.warning("Failed to get user by ID", error=str(e), user_id=user_id)
        return None