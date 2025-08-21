"""
Mock Repository - Letter
Clean Architecture - Implémentation en mémoire pour tests/demo
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import logging

from domain.entities.letter import Letter, LetterStatus
from domain.repositories.letter_repository import ILetterRepository, RepositoryError

logger = logging.getLogger(__name__)


class MockLetterRepository(ILetterRepository):
    """
    Repository Mock pour les lettres
    Stockage en mémoire pour développement/tests
    """
    
    def __init__(self):
        self._letters: Dict[str, Letter] = {}
        self._initialized = True
        logger.info("📦 MockLetterRepository initialisé")
    
    async def save(self, letter: Letter) -> Letter:
        """Sauvegarde une lettre en mémoire"""
        try:
            # Mise à jour timestamp
            letter.metadata.updated_at = datetime.now()
            
            # Stockage
            self._letters[letter.id] = letter
            
            logger.info(f"💾 Lettre sauvegardée: {letter.id}")
            return letter
            
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde lettre: {e}")
            raise RepositoryError(f"Erreur sauvegarde: {e}", e)
    
    async def get_by_id(self, letter_id: str) -> Optional[Letter]:
        """Récupère une lettre par ID"""
        try:
            letter = self._letters.get(letter_id)
            if letter:
                logger.info(f"📄 Lettre récupérée: {letter_id}")
            return letter
        except Exception as e:
            logger.error(f"❌ Erreur récupération lettre {letter_id}: {e}")
            return None
    
    async def get_by_user_id(self, user_id: str, limit: Optional[int] = None) -> List[Letter]:
        """Récupère les lettres d'un utilisateur"""
        try:
            user_letters = [
                letter for letter in self._letters.values()
                if letter.user_id == user_id
            ]
            
            # Tri par date de modification (plus récent en premier)
            user_letters.sort(key=lambda l: l.metadata.updated_at, reverse=True)
            
            if limit:
                user_letters = user_letters[:limit]
            
            logger.info(f"📚 {len(user_letters)} lettres trouvées pour utilisateur {user_id}")
            return user_letters
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération lettres utilisateur {user_id}: {e}")
            raise RepositoryError(f"Erreur récupération: {e}", e)
    
    async def get_by_status(self, status: LetterStatus, user_id: Optional[str] = None) -> List[Letter]:
        """Récupère les lettres par statut"""
        try:
            status_letters = [
                letter for letter in self._letters.values()
                if letter.status == status and (user_id is None or letter.user_id == user_id)
            ]
            
            status_letters.sort(key=lambda l: l.metadata.updated_at, reverse=True)
            
            logger.info(f"📋 {len(status_letters)} lettres avec statut {status.value}")
            return status_letters
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération par statut: {e}")
            raise RepositoryError(f"Erreur récupération: {e}", e)
    
    async def delete(self, letter_id: str, user_id: str) -> bool:
        """Supprime une lettre avec vérification propriétaire"""
        try:
            letter = self._letters.get(letter_id)
            if not letter:
                return False
            
            if letter.user_id != user_id:
                logger.warning(f"⚠️ Tentative suppression non autorisée: {letter_id} par {user_id}")
                return False
            
            del self._letters[letter_id]
            logger.info(f"🗑️ Lettre supprimée: {letter_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur suppression lettre {letter_id}: {e}")
            return False
    
    async def search_by_company(self, company_name: str, user_id: str) -> List[Letter]:
        """Recherche les lettres par nom d'entreprise"""
        try:
            company_lower = company_name.lower()
            matching_letters = [
                letter for letter in self._letters.values()
                if (letter.user_id == user_id and 
                    letter.job_context and 
                    company_lower in letter.job_context.company_name.lower())
            ]
            
            matching_letters.sort(key=lambda l: l.metadata.updated_at, reverse=True)
            
            logger.info(f"🔍 {len(matching_letters)} lettres trouvées pour entreprise '{company_name}'")
            return matching_letters
            
        except Exception as e:
            logger.error(f"❌ Erreur recherche entreprise: {e}")
            return []
    
    async def get_recent_letters(self, user_id: str, days: int = 30, limit: int = 10) -> List[Letter]:
        """Récupère les lettres récentes d'un utilisateur"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            recent_letters = [
                letter for letter in self._letters.values()
                if (letter.user_id == user_id and 
                    letter.metadata.updated_at >= cutoff_date)
            ]
            
            recent_letters.sort(key=lambda l: l.metadata.updated_at, reverse=True)
            
            if limit:
                recent_letters = recent_letters[:limit]
            
            logger.info(f"📅 {len(recent_letters)} lettres récentes ({days} jours) pour {user_id}")
            return recent_letters
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération lettres récentes: {e}")
            return []
    
    async def get_statistics(self, user_id: str) -> Dict[str, Any]:
        """Récupère les statistiques de lettres pour un utilisateur"""
        try:
            user_letters = [
                letter for letter in self._letters.values()
                if letter.user_id == user_id
            ]
            
            if not user_letters:
                return {
                    "total": 0,
                    "by_status": {},
                    "months_active": 0,
                }
            
            # Statistiques par statut
            status_counts = {}
            for status in LetterStatus:
                count = sum(1 for letter in user_letters if letter.status == status)
                if count > 0:
                    status_counts[status.value] = count
            
            # Calcul des mois actifs
            dates = [letter.metadata.created_at for letter in user_letters]
            if dates:
                oldest = min(dates)
                months_active = max(1, (datetime.now() - oldest).days // 30)
            else:
                months_active = 1
            
            # Qualité moyenne
            quality_scores = []
            for letter in user_letters:
                indicators = letter.get_quality_indicators()
                score = 0.5  # Score de base
                if indicators["has_company"]:
                    score += 0.2
                if indicators["has_position"]:
                    score += 0.2
                if indicators["length_appropriate"]:
                    score += 0.1
                quality_scores.append(score)
            
            avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0.5
            
            stats = {
                "total": len(user_letters),
                "by_status": status_counts,
                "months_active": months_active,
                "average_quality": avg_quality,
                "total_words": sum(letter.metadata.word_count for letter in user_letters),
                "oldest_letter": min(dates).isoformat() if dates else None,
                "newest_letter": max(dates).isoformat() if dates else None,
            }
            
            logger.info(f"📊 Statistiques calculées pour {user_id}: {stats['total']} lettres")
            return stats
            
        except Exception as e:
            logger.error(f"❌ Erreur calcul statistiques: {e}")
            return {"error": str(e)}
    
    async def cleanup_old_drafts(self, days_old: int = 30) -> int:
        """Nettoie les brouillons anciens"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            old_drafts = [
                letter_id for letter_id, letter in self._letters.items()
                if (letter.status == LetterStatus.DRAFT and 
                    letter.metadata.created_at < cutoff_date)
            ]
            
            for letter_id in old_drafts:
                del self._letters[letter_id]
            
            logger.info(f"🧹 {len(old_drafts)} brouillons anciens supprimés")
            return len(old_drafts)
            
        except Exception as e:
            logger.error(f"❌ Erreur nettoyage brouillons: {e}")
            return 0
    
    async def exists(self, letter_id: str, user_id: str) -> bool:
        """Vérifie si une lettre existe pour un utilisateur"""
        try:
            letter = self._letters.get(letter_id)
            exists = letter is not None and letter.user_id == user_id
            return exists
        except Exception as e:
            logger.error(f"❌ Erreur vérification existence: {e}")
            return False
    
    async def count_by_user(self, user_id: str, status: Optional[LetterStatus] = None) -> int:
        """Compte les lettres d'un utilisateur"""
        try:
            count = 0
            for letter in self._letters.values():
                if letter.user_id == user_id:
                    if status is None or letter.status == status:
                        count += 1
            return count
        except Exception as e:
            logger.error(f"❌ Erreur comptage lettres: {e}")
            return 0
    
    async def get_monthly_count(self, user_id: str, year: int, month: int) -> int:
        """Compte les lettres générées dans un mois donné"""
        try:
            count = 0
            for letter in self._letters.values():
                if (letter.user_id == user_id and 
                    letter.metadata.created_at.year == year and
                    letter.metadata.created_at.month == month):
                    count += 1
            return count
        except Exception as e:
            logger.error(f"❌ Erreur comptage mensuel: {e}")
            return 0
    
    # Méthodes utilitaires pour les tests/demo
    
    def add_demo_letters(self, user_id: str) -> None:
        """Ajoute des lettres de démo pour tester l'interface"""
        from domain.entities.letter import JobContext, ExperienceLevel, LetterTone
        
        demo_letters = [
            {
                "company": "Google France", 
                "position": "Développeur Frontend",
                "status": LetterStatus.FINALIZED,
                "content": """Objet : Candidature pour le poste de Développeur Frontend

Madame, Monsieur,

Passionné par le développement web et particulièrement attiré par l'innovation technologique que représente Google France, je me permets de vous adresser ma candidature pour le poste de Développeur Frontend.

Fort de 3 années d'expérience en développement React et TypeScript, j'ai eu l'opportunité de contribuer à plusieurs projets web d'envergure. Mon expertise technique, combinée à ma capacité d'adaptation et mon goût pour les défis, me permettraient de m'intégrer rapidement à vos équipes.

Votre approche centrée sur l'expérience utilisateur et l'excellence technique résonne parfaitement avec ma vision du développement. Je serais ravi de contribuer aux projets innovants de Google France et d'apporter ma créativité au service de vos millions d'utilisateurs.

Je reste à votre disposition pour un entretien et vous prie d'agréer l'expression de mes salutations distinguées.

[Votre nom]"""
            },
            {
                "company": "Startup TechFlow",
                "position": "Product Manager",
                "status": LetterStatus.DRAFT,
                "content": """Objet : Candidature Product Manager

Bonjour,

Intéressé par votre offre Product Manager chez TechFlow..."""
            }
        ]
        
        for i, demo in enumerate(demo_letters):
            letter = Letter(
                id=str(uuid.uuid4()),
                user_id=user_id,
                content=demo["content"],
                experience_level=ExperienceLevel.INTERMEDIATE,
                desired_tone=LetterTone.PROFESSIONAL,
                status=demo["status"]
            )
            letter.set_job_context(demo["company"], demo["position"])
            letter.metadata.update_word_count(demo["content"])
            
            # Dates variées pour la démo
            letter.metadata.created_at = datetime.now() - timedelta(days=i*7)
            letter.metadata.updated_at = letter.metadata.created_at
            
            self._letters[letter.id] = letter
        
        logger.info(f"🎭 {len(demo_letters)} lettres de démo ajoutées pour {user_id}")
    
    def get_storage_info(self) -> Dict[str, Any]:
        """Informations sur le stockage en mémoire"""
        return {
            "total_letters": len(self._letters),
            "storage_type": "in_memory",
            "initialized": self._initialized,
            "letters_by_user": {
                user_id: len([l for l in self._letters.values() if l.user_id == user_id])
                for user_id in set(letter.user_id for letter in self._letters.values() if letter.user_id)
            }
        }