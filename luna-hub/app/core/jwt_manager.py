"""
🔐 JWT Token Management for Luna Authentication
Phoenix Backend Unified - Security & Token Handling
"""

from jose import jwt, JWTError
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import os
import bcrypt

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

def hash_password(password: str) -> str:
    """Hash a password for storing in database - using bcrypt direct"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash - using bcrypt direct"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"🔐 Password verification error: {e}")
        return False

def create_jwt_token(user_data: Dict[str, Any]) -> str:
    """
    Create a JWT token for authenticated user
    
    Args:
        user_data: Dictionary containing user information (id, email, etc.)
    
    Returns:
        JWT token string
    """
    # Token payload - Enhanced for Luna Microservices
    payload = {
        "sub": str(user_data["id"]),  # Subject (user ID)
        "email": user_data["email"],
        "iat": datetime.now(timezone.utc),  # Issued at
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),  # Short lived access token
        "type": "access_token",
        "luna_energy": user_data.get("luna_energy", 100),
        "narrative_started": user_data.get("capital_narratif_started", False),
        "session_id": user_data.get("session_id"),
        "jti": user_data.get("jti"),  # JWT ID for tracking
        
        # 🌙 Luna Distributed Context - NEW
        "luna_context": {
            "current_module": user_data.get("current_module", "default"),
            "specialist_permissions": user_data.get("specialist_permissions", ["aube", "cv", "letters", "rise"]),
            "narrative_chapter": user_data.get("narrative_chapter", 0),
            "user_journey_step": user_data.get("user_journey_step", "onboarding"),
            "preferred_tone": user_data.get("preferred_tone", "standard"),
            "conversation_count": user_data.get("conversation_count", 0)
        },
        "microservice_scope": user_data.get("microservice_scope", ["luna-central"])
    }
    
    # Generate token
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload or None if invalid
    """
    # Fallback for malformed tokens in production - return None gracefully
    
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Check if token is expired
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, timezone.utc) < datetime.now(timezone.utc):
            return None
            
        return payload
    except (JWTError, Exception):
        return None

def extract_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Extract user information from JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        User data or None if token is invalid
    """
    payload = verify_jwt_token(token)
    if not payload:
        return None
        
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "luna_energy": payload.get("luna_energy", 100),
        "narrative_started": payload.get("narrative_started", False),
        "session_id": payload.get("session_id"),
        "jti": payload.get("jti")
    }

def get_bearer_token(authorization: str) -> Optional[str]:
    """
    Extract bearer token from Authorization header
    
    Args:
        authorization: Authorization header value
        
    Returns:
        Token string or None if not valid bearer format
    """
    if not authorization:
        return None
        
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
        
    return parts[1]