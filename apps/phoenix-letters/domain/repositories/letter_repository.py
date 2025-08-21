"""
Repository Interface - Letter Domain
Clean Architecture - Contrats pour la persistance (pas d'implémentation)
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

from domain.entities.letter import Letter, LetterStatus
from domain.entities.user import User


class ILetterRepository(ABC):
    """
    Interface Repository pour les lettres
    Pattern Repository - Contrat d'accès aux données
    """
    
    @abstractmethod
    async def save(self, letter: Letter) -> Letter:
        """
        Sauvegarde une lettre (create ou update)
        
        Args:
            letter: L'entité Letter à sauvegarder
            
        Returns:
            Letter: L'entité sauvegardée avec les métadonnées mises à jour
            
        Raises:
            RepositoryError: En cas d'erreur de persistance
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, letter_id: str) -> Optional[Letter]:
        """
        Récupère une lettre par son ID
        
        Args:
            letter_id: Identifiant unique de la lettre
            
        Returns:
            Optional[Letter]: La lettre trouvée ou None
        """
        pass
    
    @abstractmethod
    async def get_by_user_id(self, user_id: str, limit: Optional[int] = None) -> List[Letter]:
        """
        Récupère les lettres d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            limit: Nombre maximum de lettres à retourner
            
        Returns:
            List[Letter]: Liste des lettres de l'utilisateur
        """
        pass
    
    @abstractmethod
    async def get_by_status(self, status: LetterStatus, user_id: Optional[str] = None) -> List[Letter]:
        """
        Récupère les lettres par statut
        
        Args:
            status: Statut des lettres recherchées
            user_id: Filtrer par utilisateur (optionnel)
            
        Returns:
            List[Letter]: Liste des lettres correspondantes
        """
        pass
    
    @abstractmethod
    async def delete(self, letter_id: str, user_id: str) -> bool:
        """
        Supprime une lettre (avec vérification propriétaire)
        
        Args:
            letter_id: ID de la lettre à supprimer
            user_id: ID du propriétaire
            
        Returns:
            bool: True si supprimée, False sinon
        """
        pass
    
    @abstractmethod
    async def search_by_company(self, company_name: str, user_id: str) -> List[Letter]:
        """
        Recherche les lettres par nom d'entreprise
        
        Args:
            company_name: Nom de l'entreprise à rechercher
            user_id: ID de l'utilisateur
            
        Returns:
            List[Letter]: Lettres pour cette entreprise
        """
        pass
    
    @abstractmethod
    async def get_recent_letters(self, user_id: str, days: int = 30, limit: int = 10) -> List[Letter]:
        """
        Récupère les lettres récentes d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            days: Nombre de jours à regarder en arrière
            limit: Nombre maximum de lettres
            
        Returns:
            List[Letter]: Lettres récentes triées par date
        """
        pass
    
    @abstractmethod
    async def get_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Récupère les statistiques de lettres pour un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Dict: Statistiques (nombre total, par statut, etc.)
        """
        pass
    
    @abstractmethod
    async def cleanup_old_drafts(self, days_old: int = 30) -> int:
        """
        Nettoie les brouillons anciens
        
        Args:
            days_old: Âge minimum en jours pour la suppression
            
        Returns:
            int: Nombre de brouillons supprimés
        """
        pass
    
    @abstractmethod
    async def exists(self, letter_id: str, user_id: str) -> bool:
        """
        Vérifie si une lettre existe pour un utilisateur
        
        Args:
            letter_id: ID de la lettre
            user_id: ID de l'utilisateur propriétaire
            
        Returns:
            bool: True si existe, False sinon
        """
        pass
    
    @abstractmethod
    async def count_by_user(self, user_id: str, status: Optional[LetterStatus] = None) -> int:
        """
        Compte les lettres d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            status: Filtrer par statut (optionnel)
            
        Returns:
            int: Nombre de lettres
        """
        pass
    
    @abstractmethod
    async def get_monthly_count(self, user_id: str, year: int, month: int) -> int:
        """
        Compte les lettres générées dans un mois donné
        
        Args:
            user_id: ID de l'utilisateur
            year: Année
            month: Mois (1-12)
            
        Returns:
            int: Nombre de lettres générées ce mois
        """
        pass


class RepositoryError(Exception):
    """Exception pour les erreurs de repository"""
    
    def __init__(self, message: str, original_error: Optional[Exception] = None):
        self.message = message
        self.original_error = original_error
        super().__init__(self.message)
    
    def __str__(self) -> str:
        if self.original_error:
            return f"{self.message} (Cause: {self.original_error})"
        return self.message