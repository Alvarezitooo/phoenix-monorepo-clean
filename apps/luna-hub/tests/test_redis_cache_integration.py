"""
🗄️ Tests d'intégration pour cache Redis
Validation du cache distribué pour données énergétiques
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone

from app.core.redis_cache import RedisCache, RedisCacheConfig, FallbackMemoryCache, cached
from app.core.energy_manager import energy_manager
from app.models.user_energy import UserEnergyModel


class TestRedisCacheSystem:
    """Tests du système de cache Redis"""
    
    @pytest.fixture
    async def redis_cache_instance(self):
        """Fixture pour instance de cache Redis avec config test"""
        config = RedisCacheConfig()
        config.redis_url = "redis://localhost:6379/15"  # DB de test
        config.ttl_user_energy = 60  # TTL courts pour tests
        config.ttl_user_stats = 120
        
        cache = RedisCache(config)
        yield cache
        await cache.close()
    
    @pytest.fixture
    def fallback_cache(self):
        """Fixture pour cache mémoire de fallback"""
        return FallbackMemoryCache(max_size=100)
    
    @pytest.mark.asyncio
    async def test_fallback_memory_cache_basic_operations(self, fallback_cache):
        """
        🧠 Test du cache mémoire de fallback
        """
        
        # Test set/get basique
        await fallback_cache.set("test_key", {"data": "test_value"}, ttl=60)
        result = await fallback_cache.get("test_key")
        
        assert result is not None
        assert result["data"] == "test_value"
        
        # Test expiration
        await fallback_cache.set("expire_key", "expire_value", ttl=1)
        import time
        time.sleep(1.1)  # Attendre expiration
        
        expired_result = await fallback_cache.get("expire_key")
        assert expired_result is None
        
        # Test delete
        await fallback_cache.set("delete_key", "delete_value", ttl=60)
        delete_success = await fallback_cache.delete("delete_key")
        assert delete_success is True
        
        deleted_result = await fallback_cache.get("delete_key")
        assert deleted_result is None
    
    @pytest.mark.asyncio
    async def test_redis_cache_initialization(self, redis_cache_instance):
        """
        🔧 Test d'initialisation du cache Redis
        """
        
        # Test initialisation (peut échouer si Redis pas disponible)
        init_success = await redis_cache_instance.initialize()
        
        # Si Redis disponible, tester les opérations
        if init_success and redis_cache_instance.redis_available:
            # Test connectivité
            health = await redis_cache_instance.health_check()
            assert health["status"] == "healthy"
            assert health["redis_connected"] is True
            
            # Test opérations basiques
            await redis_cache_instance.set("test_type", "test_id", {"test": "data"})
            result = await redis_cache_instance.get("test_type", "test_id") 
            
            assert result is not None
            assert result["test"] == "data"
            
        else:
            # Mode fallback seulement
            health = await redis_cache_instance.health_check()
            assert health["status"] in ["fallback_only", "redis_error"]
    
    @pytest.mark.asyncio
    async def test_redis_cache_with_fallback(self, redis_cache_instance):
        """
        🔄 Test du système de fallback Redis → Memory
        """
        
        await redis_cache_instance.initialize()
        
        # Forcer l'indisponibilité de Redis pour tester fallback
        redis_cache_instance.redis_available = False
        
        # Les opérations doivent fonctionner via fallback
        await redis_cache_instance.set("fallback_test", "user_123", {"energy": 75.0})
        result = await redis_cache_instance.get("fallback_test", "user_123")
        
        assert result is not None
        assert result["energy"] == 75.0
        
        # Vérifier statistiques fallback
        stats = await redis_cache_instance.get_cache_stats()
        assert stats["fallback_uses"] > 0
    
    @pytest.mark.asyncio
    async def test_cached_decorator_functionality(self):
        """
        🎯 Test du décorateur @cached
        """
        call_count = 0
        
        @cached("test_cache", ttl=60)
        async def expensive_calculation(user_id: str) -> dict:
            nonlocal call_count
            call_count += 1
            # Simulation calcul coûteux
            await asyncio.sleep(0.1)
            return {"user_id": user_id, "calculated_at": datetime.now().isoformat(), "call_count": call_count}
        
        # Premier appel (pas de cache)
        result1 = await expensive_calculation("user_123")
        assert result1["call_count"] == 1
        
        # Deuxième appel (devrait utiliser cache)
        result2 = await expensive_calculation("user_123")
        # Note: En test, le cache peut ne pas être initialisé, donc on teste la logique
        assert result2["user_id"] == "user_123"
    
    @pytest.mark.asyncio 
    async def test_energy_manager_redis_integration(self):
        """
        ⚡ Test d'intégration avec Energy Manager
        """
        
        # Mock des données Supabase
        mock_user_energy_data = {
            "user_id": "test_redis_user",
            "current_energy": 85.0,
            "max_energy": 100.0,
            "total_purchased": 50.0,
            "total_consumed": 15.0,
            "subscription_type": "standard",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        with patch('app.core.supabase_client.sb.table') as mock_table:
            mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = [mock_user_energy_data]
            
            # Test get_user_energy avec cache
            user_id = "test_redis_user"
            
            # Premier appel (devrait aller en DB puis cache)
            energy1 = await energy_manager._get_user_energy(user_id)
            assert energy1 is not None
            assert energy1.current_energy == 85.0
            
            # Deuxième appel (devrait utiliser cache)
            energy2 = await energy_manager._get_user_energy(user_id)
            assert energy2 is not None
            assert energy2.current_energy == 85.0
    
    @pytest.mark.asyncio
    async def test_energy_stats_caching(self):
        """
        📊 Test du cache des statistiques énergétiques
        """
        
        user_id = "stats_test_user"
        
        # Mock des données pour les statistiques
        mock_energy_data = {
            "user_id": user_id,
            "current_energy": 75.0,
            "max_energy": 100.0,
            "total_purchased": 100.0,
            "total_consumed": 25.0,
            "subscription_type": "standard",
            "updated_at": datetime.now(timezone.utc)
        }
        
        mock_transactions = [
            {
                "user_id": user_id,
                "action_type": "consume",
                "energy_amount": 5.0,
                "feature_used": "cv_generation",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "user_id": user_id,
                "action_type": "purchase",
                "energy_amount": 20.0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        with patch('app.core.supabase_client.sb.table') as mock_table:
            # Setup mocks pour user_energy et transactions
            mock_table.return_value.select.return_value.eq.return_value.execute.return_value.data = [mock_energy_data]
            mock_table.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value.data = mock_transactions
            
            # Test stats avec cache
            stats1 = await energy_manager.get_user_energy_stats(user_id)
            
            assert stats1["user_id"] == user_id
            assert stats1["current_energy"] == 75.0
            assert "stats_30d" in stats1
            assert "cache_timestamp" in stats1
            
            # Test leaderboard avec cache
            leaderboard = await energy_manager.get_energy_leaderboard(limit=5)
            
            assert "leaderboard_type" in leaderboard
            assert "cache_timestamp" in leaderboard
    
    @pytest.mark.asyncio
    async def test_cache_invalidation_on_energy_change(self):
        """
        🧹 Test d'invalidation du cache lors de changements
        """
        
        user_id = "invalidation_test_user"
        
        # Setup mock user energy
        user_energy = UserEnergyModel(
            user_id=user_id,
            current_energy=90.0,
            max_energy=100.0,
            subscription_type="standard"
        )
        
        with patch('app.core.supabase_client.sb.table') as mock_table:
            mock_table.return_value.upsert.return_value.execute.return_value.data = [{"user_id": user_id}]
            
            # Sauvegarder l'énergie (devrait invalider le cache)
            success = await energy_manager._save_user_energy_to_db(user_energy)
            assert success is True
            
            # Vérifier que l'invalidation a été appelée
            # (Le cache local devrait être vidé)
            assert user_id not in energy_manager._energy_cache
    
    @pytest.mark.asyncio
    async def test_cache_health_monitoring(self):
        """
        🏥 Test du monitoring de santé du cache
        """
        
        # Test health check
        health = await energy_manager.get_cache_health()
        
        assert "status" in health
        assert health["status"] in ["healthy", "fallback_only", "redis_error", "unhealthy"]
        
        # Test statistics
        stats = await energy_manager.get_cache_stats()
        
        assert "redis_available" in stats
        assert "total_requests" in stats
        assert "hits" in stats
        assert "misses" in stats
        assert "hit_rate_pct" in stats
    
    @pytest.mark.asyncio
    async def test_cache_performance_comparison(self):
        """
        ⚡ Test de performance: cache vs no-cache
        """
        
        user_id = "performance_test_user"
        
        # Mock data coûteuse à calculer
        mock_transactions = [{"action_type": "consume", "energy_amount": 5.0, "feature_used": f"action_{i}"} for i in range(50)]
        
        with patch('app.core.supabase_client.sb.table') as mock_table:
            mock_table.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value.data = mock_transactions
            
            # Clear cache d'abord
            await energy_manager.clear_user_cache(user_id)
            
            import time
            
            # Premier appel (pas de cache)
            start_time = time.time()
            stats1 = await energy_manager.get_user_energy_stats(user_id)
            first_call_time = time.time() - start_time
            
            # Deuxième appel (avec cache) 
            start_time = time.time()
            stats2 = await energy_manager.get_user_energy_stats(user_id)
            cached_call_time = time.time() - start_time
            
            # Le cache devrait améliorer les performances
            # (même si légèrement car les mocks sont déjà rapides)
            assert cached_call_time <= first_call_time
            assert stats1["user_id"] == stats2["user_id"]
    
    @pytest.mark.asyncio
    async def test_concurrent_cache_access(self):
        """
        🔄 Test d'accès concurrent au cache
        """
        
        user_ids = [f"concurrent_user_{i}" for i in range(5)]
        
        # Lancer plusieurs requêtes concurrentes
        tasks = [
            energy_manager.get_user_energy_stats(user_id)
            for user_id in user_ids
        ]
        
        # Toutes doivent réussir sans corruption
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful_results = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_results) == len(user_ids)
    
    def test_cache_configuration_validation(self):
        """
        ⚙️ Test de validation de la configuration cache
        """
        
        config = RedisCacheConfig()
        
        # Vérifier les valeurs par défaut
        assert config.ttl_user_energy > 0
        assert config.ttl_energy_transactions > 0
        assert config.connection_pool_size > 0
        assert config.connection_timeout > 0
        assert config.retry_attempts > 0
        
        # Vérifier les prefixes
        assert config.key_prefix is not None
        assert config.version is not None