"""
🔥 Phoenix CV - Business Exceptions
Exceptions métier pour la gestion d'erreurs Clean Architecture
"""


class PhoenixCVException(Exception):
    """Exception de base pour Phoenix CV"""
    
    def __init__(self, message: str, error_code: str = "PHOENIX_CV_ERROR", details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> dict:
        """Sérialisation pour API"""
        return {
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details
        }


class ValidationError(PhoenixCVException):
    """Erreur de validation des données d'entrée"""
    
    def __init__(self, message: str, field: str = None, details: dict = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details={"field": field, **(details or {})}
        )


class ProcessingError(PhoenixCVException):
    """Erreur de traitement métier"""
    
    def __init__(self, message: str, operation: str = None, details: dict = None):
        super().__init__(
            message=message,
            error_code="PROCESSING_ERROR", 
            details={"operation": operation, **(details or {})}
        )


class AIServiceError(PhoenixCVException):
    """Erreur du service IA (Gemini)"""
    
    def __init__(self, message: str, ai_provider: str = "gemini", details: dict = None):
        super().__init__(
            message=message,
            error_code="AI_SERVICE_ERROR",
            details={"ai_provider": ai_provider, **(details or {})}
        )


class QuotaExceededError(PhoenixCVException):
    """Erreur de dépassement de quota"""
    
    def __init__(self, message: str, quota_type: str = None, current: int = None, limit: int = None):
        super().__init__(
            message=message,
            error_code="QUOTA_EXCEEDED",
            details={
                "quota_type": quota_type,
                "current_usage": current,
                "limit": limit
            }
        )


class CVNotFoundError(PhoenixCVException):
    """Erreur CV non trouvé"""
    
    def __init__(self, cv_id: str):
        super().__init__(
            message=f"CV non trouvé: {cv_id}",
            error_code="CV_NOT_FOUND",
            details={"cv_id": cv_id}
        )


class OptimizationError(PhoenixCVException):
    """Erreur lors de l'optimisation CV"""
    
    def __init__(self, message: str, optimization_type: str = None, details: dict = None):
        super().__init__(
            message=message,
            error_code="OPTIMIZATION_ERROR",
            details={"optimization_type": optimization_type, **(details or {})}
        )