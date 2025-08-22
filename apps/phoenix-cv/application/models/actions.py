"""
🎯 Action Types - Enum strict aligné sur la grille d'énergie Luna
Directive Oracle: API Contract - validation stricte côté Phoenix CV
"""

from __future__ import annotations
from enum import Enum
from typing import Dict, Any

class ActionType(str, Enum):
    """
    🎯 Actions disponibles dans Phoenix CV
    Alignées sur la grille d'énergie Luna Hub (source de vérité)
    """
    
    # Actions principales CV
    ANALYSE_CV_COMPLETE = "analyse_cv_complete"
    OPTIMISATION_CV = "optimisation_cv" 
    MIRROR_MATCH = "mirror_match"
    SALARY_ANALYSIS = "salary_analysis"
    
    # Actions rapides / gratuites
    CONSEIL_RAPIDE = "conseil_rapide"
    VERIFICATION_FORMAT = "verification_format"
    
    @classmethod
    def get_display_names(cls) -> Dict[str, str]:
        """Noms d'affichage pour l'interface utilisateur"""
        return {
            cls.ANALYSE_CV_COMPLETE: "Analyse CV Complète",
            cls.OPTIMISATION_CV: "Optimisation CV",
            cls.MIRROR_MATCH: "Mirror Match ATS",
            cls.SALARY_ANALYSIS: "Analyse Salariale",
            cls.CONSEIL_RAPIDE: "Conseil Rapide",
            cls.VERIFICATION_FORMAT: "Vérification Format"
        }
    
    @classmethod
    def get_descriptions(cls) -> Dict[str, str]:
        """Descriptions détaillées des actions"""
        return {
            cls.ANALYSE_CV_COMPLETE: "Analyse approfondie avec scoring et recommandations personnalisées",
            cls.OPTIMISATION_CV: "Optimisation ATS et suggestions d'amélioration",
            cls.MIRROR_MATCH: "Matching intelligent avec offres d'emploi",
            cls.SALARY_ANALYSIS: "Analyse et suggestions salariales par marché",
            cls.CONSEIL_RAPIDE: "Conseil personnalisé instantané",
            cls.VERIFICATION_FORMAT: "Vérification format et structure CV"
        }
    
    @classmethod
    def get_estimated_durations(cls) -> Dict[str, int]:
        """Durées estimées en secondes pour l'UI"""
        return {
            cls.ANALYSE_CV_COMPLETE: 15,
            cls.OPTIMISATION_CV: 12,
            cls.MIRROR_MATCH: 20,
            cls.SALARY_ANALYSIS: 10,
            cls.CONSEIL_RAPIDE: 3,
            cls.VERIFICATION_FORMAT: 2
        }
    
    @classmethod
    def is_premium_action(cls, action: 'ActionType') -> bool:
        """Vérifie si l'action nécessite de l'énergie Luna"""
        premium_actions = {
            cls.ANALYSE_CV_COMPLETE,
            cls.OPTIMISATION_CV,
            cls.MIRROR_MATCH,
            cls.SALARY_ANALYSIS
        }
        return action in premium_actions
    
    @classmethod
    def get_action_category(cls, action: 'ActionType') -> str:
        """Catégorie de l'action pour analytics"""
        categories = {
            cls.ANALYSE_CV_COMPLETE: "analysis",
            cls.OPTIMISATION_CV: "optimization", 
            cls.MIRROR_MATCH: "matching",
            cls.SALARY_ANALYSIS: "analysis",
            cls.CONSEIL_RAPIDE: "guidance",
            cls.VERIFICATION_FORMAT: "validation"
        }
        return categories.get(action, "unknown")

class ActionValidator:
    """
    🛡️ Validateur pour les actions Phoenix CV
    """
    
    @staticmethod
    def validate_action_request(action: ActionType, context: Dict[str, Any]) -> bool:
        """Valide une requête d'action selon le contexte"""
        
        # Validation de base - toutes actions ont besoin d'un CV
        if not context.get('cv_id') and not context.get('cv_content'):
            return False
        
        # Validations spécifiques par action
        if action == ActionType.MIRROR_MATCH:
            # Mirror Match a besoin d'un job posting ou critères
            if not context.get('job_posting') and not context.get('target_role'):
                return False
                
        elif action == ActionType.SALARY_ANALYSIS:
            # Analyse salariale a besoin de localisation
            if not context.get('location') and not context.get('market'):
                return False
        
        return True
    
    @staticmethod
    def get_required_context_fields(action: ActionType) -> list:
        """Retourne les champs requis pour une action"""
        base_fields = ['cv_id']
        
        specific_fields = {
            ActionType.MIRROR_MATCH: ['target_role'],
            ActionType.SALARY_ANALYSIS: ['location', 'experience_years'],
            ActionType.OPTIMISATION_CV: ['target_keywords'],
        }
        
        return base_fields + specific_fields.get(action, [])

# Constantes pour validation
VALID_ACTIONS = list(ActionType)
PREMIUM_ACTIONS = [action for action in ActionType if ActionType.is_premium_action(action)]
FREE_ACTIONS = [action for action in ActionType if not ActionType.is_premium_action(action)]