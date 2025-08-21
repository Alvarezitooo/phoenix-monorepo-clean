"""
🔥 Phoenix CV - Repository Interfaces
Interfaces pour l'accès aux données - Clean Architecture
"""

from .cv_repository import CVRepositoryInterface
from .template_repository import TemplateRepositoryInterface
from .job_analysis_repository import JobAnalysisRepositoryInterface

__all__ = [
    "CVRepositoryInterface",
    "TemplateRepositoryInterface", 
    "JobAnalysisRepositoryInterface"
]