"""
Repository Interface - User Domain
Clean Architecture - Contrats pour la persistance des utilisateurs
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

from domain.entities.user import User, UserTier, UserStatus
from domain.repositories.letter_repository import RepositoryError


class IUserRepository(ABC):
    """
    Interface Repository pour les utilisateurs
    Pattern Repository - Contrat d'accès aux données utilisateur
    """
    
    @abstractmethod
    async def save(self, user: User) -> User:
        """
        Sauvegarde un utilisateur (create ou update)
        
        Args:
            user: L'entité User à sauvegarder
            
        Returns:
            User: L'entité sauvegardée avec métadonnées mises à jour
            
        Raises:
            RepositoryError: En cas d'erreur de persistance
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """
        Récupère un utilisateur par son ID
        
        Args:
            user_id: Identifiant unique de l'utilisateur
            
        Returns:
            Optional[User]: L'utilisateur trouvé ou None
        """
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Récupère un utilisateur par email
        
        Args:
            email: Adresse email de l'utilisateur
            
        Returns:
            Optional[User]: L'utilisateur trouvé ou None
        """
        pass
    
    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        """
        Vérifie si un email existe déjà
        
        Args:
            email: Adresse email à vérifier
            
        Returns:
            bool: True si l'email existe, False sinon
        """
        pass
    
    @abstractmethod
    async def get_by_stripe_customer_id(self, stripe_customer_id: str) -> Optional[User]:
        """
        Récupère un utilisateur par son ID client Stripe
        
        Args:
            stripe_customer_id: ID client Stripe
            
        Returns:
            Optional[User]: L'utilisateur trouvé ou None
        """
        pass
    
    @abstractmethod
    async def get_users_by_tier(self, tier: UserTier) -> List[User]:
        """
        Récupère tous les utilisateurs d'un tier donné
        
        Args:
            tier: Niveau d'abonnement
            
        Returns:
            List[User]: Liste des utilisateurs de ce tier
        """
        pass
    
    @abstractmethod
    async def get_users_by_status(self, status: UserStatus) -> List[User]:
        """
        Récupère tous les utilisateurs par statut
        
        Args:
            status: Statut utilisateur
            
        Returns:
            List[User]: Liste des utilisateurs avec ce statut
        """
        pass
    
    @abstractmethod
    async def delete(self, user_id: str) -> bool:
        """
        Supprime un utilisateur (soft delete)
        
        Args:
            user_id: ID de l'utilisateur à supprimer
            
        Returns:
            bool: True si supprimé, False sinon
        """
        pass
    
    @abstractmethod
    async def get_expiring_subscriptions(self, days_ahead: int = 7) -> List[User]:
        """
        Récupère les utilisateurs dont l'abonnement expire bientôt
        
        Args:
            days_ahead: Nombre de jours d'avance pour la notification
            
        Returns:
            List[User]: Utilisateurs avec abonnement expirant
        """
        pass
    
    @abstractmethod
    async def get_inactive_users(self, days_inactive: int = 30) -> List[User]:
        """
        Récupère les utilisateurs inactifs
        
        Args:
            days_inactive: Nombre de jours d'inactivité
            
        Returns:
            List[User]: Utilisateurs inactifs
        """
        pass
    
    @abstractmethod
    async def reset_monthly_usage_stats(self) -> int:
        """
        Remet à zéro les statistiques mensuelles de tous les utilisateurs
        
        Returns:
            int: Nombre d'utilisateurs mis à jour
        """
        pass
    
    @abstractmethod
    async def get_user_statistics(self) -> Dict[str, Any]:
        """
        Récupère les statistiques globales des utilisateurs
        
        Returns:
            Dict: Statistiques (total, par tier, actifs, etc.)
        """
        pass
    
    @abstractmethod
    async def search_users(self, query: str, limit: int = 50) -> List[User]:
        """
        Recherche d'utilisateurs par nom/email
        
        Args:
            query: Terme de recherche
            limit: Nombre maximum de résultats
            
        Returns:
            List[User]: Utilisateurs correspondants
        """
        pass
    
    @abstractmethod
    async def update_subscription_status(
        self, 
        user_id: str, 
        tier: UserTier,
        expires_at: Optional[datetime] = None,
        stripe_subscription_id: Optional[str] = None
    ) -> bool:
        """
        Met à jour le statut d'abonnement d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            tier: Nouveau tier
            expires_at: Date d'expiration (si applicable)
            stripe_subscription_id: ID abonnement Stripe
            
        Returns:
            bool: True si mis à jour, False sinon
        """
        pass
    
    @abstractmethod
    async def record_login(self, user_id: str) -> bool:
        """
        Enregistre une connexion réussie
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            bool: True si enregistré, False sinon
        """
        pass
    
    @abstractmethod
    async def record_failed_login(self, email: str) -> Optional[User]:
        """
        Enregistre une tentative de connexion échouée
        
        Args:
            email: Email de l'utilisateur
            
        Returns:
            Optional[User]: Utilisateur mis à jour ou None
        """
        pass
    
    @abstractmethod
    async def unlock_account(self, user_id: str) -> bool:
        """
        Déverrouille un compte utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            bool: True si déverrouillé, False sinon
        """
        pass
    
    @abstractmethod
    async def verify_email(self, user_id: str) -> bool:
        """
        Marque l'email comme vérifié
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            bool: True si vérifié, False sinon
        """
        pass
    
    @abstractmethod
    async def update_usage_stats(
        self,
        user_id: str,
        letters_generated: Optional[int] = None,
        letters_downloaded: Optional[int] = None,
        ai_requests: Optional[int] = None
    ) -> bool:
        """
        Met à jour les statistiques d'usage
        
        Args:
            user_id: ID de l'utilisateur
            letters_generated: Incrément lettres générées
            letters_downloaded: Incrément téléchargements
            ai_requests: Incrément requêtes IA
            
        Returns:
            bool: True si mis à jour, False sinon
        """
        pass
    
    @abstractmethod
    async def get_users_with_high_usage(self, threshold: int = 50) -> List[User]:
        """
        Récupère les utilisateurs avec usage élevé ce mois
        
        Args:
            threshold: Seuil de lettres générées
            
        Returns:
            List[User]: Utilisateurs grands consommateurs
        """
        pass
    
    @abstractmethod
    async def cleanup_unverified_users(self, days_old: int = 7) -> int:
        """
        Nettoie les comptes non vérifiés anciens
        
        Args:
            days_old: Âge minimum en jours
            
        Returns:
            int: Nombre d'utilisateurs supprimés
        """
        pass