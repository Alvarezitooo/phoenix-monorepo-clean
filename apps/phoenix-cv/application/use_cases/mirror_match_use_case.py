"""
🎯 Phoenix CV - Mirror Match Use Case  
GAME CHANGER - Business Logic pour correspondance CV-Offre
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from domain.entities.cv_document import CVDocument
from domain.entities.mirror_match import JobDescription, MirrorMatchAnalysis
from domain.repositories.cv_repository import CVRepositoryInterface
from domain.services.mirror_match_service import MirrorMatchService
from shared.exceptions.business_exceptions import ValidationError, ProcessingError

logger = logging.getLogger(__name__)


@dataclass
class MirrorMatchCommand:
    """Commande pour l'analyse Mirror Match"""
    
    cv_id: str
    job_description_text: str
    job_title: str = ""
    company_name: str = ""
    industry: str = ""
    
    # Options d'analyse  
    include_salary_insights: bool = True
    include_culture_fit: bool = True
    generate_optimization_suggestions: bool = True
    
    # Métadonnées
    user_id: str = ""
    analysis_source: str = "manual"  # manual, api, bulk
    
    def validate(self) -> None:
        """Validation de la commande"""
        if not self.cv_id.strip():
            raise ValidationError("CV ID est obligatoire")
        
        if not self.job_description_text.strip():
            raise ValidationError("Description du poste obligatoire")
        
        if len(self.job_description_text) < 50:
            raise ValidationError("Description du poste trop courte (minimum 50 caractères)")
        
        if len(self.job_description_text) > 10000:
            raise ValidationError("Description du poste trop longue (maximum 10000 caractères)")


@dataclass  
class MirrorMatchResult:
    """Résultat de l'analyse Mirror Match"""
    
    success: bool = True
    analysis: Optional[MirrorMatchAnalysis] = None
    error_message: str = ""
    
    # Métriques de performance
    processing_time_ms: int = 0
    ai_calls_made: int = 0
    
    # Résumé exécutif
    executive_summary: Dict[str, Any] = field(default_factory=dict)
    
    def generate_executive_summary(self) -> Dict[str, Any]:
        """Génère un résumé exécutif de l'analyse"""
        if not self.analysis:
            return {}
        
        summary = {
            "overall_compatibility": self.analysis.overall_compatibility,
            "match_type": self.analysis.match_type.value,
            "recommendation": self._get_recommendation(),
            "key_strengths": self._get_key_strengths(),
            "priority_improvements": self.analysis.priority_improvements[:3],
            "success_probability": self.analysis.application_success_probability,
            "next_steps": self._generate_next_steps()
        }
        
        self.executive_summary = summary
        return summary
    
    def _get_recommendation(self) -> str:
        """Génère une recommandation basée sur le score"""
        if not self.analysis:
            return ""
        
        score = self.analysis.overall_compatibility
        
        if score >= 85:
            return "🟢 Candidature fortement recommandée - Excellent match"
        elif score >= 70:
            return "🟡 Candidature recommandée avec optimisations mineures"
        elif score >= 55:
            return "🟠 Candidature possible après optimisations importantes"
        else:
            return "🔴 Candidature déconseillée - Écart trop important"
    
    def _get_key_strengths(self) -> List[str]:
        """Identifie les points forts principaux"""
        if not self.analysis:
            return []
        
        strengths = []
        strong_matches = self.analysis.get_strong_matches()
        
        if len(strong_matches) >= 5:
            strengths.append(f"{len(strong_matches)} compétences clés correspondent parfaitement")
        
        if self.analysis.experience_match and self.analysis.experience_match.experience_score >= 80:
            strengths.append("Expérience très alignée avec les exigences")
        
        if self.analysis.keyword_density >= 0.4:
            strengths.append("Excellente densité de mots-clés ATS")
        
        if self.analysis.cultural_fit_score >= 75:
            strengths.append("Très bon fit culturel avec l'entreprise")
        
        return strengths[:3]  # Top 3 strengths
    
    def _generate_next_steps(self) -> List[str]:
        """Génère les prochaines étapes recommandées"""
        if not self.analysis:
            return []
        
        steps = []
        score = self.analysis.overall_compatibility
        
        if score >= 70:
            steps.extend([
                "Postuler rapidement - profil très attractif",
                "Préparer les questions d'entretien sur les points forts",
                "Personaliser la lettre de motivation"
            ])
        elif score >= 55:
            steps.extend([
                "Optimiser le CV selon les suggestions prioritaires",  
                "Renforcer les compétences manquantes critiques",
                "Revoir la candidature dans 2-3 semaines"
            ])
        else:
            steps.extend([
                "Développer les compétences clés manquantes",
                "Rechercher des postes plus adaptés au profil actuel",
                "Prévoir 3-6 mois de préparation avant candidature"
            ])
        
        return steps


