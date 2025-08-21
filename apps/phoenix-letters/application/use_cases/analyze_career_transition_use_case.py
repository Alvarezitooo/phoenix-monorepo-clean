"""
Use Case - Analyse de Transition de Carrière
Clean Architecture - Application Layer

Orchestration de l'analyse intelligente des compétences transversales
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any
import logging
from datetime import datetime

from domain.entities.career_transition import CareerTransition
from domain.services.skill_mapping_service import SkillMappingService
from domain.repositories.user_repository import IUserRepository
from infrastructure.ai.ai_interface import IAIService
from shared.exceptions.business_exceptions import ValidationError, BusinessRuleError

logger = logging.getLogger(__name__)


@dataclass
class AnalyzeCareerTransitionCommand:
    """
    Command Pattern - Commande pour l'analyse de transition
    """
    
    user_id: str
    previous_role: str
    target_role: str
    previous_industry: Optional[str] = None
    target_industry: Optional[str] = None
    
    # Options d'analyse
    include_industry_analysis: bool = True
    include_narrative_bridges: bool = True
    max_transferable_skills: int = 10
    max_skill_gaps: int = 8
    max_narrative_bridges: int = 5

    def validate(self) -> None:
        """Validation de la commande"""
        if not self.user_id.strip():
            raise ValidationError("ID utilisateur obligatoire")
        
        if not self.previous_role.strip():
            raise ValidationError("Rôle précédent obligatoire") 
        
        if not self.target_role.strip():
            raise ValidationError("Rôle cible obligatoire")
        
        if self.previous_role.strip().lower() == self.target_role.strip().lower():
            raise ValidationError("Le rôle précédent ne peut être identique au rôle cible")
        
        if self.max_transferable_skills < 1 or self.max_transferable_skills > 20:
            raise ValidationError("Nombre max de compétences transférables entre 1 et 20")


@dataclass
class AnalyzeCareerTransitionResult:
    """
    Result Pattern - Résultat de l'analyse de transition
    """
    
    career_transition: CareerTransition
    analysis_metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Infos sur la génération
    analysis_time_seconds: float = 0.0
    ai_service_used: bool = False
    fallback_used: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation pour API"""
        return {
            "career_transition": self.career_transition.to_dict(),
            "analysis_metadata": {
                **self.analysis_metadata,
                "analysis_time_seconds": self.analysis_time_seconds,
                "ai_service_used": self.ai_service_used,
                "fallback_used": self.fallback_used,
                "generated_at": datetime.now().isoformat()
            }
        }


