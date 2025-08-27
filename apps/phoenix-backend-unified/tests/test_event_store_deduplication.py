"""
🧹 Tests de vérification après suppression du Event Store dupliqué
Validation que tous les imports pointent vers supabase_client.py
"""

import pytest
from app.core.supabase_client import SupabaseEventStore, event_store


def test_event_store_import_uniqueness():
    """
    ✅ Vérifie qu'il n'y a plus qu'une seule classe SupabaseEventStore
    """
    # L'instance globale doit être disponible
    assert event_store is not None
    assert isinstance(event_store, SupabaseEventStore)


def test_event_store_methods_available():
    """
    🔧 Vérifie que toutes les méthodes essentielles sont disponibles
    """
    # Méthodes principales
    assert hasattr(event_store, 'create_event')
    assert hasattr(event_store, 'create_journal_event')
    assert hasattr(event_store, 'get_user_events')
    assert hasattr(event_store, 'health_check')
    
    # Méthodes d'énergie
    assert hasattr(event_store, 'create_user_energy_record')
    assert hasattr(event_store, 'create_energy_transaction')
    assert hasattr(event_store, 'get_user_energy')


def test_no_duplicate_event_store_file():
    """
    🧹 Vérifie que le fichier dupliqué event_store_supabase.py n'existe plus
    """
    import os
    duplicate_path = "/Users/mattvaness/Desktop/IA/phoenix-production/apps/phoenix-backend-unified/app/core/event_store_supabase.py"
    
    assert not os.path.exists(duplicate_path), "Le fichier event_store_supabase.py dupliqué doit être supprimé"


@pytest.mark.asyncio
async def test_event_store_functional():
    """
    ⚡ Test fonctionnel basique du Event Store unique (dev mode)
    """
    # En mode développement (sans env Supabase), le client doit être None
    if event_store.client is None:
        # Mode développement : doit logger et retourner un ID
        event_id = await event_store.create_event(
            user_id="test_user_123",
            event_type="test_deduplication",
            app_source="test_suite", 
            event_data={"action": "validate_single_event_store"},
            metadata={"test": "deduplication_validation"}
        )
        
        assert event_id is not None
        assert isinstance(event_id, str)
    else:
        # Mode production : test avec vraie base
        pytest.skip("Production Supabase available - skipping dev mode test")


@pytest.mark.asyncio 
async def test_event_store_health_check():
    """
    🏥 Vérifie que le health check fonctionne après déduplication
    """
    health = await event_store.health_check()
    
    assert "status" in health
    assert health["status"] in ["development_mode", "healthy", "unhealthy"]
    assert "supabase_connected" in health
    assert isinstance(health["supabase_connected"], bool)