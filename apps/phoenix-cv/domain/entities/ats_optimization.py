"""
🎯 Phoenix CV - ATS Optimization Domain Entity
Clean Architecture - Optimisation pour systèmes ATS
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class ATSSystemType(Enum):
    """Types de systèmes ATS"""
    WORKDAY = "workday"
    GREENHOUSE = "greenhouse"
    LEVER = "lever"
    BAMBOO_HR = "bamboo_hr"
    SMART_RECRUITERS = "smart_recruiters"
    GENERIC = "generic"


class OptimizationPriority(Enum):
    """Priorité d'optimisation"""
    CRITICAL = "critical"      # Bloquant pour ATS
    HIGH = "high"              # Impact élevé
    MEDIUM = "medium"          # Amélioration recommandée
    LOW = "low"                # Nice to have


class RuleCategory(Enum):
    """Catégorie de règle ATS"""
    FORMATTING = "formatting"          # Format, mise en page
    KEYWORDS = "keywords"              # Mots-clés, densité
    STRUCTURE = "structure"            # Structure, sections
    CONTENT = "content"                # Contenu, lisibilité
    TECHNICAL = "technical"            # Aspects techniques


@dataclass
class ATSRule:
    """Règle d'optimisation ATS"""
    
    rule_id: str
    name: str
    description: str
    category: RuleCategory
    priority: OptimizationPriority
    
    # Critères de validation
    check_function: str = ""  # Nom de la fonction de vérification
    weight: float = field(default=1.0)  # Poids dans le score global
    
    # Métadonnées
    ats_systems: List[ATSSystemType] = field(default_factory=list)
    industry_specific: bool = field(default=False)
    
    def __post_init__(self):
        """Validation post-initialisation"""
        if not self.rule_id or not self.name:
            raise ValueError("rule_id et name sont obligatoires")


@dataclass
class OptimizationSuggestion:
    """Suggestion d'optimisation ATS"""
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    rule_id: str = ""
    
    # Description de l'amélioration
    title: str = ""
    description: str = ""
    priority: OptimizationPriority = OptimizationPriority.MEDIUM
    
    # Détails techniques
    current_value: Any = None
    suggested_value: Any = None
    impact_score: float = field(default=0.0)  # 0-10
    
    # Guidance d'implémentation
    implementation_steps: List[str] = field(default_factory=list)
    examples: List[str] = field(default_factory=list)
    
    # Métadonnées
    section_affected: str = ""  # Quelle section du CV
    automated_fix: bool = field(default=False)  # Peut être corrigé automatiquement
    
    def __post_init__(self):
        """Validation post-initialisation"""
        if not self.title or not self.description:
            raise ValueError("title et description sont obligatoires")


@dataclass
class ATSCompatibilityScore:
    """Score de compatibilité ATS détaillé"""
    
    overall_score: float = field(default=0.0)  # 0-100
    
    # Scores par catégorie
    formatting_score: float = field(default=0.0)
    keywords_score: float = field(default=0.0)
    structure_score: float = field(default=0.0)
    content_score: float = field(default=0.0)
    technical_score: float = field(default=0.0)
    
    # Détails
    rules_passed: int = field(default=0)
    rules_failed: int = field(default=0)
    critical_issues: int = field(default=0)
    
    def calculate_overall_score(self) -> float:
        """Calcule le score global pondéré"""
        weights = {
            "formatting": 0.25,
            "keywords": 0.30,
            "structure": 0.20,
            "content": 0.15,
            "technical": 0.10
        }
        
        score = (
            self.formatting_score * weights["formatting"] +
            self.keywords_score * weights["keywords"] +
            self.structure_score * weights["structure"] +
            self.content_score * weights["content"] +
            self.technical_score * weights["technical"]
        )
        
        # Pénalité pour les issues critiques
        critical_penalty = self.critical_issues * 5
        score = max(0, score - critical_penalty)
        
        self.overall_score = round(score, 1)
        return self.overall_score
    
    @property
    def compatibility_level(self) -> str:
        """Niveau de compatibilité textuel"""
        if self.overall_score >= 90:
            return "Excellent"
        elif self.overall_score >= 80:
            return "Très bon"
        elif self.overall_score >= 70:
            return "Bon"
        elif self.overall_score >= 60:
            return "Moyen"
        else:
            return "Faible"


