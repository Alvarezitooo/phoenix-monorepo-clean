"""
🌙 Phoenix Journal Narratif - Energy Preview Service
Service de prévisualisation des coûts énergétiques pour confirmations d'actions
"""

from typing import Dict, Any, Optional
import structlog

from app.core.energy_manager import energy_manager, EnergyManagerError
from app.models.user_energy import ENERGY_COSTS
from app.models.journal_dto import EnergyPreviewRequest, EnergyPreviewResponse

logger = structlog.get_logger("energy_preview_service")


class EnergyPreviewService:
    """
    🌙 Service de Prévisualisation Énergétique
    
    Responsabilités:
    1. Calculer impact énergétique avant action
    2. Vérifier faisabilité action selon solde utilisateur
    3. Gérer cas spéciaux (utilisateurs unlimited)
    4. Fournir données pour modales de confirmation
    """
    
    def __init__(self):
        """Initialise le service de prévisualisation"""
        pass
    
    async def preview_action_cost(self, request: EnergyPreviewRequest) -> EnergyPreviewResponse:
        """
        Prévisualise le coût énergétique d'une action
        
        Args:
            request: Requête avec user_id et action
            
        Returns:
            EnergyPreviewResponse: Détails de l'impact énergétique
        """
        logger.info("Preview action énergétique", user_id=request.user_id, action=request.action)
        
        try:
            # 1. Vérification de l'action dans la grille Oracle
            if request.action not in ENERGY_COSTS:
                raise ValueError(f"Action inconnue: {request.action}")
            
            action_cost = ENERGY_COSTS[request.action]
            
            # 2. Récupération état énergétique utilisateur
            energy_balance = await energy_manager.check_balance(request.user_id)
            
            current_balance = energy_balance["current_energy"]
            subscription_type = energy_balance.get("subscription_type", "free")
            
            # 3. Cas spécial : utilisateurs unlimited
            if subscription_type == "luna_unlimited":
                return EnergyPreviewResponse(
                    action=request.action,
                    cost_pct=0.0,  # Pas de coût pour unlimited
                    balance_before=100.0,  # Toujours 100% pour unlimited
                    balance_after=100.0,
                    can_perform=True,
                    unlimited_user=True
                )
            
            # 4. Calcul impact pour utilisateurs standards
            balance_after = max(0.0, current_balance - action_cost)
            can_perform = current_balance >= action_cost
            
            response = EnergyPreviewResponse(
                action=request.action,
                cost_pct=float(action_cost),
                balance_before=round(current_balance, 1),
                balance_after=round(balance_after, 1),
                can_perform=can_perform,
                unlimited_user=False
            )
            
            logger.info(
                "Preview calculée",
                user_id=request.user_id,
                action=request.action,
                cost=action_cost,
                can_perform=can_perform,
                balance_after=balance_after
            )
            
            return response
            
        except EnergyManagerError as e:
            logger.error("Erreur Energy Manager", user_id=request.user_id, error=str(e))
            raise
            
        except Exception as e:
            logger.error("Erreur preview énergétique", user_id=request.user_id, action=request.action, error=str(e))
            raise
    
    def get_action_description(self, action: str) -> Optional[str]:
        """
        Retourne une description humaine de l'action pour les modales
        
        Args:
            action: Nom de l'action selon grille Oracle
            
        Returns:
            Description lisible de l'action
        """
        descriptions = {
            # Actions simples (5-10%)
            "conseil_rapide": "Conseil personnalisé rapide avec Luna",
            "correction_ponctuelle": "Correction ciblée d'un élément spécifique",
            "verification_format": "Vérification du format et de la structure",
            
            # Actions moyennes (10-20%)
            "lettre_motivation": "Génération complète d'une lettre de motivation",
            "optimisation_cv": "Optimisation générale de votre CV",
            "analyse_offre": "Analyse détaillée d'une offre d'emploi",
            
            # Actions complexes (20-40%)
            "analyse_cv_complete": "Analyse approfondie complète de votre CV",
            "mirror_match": "Analyse de compatibilité CV-offre d'emploi",
            "salary_analysis": "Analyse salariale et conseils de négociation",
            "transition_carriere": "Stratégie personnalisée de reconversion",
            "strategie_candidature": "Plan de candidature complet",
            
            # Actions premium (35-50%)
            "audit_complet_profil": "Audit complet de votre profil professionnel",
            "plan_reconversion": "Plan détaillé de reconversion professionnelle",
            "simulation_entretien": "Simulation d'entretien avec feedback IA"
        }
        
        return descriptions.get(action, f"Action {action}")
    
    def get_confirmation_message(self, preview: EnergyPreviewResponse) -> str:
        """
        Génère un message de confirmation empathique pour l'action
        
        Args:
            preview: Résultat de la prévisualisation
            
        Returns:
            Message de confirmation contextualisé
        """
        action_desc = self.get_action_description(preview.action)
        
        if preview.unlimited_user:
            return f"🌙 {action_desc} avec votre énergie Luna illimitée ! Continuons ensemble votre progression."
        
        if not preview.can_perform:
            deficit = preview.cost_pct - preview.balance_before
            return f"⚡ Oops ! Il vous faut {deficit:.0f}% d'énergie supplémentaire pour cette action. Rechargeons votre énergie Luna ?"
        
        # Message standard pour action possible
        if preview.cost_pct <= 5:
            intensity = "Cette petite action"
        elif preview.cost_pct <= 15:
            intensity = "Cette action"  
        elif preview.cost_pct <= 30:
            intensity = "Cette action importante"
        else:
            intensity = "Cette action premium"
            
        return f"🚀 {intensity} utilisera {preview.cost_pct:.0f}% de votre énergie Luna. Après : {preview.balance_after:.0f}%. On y va ensemble ?"
    
    async def check_action_prerequisites(self, user_id: str, action: str) -> Dict[str, Any]:
        """
        Vérifie les prérequis pour une action donnée
        
        Args:
            user_id: ID utilisateur
            action: Action à vérifier
            
        Returns:
            Dictionnaire avec statut des prérequis
        """
        prerequisites = {
            "mirror_match": {
                "requires": ["cv_uploaded", "job_offer"],
                "description": "CV et offre d'emploi nécessaires pour l'analyse"
            },
            "salary_analysis": {
                "requires": ["profile_complete"],
                "description": "Profil complet nécessaire pour l'analyse salariale"
            },
            "simulation_entretien": {
                "requires": ["cv_uploaded", "target_position"],
                "description": "CV et poste cible nécessaires pour la simulation"
            }
        }
        
        action_prereqs = prerequisites.get(action, {"requires": [], "description": ""})
        
        # TODO: Implémenter vérification réelle des prérequis
        # Pour l'instant, on considère tous les prérequis comme remplis
        
        return {
            "action": action,
            "prerequisites_met": True,
            "missing_prerequisites": [],
            "description": action_prereqs["description"]
        }


# Instance globale du service
energy_preview_service = EnergyPreviewService()