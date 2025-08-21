"""
🔥 Phoenix CV - Domain Entities
Entités métier du domaine CV Optimization
"""

from .cv_document import CVDocument, ContactInfo, Experience, Education, Skill, CVSection
from .mirror_match import JobDescription, MirrorMatchAnalysis, SkillMatch, ExperienceMatch
from .ats_optimization import ATSOptimization, ATSRule, OptimizationSuggestion
from .trajectory_builder import CareerTrajectory, TrajectoryStep, NarrativeElement

__all__ = [
    "CVDocument", "ContactInfo", "Experience", "Education", "Skill", "CVSection",
    "JobDescription", "MirrorMatchAnalysis", "SkillMatch", "ExperienceMatch",
    "ATSOptimization", "ATSRule", "OptimizationSuggestion",
    "CareerTrajectory", "TrajectoryStep", "NarrativeElement"
]