@dataclass
class ATSOptimization:
    """
    🎯 Entité principale - Optimisation ATS complète
    """
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    cv_id: str = ""
    
    # Configuration de l'analyse
    target_ats_system: ATSSystemType = ATSSystemType.GENERIC
    target_industry: Optional[str] = None
    
    # Résultats de l'analyse
    compatibility_score: ATSCompatibilityScore = field(default_factory=ATSCompatibilityScore)
    suggestions: List[OptimizationSuggestion] = field(default_factory=list)
    
    # Analyse détaillée
    keyword_analysis: Dict[str, Any] = field(default_factory=dict)
    format_analysis: Dict[str, Any] = field(default_factory=dict)
    structure_analysis: Dict[str, Any] = field(default_factory=dict)
    
    # Métadonnées
    analysis_date: datetime = field(default_factory=datetime.now)
    rules_version: str = "1.0"
    processing_time_ms: int = 0
    
    def add_suggestion(self, suggestion: OptimizationSuggestion) -> None:
        """Ajoute une suggestion d'optimisation"""
        self.suggestions.append(suggestion)
        
        # Mise à jour des compteurs
        if suggestion.priority == OptimizationPriority.CRITICAL:
            self.compatibility_score.critical_issues += 1
    
    def get_critical_suggestions(self) -> List[OptimizationSuggestion]:
        """Récupère les suggestions critiques"""
        return [s for s in self.suggestions if s.priority == OptimizationPriority.CRITICAL]
    
    def get_high_impact_suggestions(self, limit: int = 5) -> List[OptimizationSuggestion]:
        """Récupère les suggestions à fort impact"""
        high_impact = [s for s in self.suggestions if s.impact_score >= 7.0]
        return sorted(high_impact, key=lambda s: s.impact_score, reverse=True)[:limit]
    
    def get_automated_fixes(self) -> List[OptimizationSuggestion]:
        """Récupère les corrections automatisables"""
        return [s for s in self.suggestions if s.automated_fix]
    
    def generate_optimization_summary(self) -> Dict[str, Any]:
        """Génère un résumé de l'optimisation"""
        return {
            "overall_score": self.compatibility_score.overall_score,
            "compatibility_level": self.compatibility_score.compatibility_level,
            "total_suggestions": len(self.suggestions),
            "critical_issues": self.compatibility_score.critical_issues,
            "automated_fixes_available": len(self.get_automated_fixes()),
            "top_improvements": [
                {
                    "title": s.title,
                    "impact": s.impact_score,
                    "priority": s.priority.value
                }
                for s in self.get_high_impact_suggestions(3)
            ],
            "category_scores": {
                "formatting": self.compatibility_score.formatting_score,
                "keywords": self.compatibility_score.keywords_score,
                "structure": self.compatibility_score.structure_score,
                "content": self.compatibility_score.content_score,
                "technical": self.compatibility_score.technical_score
            }
        }
    
    def calculate_optimization_impact(self) -> float:
        """Calcule l'impact potentiel de toutes les optimisations"""
        if not self.suggestions:
            return 0.0
        
        # Somme pondérée des impacts
        total_impact = sum(
            s.impact_score * (1.0 if s.priority == OptimizationPriority.CRITICAL else 
                             0.8 if s.priority == OptimizationPriority.HIGH else
                             0.6 if s.priority == OptimizationPriority.MEDIUM else 0.4)
            for s in self.suggestions
        )
        
        return min(100, total_impact)  # Cap à 100
    
    def get_implementation_roadmap(self) -> List[Dict[str, Any]]:
        """Génère une roadmap d'implémentation"""
        roadmap = []
        
        # Phase 1: Corrections critiques
        critical = self.get_critical_suggestions()
        if critical:
            roadmap.append({
                "phase": 1,
                "title": "Corrections critiques",
                "description": "Issues bloquantes pour les ATS",
                "suggestions": [s.id for s in critical],
                "estimated_time": "15-30 minutes"
            })
        
        # Phase 2: Améliorations automatisables
        automated = self.get_automated_fixes()
        if automated:
            roadmap.append({
                "phase": 2,
                "title": "Optimisations automatiques",
                "description": "Corrections appliquées automatiquement",
                "suggestions": [s.id for s in automated],
                "estimated_time": "5 minutes"
            })
        
        # Phase 3: Améliorations manuelles high-impact
        manual_high = [s for s in self.suggestions 
                      if s.priority == OptimizationPriority.HIGH and not s.automated_fix]
        if manual_high:
            roadmap.append({
                "phase": 3,
                "title": "Améliorations manuelles prioritaires",
                "description": "Optimisations à fort impact",
                "suggestions": [s.id for s in manual_high[:5]],
                "estimated_time": "30-60 minutes"
            })
        
        return roadmap
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation pour persistance/API"""
        return {
            "id": self.id,
            "cv_id": self.cv_id,
            "target_ats_system": self.target_ats_system.value,
            "target_industry": self.target_industry,
            "compatibility_score": {
                "overall_score": self.compatibility_score.overall_score,
                "compatibility_level": self.compatibility_score.compatibility_level,
                "formatting_score": self.compatibility_score.formatting_score,
                "keywords_score": self.compatibility_score.keywords_score,
                "structure_score": self.compatibility_score.structure_score,
                "content_score": self.compatibility_score.content_score,
                "technical_score": self.compatibility_score.technical_score,
                "rules_passed": self.compatibility_score.rules_passed,
                "rules_failed": self.compatibility_score.rules_failed,
                "critical_issues": self.compatibility_score.critical_issues
            },
            "suggestions": [
                {
                    "id": s.id,
                    "rule_id": s.rule_id,
                    "title": s.title,
                    "description": s.description,
                    "priority": s.priority.value,
                    "impact_score": s.impact_score,
                    "section_affected": s.section_affected,
                    "automated_fix": s.automated_fix,
                    "implementation_steps": s.implementation_steps,
                    "examples": s.examples
                }
                for s in self.suggestions
            ],
            "keyword_analysis": self.keyword_analysis,
            "format_analysis": self.format_analysis,
            "structure_analysis": self.structure_analysis,
            "analysis_date": self.analysis_date.isoformat(),
            "rules_version": self.rules_version,
            "processing_time_ms": self.processing_time_ms,
            "optimization_summary": self.generate_optimization_summary(),
            "implementation_roadmap": self.get_implementation_roadmap(),
            "potential_impact": self.calculate_optimization_impact()
        }