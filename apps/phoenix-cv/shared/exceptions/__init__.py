"""
🔥 Phoenix CV - Business Exceptions
Exceptions métier spécifiques au domaine CV
"""

from .business_exceptions import (
    PhoenixCVException,
    ValidationError,
    ProcessingError,
    AIServiceError,
    QuotaExceededError,
    CVNotFoundError,
    OptimizationError
)

__all__ = [
    "PhoenixCVException",
    "ValidationError", 
    "ProcessingError",
    "AIServiceError",
    "QuotaExceededError",
    "CVNotFoundError",
    "OptimizationError"
]