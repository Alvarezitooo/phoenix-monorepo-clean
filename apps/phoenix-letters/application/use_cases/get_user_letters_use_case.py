"""
Use Case - Get User Letters
Clean Architecture - Application Layer
Récupération des lettres d'un utilisateur avec logique métier
"""

from typing import List, Optional, Dict, Any
import logging
from dataclasses import dataclass
from datetime import datetime

from domain.entities.letter import Letter, LetterStatus
from domain.entities.user import User
from domain.services.letter_service import LetterService
from domain.repositories.user_repository import IUserRepository
from shared.exceptions.business_exceptions import ValidationError, AuthorizationError

logger = logging.getLogger(__name__)


@dataclass
class GetUserLettersQuery:
    """Query pour récupérer les lettres utilisateur"""
    user_id: str
    status_filter: Optional[str] = None
    limit: Optional[int] = None
    include_stats: bool = True
    include_recent_only: bool = False
    days_recent: int = 30


@dataclass
class UserLettersResult:
    """Résultat de récupération des lettres utilisateur"""
    letters: List[Letter]
    user_summary: Dict[str, Any]
    statistics: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation pour APIs"""
        return {
            "letters": [self._letter_to_dict(letter) for letter in self.letters],
            "user_summary": self.user_summary,
            "statistics": self.statistics,
            "total_count": len(self.letters),
            "timestamp": datetime.now().isoformat(),
        }
    
    def _letter_to_dict(self, letter: Letter) -> Dict[str, Any]:
        """Convertit une lettre en dictionnaire"""
        return {
            "id": letter.id,
            "content_preview": letter.content[:200] + "..." if len(letter.content) > 200 else letter.content,
            "company_name": letter.job_context.company_name if letter.job_context else None,
            "position_title": letter.job_context.position_title if letter.job_context else None,
            "status": letter.status.value,
            "experience_level": letter.experience_level.value,
            "desired_tone": letter.desired_tone.value,
            "metadata": {
                "word_count": letter.metadata.word_count,
                "ai_generated": letter.metadata.ai_generated,
                "created_at": letter.metadata.created_at.isoformat(),
                "updated_at": letter.metadata.updated_at.isoformat(),
                "version": letter.version,
            },
            "quality_indicators": letter.get_quality_indicators(),
            "filename": letter.get_filename(),
        }


class GetUserLettersUseCase:
    """
    Use Case pour récupérer les lettres d'un utilisateur
    
    Responsabilités:
    1. Validation des permissions
    2. Récupération des lettres avec filtres
    3. Enrichissement avec statistiques
    4. Application des règles de confidentialité
    5. Formatage des résultats
    """
    
    def __init__(
        self,
        letter_service: LetterService,
        user_repository: IUserRepository
    ):
        self.letter_service = letter_service
        self.user_repository = user_repository
    
    async def execute(self, query: GetUserLettersQuery) -> UserLettersResult:
        """
        Exécute la récupération des lettres utilisateur
        
        Args:
            query: Query de récupération
            
        Returns:
            UserLettersResult: Lettres et métadonnées
            
        Raises:
            ValidationError: Données invalides
            AuthorizationError: Permissions insuffisantes
        """
        logger.info(f"📋 Récupération lettres pour utilisateur {query.user_id}")
        
        # 1. Validation de la query
        self._validate_query(query)
        
        # 2. Vérification utilisateur et permissions
        user = await self._get_and_validate_user(query.user_id)
        
        # 3. Récupération des lettres avec filtres
        letters = await self._get_filtered_letters(query, user)
        
        # 4. Enrichissement avec statistiques si demandé
        statistics = None
        if query.include_stats:
            statistics = await self._get_user_statistics(query.user_id)
        
        # 5. Création du résumé utilisateur
        user_summary = self._create_user_summary(user, len(letters))
        
        logger.info(f"✅ {len(letters)} lettres récupérées pour {query.user_id}")
        
        return UserLettersResult(
            letters=letters,
            user_summary=user_summary,
            statistics=statistics
        )
    
    def _validate_query(self, query: GetUserLettersQuery) -> None:
        """Validation des paramètres de la query"""
        if not query.user_id or not query.user_id.strip():
            raise ValidationError("ID utilisateur requis", "user_id")
        
        if query.status_filter:
            valid_statuses = [status.value for status in LetterStatus]
            if query.status_filter not in valid_statuses:
                raise ValidationError(
                    f"Statut invalide. Valeurs possibles: {valid_statuses}", 
                    "status_filter"
                )
        
        if query.limit is not None and query.limit <= 0:
            raise ValidationError("Limite doit être supérieure à 0", "limit")
        
        if query.limit is not None and query.limit > 1000:
            raise ValidationError("Limite maximale: 1000", "limit")
        
        if query.days_recent <= 0:
            raise ValidationError("Jours récents doit être positif", "days_recent")
    
    async def _get_and_validate_user(self, user_id: str) -> User:
        """Récupère et valide l'utilisateur"""
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValidationError("Utilisateur introuvable", "user_id")
        
        # Vérifications de sécurité
        if user.is_account_locked:
            raise AuthorizationError("Compte utilisateur verrouillé")
        
        return user
    
    async def _get_filtered_letters(self, query: GetUserLettersQuery, user: User) -> List[Letter]:
        """Récupère les lettres avec filtres appliqués"""
        try:
            if query.include_recent_only:
                # Lettres récentes seulement
                letters = await self.letter_service.letter_repository.get_recent_letters(
                    user_id=query.user_id,
                    days=query.days_recent,
                    limit=query.limit or 50
                )
            elif query.status_filter:
                # Filtre par statut
                status_enum = LetterStatus(query.status_filter)
                letters = await self.letter_service.get_user_letters(
                    user_id=query.user_id,
                    status=status_enum,
                    limit=query.limit
                )
            else:
                # Toutes les lettres
                letters = await self.letter_service.get_user_letters(
                    user_id=query.user_id,
                    limit=query.limit
                )
            
            # Tri par date de modification (plus récent en premier)
            letters.sort(key=lambda l: l.metadata.updated_at, reverse=True)
            
            logger.info(f"📚 {len(letters)} lettres trouvées avec filtres")
            return letters
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération lettres filtrées: {e}")
            raise ValidationError(f"Erreur récupération lettres: {str(e)}")
    
    async def _get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """Récupère les statistiques détaillées utilisateur"""
        try:
            stats = await self.letter_service.get_letter_statistics(user_id)
            
            # Enrichissement avec données calculées
            user = await self.user_repository.get_by_id(user_id)
            if user:
                stats.update({
                    "current_month_usage": {
                        "letters_generated": user.usage_stats.letters_generated_this_month,
                        "letters_downloaded": user.usage_stats.letters_downloaded_this_month,
                        "remaining_free": user.letters_remaining_this_month,
                        "is_premium": user.is_premium,
                    },
                    "account_info": {
                        "tier": user.subscription.tier.value,
                        "days_remaining": user.subscription.days_remaining,
                        "auto_renew": user.subscription.auto_renew,
                    },
                    "activity": {
                        "last_login": user.last_login.isoformat() if user.last_login else None,
                        "last_activity": user.usage_stats.last_activity.isoformat() if user.usage_stats.last_activity else None,
                        "account_age_days": (datetime.now() - user.created_at).days,
                    }
                })
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération statistiques: {e}")
            return {"error": "Statistiques non disponibles"}
    
    def _create_user_summary(self, user: User, letters_count: int) -> Dict[str, Any]:
        """Crée un résumé utilisateur pour le contexte"""
        return {
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "tier": user.subscription.tier.value,
            "is_premium": user.is_premium,
            "letters_count": letters_count,
            "can_generate_more": user.can_generate_letter,
            "letters_remaining_this_month": user.letters_remaining_this_month,
            "account_created": user.created_at.isoformat(),
            "last_activity": user.usage_stats.last_activity.isoformat() if user.usage_stats.last_activity else None,
        }


