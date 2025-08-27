"""
🔗 Tests d'intégration pour Narrative Analyzer optimisé
Validation de l'intégration dans le système complet
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone, timedelta

from app.core.narrative_analyzer import narrative_analyzer


class TestNarrativeAnalyzerIntegration:
    """Tests d'intégration pour vérifier l'optimisation"""
    
    @pytest.mark.asyncio
    async def test_optimized_version_is_loaded(self):
        """
        🔍 Test: vérifier que la version optimisée est chargée
        """
        
        # Vérifier que l'instance chargée a les optimisations
        assert hasattr(narrative_analyzer, 'cache'), "Instance devrait avoir un cache"
        assert hasattr(narrative_analyzer, 'get_cache_stats'), "Instance devrait avoir get_cache_stats"
        
        # Vérifier le type de l'analyzeur
        class_name = narrative_analyzer.__class__.__name__
        assert class_name == "OptimizedNarrativeAnalyzer", f"Expected OptimizedNarrativeAnalyzer, got {class_name}"
        
        print(f"✅ Narrative Analyzer optimisé chargé: {class_name}")
    
    @pytest.mark.asyncio
    async def test_backward_compatibility(self):
        """
        🔄 Test: la version optimisée est compatible avec l'ancienne API
        """
        
        # Mock data réaliste
        mock_events = [
            {
                "id": "event_1",
                "type": "cv_generated",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat() + "Z",
                "payload": {
                    "app_source": "cv",
                    "ats_score": 85,
                    "user_action": "generate_cv"
                }
            },
            {
                "id": "event_2", 
                "type": "letter_sent",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat() + "Z",
                "payload": {
                    "app_source": "letters",
                    "company_name": "TechCorp",
                    "position_title": "Développeur Python"
                }
            }
        ]
        
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_get_events:
            mock_get_events.return_value = mock_events
            
            # Test de l'API standard
            user_id = "integration_test_user"
            context_packet = await narrative_analyzer.generate_context_packet(user_id)
            
            # Vérifier que la structure reste identique
            assert hasattr(context_packet, 'user')
            assert hasattr(context_packet, 'usage')
            assert hasattr(context_packet, 'progress')
            assert hasattr(context_packet, 'confidence')
            assert hasattr(context_packet, 'generated_at')
            
            # Vérifier les données traitées
            assert context_packet.user.age_days >= 0
            assert len(context_packet.usage.apps_last_7d) > 0
            assert context_packet.confidence > 0
            
            # Vérifier que la méthode to_dict fonctionne
            dict_form = context_packet.to_dict()
            assert isinstance(dict_form, dict)
            assert 'user' in dict_form
            assert 'usage' in dict_form
            
            print(f"✅ API compatible - Confidence: {context_packet.confidence}")
    
    @pytest.mark.asyncio
    async def test_performance_improvement_in_real_usage(self):
        """
        ⚡ Test: amélioration de performance en usage réel
        """
        
        # Générer un dataset réaliste important
        large_mock_events = []
        now = datetime.now(timezone.utc)
        
        for i in range(200):
            event = {
                "id": f"perf_event_{i}",
                "type": ["cv_generated", "letter_sent", "mirror_match_completed", "energy_purchase"][i % 4],
                "created_at": (now - timedelta(days=(i // 10), hours=(i % 24))).isoformat() + "Z",
                "payload": {
                    "app_source": ["cv", "letters", "journal_narratif"][i % 3],
                    "ats_score": 70 + (i % 30),
                    "company_name": f"Company_{i}",
                    "position_title": "Développeur Python" if i % 3 == 0 else "Data Analyst"
                }
            }
            large_mock_events.append(event)
        
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_get_events:
            mock_get_events.return_value = large_mock_events
            
            user_id = "perf_test_user"
            
            # Premier appel (pas de cache)
            import time
            start_time = time.time()
            
            context_first = await narrative_analyzer.generate_context_packet(user_id)
            
            first_call_duration = time.time() - start_time
            
            # Deuxième appel (avec cache) 
            start_time = time.time()
            
            context_cached = await narrative_analyzer.generate_context_packet(user_id)
            
            cached_call_duration = time.time() - start_time
            
            # Vérifications qualité
            assert context_first.confidence == context_cached.confidence
            assert len(context_first.usage.apps_last_7d) == len(context_cached.usage.apps_last_7d)
            
            # Vérifications performance
            speedup = first_call_duration / cached_call_duration if cached_call_duration > 0 else float('inf')
            
            print(f"⚡ Performance réelle:")
            print(f"   Premier appel: {first_call_duration:.3f}s (200 événements)")
            print(f"   Appel en cache: {cached_call_duration:.3f}s")
            print(f"   Speedup cache: {speedup:.1f}x")
            
            # Le cache doit améliorer les performances
            assert cached_call_duration < first_call_duration, "Cache doit améliorer les performances"
            
            # Le traitement doit rester rapide même avec beaucoup de données
            assert first_call_duration < 1.0, "Traitement de 200 événements doit être <1s"
    
    @pytest.mark.asyncio
    async def test_cache_statistics_monitoring(self):
        """
        📊 Test: monitoring et statistiques du cache
        """
        
        # Générer quelques appels pour alimenter les statistiques
        mock_events = [{"id": "stat_event", "type": "test", "created_at": datetime.now(timezone.utc).isoformat() + "Z", "payload": {}}]
        
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_get_events:
            mock_get_events.return_value = mock_events
            
            # Plusieurs appels pour différents utilisateurs
            for i in range(3):
                await narrative_analyzer.generate_context_packet(f"stats_user_{i}")
            
            # Récupérer les statistiques
            stats = narrative_analyzer.get_cache_stats()
            
            assert "cache_entries" in stats
            assert "lru_cache_info" in stats
            
            cache_entries = stats["cache_entries"]
            lru_info = stats["lru_cache_info"]
            
            # Vérifier que le cache contient des entrées
            assert cache_entries > 0, "Cache devrait contenir des entrées"
            
            # Vérifier les métriques LRU
            assert "hits" in lru_info
            assert "misses" in lru_info
            assert "currsize" in lru_info
            assert "maxsize" in lru_info
            
            print(f"📊 Statistiques cache:")
            print(f"   Entrées contexte: {cache_entries}")
            print(f"   LRU hits: {lru_info['hits']}")
            print(f"   LRU misses: {lru_info['misses']}")
            print(f"   LRU taille: {lru_info['currsize']}/{lru_info['maxsize']}")
    
    @pytest.mark.asyncio
    async def test_error_handling_optimized(self):
        """
        🛡️ Test: gestion d'erreur robuste dans la version optimisée
        """
        
        # Tester avec une erreur dans l'Event Store
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_get_events:
            mock_get_events.side_effect = Exception("Simulated database error")
            
            # Doit gérer l'erreur gracieusement
            user_id = "error_test_user"
            context = await narrative_analyzer.generate_context_packet(user_id)
            
            # Doit retourner un contexte vide mais valide
            assert context is not None
            assert context.confidence == 0.1  # Confiance minimale pour contexte vide
            assert context.user.age_days == 0
            assert len(context.usage.apps_last_7d) == 0
            
            print("✅ Gestion d'erreur robuste validée")
    
    @pytest.mark.asyncio
    async def test_concurrent_cache_access(self):
        """
        🔄 Test: accès concurrent au cache sans corruption
        """
        
        mock_events = [{"id": "concurrent_event", "type": "test", "created_at": datetime.now(timezone.utc).isoformat() + "Z", "payload": {}}]
        
        with patch('app.core.supabase_client.event_store.get_user_events', new_callable=AsyncMock) as mock_get_events:
            mock_get_events.return_value = mock_events
            
            # Lancer 10 requêtes concurrentes pour le même utilisateur
            user_id = "concurrent_test_user"
            
            tasks = [
                narrative_analyzer.generate_context_packet(user_id)
                for _ in range(10)
            ]
            
            contexts = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Toutes les requêtes doivent réussir
            successful_contexts = [ctx for ctx in contexts if not isinstance(ctx, Exception)]
            assert len(successful_contexts) == 10, "Toutes les requêtes concurrentes doivent réussir"
            
            # Tous les contextes doivent être identiques (même cache)
            first_confidence = successful_contexts[0].confidence
            assert all(ctx.confidence == first_confidence for ctx in successful_contexts), "Cache cohérent"
            
            print(f"✅ Accès concurrent validé - {len(successful_contexts)} requêtes simultanées")
    
    def test_memory_usage_reasonable(self):
        """
        🧠 Test: usage mémoire raisonnable du cache
        """
        
        # Vérifier les limites du cache
        cache_manager = narrative_analyzer.cache
        
        # Le cache doit avoir des limites configurées
        assert hasattr(cache_manager, 'cache'), "Cache manager doit avoir un dictionnaire de cache"
        assert hasattr(cache_manager, 'ttl'), "Cache manager doit avoir un TTL configuré"
        
        # TTL doit être raisonnable (pas trop long, pas trop court)
        ttl_minutes = cache_manager.ttl.total_seconds() / 60
        assert 5 <= ttl_minutes <= 60, f"TTL cache doit être entre 5-60min, actuellement {ttl_minutes}min"
        
        print(f"🧠 Configuration cache:")
        print(f"   TTL: {ttl_minutes} minutes")
        print(f"   Entrées actuelles: {len(cache_manager.cache)}")
        
        # Test que le cache se nettoie automatiquement
        # (simulation en dépassant la limite de 100 entrées testée ailleurs)
        assert len(cache_manager.cache) <= 100, "Cache ne doit pas dépasser la limite de 100 entrées"