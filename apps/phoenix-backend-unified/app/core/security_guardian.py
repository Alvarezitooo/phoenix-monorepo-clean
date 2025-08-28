"""
🔒 Security Guardian - Phoenix Luna Hub
Sécurité par défaut selon Directive Oracle #5
"""

import re
from typing import Any, Dict, Optional
from fastapi import HTTPException, status, Depends, Request
from pydantic import BaseModel, Field, validator
import bleach
import structlog

logger = structlog.get_logger("security_guardian")


class SecurityGuardian:
    """
    🔒 Gardien de la sécurité pour tous les endpoints Luna
    Directive Oracle #5: Sécurité = Fondation, pas Option
    """
    
    # Patterns dangereux
    SQL_INJECTION_PATTERNS = [
        r"(\s|^)(select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript)\s",
        r"(\s|^)(union|having|group\s+by|order\s+by)\s",
        r"['\";].*['\";]",
        r"--\s",
        r"/\*.*\*/"
    ]
    
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"vbscript:",
        r"on\w+\s*=",
        r"<iframe[^>]*>.*?</iframe>"
    ]
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """
        Nettoie et valide une chaîne de caractères
        """
        if not value:
            return ""
        
        # Limitation de taille
        if len(value) > max_length:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Input too long (max {max_length} characters)"
            )
        
        # 🛡️ Nettoyage HTML/XSS avec protection fail-secure
        try:
            cleaned = bleach.clean(value, tags=[], attributes={}, strip=True)
        except Exception as e:
            logger.error("String sanitization failed - blocking for security",
                        input_length=len(value),
                        error=str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security sanitization failed - input rejected"
            )
        
        # Détection SQL injection
        for pattern in SecurityGuardian.SQL_INJECTION_PATTERNS:
            if re.search(pattern, cleaned.lower()):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Suspicious input detected"
                )
        
        # Détection XSS
        for pattern in SecurityGuardian.XSS_PATTERNS:
            if re.search(pattern, cleaned.lower()):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Potentially malicious content detected"
                )
        
        return cleaned.strip()
    
    @staticmethod
    def validate_user_id(user_id: str) -> str:
        """
        Valide un ID utilisateur selon les standards
        """
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )
        
        # Format UUID ou alphanumérique avec tirets
        if not re.match(r'^[a-zA-Z0-9\-_]{1,50}$', user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        return user_id
    
    @staticmethod
    def validate_action_name(action_name: str) -> str:
        """
        Valide un nom d'action Luna
        """
        cleaned = SecurityGuardian.sanitize_string(action_name, 100)
        
        # Actions doivent être dans la liste autorisée
        from app.models.user_energy import ENERGY_COSTS
        if cleaned not in ENERGY_COSTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown action: {cleaned}"
            )
        
        return cleaned
    
    @staticmethod
    def validate_context(context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Valide et nettoie le contexte métier
        """
        if not context:
            return {}
        
        # Limitation de taille du contexte
        if len(str(context)) > 5000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Context too large"
            )
        
        # Nettoyage des valeurs string
        cleaned_context = {}
        for key, value in context.items():
            if isinstance(value, str):
                cleaned_context[key] = SecurityGuardian.sanitize_string(value, 500)
            elif isinstance(value, (int, float, bool)):
                cleaned_context[key] = value
            elif isinstance(value, dict):
                # Récursion limitée pour sous-objets
                cleaned_context[key] = SecurityGuardian.validate_context(value)
            else:
                # Types non autorisés ignorés
                continue
        
        return cleaned_context


class SecureUserIdValidator(BaseModel):
    """Validateur sécurisé pour les IDs utilisateur"""
    user_id: str = Field(..., min_length=1, max_length=50)
    
    @validator('user_id')
    def validate_user_id(cls, v):
        return SecurityGuardian.validate_user_id(v)


class SecureActionValidator(BaseModel):
    """Validateur sécurisé pour les actions Luna"""
    action_name: str = Field(..., min_length=1, max_length=100)
    
    @validator('action_name')
    def validate_action_name(cls, v):
        return SecurityGuardian.validate_action_name(v)


async def ensure_request_is_clean(request: Request) -> None:
    """
    Dependency to ensure request is clean and safe
    Used in auth endpoints for additional security
    
    Oracle-compliant: Fail-open pour disponibilité Railway
    """
    try:
        url_path = str(request.url.path).lower()
        
        # Allow-list: Endpoints système Railway + santé (CRITIQUE)
        system_endpoints = {
            '/', '/health', '/docs', '/openapi.json', '/__edge_probe',
            '/monitoring/health', '/monitoring/ready', '/monitoring/metrics'
        }
        
        # Bypass total pour endpoints système
        if url_path in system_endpoints or url_path.startswith('/monitoring/'):
            return  # Accès libre pour Railway probes
        
        # Allow-list: Préfixes d'endpoints métier légitimes
        trusted_endpoint_prefixes = [
            '/billing/',
            '/auth/',
            '/luna/',
            '/monitoring/'
        ]
        
        # Vérification allow-list métier
        is_trusted_endpoint = any(
            url_path.startswith(prefix) for prefix in trusted_endpoint_prefixes
        )
        
        if is_trusted_endpoint:
            # Log traçabilité pour audit
            logger.info("Security Guardian: Trusted endpoint allowed",
                       path=request.url.path,
                       method=request.method,
                       security_action="allow_list_bypass",
                       guardian_status="trusted")
            return  # Skip pattern checks pour endpoints de confiance
        
        # Check for common attack patterns in URL (endpoints non-trusted uniquement)
        suspicious_patterns = [
            '../', './', 'script', 'eval', 'exec', 'union', 'select', 'drop', 'delete'
        ]
        
        for pattern in suspicious_patterns:
            if pattern in url_path:
                logger.warning("Security Guardian: Suspicious pattern blocked",
                              path=request.url.path,
                              method=request.method,
                              pattern_detected=pattern,
                              security_action="pattern_block",
                              guardian_status="blocked")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Suspicious request pattern detected"
                )
        
        # Check User-Agent for suspicious patterns
        user_agent = request.headers.get("user-agent", "").lower()
        if not user_agent or len(user_agent) > 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user agent"
            )
        
        # Validation passed - return nothing (FastAPI dependency pattern)
        return
        
    except HTTPException:
        # Re-raise HTTPException (voulues)
        raise
    except Exception as e:
        # 🛡️ FAIL-SECURE: En cas d'erreur Guardian → BLOQUER par sécurité
        logger.error("Security Guardian fail-secure - blocking request due to validation error",
                    path=request.url.path,
                    method=request.method,
                    error=str(e),
                    guardian_status="fail_secure_blocked")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security validation error - request blocked for safety"
        )