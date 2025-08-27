"""
🔄 Connection Manager - Phoenix Luna Hub
Connection pooling et retry automatique pour Supabase
Directive Oracle: Stabilité & Résilience
"""

import asyncio
import time
from typing import Optional, Dict, Any, Callable, Union
from dataclasses import dataclass
from enum import Enum
import structlog
from datetime import datetime, timezone

logger = structlog.get_logger()


class RetryStrategy(Enum):
    """Stratégies de retry"""
    EXPONENTIAL_BACKOFF = "exponential"
    LINEAR_BACKOFF = "linear" 
    FIXED_INTERVAL = "fixed"


@dataclass
class ConnectionPoolConfig:
    """Configuration du pool de connexions"""
    min_connections: int = 2
    max_connections: int = 10
    connection_timeout: float = 30.0
    idle_timeout: float = 300.0  # 5 minutes
    retry_attempts: int = 3
    retry_strategy: RetryStrategy = RetryStrategy.EXPONENTIAL_BACKOFF
    initial_retry_delay: float = 1.0
    max_retry_delay: float = 30.0
    circuit_breaker_threshold: int = 5
    circuit_breaker_timeout: float = 60.0


@dataclass  
class ConnectionStats:
    """Statistiques de connexions"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    retried_requests: int = 0
    circuit_breaker_trips: int = 0
    avg_response_time_ms: float = 0.0
    last_error: Optional[str] = None
    last_success: Optional[datetime] = None


class CircuitBreakerState(Enum):
    """États du circuit breaker"""
    CLOSED = "closed"      # Normal
    OPEN = "open"         # Bloqué
    HALF_OPEN = "half_open"  # Test


class ConnectionPoolManager:
    """
    🔄 Gestionnaire de pool de connexions avec circuit breaker
    
    Features:
    - Pool de connexions configurables
    - Retry automatique avec backoff
    - Circuit breaker pour éviter cascades
    - Métriques et monitoring
    - Health checks périodiques
    """
    
    def __init__(self, config: Optional[ConnectionPoolConfig] = None):
        self.config = config or ConnectionPoolConfig()
        self.stats = ConnectionStats()
        
        # Circuit breaker
        self.circuit_state = CircuitBreakerState.CLOSED
        self.circuit_failure_count = 0
        self.circuit_last_failure = None
        self.circuit_next_attempt = None
        
        # Pool state
        self.active_connections = 0
        self.connection_semaphore = asyncio.Semaphore(self.config.max_connections)
        
        logger.info("Connection Pool Manager initialized", 
                   max_connections=self.config.max_connections,
                   retry_attempts=self.config.retry_attempts)
    
    async def execute_with_retry(
        self,
        operation: Callable,
        operation_name: str = "database_operation",
        **kwargs
    ) -> Any:
        """
        🔄 Exécute une opération avec retry automatique et circuit breaker
        
        Args:
            operation: Fonction à exécuter  
            operation_name: Nom pour logging
            **kwargs: Arguments pour l'opération
            
        Returns:
            Résultat de l'opération
            
        Raises:
            Exception: Si toutes les tentatives échouent
        """
        
        # Vérifier circuit breaker
        if not await self._check_circuit_breaker():
            raise Exception(f"Circuit breaker OPEN for {operation_name}")
        
        last_exception = None
        start_time = time.time()
        
        for attempt in range(1, self.config.retry_attempts + 1):
            try:
                # Acquérir une connexion du pool
                async with self.connection_semaphore:
                    self.active_connections += 1
                    
                    try:
                        # Exécuter l'opération avec timeout
                        result = await asyncio.wait_for(
                            operation(**kwargs),
                            timeout=self.config.connection_timeout
                        )
                        
                        # Succès !
                        await self._record_success(start_time)
                        return result
                        
                    finally:
                        self.active_connections -= 1
                        
            except asyncio.TimeoutError as e:
                last_exception = e
                logger.warning("Operation timeout", 
                             operation=operation_name,
                             attempt=attempt,
                             timeout=self.config.connection_timeout)
                             
            except Exception as e:
                last_exception = e
                logger.warning("Operation failed",
                             operation=operation_name, 
                             attempt=attempt,
                             error=str(e))
            
            # Retry delay (sauf dernière tentative)
            if attempt < self.config.retry_attempts:
                delay = self._calculate_retry_delay(attempt)
                logger.info("Retrying operation",
                           operation=operation_name,
                           attempt=attempt,
                           next_attempt_in=f"{delay}s")
                await asyncio.sleep(delay)
        
        # Toutes les tentatives ont échoué
        await self._record_failure(last_exception)
        raise last_exception
    
    def _calculate_retry_delay(self, attempt: int) -> float:
        """📈 Calcule le délai de retry selon la stratégie"""
        
        if self.config.retry_strategy == RetryStrategy.FIXED_INTERVAL:
            return self.config.initial_retry_delay
            
        elif self.config.retry_strategy == RetryStrategy.LINEAR_BACKOFF:
            delay = self.config.initial_retry_delay * attempt
            
        elif self.config.retry_strategy == RetryStrategy.EXPONENTIAL_BACKOFF:
            delay = self.config.initial_retry_delay * (2 ** (attempt - 1))
        
        # Appliquer le maximum
        return min(delay, self.config.max_retry_delay)
    
    async def _check_circuit_breaker(self) -> bool:
        """⚡ Vérification du circuit breaker"""
        
        now = time.time()
        
        if self.circuit_state == CircuitBreakerState.CLOSED:
            return True
            
        elif self.circuit_state == CircuitBreakerState.OPEN:
            # Vérifier si on peut passer en HALF_OPEN
            if (self.circuit_next_attempt and 
                now >= self.circuit_next_attempt):
                self.circuit_state = CircuitBreakerState.HALF_OPEN
                logger.info("Circuit breaker: OPEN → HALF_OPEN")
                return True
            return False
            
        elif self.circuit_state == CircuitBreakerState.HALF_OPEN:
            # En test - autoriser une tentative
            return True
        
        return False
    
    async def _record_success(self, start_time: float) -> None:
        """✅ Enregistre un succès"""
        
        response_time = (time.time() - start_time) * 1000  # ms
        
        self.stats.total_requests += 1
        self.stats.successful_requests += 1
        self.stats.last_success = datetime.now(timezone.utc)
        
        # Mettre à jour moyenne response time
        if self.stats.avg_response_time_ms == 0:
            self.stats.avg_response_time_ms = response_time
        else:
            # Moyenne mobile
            self.stats.avg_response_time_ms = (
                self.stats.avg_response_time_ms * 0.9 + response_time * 0.1
            )
        
        # Circuit breaker: succès
        if self.circuit_state == CircuitBreakerState.HALF_OPEN:
            # Retour à CLOSED après succès en HALF_OPEN
            self.circuit_state = CircuitBreakerState.CLOSED
            self.circuit_failure_count = 0
            logger.info("Circuit breaker: HALF_OPEN → CLOSED (success)")
        elif self.circuit_state == CircuitBreakerState.CLOSED:
            # Reset failure count on success
            self.circuit_failure_count = max(0, self.circuit_failure_count - 1)
    
    async def _record_failure(self, exception: Exception) -> None:
        """❌ Enregistre un échec"""
        
        self.stats.total_requests += 1
        self.stats.failed_requests += 1
        self.stats.last_error = str(exception)
        
        # Circuit breaker: échec
        self.circuit_failure_count += 1
        
        if self.circuit_failure_count >= self.config.circuit_breaker_threshold:
            if self.circuit_state != CircuitBreakerState.OPEN:
                self.circuit_state = CircuitBreakerState.OPEN
                self.circuit_next_attempt = time.time() + self.config.circuit_breaker_timeout
                self.stats.circuit_breaker_trips += 1
                
                logger.error("Circuit breaker OPENED",
                           failure_count=self.circuit_failure_count,
                           threshold=self.config.circuit_breaker_threshold,
                           next_attempt_in=f"{self.config.circuit_breaker_timeout}s")
    
    def get_pool_stats(self) -> Dict[str, Any]:
        """📊 Statistiques du pool de connexions"""
        
        success_rate = (
            (self.stats.successful_requests / self.stats.total_requests * 100)
            if self.stats.total_requests > 0 else 0
        )
        
        return {
            "pool_config": {
                "max_connections": self.config.max_connections,
                "connection_timeout": self.config.connection_timeout,
                "retry_attempts": self.config.retry_attempts,
                "retry_strategy": self.config.retry_strategy.value
            },
            "pool_state": {
                "active_connections": self.active_connections,
                "circuit_breaker_state": self.circuit_state.value,
                "circuit_failure_count": self.circuit_failure_count
            },
            "statistics": {
                "total_requests": self.stats.total_requests,
                "successful_requests": self.stats.successful_requests,
                "failed_requests": self.stats.failed_requests,
                "success_rate_pct": round(success_rate, 2),
                "avg_response_time_ms": round(self.stats.avg_response_time_ms, 2),
                "circuit_breaker_trips": self.stats.circuit_breaker_trips,
                "last_error": self.stats.last_error,
                "last_success": self.stats.last_success.isoformat() if self.stats.last_success else None
            }
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """🏥 Health check du pool"""
        
        is_healthy = (
            self.circuit_state != CircuitBreakerState.OPEN and
            self.stats.failed_requests < self.stats.successful_requests * 2  # Max 33% échec
        )
        
        return {
            "healthy": is_healthy,
            "circuit_breaker_state": self.circuit_state.value,
            "active_connections": self.active_connections,
            "success_rate_pct": (
                (self.stats.successful_requests / self.stats.total_requests * 100)
                if self.stats.total_requests > 0 else 100
            ),
            "avg_response_time_ms": round(self.stats.avg_response_time_ms, 2)
        }


# Instance globale
connection_manager = ConnectionPoolManager()