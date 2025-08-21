"""
Mock Repository - User
Clean Architecture - Implémentation en mémoire pour tests/demo
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import logging

from domain.entities.user import User, UserTier, UserStatus, SubscriptionInfo, UsageStats, UserPreferences
from domain.repositories.user_repository import IUserRepository, RepositoryError

logger = logging.getLogger(__name__)


class MockUserRepository(IUserRepository):
    """
    Repository Mock pour les utilisateurs
    Stockage en mémoire avec données de démo
    """
    
    def __init__(self):
        self._users: Dict[str, User] = {}
        self._initialize_demo_users()
        logger.info("👥 MockUserRepository initialisé avec utilisateurs de démo")
    
    def _initialize_demo_users(self):
        """Initialise des utilisateurs de démo pour les tests"""
        
        # Utilisateur démo principal
        demo_user = User(
            id="demo-user",
            email="demo@phoenix-letters.com",
            first_name="Demo",
            last_name="Phoenix",
            status=UserStatus.ACTIVE,
            email_verified=True,
            created_at=datetime.now() - timedelta(days=30),
        )
        
        # Configuration Premium pour la démo
        demo_user.subscription = SubscriptionInfo(
            tier=UserTier.PREMIUM,
            started_at=datetime.now() - timedelta(days=15),
            expires_at=datetime.now() + timedelta(days=350),
            auto_renew=True
        )
        
        # Stats d'usage réalistes
        demo_user.usage_stats = UsageStats(
            letters_generated_this_month=8,
            letters_downloaded_this_month=5,
            ai_requests_this_month=12,
            last_activity=datetime.now() - timedelta(hours=2)
        )
        
        self._users[demo_user.id] = demo_user
        
        # Utilisateur Free pour tester les quotas
        free_user = User(
            id="free-user",
            email="free@phoenix-letters.com",
            first_name="Free",
            last_name="User",
            status=UserStatus.ACTIVE,
            email_verified=True,
            created_at=datetime.now() - timedelta(days=7),
        )
        
        # Quota presque épuisé
        free_user.usage_stats = UsageStats(
            letters_generated_this_month=2,  # Sur 3 autorisées
            letters_downloaded_this_month=2,
            last_activity=datetime.now() - timedelta(hours=6)
        )
        
        self._users[free_user.id] = free_user
        
        logger.info(f"🎭 {len(self._users)} utilisateurs de démo initialisés")
    
    async def save(self, user: User) -> User:
        """Sauvegarde un utilisateur"""
        try:
            user.updated_at = datetime.now()
            self._users[user.id] = user
            logger.info(f"💾 Utilisateur sauvegardé: {user.email}")
            return user
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde utilisateur: {e}")
            raise RepositoryError(f"Erreur sauvegarde: {e}", e)
    
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Récupère un utilisateur par ID"""
        try:
            user = self._users.get(user_id)
            if user:
                logger.info(f"👤 Utilisateur récupéré: {user.email}")
            return user
        except Exception as e:
            logger.error(f"❌ Erreur récupération utilisateur {user_id}: {e}")
            return None
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Récupère un utilisateur par email"""
        try:
            for user in self._users.values():
                if user.email.lower() == email.lower():
                    logger.info(f"📧 Utilisateur trouvé par email: {email}")
                    return user
            return None
        except Exception as e:
            logger.error(f"❌ Erreur recherche par email: {e}")
            return None
    
    async def exists_by_email(self, email: str) -> bool:
        """Vérifie si un email existe déjà"""
        try:
            user = await self.get_by_email(email)
            return user is not None
        except Exception as e:
            logger.error(f"❌ Erreur vérification email: {e}")
            return False
    
    async def get_by_stripe_customer_id(self, stripe_customer_id: str) -> Optional[User]:
        """Récupère un utilisateur par ID client Stripe"""
        try:
            for user in self._users.values():
                if user.subscription.stripe_customer_id == stripe_customer_id:
                    logger.info(f"💳 Utilisateur trouvé par Stripe ID: {stripe_customer_id}")
                    return user
            return None
        except Exception as e:
            logger.error(f"❌ Erreur recherche Stripe: {e}")
            return None
    
    async def get_users_by_tier(self, tier: UserTier) -> List[User]:
        """Récupère tous les utilisateurs d'un tier donné"""
        try:
            tier_users = [
                user for user in self._users.values()
                if user.subscription.tier == tier
            ]
            logger.info(f"🎯 {len(tier_users)} utilisateurs {tier.value} trouvés")
            return tier_users
        except Exception as e:
            logger.error(f"❌ Erreur récupération par tier: {e}")
            return []
    
    async def get_users_by_status(self, status: UserStatus) -> List[User]:
        """Récupère tous les utilisateurs par statut"""
        try:
            status_users = [
                user for user in self._users.values()
                if user.status == status
            ]
            logger.info(f"📊 {len(status_users)} utilisateurs {status.value} trouvés")
            return status_users
        except Exception as e:
            logger.error(f"❌ Erreur récupération par statut: {e}")
            return []
    
    async def delete(self, user_id: str) -> bool:
        """Supprime un utilisateur (soft delete)"""
        try:
            if user_id in self._users:
                # Soft delete - marquer comme supprimé au lieu de supprimer
                user = self._users[user_id]
                user.status = UserStatus.BANNED
                user.updated_at = datetime.now()
                logger.info(f"🗑️ Utilisateur soft-deleted: {user.email}")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Erreur suppression utilisateur: {e}")
            return False
    
    async def get_expiring_subscriptions(self, days_ahead: int = 7) -> List[User]:
        """Récupère les utilisateurs dont l'abonnement expire bientôt"""
        try:
            cutoff_date = datetime.now() + timedelta(days=days_ahead)
            
            expiring_users = []
            for user in self._users.values():
                if (user.subscription.tier != UserTier.FREE and 
                    user.subscription.expires_at and
                    user.subscription.expires_at <= cutoff_date):
                    expiring_users.append(user)
            
            logger.info(f"⏰ {len(expiring_users)} abonnements expirent dans {days_ahead} jours")
            return expiring_users
        except Exception as e:
            logger.error(f"❌ Erreur abonnements expirants: {e}")
            return []
    
    async def get_inactive_users(self, days_inactive: int = 30) -> List[User]:
        """Récupère les utilisateurs inactifs"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_inactive)
            
            inactive_users = []
            for user in self._users.values():
                if (user.usage_stats.last_activity and 
                    user.usage_stats.last_activity < cutoff_date):
                    inactive_users.append(user)
            
            logger.info(f"💤 {len(inactive_users)} utilisateurs inactifs ({days_inactive} jours)")
            return inactive_users
        except Exception as e:
            logger.error(f"❌ Erreur utilisateurs inactifs: {e}")
            return []
    
    async def reset_monthly_usage_stats(self) -> int:
        """Remet à zéro les statistiques mensuelles de tous les utilisateurs"""
        try:
            count = 0
            for user in self._users.values():
                user.reset_monthly_usage()
                count += 1
            
            logger.info(f"🔄 Stats mensuelles remises à zéro pour {count} utilisateurs")
            return count
        except Exception as e:
            logger.error(f"❌ Erreur reset stats mensuelles: {e}")
            return 0
    
    async def get_user_statistics(self) -> Dict[str, Any]:
        """Récupère les statistiques globales des utilisateurs"""
        try:
            total_users = len(self._users)
            active_users = len([u for u in self._users.values() if u.status == UserStatus.ACTIVE])
            premium_users = len([u for u in self._users.values() if u.is_premium])
            
            # Calculs d'activité
            now = datetime.now()
            active_last_7_days = len([
                u for u in self._users.values() 
                if u.usage_stats.last_activity and 
                (now - u.usage_stats.last_activity).days <= 7
            ])
            
            # Calculs d'usage ce mois
            total_letters_this_month = sum(
                u.usage_stats.letters_generated_this_month for u in self._users.values()
            )
            
            stats = {
                "total_users": total_users,
                "active_users": active_users,
                "premium_users": premium_users,
                "free_users": total_users - premium_users,
                "activity": {
                    "active_last_7_days": active_last_7_days,
                    "activity_rate": active_last_7_days / max(total_users, 1),
                },
                "usage_this_month": {
                    "total_letters_generated": total_letters_this_month,
                    "avg_letters_per_user": total_letters_this_month / max(total_users, 1),
                },
                "conversion": {
                    "premium_rate": premium_users / max(total_users, 1),
                }
            }
            
            logger.info(f"📊 Statistiques globales calculées: {total_users} utilisateurs")
            return stats
            
        except Exception as e:
            logger.error(f"❌ Erreur calcul statistiques globales: {e}")
            return {"error": str(e)}
    
    async def search_users(self, query: str, limit: int = 50) -> List[User]:
        """Recherche d'utilisateurs par nom/email"""
        try:
            query_lower = query.lower()
            matching_users = []
            
            for user in self._users.values():
                if (query_lower in user.email.lower() or
                    (user.first_name and query_lower in user.first_name.lower()) or
                    (user.last_name and query_lower in user.last_name.lower())):
                    matching_users.append(user)
                
                if len(matching_users) >= limit:
                    break
            
            logger.info(f"🔍 {len(matching_users)} utilisateurs trouvés pour '{query}'")
            return matching_users
            
        except Exception as e:
            logger.error(f"❌ Erreur recherche utilisateurs: {e}")
            return []
    
    async def update_subscription_status(
        self, 
        user_id: str, 
        tier: UserTier,
        expires_at: Optional[datetime] = None,
        stripe_subscription_id: Optional[str] = None
    ) -> bool:
        """Met à jour le statut d'abonnement d'un utilisateur"""
        try:
            user = self._users.get(user_id)
            if not user:
                return False
            
            if tier == UserTier.PREMIUM:
                user.upgrade_to_premium("stripe_cust_demo", stripe_subscription_id or "sub_demo", expires_at or datetime.now() + timedelta(days=30))
            else:
                user.downgrade_to_free()
            
            await self.save(user)
            logger.info(f"💎 Abonnement mis à jour: {user.email} -> {tier.value}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur mise à jour abonnement: {e}")
            return False
    
    async def record_login(self, user_id: str) -> bool:
        """Enregistre une connexion réussie"""
        try:
            user = self._users.get(user_id)
            if not user:
                return False
            
            user.record_login()
            await self.save(user)
            logger.info(f"🔑 Connexion enregistrée: {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur enregistrement connexion: {e}")
            return False
    
    async def record_failed_login(self, email: str) -> Optional[User]:
        """Enregistre une tentative de connexion échouée"""
        try:
            user = await self.get_by_email(email)
            if not user:
                return None
            
            user.record_failed_login()
            await self.save(user)
            logger.warning(f"⚠️ Tentative connexion échouée: {email} ({user.failed_login_attempts} tentatives)")
            return user
            
        except Exception as e:
            logger.error(f"❌ Erreur enregistrement échec connexion: {e}")
            return None
    
    async def unlock_account(self, user_id: str) -> bool:
        """Déverrouille un compte utilisateur"""
        try:
            user = self._users.get(user_id)
            if not user:
                return False
            
            user.failed_login_attempts = 0
            user.locked_until = None
            user.updated_at = datetime.now()
            await self.save(user)
            logger.info(f"🔓 Compte déverrouillé: {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur déverrouillage compte: {e}")
            return False
    
    async def verify_email(self, user_id: str) -> bool:
        """Marque l'email comme vérifié"""
        try:
            user = self._users.get(user_id)
            if not user:
                return False
            
            user.email_verified = True
            user.updated_at = datetime.now()
            await self.save(user)
            logger.info(f"✅ Email vérifié: {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur vérification email: {e}")
            return False
    
    async def update_usage_stats(
        self,
        user_id: str,
        letters_generated: Optional[int] = None,
        letters_downloaded: Optional[int] = None,
        ai_requests: Optional[int] = None
    ) -> bool:
        """Met à jour les statistiques d'usage"""
        try:
            user = self._users.get(user_id)
            if not user:
                return False
            
            if letters_generated:
                for _ in range(letters_generated):
                    user.record_letter_generation()
            
            if letters_downloaded:
                for _ in range(letters_downloaded):
                    user.record_letter_download()
            
            if ai_requests:
                for _ in range(ai_requests):
                    user.usage_stats.increment_ai_requests()
            
            await self.save(user)
            logger.info(f"📊 Stats usage mises à jour: {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur mise à jour stats usage: {e}")
            return False
    
    async def get_users_with_high_usage(self, threshold: int = 50) -> List[User]:
        """Récupère les utilisateurs avec usage élevé ce mois"""
        try:
            high_usage_users = [
                user for user in self._users.values()
                if user.usage_stats.letters_generated_this_month >= threshold
            ]
            
            logger.info(f"🔥 {len(high_usage_users)} utilisateurs avec usage élevé (>{threshold})")
            return high_usage_users
            
        except Exception as e:
            logger.error(f"❌ Erreur utilisateurs usage élevé: {e}")
            return []
    
    async def cleanup_unverified_users(self, days_old: int = 7) -> int:
        """Nettoie les comptes non vérifiés anciens"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            unverified_old = []
            for user_id, user in self._users.items():
                if (not user.email_verified and 
                    user.created_at < cutoff_date):
                    unverified_old.append(user_id)
            
            for user_id in unverified_old:
                del self._users[user_id]
            
            logger.info(f"🧹 {len(unverified_old)} comptes non vérifiés supprimés")
            return len(unverified_old)
            
        except Exception as e:
            logger.error(f"❌ Erreur nettoyage comptes non vérifiés: {e}")
            return 0
    
    # Méthodes utilitaires pour les tests/demo
    
    def get_demo_users(self) -> Dict[str, User]:
        """Retourne les utilisateurs de démo"""
        return {
            user_id: user for user_id, user in self._users.items()
            if user_id in ["demo-user", "free-user"]
        }
    
    def add_demo_premium_user(self, email: str = "premium@demo.com") -> str:
        """Ajoute un utilisateur Premium de démo"""
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=email,
            first_name="Premium",
            last_name="Demo",
            status=UserStatus.ACTIVE,
            email_verified=True
        )
        
        user.upgrade_to_premium(
            "stripe_cust_premium", 
            "sub_premium", 
            datetime.now() + timedelta(days=365)
        )
        
        self._users[user_id] = user
        logger.info(f"💎 Utilisateur Premium démo ajouté: {email}")
        return user_id
    
    def get_storage_info(self) -> Dict[str, Any]:
        """Informations sur le stockage en mémoire"""
        return {
            "total_users": len(self._users),
            "storage_type": "in_memory",
            "users_by_tier": {
                tier.value: len([u for u in self._users.values() if u.subscription.tier == tier])
                for tier in UserTier
            },
            "users_by_status": {
                status.value: len([u for u in self._users.values() if u.status == status])
                for status in UserStatus
            }
        }