"""
🔥 Phoenix CV - CV Document Domain Entity
Clean Architecture - Entité principale pour la gestion des CV
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class CVStatus(Enum):
    """Statut du CV"""
    DRAFT = "draft"
    OPTIMIZED = "optimized"
    ATS_READY = "ats_ready"
    PUBLISHED = "published"


class ExperienceLevel(Enum):
    """Niveau d'expérience professionnel"""
    JUNIOR = "junior"          # 0-2 ans
    INTERMEDIATE = "intermediate"  # 2-5 ans
    SENIOR = "senior"          # 5-10 ans
    EXPERT = "expert"          # 10+ ans
    EXECUTIVE = "executive"    # C-level, direction


class IndustryType(Enum):
    """Types d'industrie"""
    TECH = "tech"
    FINANCE = "finance"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    CONSULTING = "consulting"
    RETAIL = "retail"
    MANUFACTURING = "manufacturing"
    CREATIVE = "creative"
    GOVERNMENT = "government"
    NONPROFIT = "nonprofit"


@dataclass
class ContactInfo:
    """Informations de contact"""
    
    email: str
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    
    def __post_init__(self):
        """Validation des données de contact"""
        if not self.email or "@" not in self.email:
            raise ValueError("Email valide requis")


@dataclass
class Experience:
    """Expérience professionnelle"""
    
    company: str
    position: str
    start_date: str  # Format: "YYYY-MM" ou "YYYY"
    end_date: Optional[str] = None  # None = poste actuel
    description: str = ""
    achievements: List[str] = field(default_factory=list)
    technologies: List[str] = field(default_factory=list)
    industry: Optional[IndustryType] = None
    
    # Métadonnées IA
    impact_score: float = field(default=0.0)  # 0-10 score d'impact
    ats_keywords: List[str] = field(default_factory=list)
    quantified_achievements: List[str] = field(default_factory=list)
    
    @property
    def duration_months(self) -> int:
        """Calcule la durée en mois"""
        # Logique de calcul de durée
        # Pour l'instant, retourne une estimation
        return 12  # À implémenter
    
    @property
    def is_current_position(self) -> bool:
        """Vérifie si c'est le poste actuel"""
        return self.end_date is None


@dataclass
class Education:
    """Formation académique"""
    
    institution: str
    degree: str
    field_of_study: str
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    honors: List[str] = field(default_factory=list)
    relevant_coursework: List[str] = field(default_factory=list)


@dataclass
class Skill:
    """Compétence professionnelle"""
    
    name: str
    category: str  # "technical", "soft", "language", "certification"
    proficiency_level: str  # "beginner", "intermediate", "advanced", "expert"
    years_experience: Optional[int] = None
    is_primary: bool = False  # Compétence principale
    
    # Métadonnées IA
    market_demand: float = field(default=0.0)  # 0-10 demande marché
    ats_weight: float = field(default=1.0)  # Poids pour ATS


@dataclass
class CVSection:
    """Section personnalisable du CV"""
    
    section_type: str  # "projects", "certifications", "languages", etc.
    title: str
    content: List[Dict[str, Any]] = field(default_factory=list)
    order: int = 0
    is_visible: bool = True


@dataclass
class ATSOptimization:
    """Optimisation ATS"""
    
    overall_score: float = field(default=0.0)  # 0-100
    keyword_density: float = field(default=0.0)
    format_compliance: float = field(default=0.0)
    section_completeness: float = field(default=0.0)
    
    # Recommandations
    missing_keywords: List[str] = field(default_factory=list)
    format_issues: List[str] = field(default_factory=list)
    optimization_suggestions: List[str] = field(default_factory=list)
    
    def calculate_overall_score(self) -> float:
        """Calcule le score global ATS"""
        score = (
            self.keyword_density * 0.4 +
            self.format_compliance * 0.3 +
            self.section_completeness * 0.3
        )
        self.overall_score = round(score, 1)
        return self.overall_score


@dataclass
class MirrorMatchResult:
    """Résultat du Mirror Match Engine"""
    
    job_title: str
    company_name: str
    compatibility_score: float = field(default=0.0)  # 0-100
    
    # Analyse détaillée
    matching_skills: List[str] = field(default_factory=list)
    missing_skills: List[str] = field(default_factory=list)
    keyword_alignment: float = field(default=0.0)
    experience_match: float = field(default=0.0)
    education_match: float = field(default=0.0)
    
    # Recommandations d'optimisation
    priority_optimizations: List[str] = field(default_factory=list)
    content_suggestions: List[str] = field(default_factory=list)


