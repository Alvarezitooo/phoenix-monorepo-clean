"""
🧪 Tests pour la rotation automatique des clés API
"""

import pytest
import os
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, AsyncMock
from app.core.api_key_manager import APIKeyManager, KeyProvider, APIKeyInfo


@pytest.mark.asyncio
async def test_api_key_manager_retrieves_keys_from_env():
    """
    Test que l'API Key Manager récupère les clés depuis l'environnement
    """
    
    api_key_manager = APIKeyManager()
    
    # Mock environment variables
    with patch.dict(os.environ, {
        'GEMINI_API_KEY': 'test-gemini-key-12345',
        'SUPABASE_SERVICE_KEY': 'test-supabase-key-67890'
    }):
        # Test Gemini key
        gemini_key, gemini_info = await api_key_manager.get_api_key(KeyProvider.GEMINI)
        assert gemini_key == 'test-gemini-key-12345'
        assert gemini_info.provider == KeyProvider.GEMINI
        assert gemini_info.is_active is True
        
        # Test Supabase key
        supabase_key, supabase_info = await api_key_manager.get_api_key(KeyProvider.SUPABASE)
        assert supabase_key == 'test-supabase-key-67890'
        assert supabase_info.provider == KeyProvider.SUPABASE
        assert supabase_info.is_active is True


@pytest.mark.asyncio 
async def test_api_key_manager_detects_missing_keys():
    """
    Test que l'API Key Manager détecte les clés manquantes
    """
    
    api_key_manager = APIKeyManager()
    
    # Clear environment
    with patch.dict(os.environ, {}, clear=True):
        key, info = await api_key_manager.get_api_key(KeyProvider.STRIPE)
        
        assert key is None
        assert info.key_id == "missing"
        assert info.is_active is False


@pytest.mark.asyncio
async def test_api_key_rotation_status_warnings():
    """
    Test que le système détecte les clés nécessitant une rotation
    """
    
    api_key_manager = APIKeyManager()
    
    # Mock une clé ancienne (35 jours pour Gemini qui a un seuil de 30 jours)
    old_key_info = APIKeyInfo(
        provider=KeyProvider.GEMINI,
        key_id="old_gemini_key",
        key_hash="abc123",
        created_at=datetime.now(timezone.utc) - timedelta(days=35),
        is_active=True
    )
    
    api_key_manager.keys_cache[KeyProvider.GEMINI] = old_key_info
    
    status = await api_key_manager.get_rotation_status()
    
    # Vérifier que Gemini est marqué comme critique
    assert "gemini" in status
    assert status["gemini"]["status"] == "critical"
    assert status["gemini"]["age_days"] >= 35
    assert status["gemini"]["action_required"] == "rotate_immediately"


@pytest.mark.asyncio
async def test_api_key_manager_revocation():
    """
    Test la révocation d'urgence des clés
    """
    
    api_key_manager = APIKeyManager()
    
    # Ajouter une clé active
    key_info = APIKeyInfo(
        provider=KeyProvider.STRIPE,
        key_id="stripe_test_key",
        key_hash="def456", 
        created_at=datetime.now(timezone.utc),
        is_active=True
    )
    
    api_key_manager.keys_cache[KeyProvider.STRIPE] = key_info
    
    # Révoquer
    success = await api_key_manager.revoke_key(KeyProvider.STRIPE, "Compromission détectée")
    
    assert success is True
    assert api_key_manager.keys_cache[KeyProvider.STRIPE].is_active is False


@pytest.mark.asyncio
async def test_api_key_rotation_detection():
    """
    Test que le système détecte une rotation manuelle des clés
    """
    
    api_key_manager = APIKeyManager()
    
    # Première récupération avec une clé
    with patch.dict(os.environ, {'GEMINI_API_KEY': 'old-key-123'}):
        old_key, old_info = await api_key_manager.get_api_key(KeyProvider.GEMINI)
        old_hash = old_info.key_hash
        old_rotation_count = old_info.rotation_count
    
    # Deuxième récupération avec une clé différente (simule rotation manuelle)
    with patch.dict(os.environ, {'GEMINI_API_KEY': 'new-key-456'}):
        new_key, new_info = await api_key_manager.get_api_key(KeyProvider.GEMINI)
        
        # Vérifier détection de rotation
        assert new_info.key_hash != old_hash
        assert new_info.rotation_count == old_rotation_count + 1
        assert new_key == 'new-key-456'


@pytest.mark.asyncio
async def test_api_key_manager_security_hash_only():
    """
    Test que seuls les hashs sont stockés, jamais les clés en clair
    """
    
    api_key_manager = APIKeyManager()
    
    with patch.dict(os.environ, {'SUPABASE_SERVICE_KEY': 'super-secret-key-789'}):
        key, info = await api_key_manager.get_api_key(KeyProvider.SUPABASE)
        
        # Vérifier que le hash ne contient pas la clé
        assert 'super-secret-key-789' not in info.key_hash
        assert len(info.key_hash) == 16  # SHA256[:16]
        
        # Vérifier que la clé est récupérée correctement
        assert key == 'super-secret-key-789'


@pytest.mark.asyncio
async def test_api_key_manager_metadata_persistence(tmp_path):
    """
    Test la persistance des métadonnées (sans les clés)
    """
    
    # Créer un manager avec un fichier temporaire
    api_key_manager = APIKeyManager()
    api_key_manager.metadata_file = tmp_path / "test_metadata.json"
    
    with patch.dict(os.environ, {'STRIPE_SECRET_KEY': 'stripe-test-secret'}):
        # Première utilisation
        key, info = await api_key_manager.get_api_key(KeyProvider.STRIPE)
        
        # Vérifier que le fichier a été créé
        assert api_key_manager.metadata_file.exists()
        
        # Vérifier le contenu du fichier
        with open(api_key_manager.metadata_file, 'r') as f:
            metadata = json.load(f)
        
        assert "stripe" in metadata["keys"]
        stripe_data = metadata["keys"]["stripe"]
        
        # Vérifier que seules les métadonnées sont sauvées
        assert "key_hash" in stripe_data
        assert "created_at" in stripe_data
        assert "rotation_count" in stripe_data
        
        # Vérifier qu'aucune clé en clair n'est sauvée
        content = api_key_manager.metadata_file.read_text()
        assert 'stripe-test-secret' not in content


def test_api_key_manager_hash_consistency():
    """
    Test que les hashs sont cohérents et déterministes
    """
    
    api_key_manager = APIKeyManager()
    
    test_key = "test-api-key-123"
    
    # Hasher la même clé plusieurs fois
    hash1 = api_key_manager._hash_key(test_key)
    hash2 = api_key_manager._hash_key(test_key)
    
    # Les hashs doivent être identiques
    assert hash1 == hash2
    assert len(hash1) == 16
    
    # Hash différent pour clé différente
    hash3 = api_key_manager._hash_key("different-key")
    assert hash3 != hash1