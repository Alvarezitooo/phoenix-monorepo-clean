"""
Tests complémentaires pour améliorer la couverture à >90%
"""

import pytest
from app.core.energy_manager import EnergyManager
from app.models.user_energy import UserEnergyModel


class TestCoverageBoost:
    """Tests spécifiques pour atteindre 90%+ de couverture"""

    def setup_method(self):
        self.energy_manager = EnergyManager()

    @pytest.mark.asyncio
    async def test_basic_functionality_coverage(self):
        """Test pour couvrir les fonctionnalités de base"""
        user_id = "coverage-test-user"
        
        # Test création automatique utilisateur
        user = await self.energy_manager.get_user_energy(user_id)
        assert user.user_id == user_id
        assert user.current_energy == 85.0
        
        # Test transactions avec nouvel utilisateur
        transactions = await self.energy_manager.get_user_transactions(user_id)
        assert len(transactions) == 0
        
        # Test analytics avec nouvel utilisateur
        analytics = await self.energy_manager.get_energy_analytics(user_id)
        assert analytics["total_transactions"] == 0
        
        # Test méthodes helper
        result = await self.energy_manager._update_user_energy(user_id, 90.0)
        assert result is True
        
        result = await self.energy_manager._update_user_energy("nonexistent", 50.0)
        assert result is False
        
        # Test Stripe mock
        payment_result = await self.energy_manager._process_stripe_payment("test")
        assert payment_result is True
        
        # Test ID generation
        tx_id = self.energy_manager._generate_transaction_id()
        assert tx_id.startswith("luna_")
        
        # Test pourcentages
        assert self.energy_manager._calculate_percentage(50, 100) == 50.0
        assert self.energy_manager._calculate_percentage(50, 0) == 0.0
        assert self.energy_manager._calculate_percentage(50, float('inf')) == 100.0
    
    @pytest.mark.asyncio
    async def test_edge_cases_for_full_coverage(self):
        """Test des cas limites pour couvrir 100% des lignes"""
        user_id = "edge-case-user"
        
        # Test consommation avec l'utilisateur non mocké
        result = await self.energy_manager.consume(user_id, "conseil_rapide")
        assert result["success"] is True
        
        # Test can_perform_action avec utilisateur non mocké
        result = await self.energy_manager.can_perform_action(user_id, "lettre_motivation")
        assert "can_perform" in result
        
        # Test refund avec utilisateur non mocké
        result = await self.energy_manager.refund(user_id, 5.0, "Test refund")
        assert result["success"] is True
        
        # Test purchase avec utilisateur non mocké
        from app.models.user_energy import EnergyPackType
        result = await self.energy_manager.purchase_energy(user_id, EnergyPackType.CAFE_LUNA)
        assert result["success"] is True