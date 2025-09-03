"""
⚡ Rate Limiter - Système de limitation robuste v2.0
Phoenix Luna Hub - Multi-strategy Rate Limiting avec Redis
Oracle Directive: Sécurité par défaut & Performance
"""

import time
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple, List, Union
import hashlib
from enum import Enum
from dataclasses import dataclass
import structlog

from .supabase_client import sb, event_store
from .redis_cache import redis_cache
from .events import create_event

logger = structlog.get_logger("rate_limiter")

class RateLimitScope(Enum):
    # Auth endpoints
    AUTH_LOGIN = "auth_login"
    AUTH_REGISTER = "auth_register"
    PASSWORD_RESET = "password_reset"
    
    # API endpoints
    API_GENERAL = "api_general"
    API_ENERGY = "api_energy"
    API_CV_GENERATION = "api_cv_generation"
    API_LETTER_GENERATION = "api_letter_generation"
    API_LUNA_CHAT = "api_luna_chat"
    
    # Administrative
    ADMIN_OPERATIONS = "admin_operations"
    
    # Global protection
    GLOBAL_DDOS = "global_ddos"
    IP_GENERAL = "ip_general"
    USER_GENERAL = "user_general"


class RateLimitStrategy(Enum):
    """Stratégies de rate limiting"""
    FIXED_WINDOW = "fixed_window"        # Fenêtre fixe
    SLIDING_WINDOW = "sliding_window"    # Fenêtre glissante
    TOKEN_BUCKET = "token_bucket"        # Token bucket (bursts)


class RateLimitResult(Enum):
    ALLOWED = "allowed"
    LIMITED = "limited"
    BLOCKED = "blocked"


@dataclass
class RateLimitRule:
    """Règle de rate limiting améliorée"""
    scope: RateLimitScope
    strategy: RateLimitStrategy
    requests_per_window: int
    window_seconds: int
    burst_size: Optional[int] = None      # Pour token bucket
    block_duration_seconds: int = 300     # 5 min par défaut
    enabled: bool = True
    priority: int = 0

