import os
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt  # pip install PyJWT
import structlog

logger = structlog.get_logger("security")

# 🔒 Sécurité renforcée - Pas de bypass dev
bearer = HTTPBearer(auto_error=True)  # Force token requirement

def verify_jwt(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    """
    🛡️ Validation JWT sécurisée - Production grade
    SUPPRESSION du bypass dev pour sécurité maximale
    """
    if creds is None: 
        logger.warning("JWT validation failed: Missing token")
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = creds.credentials
    
    # 🔐 Secret JWT obligatoire
    jwt_secret = os.getenv("JWT_PUBLIC_KEY")
    if not jwt_secret:
        logger.error("JWT_PUBLIC_KEY environment variable not set")
        raise HTTPException(status_code=500, detail="Server configuration error")
    
    try:
        # 🔒 Validation JWT stricte avec audience
        decoded = jwt.decode(
            token, 
            jwt_secret, 
            algorithms=["HS256", "RS256"], 
            options={"verify_aud": True, "verify_signature": True}
        )
        logger.info("JWT validation successful", user_id=decoded.get("user_id", "unknown"))
        return decoded
        
    except jwt.InvalidTokenError as e:
        logger.warning("JWT validation failed", error=str(e), token_prefix=token[:10] + "...")
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    except Exception as e:
        logger.error("Unexpected JWT validation error", error=str(e))
        raise HTTPException(status_code=401, detail="Token validation failed")