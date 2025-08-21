"""
🔥 Phoenix CV - Database Infrastructure  
Implémentations concrètes des repositories
"""

from .mock_cv_repository import MockCVRepository
from .mock_template_repository import MockTemplateRepository

__all__ = [
    "MockCVRepository",
    "MockTemplateRepository"
]