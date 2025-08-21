"""
Use Case - Generate Letter
Clean Architecture - Application Layer
Orchestration de la génération de lettre complète
"""

from typing import Optional
import logging
from dataclasses import dataclass

from domain.entities.letter import Letter, LetterTone, ExperienceLevel
from domain.entities.user import User
from domain.services.letter_service import LetterService
from domain.repositories.letter_repository import ILetterRepository
from domain.repositories.user_repository import IUserRepository
from infrastructure.ai.ai_interface import IAIService, GenerationRequest, GenerationResponse
from shared.exceptions.business_exceptions import (
    ValidationError, 
    BusinessRuleError, 
    AIServiceError,
    QuotaExceededError
)

logger = logging.getLogger(__name__)


@dataclass
class GenerateLetterCommand:
    """Commande pour générer une lettre"""
    user_id: str
    company_name: str
    position_title: str
    job_description: Optional[str] = None
    experience_level: str = "intermédiaire"
    desired_tone: str = "professionnel"
    max_words: int = 350
    use_ai: bool = True


@dataclass
class GenerateLetterResult:
    """Résultat de la génération de lettre"""
    letter: Letter
    generation_info: dict
    user_updated: bool = False
    
    def to_dict(self) -> dict:
        """Sérialisation pour les APIs"""
        return {
            "letter_id": self.letter.id,
            "content": self.letter.content,
            "status": self.letter.status.value,
            "job_context": {
                "company": self.letter.job_context.company_name if self.letter.job_context else None,
                "position": self.letter.job_context.position_title if self.letter.job_context else None,
            },
            "metadata": {
                "word_count": self.letter.metadata.word_count,
                "estimated_read_time": self.letter.metadata.estimated_read_time_seconds,
                "ai_generated": self.letter.metadata.ai_generated,
                "generation_model": self.letter.metadata.generation_model,
            },
            "generation_info": self.generation_info,
            "user_stats_updated": self.user_updated,
        }