class RateLimiter:
    """
    🛡️ Enterprise Rate Limiting System v2.0
    
    Multi-strategy rate limiting with Redis-backed storage
    and intelligent fallback to event store aggregation.
    
    Features:
    - Fixed window, sliding window, token bucket strategies
    - Redis atomic operations with Lua scripts
    - Comprehensive audit trail via event store
    - Intelligent failover and monitoring
    - HTTP standard headers for client communication
    """
    
    # Enhanced rate limit rules configuration
    RULES = {
        # Authentication endpoints (stricter limits)
        RateLimitScope.AUTH_LOGIN: RateLimitRule(
            scope=RateLimitScope.AUTH_LOGIN,
            strategy=RateLimitStrategy.SLIDING_WINDOW,
            requests_per_window=5,
            window_seconds=900,  # 15 minutes
            block_duration_seconds=1800,  # 30 minutes
            priority=1
        ),
        RateLimitScope.AUTH_REGISTER: RateLimitRule(
            scope=RateLimitScope.AUTH_REGISTER,
            strategy=RateLimitStrategy.FIXED_WINDOW,
            requests_per_window=3,
            window_seconds=3600,  # 1 hour
            block_duration_seconds=7200,  # 2 hours
            priority=1
        ),
        RateLimitScope.PASSWORD_RESET: RateLimitRule(
            scope=RateLimitScope.PASSWORD_RESET,
            strategy=RateLimitStrategy.SLIDING_WINDOW,
            requests_per_window=3,
            window_seconds=3600,  # 1 hour
            block_duration_seconds=3600,  # 1 hour
            priority=1
        ),
        
        # API endpoints (moderate limits with bursts)
        RateLimitScope.API_GENERAL: RateLimitRule(
            scope=RateLimitScope.API_GENERAL,
            strategy=RateLimitStrategy.TOKEN_BUCKET,
            requests_per_window=100,
            window_seconds=60,  # 1 minute
            burst_size=20,  # Allow bursts
            block_duration_seconds=300,  # 5 minutes
            priority=2
        ),
        RateLimitScope.API_ENERGY: RateLimitRule(
            scope=RateLimitScope.API_ENERGY,
            strategy=RateLimitStrategy.SLIDING_WINDOW,
            requests_per_window=50,
            window_seconds=60,
            block_duration_seconds=300,
            priority=2
        ),
        RateLimitScope.API_CV_GENERATION: RateLimitRule(
            scope=RateLimitScope.API_CV_GENERATION,
            strategy=RateLimitStrategy.FIXED_WINDOW,
            requests_per_window=10,  # Resource intensive
            window_seconds=3600,  # 1 hour
            block_duration_seconds=1800,
            priority=1
        ),
        RateLimitScope.API_LUNA_CHAT: RateLimitRule(
            scope=RateLimitScope.API_LUNA_CHAT,
            strategy=RateLimitStrategy.TOKEN_BUCKET,
            requests_per_window=30,
            window_seconds=60,
            burst_size=5,
            block_duration_seconds=300,
            priority=2
        ),
        
        # Global protection (high limits, DDoS protection)
        RateLimitScope.GLOBAL_DDOS: RateLimitRule(
            scope=RateLimitScope.GLOBAL_DDOS,
            strategy=RateLimitStrategy.SLIDING_WINDOW,
            requests_per_window=1000,
            window_seconds=60,
            block_duration_seconds=600,  # 10 minutes
            priority=0  # Highest priority
        ),
        RateLimitScope.IP_GENERAL: RateLimitRule(
            scope=RateLimitScope.IP_GENERAL,
            strategy=RateLimitStrategy.TOKEN_BUCKET,
            requests_per_window=500,
            window_seconds=60,
            burst_size=50,
            block_duration_seconds=300,
            priority=2
        )
    }
    
    # Lua script for atomic sliding window operations
    SLIDING_WINDOW_SCRIPT = """
        local key = KEYS[1]
        local window = tonumber(ARGV[1])
        local limit = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local identifier = ARGV[4]
        
        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
        
        -- Count current entries
        local current = redis.call('ZCARD', key)
        
        if current < limit then
            -- Add new entry
            redis.call('ZADD', key, now, identifier .. ':' .. now)
            redis.call('EXPIRE', key, math.ceil(window))
            return {1, current + 1, limit}
        else
            return {0, current, limit}
        end
    """
    
    # Lua script for atomic token bucket operations
    TOKEN_BUCKET_SCRIPT = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local window_seconds = tonumber(ARGV[3])
        local now = tonumber(ARGV[4])
        local requested_tokens = tonumber(ARGV[5]) or 1
        
        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now
        
        -- Calculate tokens to add based on time elapsed
        local time_elapsed = math.max(0, now - last_refill)
        local tokens_to_add = math.floor(time_elapsed * refill_rate / window_seconds)
        tokens = math.min(capacity, tokens + tokens_to_add)
        
        if tokens >= requested_tokens then
            tokens = tokens - requested_tokens
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
            redis.call('EXPIRE', key, window_seconds * 2)
            return {1, tokens, capacity}
        else
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
            redis.call('EXPIRE', key, window_seconds * 2)
            return {0, tokens, capacity}
        end
    """
    
    def __init__(self):
        """Initialise le système de rate limiting robuste"""
        self.metrics = {
            "total_requests": 0,
            "allowed": 0,
            "limited": 0, 
            "blocked": 0,
            "redis_errors": 0
        }
        self.lua_scripts_loaded = False
        
    @staticmethod
    def get_identifier_hash(identifier: str, scope: RateLimitScope) -> str:
        """Créer un hash d'identifiant pour la confidentialité"""
        combined = f"{scope.value}:{identifier}"
        return hashlib.sha256(combined.encode()).hexdigest()[:16]
    
    async def _load_lua_scripts(self) -> bool:
        """Charge les scripts Lua dans Redis pour performance atomique"""
        try:
            if redis_cache.redis_available and redis_cache.redis_client:
                await redis_cache.redis_client.script_load(self.SLIDING_WINDOW_SCRIPT)
                await redis_cache.redis_client.script_load(self.TOKEN_BUCKET_SCRIPT)
                self.lua_scripts_loaded = True
                logger.info("Scripts Lua chargés avec succès pour rate limiting")
                return True
        except Exception as e:
            logger.warning("Échec du chargement des scripts Lua", error=str(e))
        
        return False
    
    def _get_redis_key(self, identifier_hash: str, scope: RateLimitScope, strategy: RateLimitStrategy) -> str:
        """Génère une clé Redis pour le rate limiting"""
        return f"ratelimit:{strategy.value}:{scope.value}:{identifier_hash}"
    
    async def _check_fixed_window(self, rule: RateLimitRule, identifier_hash: str, now: datetime) -> Tuple[bool, int, int]:
        """Stratégie fenêtre fixe - simple mais peut avoir des pics"""
        window_start = now.replace(second=0, microsecond=0)
        window_key = self._get_redis_key(identifier_hash, rule.scope, rule.strategy)
        window_key += f":{int(window_start.timestamp() // rule.window_seconds)}"
        
        try:
            if redis_cache.redis_available and redis_cache.redis_client:
                # Opération atomique Redis
                current_count = await redis_cache.redis_client.incr(window_key)
                if current_count == 1:
                    await redis_cache.redis_client.expire(window_key, rule.window_seconds)
                
                allowed = current_count <= rule.requests_per_window
                return allowed, current_count, rule.requests_per_window
                
        except Exception as e:
            logger.error("Erreur Redis fenêtre fixe", error=str(e))
            self.metrics["redis_errors"] += 1
        
        # Fallback vers event store
        return await self._fallback_to_event_store(rule, identifier_hash, now)
    
    async def _check_sliding_window(self, rule: RateLimitRule, identifier_hash: str, now: datetime) -> Tuple[bool, int, int]:
        """Stratégie fenêtre glissante - plus précise, évite les pics"""
        window_key = self._get_redis_key(identifier_hash, rule.scope, rule.strategy)
        now_ts = int(now.timestamp())
        
        try:
            if redis_cache.redis_available and redis_cache.redis_client and self.lua_scripts_loaded:
                # Utilise script Lua pour atomicité
                result = await redis_cache.redis_client.eval(
                    self.SLIDING_WINDOW_SCRIPT,
                    1,
                    window_key,
                    rule.window_seconds,
                    rule.requests_per_window,
                    now_ts,
                    identifier_hash
                )
                allowed = bool(result[0])
                current_count = int(result[1])
                limit = int(result[2])
                return allowed, current_count, limit
                
        except Exception as e:
            logger.error("Erreur Redis fenêtre glissante", error=str(e))
            self.metrics["redis_errors"] += 1
        
        # Fallback vers event store
        return await self._fallback_to_event_store(rule, identifier_hash, now)
    
    async def _check_token_bucket(self, rule: RateLimitRule, identifier_hash: str, now: datetime) -> Tuple[bool, int, int]:
        """Stratégie token bucket - permet les rafales contrôlées"""
        bucket_key = self._get_redis_key(identifier_hash, rule.scope, rule.strategy)
        now_ts = int(now.timestamp())
        
        # Calcul du taux de rechargement
        capacity = rule.burst_size or rule.requests_per_window
        refill_rate = rule.requests_per_window  # tokens per window
        
        try:
            if redis_cache.redis_available and redis_cache.redis_client and self.lua_scripts_loaded:
                result = await redis_cache.redis_client.eval(
                    self.TOKEN_BUCKET_SCRIPT,
                    1,
                    bucket_key,
                    capacity,
                    refill_rate,
                    rule.window_seconds,
                    now_ts,
                    1  # requested tokens
                )
                allowed = bool(result[0])
                remaining_tokens = int(result[1])
                total_capacity = int(result[2])
                return allowed, total_capacity - remaining_tokens, total_capacity
                
        except Exception as e:
            logger.error("Erreur Redis token bucket", error=str(e))
            self.metrics["redis_errors"] += 1
        
        # Fallback vers event store
        return await self._fallback_to_event_store(rule, identifier_hash, now)
    
    async def _fallback_to_event_store(self, rule: RateLimitRule, identifier_hash: str, now: datetime) -> Tuple[bool, int, int]:
        """Fallback vers la logique event store originale"""
        window_start = now - timedelta(seconds=rule.window_seconds)
        
        try:
            # Compte les tentatives dans la fenêtre actuelle
            attempts_result = sb.table("events").select("id").eq("type", f"{rule.scope.value}_attempt").gte("ts", window_start.isoformat()).execute()
            
            current_attempts = 0
            if attempts_result.data:
                for event in attempts_result.data:
                    event_detail = sb.table("events").select("payload").eq("id", event["id"]).execute()
                    if event_detail.data:
                        payload = event_detail.data[0].get("payload", {})
                        if payload.get("identifier_hash") == identifier_hash:
                            current_attempts += 1
            
            allowed = current_attempts < rule.requests_per_window
            return allowed, current_attempts + (0 if allowed else 1), rule.requests_per_window
            
        except Exception as e:
            logger.error("Erreur fallback event store", error=str(e))
            # Fail open en cas d'erreur critique
            return True, 0, rule.requests_per_window
    
    async def check_rate_limit(
        self,
        identifier: str,
        scope: RateLimitScope,
        user_agent: str = "",
        additional_context: Dict[str, Any] = None
    ) -> Tuple[RateLimitResult, Dict[str, Any]]:
        """
        Vérifie si une requête doit être limitée selon les règles multi-stratégies
        
        Args:
            identifier: Adresse IP, email, ou user_id
            scope: Type d'opération à limiter
            user_agent: User agent pour contexte
            additional_context: Données supplémentaires pour audit
            
        Returns:
            Tuple de (résultat, données_contexte)
        """
        try:
            self.metrics["total_requests"] += 1
            now = datetime.now(timezone.utc)
            
            # Obtenir la règle de rate limiting
            rule = self.RULES.get(scope)
            if not rule or not rule.enabled:
                logger.debug(f"Pas de règle active pour {scope.value}")
                return RateLimitResult.ALLOWED, {"scope": scope.value, "rule": "disabled"}
            
            identifier_hash = self.get_identifier_hash(identifier, scope)
            
            # Charger les scripts Lua si nécessaire
            if not self.lua_scripts_loaded:
                await self._load_lua_scripts()
            
            # Vérifier d'abord si l'identifiant est bloqué
            blocked_until = await self._check_existing_block(identifier_hash, scope, now)
            if blocked_until:
                self.metrics["blocked"] += 1
                return RateLimitResult.BLOCKED, {
                    "blocked_until": blocked_until.isoformat(),
                    "scope": scope.value,
                    "message": "Identifiant temporairement bloqué"
                }
            
            # Appliquer la stratégie appropriée
            if rule.strategy == RateLimitStrategy.FIXED_WINDOW:
                allowed, current_count, limit = await self._check_fixed_window(rule, identifier_hash, now)
            elif rule.strategy == RateLimitStrategy.SLIDING_WINDOW:
                allowed, current_count, limit = await self._check_sliding_window(rule, identifier_hash, now)
            elif rule.strategy == RateLimitStrategy.TOKEN_BUCKET:
                allowed, current_count, limit = await self._check_token_bucket(rule, identifier_hash, now)
            else:
                logger.warning(f"Stratégie inconnue: {rule.strategy}")
                return RateLimitResult.ALLOWED, {"error": "unknown_strategy"}
            
            # Enregistrer les métriques
            if allowed:
                self.metrics["allowed"] += 1
                # Enregistrer la tentative pour audit
                await self._record_attempt(identifier_hash, scope, user_agent, additional_context, now)
                
                return RateLimitResult.ALLOWED, {
                    "scope": scope.value,
                    "strategy": rule.strategy.value,
                    "current_count": current_count,
                    "limit": limit,
                    "window_seconds": rule.window_seconds,
                    "reset_at": (now + timedelta(seconds=rule.window_seconds)).isoformat()
                }
            else:
                self.metrics["limited"] += 1
                # Bloquer l'identifiant
                block_until = now + timedelta(seconds=rule.block_duration_seconds)
                await self._create_block_record(identifier_hash, scope, block_until, current_count)
                
                # Enregistrer l'événement de rate limiting
                await self._record_rate_limit_event(
                    identifier_hash, scope, user_agent, additional_context, 
                    current_count, limit, block_until, now
                )
                
                logger.warning(
                    "Rate limit dépassé",
                    scope=scope.value,
                    strategy=rule.strategy.value,
                    identifier_hash=identifier_hash[:8],
                    current_count=current_count,
                    limit=limit
                )
                
                return RateLimitResult.LIMITED, {
                    "scope": scope.value,
                    "strategy": rule.strategy.value,
                    "current_count": current_count,
                    "limit": limit,
                    "window_seconds": rule.window_seconds,
                    "blocked_until": block_until.isoformat(),
                    "block_duration_seconds": rule.block_duration_seconds,
                    "message": f"Limite de {limit} requêtes par {rule.window_seconds}s dépassée"
                }
            
        except Exception as e:
            logger.error("Échec de vérification rate limit", scope=scope.value, error=str(e))
            self.metrics["redis_errors"] += 1
            # Fail open pour éviter de bloquer le service
            return RateLimitResult.ALLOWED, {"error": "rate_check_failed"}
    
    async def _check_existing_block(self, identifier_hash: str, scope: RateLimitScope, now: datetime) -> Optional[datetime]:
        """Vérifie si l'identifiant est déjà bloqué"""
        try:
            result = sb.table("rate_limits").select("blocked_until").eq("scope", scope.value).eq("identifier", identifier_hash).gte("blocked_until", now.isoformat()).execute()
            
            if result.data:
                blocked_until_str = result.data[0]["blocked_until"]
                blocked_until = datetime.fromisoformat(blocked_until_str.replace('Z', '+00:00'))
                if now < blocked_until:
                    return blocked_until
                    
        except Exception as e:
            logger.error("Erreur vérification blocage", error=str(e))
        
        return None
    
    async def _create_block_record(self, identifier_hash: str, scope: RateLimitScope, block_until: datetime, attempts: int):
        """Crée ou met à jour l'enregistrement de blocage"""
        try:
            block_data = {
                "scope": scope.value,
                "identifier": identifier_hash,
                "blocked_until": block_until.isoformat(),
                "attempts": attempts,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Upsert la donnée
            sb.table("rate_limits").upsert(block_data, on_conflict="scope,identifier").execute()
            
        except Exception as e:
            logger.error("Erreur création enregistrement blocage", error=str(e))
    
    async def _record_attempt(self, identifier_hash: str, scope: RateLimitScope, user_agent: str, additional_context: Dict[str, Any], now: datetime):
        """Enregistre une tentative d'accès pour audit"""
        try:
            await create_event({
                "type": f"{scope.value}_attempt",
                "ts": now.isoformat(),
                "actor_user_id": None,
                "payload": {
                    "identifier_hash": identifier_hash,
                    "user_agent": user_agent,
                    "scope": scope.value,
                    **(additional_context or {})
                }
            })
        except Exception as e:
            logger.error("Erreur enregistrement tentative", error=str(e))
    
    async def _record_rate_limit_event(self, identifier_hash: str, scope: RateLimitScope, user_agent: str, 
                                     additional_context: Dict[str, Any], attempts: int, limit: int, 
                                     block_until: datetime, now: datetime):
        """Enregistre un événement de rate limiting"""
        try:
            await create_event({
                "type": "rate_limited",
                "ts": now.isoformat(),
                "actor_user_id": None,
                "payload": {
                    "scope": scope.value,
                    "identifier_hash": identifier_hash,
                    "attempts": attempts,
                    "limit": limit,
                    "blocked_until": block_until.isoformat(),
                    "user_agent": user_agent,
                    **(additional_context or {})
                }
            })
        except Exception as e:
            logger.error("Erreur enregistrement rate limit event", error=str(e))
    
    async def reset_rate_limit(self, identifier: str, scope: RateLimitScope) -> bool:
        """
        Réinitialise la limite de taux pour un identifiant (fonction admin)
        """
        try:
            identifier_hash = self.get_identifier_hash(identifier, scope)
            
            # Supprimer de Redis si disponible
            if redis_cache.redis_available and redis_cache.redis_client:
                rule = self.RULES.get(scope)
                if rule:
                    redis_key = self._get_redis_key(identifier_hash, scope, rule.strategy)
                    await redis_cache.redis_client.delete(redis_key)
            
            # Supprimer l'enregistrement de blocage
            sb.table("rate_limits").delete().eq("scope", scope.value).eq("identifier", identifier_hash).execute()
            
            logger.info("Rate limit réinitialisé", scope=scope.value, identifier_hash=identifier_hash[:8])
            return True
            
        except Exception as e:
            logger.error("Échec réinitialisation rate limit", error=str(e))
            return False
    
    async def get_rate_limit_status(self, identifier: str, scope: RateLimitScope) -> Dict[str, Any]:
        """
        Obtient le statut actuel de rate limit pour un identifiant
        """
        try:
            identifier_hash = self.get_identifier_hash(identifier, scope)
            now = datetime.now(timezone.utc)
            rule = self.RULES.get(scope)
            
            if not rule:
                return {"error": "Aucune règle trouvée pour ce scope"}
            
            # Vérifier les enregistrements de blocage
            result = sb.table("rate_limits").select("*").eq("scope", scope.value).eq("identifier", identifier_hash).execute()
            
            blocked_until = None
            is_blocked = False
            attempts = 0
            
            if result.data:
                rate_limit = result.data[0]
                blocked_until = rate_limit.get("blocked_until")
                attempts = rate_limit.get("attempts", 0)
                
                if blocked_until:
                    blocked_until_dt = datetime.fromisoformat(blocked_until.replace('Z', '+00:00'))
                    is_blocked = now < blocked_until_dt
            
            # Obtenir le compteur actuel depuis Redis si possible
            current_usage = 0
            if redis_cache.redis_available and redis_cache.redis_client:
                try:
                    if rule.strategy == RateLimitStrategy.FIXED_WINDOW:
                        window_start = now.replace(second=0, microsecond=0)
                        window_key = self._get_redis_key(identifier_hash, scope, rule.strategy)
                        window_key += f":{int(window_start.timestamp() // rule.window_seconds)}"
                        current_usage = await redis_cache.redis_client.get(window_key) or 0
                        current_usage = int(current_usage)
                    elif rule.strategy == RateLimitStrategy.SLIDING_WINDOW:
                        window_key = self._get_redis_key(identifier_hash, scope, rule.strategy)
                        current_usage = await redis_cache.redis_client.zcard(window_key) or 0
                    elif rule.strategy == RateLimitStrategy.TOKEN_BUCKET:
                        bucket_key = self._get_redis_key(identifier_hash, scope, rule.strategy)
                        bucket_data = await redis_cache.redis_client.hmget(bucket_key, "tokens")
                        remaining_tokens = int(bucket_data[0] or rule.burst_size or rule.requests_per_window)
                        current_usage = (rule.burst_size or rule.requests_per_window) - remaining_tokens
                except Exception:
                    # Fallback vers les tentatives enregistrées
                    current_usage = attempts
            
            return {
                "blocked": is_blocked,
                "current_usage": current_usage,
                "limit": rule.requests_per_window,
                "window_seconds": rule.window_seconds,
                "strategy": rule.strategy.value,
                "blocked_until": blocked_until if is_blocked else None,
                "reset_at": (now + timedelta(seconds=rule.window_seconds)).isoformat() if not is_blocked else None,
                "burst_capacity": rule.burst_size if rule.strategy == RateLimitStrategy.TOKEN_BUCKET else None
            }
            
        except Exception as e:
            logger.error("Erreur obtention statut rate limit", error=str(e))
            return {"error": "Impossible d'obtenir le statut"}
    
    def get_metrics(self) -> Dict[str, Any]:
        """Retourne les métriques du rate limiter"""
        total_requests = self.metrics["total_requests"]
        if total_requests == 0:
            return {**self.metrics, "success_rate": 0.0, "block_rate": 0.0}
        
        success_rate = (self.metrics["allowed"] / total_requests) * 100
        block_rate = ((self.metrics["limited"] + self.metrics["blocked"]) / total_requests) * 100
        
        return {
            **self.metrics,
            "success_rate": round(success_rate, 2),
            "block_rate": round(block_rate, 2)
        }
    
    async def cleanup_expired_blocks(self) -> int:
        """Nettoie les enregistrements de blocage expirés (maintenance)"""
        try:
            now = datetime.now(timezone.utc)
            result = sb.table("rate_limits").delete().lt("blocked_until", now.isoformat()).execute()
            cleaned_count = len(result.data) if result.data else 0
            
            if cleaned_count > 0:
                logger.info(f"Nettoyage de {cleaned_count} enregistrements de blocage expirés")
            
            return cleaned_count
            
        except Exception as e:
            logger.error("Erreur nettoyage blocages expirés", error=str(e))
            return 0

# Instance globale (maintenant non-statique)
rate_limiter = RateLimiter()