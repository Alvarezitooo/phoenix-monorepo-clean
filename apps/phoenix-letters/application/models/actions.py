"""
🎯 Action Types Phoenix Letters - Enum strict aligné sur la grille d'énergie Luna
Directive Oracle: API Contract - validation stricte côté Phoenix Letters
"""

from __future__ import annotations
from enum import Enum
from typing import Dict, Any

class LettersActionType(str, Enum):
    """
    📝 Actions disponibles dans Phoenix Letters
    Alignées sur la grille d'énergie Luna Hub (source de vérité)
    """
    
    # Actions principales Letters
    LETTRE_MOTIVATION = "lettre_motivation"
    FORMAT_LETTRE = "format_lettre"
    ANALYSE_OFFRE = "analyse_offre"
    TRANSITION_CARRIERE = "transition_carriere"
    
    # Actions rapides / gratuites
    CONSEIL_RAPIDE = "conseil_rapide"
    VERIFICATION_FORMAT = "verification_format"
    
    @classmethod
    def get_display_names(cls) -> Dict[str, str]:
        """Noms d'affichage pour l'interface utilisateur"""
        return {
            cls.LETTRE_MOTIVATION: "Lettre de Motivation",
            cls.FORMAT_LETTRE: "Format de Lettre",
            cls.ANALYSE_OFFRE: "Analyse d'Offre",
            cls.TRANSITION_CARRIERE: "Transition de Carrière",
            cls.CONSEIL_RAPIDE: "Conseil Rapide",
            cls.VERIFICATION_FORMAT: "Vérification Format"
        }
    
    @classmethod
    def get_descriptions(cls) -> Dict[str, str]:
        """Descriptions détaillées des actions"""
        return {
            cls.LETTRE_MOTIVATION: "Génération complète de lettre de motivation personnalisée",
            cls.FORMAT_LETTRE: "Optimisation du format et de la structure",
            cls.ANALYSE_OFFRE: "Analyse approfondie d'une offre d'emploi",
            cls.TRANSITION_CARRIERE: "Stratégie de reconversion professionnelle",
            cls.CONSEIL_RAPIDE: "Conseil personnalisé instantané",
            cls.VERIFICATION_FORMAT: "Vérification format et structure lettre"
        }
    
    @classmethod
    def get_estimated_durations(cls) -> Dict[str, int]:
        """Durées estimées en secondes pour l'UI"""
        return {
            cls.LETTRE_MOTIVATION: 18,
            cls.FORMAT_LETTRE: 8,
            cls.ANALYSE_OFFRE: 12,
            cls.TRANSITION_CARRIERE: 25,
            cls.CONSEIL_RAPIDE: 3,
            cls.VERIFICATION_FORMAT: 2
        }
    
    @classmethod
    def is_premium_action(cls, action: 'LettersActionType') -> bool:
        """Vérifie si l'action nécessite de l'énergie Luna"""
        premium_actions = {
            cls.LETTRE_MOTIVATION,
            cls.FORMAT_LETTRE,
            cls.ANALYSE_OFFRE,
            cls.TRANSITION_CARRIERE
        }
        return action in premium_actions
    
    @classmethod
    def get_action_category(cls, action: 'LettersActionType') -> str:
        """Catégorie de l'action pour analytics"""
        categories = {
            cls.LETTRE_MOTIVATION: "generation",
            cls.FORMAT_LETTRE: "formatting", 
            cls.ANALYSE_OFFRE: "analysis",
            cls.TRANSITION_CARRIERE: "consulting",
            cls.CONSEIL_RAPIDE: "guidance",
            cls.VERIFICATION_FORMAT: "validation"
        }
        return categories.get(action, "unknown")

class LettersActionValidator:
    """
    🛡️ Validateur pour les actions Phoenix Letters
    """
    
    @staticmethod
    def validate_action_request(action: LettersActionType, context: Dict[str, Any]) -> bool:
        """Valide une requête d'action selon le contexte"""
        
        # Validation de base
        if not context:
            return False
        
        # Validations spécifiques par action
        if action == LettersActionType.LETTRE_MOTIVATION:
            # Lettre motivation a besoin d'un job title ou offre
            if not context.get('job_title') and not context.get('job_offer'):
                return False
                
        elif action == LettersActionType.ANALYSE_OFFRE:
            # Analyse offre a besoin du texte de l'offre
            if not context.get('job_offer_text'):
                return False
                
        elif action == LettersActionType.TRANSITION_CARRIERE:
            # Transition carrière a besoin du secteur cible
            if not context.get('target_industry') and not context.get('target_role'):
                return False
        
        return True
    
    @staticmethod
    def get_required_context_fields(action: LettersActionType) -> list:
        """Retourne les champs requis pour une action"""
        base_fields = ['user_profile']  # Profil utilisateur basique
        
        specific_fields = {
            LettersActionType.LETTRE_MOTIVATION: ['job_title', 'company_name'],
            LettersActionType.ANALYSE_OFFRE: ['job_offer_text'],
            LettersActionType.TRANSITION_CARRIERE: ['current_industry', 'target_industry'],
            LettersActionType.FORMAT_LETTRE: ['letter_content'],
        }
        
        return base_fields + specific_fields.get(action, [])

# Constantes pour validation
VALID_LETTERS_ACTIONS = list(LettersActionType)
PREMIUM_LETTERS_ACTIONS = [action for action in LettersActionType if LettersActionType.is_premium_action(action)]
FREE_LETTERS_ACTIONS = [action for action in LettersActionType if not LettersActionType.is_premium_action(action)]