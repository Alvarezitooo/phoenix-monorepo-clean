"""
💰 Phoenix CV - Salary Analysis Entities
Entités métier pour l'analyse salariale et négociation
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class SalaryRange(Enum):
    """Fourchette salariale"""
    ENTRY_LEVEL = "entry_level"
    JUNIOR = "junior" 
    MID_LEVEL = "mid_level"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"
    EXECUTIVE = "executive"


class CompensationType(Enum):
    """Type de compensation"""
    BASE_SALARY = "base_salary"
    TOTAL_COMPENSATION = "total_compensation"
    EQUITY = "equity"
    BONUS = "bonus"
    BENEFITS = "benefits"


class MarketTrend(Enum):
    """Tendance du marché"""
    RISING = "rising"
    STABLE = "stable"
    DECLINING = "declining"
    VOLATILE = "volatile"


@dataclass
class SalaryBenchmark:
    """Référence salariale pour un poste"""
    
    job_title: str
    industry: str
    location: str
    experience_level: SalaryRange
    
    # Données salariales (en euros annuels)
    min_salary: float
    max_salary: float
    median_salary: float
    p25_salary: float  # 25e percentile
    p75_salary: float  # 75e percentile
    
    # Compensation totale
    total_comp_min: Optional[float] = None
    total_comp_max: Optional[float] = None
    total_comp_median: Optional[float] = None
    
    # Métadonnées
    sample_size: int = 0
    last_updated: datetime = field(default_factory=datetime.now)
    data_sources: List[str] = field(default_factory=list)
    confidence_score: float = field(default=0.0)  # 0-1


@dataclass
class MarketInsight:
    """Insight sur le marché du travail"""
    
    insight_type: str  # salary_trend, demand_growth, skill_premium
    title: str
    description: str
    impact_score: float = field(default=0.0)  # 0-1
    
    # Données quantitatives
    percentage_change: Optional[float] = None
    time_period: Optional[str] = None
    
    # Contexte
    region: Optional[str] = None
    industry: Optional[str] = None
    skill_area: Optional[str] = None
    
    # Métadonnées
    source: str = ""
    reliability_score: float = field(default=0.0)  # 0-1
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class NegotiationTip:
    """Conseil de négociation salariale"""
    
    category: str  # preparation, timing, technique, follow_up
    title: str
    content: str
    priority: int = field(default=1)  # 1-5, 5 = critique
    
    # Contexte d'application
    applicable_roles: List[str] = field(default_factory=list)
    career_levels: List[SalaryRange] = field(default_factory=list)
    industries: List[str] = field(default_factory=list)
    
    # Efficacité
    success_rate: float = field(default=0.0)  # 0-1
    potential_increase: Optional[float] = None  # % d'augmentation potentielle


@dataclass
class SalaryGapAnalysis:
    """Analyse d'écart salarial"""
    
    current_salary: float
    market_median: float
    target_salary: float
    
    # Écarts calculés
    gap_to_median: float = field(init=False)
    gap_to_target: float = field(init=False)
    percentile_position: float = field(init=False)  # Position dans la distribution
    
    # Facteurs d'écart
    experience_factor: float = field(default=0.0)
    skills_factor: float = field(default=0.0)
    location_factor: float = field(default=0.0)
    industry_factor: float = field(default=0.0)
    
    def __post_init__(self):
        """Calculs automatiques"""
        self.gap_to_median = ((self.market_median - self.current_salary) / self.current_salary) * 100
        self.gap_to_target = ((self.target_salary - self.current_salary) / self.current_salary) * 100


