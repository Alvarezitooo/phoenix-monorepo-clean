"""
🔋 Tests Unitaires Energy Management - Sprint 4  
Validation logique gestion énergie et événements
"""

import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch

from app.database.energy_tracker import EnergyTracker, EnergyInsufficientError
from app.database.event_store import EventStore
from app.models.energy import EnergyAction, get_action_energy_cost


class TestEnergyTracker:
    """
    ⚡ Test Suite - Energy Tracker
    Validation logique métier énergie
    """
    
    @pytest.fixture
    async def energy_tracker(self):
        """Energy Tracker pour tests"""
        return EnergyTracker()
    
    @pytest.fixture
    def test_user_id(self):
        return "test_user_energy"
    
    @pytest.mark.asyncio
    async def test_credit_energy_success(self, energy_tracker, test_user_id):
        """✅ Test crédit énergie réussi"""
        # Reset initial
        await energy_tracker.reset_user_energy(test_user_id)
        
        # Test crédit
        result = await energy_tracker.credit_energy(
            user_id=test_user_id,
            amount=100,
            source="test_purchase"
        )
        
        assert result["success"] is True
        assert result["energy_credited"] == 100
        assert result["new_balance"] == 100
        
        # Vérification balance
        balance = await energy_tracker.get_user_energy(test_user_id)
        assert balance["current_energy"] == 100
    
    @pytest.mark.asyncio
    async def test_consume_energy_success(self, energy_tracker, test_user_id):
        """⚡ Test consommation énergie réussie"""
        # Setup - crédit initial
        await energy_tracker.credit_energy(test_user_id, 50, "test_setup")
        
        # Test consommation
        result = await energy_tracker.consume_energy(
            user_id=test_user_id,
            action=EnergyAction.ANALYSE_CV,
            context={"test": True}
        )
        
        expected_cost = get_action_energy_cost(EnergyAction.ANALYSE_CV)
        
        assert result["success"] is True
        assert result["energy_consumed"] == expected_cost
        assert result["energy_remaining"] == 50 - expected_cost
        assert "event_id" in result
    
    @pytest.mark.asyncio
    async def test_consume_energy_insufficient(self, energy_tracker, test_user_id):
        """❌ Test consommation énergie insuffisante"""
        # Setup - balance insuffisante
        await energy_tracker.reset_user_energy(test_user_id)
        await energy_tracker.credit_energy(test_user_id, 5, "test_setup")  # Très peu
        
        # Test consommation échoue
        with pytest.raises(EnergyInsufficientError) as exc_info:
            await energy_tracker.consume_energy(
                user_id=test_user_id,
                action=EnergyAction.ANALYSE_CV
            )
        
        error = exc_info.value
        assert error.user_id == test_user_id
        assert error.required_energy > 0
        assert error.current_energy == 5
    
    @pytest.mark.asyncio
    async def test_energy_actions_costs(self, energy_tracker, test_user_id):
        """💰 Test coûts des différentes actions"""
        # Setup balance généreuse
        await energy_tracker.credit_energy(test_user_id, 1000, "test_setup")
        
        # Test différentes actions
        actions_to_test = [
            EnergyAction.ANALYSE_CV,
            EnergyAction.MIRROR_MATCH,
            EnergyAction.CONSEIL_RAPIDE,
            EnergyAction.LETTRE_MOTIVATION
        ]
        
        for action in actions_to_test:
            balance_before = await energy_tracker.get_user_energy(test_user_id)
            
            result = await energy_tracker.consume_energy(
                user_id=test_user_id,
                action=action
            )
            
            expected_cost = get_action_energy_cost(action)
            assert result["energy_consumed"] == expected_cost
            assert result["energy_remaining"] == balance_before["current_energy"] - expected_cost
    
    @pytest.mark.asyncio  
    async def test_can_perform_action_true(self, energy_tracker, test_user_id):
        """✅ Test can_perform avec énergie suffisante"""
        # Setup balance
        await energy_tracker.credit_energy(test_user_id, 100, "test_setup")
        
        # Test can perform
        result = await energy_tracker.can_perform_action(
            user_id=test_user_id,
            action=EnergyAction.ANALYSE_CV
        )
        
        assert result["can_perform"] is True
        assert result["current_energy"] == 100
        assert result["energy_required"] == get_action_energy_cost(EnergyAction.ANALYSE_CV)
        assert result["deficit"] == 0
    
    @pytest.mark.asyncio
    async def test_can_perform_action_false(self, energy_tracker, test_user_id):
        """❌ Test can_perform avec énergie insuffisante"""
        # Setup balance insuffisante
        await energy_tracker.reset_user_energy(test_user_id)
        
        # Test can perform
        result = await energy_tracker.can_perform_action(
            user_id=test_user_id,
            action=EnergyAction.ANALYSE_CV
        )
        
        expected_cost = get_action_energy_cost(EnergyAction.ANALYSE_CV)
        
        assert result["can_perform"] is False
        assert result["current_energy"] == 0
        assert result["energy_required"] == expected_cost
        assert result["deficit"] == expected_cost
    
    @pytest.mark.asyncio
    async def test_energy_balance_history(self, energy_tracker, test_user_id):
        """📜 Test historique balance énergie"""
        # Séquence d'opérations
        await energy_tracker.reset_user_energy(test_user_id)
        await energy_tracker.credit_energy(test_user_id, 100, "purchase")
        await energy_tracker.consume_energy(test_user_id, EnergyAction.CONSEIL_RAPIDE)
        await energy_tracker.credit_energy(test_user_id, 50, "bonus")
        
        # Test historique
        history = await energy_tracker.get_energy_history(
            user_id=test_user_id,
            limit=10
        )
        
        assert len(history) >= 3  # credit + consume + credit
        
        # Ordre chronologique (plus récent d'abord)
        assert history[0]["type"] in ["credit", "consume"]
        assert all("timestamp" in entry for entry in history)
        assert all("amount" in entry for entry in history)
        assert all("balance_after" in entry for entry in history)
    
    @pytest.mark.asyncio
    async def test_concurrent_energy_operations(self, energy_tracker, test_user_id):
        """🔄 Test opérations concurrentes"""
        # Setup
        await energy_tracker.credit_energy(test_user_id, 100, "test_setup")
        
        # Consommations concurrentes
        tasks = [
            energy_tracker.consume_energy(test_user_id, EnergyAction.CONSEIL_RAPIDE),
            energy_tracker.consume_energy(test_user_id, EnergyAction.CONSEIL_RAPIDE),
            energy_tracker.consume_energy(test_user_id, EnergyAction.CONSEIL_RAPIDE)
        ]
        
        # Exécution concurrente
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Au moins une doit réussir
        successful_results = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_results) >= 1
        
        # Balance finale cohérente
        final_balance = await energy_tracker.get_user_energy(test_user_id)
        assert final_balance["current_energy"] >= 0


