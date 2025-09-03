"""
🔋 Coûts énergétiques standardisés Phoenix Aube
Basé sur l'analyse comparative des autres services Phoenix
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Optional

class AubeAction(Enum):
    """Actions énergétiques disponibles dans Phoenix Aube"""
    
    # Luna conversationnelle (nouveau)
    LUNA_MIRROR_RESPONSE = "luna_mirror_response"  # Réponse empathique Luna
    LUNA_CONSEIL_RAPIDE = "luna_conseil_rapide"    # Conseil carrière express
    
    # Assessment traditionnel 
    ASSESSMENT_COMPLET = "assessment_complet"      # Assessment psychologique complet
    ASSESSMENT_EXPRESS = "assessment_express"      # Version courte/rapide
    
    # Matching métiers
    CAREER_MATCHING = "career_matching"            # Matching IA métiers
    DEEP_CAREER_ANALYSIS = "deep_career_analysis"  # Analyse approfondie + formation
    
    # Intégrations futures
    CV_OPTIMIZATION_HINTS = "cv_optimization_hints"    # Conseils CV basés assessment
    FORMATION_RECOMMENDATIONS = "formation_recommendations"  # Suggestions formations

@dataclass
class EnergyCost:
    """Configuration coût énergétique pour une action"""
    action: AubeAction
    base_cost: int
    description: str
    typical_duration_minutes: Optional[int] = None
    complexity_level: str = "medium"  # "low", "medium", "high", "premium"

# 🎯 Mapping coûts énergétiques standardisé Phoenix
# Référence: Luna Client analysis - CV (12), Letters (15), typical range 5-30
AUBE_ENERGY_COSTS: Dict[AubeAction, EnergyCost] = {
    
    # 🌙 Luna conversationnelle - coûts légers pour engagement
    AubeAction.LUNA_MIRROR_RESPONSE: EnergyCost(
        action=AubeAction.LUNA_MIRROR_RESPONSE,
        base_cost=3,  # Très accessible pour encourager interaction
        description="Réponse empathique personnalisée de Luna",
        typical_duration_minutes=1,
        complexity_level="low"
    ),
    
    AubeAction.LUNA_CONSEIL_RAPIDE: EnergyCost(
        action=AubeAction.LUNA_CONSEIL_RAPIDE,
        base_cost=6,  # Équivalent "conseil rapide" autres services
        description="Conseil carrière express avec Luna (60s)",
        typical_duration_minutes=2,
        complexity_level="low"
    ),
    
    # 🎯 Assessment - coût premium pour valeur apportée
    AubeAction.ASSESSMENT_COMPLET: EnergyCost(
        action=AubeAction.ASSESSMENT_COMPLET,
        base_cost=25,  # Premium - analyse psychologique complète
        description="Assessment psychologique complet avec profil détaillé",
        typical_duration_minutes=15,
        complexity_level="premium"
    ),
    
    AubeAction.ASSESSMENT_EXPRESS: EnergyCost(
        action=AubeAction.ASSESSMENT_EXPRESS,
        base_cost=12,  # Équivalent CV optimization
        description="Assessment express - profil rapide",
        typical_duration_minutes=5,
        complexity_level="medium"
    ),
    
    # 🔍 Matching & Analysis
    AubeAction.CAREER_MATCHING: EnergyCost(
        action=AubeAction.CAREER_MATCHING,
        base_cost=15,  # Équivalent Letters - analyse + recommandations
        description="Matching IA métiers avec scores compatibilité",
        typical_duration_minutes=3,
        complexity_level="medium"
    ),
    
    AubeAction.DEEP_CAREER_ANALYSIS: EnergyCost(
        action=AubeAction.DEEP_CAREER_ANALYSIS,
        base_cost=30,  # Premium - analyse approfondie
        description="Analyse carrière approfondie + parcours formation",
        typical_duration_minutes=10,
        complexity_level="premium"
    ),
    
    # 🔗 Intégrations cross-services (futur)
    AubeAction.CV_OPTIMIZATION_HINTS: EnergyCost(
        action=AubeAction.CV_OPTIMIZATION_HINTS,
        base_cost=8,  # Léger - conseils basés assessment existant
        description="Conseils CV personnalisés basés sur assessment",
        typical_duration_minutes=2,
        complexity_level="low"
    ),
    
    AubeAction.FORMATION_RECOMMENDATIONS: EnergyCost(
        action=AubeAction.FORMATION_RECOMMENDATIONS,
        base_cost=10,  # Medium - recherche et matching formations
        description="Recommandations formations adaptées au profil",
        typical_duration_minutes=3,
        complexity_level="medium"
    )
}

def get_action_cost(action: AubeAction) -> int:
    """Récupère le coût énergétique d'une action"""
    config = AUBE_ENERGY_COSTS.get(action)
    return config.base_cost if config else 0

def get_action_description(action: AubeAction) -> str:
    """Récupère la description d'une action"""
    config = AUBE_ENERGY_COSTS.get(action)
    return config.description if config else "Action inconnue"

def list_available_actions() -> Dict[str, Dict]:
    """Liste toutes les actions disponibles avec leurs coûts"""
    return {
        action.value: {
            "cost": config.base_cost,
            "description": config.description,
            "duration_minutes": config.typical_duration_minutes,
            "complexity": config.complexity_level
        }
        for action, config in AUBE_ENERGY_COSTS.items()
    }

# 🎨 Configuration affichage pour frontend
ENERGY_DISPLAY_CONFIG = {
    "low": {"color": "#10B981", "icon": "⚡"},      # Vert - actions légères
    "medium": {"color": "#F59E0B", "icon": "🔥"},  # Orange - actions standard  
    "high": {"color": "#EF4444", "icon": "💫"},    # Rouge - actions coûteuses
    "premium": {"color": "#8B5CF6", "icon": "✨"}  # Violet - actions premium
}

def get_display_config(action: AubeAction) -> Dict[str, str]:
    """Configuration visuelle pour une action"""
    config = AUBE_ENERGY_COSTS.get(action)
    if not config:
        return ENERGY_DISPLAY_CONFIG["medium"]
    
    return ENERGY_DISPLAY_CONFIG.get(config.complexity_level, ENERGY_DISPLAY_CONFIG["medium"])