class AnalyzeCareerTransitionUseCase:
    """
    Use Case Principal - Analyse complète de transition de carrière
    
    Responsabilités:
    - Validation utilisateur et quotas
    - Orchestration de l'analyse via SkillMappingService
    - Gestion des erreurs et fallbacks
    - Mise à jour des statistiques utilisateur
    """
    
    def __init__(
        self,
        skill_mapping_service: SkillMappingService,
        user_repository: IUserRepository
    ):
        self.skill_mapping_service = skill_mapping_service
        self.user_repository = user_repository
        
    async def execute(self, command: AnalyzeCareerTransitionCommand) -> AnalyzeCareerTransitionResult:
        """
        Exécute l'analyse de transition de carrière
        
        Business Flow:
        1. Validation de la commande
        2. Vérification utilisateur et quotas
        3. Analyse via SkillMappingService
        4. Mise à jour stats utilisateur
        5. Retour du résultat
        """
        start_time = datetime.now()
        logger.info(f"🔄 Début analyse transition: {command.previous_role} → {command.target_role}")
        
        try:
            # 1. Validation
            command.validate()
            
            # 2. Vérification utilisateur
            user = await self.user_repository.get_by_id(command.user_id)
            if not user:
                raise ValidationError(f"Utilisateur {command.user_id} introuvable")
            
            # 3. Vérification quotas - Business Rule
            if not user.can_analyze_career_transition():
                from shared.exceptions.business_exceptions import QuotaExceededError
                raise QuotaExceededError(
                    "Limite d'analyses de transition atteinte pour ce mois",
                    current_usage=user.current_month_analysis_count,
                    quota_limit=user.get_analysis_quota()
                )
            
            # 4. Analyse principale via Domain Service
            career_transition = await self.skill_mapping_service.analyze_career_transition(
                user_id=command.user_id,
                previous_role=command.previous_role,
                target_role=command.target_role,
                previous_industry=command.previous_industry,
                target_industry=command.target_industry
            )
            
            # 5. Post-traitement selon les options
            if not command.include_narrative_bridges:
                career_transition.narrative_bridges = []
            elif len(career_transition.narrative_bridges) > command.max_narrative_bridges:
                career_transition.narrative_bridges = career_transition.narrative_bridges[:command.max_narrative_bridges]
            
            if len(career_transition.transferable_skills) > command.max_transferable_skills:
                # Garder les meilleures compétences
                career_transition.transferable_skills = career_transition.get_top_transferable_skills(
                    command.max_transferable_skills
                )
            
            if len(career_transition.skill_gaps) > command.max_skill_gaps:
                # Garder les lacunes les plus critiques
                career_transition.skill_gaps = career_transition.skill_gaps[:command.max_skill_gaps]
            
            # 6. Mise à jour utilisateur
            user.record_career_analysis()
            await self.user_repository.save(user)
            
            # 7. Calcul du temps d'exécution
            end_time = datetime.now()
            analysis_time = (end_time - start_time).total_seconds()
            
            # 8. Métadonnées d'analyse
            analysis_metadata = {
                "user_id": command.user_id,
                "analysis_type": "career_transition",
                "transition_path": f"{command.previous_role} → {command.target_role}",
                "options": {
                    "include_industry_analysis": command.include_industry_analysis,
                    "include_narrative_bridges": command.include_narrative_bridges,
                    "limits": {
                        "max_transferable_skills": command.max_transferable_skills,
                        "max_skill_gaps": command.max_skill_gaps,
                        "max_narrative_bridges": command.max_narrative_bridges
                    }
                },
                "results_summary": career_transition.generate_transition_summary(),
                "performance": {
                    "analysis_time_seconds": analysis_time,
                    "skills_found": len(career_transition.transferable_skills),
                    "gaps_identified": len(career_transition.skill_gaps),
                    "bridges_created": len(career_transition.narrative_bridges)
                }
            }
            
            # 9. Résultat final
            result = AnalyzeCareerTransitionResult(
                career_transition=career_transition,
                analysis_metadata=analysis_metadata,
                analysis_time_seconds=analysis_time,
                ai_service_used=self.skill_mapping_service.ai_service.is_available(),
                fallback_used=not self.skill_mapping_service.ai_service.is_available()
            )
            
            logger.info(f"✅ Analyse terminée - Score: {career_transition.overall_transition_score} ({analysis_time:.2f}s)")
            return result
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"❌ Erreur analyse transition: {e}")
            raise BusinessRuleError(f"Erreur lors de l'analyse de transition: {e}")
    
    async def get_analysis_preview(
        self, 
        command: AnalyzeCareerTransitionCommand
    ) -> Dict[str, Any]:
        """
        Aperçu rapide de l'analyse sans consommer de quota
        
        Utile pour l'UX - montrer à l'utilisateur ce qu'il obtiendra
        """
        try:
            # Validation basique uniquement
            if not command.previous_role.strip() or not command.target_role.strip():
                raise ValidationError("Rôles précédent et cible obligatoires")
            
            # Preview basé sur les données locales (pas d'IA)
            preview_data = {
                "transition": {
                    "from": command.previous_role,
                    "to": command.target_role,
                    "estimated_difficulty": "medium",  # Estimation par défaut
                    "estimated_score_range": "0.6-0.8"
                },
                "expected_analysis": {
                    "transferable_skills_expected": "5-8 compétences principales",
                    "skill_gaps_expected": "3-5 lacunes à combler", 
                    "narrative_bridges_expected": "3-4 ponts narratifs",
                    "industry_transition": command.previous_industry != command.target_industry if command.previous_industry and command.target_industry else None
                },
                "analysis_features": {
                    "ai_powered": True,
                    "personalized": True,
                    "actionable": True,
                    "includes_learning_paths": True
                }
            }
            
            return preview_data
            
        except Exception as e:
            logger.warning(f"Erreur preview analyse: {e}")
            return {"error": "Preview indisponible"}