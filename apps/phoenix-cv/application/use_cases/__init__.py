"""
🔥 Phoenix CV - Application Use Cases
Business Logic Layer - Clean Architecture
"""

from .optimize_cv_use_case import OptimizeCVUseCase, OptimizeCVCommand, OptimizeCVResult
from .mirror_match_use_case import MirrorMatchUseCase, MirrorMatchCommand, MirrorMatchResult  
from .ats_analysis_use_case import ATSAnalysisUseCase, ATSAnalysisCommand, ATSAnalysisResult
from .trajectory_builder_use_case import TrajectoryBuilderUseCase, TrajectoryBuilderCommand, TrajectoryBuilderResult

__all__ = [
    "OptimizeCVUseCase", "OptimizeCVCommand", "OptimizeCVResult",
    "MirrorMatchUseCase", "MirrorMatchCommand", "MirrorMatchResult",
    "ATSAnalysisUseCase", "ATSAnalysisCommand", "ATSAnalysisResult", 
    "TrajectoryBuilderUseCase", "TrajectoryBuilderCommand", "TrajectoryBuilderResult"
]