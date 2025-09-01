"""
🧪 Tests pour le système de rate limiting robuste
Validation des stratégies multi-algorithmes et intégration Redis
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone, timedelta

from app.core.rate_limiter import RateLimiter, RateLimitScope, RateLimitStrategy, RateLimitResult, RateLimitRule


class TestRateLimiterSystem:
    """Tests du système complet de rate limiting"""
    
    @pytest.fixture
    def rate_limiter_instance(self):
        """Instance de rate limiter pour les tests"""
        return RateLimiter()
    
    @pytest.fixture
    def mock_redis_available(self):
        """Mock Redis disponible pour les tests"""
        with patch('app.core.redis_cache.redis_cache') as mock_cache:
            mock_cache.redis_available = True
            mock_cache.redis_client = AsyncMock()
            yield mock_cache
    
    @pytest.mark.asyncio
    async def test_rate_limiter_initialization(self, rate_limiter_instance):
        """
        🔧 Test d'initialisation du rate limiter
        """
        
        # Vérifier l'initialisation
        assert rate_limiter_instance.metrics["total_requests"] == 0
        assert rate_limiter_instance.metrics["allowed"] == 0
        assert rate_limiter_instance.lua_scripts_loaded is False
        
        # Vérifier les règles configurées
        assert RateLimitScope.AUTH_LOGIN in rate_limiter_instance.RULES
        assert RateLimitScope.API_GENERAL in rate_limiter_instance.RULES
        
        # Vérifier une règle spécifique
        auth_rule = rate_limiter_instance.RULES[RateLimitScope.AUTH_LOGIN]
        assert auth_rule.strategy == RateLimitStrategy.SLIDING_WINDOW
        assert auth_rule.requests_per_window == 5
        assert auth_rule.window_seconds == 900  # 15 minutes
    
    @pytest.mark.asyncio
    async def test_identifier_hashing(self, rate_limiter_instance):
        """
        🔐 Test du hachage des identifiants pour confidentialité
        """
        
        identifier = "user@example.com"
        scope = RateLimitScope.AUTH_LOGIN
        
        hash1 = rate_limiter_instance.get_identifier_hash(identifier, scope)
        hash2 = rate_limiter_instance.get_identifier_hash(identifier, scope)
        hash3 = rate_limiter_instance.get_identifier_hash(identifier, RateLimitScope.API_GENERAL)
        
        # Hash cohérent pour même identifiant/scope
        assert hash1 == hash2
        
        # Hash différent pour scope différent
        assert hash1 != hash3
        
        # Hash court pour stockage efficace
        assert len(hash1) == 16
        
        # Hash ne révèle pas l'identifiant original
        assert identifier not in hash1
    
    @pytest.mark.asyncio
    async def test_fallback_to_event_store(self, rate_limiter_instance):
        """
        🔄 Test du fallback vers event store quand Redis indisponible
        """
        
        identifier = "test_user"
        scope = RateLimitScope.AUTH_LOGIN
        rule = rate_limiter_instance.RULES[scope]
        now = datetime.now(timezone.utc)
        identifier_hash = rate_limiter_instance.get_identifier_hash(identifier, scope)
        
        # Mock Supabase responses
        with patch('app.core.supabase_client.sb.table') as mock_table:
            # Aucun événement existant
            mock_table.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value.data = []
            
            # Test du fallback
            allowed, current_count, limit = await rate_limiter_instance._fallback_to_event_store(
                rule, identifier_hash, now
            )
            
            assert allowed is True  # Première requête autorisée
            assert current_count == 0
            assert limit == rule.requests_per_window
    
    @pytest.mark.asyncio
    async def test_fixed_window_strategy(self, rate_limiter_instance, mock_redis_available):
        """
        🪟 Test de la stratégie fenêtre fixe
        """
        
        identifier = "test_user"
        scope = RateLimitScope.AUTH_REGISTER  # Utilise FIXED_WINDOW
        rule = rate_limiter_instance.RULES[scope]
        now = datetime.now(timezone.utc)
        identifier_hash = rate_limiter_instance.get_identifier_hash(identifier, scope)
        
        # Mock Redis pour simuler compteur
        mock_redis_available.redis_client.incr.return_value = 1
        mock_redis_available.redis_client.expire.return_value = True
        
        # Test première requête
        allowed, current_count, limit = await rate_limiter_instance._check_fixed_window(
            rule, identifier_hash, now
        )
        
        assert allowed is True
        assert current_count == 1
        assert limit == rule.requests_per_window
        
        # Vérifier appel Redis
        mock_redis_available.redis_client.incr.assert_called_once()
        mock_redis_available.redis_client.expire.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_sliding_window_strategy(self, rate_limiter_instance, mock_redis_available):
        """
        🔄 Test de la stratégie fenêtre glissante avec script Lua
        """
        
        identifier = "test_user"
        scope = RateLimitScope.AUTH_LOGIN  # Utilise SLIDING_WINDOW
        rule = rate_limiter_instance.RULES[scope]
        now = datetime.now(timezone.utc)
        identifier_hash = rate_limiter_instance.get_identifier_hash(identifier, scope)
        
        # Marquer les scripts Lua comme chargés
        rate_limiter_instance.lua_scripts_loaded = True
        
        # Mock Redis eval pour script Lua
        mock_redis_available.redis_client.eval.return_value = [1, 2, 5]  # allowed, current, limit
        
        # Test de la stratégie
        allowed, current_count, limit = await rate_limiter_instance._check_sliding_window(
            rule, identifier_hash, now
        )
        
        assert allowed is True
        assert current_count == 2
        assert limit == 5
        
        # Vérifier appel du script Lua
        mock_redis_available.redis_client.eval.assert_called_once_with(
            rate_limiter_instance.SLIDING_WINDOW_SCRIPT,
            1,  # nombre de clés
            pytest.approx(f"ratelimit:sliding_window:{scope.value}:{identifier_hash}", abs=50),
            rule.window_seconds,
            rule.requests_per_window,
            pytest.approx(int(now.timestamp()), abs=2),
            identifier_hash
        )
    
    @pytest.mark.asyncio
    async def test_token_bucket_strategy(self, rate_limiter_instance, mock_redis_available):
        """
        🪣 Test de la stratégie token bucket avec rafales
        """
        
        identifier = "test_user"
        scope = RateLimitScope.API_GENERAL  # Utilise TOKEN_BUCKET
        rule = rate_limiter_instance.RULES[scope]
        now = datetime.now(timezone.utc)
        identifier_hash = rate_limiter_instance.get_identifier_hash(identifier, scope)
        
        # Marquer les scripts Lua comme chargés
        rate_limiter_instance.lua_scripts_loaded = True
        
        # Mock Redis eval pour token bucket
        mock_redis_available.redis_client.eval.return_value = [1, 15, 20]  # allowed, remaining_tokens, capacity
        
        # Test de la stratégie
        allowed, current_count, limit = await rate_limiter_instance._check_token_bucket(
            rule, identifier_hash, now
        )
        
        assert allowed is True
        assert current_count == 5  # capacity - remaining = 20 - 15
        assert limit == 20  # capacity
        
        # Vérifier appel du script Lua
        mock_redis_available.redis_client.eval.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_allowed(self, rate_limiter_instance):
        """
        ✅ Test d'une requête autorisée par rate limiting
        """
        
        identifier = "allowed_user"
        scope = RateLimitScope.API_GENERAL
        
        # Mock des méthodes internes pour simuler autorisation
        with patch.object(rate_limiter_instance, '_check_existing_block', return_value=None), \
             patch.object(rate_limiter_instance, '_check_token_bucket', return_value=(True, 5, 100)), \
             patch.object(rate_limiter_instance, '_record_attempt', return_value=None):
            
            result, context = await rate_limiter_instance.check_rate_limit(
                identifier=identifier,
                scope=scope,
                user_agent="test-client",
                additional_context={"test": True}
            )
            
            assert result == RateLimitResult.ALLOWED
            assert context["scope"] == scope.value
            assert context["current_count"] == 5
            assert context["limit"] == 100
            assert "reset_at" in context
            
            # Vérifier les métriques
            assert rate_limiter_instance.metrics["total_requests"] == 1
            assert rate_limiter_instance.metrics["allowed"] == 1
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_exceeded(self, rate_limiter_instance):
        """
        🚫 Test d'une requête limitée (seuil dépassé)
        """
        
        identifier = "limited_user"
        scope = RateLimitScope.API_GENERAL
        
        # Mock des méthodes internes pour simuler dépassement
        with patch.object(rate_limiter_instance, '_check_existing_block', return_value=None), \
             patch.object(rate_limiter_instance, '_check_token_bucket', return_value=(False, 100, 100)), \
             patch.object(rate_limiter_instance, '_create_block_record', return_value=None), \
             patch.object(rate_limiter_instance, '_record_rate_limit_event', return_value=None):
            
            result, context = await rate_limiter_instance.check_rate_limit(
                identifier=identifier,
                scope=scope,
                user_agent="test-client"
            )
            
            assert result == RateLimitResult.LIMITED
            assert context["scope"] == scope.value
            assert context["current_count"] == 100
            assert context["limit"] == 100
            assert "blocked_until" in context
            assert "block_duration_seconds" in context
            
            # Vérifier les métriques
            assert rate_limiter_instance.metrics["limited"] == 1
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_blocked(self, rate_limiter_instance):
        """
        🔒 Test d'un identifiant déjà bloqué
        """
        
        identifier = "blocked_user"
        scope = RateLimitScope.API_GENERAL
        blocked_until = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        # Mock pour simuler blocage existant
        with patch.object(rate_limiter_instance, '_check_existing_block', return_value=blocked_until):
            
            result, context = await rate_limiter_instance.check_rate_limit(
                identifier=identifier,
                scope=scope
            )
            
            assert result == RateLimitResult.BLOCKED
            assert context["blocked_until"] == blocked_until.isoformat()
            assert context["scope"] == scope.value
            
            # Vérifier les métriques
            assert rate_limiter_instance.metrics["blocked"] == 1
    
    @pytest.mark.asyncio
    async def test_reset_rate_limit(self, rate_limiter_instance, mock_redis_available):
        """
        🔄 Test de la réinitialisation de rate limit
        """
        
        identifier = "reset_user"
        scope = RateLimitScope.AUTH_LOGIN
        
        # Mock Redis delete
        mock_redis_available.redis_client.delete.return_value = 1
        
        # Mock Supabase delete
        with patch('app.core.supabase_client.sb.table') as mock_table:
            mock_table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()
            
            success = await rate_limiter_instance.reset_rate_limit(identifier, scope)
            
            assert success is True
            mock_redis_available.redis_client.delete.assert_called_once()
            mock_table.return_value.delete.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_rate_limit_status(self, rate_limiter_instance, mock_redis_available):
        """
        📊 Test de l'obtention du statut de rate limit
        """
        
        identifier = "status_user"
        scope = RateLimitScope.API_GENERAL
        
        # Mock Redis pour token bucket
        mock_redis_available.redis_client.hmget.return_value = ["15"]  # 15 tokens restants
        
        # Mock Supabase - pas de blocage
        with patch('app.core.supabase_client.sb.table') as mock_table:
            mock_table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
            
            status = await rate_limiter_instance.get_rate_limit_status(identifier, scope)
            
            assert status["blocked"] is False
            assert status["strategy"] == "token_bucket"
            assert "current_usage" in status
            assert "limit" in status
            assert "window_seconds" in status
            assert status["burst_capacity"] == 20  # burst_size pour API_GENERAL
    
    @pytest.mark.asyncio
    async def test_cleanup_expired_blocks(self, rate_limiter_instance):
        """
        🧹 Test du nettoyage des blocages expirés
        """
        
        # Mock Supabase delete avec résultat
        with patch('app.core.supabase_client.sb.table') as mock_table:
            mock_table.return_value.delete.return_value.lt.return_value.execute.return_value.data = [
                {"id": 1}, {"id": 2}, {"id": 3}
            ]
            
            cleaned_count = await rate_limiter_instance.cleanup_expired_blocks()
            
            assert cleaned_count == 3
            mock_table.return_value.delete.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_metrics_calculation(self, rate_limiter_instance):
        """
        📈 Test du calcul des métriques
        """
        
        # Simuler quelques requêtes
        rate_limiter_instance.metrics["total_requests"] = 100
        rate_limiter_instance.metrics["allowed"] = 80
        rate_limiter_instance.metrics["limited"] = 15
        rate_limiter_instance.metrics["blocked"] = 5
        
        metrics = rate_limiter_instance.get_metrics()
        
        assert metrics["total_requests"] == 100
        assert metrics["success_rate"] == 80.0  # 80/100
        assert metrics["block_rate"] == 20.0   # (15+5)/100
        assert "allowed" in metrics
        assert "limited" in metrics
    
    @pytest.mark.asyncio
    async def test_fail_open_behavior(self, rate_limiter_instance):
        """
        🔓 Test du comportement fail-open en cas d'erreur
        """
        
        identifier = "error_user"
        scope = RateLimitScope.API_GENERAL
        
        # Mock pour lever une exception dans la vérification
        with patch.object(rate_limiter_instance, '_check_existing_block', side_effect=Exception("Test error")):
            
            result, context = await rate_limiter_instance.check_rate_limit(
                identifier=identifier,
                scope=scope
            )
            
            # Doit autoriser la requête en cas d'erreur (fail open)
            assert result == RateLimitResult.ALLOWED
            assert "error" in context
            assert rate_limiter_instance.metrics["redis_errors"] == 1