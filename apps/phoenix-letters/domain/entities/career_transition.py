"""
Entités métier - Career Transition Domain
Clean Architecture - Gestion des transitions de carrière et skill mapping
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class SkillConfidenceLevel(Enum):
    """Niveau de confiance pour le mapping de compétences"""
    HIGH = "high"        # 80-100% - Compétence directement transférable
    MEDIUM = "medium"    # 60-79% - Compétence adaptable avec effort
    LOW = "low"         # 40-59% - Compétence partiellement pertinente


class SkillCategory(Enum):
    """Catégories de compétences"""
    TECHNICAL = "technical"           # Compétences techniques
    MANAGEMENT = "management"         # Leadership, gestion d'équipe
    COMMUNICATION = "communication"   # Communication, présentation
    ANALYTICAL = "analytical"         # Analyse, résolution problèmes
    CREATIVE = "creative"             # Créativité, innovation
    INTERPERSONAL = "interpersonal"   # Relations humaines, négociation
    PROJECT = "project"               # Gestion de projet, organisation
    STRATEGIC = "strategic"           # Vision stratégique, planification


@dataclass
class TransferableSkill:
    """
    Value Object - Compétence transférable entre deux métiers
    """
    
    skill_name: str
    confidence_level: SkillConfidenceLevel
    category: SkillCategory
    description: str
    relevance_explanation: str
    
    # Exemples concrets
    previous_context: str  # "En tant que chef de projet construction"
    target_context: str    # "En tant que Product Manager"
    
    # Scoring
    confidence_score: float = field(default=0.0)  # 0.0 - 1.0
    market_demand: float = field(default=0.0)     # Demande du marché pour cette skill
    
    def __post_init__(self):
        """Validation post-initialisation"""
        if not (0.0 <= self.confidence_score <= 1.0):
            raise ValueError("Confidence score doit être entre 0.0 et 1.0")
        
        if not self.skill_name.strip():
            raise ValueError("Nom de compétence obligatoire")
    
    @property
    def confidence_percentage(self) -> int:
        """Score de confiance en pourcentage"""
        return int(self.confidence_score * 100)
    
    @property
    def is_high_confidence(self) -> bool:
        """Vérifie si c'est une compétence à haute confiance"""
        return self.confidence_level == SkillConfidenceLevel.HIGH


@dataclass
class SkillGap:
    """
    Value Object - Compétence manquante à développer
    """
    
    skill_name: str
    category: SkillCategory
    importance_level: str  # "critical", "important", "nice-to-have"
    learning_difficulty: str  # "easy", "medium", "hard"
    time_to_acquire: str  # "weeks", "months", "years"
    
    # Suggestions d'apprentissage
    learning_resources: List[str] = field(default_factory=list)
    certification_suggestions: List[str] = field(default_factory=list)


@dataclass
class NarrativeBridge:
    """
    Value Object - Pont narratif pour connecter ancien et nouveau métier
    """
    
    bridge_type: str  # "achievement", "challenge_solved", "skill_application"
    narrative_text: str
    previous_situation: str
    transferable_lesson: str
    target_application: str
    strength_score: float = field(default=0.0)  # Force de ce pont narratif


@dataclass
class IndustryTransition:
    """
    Value Object - Informations sur la transition sectorielle
    """
    
    from_industry: str
    to_industry: str
    transition_difficulty: str  # "easy", "moderate", "challenging"
    common_pathways: List[str] = field(default_factory=list)
    success_rate: Optional[float] = None  # Taux de réussite pour ce type de transition
    
    # Conseils spécifiques
    key_challenges: List[str] = field(default_factory=list)
    recommended_strategies: List[str] = field(default_factory=list)


