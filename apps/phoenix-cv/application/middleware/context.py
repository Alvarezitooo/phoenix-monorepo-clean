"""
🔗 Context Manager pour corrélation bout-en-bout
Propagation X-Request-ID à travers l'application
"""

from __future__ import annotations
from typing import Optional
from contextvars import ContextVar
import uuid

# ContextVar pour stocker l'ID de corrélation
REQUEST_ID: ContextVar[Optional[str]] = ContextVar("REQUEST_ID", default=None)
USER_ID: ContextVar[Optional[str]] = ContextVar("USER_ID", default=None)
ACTION_TYPE: ContextVar[Optional[str]] = ContextVar("ACTION_TYPE", default=None)

class CorrelationContext:
    """
    🔗 Gestionnaire de contexte pour la corrélation bout-en-bout
    """
    
    @classmethod
    def get_request_id(cls) -> str:
        """Récupère le Request ID courant ou en génère un nouveau"""
        current_id = REQUEST_ID.get()
        if current_id is None:
            current_id = str(uuid.uuid4())
            REQUEST_ID.set(current_id)
        return current_id
    
    @classmethod
    def set_request_id(cls, request_id: str) -> None:
        """Définit le Request ID pour le contexte courant"""
        REQUEST_ID.set(request_id)
    
    @classmethod
    def get_user_id(cls) -> Optional[str]:
        """Récupère l'User ID courant"""
        return USER_ID.get()
    
    @classmethod
    def set_user_id(cls, user_id: str) -> None:
        """Définit l'User ID pour le contexte courant"""
        USER_ID.set(user_id)
    
    @classmethod
    def get_action_type(cls) -> Optional[str]:
        """Récupère l'Action Type courante"""
        return ACTION_TYPE.get()
    
    @classmethod
    def set_action_type(cls, action_type: str) -> None:
        """Définit l'Action Type pour le contexte courant"""
        ACTION_TYPE.set(action_type)
    
    @classmethod
    def get_context_dict(cls) -> dict:
        """Récupère tous les éléments de contexte sous forme de dictionnaire"""
        return {
            "request_id": cls.get_request_id(),
            "user_id": cls.get_user_id(),
            "action_type": cls.get_action_type()
        }
    
    @classmethod
    def clear_context(cls) -> None:
        """Efface tout le contexte"""
        REQUEST_ID.set(None)
        USER_ID.set(None)
        ACTION_TYPE.set(None)