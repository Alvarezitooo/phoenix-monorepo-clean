import os
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt  # pip install PyJWT

bearer = HTTPBearer(auto_error=False)

def verify_jwt(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if os.getenv("HUB_ENV","dev") == "dev":
        return {"dev": True}
    if creds is None: 
        raise HTTPException(status_code=401, detail="Missing token")
    token = creds.credentials
    try:
        decoded = jwt.decode(token, os.getenv("JWT_PUBLIC_KEY","secret"), algorithms=["HS256","RS256"], options={"verify_aud": False})
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    return decoded