@dataclass
class CareerTransition:
    """
    Entité métier principale - Analyse de transition de carrière
    Aggregate Root du domaine CareerTransition
    """
    
    # Identifiants
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    
    # Transition details
    previous_role: str = ""
    target_role: str = ""
    previous_industry: Optional[str] = None
    target_industry: Optional[str] = None
    
    # Résultats de l'analyse
    transferable_skills: List[TransferableSkill] = field(default_factory=list)
    skill_gaps: List[SkillGap] = field(default_factory=list)
    narrative_bridges: List[NarrativeBridge] = field(default_factory=list)
    industry_transition: Optional[IndustryTransition] = None
    
    # Scoring global
    overall_transition_score: float = field(default=0.0)  # 0.0 - 1.0
    transition_difficulty: str = "medium"  # "easy", "medium", "challenging"
    
    # Métadonnées
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    analysis_version: str = "1.0"
    
    def __post_init__(self):
        """Validation post-initialisation"""
        if not self.previous_role.strip():
            raise ValueError("Rôle précédent obligatoire")
        if not self.target_role.strip():
            raise ValueError("Rôle cible obligatoire")
    
    def add_transferable_skill(self, skill: TransferableSkill) -> None:
        """Ajoute une compétence transférable"""
        if skill not in self.transferable_skills:
            self.transferable_skills.append(skill)
            self.updated_at = datetime.now()
    
    def add_skill_gap(self, gap: SkillGap) -> None:
        """Ajoute une lacune de compétence"""
        if gap not in self.skill_gaps:
            self.skill_gaps.append(gap)
            self.updated_at = datetime.now()
    
    def add_narrative_bridge(self, bridge: NarrativeBridge) -> None:
        """Ajoute un pont narratif"""
        if bridge not in self.narrative_bridges:
            self.narrative_bridges.append(bridge)
            self.updated_at = datetime.now()
    
    def calculate_transition_score(self) -> float:
        """
        Calcule le score global de transition
        Business Logic - Algorithme de scoring
        """
        if not self.transferable_skills:
            return 0.0
        
        # Score basé sur les compétences transférables
        high_confidence_skills = [s for s in self.transferable_skills if s.is_high_confidence]
        medium_confidence_skills = [s for s in self.transferable_skills if s.confidence_level == SkillConfidenceLevel.MEDIUM]
        
        score = (
            len(high_confidence_skills) * 0.8 +
            len(medium_confidence_skills) * 0.6 +
            len([s for s in self.transferable_skills if s.confidence_level == SkillConfidenceLevel.LOW]) * 0.3
        ) / len(self.transferable_skills)
        
        # Bonus pour les ponts narratifs forts
        if self.narrative_bridges:
            strong_bridges = [b for b in self.narrative_bridges if b.strength_score > 0.7]
            narrative_bonus = len(strong_bridges) * 0.1
            score = min(1.0, score + narrative_bonus)
        
        # Malus pour les lacunes critiques
        critical_gaps = [g for g in self.skill_gaps if g.importance_level == "critical"]
        gap_penalty = len(critical_gaps) * 0.1
        score = max(0.0, score - gap_penalty)
        
        self.overall_transition_score = round(score, 2)
        return self.overall_transition_score
    
    def update_difficulty_assessment(self) -> None:
        """Met à jour l'évaluation de difficulté"""
        score = self.calculate_transition_score()
        
        if score >= 0.8:
            self.transition_difficulty = "easy"
        elif score >= 0.6:
            self.transition_difficulty = "medium"
        else:
            self.transition_difficulty = "challenging"
    
    def get_top_transferable_skills(self, limit: int = 5) -> List[TransferableSkill]:
        """Récupère les meilleures compétences transférables"""
        return sorted(
            self.transferable_skills,
            key=lambda s: (s.confidence_score, s.market_demand),
            reverse=True
        )[:limit]
    
    def get_critical_skill_gaps(self) -> List[SkillGap]:
        """Récupère les lacunes critiques"""
        return [gap for gap in self.skill_gaps if gap.importance_level == "critical"]
    
    def get_strongest_narrative_bridges(self, limit: int = 3) -> List[NarrativeBridge]:
        """Récupère les ponts narratifs les plus forts"""
        return sorted(
            self.narrative_bridges,
            key=lambda b: b.strength_score,
            reverse=True
        )[:limit]
    
    def generate_transition_summary(self) -> Dict[str, Any]:
        """Génère un résumé de la transition"""
        return {
            "transition": {
                "from": self.previous_role,
                "to": self.target_role,
                "score": self.overall_transition_score,
                "difficulty": self.transition_difficulty,
            },
            "strengths": {
                "transferable_skills_count": len(self.transferable_skills),
                "high_confidence_skills": len([s for s in self.transferable_skills if s.is_high_confidence]),
                "top_skills": [s.skill_name for s in self.get_top_transferable_skills(3)],
            },
            "challenges": {
                "skill_gaps_count": len(self.skill_gaps),
                "critical_gaps": len(self.get_critical_skill_gaps()),
                "key_gaps": [g.skill_name for g in self.get_critical_skill_gaps()[:3]],
            },
            "narrative": {
                "bridges_count": len(self.narrative_bridges),
                "strongest_bridges": [b.bridge_type for b in self.get_strongest_narrative_bridges()],
            }
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation pour persistance/API"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "previous_role": self.previous_role,
            "target_role": self.target_role,
            "previous_industry": self.previous_industry,
            "target_industry": self.target_industry,
            "transferable_skills": [
                {
                    "skill_name": s.skill_name,
                    "confidence_level": s.confidence_level.value,
                    "category": s.category.value,
                    "description": s.description,
                    "relevance_explanation": s.relevance_explanation,
                    "previous_context": s.previous_context,
                    "target_context": s.target_context,
                    "confidence_score": s.confidence_score,
                    "market_demand": s.market_demand,
                }
                for s in self.transferable_skills
            ],
            "skill_gaps": [
                {
                    "skill_name": g.skill_name,
                    "category": g.category.value,
                    "importance_level": g.importance_level,
                    "learning_difficulty": g.learning_difficulty,
                    "time_to_acquire": g.time_to_acquire,
                    "learning_resources": g.learning_resources,
                    "certification_suggestions": g.certification_suggestions,
                }
                for g in self.skill_gaps
            ],
            "narrative_bridges": [
                {
                    "bridge_type": b.bridge_type,
                    "narrative_text": b.narrative_text,
                    "strength_score": b.strength_score,
                    "previous_situation": b.previous_situation,
                    "transferable_lesson": b.transferable_lesson,
                    "target_application": b.target_application,
                }
                for b in self.narrative_bridges
            ],
            "industry_transition": self.industry_transition.__dict__ if self.industry_transition else None,
            "overall_transition_score": self.overall_transition_score,
            "transition_difficulty": self.transition_difficulty,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "analysis_version": self.analysis_version,
            "summary": self.generate_transition_summary(),
        }