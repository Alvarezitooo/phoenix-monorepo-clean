"""
Service métier - Letter Domain
Clean Architecture - Logique métier pure, sans dépendances externes
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
import logging

from domain.entities.letter import Letter, LetterStatus, LetterTone, ExperienceLevel, JobContext
from domain.entities.user import User, UserTier
from domain.repositories.letter_repository import ILetterRepository, RepositoryError
from shared.exceptions.business_exceptions import (
    BusinessRuleError, 
    QuotaExceededError, 
    ValidationError
)

logger = logging.getLogger(__name__)


class LetterService:
    """
    Service métier principal pour la gestion des lettres
    Domain Service - Contient la logique métier complexe
    """
    
    def __init__(self, letter_repository: ILetterRepository):
        self.letter_repository = letter_repository
    
    async def create_letter(
        self, 
        user: User,
        company_name: str,
        position_title: str,
        job_description: Optional[str] = None,
        experience_level: ExperienceLevel = ExperienceLevel.INTERMEDIATE,
        desired_tone: LetterTone = LetterTone.PROFESSIONAL
    ) -> Letter:
        """
        Crée une nouvelle lettre pour un utilisateur
        
        Business Rules:
        - Vérifier les quotas utilisateur
        - Valider les données d'entrée
        - Enregistrer l'usage
        
        Args:
            user: Utilisateur créateur
            company_name: Nom de l'entreprise
            position_title: Titre du poste
            job_description: Description du poste (optionnel)
            experience_level: Niveau d'expérience
            desired_tone: Ton souhaité
            
        Returns:
            Letter: Nouvelle lettre créée
            
        Raises:
            QuotaExceededError: Si quota dépassé
            ValidationError: Si données invalides
            BusinessRuleError: Si règles métier violées
        """
        logger.info(f"Création nouvelle lettre pour utilisateur {user.id}")
        
        # Business Rule: Vérifier les quotas
        if not user.can_generate_letter:
            remaining = user.letters_remaining_this_month
            if remaining is not None and remaining <= 0:
                raise QuotaExceededError(
                    f"Quota mensuel dépassé. {user.usage_stats.letters_generated_this_month} lettres utilisées."
                )
            else:
                raise BusinessRuleError("Génération de lettres non autorisée pour ce compte")
        
        # Validation des données
        if not company_name.strip():
            raise ValidationError("Le nom de l'entreprise est obligatoire")
        if not position_title.strip():
            raise ValidationError("Le titre du poste est obligatoire")
        
        # Création de l'entité
        letter = Letter(
            user_id=user.id,
            experience_level=experience_level,
            desired_tone=desired_tone,
        )
        
        # Définition du contexte job
        letter.set_job_context(company_name, position_title, job_description)
        
        try:
            # Sauvegarde
            saved_letter = await self.letter_repository.save(letter)
            logger.info(f"Lettre créée avec succès: {saved_letter.id}")
            return saved_letter
            
        except RepositoryError as e:
            logger.error(f"Erreur sauvegarde lettre: {e}")
            raise BusinessRuleError(f"Impossible de créer la lettre: {e.message}")
    
    async def update_letter_content(
        self,
        letter_id: str,
        user_id: str,
        new_content: str,
        ai_generated: bool = False,
        model_used: Optional[str] = None
    ) -> Letter:
        """
        Met à jour le contenu d'une lettre
        
        Business Rules:
        - Vérifier la propriété
        - Valider que la lettre peut être modifiée
        - Enregistrer les versions
        
        Args:
            letter_id: ID de la lettre
            user_id: ID du propriétaire
            new_content: Nouveau contenu
            ai_generated: Généré par IA
            model_used: Modèle IA utilisé
            
        Returns:
            Letter: Lettre mise à jour
            
        Raises:
            ValidationError: Si données invalides
            BusinessRuleError: Si règles métier violées
        """
        logger.info(f"Mise à jour contenu lettre {letter_id}")
        
        # Récupération de la lettre
        letter = await self.letter_repository.get_by_id(letter_id)
        if not letter:
            raise ValidationError("Lettre introuvable")
        
        # Business Rule: Vérifier la propriété
        if letter.user_id != user_id:
            raise BusinessRuleError("Vous n'êtes pas autorisé à modifier cette lettre")
        
        # Business Rule: Vérifier si modifiable
        if not letter.can_be_edited():
            raise BusinessRuleError("Cette lettre ne peut plus être modifiée (finalisée)")
        
        # Validation du contenu
        if not new_content.strip():
            raise ValidationError("Le contenu ne peut pas être vide")
        
        try:
            # Mise à jour du contenu
            letter.update_content(new_content, ai_generated, model_used)
            
            # Sauvegarde
            updated_letter = await self.letter_repository.save(letter)
            logger.info(f"Contenu lettre mis à jour: {letter_id}")
            return updated_letter
            
        except RepositoryError as e:
            logger.error(f"Erreur mise à jour lettre: {e}")
            raise BusinessRuleError(f"Impossible de mettre à jour la lettre: {e.message}")
    
    async def finalize_letter(self, letter_id: str, user_id: str) -> Letter:
        """
        Finalise une lettre (prête à envoyer)
        
        Business Rules:
        - Vérifier la propriété
        - Valider que la lettre est complète
        - Marquer comme finalisée
        
        Args:
            letter_id: ID de la lettre
            user_id: ID du propriétaire
            
        Returns:
            Letter: Lettre finalisée
        """
        logger.info(f"Finalisation lettre {letter_id}")
        
        letter = await self.letter_repository.get_by_id(letter_id)
        if not letter:
            raise ValidationError("Lettre introuvable")
        
        if letter.user_id != user_id:
            raise BusinessRuleError("Vous n'êtes pas autorisé à finaliser cette lettre")
        
        try:
            letter.finalize()
            finalized_letter = await self.letter_repository.save(letter)
            logger.info(f"Lettre finalisée: {letter_id}")
            return finalized_letter
            
        except ValueError as e:
            raise ValidationError(str(e))
        except RepositoryError as e:
            logger.error(f"Erreur finalisation lettre: {e}")
            raise BusinessRuleError(f"Impossible de finaliser la lettre: {e.message}")
    
    async def get_user_letters(
        self, 
        user_id: str, 
        status: Optional[LetterStatus] = None,
        limit: Optional[int] = None
    ) -> List[Letter]:
        """
        Récupère les lettres d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            status: Filtrer par statut (optionnel)
            limit: Limiter le nombre de résultats
            
        Returns:
            List[Letter]: Lettres de l'utilisateur
        """
        logger.info(f"Récupération lettres utilisateur {user_id}")
        
        try:
            if status:
                letters = await self.letter_repository.get_by_status(status, user_id)
                if limit:
                    letters = letters[:limit]
            else:
                letters = await self.letter_repository.get_by_user_id(user_id, limit)
            
            logger.info(f"{len(letters)} lettres trouvées pour utilisateur {user_id}")
            return letters
            
        except RepositoryError as e:
            logger.error(f"Erreur récupération lettres: {e}")
            raise BusinessRuleError(f"Impossible de récupérer les lettres: {e.message}")
    
    async def get_letter_by_id(self, letter_id: str, user_id: str) -> Optional[Letter]:
        """
        Récupère une lettre par ID avec vérification de propriété
        
        Args:
            letter_id: ID de la lettre
            user_id: ID du propriétaire
            
        Returns:
            Optional[Letter]: Lettre trouvée ou None
        """
        try:
            letter = await self.letter_repository.get_by_id(letter_id)
            
            # Vérification de propriété
            if letter and letter.user_id != user_id:
                logger.warning(f"Tentative accès lettre {letter_id} par utilisateur non autorisé {user_id}")
                return None
            
            return letter
            
        except RepositoryError as e:
            logger.error(f"Erreur récupération lettre {letter_id}: {e}")
            return None
    
    async def delete_letter(self, letter_id: str, user_id: str) -> bool:
        """
        Supprime une lettre avec vérification de propriété
        
        Args:
            letter_id: ID de la lettre
            user_id: ID du propriétaire
            
        Returns:
            bool: True si supprimée, False sinon
        """
        logger.info(f"Suppression lettre {letter_id} par utilisateur {user_id}")
        
        try:
            # Vérification existence et propriété
            letter = await self.letter_repository.get_by_id(letter_id)
            if not letter:
                raise ValidationError("Lettre introuvable")
            
            if letter.user_id != user_id:
                raise BusinessRuleError("Vous n'êtes pas autorisé à supprimer cette lettre")
            
            # Business Rule: Ne pas supprimer les lettres finalisées importantes
            if letter.status == LetterStatus.FINALIZED and letter.metadata.word_count > 300:
                logger.warning(f"Tentative suppression lettre finalisée importante {letter_id}")
                # On pourrait lever une exception ou demander une confirmation
            
            success = await self.letter_repository.delete(letter_id, user_id)
            if success:
                logger.info(f"Lettre supprimée: {letter_id}")
            return success
            
        except RepositoryError as e:
            logger.error(f"Erreur suppression lettre: {e}")
            raise BusinessRuleError(f"Impossible de supprimer la lettre: {e.message}")
    
    async def search_letters_by_company(self, user_id: str, company_name: str) -> List[Letter]:
        """
        Recherche les lettres par nom d'entreprise
        
        Args:
            user_id: ID de l'utilisateur
            company_name: Nom de l'entreprise
            
        Returns:
            List[Letter]: Lettres pour cette entreprise
        """
        if not company_name.strip():
            return []
        
        try:
            return await self.letter_repository.search_by_company(company_name, user_id)
        except RepositoryError as e:
            logger.error(f"Erreur recherche lettres: {e}")
            return []
    
    async def get_letter_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Récupère les statistiques de lettres pour un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Dict: Statistiques détaillées
        """
        try:
            base_stats = await self.letter_repository.get_statistics(user_id)
            
            # Enrichissement avec logique métier
            today = date.today()
            monthly_count = await self.letter_repository.get_monthly_count(
                user_id, today.year, today.month
            )
            
            return {
                **base_stats,
                "this_month": monthly_count,
                "productivity_trend": self._calculate_productivity_trend(base_stats, monthly_count),
            }
            
        except RepositoryError as e:
            logger.error(f"Erreur statistiques lettres: {e}")
            return {"error": "Statistiques non disponibles"}
    
    async def cleanup_old_drafts(self, user_id: Optional[str] = None, days_old: int = 30) -> int:
        """
        Nettoie les brouillons anciens (tâche de maintenance)
        
        Args:
            user_id: ID utilisateur spécifique (optionnel)
            days_old: Âge minimum en jours
            
        Returns:
            int: Nombre de brouillons supprimés
        """
        logger.info(f"Nettoyage brouillons anciens de {days_old} jours")
        
        try:
            count = await self.letter_repository.cleanup_old_drafts(days_old)
            logger.info(f"{count} brouillons supprimés")
            return count
            
        except RepositoryError as e:
            logger.error(f"Erreur nettoyage brouillons: {e}")
            return 0
    
    def _calculate_productivity_trend(self, base_stats: Dict, monthly_count: int) -> str:
        """
        Calcule la tendance de productivité (logique métier)
        
        Args:
            base_stats: Statistiques de base
            monthly_count: Nombre ce mois
            
        Returns:
            str: Tendance (up, down, stable)
        """
        total = base_stats.get("total", 0)
        if total < 2:
            return "new_user"
        
        avg_monthly = total / max(1, base_stats.get("months_active", 1))
        
        if monthly_count > avg_monthly * 1.2:
            return "up"
        elif monthly_count < avg_monthly * 0.8:
            return "down"
        else:
            return "stable"