class GenerateLetterUseCase:
    """
    Use Case principal pour la génération de lettres
    
    Responsabilités:
    1. Validation des inputs
    2. Vérification des permissions/quotas
    3. Génération IA ou fallback
    4. Persistence de la lettre
    5. Mise à jour des stats utilisateur
    6. Orchestration complète du workflow
    """
    
    def __init__(
        self,
        letter_service: LetterService,
        user_repository: IUserRepository,
        ai_service: IAIService
    ):
        self.letter_service = letter_service
        self.user_repository = user_repository
        self.ai_service = ai_service
    
    async def execute(self, command: GenerateLetterCommand) -> GenerateLetterResult:
        """
        Exécute la génération complète d'une lettre
        
        Args:
            command: Commande de génération
            
        Returns:
            GenerateLetterResult: Résultat complet
            
        Raises:
            ValidationError: Données invalides
            BusinessRuleError: Règles métier violées
            QuotaExceededError: Quota dépassé
        """
        logger.info(f"🚀 Début génération lettre pour utilisateur {command.user_id}")
        
        # 1. Validation des données d'entrée
        self._validate_command(command)
        
        # 2. Récupération de l'utilisateur
        user = await self._get_and_validate_user(command.user_id)
        
        # 3. Conversion des enums
        experience_level = self._parse_experience_level(command.experience_level)
        desired_tone = self._parse_tone(command.desired_tone)
        
        # 4. Création de la lettre (business rules appliquées)
        letter = await self.letter_service.create_letter(
            user=user,
            company_name=command.company_name,
            position_title=command.position_title,
            job_description=command.job_description,
            experience_level=experience_level,
            desired_tone=desired_tone
        )
        
        logger.info(f"✅ Lettre créée: {letter.id}")
        
        # 5. Génération du contenu
        generation_info = {}
        if command.use_ai:
            try:
                generation_info = await self._generate_ai_content(letter, command)
            except AIServiceError as e:
                logger.warning(f"⚠️ Génération IA échouée, fallback: {e}")
                generation_info = await self._generate_fallback_content(letter)
        else:
            generation_info = await self._generate_fallback_content(letter)
        
        # 6. Mise à jour de la lettre avec le contenu généré
        updated_letter = await self.letter_service.update_letter_content(
            letter_id=letter.id,
            user_id=user.id,
            new_content=generation_info["content"],
            ai_generated=generation_info["ai_generated"],
            model_used=generation_info.get("model_used")
        )
        
        # 7. Mise à jour des statistiques utilisateur
        user_updated = await self._update_user_stats(user)
        
        logger.info(f"🎉 Génération terminée avec succès pour {command.company_name}")
        
        return GenerateLetterResult(
            letter=updated_letter,
            generation_info=generation_info,
            user_updated=user_updated
        )
    
    def _validate_command(self, command: GenerateLetterCommand) -> None:
        """Validation des données de la commande"""
        if not command.user_id or not command.user_id.strip():
            raise ValidationError("ID utilisateur requis", "user_id")
        
        if not command.company_name or not command.company_name.strip():
            raise ValidationError("Nom de l'entreprise requis", "company_name")
        
        if not command.position_title or not command.position_title.strip():
            raise ValidationError("Titre du poste requis", "position_title")
        
        if command.max_words < 100 or command.max_words > 1000:
            raise ValidationError("Nombre de mots doit être entre 100 et 1000", "max_words")
        
        # Validation des énumérations
        valid_experience_levels = ["junior", "intermédiaire", "senior"]
        if command.experience_level not in valid_experience_levels:
            raise ValidationError(f"Niveau d'expérience invalide. Valeurs: {valid_experience_levels}", "experience_level")
        
        valid_tones = ["professionnel", "enthousiaste", "créatif", "décontracté"]
        if command.desired_tone not in valid_tones:
            raise ValidationError(f"Ton invalide. Valeurs: {valid_tones}", "desired_tone")
    
    async def _get_and_validate_user(self, user_id: str) -> User:
        """Récupère et valide l'utilisateur"""
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValidationError("Utilisateur introuvable", "user_id")
        
        # Vérification des permissions de génération
        if not user.can_generate_letter:
            if user.letters_remaining_this_month == 0:
                raise QuotaExceededError(
                    "Quota mensuel de lettres gratuites dépassé",
                    current_usage=user.usage_stats.letters_generated_this_month,
                    limit=3  # depuis config
                )
            else:
                raise BusinessRuleError("Génération de lettres non autorisée pour ce compte")
        
        return user
    
    def _parse_experience_level(self, level_str: str) -> ExperienceLevel:
        """Convertit string vers enum ExperienceLevel"""
        mapping = {
            "junior": ExperienceLevel.JUNIOR,
            "intermédiaire": ExperienceLevel.INTERMEDIATE,
            "senior": ExperienceLevel.SENIOR
        }
        return mapping[level_str]
    
    def _parse_tone(self, tone_str: str) -> LetterTone:
        """Convertit string vers enum LetterTone"""
        mapping = {
            "professionnel": LetterTone.PROFESSIONAL,
            "enthousiaste": LetterTone.ENTHUSIASTIC,
            "créatif": LetterTone.CREATIVE,
            "décontracté": LetterTone.CASUAL
        }
        return mapping[tone_str]
    
    async def _generate_ai_content(self, letter: Letter, command: GenerateLetterCommand) -> dict:
        """Génère le contenu avec l'IA"""
        if not self.ai_service.is_available():
            raise AIServiceError("Service IA non disponible", is_temporary=True)
        
        # Préparation de la requête IA
        request = GenerationRequest(
            company_name=command.company_name,
            position_title=command.position_title,
            job_description=command.job_description,
            experience_level=self._parse_experience_level(command.experience_level),
            desired_tone=self._parse_tone(command.desired_tone),
            max_words=command.max_words,
            language="fr"
        )
        
        logger.info(f"📡 Appel IA pour génération: {command.company_name}")
        
        try:
            response: GenerationResponse = await self.ai_service.generate_letter_content(request)
            
            return {
                "content": response.content,
                "ai_generated": True,
                "model_used": response.model_used,
                "generation_time_seconds": response.generation_time_seconds,
                "estimated_quality": response.estimated_quality,
                "token_count": response.token_count,
                "confidence_score": response.confidence_score,
                "detected_issues": response.detected_issues,
                "suggestions": response.suggestions,
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur génération IA: {e}")
            raise AIServiceError(f"Génération IA échouée: {e}", is_temporary=True)
    
    async def _generate_fallback_content(self, letter: Letter) -> dict:
        """Génère un contenu de secours sans IA"""
        if not letter.job_context:
            raise BusinessRuleError("Contexte job manquant pour fallback")
        
        company = letter.job_context.company_name
        position = letter.job_context.position_title
        experience = letter.experience_level.value
        
        fallback_content = f"""Objet : Candidature pour le poste de {position}

Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de {position} au sein de {company}.

Fort(e) d'une expérience {experience}, je suis convaincu(e) que mes compétences et ma motivation s'alignent parfaitement avec les exigences de ce poste.

Mon parcours professionnel m'a permis de développer une expertise solide que je souhaiterais mettre au service de votre équipe. Je suis particulièrement intéressé(e) par les défis que présente ce rôle et par l'opportunité de contribuer au succès de {company}.

Je serais ravi(e) de vous rencontrer pour discuter de ma candidature et de la façon dont je peux apporter une valeur ajoutée à votre organisation.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Votre nom]

---
Générée par Phoenix Letters (mode autonome)"""
        
        logger.info(f"📝 Contenu de secours généré pour {company}")
        
        return {
            "content": fallback_content,
            "ai_generated": False,
            "model_used": None,
            "generation_time_seconds": 0.1,
            "method": "fallback_template",
            "estimated_quality": "basic",
        }
    
    async def _update_user_stats(self, user: User) -> bool:
        """Met à jour les statistiques utilisateur"""
        try:
            user.record_letter_generation()
            await self.user_repository.save(user)
            logger.info(f"📊 Stats utilisateur mises à jour: {user.usage_stats.letters_generated_this_month} lettres ce mois")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur mise à jour stats utilisateur: {e}")
            return False