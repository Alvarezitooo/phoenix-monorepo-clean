"""
🎯 Phoenix CV - Mirror Match Engine Domain
GAME CHANGER - Moteur de correspondance CV-Offre d'emploi avec IA
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any, Set
from datetime import datetime
from enum import Enum
import uuid


class MatchType(Enum):
    """Type de correspondance"""
    PERFECT_MATCH = "perfect_match"      # 90-100%
    STRONG_MATCH = "strong_match"        # 75-89%
    GOOD_MATCH = "good_match"            # 60-74%
    PARTIAL_MATCH = "partial_match"      # 40-59%
    WEAK_MATCH = "weak_match"            # 0-39%


class RequirementType(Enum):
    """Type d'exigence du poste"""
    MANDATORY = "mandatory"      # Obligatoire
    PREFERRED = "preferred"      # Préféré
    NICE_TO_HAVE = "nice_to_have"  # Bonus


class SkillMatchLevel(Enum):
    """Niveau de correspondance compétence"""
    EXACT_MATCH = "exact_match"          # Correspondance exacte
    CLOSE_MATCH = "close_match"          # Compétence proche/similaire
    TRANSFERABLE = "transferable"        # Compétence transférable
    MISSING = "missing"                  # Compétence manquante


@dataclass
class JobRequirement:
    """Exigence d'un poste"""
    
    keyword: str
    category: str  # "skill", "experience", "education", "certification"
    requirement_type: RequirementType
    weight: float = field(default=1.0)  # Poids dans l'évaluation
    context: str = ""  # Contexte d'utilisation
    
    # Métadonnées IA
    is_technical: bool = field(default=False)
    industry_specific: bool = field(default=False)
    seniority_level: Optional[str] = None


@dataclass
class SkillMatch:
    """Correspondance entre compétence CV et exigence poste"""
    
    cv_skill: str
    job_requirement: str
    match_level: SkillMatchLevel
    confidence_score: float = field(default=0.0)  # 0-1
    
    # Détails de la correspondance
    explanation: str = ""
    cv_context: str = ""  # Où cette compétence apparaît dans le CV
    job_context: str = ""  # Contexte dans l'offre d'emploi
    
    # Recommandations
    optimization_suggestion: str = ""
    
    @property
    def match_score(self) -> float:
        """Score de correspondance (0-100)"""
        multipliers = {
            SkillMatchLevel.EXACT_MATCH: 1.0,
            SkillMatchLevel.CLOSE_MATCH: 0.8,
            SkillMatchLevel.TRANSFERABLE: 0.6,
            SkillMatchLevel.MISSING: 0.0
        }
        return self.confidence_score * multipliers[self.match_level] * 100


@dataclass
class ExperienceMatch:
    """Correspondance expérience"""
    
    required_years: int
    candidate_years: int
    industry_match: bool = field(default=False)
    role_similarity: float = field(default=0.0)  # 0-1
    
    @property
    def experience_score(self) -> float:
        """Score expérience (0-100)"""
        base_score = min(100, (self.candidate_years / self.required_years) * 100) if self.required_years > 0 else 100
        
        # Bonus pour industrie similaire
        if self.industry_match:
            base_score *= 1.1
        
        # Bonus pour similarité de rôle
        base_score *= (1 + self.role_similarity * 0.2)
        
        return min(100, base_score)