class MirrorMatchUseCase:
    """
    🎯 Use Case principal - Analyse Mirror Match CV-Offre
    Orchestration de l'analyse de correspondance avec IA
    """
    
    def __init__(self, 
                 cv_repository: CVRepositoryInterface,
                 mirror_match_service: MirrorMatchService):
        """
        Args:
            cv_repository: Repository pour l'accès aux CV
            mirror_match_service: Service d'analyse Mirror Match
        """
        self.cv_repository = cv_repository
        self.mirror_match_service = mirror_match_service
        self.logger = logging.getLogger(__name__)
    
    async def execute(self, command: MirrorMatchCommand) -> MirrorMatchResult:
        """
        🔥 Exécute l'analyse Mirror Match complète
        
        Args:
            command: Paramètres de l'analyse
            
        Returns:
            MirrorMatchResult: Résultat de l'analyse
        """
        
        start_time = datetime.now()
        result = MirrorMatchResult()
        ai_calls = 0
        
        try:
            # 1. Validation des paramètres
            command.validate()
            self.logger.info(f"🎯 Démarrage Mirror Match pour CV {command.cv_id}")
            
            # 2. Récupération du CV
            cv = await self.cv_repository.get_cv_by_id(command.cv_id)
            if not cv:
                raise ValidationError(f"CV non trouvé: {command.cv_id}")
            
            # 3. Analyse de l'offre d'emploi avec IA
            self.logger.info("🤖 Analyse de l'offre d'emploi avec Gemini")
            job_description = await self.mirror_match_service.analyze_job_description(
                job_text=command.job_description_text,
                job_title=command.job_title,
                company_name=command.company_name
            )
            ai_calls += 1
            
            # 4. Enrichissement des métadonnées
            if command.industry:
                job_description.industry = command.industry
            
            # 5. Analyse Mirror Match complète
            self.logger.info("🎯 Exécution de l'analyse Mirror Match")
            analysis = await self.mirror_match_service.perform_mirror_match(cv, job_description)
            ai_calls += 3  # Plusieurs appels IA dans l'analyse
            
            # 6. Sauvegarde de l'analyse
            await self.cv_repository.save_mirror_match(analysis)
            
            # 7. Génération du résultat
            result.analysis = analysis
            result.ai_calls_made = ai_calls
            
            # 8. Résumé exécutif
            result.generate_executive_summary()
            
            # 9. Logging des métriques
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            result.processing_time_ms = int(processing_time)
            
            self.logger.info(
                f"✅ Mirror Match terminé - Score: {analysis.overall_compatibility}/100 "
                f"({processing_time:.0f}ms, {ai_calls} appels IA)"
            )
            
            return result
            
        except ValidationError as e:
            self.logger.warning(f"❌ Erreur de validation Mirror Match: {e}")
            result.success = False
            result.error_message = str(e)
            return result
            
        except ProcessingError as e:
            self.logger.error(f"❌ Erreur de traitement Mirror Match: {e}")
            result.success = False
            result.error_message = f"Erreur de traitement: {e}"
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Erreur inattendue Mirror Match: {e}", exc_info=True)
            result.success = False
            result.error_message = "Erreur technique inattendue"
            return result
        
        finally:
            # Calcul du temps de traitement final
            if result.processing_time_ms == 0:
                processing_time = (datetime.now() - start_time).total_seconds() * 1000
                result.processing_time_ms = int(processing_time)
    
    async def get_analysis_history(self, cv_id: str, limit: int = 10) -> List[MirrorMatchAnalysis]:
        """
        Récupère l'historique des analyses pour un CV
        
        Args:
            cv_id: ID du CV
            limit: Nombre maximum d'analyses à retourner
            
        Returns:
            List[MirrorMatchAnalysis]: Historique des analyses
        """
        
        try:
            return await self.cv_repository.get_mirror_matches(cv_id, limit)
        except Exception as e:
            self.logger.error(f"❌ Erreur récupération historique: {e}")
            return []
    
    async def compare_analyses(self, cv_id: str, analysis_ids: List[str]) -> Dict[str, Any]:
        """
        Compare plusieurs analyses Mirror Match
        
        Args:
            cv_id: ID du CV
            analysis_ids: IDs des analyses à comparer
            
        Returns:
            Dict[str, Any]: Comparaison détaillée
        """
        
        try:
            # Récupération des analyses
            all_analyses = await self.cv_repository.get_mirror_matches(cv_id, 50)
            selected_analyses = [a for a in all_analyses if a.id in analysis_ids]
            
            if len(selected_analyses) < 2:
                raise ValidationError("Au moins 2 analyses nécessaires pour la comparaison")
            
            # Génération de la comparaison
            comparison = {
                "analyses_count": len(selected_analyses),
                "average_score": sum(a.overall_compatibility for a in selected_analyses) / len(selected_analyses),
                "best_match": max(selected_analyses, key=lambda a: a.overall_compatibility),
                "score_evolution": [
                    {
                        "date": a.created_at.isoformat(),
                        "score": a.overall_compatibility,
                        "job_title": getattr(a, 'job_title', 'Unknown')
                    }
                    for a in sorted(selected_analyses, key=lambda a: a.created_at)
                ],
                "common_strengths": self._find_common_strengths(selected_analyses),
                "recurring_gaps": self._find_recurring_gaps(selected_analyses)
            }
            
            return comparison
            
        except Exception as e:
            self.logger.error(f"❌ Erreur comparaison analyses: {e}")
            raise ProcessingError(f"Erreur lors de la comparaison: {e}")
    
    def _find_common_strengths(self, analyses: List[MirrorMatchAnalysis]) -> List[str]:
        """Identifie les forces communes à travers les analyses"""
        
        # Comptage des compétences fortes récurrentes
        strength_count = {}
        
        for analysis in analyses:
            strong_matches = analysis.get_strong_matches()
            for match in strong_matches:
                skill = match.cv_skill
                strength_count[skill] = strength_count.get(skill, 0) + 1
        
        # Retourner les compétences présentes dans au moins 50% des analyses
        threshold = len(analyses) / 2
        return [skill for skill, count in strength_count.items() if count >= threshold]
    
    def _find_recurring_gaps(self, analyses: List[MirrorMatchAnalysis]) -> List[str]:
        """Identifie les lacunes récurrentes"""
        
        gap_count = {}
        
        for analysis in analyses:
            missing_skills = analysis.get_missing_skills()
            for skill in missing_skills:
                gap_count[skill] = gap_count.get(skill, 0) + 1
        
        # Retourner les lacunes présentes dans au moins 30% des analyses
        threshold = len(analyses) * 0.3
        return [skill for skill, count in gap_count.items() if count >= threshold]