class TestEventStore:
    """
    📚 Test Suite - Event Store  
    Validation événements et sourcing
    """
    
    @pytest.fixture
    async def event_store(self):
        return EventStore()
    
    @pytest.fixture
    def test_user_id(self):
        return "test_user_events"
    
    @pytest.mark.asyncio
    async def test_store_event_success(self, event_store, test_user_id):
        """✅ Test stockage événement réussi"""
        # Clear events
        await event_store.clear_user_events(test_user_id)
        
        # Test store event
        event_data = {
            "action": "test_action",
            "result": "success",
            "metadata": {"test": True}
        }
        
        event_id = await event_store.store_event(
            user_id=test_user_id,
            event_type="TestEvent",
            event_data=event_data
        )
        
        assert event_id is not None
        assert isinstance(event_id, str)
        assert len(event_id) > 10  # UUID format
    
    @pytest.mark.asyncio
    async def test_get_user_events_all(self, event_store, test_user_id):
        """📚 Test récupération tous événements utilisateur"""
        # Setup - créer plusieurs événements
        event_types = ["EnergyPurchased", "EnergyConsumed", "ActionPerformed"]
        
        for i, event_type in enumerate(event_types):
            await event_store.store_event(
                user_id=test_user_id,
                event_type=event_type,
                event_data={"sequence": i, "type": event_type}
            )
        
        # Test récupération
        events = await event_store.get_user_events(user_id=test_user_id)
        
        assert len(events) >= len(event_types)
        
        # Vérification structure
        for event in events:
            assert "event_id" in event
            assert "user_id" in event
            assert "event_type" in event
            assert "event_data" in event
            assert "created_at" in event
            assert event["user_id"] == test_user_id
    
    @pytest.mark.asyncio
    async def test_get_events_by_type(self, event_store, test_user_id):
        """🔍 Test récupération événements par type"""
        # Setup
        await event_store.store_event(
            user_id=test_user_id,
            event_type="EnergyPurchased",
            event_data={"pack": "cafe_luna", "amount": 100}
        )
        
        # Test filtre par type
        purchase_events = await event_store.get_user_events(
            user_id=test_user_id,
            event_type="EnergyPurchased"
        )
        
        assert len(purchase_events) >= 1
        assert all(event["event_type"] == "EnergyPurchased" for event in purchase_events)
        
        # Vérification données
        purchase_event = purchase_events[0]
        assert purchase_event["event_data"]["pack"] == "cafe_luna"
        assert purchase_event["event_data"]["amount"] == 100
    
    @pytest.mark.asyncio
    async def test_events_chronological_order(self, event_store, test_user_id):
        """⏰ Test ordre chronologique événements"""
        # Clear events
        await event_store.clear_user_events(test_user_id)
        
        # Créer événements avec délai
        for i in range(3):
            await event_store.store_event(
                user_id=test_user_id,
                event_type="OrderTest",
                event_data={"sequence": i}
            )
            await asyncio.sleep(0.01)  # Petit délai
        
        # Test ordre
        events = await event_store.get_user_events(user_id=test_user_id)
        
        # Plus récent d'abord
        sequences = [event["event_data"]["sequence"] for event in events if event["event_type"] == "OrderTest"]
        assert sequences == [2, 1, 0]  # Ordre décroissant
    
    @pytest.mark.asyncio
    async def test_event_data_integrity(self, event_store, test_user_id):
        """🛡️ Test intégrité données événement"""
        # Event avec données complexes
        complex_data = {
            "user_profile": {
                "name": "Test User",
                "preferences": ["ai", "automation"],
                "settings": {"language": "fr", "notifications": True}
            },
            "action_context": {
                "job_title": "Data Scientist",
                "company": "TechCorp",
                "metadata": {"source": "website", "timestamp": datetime.now(timezone.utc).isoformat()}
            },
            "results": {
                "score": 85.5,
                "recommendations": ["skill_python", "skill_ml"],
                "processing_time_ms": 1250
            }
        }
        
        # Store event
        event_id = await event_store.store_event(
            user_id=test_user_id,
            event_type="ComplexEvent",
            event_data=complex_data
        )
        
        # Récupération et validation
        events = await event_store.get_user_events(
            user_id=test_user_id,
            event_type="ComplexEvent"
        )
        
        retrieved_event = next(e for e in events if e["event_id"] == event_id)
        retrieved_data = retrieved_event["event_data"]
        
        # Validation intégrité
        assert retrieved_data["user_profile"]["name"] == "Test User"
        assert len(retrieved_data["user_profile"]["preferences"]) == 2
        assert retrieved_data["action_context"]["job_title"] == "Data Scientist"
        assert retrieved_data["results"]["score"] == 85.5
        assert isinstance(retrieved_data["results"]["recommendations"], list)
    
    @pytest.mark.asyncio
    async def test_event_stats_generation(self, event_store, test_user_id):
        """📊 Test génération stats événements"""
        # Setup events divers
        event_types = ["EnergyPurchased", "EnergyConsumed", "ActionPerformed"]
        
        for event_type in event_types:
            for i in range(2):  # 2 de chaque type
                await event_store.store_event(
                    user_id=test_user_id,
                    event_type=event_type,
                    event_data={"index": i}
                )
        
        # Test stats
        stats = await event_store.get_user_event_stats(test_user_id)
        
        assert stats["total_events"] >= 6
        assert "event_types" in stats
        assert stats["event_types"]["EnergyPurchased"] >= 2
        assert stats["event_types"]["EnergyConsumed"] >= 2
        assert stats["event_types"]["ActionPerformed"] >= 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])