"""
🧪 Tests unitaires pour la persistance Energy Manager avec mocks
Valide la logique de persistance sans dépendance DB
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.core.energy_manager import EnergyManager
from app.models.user_energy import UserEnergyModel
import uuid


@pytest.mark.asyncio
async def test_energy_manager_uses_db_persistence():
    """
    Test que EnergyManager utilise bien la DB pour la persistance
    """
    
    user_id = str(uuid.uuid4())
    energy_manager = EnergyManager()
    
    # Mock des appels Supabase
    mock_db_response = MagicMock()
    mock_db_response.data = [{
        "user_id": user_id,
        "current_energy": 75.0,
        "max_energy": 100.0,
        "total_purchased": 0.0,
        "total_consumed": 10.0,
        "subscription_type": "standard",
        "created_at": "2025-08-27T10:00:00Z",
        "updated_at": "2025-08-27T10:01:00Z"
    }]
    
    with patch('app.core.energy_manager.sb') as mock_sb:
        mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_db_response
        
        # Récupérer l'énergie utilisateur
        user_energy = await energy_manager.get_user_energy(user_id)
        
        # Vérifier que la DB a été appelée
        mock_sb.table.assert_called_with("user_energy")
        
        # Vérifier que les données sont correctes
        assert user_energy.user_id == user_id
        assert user_energy.current_energy == 75.0
        assert user_energy.total_consumed == 10.0


@pytest.mark.asyncio
async def test_energy_persistence_with_successful_db_save():
    """
    Test que l'update d'énergie sauvegarde bien en DB
    """
    
    user_id = str(uuid.uuid4())
    energy_manager = EnergyManager()
    
    # Mock initial user energy
    initial_energy = UserEnergyModel(
        user_id=user_id,
        current_energy=85.0,
        max_energy=100.0,
        subscription_type="standard"
    )
    
    # Mock successful DB operations
    with patch.object(energy_manager, '_get_user_energy', return_value=initial_energy) as mock_get, \
         patch.object(energy_manager, '_save_user_energy_to_db', return_value=True) as mock_save:
        
        # Update energy
        success = await energy_manager._update_user_energy(user_id, 70.0)
        
        # Vérifier que la sauvegarde a été appelée
        assert success is True
        mock_save.assert_called_once()
        
        # Vérifier que l'énergie a été mise à jour
        saved_energy = mock_save.call_args[0][0]  # Premier argument
        assert saved_energy.current_energy == 70.0
        assert saved_energy.user_id == user_id


@pytest.mark.asyncio 
async def test_cache_fallback_when_db_fails():
    """
    Test que le cache est utilisé quand la DB échoue (graceful degradation)
    """
    
    user_id = str(uuid.uuid4())
    energy_manager = EnergyManager()
    
    # Simuler échec DB mais succès cache
    with patch.object(energy_manager, '_get_user_energy_from_db', return_value=None) as mock_db, \
         patch.object(energy_manager, '_save_user_energy_to_db', return_value=False) as mock_save:
        
        # Tenter de créer un utilisateur
        user_energy = await energy_manager.get_user_energy(user_id)
        
        # Vérifier que la DB a été tentée
        mock_db.assert_called_once_with(user_id)
        mock_save.assert_called_once()
        
        # Vérifier que l'utilisateur existe quand même (fallback cache)
        assert user_energy is not None
        assert user_energy.user_id == user_id
        assert user_energy.current_energy == 85.0  # Énergie par défaut
        
        # Vérifier que l'utilisateur est dans le cache
        assert user_id in energy_manager._energy_cache


@pytest.mark.asyncio
async def test_persistence_across_instances_simulation():
    """
    Test simulant la persistance entre instances (avec mocks DB)
    """
    
    user_id = str(uuid.uuid4())
    
    # === Instance 1 ===
    energy_manager_1 = EnergyManager()
    
    # Mock que l'utilisateur existe en DB avec énergie consommée
    consumed_energy_data = {
        "user_id": user_id,
        "current_energy": 73.0,  # Après consommation
        "max_energy": 100.0,
        "total_consumed": 12.0,
        "subscription_type": "standard",
        "created_at": "2025-08-27T10:00:00Z",
        "updated_at": "2025-08-27T10:01:00Z"
    }
    
    # === Instance 2 ===
    energy_manager_2 = EnergyManager()
    
    # Mock DB response pour instance 2
    mock_response = MagicMock()
    mock_response.data = [consumed_energy_data]
    
    with patch('app.core.energy_manager.sb') as mock_sb:
        mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # Instance 2 récupère les données
        user_energy_2 = await energy_manager_2.get_user_energy(user_id)
        
        # SUCCÈS : Instance 2 voit l'énergie consommée par instance 1
        assert user_energy_2.current_energy == 73.0
        assert user_energy_2.total_consumed == 12.0
        
        # La DB a bien été consultée
        mock_sb.table.assert_called_with("user_energy")


@pytest.mark.asyncio
async def test_transaction_persistence_to_db():
    """
    Test que les transactions sont sauvegardées en DB au lieu du stockage in-memory
    """
    
    user_id = str(uuid.uuid4())
    energy_manager = EnergyManager()
    
    from app.models.user_energy import EnergyTransactionModel
    from datetime import datetime, timezone
    
    transaction = EnergyTransactionModel(
        transaction_id=str(uuid.uuid4()),
        user_id=user_id,
        amount=10.0,
        action_type="consume",
        reason="test_action",
        energy_before=85.0,
        energy_after=75.0
    )
    
    # Mock successful DB insert
    mock_response = MagicMock()
    mock_response.data = [{"transaction_id": transaction.transaction_id}]
    
    with patch('app.core.energy_manager.sb') as mock_sb:
        mock_sb.table.return_value.insert.return_value.execute.return_value = mock_response
        
        # Créer la transaction
        result_id = await energy_manager._create_transaction(transaction)
        
        # Vérifier l'appel DB
        mock_sb.table.assert_called_with("energy_transactions")
        mock_sb.table.return_value.insert.assert_called_once()
        
        # Vérifier les données insérées
        inserted_data = mock_sb.table.return_value.insert.call_args[0][0]
        assert inserted_data["user_id"] == user_id
        assert inserted_data["amount"] == 10.0
        assert inserted_data["action_type"] == "consume"
        
        assert result_id == transaction.transaction_id