"""
⚡ Tests de performance pour Narrative Analyzer optimisé
Validation des améliorations de performance vs version originale
"""

import pytest
import asyncio
import time
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone, timedelta

from app.core.narrative_analyzer import narrative_analyzer  # Original
from app.core.narrative_analyzer_optimized import narrative_analyzer_optimized  # Optimisé


class TestNarrativeAnalyzerPerformance:
    """Tests de performance comparative entre versions"""
    
    def setup_method(self):
        """Setup pour chaque test"""
        # Clear cache avant chaque test
        narrative_analyzer_optimized.cache.cache.clear()
        
        # Mock events réalistes
        self.mock_events = self._generate_realistic_events(100)
    
    def _generate_realistic_events(self, count: int) -> list:
        """Génère des événements réalistes pour les tests"""
        events = []
        now = datetime.now(timezone.utc)
        
        event_types = [
            "cv_generated", "cv_ats_score", "letter_sent", "mirror_match_completed",
            "energy_purchase", "onboarding_completed", "session_zero_completed"
        ]
        
        app_sources = ["cv", "letters", "journal_narratif", "luna_hub"]
        
        for i in range(count):
            # Distribution temporelle réaliste (plus d'événements récents)
            days_ago = int((i / count) * 30)  # Distribution sur 30 jours
            timestamp = now - timedelta(days=days_ago, hours=i % 24)
            
            event = {
                "id": f"event_{i}",
                "type": event_types[i % len(event_types)],
                "created_at": timestamp.isoformat() + "Z",
                "payload": {
                    "app_source": app_sources[i % len(app_sources)],
                    "user_action": f"action_{i}",
                    "ats_score": 75 + (i % 25),  # Scores ATS réalistes
                    "company_name": f"Company_{i}",
                    "position_title": "Développeur Python" if i % 3 == 0 else "Consultant",
                    "notes": "Intéressé par le réseautage" if i % 5 == 0 else "Besoin d'aide quantification"
                },
                "meta": {
                    "timestamp": timestamp.isoformat() + "Z"
                }
            }
            events.append(event)
        
        return events
    
    @pytest.mark.asyncio
    async def test_context_packet_generation_performance(self):
        """
        🚀 Test de performance: génération Context Packet
        Vérifie que la version optimisée est plus rapide
        """
        
        user_id = "test_user_performance"
        
        # Mock event store pour les deux versions
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_events:
            mock_events.return_value = self.mock_events
            
            # Test version originale
            start_original = time.time()
            context_original = await narrative_analyzer.generate_context_packet(user_id)
            time_original = time.time() - start_original
            
            # Test version optimisée (premier appel - pas de cache)
            start_optimized = time.time() 
            context_optimized = await narrative_analyzer_optimized.generate_context_packet(user_id)
            time_optimized = time.time() - start_optimized
            
            # Assertions qualité (résultats similaires)
            assert context_original.user.age_days == context_optimized.user.age_days
            assert context_original.usage.session_count_7d == context_optimized.usage.session_count_7d
            assert len(context_original.usage.apps_last_7d) == len(context_optimized.usage.apps_last_7d)
            
            # Assertion performance (optimisée doit être plus rapide)
            improvement_pct = ((time_original - time_optimized) / time_original) * 100
            
            print(f"\n⚡ Performance Comparison:")
            print(f"   Original: {time_original:.3f}s")
            print(f"   Optimized: {time_optimized:.3f}s")
            print(f"   Improvement: {improvement_pct:.1f}%")
            
            # Version optimisée doit être au moins 20% plus rapide
            assert time_optimized < time_original, "Version optimisée doit être plus rapide"
            assert improvement_pct > 15, f"Amélioration insuffisante: {improvement_pct:.1f}% (attendu >15%)"
    
    @pytest.mark.asyncio
    async def test_cache_performance_boost(self):
        """
        💾 Test de performance: effet du cache
        Vérifie que les appels suivants sont beaucoup plus rapides
        """
        
        user_id = "test_user_cache"
        
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_events:
            mock_events.return_value = self.mock_events
            
            # Premier appel (pas de cache)
            start_first = time.time()
            context_first = await narrative_analyzer_optimized.generate_context_packet(user_id)
            time_first = time.time() - start_first
            
            # Deuxième appel (avec cache)
            start_cached = time.time()
            context_cached = await narrative_analyzer_optimized.generate_context_packet(user_id)
            time_cached = time.time() - start_cached
            
            # Cache hit doit être beaucoup plus rapide
            cache_speedup = time_first / time_cached if time_cached > 0 else float('inf')
            
            print(f"\n💾 Cache Performance:")
            print(f"   First call: {time_first:.3f}s")
            print(f"   Cached call: {time_cached:.3f}s")
            print(f"   Speedup: {cache_speedup:.1f}x")
            
            # Résultats identiques
            assert context_first.cache_key == context_cached.cache_key
            assert context_first.confidence == context_cached.confidence
            
            # Cache doit être au moins 5x plus rapide
            assert time_cached < time_first / 5, "Cache doit être significativement plus rapide"
    
    @pytest.mark.asyncio
    async def test_large_dataset_scalability(self):
        """
        📈 Test de scalabilité: gros datasets
        Vérifie que l'optimisation aide avec beaucoup d'événements  
        """
        
        # Test avec dataset important
        large_events = self._generate_realistic_events(500)
        user_id = "test_user_scalability"
        
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_events:
            mock_events.return_value = large_events
            
            # Test version optimisée avec gros dataset
            start_large = time.time()
            context_large = await narrative_analyzer_optimized.generate_context_packet(user_id)
            time_large = time.time() - start_large
            
            print(f"\n📈 Scalability Test (500 events):")
            print(f"   Processing time: {time_large:.3f}s")
            print(f"   Events analyzed: {len(large_events)}")
            print(f"   Confidence: {context_large.confidence}")
            
            # Doit rester rapide même avec beaucoup d'événements
            assert time_large < 2.0, "Traitement doit rester sous 2 secondes même avec 500 événements"
            assert context_large.confidence > 0, "Doit produire un contexte valide"
    
    @pytest.mark.asyncio
    async def test_concurrent_requests_performance(self):
        """
        🔄 Test de performance: requêtes concurrentes
        Vérifie que le cache aide avec la concurrence
        """
        
        users = [f"user_concurrent_{i}" for i in range(5)]
        
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_events:
            mock_events.return_value = self.mock_events
            
            # Test 5 utilisateurs en parallèle
            start_concurrent = time.time()
            
            tasks = [
                narrative_analyzer_optimized.generate_context_packet(user_id)
                for user_id in users
            ]
            
            contexts = await asyncio.gather(*tasks)
            time_concurrent = time.time() - start_concurrent
            
            print(f"\n🔄 Concurrent Performance:")
            print(f"   5 users processed in: {time_concurrent:.3f}s")
            print(f"   Average per user: {time_concurrent/5:.3f}s")
            
            # Tous les contextes doivent être valides
            assert len(contexts) == 5
            assert all(ctx.confidence >= 0 for ctx in contexts)
            
            # Traitement concurrent doit être efficace
            assert time_concurrent < 3.0, "5 utilisateurs en parallèle doivent être traités en <3s"
    
    @pytest.mark.asyncio
    async def test_timestamp_parsing_optimization(self):
        """
        📅 Test d'optimisation: parsing timestamps
        Vérifie l'efficacité du cache LRU pour les timestamps
        """
        
        from app.core.narrative_analyzer_optimized import parse_iso_timestamp
        
        # Clear cache
        parse_iso_timestamp.cache_clear()
        
        # Test timestamps répétitifs (simule données réelles)
        timestamps = [
            "2024-01-15T10:30:00Z",
            "2024-01-15T10:31:00Z", 
            "2024-01-15T10:30:00Z",  # Répétition
            "2024-01-15T11:00:00Z",
            "2024-01-15T10:30:00Z",  # Répétition
        ]
        
        # Parsing avec timing
        start_parse = time.time()
        
        for _ in range(1000):  # Simulation usage intensif
            for ts in timestamps:
                result = parse_iso_timestamp(ts)
                assert result is not None
        
        time_parse = time.time() - start_parse
        
        # Vérifier statistiques cache
        cache_info = parse_iso_timestamp.cache_info()
        hit_ratio = cache_info.hits / (cache_info.hits + cache_info.misses) if cache_info.hits + cache_info.misses > 0 else 0
        
        print(f"\n📅 Timestamp Parsing:")
        print(f"   5000 parses in: {time_parse:.3f}s")
        print(f"   Cache hits: {cache_info.hits}")
        print(f"   Cache misses: {cache_info.misses}")
        print(f"   Hit ratio: {hit_ratio:.2%}")
        
        assert time_parse < 0.1, "Parsing de 5000 timestamps doit être <0.1s"
        assert hit_ratio > 0.5, "Cache LRU doit avoir >50% de hits"
    
    def test_cache_stats_available(self):
        """
        📊 Test: statistiques du cache disponibles
        Vérifie que les métriques de monitoring sont accessibles
        """
        
        stats = narrative_analyzer_optimized.get_cache_stats()
        
        assert "cache_entries" in stats
        assert "lru_cache_info" in stats
        assert isinstance(stats["cache_entries"], int)
        assert isinstance(stats["lru_cache_info"], dict)
        
        print(f"\n📊 Cache Stats: {stats}")
    
    @pytest.mark.asyncio
    async def test_memory_efficiency(self):
        """
        🧠 Test d'efficacité mémoire: pas de fuites
        Vérifie que le cache se limite correctement
        """
        
        # Générer beaucoup d'utilisateurs différents
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_events:
            mock_events.return_value = self.mock_events[:50]  # Dataset plus petit pour ce test
            
            # Générer 150 contextes (plus que la limite du cache de 100)
            for i in range(150):
                user_id = f"memory_test_user_{i}"
                await narrative_analyzer_optimized.generate_context_packet(user_id)
            
            # Vérifier que le cache ne dépasse pas la limite
            cache_size = len(narrative_analyzer_optimized.cache.cache)
            
            print(f"\n🧠 Memory Efficiency:")
            print(f"   Cache size after 150 users: {cache_size}")
            
            assert cache_size <= 100, "Cache ne doit pas dépasser la limite configurée"