@dataclass
class JobDescription:
    """Analyse d'une offre d'emploi"""
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Informations de base
    job_title: str = ""
    company_name: str = ""
    industry: str = ""
    location: str = ""
    employment_type: str = "full_time"  # full_time, part_time, contract
    
    # Contenu analysé
    raw_description: str = ""
    requirements: List[JobRequirement] = field(default_factory=list)
    
    # Métadonnées extraites par IA
    required_experience_years: int = 0
    education_level: str = ""  # "bachelor", "master", "phd", "none"
    salary_range: Optional[Dict[str, int]] = None  # {"min": 50000, "max": 80000}
    
    # Analyse IA
    key_responsibilities: List[str] = field(default_factory=list)
    company_culture_keywords: List[str] = field(default_factory=list)
    growth_opportunities: List[str] = field(default_factory=list)
    
    # Scoring
    difficulty_score: float = field(default=0.0)  # 0-10, difficulté du poste
    competition_level: str = "medium"  # low, medium, high
    
    created_at: datetime = field(default_factory=datetime.now)
    
    def add_requirement(self, keyword: str, category: str, req_type: RequirementType, weight: float = 1.0) -> None:
        """Ajoute une exigence"""
        requirement = JobRequirement(
            keyword=keyword,
            category=category,
            requirement_type=req_type,
            weight=weight
        )
        self.requirements.append(requirement)
    
    def get_mandatory_requirements(self) -> List[JobRequirement]:
        """Récupère les exigences obligatoires"""
        return [req for req in self.requirements if req.requirement_type == RequirementType.MANDATORY]
    
    def get_technical_requirements(self) -> List[JobRequirement]:
        """Récupère les exigences techniques"""
        return [req for req in self.requirements if req.is_technical]


