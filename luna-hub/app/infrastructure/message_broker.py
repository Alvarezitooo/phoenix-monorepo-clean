"""
🚀 Message Broker - Luna Microservices Communication
Phoenix Production - Étend Redis existant

Système de communication asynchrone entre spécialistes Luna.
Réutilise l'infrastructure Redis existante dans redis_cache.py.
"""

import os
import json
import asyncio
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
import uuid
import structlog

# Réutilise Redis existant
from ..core.redis_cache import redis_cache as cache_manager, logger as redis_logger

logger = structlog.get_logger("message_broker")

@dataclass
class LunaMessage:
    """Message standard pour communication inter-Luna"""
    id: str
    from_service: str
    to_service: str
    message_type: str
    payload: Dict[str, Any]
    user_context: Dict[str, Any]
    timestamp: str
    expires_at: str
    priority: int = 1  # 1=high, 2=medium, 3=low
    correlation_id: Optional[str] = None

class MessageBroker:
    """
    🌐 Broker de messages pour communication Luna distribuée
    
    Utilise Redis existant pour éviter nouvelle infrastructure.
    Pattern pub/sub + queues pour reliability.
    """
    
    def __init__(self):
        self.cache = cache_manager  # Réutilise Redis existant
        self.message_handlers: Dict[str, List[Callable]] = {}
        self.active_subscriptions: List[str] = []
        
    # 📤 ENVOI DE MESSAGES

    async def send_message(
        self, 
        to_service: str, 
        message_type: str, 
        payload: Dict[str, Any],
        user_context: Dict[str, Any] = None,
        priority: int = 1,
        correlation_id: str = None,
        ttl_minutes: int = 30
    ) -> str:
        """
        Envoi d'un message à un service Luna spécifique
        
        Args:
            to_service: Service destinataire (luna-aube, luna-cv, etc.)
            message_type: Type de message (user_request, context_sync, etc.)
            payload: Données du message
            user_context: Contexte utilisateur
            priority: Priorité (1=high, 2=medium, 3=low)
            correlation_id: ID de corrélation pour traçage
            ttl_minutes: Durée de vie du message
            
        Returns:
            ID du message envoyé
        """
        try:
            message_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(minutes=ttl_minutes)
            
            message = LunaMessage(
                id=message_id,
                from_service="luna-central",  # Par défaut central
                to_service=to_service,
                message_type=message_type,
                payload=payload,
                user_context=user_context or {},
                timestamp=now.isoformat(),
                expires_at=expires_at.isoformat(),
                priority=priority,
                correlation_id=correlation_id
            )
            
            # Queue spécifique au service + priorité
            queue_key = f"luna:queue:{to_service}:p{priority}"
            message_key = f"luna:message:{message_id}"
            
            # Stocker message complet avec TTL
            await self.cache.set(
                key=message_key,
                value=asdict(message),
                ttl_seconds=ttl_minutes * 60
            )
            
            # Ajouter à la queue du service (juste l'ID avec score = timestamp)
            await self._add_to_queue(queue_key, message_id, now.timestamp())
            
            # Publier notification sur canal service
            channel = f"luna:notifications:{to_service}"
            notification = {
                "message_id": message_id,
                "message_type": message_type,
                "priority": priority,
                "timestamp": now.isoformat()
            }
            await self._publish_notification(channel, notification)
            
            logger.info("Message sent",
                       message_id=message_id,
                       to_service=to_service,
                       message_type=message_type,
                       priority=priority)
            
            return message_id
            
        except Exception as e:
            logger.error("Failed to send message",
                        to_service=to_service,
                        message_type=message_type,
                        error=str(e))
            raise

    async def send_broadcast(
        self, 
        message_type: str, 
        payload: Dict[str, Any],
        target_services: List[str] = None,
        user_context: Dict[str, Any] = None
    ) -> List[str]:
        """
        Broadcast d'un message à plusieurs services Luna
        
        Args:
            message_type: Type de message
            payload: Données à broadcaster
            target_services: Services cibles (par défaut tous)
            user_context: Contexte utilisateur
            
        Returns:
            Liste des IDs de messages envoyés
        """
        if not target_services:
            target_services = ["luna-aube", "luna-cv", "luna-letters", "luna-rise"]
            
        message_ids = []
        correlation_id = str(uuid.uuid4())  # Même corrélation pour tous
        
        for service in target_services:
            try:
                message_id = await self.send_message(
                    to_service=service,
                    message_type=message_type,
                    payload=payload,
                    user_context=user_context,
                    correlation_id=correlation_id
                )
                message_ids.append(message_id)
            except Exception as e:
                logger.error("Broadcast failed for service",
                            service=service,
                            error=str(e))
                
        return message_ids

    # 📥 RÉCEPTION DE MESSAGES

    async def receive_messages(self, service_name: str, max_messages: int = 10) -> List[LunaMessage]:
        """
        Réception de messages pour un service spécifique
        
        Args:
            service_name: Nom du service (luna-aube, etc.)
            max_messages: Nombre max de messages à récupérer
            
        Returns:
            Liste de messages reçus
        """
        try:
            messages = []
            
            # Parcourir les queues par priorité (1=high → 3=low)
            for priority in [1, 2, 3]:
                queue_key = f"luna:queue:{service_name}:p{priority}"
                
                # Récupérer messages avec score (timestamp)
                message_ids = await self._get_from_queue(queue_key, max_messages - len(messages))
                
                for message_id in message_ids:
                    message_key = f"luna:message:{message_id}"
                    message_data = await self.cache.get(message_key)
                    
                    if message_data:
                        message = LunaMessage(**message_data)
                        
                        # Vérifier expiration
                        expires_at = datetime.fromisoformat(message.expires_at.replace('Z', '+00:00'))
                        if datetime.now(timezone.utc) < expires_at:
                            messages.append(message)
                        else:
                            # Message expiré, nettoyer
                            await self._cleanup_expired_message(message_id, queue_key)
                    
                    if len(messages) >= max_messages:
                        break
                        
                if len(messages) >= max_messages:
                    break
                    
            return messages
            
        except Exception as e:
            logger.error("Failed to receive messages",
                        service=service_name,
                        error=str(e))
            return []

    async def acknowledge_message(self, message_id: str, service_name: str):
        """
        Acquittement d'un message traité
        
        Args:
            message_id: ID du message traité
            service_name: Service qui traite le message
        """
        try:
            # Supprimer de toutes les queues prioritaires du service
            for priority in [1, 2, 3]:
                queue_key = f"luna:queue:{service_name}:p{priority}"
                await self._remove_from_queue(queue_key, message_id)
            
            # Marquer comme traité (garder trace pour debugging)
            processed_key = f"luna:processed:{message_id}"
            await self.cache.set(
                processed_key,
                {
                    "processed_by": service_name,
                    "processed_at": datetime.now(timezone.utc).isoformat()
                },
                ttl_seconds=3600  # Garder 1h pour debug
            )
            
            logger.info("Message acknowledged",
                       message_id=message_id,
                       service=service_name)
            
        except Exception as e:
            logger.error("Failed to acknowledge message",
                        message_id=message_id,
                        service=service_name,
                        error=str(e))

    # 🔔 SYSTÈME DE NOTIFICATIONS

    async def subscribe_to_notifications(self, service_name: str, handler: Callable):
        """
        Souscription aux notifications pour un service
        
        Args:
            service_name: Nom du service
            handler: Fonction callback pour traiter notifications
        """
        channel = f"luna:notifications:{service_name}"
        
        if service_name not in self.message_handlers:
            self.message_handlers[service_name] = []
            
        self.message_handlers[service_name].append(handler)
        
        if channel not in self.active_subscriptions:
            self.active_subscriptions.append(channel)
            
        logger.info("Subscribed to notifications",
                   service=service_name,
                   channel=channel)

    # 🛠️ MÉTHODES PRIVÉES UTILISANT REDIS

    async def _add_to_queue(self, queue_key: str, message_id: str, score: float):
        """Ajouter message à une queue avec score (timestamp)"""
        # Utilise Redis pour queue ordonnée par timestamp
        if hasattr(self.cache, 'redis_client') and self.cache.redis_client:
            await self.cache.redis_client.zadd(queue_key, {message_id: score})
        else:
            # Fallback pour cas où Redis n'est pas disponible
            queue_data = await self.cache.get(queue_key) or []
            queue_data.append({"message_id": message_id, "score": score})
            queue_data.sort(key=lambda x: x["score"])  # Tri par timestamp
            await self.cache.set(queue_key, queue_data, ttl_seconds=3600)

    async def _get_from_queue(self, queue_key: str, count: int) -> List[str]:
        """Récupérer messages d'une queue (FIFO par timestamp)"""
        try:
            if hasattr(self.cache, 'redis_client') and self.cache.redis_client:
                # Redis sorted set - récupérer les plus anciens
                results = await self.cache.redis_client.zrange(queue_key, 0, count-1)
                return [result.decode() if isinstance(result, bytes) else result for result in results]
            else:
                # Fallback
                queue_data = await self.cache.get(queue_key) or []
                return [item["message_id"] for item in queue_data[:count]]
        except:
            return []

    async def _remove_from_queue(self, queue_key: str, message_id: str):
        """Supprimer message d'une queue"""
        try:
            if hasattr(self.cache, 'redis_client') and self.cache.redis_client:
                await self.cache.redis_client.zrem(queue_key, message_id)
            else:
                # Fallback
                queue_data = await self.cache.get(queue_key) or []
                queue_data = [item for item in queue_data if item["message_id"] != message_id]
                await self.cache.set(queue_key, queue_data, ttl_seconds=3600)
        except:
            pass

    async def _publish_notification(self, channel: str, notification: Dict[str, Any]):
        """Publier notification sur un canal"""
        try:
            if hasattr(self.cache, 'redis_client') and self.cache.redis_client:
                await self.cache.redis_client.publish(channel, json.dumps(notification))
            else:
                # Fallback: stocker notification dans cache temporaire
                notif_key = f"notifications:{channel}:{int(datetime.now().timestamp())}"
                await self.cache.set(notif_key, notification, ttl_seconds=300)  # 5min
        except:
            pass

    async def _cleanup_expired_message(self, message_id: str, queue_key: str):
        """Nettoyer un message expiré"""
        try:
            # Supprimer message
            message_key = f"luna:message:{message_id}"
            await self.cache.delete(message_key)
            
            # Supprimer de queue
            await self._remove_from_queue(queue_key, message_id)
            
            logger.info("Cleaned up expired message", message_id=message_id)
        except:
            pass

    # 📊 MONITORING & STATS

    async def get_queue_stats(self, service_name: str) -> Dict[str, Any]:
        """
        Statistiques des queues pour un service
        """
        try:
            stats = {
                "service": service_name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "queues": {}
            }
            
            for priority in [1, 2, 3]:
                queue_key = f"luna:queue:{service_name}:p{priority}"
                
                if hasattr(self.cache, 'redis_client') and self.cache.redis_client:
                    count = await self.cache.redis_client.zcard(queue_key)
                else:
                    queue_data = await self.cache.get(queue_key) or []
                    count = len(queue_data)
                    
                stats["queues"][f"priority_{priority}"] = {
                    "message_count": count,
                    "queue_key": queue_key
                }
                
            return stats
            
        except Exception as e:
            logger.error("Failed to get queue stats",
                        service=service_name,
                        error=str(e))
            return {"error": str(e)}

# Instance globale
message_broker = MessageBroker()