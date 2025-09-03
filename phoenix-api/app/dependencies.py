from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from app.core.config import settings

reusable_oauth2 = HTTPBearer(
    scheme_name="Bearer"
)

def get_current_user_id(token: str = Depends(reusable_oauth2)) -> str:
    """
    Validates the JWT token and returns the user ID.
    This is a dependency that can be used in any endpoint to protect it.
    """
    try:
        payload = jwt.decode(
            token.credentials, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub") # "sub" is a standard claim for subject (user id)
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials: user id not found in token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