@dataclass
class MirrorMatchAnalysis:
    """
    🎯 GAME CHANGER - Analyse complète Mirror Match
    Cœur du système de correspondance CV-Poste
    """
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Références
    cv_id: str = ""
    job_description_id: str = ""
    
    # Scores globaux
    overall_compatibility: float = field(default=0.0)  # 0-100
    match_type: MatchType = MatchType.WEAK_MATCH
    
    # Analyses détaillées
    skill_matches: List[SkillMatch] = field(default_factory=list)
    experience_match: Optional[ExperienceMatch] = None
    education_match_score: float = field(default=0.0)  # 0-100
    
    # Correspondances textuelles
    keyword_density: float = field(default=0.0)  # Densité mots-clés
    phrase_matches: List[str] = field(default_factory=list)  # Phrases similaires
    
    # Analyses avancées
    cultural_fit_score: float = field(default=0.0)  # 0-100
    growth_alignment_score: float = field(default=0.0)  # 0-100
    
    # Optimisations recommandées
    priority_improvements: List[str] = field(default_factory=list)
    content_optimizations: List[str] = field(default_factory=list)
    keyword_suggestions: List[str] = field(default_factory=list)
    
    # Prédictions IA
    application_success_probability: float = field(default=0.0)  # 0-100
    interview_likelihood: float = field(default=0.0)  # 0-100
    
    created_at: datetime = field(default_factory=datetime.now)
    analysis_version: str = "1.0"
    
    def calculate_overall_compatibility(self) -> float:
        """
        🔥 Algorithme de calcul de compatibilité globale
        """
        # Pondération des différents facteurs
        weights = {
            "skills": 0.40,      # 40% - Compétences
            "experience": 0.25,   # 25% - Expérience
            "education": 0.15,    # 15% - Formation
            "keywords": 0.10,     # 10% - Mots-clés
            "culture": 0.10       # 10% - Culture/fit
        }
        
        # Score compétences (moyenne pondérée)
        skills_score = 0.0
        if self.skill_matches:
            total_weight = sum(match.confidence_score for match in self.skill_matches)
            if total_weight > 0:
                skills_score = sum(
                    match.match_score * match.confidence_score 
                    for match in self.skill_matches
                ) / total_weight
        
        # Score expérience
        experience_score = self.experience_match.experience_score if self.experience_match else 0.0
        
        # Score final
        overall_score = (
            skills_score * weights["skills"] +
            experience_score * weights["experience"] +
            self.education_match_score * weights["education"] +
            self.keyword_density * 100 * weights["keywords"] +
            self.cultural_fit_score * weights["culture"]
        )
        
        self.overall_compatibility = round(overall_score, 1)
        self._update_match_type()
        return self.overall_compatibility
    
    def _update_match_type(self) -> None:
        """Met à jour le type de correspondance"""
        score = self.overall_compatibility
        if score >= 90:
            self.match_type = MatchType.PERFECT_MATCH
        elif score >= 75:
            self.match_type = MatchType.STRONG_MATCH
        elif score >= 60:
            self.match_type = MatchType.GOOD_MATCH
        elif score >= 40:
            self.match_type = MatchType.PARTIAL_MATCH
        else:
            self.match_type = MatchType.WEAK_MATCH
    
    def get_missing_skills(self) -> List[str]:
        """Récupère les compétences manquantes"""
        return [
            match.job_requirement 
            for match in self.skill_matches 
            if match.match_level == SkillMatchLevel.MISSING
        ]
    
    def get_strong_matches(self) -> List[SkillMatch]:
        """Récupère les correspondances fortes"""
        return [
            match for match in self.skill_matches 
            if match.match_level in [SkillMatchLevel.EXACT_MATCH, SkillMatchLevel.CLOSE_MATCH]
            and match.match_score >= 70
        ]
    
    def generate_optimization_strategy(self) -> Dict[str, Any]:
        """
        🎯 Génère une stratégie d'optimisation personnalisée
        """
        strategy = {
            "priority_level": "high" if self.overall_compatibility < 60 else "medium" if self.overall_compatibility < 80 else "low",
            "focus_areas": [],
            "quick_wins": [],
            "content_changes": [],
            "skill_development": []
        }
        
        # Analyse des domaines d'amélioration
        if len(self.get_missing_skills()) > 3:
            strategy["focus_areas"].append("skills_gap")
            strategy["skill_development"].extend(self.get_missing_skills()[:3])
        
        if self.experience_match and self.experience_match.experience_score < 70:
            strategy["focus_areas"].append("experience_positioning")
            strategy["content_changes"].append("Mettre en valeur les responsabilités similaires")
        
        if self.keyword_density < 0.3:
            strategy["focus_areas"].append("keyword_optimization")
            strategy["quick_wins"].extend(self.keyword_suggestions[:5])
        
        return strategy
    
    def calculate_success_predictions(self) -> None:
        """Calcule les prédictions de succès"""
        # Algorithme de prédiction basé sur l'analyse
        base_probability = self.overall_compatibility
        
        # Facteurs d'ajustement
        if self.match_type in [MatchType.PERFECT_MATCH, MatchType.STRONG_MATCH]:
            base_probability *= 1.2
        
        if len(self.get_strong_matches()) >= 5:
            base_probability *= 1.1
        
        if self.experience_match and self.experience_match.industry_match:
            base_probability *= 1.15
        
        # Probabilités finales
        self.application_success_probability = min(95, base_probability)
        self.interview_likelihood = min(90, base_probability * 0.8)
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation pour API"""
        return {
            "id": self.id,
            "cv_id": self.cv_id,
            "job_description_id": self.job_description_id,
            "overall_compatibility": self.overall_compatibility,
            "match_type": self.match_type.value,
            "skill_matches": [match.__dict__ for match in self.skill_matches],
            "experience_match": self.experience_match.__dict__ if self.experience_match else None,
            "education_match_score": self.education_match_score,
            "keyword_density": self.keyword_density,
            "phrase_matches": self.phrase_matches,
            "cultural_fit_score": self.cultural_fit_score,
            "growth_alignment_score": self.growth_alignment_score,
            "priority_improvements": self.priority_improvements,
            "content_optimizations": self.content_optimizations,
            "keyword_suggestions": self.keyword_suggestions,
            "application_success_probability": self.application_success_probability,
            "interview_likelihood": self.interview_likelihood,
            "missing_skills": self.get_missing_skills(),
            "strong_matches": len(self.get_strong_matches()),
            "optimization_strategy": self.generate_optimization_strategy(),
            "created_at": self.created_at.isoformat(),
            "analysis_version": self.analysis_version
        }