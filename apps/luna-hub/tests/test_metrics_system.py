"""
🧪 Tests système de métriques et monitoring
Validation des percentiles p95, alerting et export Prometheus
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone, timedelta

from app.core.metrics_collector import MetricsCollector, MetricType, AlertSeverity


class TestMetricsCollector:
    """Tests du collecteur de métriques avancé"""
    
    @pytest.fixture
    def metrics_collector_instance(self):
        """Instance de metrics collector pour tests"""
        return MetricsCollector(buffer_size=100, flush_interval=10)
    
    def test_counter_operations(self, metrics_collector_instance):
        """
        🔢 Test des opérations de compteur
        """
        
        collector = metrics_collector_instance
        
        # Test incrémentation basique
        collector.increment_counter("test.counter")
        assert collector.counters["test.counter"] == 1
        
        # Test incrémentation avec valeur
        collector.increment_counter("test.counter", 5)
        assert collector.counters["test.counter"] == 6
        
        # Test avec labels
        collector.increment_counter("api.requests", labels={"method": "GET"})
        assert len(collector.counters) == 2
    
    def test_gauge_operations(self, metrics_collector_instance):
        """
        📊 Test des opérations de jauge
        """
        
        collector = metrics_collector_instance
        
        # Test set gauge
        collector.set_gauge("cpu.usage", 75.5)
        assert collector.gauges["cpu.usage"] == 75.5
        
        # Test overwrite
        collector.set_gauge("cpu.usage", 80.2)
        assert collector.gauges["cpu.usage"] == 80.2
        
        # Test avec labels
        collector.set_gauge("memory.usage", 60.0, labels={"type": "heap"})
        assert len(collector.gauges) == 2
    
    def test_histogram_operations(self, metrics_collector_instance):
        """
        📈 Test des histogrammes et percentiles
        """
        
        collector = metrics_collector_instance
        
        # Ajouter des valeurs
        values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
        for value in values:
            collector.record_histogram("api.latency", value)
        
        # Calculer percentiles
        stats = collector.get_percentiles("api.latency")
        
        assert stats is not None
        assert stats.count == 10
        assert stats.min == 100
        assert stats.max == 1000
        assert 400 <= stats.p50 <= 600  # Médiane approximative
        assert 800 <= stats.p95 <= 1000  # P95 approximatif
        assert stats.avg == 550  # Moyenne exacte
    
    def test_timer_context_manager(self, metrics_collector_instance):
        """
        ⏱️ Test du context manager pour timer
        """
        
        collector = metrics_collector_instance
        
        # Simuler une opération chronométrée
        import time
        
        with collector.time_operation("test.operation"):
            time.sleep(0.01)  # 10ms
        
        # Vérifier qu'une mesure a été enregistrée
        assert len(collector.timers["test.operation"]) == 1
        duration = collector.timers["test.operation"][0]
        assert 8 <= duration <= 50  # Entre 8 et 50ms (tolérance)
    
    def test_alert_rule_configuration(self, metrics_collector_instance):
        """
        🚨 Test de configuration des règles d'alerte
        """
        
        collector = metrics_collector_instance
        
        # Ajouter une règle d'alerte
        collector.add_alert_rule(
            "test_alert",
            "test.metric",
            100.0,
            AlertSeverity.WARNING,
            "value",
            "Test alert message"
        )
        
        assert "test_alert" in collector.alert_rules
        rule = collector.alert_rules["test_alert"]
        assert rule["threshold"] == 100.0
        assert rule["severity"] == AlertSeverity.WARNING
        assert rule["message"] == "Test alert message"
    
    @pytest.mark.asyncio
    async def test_alert_triggering(self, metrics_collector_instance):
        """
        🔥 Test de déclenchement d'alerte
        """
        
        collector = metrics_collector_instance
        
        # Mock create_event
        with patch('app.core.events.create_event') as mock_create_event:
            mock_create_event.return_value = True
            
            # Configurer règle d'alerte
            collector.add_alert_rule(
                "high_latency",
                "api.latency",
                500.0,
                AlertSeverity.WARNING,
                "value"
            )
            
            # Déclencher l'alerte avec une valeur élevée
            await collector._check_alert_conditions("api.latency", 600.0, None)
            
            # Vérifier que l'alerte a été déclenchée
            assert "high_latency" in collector.active_alerts
            alert = collector.active_alerts["high_latency"]
            assert alert.severity == AlertSeverity.WARNING
            assert alert.value == 600.0
            
            # Vérifier que l'événement a été créé
            mock_create_event.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_percentile_alert_conditions(self, metrics_collector_instance):
        """
        📊 Test des conditions d'alerte basées sur percentiles
        """
        
        collector = metrics_collector_instance
        
        # Ajouter des données pour calculer percentiles
        values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
        for value in values:
            collector.record_histogram("latency.test", value)
        
        # Test condition p95
        p95_value = await collector._calculate_alert_value("latency.test", "p95", 0, None)
        assert 800 <= p95_value <= 1000
        
        # Test condition p99
        p99_value = await collector._calculate_alert_value("latency.test", "p99", 0, None)
        assert 900 <= p99_value <= 1000
    
    def test_metric_key_building(self, metrics_collector_instance):
        """
        🔑 Test de construction des clés de métriques
        """
        
        collector = metrics_collector_instance
        
        # Test sans labels
        key1 = collector._build_metric_key("test.metric", None)
        assert key1 == "test.metric"
        
        # Test avec labels
        key2 = collector._build_metric_key("test.metric", {"method": "GET", "status": "200"})
        assert key2 == "test.metric{labels}"
        
        # Test cohérence avec même labels dans ordre différent
        key3 = collector._build_metric_key("test.metric", {"status": "200", "method": "GET"})
        assert key2 == key3
    
    def test_metric_pattern_matching(self, metrics_collector_instance):
        """
        🎯 Test du matching de patterns pour alertes
        """
        
        collector = metrics_collector_instance
        
        # Test match exact
        assert collector._metric_matches_pattern("api.requests", "api.requests")
        
        # Test wildcard
        assert collector._metric_matches_pattern("api.requests.get", "api.requests.*")
        assert collector._metric_matches_pattern("api.requests", "api.*")
        
        # Test non-match
        assert not collector._metric_matches_pattern("db.queries", "api.*")
    
    @pytest.mark.asyncio
    async def test_redis_flush_functionality(self, metrics_collector_instance):
        """
        💾 Test de flush vers Redis
        """
        
        collector = metrics_collector_instance
        
        # Mock Redis
        with patch('app.core.redis_cache.redis_cache') as mock_cache:
            mock_cache.redis_available = True
            mock_cache.redis_client = AsyncMock()
            
            # Ajouter quelques métriques
            collector.increment_counter("test.counter", 5)
            collector.set_gauge("test.gauge", 100)
            
            # Flush vers Redis
            await collector._flush_to_redis()
            
            # Vérifier que Redis setex a été appelé
            mock_cache.redis_client.setex.assert_called_once()
            
            # Vérifier que les compteurs ont été réinitialisés
            assert len(collector.counters) == 0
    
    @pytest.mark.asyncio
    async def test_collector_lifecycle(self, metrics_collector_instance):
        """
        🔄 Test du cycle de vie complet du collector
        """
        
        collector = metrics_collector_instance
        
        # Mock Redis pour éviter les erreurs
        with patch('app.core.redis_cache.redis_cache') as mock_cache:
            mock_cache.redis_available = False
            
            # Démarrer le collector
            await collector.start()
            assert collector._running is True
            assert collector._flush_task is not None
            
            # Arrêter le collector
            await collector.stop()
            assert collector._running is False
    
    def test_performance_calculation(self, metrics_collector_instance):
        """
        ⚡ Test du calcul des scores de performance
        """
        
        collector = metrics_collector_instance
        
        # Simuler des métriques de performance
        collector.record_timer("api.request.duration", 150)  # Excellent
        collector.record_timer("api.request.duration", 300)  # Good  
        collector.record_timer("api.request.duration", 800)  # Acceptable
        
        stats = collector.get_percentiles("api.request.duration")
        assert stats is not None
        
        # Test que les percentiles sont calculés correctement
        assert stats.count == 3
        assert stats.min == 150
        assert stats.max == 800
        assert 150 <= stats.avg <= 800
    
    def test_metric_export_format(self, metrics_collector_instance):
        """
        📤 Test du format d'export des métriques
        """
        
        collector = metrics_collector_instance
        
        # Ajouter quelques métriques
        collector.increment_counter("http.requests.total", 100)
        collector.set_gauge("memory.usage.bytes", 1024)
        
        # Obtenir snapshot
        snapshot = collector.get_current_metrics()
        
        assert "timestamp" in snapshot
        assert "counters" in snapshot
        assert "gauges" in snapshot
        assert "active_alerts" in snapshot
        
        # Vérifier les données
        assert snapshot["counters"]["http.requests.total"] == 100
        assert snapshot["gauges"]["memory.usage.bytes"] == 1024