@dataclass
class SalaryAnalysisResult:
    """
    🎯 Résultat complet d'analyse salariale
    """
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    cv_id: Optional[str] = None
    
    # Profil analysé
    job_title: str = ""
    industry: str = ""
    location: str = ""
    experience_years: int = 0
    key_skills: List[str] = field(default_factory=list)
    
    # Analyse principale
    salary_range: SalaryRange = SalaryRange.MID_LEVEL
    benchmark_data: Optional[SalaryBenchmark] = None
    gap_analysis: Optional[SalaryGapAnalysis] = None
    
    # Insights et recommandations
    market_insights: List[MarketInsight] = field(default_factory=list)
    negotiation_tips: List[NegotiationTip] = field(default_factory=list)
    skill_premiums: Dict[str, float] = field(default_factory=dict)  # skill -> % premium
    
    # Recommandations stratégiques
    recommended_ask: float = field(default=0.0)
    negotiation_range: Dict[str, float] = field(default_factory=dict)  # min, max, ideal
    timeline_to_target: Optional[int] = None  # mois pour atteindre target
    
    # Métadonnées
    confidence_score: float = field(default=0.0)  # 0-1
    analysis_date: datetime = field(default_factory=datetime.now)
    market_trend: MarketTrend = MarketTrend.STABLE
    
    def generate_executive_summary(self) -> Dict[str, Any]:
        """Génère un résumé exécutif"""
        
        summary = {
            "current_position": f"{self.job_title} - {self.experience_years} ans d'expérience",
            "salary_assessment": "Non évalué"
        }
        
        if self.benchmark_data:
            if self.gap_analysis and self.gap_analysis.current_salary > 0:
                if self.gap_analysis.gap_to_median > 10:
                    summary["salary_assessment"] = "Sous-payé par rapport au marché"
                elif self.gap_analysis.gap_to_median < -10:
                    summary["salary_assessment"] = "Au-dessus du marché"
                else:
                    summary["salary_assessment"] = "Aligné avec le marché"
            
            summary["market_range"] = f"{self.benchmark_data.min_salary:,.0f}€ - {self.benchmark_data.max_salary:,.0f}€"
            summary["market_median"] = f"{self.benchmark_data.median_salary:,.0f}€"
        
        if self.recommended_ask > 0:
            summary["recommended_ask"] = f"{self.recommended_ask:,.0f}€"
        
        summary["key_insights"] = [
            insight.title for insight in self.market_insights[:3]
        ]
        
        summary["top_negotiation_tips"] = [
            tip.title for tip in sorted(self.negotiation_tips, key=lambda x: x.priority, reverse=True)[:3]
        ]
        
        return summary
    
    def get_skill_recommendations(self) -> List[Dict[str, Any]]:
        """Recommandations de compétences pour augmenter le salaire"""
        
        recommendations = []
        
        # Compétences avec premium élevé
        high_premium_skills = [
            {"skill": skill, "premium": premium, "impact": "high"}
            for skill, premium in self.skill_premiums.items()
            if premium > 15.0
        ]
        
        # Tri par premium décroissant
        high_premium_skills.sort(key=lambda x: x["premium"], reverse=True)
        
        for skill_data in high_premium_skills[:5]:
            recommendations.append({
                "skill": skill_data["skill"],
                "salary_increase": f"+{skill_data['premium']:.1f}%",
                "priority": "high" if skill_data["premium"] > 25 else "medium",
                "description": f"Maîtrise de {skill_data['skill']} peut augmenter votre salaire de {skill_data['premium']:.1f}%"
            })
        
        return recommendations
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation complète pour API"""
        
        return {
            "id": self.id,
            "user_id": self.user_id,
            "cv_id": self.cv_id,
            "profile": {
                "job_title": self.job_title,
                "industry": self.industry,
                "location": self.location,
                "experience_years": self.experience_years,
                "key_skills": self.key_skills
            },
            "analysis": {
                "salary_range": self.salary_range.value,
                "market_trend": self.market_trend.value,
                "confidence_score": self.confidence_score,
                "analysis_date": self.analysis_date.isoformat()
            },
            "benchmark": {
                "min_salary": self.benchmark_data.min_salary if self.benchmark_data else 0,
                "max_salary": self.benchmark_data.max_salary if self.benchmark_data else 0,
                "median_salary": self.benchmark_data.median_salary if self.benchmark_data else 0,
                "sample_size": self.benchmark_data.sample_size if self.benchmark_data else 0
            } if self.benchmark_data else None,
            "gap_analysis": {
                "gap_to_median": self.gap_analysis.gap_to_median if self.gap_analysis else 0,
                "percentile_position": self.gap_analysis.percentile_position if self.gap_analysis else 0
            } if self.gap_analysis else None,
            "recommendations": {
                "recommended_ask": self.recommended_ask,
                "negotiation_range": self.negotiation_range,
                "timeline_months": self.timeline_to_target
            },
            "insights": [
                {
                    "type": insight.insight_type,
                    "title": insight.title,
                    "description": insight.description,
                    "impact_score": insight.impact_score
                }
                for insight in self.market_insights
            ],
            "negotiation_tips": [
                {
                    "category": tip.category,
                    "title": tip.title,
                    "content": tip.content,
                    "priority": tip.priority
                }
                for tip in self.negotiation_tips
            ],
            "skill_premiums": self.skill_premiums,
            "executive_summary": self.generate_executive_summary()
        }