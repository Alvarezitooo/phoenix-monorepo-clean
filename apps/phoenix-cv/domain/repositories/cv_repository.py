"""
🔥 Phoenix CV - CV Repository Interface
Interface pour l'accès aux données CV - Clean Architecture
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..entities.cv_document import CVDocument
from ..entities.ats_optimization import ATSOptimization
from ..entities.mirror_match import MirrorMatchAnalysis


class CVRepositoryInterface(ABC):
    """
    Interface pour l'accès aux données CV
    Définit le contrat pour tous les repositories CV
    """
    
    @abstractmethod
    async def create_cv(self, cv: CVDocument) -> str:
        """
        Crée un nouveau CV
        
        Args:
            cv: Document CV à créer
            
        Returns:
            str: ID du CV créé
        """
        pass
    
    @abstractmethod
    async def get_cv_by_id(self, cv_id: str) -> Optional[CVDocument]:
        """
        Récupère un CV par son ID
        
        Args:
            cv_id: Identifiant du CV
            
        Returns:
            Optional[CVDocument]: CV trouvé ou None
        """
        pass
    
    @abstractmethod
    async def get_user_cvs(self, user_id: str, limit: int = 10, offset: int = 0) -> List[CVDocument]:
        """
        Récupère tous les CV d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            limit: Nombre maximum de CV à retourner
            offset: Décalage pour la pagination
            
        Returns:
            List[CVDocument]: Liste des CV de l'utilisateur
        """
        pass
    
    @abstractmethod
    async def update_cv(self, cv: CVDocument) -> bool:
        """
        Met à jour un CV existant
        
        Args:
            cv: CV avec les modifications
            
        Returns:
            bool: True si la mise à jour a réussi
        """
        pass
    
    @abstractmethod
    async def delete_cv(self, cv_id: str) -> bool:
        """
        Supprime un CV
        
        Args:
            cv_id: ID du CV à supprimer
            
        Returns:
            bool: True si la suppression a réussi
        """
        pass
    
    @abstractmethod
    async def save_ats_optimization(self, optimization: ATSOptimization) -> str:
        """
        Sauvegarde une analyse ATS
        
        Args:
            optimization: Résultat d'optimisation ATS
            
        Returns:
            str: ID de l'optimisation sauvegardée
        """
        pass
    
    @abstractmethod
    async def get_ats_optimization(self, cv_id: str) -> Optional[ATSOptimization]:
        """
        Récupère la dernière optimisation ATS pour un CV
        
        Args:
            cv_id: ID du CV
            
        Returns:
            Optional[ATSOptimization]: Optimisation trouvée ou None
        """
        pass
    
    @abstractmethod
    async def save_mirror_match(self, analysis: MirrorMatchAnalysis) -> str:
        """
        Sauvegarde une analyse Mirror Match
        
        Args:
            analysis: Résultat d'analyse Mirror Match
            
        Returns:
            str: ID de l'analyse sauvegardée
        """
        pass
    
    @abstractmethod
    async def get_mirror_matches(self, cv_id: str, limit: int = 5) -> List[MirrorMatchAnalysis]:
        """
        Récupère les analyses Mirror Match pour un CV
        
        Args:
            cv_id: ID du CV
            limit: Nombre maximum d'analyses à retourner
            
        Returns:
            List[MirrorMatchAnalysis]: Liste des analyses
        """
        pass
    
    @abstractmethod
    async def search_cvs(self, 
                        user_id: str, 
                        filters: Dict[str, Any],
                        sort_by: str = "updated_at",
                        sort_order: str = "desc") -> List[CVDocument]:
        """
        Recherche de CV avec filtres
        
        Args:
            user_id: ID de l'utilisateur
            filters: Filtres de recherche
            sort_by: Champ de tri
            sort_order: Ordre de tri (asc/desc)
            
        Returns:
            List[CVDocument]: CV correspondant aux critères
        """
        pass
    
    @abstractmethod
    async def get_cv_analytics(self, cv_id: str) -> Dict[str, Any]:
        """
        Récupère les analytics d'un CV
        
        Args:
            cv_id: ID du CV
            
        Returns:
            Dict[str, Any]: Métriques et statistiques du CV
        """
        pass