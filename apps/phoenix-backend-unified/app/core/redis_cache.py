"""
🗄️ Redis Cache Manager - Phoenix Luna Hub
Cache distribué pour données énergétiques avec TTL intelligent
Oracle Directive: Performance & Stabilité
"""

import os
import json
import asyncio
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, timezone, timedelta
from dataclasses import asdict, is_dataclass
import structlog
from functools import wraps
import hashlib

logger = structlog.get_logger("redis_cache")

# Configuration environnementale
REDIS_AVAILABLE = True
try:
    import redis.asyncio as redis
    from redis.asyncio.retry import Retry
    from redis.exceptions import ConnectionError, TimeoutError
except ImportError:
    logger.warning("Redis not available - using fallback memory cache")
    REDIS_AVAILABLE = False
    redis = None


class RedisCacheConfig:
    """Configuration du cache Redis"""
    
    def __init__(self):
        # Configuration Redis depuis env
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_db = int(os.getenv("REDIS_DB", "0"))
        self.redis_password = os.getenv("REDIS_PASSWORD")
        
        # TTLs par type de données (en secondes)
        self.ttl_user_energy = int(os.getenv("CACHE_TTL_USER_ENERGY", "300"))  # 5 min
        self.ttl_energy_transactions = int(os.getenv("CACHE_TTL_TRANSACTIONS", "600"))  # 10 min
        self.ttl_user_stats = int(os.getenv("CACHE_TTL_USER_STATS", "900"))  # 15 min
        self.ttl_leaderboard = int(os.getenv("CACHE_TTL_LEADERBOARD", "1800"))  # 30 min
        
        # Configuration performance  
        self.connection_pool_size = int(os.getenv("REDIS_POOL_SIZE", "10"))
        self.connection_timeout = float(os.getenv("REDIS_TIMEOUT", "5.0"))
        self.retry_attempts = int(os.getenv("REDIS_RETRY_ATTEMPTS", "3"))
        
        # Prefixes pour namespacing
        self.key_prefix = os.getenv("REDIS_KEY_PREFIX", "luna:prod")
        self.version = os.getenv("CACHE_VERSION", "v1")