@dataclass
class CVDocument:
    """
    🔥 Entité principale - Document CV avec toutes les fonctionnalités
    Aggregate Root du domaine Phoenix CV
    """
    
    # Identifiants
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    
    # Informations de base
    full_name: str = ""
    professional_title: str = ""
    summary: str = ""
    contact_info: Optional[ContactInfo] = None
    
    # Contenu CV
    experiences: List[Experience] = field(default_factory=list)
    education: List[Education] = field(default_factory=list)
    skills: List[Skill] = field(default_factory=list)
    additional_sections: List[CVSection] = field(default_factory=list)
    
    # Configuration
    target_industry: Optional[IndustryType] = None
    experience_level: ExperienceLevel = ExperienceLevel.INTERMEDIATE
    template_id: str = "modern"
    
    # Optimisations IA
    ats_optimization: Optional[ATSOptimization] = None
    mirror_matches: List[MirrorMatchResult] = field(default_factory=list)
    
    # État et métadonnées
    status: CVStatus = CVStatus.DRAFT
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    last_optimized_at: Optional[datetime] = None
    version: str = "1.0"
    
    def __post_init__(self):
        """Validation post-initialisation"""
        if not self.full_name.strip():
            raise ValueError("Nom complet obligatoire")
    
    def add_experience(self, experience: Experience) -> None:
        """Ajoute une expérience professionnelle"""
        self.experiences.append(experience)
        self.updated_at = datetime.now()
        self._recalculate_metrics()
    
    def add_skill(self, skill: Skill) -> None:
        """Ajoute une compétence"""
        # Éviter les doublons
        if not any(s.name.lower() == skill.name.lower() for s in self.skills):
            self.skills.append(skill)
            self.updated_at = datetime.now()
    
    def update_ats_optimization(self, optimization: ATSOptimization) -> None:
        """Met à jour l'optimisation ATS"""
        self.ats_optimization = optimization
        self.last_optimized_at = datetime.now()
        self.updated_at = datetime.now()
        
        # Mise à jour du statut selon le score ATS
        if optimization.overall_score >= 85:
            self.status = CVStatus.ATS_READY
        elif optimization.overall_score >= 70:
            self.status = CVStatus.OPTIMIZED
    
    def add_mirror_match(self, match_result: MirrorMatchResult) -> None:
        """Ajoute un résultat de Mirror Match"""
        # Garder seulement les 5 derniers matchs
        self.mirror_matches.append(match_result)
        if len(self.mirror_matches) > 5:
            self.mirror_matches = self.mirror_matches[-5:]
        self.updated_at = datetime.now()
    
    def get_primary_skills(self, limit: int = 8) -> List[Skill]:
        """Récupère les compétences principales"""
        primary_skills = [s for s in self.skills if s.is_primary]
        if len(primary_skills) >= limit:
            return primary_skills[:limit]
        
        # Compléter avec les compétences les mieux notées
        other_skills = [s for s in self.skills if not s.is_primary]
        other_skills.sort(key=lambda s: s.market_demand, reverse=True)
        
        return primary_skills + other_skills[:limit - len(primary_skills)]
    
    def get_recent_experiences(self, limit: int = 3) -> List[Experience]:
        """Récupère les expériences les plus récentes"""
        # Trier par date (les plus récentes en premier)
        sorted_exp = sorted(
            self.experiences, 
            key=lambda e: e.start_date, 
            reverse=True
        )
        return sorted_exp[:limit]
    
    def calculate_experience_years(self) -> float:
        """Calcule le nombre d'années d'expérience total"""
        total_months = sum(exp.duration_months for exp in self.experiences)
        return round(total_months / 12, 1)
    
    def get_best_mirror_match(self) -> Optional[MirrorMatchResult]:
        """Récupère le meilleur match"""
        if not self.mirror_matches:
            return None
        return max(self.mirror_matches, key=lambda m: m.compatibility_score)
    
    def _recalculate_metrics(self) -> None:
        """Recalcule les métriques internes"""
        # Mise à jour du niveau d'expérience basé sur les années
        years = self.calculate_experience_years()
        if years < 2:
            self.experience_level = ExperienceLevel.JUNIOR
        elif years < 5:
            self.experience_level = ExperienceLevel.INTERMEDIATE
        elif years < 10:
            self.experience_level = ExperienceLevel.SENIOR
        else:
            self.experience_level = ExperienceLevel.EXPERT
    
    def generate_optimization_summary(self) -> Dict[str, Any]:
        """Génère un résumé des optimisations"""
        return {
            "cv_id": self.id,
            "status": self.status.value,
            "ats_score": self.ats_optimization.overall_score if self.ats_optimization else 0,
            "best_match_score": self.get_best_mirror_match().compatibility_score if self.get_best_mirror_match() else 0,
            "total_experiences": len(self.experiences),
            "total_skills": len(self.skills),
            "experience_years": self.calculate_experience_years(),
            "last_optimized": self.last_optimized_at.isoformat() if self.last_optimized_at else None,
            "optimization_recommendations": len(self.ats_optimization.optimization_suggestions) if self.ats_optimization else 0
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation pour persistance/API"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "full_name": self.full_name,
            "professional_title": self.professional_title,
            "summary": self.summary,
            "contact_info": self.contact_info.__dict__ if self.contact_info else None,
            "experiences": [exp.__dict__ for exp in self.experiences],
            "education": [edu.__dict__ for edu in self.education],
            "skills": [skill.__dict__ for skill in self.skills],
            "additional_sections": [section.__dict__ for section in self.additional_sections],
            "target_industry": self.target_industry.value if self.target_industry else None,
            "experience_level": self.experience_level.value,
            "template_id": self.template_id,
            "ats_optimization": self.ats_optimization.__dict__ if self.ats_optimization else None,
            "mirror_matches": [match.__dict__ for match in self.mirror_matches],
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_optimized_at": self.last_optimized_at.isoformat() if self.last_optimized_at else None,
            "version": self.version,
            "summary_metrics": self.generate_optimization_summary()
        }