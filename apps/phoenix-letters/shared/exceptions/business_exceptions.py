"""
Exceptions métier Phoenix Letters
Clean Architecture - Exceptions du domaine métier
"""

from typing import Optional, Dict, Any


class PhoenixLettersException(Exception):
    """Exception de base pour Phoenix Letters"""
    
    def __init__(self, message: str, error_code: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation pour APIs et logs"""
        return {
            "error_type": self.__class__.__name__,
            "message": self.message,
            "error_code": self.error_code,
            "details": self.details,
        }


class ValidationError(PhoenixLettersException):
    """Erreur de validation des données d'entrée"""
    
    def __init__(self, message: str, field: Optional[str] = None, value: Optional[str] = None):
        details = {}
        if field:
            details["field"] = field
        if value:
            details["invalid_value"] = value
        
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details=details
        )


class BusinessRuleError(PhoenixLettersException):
    """Erreur de règle métier violée"""
    
    def __init__(self, message: str, rule: Optional[str] = None):
        details = {}
        if rule:
            details["violated_rule"] = rule
        
        super().__init__(
            message=message,
            error_code="BUSINESS_RULE_ERROR",
            details=details
        )


class QuotaExceededError(BusinessRuleError):
    """Erreur de quota dépassé"""
    
    def __init__(self, message: str, current_usage: Optional[int] = None, limit: Optional[int] = None):
        details = {}
        if current_usage is not None:
            details["current_usage"] = current_usage
        if limit is not None:
            details["limit"] = limit
        
        super().__init__(
            message=message,
            rule="quota_limit"
        )
        self.details.update(details)
        self.error_code = "QUOTA_EXCEEDED"


class AuthenticationError(PhoenixLettersException):
    """Erreur d'authentification"""
    
    def __init__(self, message: str = "Authentification requise"):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(PhoenixLettersException):
    """Erreur d'autorisation"""
    
    def __init__(self, message: str, required_permission: Optional[str] = None):
        details = {}
        if required_permission:
            details["required_permission"] = required_permission
        
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )


class ResourceNotFoundError(PhoenixLettersException):
    """Ressource introuvable"""
    
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            message=f"{resource_type} avec ID '{resource_id}' introuvable",
            error_code="RESOURCE_NOT_FOUND",
            details={
                "resource_type": resource_type,
                "resource_id": resource_id
            }
        )


class ExternalServiceError(PhoenixLettersException):
    """Erreur de service externe (IA, DB, etc.)"""
    
    def __init__(self, service_name: str, message: str, is_temporary: bool = True):
        super().__init__(
            message=f"Erreur {service_name}: {message}",
            error_code="EXTERNAL_SERVICE_ERROR",
            details={
                "service_name": service_name,
                "is_temporary": is_temporary
            }
        )


class AIServiceError(ExternalServiceError):
    """Erreur spécifique aux services IA"""
    
    def __init__(self, message: str, model_name: Optional[str] = None, is_temporary: bool = True):
        details = {"is_temporary": is_temporary}
        if model_name:
            details["model_name"] = model_name
        
        super().__init__(
            service_name="IA",
            message=message,
            is_temporary=is_temporary
        )
        self.details.update(details)
        self.error_code = "AI_SERVICE_ERROR"


class PaymentError(PhoenixLettersException):
    """Erreur de paiement/abonnement"""
    
    def __init__(self, message: str, stripe_error_code: Optional[str] = None):
        details = {}
        if stripe_error_code:
            details["stripe_error_code"] = stripe_error_code
        
        super().__init__(
            message=message,
            error_code="PAYMENT_ERROR",
            details=details
        )


class ConfigurationError(PhoenixLettersException):
    """Erreur de configuration"""
    
    def __init__(self, message: str, config_key: Optional[str] = None):
        details = {}
        if config_key:
            details["config_key"] = config_key
        
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            details=details
        )


class RateLimitError(PhoenixLettersException):
    """Erreur de limite de taux (rate limiting)"""
    
    def __init__(self, message: str, retry_after_seconds: Optional[int] = None):
        details = {}
        if retry_after_seconds:
            details["retry_after_seconds"] = retry_after_seconds
        
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_ERROR",
            details=details
        )


# Helpers pour la gestion centralisée des erreurs

def handle_repository_error(error: Exception, operation: str) -> PhoenixLettersException:
    """
    Convertit les erreurs de repository en exceptions métier appropriées
    
    Args:
        error: Exception originale
        operation: Type d'opération (save, get, delete, etc.)
        
    Returns:
        PhoenixLettersException: Exception métier appropriée
    """
    error_msg = str(error)
    
    if "not found" in error_msg.lower():
        return ResourceNotFoundError("Resource", "unknown")
    elif "timeout" in error_msg.lower():
        return ExternalServiceError("Database", f"Timeout during {operation}", is_temporary=True)
    elif "connection" in error_msg.lower():
        return ExternalServiceError("Database", f"Connection error during {operation}", is_temporary=True)
    else:
        return ExternalServiceError("Database", f"Error during {operation}: {error_msg}", is_temporary=False)


def handle_ai_error(error: Exception, model_name: str) -> AIServiceError:
    """
    Convertit les erreurs IA en exceptions métier appropriées
    
    Args:
        error: Exception originale
        model_name: Nom du modèle IA
        
    Returns:
        AIServiceError: Exception IA appropriée
    """
    error_msg = str(error)
    
    # Classification des erreurs IA
    if any(keyword in error_msg.lower() for keyword in ["rate limit", "quota", "usage"]):
        return AIServiceError(f"Limite de quota atteinte pour {model_name}", model_name, is_temporary=True)
    elif any(keyword in error_msg.lower() for keyword in ["timeout", "connection"]):
        return AIServiceError(f"Problème de connexion avec {model_name}", model_name, is_temporary=True)
    elif "api key" in error_msg.lower():
        return AIServiceError(f"Clé API invalide pour {model_name}", model_name, is_temporary=False)
    else:
        return AIServiceError(f"Erreur {model_name}: {error_msg}", model_name, is_temporary=True)