class FallbackMemoryCache:
    """Cache en mémoire de secours si Redis indisponible"""
    
    def __init__(self, max_size: int = 1000):
        self.cache: Dict[str, tuple[Any, datetime]] = {}
        self.max_size = max_size
    
    async def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache mémoire"""
        if key in self.cache:
            value, expires_at = self.cache[key]
            if datetime.now(timezone.utc) < expires_at:
                return value
            else:
                del self.cache[key]
        return None
    
    async def set(self, key: str, value: Any, ttl: int) -> bool:
        """Stocke une valeur dans le cache mémoire"""
        if len(self.cache) >= self.max_size:
            # Supprimer l'entrée la plus ancienne
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]
        
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)
        self.cache[key] = (value, expires_at)
        return True
    
    async def delete(self, key: str) -> bool:
        """Supprime une clé du cache mémoire"""
        if key in self.cache:
            del self.cache[key]
            return True
        return False
    
    async def clear(self) -> bool:
        """Vide le cache mémoire"""
        self.cache.clear()
        return True


class RedisCache:
    """
    🗄️ Gestionnaire de cache Redis pour Phoenix Luna
    
    Features:
    - TTL intelligent par type de données
    - Fallback automatique vers cache mémoire
    - Sérialisation/désérialisation automatique
    - Patterns de cache optimisés
    - Invalidation intelligente 
    - Monitoring et métriques
    """
    
    def __init__(self, config: Optional[RedisCacheConfig] = None):
        self.config = config or RedisCacheConfig()
        self.redis_client: Optional[redis.Redis] = None
        self.fallback_cache = FallbackMemoryCache()
        self.stats = {
            "hits": 0,
            "misses": 0, 
            "errors": 0,
            "fallback_uses": 0
        }
        
        # État de connexion
        self.redis_available = False
        
    async def initialize(self) -> bool:
        """Initialise la connexion Redis"""
        
        if not REDIS_AVAILABLE:
            logger.warning("Redis package not available, using fallback cache")
            return False
        
        try:
            # Configuration pool de connexions
            connection_pool = redis.ConnectionPool.from_url(
                self.config.redis_url,
                password=self.config.redis_password,
                db=self.config.redis_db,
                max_connections=self.config.connection_pool_size,
                socket_timeout=self.config.connection_timeout,
                socket_connect_timeout=self.config.connection_timeout,
                retry=Retry(retries=self.config.retry_attempts)
            )
            
            self.redis_client = redis.Redis(
                connection_pool=connection_pool,
                decode_responses=True
            )
            
            # Test de connectivité
            await self.redis_client.ping()
            self.redis_available = True
            
            logger.info(
                "Redis cache initialized successfully",
                url=self.config.redis_url,
                db=self.config.redis_db,
                pool_size=self.config.connection_pool_size
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to initialize Redis, using fallback cache", error=str(e))
            self.redis_available = False
            return False
    
    def _build_key(self, key_type: str, identifier: str) -> str:
        """Construit une clé Redis avec namespace"""
        return f"{self.config.key_prefix}:{self.config.version}:{key_type}:{identifier}"
    
    def _serialize_value(self, value: Any) -> str:
        """Sérialise une valeur pour stockage Redis"""
        if value is None:
            return "null"
        
        # Gestion des dataclasses
        if is_dataclass(value):
            value = asdict(value)
        
        # Gestion des objets datetime
        if isinstance(value, datetime):
            value = value.isoformat()
        
        return json.dumps(value, default=str, ensure_ascii=False)
    
    def _deserialize_value(self, serialized: str) -> Any:
        """Désérialise une valeur depuis Redis"""
        if serialized == "null":
            return None
        
        try:
            return json.loads(serialized)
        except json.JSONDecodeError:
            return serialized
    
    async def get(self, key_type: str, identifier: str) -> Optional[Any]:
        """Récupère une valeur du cache"""
        
        full_key = self._build_key(key_type, identifier)
        
        try:
            # Essayer Redis d'abord
            if self.redis_available and self.redis_client:
                value = await self.redis_client.get(full_key)
                if value is not None:
                    self.stats["hits"] += 1
                    return self._deserialize_value(value)
            
            # Fallback vers cache mémoire
            fallback_value = await self.fallback_cache.get(full_key)
            if fallback_value is not None:
                self.stats["hits"] += 1
                self.stats["fallback_uses"] += 1
                return fallback_value
            
            self.stats["misses"] += 1
            return None
            
        except Exception as e:
            logger.error("Cache get error", key=full_key, error=str(e))
            self.stats["errors"] += 1
            
            # Essayer le fallback en cas d'erreur Redis
            try:
                fallback_value = await self.fallback_cache.get(full_key)
                if fallback_value is not None:
                    self.stats["fallback_uses"] += 1
                    return fallback_value
            except Exception:
                pass
                
            return None
    
    async def set(self, key_type: str, identifier: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Stocke une valeur dans le cache"""
        
        full_key = self._build_key(key_type, identifier)
        
        # TTL par défaut selon le type
        if ttl is None:
            ttl_map = {
                "user_energy": self.config.ttl_user_energy,
                "energy_transactions": self.config.ttl_energy_transactions,
                "user_stats": self.config.ttl_user_stats,
                "leaderboard": self.config.ttl_leaderboard
            }
            ttl = ttl_map.get(key_type, 300)  # 5min par défaut
        
        try:
            # Essayer Redis d'abord
            if self.redis_available and self.redis_client:
                serialized = self._serialize_value(value)
                await self.redis_client.setex(full_key, ttl, serialized)
                return True
                
        except Exception as e:
            logger.error("Redis set error", key=full_key, error=str(e))
            self.stats["errors"] += 1
        
        # Fallback vers cache mémoire
        try:
            await self.fallback_cache.set(full_key, value, ttl)
            self.stats["fallback_uses"] += 1
            return True
        except Exception as e:
            logger.error("Fallback cache set error", key=full_key, error=str(e))
            return False
    
    async def delete(self, key_type: str, identifier: str) -> bool:
        """Supprime une clé du cache"""
        
        full_key = self._build_key(key_type, identifier)
        deleted = False
        
        try:
            # Supprimer de Redis
            if self.redis_available and self.redis_client:
                result = await self.redis_client.delete(full_key)
                deleted = result > 0
            
            # Supprimer du fallback aussi
            await self.fallback_cache.delete(full_key)
            
            return deleted
            
        except Exception as e:
            logger.error("Cache delete error", key=full_key, error=str(e))
            self.stats["errors"] += 1
            return False
    
    async def invalidate_user_cache(self, user_id: str) -> bool:
        """Invalide tout le cache pour un utilisateur"""
        
        user_key_patterns = [
            f"user_energy:{user_id}",
            f"energy_transactions:{user_id}",
            f"user_stats:{user_id}"
        ]
        
        for pattern in user_key_patterns:
            await self.delete(*pattern.split(":", 1))
        
        return True
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du cache"""
        
        total_requests = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        stats = {
            "redis_available": self.redis_available,
            "total_requests": total_requests,
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "hit_rate_pct": round(hit_rate, 2),
            "errors": self.stats["errors"],
            "fallback_uses": self.stats["fallback_uses"],
            "config": {
                "ttl_user_energy": self.config.ttl_user_energy,
                "ttl_transactions": self.config.ttl_energy_transactions,
                "pool_size": self.config.connection_pool_size
            }
        }
        
        # Infos Redis si disponible
        if self.redis_available and self.redis_client:
            try:
                redis_info = await self.redis_client.info("memory")
                stats["redis_memory_mb"] = round(redis_info.get("used_memory", 0) / 1024 / 1024, 2)
                stats["redis_connections"] = redis_info.get("connected_clients", 0)
            except Exception:
                pass
        
        return stats
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check du cache Redis"""
        
        if not self.redis_available:
            return {
                "status": "fallback_only",
                "redis_connected": False,
                "fallback_available": True,
                "message": "Using fallback memory cache only"
            }
        
        try:
            if self.redis_client:
                latency_start = datetime.now()
                await self.redis_client.ping()
                latency_ms = (datetime.now() - latency_start).total_seconds() * 1000
                
                return {
                    "status": "healthy",
                    "redis_connected": True,
                    "latency_ms": round(latency_ms, 2),
                    "fallback_available": True
                }
        except Exception as e:
            return {
                "status": "redis_error", 
                "redis_connected": False,
                "error": str(e),
                "fallback_available": True
            }
    
    async def close(self):
        """Ferme les connexions Redis"""
        if self.redis_client:
            await self.redis_client.aclose()
            self.redis_available = False


