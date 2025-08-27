"""
🧪 Tests pour le Connection Manager avec pooling et circuit breaker
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from app.core.connection_manager import (
    ConnectionPoolManager, ConnectionPoolConfig, CircuitBreakerState, RetryStrategy
)


@pytest.mark.asyncio
async def test_connection_manager_successful_operation():
    """
    Test qu'une opération réussie fonctionne normalement
    """
    
    config = ConnectionPoolConfig(
        max_connections=5,
        retry_attempts=3,
        connection_timeout=1.0
    )
    
    manager = ConnectionPoolManager(config)
    
    # Mock operation qui réussit
    async def successful_operation():
        return {"result": "success", "data": [1, 2, 3]}
    
    # Exécuter l'opération
    result = await manager.execute_with_retry(
        operation=successful_operation,
        operation_name="test_operation"
    )
    
    # Vérifier le résultat
    assert result["result"] == "success"
    assert result["data"] == [1, 2, 3]
    
    # Vérifier les stats
    stats = manager.get_pool_stats()
    assert stats["statistics"]["total_requests"] == 1
    assert stats["statistics"]["successful_requests"] == 1
    assert stats["statistics"]["failed_requests"] == 0
    assert stats["statistics"]["success_rate_pct"] == 100.0


@pytest.mark.asyncio
async def test_connection_manager_retry_on_failure():
    """
    Test que les opérations échouées sont retentées
    """
    
    config = ConnectionPoolConfig(
        max_connections=3,
        retry_attempts=3,
        initial_retry_delay=0.1,  # Rapide pour les tests
        retry_strategy=RetryStrategy.FIXED_INTERVAL
    )
    
    manager = ConnectionPoolManager(config)
    
    call_count = 0
    
    # Mock operation qui échoue 2 fois puis réussit
    async def flaky_operation():
        nonlocal call_count
        call_count += 1
        
        if call_count < 3:
            raise ConnectionError(f"Network error attempt {call_count}")
        return {"result": "success_after_retry"}
    
    # Exécuter l'opération
    result = await manager.execute_with_retry(
        operation=flaky_operation,
        operation_name="flaky_test"
    )
    
    # Vérifier le résultat
    assert result["result"] == "success_after_retry"
    assert call_count == 3  # 2 échecs + 1 succès
    
    # Vérifier les stats
    stats = manager.get_pool_stats()
    assert stats["statistics"]["total_requests"] == 1  # 1 requête logique
    assert stats["statistics"]["successful_requests"] == 1


@pytest.mark.asyncio
async def test_connection_manager_max_retries_exceeded():
    """
    Test qu'une opération qui échoue toujours finit par lever une exception
    """
    
    config = ConnectionPoolConfig(
        retry_attempts=2,
        initial_retry_delay=0.1
    )
    
    manager = ConnectionPoolManager(config)
    
    # Mock operation qui échoue toujours
    async def always_failing_operation():
        raise ConnectionError("Persistent network error")
    
    # Doit lever une exception après épuisement des tentatives
    with pytest.raises(ConnectionError, match="Persistent network error"):
        await manager.execute_with_retry(
            operation=always_failing_operation,
            operation_name="failing_test"
        )
    
    # Vérifier les stats
    stats = manager.get_pool_stats()
    assert stats["statistics"]["total_requests"] == 1
    assert stats["statistics"]["successful_requests"] == 0
    assert stats["statistics"]["failed_requests"] == 1
    assert stats["statistics"]["success_rate_pct"] == 0.0


@pytest.mark.asyncio 
async def test_circuit_breaker_opens_on_failures():
    """
    Test que le circuit breaker s'ouvre après plusieurs échecs
    """
    
    config = ConnectionPoolConfig(
        retry_attempts=1,  # Pas de retry pour simplifier
        circuit_breaker_threshold=3,
        initial_retry_delay=0.1
    )
    
    manager = ConnectionPoolManager(config)
    
    # Mock operation qui échoue toujours
    async def failing_operation():
        raise ConnectionError("Service down")
    
    # Faire échouer 3 opérations (seuil du circuit breaker)
    for i in range(3):
        with pytest.raises(ConnectionError):
            await manager.execute_with_retry(
                operation=failing_operation,
                operation_name=f"fail_test_{i}"
            )
    
    # Vérifier que le circuit breaker s'est ouvert
    stats = manager.get_pool_stats()
    assert stats["pool_state"]["circuit_breaker_state"] == "open"
    assert stats["statistics"]["circuit_breaker_trips"] == 1
    
    # La prochaine requête doit être bloquée immédiatement
    async def any_operation():
        return "should_not_execute"
    
    with pytest.raises(Exception, match="Circuit breaker OPEN"):
        await manager.execute_with_retry(
            operation=any_operation,
            operation_name="blocked_test"
        )


@pytest.mark.asyncio
async def test_circuit_breaker_recovery():
    """
    Test que le circuit breaker peut se récupérer après timeout
    """
    
    config = ConnectionPoolConfig(
        retry_attempts=1,
        circuit_breaker_threshold=2,
        circuit_breaker_timeout=0.2  # Court timeout pour test
    )
    
    manager = ConnectionPoolManager(config)
    
    # Ouvrir le circuit breaker avec des échecs
    async def failing_operation():
        raise ConnectionError("Temporary failure")
    
    for i in range(2):
        with pytest.raises(ConnectionError):
            await manager.execute_with_retry(
                operation=failing_operation,
                operation_name=f"fail_test_{i}"
            )
    
    # Vérifier que le circuit est ouvert
    assert manager.circuit_state == CircuitBreakerState.OPEN
    
    # Attendre la période de timeout
    await asyncio.sleep(0.3)
    
    # Maintenant une opération qui réussit devrait fermer le circuit
    async def successful_operation():
        return "recovery_success"
    
    result = await manager.execute_with_retry(
        operation=successful_operation,
        operation_name="recovery_test"
    )
    
    assert result == "recovery_success"
    assert manager.circuit_state == CircuitBreakerState.CLOSED


@pytest.mark.asyncio
async def test_connection_timeout_handling():
    """
    Test que les timeouts sont correctement gérés
    """
    
    config = ConnectionPoolConfig(
        connection_timeout=0.2,  # Timeout court
        retry_attempts=2
    )
    
    manager = ConnectionPoolManager(config)
    
    # Mock operation qui prend trop de temps
    async def slow_operation():
        await asyncio.sleep(0.5)  # Plus long que le timeout
        return "too_slow"
    
    # Doit lever une TimeoutError
    with pytest.raises(asyncio.TimeoutError):
        await manager.execute_with_retry(
            operation=slow_operation,
            operation_name="timeout_test"
        )


@pytest.mark.asyncio
async def test_connection_semaphore_limits():
    """
    Test que le sémaphore limite correctement les connexions concurrentes
    """
    
    config = ConnectionPoolConfig(max_connections=2)
    manager = ConnectionPoolManager(config)
    
    active_operations = 0
    max_concurrent = 0
    
    async def monitored_operation():
        nonlocal active_operations, max_concurrent
        active_operations += 1
        max_concurrent = max(max_concurrent, active_operations)
        
        await asyncio.sleep(0.1)  # Simuler du travail
        
        active_operations -= 1
        return f"operation_complete_{active_operations}"
    
    # Lancer 5 opérations concurrentes
    tasks = []
    for i in range(5):
        task = asyncio.create_task(
            manager.execute_with_retry(
                operation=monitored_operation,
                operation_name=f"concurrent_test_{i}"
            )
        )
        tasks.append(task)
    
    # Attendre toutes les tâches
    results = await asyncio.gather(*tasks)
    
    # Vérifier que max 2 connexions étaient actives simultanément
    assert max_concurrent <= 2
    assert len(results) == 5  # Toutes ont réussi


def test_retry_delay_calculation():
    """
    Test des différentes stratégies de calcul de délai de retry
    """
    
    # Test exponential backoff
    config_exp = ConnectionPoolConfig(
        initial_retry_delay=1.0,
        retry_strategy=RetryStrategy.EXPONENTIAL_BACKOFF,
        max_retry_delay=10.0
    )
    
    manager_exp = ConnectionPoolManager(config_exp)
    
    assert manager_exp._calculate_retry_delay(1) == 1.0   # 1 * 2^0
    assert manager_exp._calculate_retry_delay(2) == 2.0   # 1 * 2^1
    assert manager_exp._calculate_retry_delay(3) == 4.0   # 1 * 2^2
    assert manager_exp._calculate_retry_delay(4) == 8.0   # 1 * 2^3
    assert manager_exp._calculate_retry_delay(5) == 10.0  # Plafond à max_retry_delay
    
    # Test linear backoff
    config_lin = ConnectionPoolConfig(
        initial_retry_delay=2.0,
        retry_strategy=RetryStrategy.LINEAR_BACKOFF,
        max_retry_delay=10.0
    )
    
    manager_lin = ConnectionPoolManager(config_lin)
    
    assert manager_lin._calculate_retry_delay(1) == 2.0   # 2 * 1
    assert manager_lin._calculate_retry_delay(2) == 4.0   # 2 * 2
    assert manager_lin._calculate_retry_delay(3) == 6.0   # 2 * 3
    assert manager_lin._calculate_retry_delay(10) == 10.0 # Plafond
    
    # Test fixed interval
    config_fixed = ConnectionPoolConfig(
        initial_retry_delay=3.0,
        retry_strategy=RetryStrategy.FIXED_INTERVAL
    )
    
    manager_fixed = ConnectionPoolManager(config_fixed)
    
    assert manager_fixed._calculate_retry_delay(1) == 3.0
    assert manager_fixed._calculate_retry_delay(5) == 3.0
    assert manager_fixed._calculate_retry_delay(100) == 3.0


@pytest.mark.asyncio
async def test_health_check():
    """
    Test du health check du connection manager
    """
    
    manager = ConnectionPoolManager()
    
    # Initially healthy
    health = await manager.health_check()
    assert health["healthy"] is True
    assert health["circuit_breaker_state"] == "closed"
    assert health["success_rate_pct"] == 100
    
    # Simuler quelques échecs
    for i in range(2):
        manager.stats.total_requests += 1
        manager.stats.failed_requests += 1
    
    # Should still be healthy (< 33% failure rate)
    health = await manager.health_check()
    assert health["healthy"] is True
    
    # Ajouter plus d'échecs pour dépasser le seuil
    for i in range(5):
        manager.stats.failed_requests += 1
        manager.stats.total_requests += 1
    
    # Now should be unhealthy
    health = await manager.health_check()
    assert health["healthy"] is False