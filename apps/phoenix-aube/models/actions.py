"""
🎯 Action Types - Enum strict aligné sur la grille d'énergie Luna
Directive Oracle: API Contract - validation stricte côté Phoenix Aube
"""

from __future__ import annotations
from enum import Enum
from typing import Dict, Any

class AubeActionType(str, Enum):
    """
    🌅 Actions disponibles dans Phoenix Aube
    Alignées sur la grille d'énergie Luna Hub (source de vérité)
    """
    
    # Actions assessment
    ASSESSMENT_START = "assessment.start"           # 0 points - Gratuit
    MICRO_EXERCISE = "micro_exercise"               # 0 points - Gratuit
    
    # Actions matching & recommandations  
    MATCH_RECOMMEND = "match.recommend"             # 12 points
    PERSONA_PROFILE = "persona.profile"             # 8 points
    FUTUREPROOF_SCORE = "futureproof.score"        # 15 points
    
    # Actions avancées
    FULL_ANALYSIS = "full_analysis"                 # 25 points
    CUSTOM_TIMELINE = "custom_timeline"             # 20 points  
    DETAILED_RECOMMENDATIONS = "detailed_recommendations"  # 18 points
    
    # Export & journal
    JOURNAL_EXPORT = "journal.export"              # 0 points - Gratuit
    
    @classmethod
    def get_display_names(cls) -> Dict[str, str]:
        """Noms d'affichage pour l'interface utilisateur"""
        return {
            cls.ASSESSMENT_START: "Démarrer Assessment",
            cls.MICRO_EXERCISE: "Micro-Exercice",
            cls.MATCH_RECOMMEND: "Recommandations Métiers",
            cls.PERSONA_PROFILE: "Profil Personnalité", 
            cls.FUTUREPROOF_SCORE: "Score Future-Proof",
            cls.FULL_ANALYSIS: "Analyse Complète",
            cls.CUSTOM_TIMELINE: "Timeline Personnalisée",
            cls.DETAILED_RECOMMENDATIONS: "Recommandations Détaillées",
            cls.JOURNAL_EXPORT: "Export Journal"
        }

class AubeActionValidator:
    """Validateur pour les actions Phoenix Aube"""
    
    @staticmethod
    def is_valid_action(action: str) -> bool:
        """Vérifie si une action est valide"""
        try:
            AubeActionType(action)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def get_energy_cost(action: AubeActionType) -> int:
        """Retourne le coût énergétique d'une action (pour référence)"""
        # Sync avec config/energy_grid.yaml
        costs = {
            AubeActionType.ASSESSMENT_START: 0,
            AubeActionType.MICRO_EXERCISE: 0,
            AubeActionType.JOURNAL_EXPORT: 0,
            AubeActionType.MATCH_RECOMMEND: 12,
            AubeActionType.PERSONA_PROFILE: 8,
            AubeActionType.FUTUREPROOF_SCORE: 15,
            AubeActionType.FULL_ANALYSIS: 25,
            AubeActionType.CUSTOM_TIMELINE: 20,
            AubeActionType.DETAILED_RECOMMENDATIONS: 18
        }
        return costs.get(action, 0)