# Use Case complémentaire pour récupérer une lettre spécifique

@dataclass
class GetLetterByIdQuery:
    """Query pour récupérer une lettre par ID"""
    letter_id: str
    user_id: str
    include_versions: bool = False


@dataclass  
class LetterDetailResult:
    """Résultat détaillé d'une lettre"""
    letter: Letter
    user_can_edit: bool
    user_can_delete: bool
    versions_history: Optional[List[str]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Sérialisation détaillée"""
        return {
            "id": self.letter.id,
            "content": self.letter.content,
            "job_context": {
                "company_name": self.letter.job_context.company_name if self.letter.job_context else None,
                "position_title": self.letter.job_context.position_title if self.letter.job_context else None,
                "job_description": self.letter.job_context.job_description if self.letter.job_context else None,
                "is_complete": self.letter.job_context.is_complete if self.letter.job_context else False,
            },
            "settings": {
                "experience_level": self.letter.experience_level.value,
                "desired_tone": self.letter.desired_tone.value,
            },
            "status": {
                "current": self.letter.status.value,
                "can_be_edited": self.letter.can_be_edited(),
                "version": self.letter.version,
            },
            "metadata": {
                "word_count": self.letter.metadata.word_count,
                "estimated_read_time_seconds": self.letter.metadata.estimated_read_time_seconds,
                "ai_generated": self.letter.metadata.ai_generated,
                "generation_model": self.letter.metadata.generation_model,
                "created_at": self.letter.metadata.created_at.isoformat(),
                "updated_at": self.letter.metadata.updated_at.isoformat(),
            },
            "quality_indicators": self.letter.get_quality_indicators(),
            "permissions": {
                "can_edit": self.user_can_edit,
                "can_delete": self.user_can_delete,
            },
            "versions_history": self.versions_history,
            "filename": self.letter.get_filename(),
        }


class GetLetterByIdUseCase:
    """Use Case pour récupérer une lettre spécifique"""
    
    def __init__(self, letter_service: LetterService):
        self.letter_service = letter_service
    
    async def execute(self, query: GetLetterByIdQuery) -> Optional[LetterDetailResult]:
        """
        Récupère une lettre par ID avec vérifications de sécurité
        
        Args:
            query: Query de récupération
            
        Returns:
            Optional[LetterDetailResult]: Détails de la lettre ou None
        """
        logger.info(f"📄 Récupération lettre {query.letter_id} pour utilisateur {query.user_id}")
        
        # Validation basique
        if not query.letter_id or not query.user_id:
            raise ValidationError("ID lettre et utilisateur requis")
        
        # Récupération avec vérification de propriété
        letter = await self.letter_service.get_letter_by_id(query.letter_id, query.user_id)
        if not letter:
            return None
        
        # Calcul des permissions
        user_can_edit = letter.can_be_edited()
        user_can_delete = True  # L'utilisateur peut toujours supprimer ses lettres
        
        # Historique des versions si demandé
        versions_history = None
        if query.include_versions and letter.previous_versions:
            versions_history = letter.previous_versions
        
        logger.info(f"✅ Lettre récupérée: {letter.id}")
        
        return LetterDetailResult(
            letter=letter,
            user_can_edit=user_can_edit,
            user_can_delete=user_can_delete,
            versions_history=versions_history
        )