# Décorateur pour cache automatique
def cached(key_type: str, ttl: Optional[int] = None, key_fn=None):
    """
    Décorateur pour cache automatique de fonctions
    
    Args:
        key_type: Type de clé pour le cache
        ttl: TTL en secondes (optionnel)
        key_fn: Fonction pour générer l'identifiant (optionnel)
    """
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Générer la clé de cache
            if key_fn:
                identifier = key_fn(*args, **kwargs)
            else:
                # Utiliser le premier argument comme identifiant (généralement user_id)
                identifier = str(args[0]) if args else "default"
            
            # Essayer de récupérer depuis le cache
            if hasattr(redis_cache, 'get'):
                cached_result = await redis_cache.get(key_type, identifier)
                if cached_result is not None:
                    return cached_result
            
            # Exécuter la fonction si pas en cache
            result = await func(*args, **kwargs)
            
            # Mettre en cache le résultat
            if hasattr(redis_cache, 'set') and result is not None:
                await redis_cache.set(key_type, identifier, result, ttl)
            
            return result
        
        return wrapper
    return decorator


# Instance globale
redis_cache = RedisCache()


async def initialize_redis_cache() -> bool:
    """Initialise le cache Redis global"""
    return await redis_cache.initialize()


async def close_redis_cache():
    """Ferme le cache Redis global"""
    await redis_cache.close()