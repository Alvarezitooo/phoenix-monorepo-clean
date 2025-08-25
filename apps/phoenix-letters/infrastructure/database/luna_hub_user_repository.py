"""
Luna Hub User Repository - Phoenix Letters
Authentification et vérification Premium via Luna Hub
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import httpx
from functools import wraps

from domain.entities.user import User, UserTier, UserStatus, SubscriptionInfo, UsageStats
from domain.repositories.user_repository import IUserRepository, RepositoryError
from infrastructure.clients.luna_client import LunaClient

logger = logging.getLogger(__name__)

class LunaHubUserRepository(IUserRepository):
    """
    Repository réel pour utilisateurs via Luna Hub
    Remplace le MockUserRepository avec vraies données
    """
    
    def __init__(self, luna_client: LunaClient, luna_hub_url: str):
        self.luna_client = luna_client
        self.luna_hub_url = luna_hub_url
        self._cache: Dict[str, User] = {}  # Cache temporaire des utilisateurs
        logger.info("🌙 LunaHubUserRepository initialisé avec Luna Hub")
    
    def _cache_key(func):
        """Décorateur pour cache utilisateur"""
        @wraps(func)
        async def wrapper(self, *args, **kwargs):
            # Simple cache basé sur user_id pour éviter trop d'appels API
            result = await func(self, *args, **kwargs)
            if isinstance(result, User) and hasattr(result, 'id'):
                self._cache[result.id] = result
            return result
        return wrapper
    
    async def _get_user_from_luna_hub(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Récupère les données utilisateur depuis Luna Hub"""
        try:
            url = f"{self.luna_hub_url}/auth/users/{user_id}"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {self.luna_client._token_provider()}"}
                )
                
                if response.status_code == 404:
                    return None
                    
                if response.status_code != 200:
                    logger.error(f"Luna Hub error: {response.status_code} {response.text}")
                    return None
                
                return response.json()
                
        except Exception as e:
            logger.error(f"Erreur récupération utilisateur Luna Hub: {e}")
            return None
    
    def _map_luna_user_to_domain(self, luna_user: Dict[str, Any]) -> User:
        """Convertit utilisateur Luna Hub vers entité Domain"""
        
        # Détermination du tier basé sur is_unlimited
        tier = UserTier.PREMIUM if luna_user.get("is_unlimited", False) else UserTier.FREE
        
        # Création de l'entité User
        user = User(
            id=luna_user["id"],
            email=luna_user["email"],
            first_name=luna_user.get("name", "").split(" ")[0] if luna_user.get("name") else "",
            last_name=" ".join(luna_user.get("name", "").split(" ")[1:]) if luna_user.get("name") and len(luna_user.get("name", "").split(" ")) > 1 else "",
            status=UserStatus.ACTIVE,  # Tous les utilisateurs Luna Hub sont actifs
            email_verified=True,  # Tous les utilisateurs Luna Hub sont vérifiés
            created_at=datetime.fromisoformat(luna_user.get("created_at", datetime.now().isoformat())),
        )
        
        # Configuration de l'abonnement
        if tier == UserTier.PREMIUM:
            user.subscription = SubscriptionInfo(
                tier=UserTier.PREMIUM,
                started_at=datetime.now(),  # TODO: récupérer vraie date depuis Luna Hub
                expires_at=None,  # Luna Unlimited n'expire pas
                auto_renew=True,
                stripe_customer_id=None,  # Géré par Luna Hub
                stripe_subscription_id=None
            )
        else:
            user.subscription = SubscriptionInfo(
                tier=UserTier.FREE,
                started_at=user.created_at,
                expires_at=None,
                auto_renew=False
            )
        
        # Stats d'usage - pour l'instant on utilise des valeurs par défaut
        # TODO: récupérer vraies stats depuis Luna Hub
        user.usage_stats = UsageStats(
            letters_generated_this_month=0,
            letters_downloaded_this_month=0,
            ai_requests_this_month=0,
            last_activity=datetime.now()
        )
        
        logger.info(f"👤 Utilisateur Luna Hub mappé: {user.email} ({tier.value})")
        return user
    
    @_cache_key
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Récupère un utilisateur par ID depuis Luna Hub"""
        
        # Vérifier le cache d'abord
        if user_id in self._cache:
            logger.debug(f"Utilisateur trouvé en cache: {user_id}")
            return self._cache[user_id]
        
        try:
            luna_user = await self._get_user_from_luna_hub(user_id)
            if not luna_user:
                logger.warning(f"Utilisateur non trouvé dans Luna Hub: {user_id}")
                return None
            
            user = self._map_luna_user_to_domain(luna_user)
            return user
            
        except Exception as e:
            logger.error(f"Erreur récupération utilisateur {user_id}: {e}")
            raise RepositoryError(f"Erreur récupération: {e}", e)
    
    async def save(self, user: User) -> User:
        """Sauvegarde un utilisateur - met à jour le cache"""
        try:
            # Pour l'instant, on met juste à jour le cache local
            # Les vraies données sont dans Luna Hub
            user.updated_at = datetime.now()
            self._cache[user.id] = user
            
            logger.info(f"💾 Utilisateur mis à jour en cache: {user.email}")
            return user
            
        except Exception as e:
            logger.error(f"Erreur sauvegarde utilisateur: {e}")
            raise RepositoryError(f"Erreur sauvegarde: {e}", e)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Récupère un utilisateur par email - pas supporté directement par Luna Hub"""
        logger.warning("get_by_email pas supporté par Luna Hub - utiliser get_by_id")
        return None
    
    # Méthodes non implémentées - spécifiques aux mocks
    async def exists_by_email(self, email: str) -> bool:
        return False
    
    async def get_by_stripe_customer_id(self, stripe_customer_id: str) -> Optional[User]:
        return None
    
    async def get_users_by_tier(self, tier: UserTier) -> List[User]:
        return []
    
    async def get_users_by_status(self, status: UserStatus) -> List[User]:
        return []
    
    async def delete(self, user_id: str) -> bool:
        if user_id in self._cache:
            del self._cache[user_id]
        return True
    
    async def get_expiring_subscriptions(self, days_ahead: int = 7) -> List[User]:
        return []
    
    async def get_inactive_users(self, days_inactive: int = 30) -> List[User]:
        return []
    
    async def reset_monthly_usage_stats(self) -> int:
        return 0
    
    async def get_user_statistics(self) -> Dict[str, Any]:
        return {"total_users": len(self._cache), "source": "luna_hub"}
    
    async def search_users(self, query: str, limit: int = 50) -> List[User]:
        return []
    
    async def update_subscription_status(self, user_id: str, tier: UserTier, expires_at=None, stripe_subscription_id=None) -> bool:
        return False
    
    async def record_login(self, user_id: str) -> bool:
        user = await self.get_by_id(user_id)
        if user:
            user.record_login()
            await self.save(user)
            return True
        return False
    
    async def record_failed_login(self, email: str) -> Optional[User]:
        return None
    
    async def unlock_account(self, user_id: str) -> bool:
        return False
    
    async def verify_email(self, user_id: str) -> bool:
        return True  # Tous les utilisateurs Luna Hub sont vérifiés
    
    async def update_usage_stats(self, user_id: str, letters_generated=None, letters_downloaded=None, ai_requests=None) -> bool:
        user = await self.get_by_id(user_id)
        if user:
            if letters_generated:
                for _ in range(letters_generated):
                    user.record_letter_generation()
            if letters_downloaded:
                for _ in range(letters_downloaded):
                    user.record_letter_download()
            await self.save(user)
            return True
        return False
    
    async def get_users_with_high_usage(self, threshold: int = 50) -> List[User]:
        return []
    
    async def cleanup_unverified_users(self, days_old: int = 7) -> int:
        return 0