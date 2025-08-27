"""
🗄️ Supabase Client - Phoenix Luna Hub
Event Store pour Capital Narratif selon Directive Oracle #4
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from supabase import create_client, Client
from app.core.security_guardian import SecurityGuardian
from app.core.connection_manager import connection_manager
import structlog
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration du logger structuré
logger = structlog.get_logger()


class SupabaseEventStore:
    """
    🗄️ Event Store Supabase pour Phoenix Luna
    Directive Oracle #4: "Tout est un Événement"
    """
    
    def __init__(self):
        self.client: Optional[Client] = None
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialise le client Supabase de manière sécurisée"""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                logger.warning("Supabase credentials not found, using development mode")
                self.client = None
                return
            
            # Initialiser le client Supabase
            self.client = create_client(supabase_url, supabase_key)
            self._client_initialized = True
            
            logger.info("Supabase client initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize Supabase client", error=str(e))
            self.client = None
    
    async def create_journal_event(
        self,
        user_id: str,
        event_type: str,
        event_data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        🌙 Journal Narratif: Crée un événement spécifique au Journal
        Optimisé pour le suivi des interactions utilisateur avec le récit
        """
        return await self.create_event(
            user_id=user_id,
            event_type=f"journal_{event_type}",
            app_source="journal_narratif",
            event_data=event_data,
            metadata=metadata
        )

    async def create_event(
        self, 
        user_id: str, 
        event_type: str, 
        app_source: str,
        event_data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        🎯 ORACLE: Crée un événement immuable dans l'Event Store
        Source de vérité pour le Capital Narratif
        """
        # 🔑 Le client est déjà initialisé dans __init__
        
        # Security Guardian validation
        clean_user_id = SecurityGuardian.validate_user_id(user_id)
        clean_event_type = SecurityGuardian.sanitize_string(event_type, 100)
        clean_app_source = SecurityGuardian.sanitize_string(app_source, 50)
        clean_event_data = SecurityGuardian.validate_context(event_data)
        clean_metadata = SecurityGuardian.validate_context(metadata or {})
        
        event_id = str(uuid.uuid4())
        
        # Nouveau schéma events: type, occurred_at, actor_user_id, payload, meta
        event_record = {
            "id": event_id,
            "type": clean_event_type,  # "type" au lieu de "event_type"
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "actor_user_id": clean_user_id,
            "payload": {
                **clean_event_data,
                "app_source": clean_app_source
            },
            "meta": {
                **clean_metadata,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "luna_version": "1.0.0",
                "source": "luna_hub"
            }
        }
        
        if self.client is None:
            # Mode développement : log uniquement
            logger.info("Event created (dev mode)", event_data=event_record)
            return event_id
        
        # 🔄 Exécuter avec connection pooling + retry automatique
        async def _execute_insert():
            return self.client.table("events").insert(event_record).execute()
        
        try:
            result = await connection_manager.execute_with_retry(
                operation=_execute_insert,
                operation_name="event_store_insert"
            )
            
            logger.info(
                "Event stored in Supabase with connection pooling",
                event_id=event_id,
                user_id=clean_user_id,
                event_type=clean_event_type,
                app_source=clean_app_source
            )
            
            return event_id
            
        except Exception as e:
            logger.error(
                "Failed to store event in Supabase after retries",
                event_id=event_id,
                error=str(e),
                retry_attempts=connection_manager.config.retry_attempts
            )
            raise Exception(f"Event Store error after retries: {str(e)}")
    
    async def get_user_events(
        self, 
        user_id: str, 
        limit: int = 100,
        event_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        📚 Récupère les événements d'un utilisateur pour reconstruction du Capital Narratif
        """
        clean_user_id = SecurityGuardian.validate_user_id(user_id)
        
        if self.client is None:
            logger.info("Getting events (dev mode)", user_id=clean_user_id)
            return []
        
        try:
            # Compatibilité legacy: on accepte les deux champs, en visant actor_user_id comme vérité cible
            query = (
                self.client.table("events")
                .select("*")
                .or_(f"actor_user_id.eq.{clean_user_id},user_id.eq.{clean_user_id}")
            )
            
            if event_type:
                clean_event_type = SecurityGuardian.sanitize_string(event_type, 100)
                query = query.eq("type", clean_event_type)  # Nouveau schema utilise "type"
            
            # 🔄 Exécuter avec connection pooling + retry
            async def _execute_query():
                return query.order("created_at", desc=True).limit(limit).execute()
            
            result = await connection_manager.execute_with_retry(
                operation=_execute_query,
                operation_name="event_store_query"
            )
            
            logger.info(
                "Events retrieved from Supabase with connection pooling",
                user_id=clean_user_id,
                count=len(result.data),
                event_type=event_type
            )
            
            return result.data
            
        except Exception as e:
            logger.error(
                "Failed to retrieve events from Supabase after retries",
                user_id=clean_user_id,
                error=str(e),
                retry_attempts=connection_manager.config.retry_attempts
            )
            raise Exception(f"Event Store error after retries: {str(e)}")
    
    async def create_user_energy_record(self, user_energy_data: Dict[str, Any]) -> bool:
        """Crée ou met à jour un enregistrement d'énergie utilisateur"""
        if self.client is None:
            logger.info("User energy record created (dev mode)", data=user_energy_data)
            return True
        
        try:
            result = self.client.table("users_energy").upsert(
                user_energy_data,
                on_conflict="user_id"
            ).execute()
            
            logger.info(
                "User energy record upserted",
                user_id=user_energy_data.get("user_id")
            )
            
            return True
            
        except Exception as e:
            logger.error(
                "Failed to upsert user energy record",
                error=str(e)
            )
            return False
    
    async def create_energy_transaction(self, transaction_data: Dict[str, Any]) -> bool:
        """Enregistre une transaction d'énergie"""
        if self.client is None:
            logger.info("Energy transaction created (dev mode)", data=transaction_data)
            return True
        
        try:
            result = self.client.table("energy_transactions").insert(transaction_data).execute()
            
            logger.info(
                "Energy transaction recorded",
                transaction_id=transaction_data.get("transaction_id"),
                user_id=transaction_data.get("user_id")
            )
            
            return True
            
        except Exception as e:
            logger.error(
                "Failed to record energy transaction",
                error=str(e)
            )
            return False
    
    async def get_user_energy(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Récupère l'énergie d'un utilisateur depuis Supabase"""
        clean_user_id = SecurityGuardian.validate_user_id(user_id)
        
        if self.client is None:
            logger.info("Getting user energy (dev mode)", user_id_param=clean_user_id)
            return None
        
        try:
            result = self.client.table("users_energy").select("*").eq("user_id", clean_user_id).execute()
            
            if result.data:
                logger.info("User energy retrieved", user_id=clean_user_id)
                return result.data[0]
            else:
                logger.info("User energy not found", user_id=clean_user_id)
                return None
                
        except Exception as e:
            logger.error(
                "Failed to retrieve user energy",
                user_id=clean_user_id,
                error=str(e)
            )
            return None
    
    async def health_check(self) -> Dict[str, Any]:
        """Vérifie la santé de la connexion Supabase"""
        if self.client is None:
            return {
                "status": "development_mode",
                "supabase_connected": False,
                "message": "Running in development mode without Supabase"
            }
        
        try:
            # Simple test de connexion
            result = self.client.table("users").select("count", count="exact").limit(1).execute()
            
            return {
                "status": "healthy",
                "supabase_connected": True,
                "message": "Supabase connection successful"
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "supabase_connected": False,
                "error": str(e)
            }


# Instance globale du Event Store
event_store = SupabaseEventStore()

def get_supabase_client() -> Optional[Client]:
    """Récupère le client Supabase pour usage direct"""
    return event_store.client

# Alias for backward compatibility with new auth system
sb = event_store.client