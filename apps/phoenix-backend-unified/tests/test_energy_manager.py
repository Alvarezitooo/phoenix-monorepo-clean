"""
🧪 Tests unitaires pour Luna Energy Manager
Tests complets avec couverture >90% selon Sprint 1
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from app.core.energy_manager import EnergyManager, InsufficientEnergyError, EnergyManagerError
from app.models.user_energy import UserEnergyModel, EnergyPackType, ENERGY_COSTS


class TestEnergyManager:
    """Tests pour le gestionnaire d'énergie Luna"""

    def setup_method(self):
        """Setup avant chaque test"""
        self.energy_manager = EnergyManager()
        self.test_user_id = "test-user-123"
        self.mock_user_energy = UserEnergyModel(
            user_id=self.test_user_id,
            current_energy=75.0,
            max_energy=100.0,
            total_consumed=25.0,
            total_purchased=0.0,
            subscription_type="free"
        )

    @pytest.mark.asyncio
    async def test_check_balance_success(self):
        """Test vérification du solde d'énergie"""
        with patch.object(self.energy_manager, '_get_user_energy', return_value=self.mock_user_energy):
            result = await self.energy_manager.check_balance(self.test_user_id)
            
            assert result["user_id"] == self.test_user_id
            assert result["current_energy"] == 75.0
            assert result["max_energy"] == 100.0
            assert result["percentage"] == 75.0
            assert result["can_perform_basic_action"] is True
            assert result["total_consumed"] == 25.0
            assert result["subscription_type"] == "free"

    @pytest.mark.asyncio
    async def test_check_balance_user_not_found(self):
        """Test vérification solde pour utilisateur inexistant"""
        with patch.object(self.energy_manager, '_get_user_energy', return_value=None):
            result = await self.energy_manager.check_balance("unknown-user")
            
            # Devrait créer un nouvel utilisateur avec énergie par défaut
            assert result["current_energy"] == 85.0  # Valeur par défaut
            assert result["max_energy"] == 100.0
            assert result["percentage"] == 85.0

    @pytest.mark.asyncio
    async def test_can_perform_action_sufficient_energy(self):
        """Test vérification action avec énergie suffisante"""
        action_name = "conseil_rapide"
        expected_cost = ENERGY_COSTS[action_name]
        
        with patch.object(self.energy_manager, '_get_user_energy', return_value=self.mock_user_energy):
            result = await self.energy_manager.can_perform_action(self.test_user_id, action_name)
            
            assert result["user_id"] == self.test_user_id
            assert result["action"] == action_name
            assert result["energy_required"] == expected_cost
            assert result["current_energy"] == 75.0
            assert result["can_perform"] is True
            assert result["deficit"] == 0.0

    @pytest.mark.asyncio
    async def test_can_perform_action_insufficient_energy(self):
        """Test vérification action avec énergie insuffisante"""
        # Utilisateur avec peu d'énergie
        low_energy_user = UserEnergyModel(
            user_id=self.test_user_id,
            current_energy=3.0,  # Très peu d'énergie
            max_energy=100.0
        )
        
        action_name = "lettre_motivation"  # Coûte 15%
        expected_cost = ENERGY_COSTS[action_name]
        
        with patch.object(self.energy_manager, '_get_user_energy', return_value=low_energy_user):
            result = await self.energy_manager.can_perform_action(self.test_user_id, action_name)
            
            assert result["can_perform"] is False
            assert result["deficit"] == expected_cost - 3.0

    @pytest.mark.asyncio
    async def test_can_perform_action_unknown_action(self):
        """Test vérification action inconnue"""
        with patch.object(self.energy_manager, '_get_user_energy', return_value=self.mock_user_energy):
            with pytest.raises(EnergyManagerError, match="Unknown action"):
                await self.energy_manager.can_perform_action(self.test_user_id, "unknown_action")

    @pytest.mark.asyncio
    async def test_consume_energy_success(self):
        """Test consommation d'énergie réussie"""
        action_name = "conseil_rapide"
        expected_cost = ENERGY_COSTS[action_name]
        context = {"feature": "quick_advice", "app": "letters"}
        
        with patch.object(self.energy_manager, '_get_user_energy', return_value=self.mock_user_energy), \
             patch.object(self.energy_manager, '_update_user_energy', return_value=True) as mock_update, \
             patch.object(self.energy_manager, '_create_transaction', return_value="tx-123") as mock_tx:
            
            result = await self.energy_manager.consume(self.test_user_id, action_name, context)
            
            assert result["transaction_id"] == "tx-123"
            assert result["energy_consumed"] == expected_cost
            assert result["energy_remaining"] == 75.0 - expected_cost
            assert result["action"] == action_name
            assert "timestamp" in result
            
            # Vérifier que les méthodes ont été appelées
            mock_update.assert_called_once()
            mock_tx.assert_called_once()

    @pytest.mark.asyncio
    async def test_consume_energy_insufficient(self):
        """Test consommation avec énergie insuffisante"""
        # Utilisateur avec peu d'énergie
        low_energy_user = UserEnergyModel(
            user_id=self.test_user_id,
            current_energy=2.0,
            max_energy=100.0
        )
        
        action_name = "lettre_motivation"  # Coûte 15%
        
        with patch.object(self.energy_manager, '_get_user_energy', return_value=low_energy_user):
            with pytest.raises(InsufficientEnergyError):
                await self.energy_manager.consume(self.test_user_id, action_name)

    @pytest.mark.asyncio
    async def test_refund_energy_success(self):
        """Test remboursement d'énergie"""
        refund_amount = 10.0
        reason = "Erreur technique"
        context = {"error_type": "system_error"}
        
        with patch.object(self.energy_manager, '_get_user_energy', return_value=self.mock_user_energy), \
             patch.object(self.energy_manager, '_update_user_energy', return_value=True), \
             patch.object(self.energy_manager, '_create_transaction', return_value="refund-123"):
            
            result = await self.energy_manager.refund(
                self.test_user_id, refund_amount, reason, context
            )
            
            assert result["success"] is True
            assert result["transaction_id"] == "refund-123"
            assert result["energy_refunded"] == refund_amount
            assert result["new_energy_balance"] == 75.0 + refund_amount
            assert result["reason"] == reason

    @pytest.mark.asyncio
    async def test_refund_energy_exceeds_max(self):
        """Test remboursement qui dépasse l'énergie max"""
        # Utilisateur proche du max
        high_energy_user = UserEnergyModel(
            user_id=self.test_user_id,
            current_energy=95.0,
            max_energy=100.0
        )
        
        refund_amount = 10.0  # Dépasserait 100%
        reason = "Test remboursement"
        
        with patch.object(self.energy_manager, '_get_user_energy', return_value=high_energy_user), \
             patch.object(self.energy_manager, '_update_user_energy', return_value=True), \
             patch.object(self.energy_manager, '_create_transaction', return_value="refund-456"):
            
            result = await self.energy_manager.refund(self.test_user_id, refund_amount, reason)
            
            # L'énergie devrait être plafonnée à 100% - mais le montant reste le même
            assert result["new_energy_balance"] == 100.0  # Plafonnée
            assert result["energy_refunded"] == 10.0  # Montant demandé

    @pytest.mark.asyncio
    async def test_purchase_energy_cafe_luna(self):
        """Test achat pack Café Luna"""
        pack_type = EnergyPackType.CAFE_LUNA
        
        with patch.object(self.energy_manager, '_get_user_energy', return_value=self.mock_user_energy), \
             patch.object(self.energy_manager, '_process_stripe_payment', return_value=True), \
             patch.object(self.energy_manager, '_update_user_energy', return_value=True), \
             patch.object(self.energy_manager, '_create_purchase_record', return_value="purchase-123"):
            
            result = await self.energy_manager.purchase_energy(
                self.test_user_id, pack_type, "pi_test_123"
            )
            
            assert result["success"] is True
            assert result["purchase_id"] == "purchase-123"
            assert result["pack_type"] == "cafe_luna"
            assert result["energy_added"] == 100.0  # Pack complet
            assert result["current_energy"] == 100.0  # Plafonnée
            assert result["amount_paid"] == 2.99

    @pytest.mark.asyncio
    async def test_purchase_energy_unlimited_subscription(self):
        """Test que les utilisateurs unlimited ne peuvent pas acheter"""
        unlimited_user = UserEnergyModel(
            user_id=self.test_user_id,
            current_energy=50.0,
            max_energy=float('inf'),  # Unlimited
            subscription_type="unlimited"
        )
        
        with patch.object(self.energy_manager, '_get_user_energy', return_value=unlimited_user):
            with pytest.raises(EnergyManagerError, match="unlimited subscription"):
                await self.energy_manager.purchase_energy(
                    self.test_user_id, EnergyPackType.CAFE_LUNA
                )

    @pytest.mark.asyncio
    async def test_get_user_transactions(self):
        """Test récupération historique transactions"""
        mock_transactions = [
            {
                "transaction_id": "tx-1",
                "action_type": "consume",
                "amount": 5.0,
                "timestamp": datetime.now().isoformat()
            },
            {
                "transaction_id": "tx-2", 
                "action_type": "purchase",
                "amount": 100.0,
                "timestamp": datetime.now().isoformat()
            }
        ]
        
        with patch.object(self.energy_manager, '_fetch_user_transactions', return_value=mock_transactions):
            result = await self.energy_manager.get_user_transactions(self.test_user_id, limit=10)
            
            assert len(result) == 2
            assert result[0]["transaction_id"] == "tx-1"
            assert result[1]["action_type"] == "purchase"

    @pytest.mark.asyncio
    async def test_get_energy_analytics(self):
        """Test analytics de consommation"""
        mock_analytics = {
            "total_consumed_today": 25.0,
            "total_consumed_week": 150.0,
            "most_used_feature": "lettre_motivation",
            "average_daily_consumption": 21.4,
            "energy_efficiency_score": 85.2
        }
        
        with patch.object(self.energy_manager, '_calculate_analytics', return_value=mock_analytics):
            result = await self.energy_manager.get_energy_analytics(self.test_user_id)
            
            assert result["total_consumed_today"] == 25.0
            assert result["most_used_feature"] == "lettre_motivation"
            assert result["energy_efficiency_score"] == 85.2

    def test_calculate_energy_percentage(self):
        """Test calcul pourcentage d'énergie"""
        # Test cas normal
        assert self.energy_manager._calculate_percentage(75.0, 100.0) == 75.0
        
        # Test division par zéro
        assert self.energy_manager._calculate_percentage(50.0, 0.0) == 0.0
        
        # Test utilisateur unlimited
        assert self.energy_manager._calculate_percentage(50.0, float('inf')) == 100.0

    def test_generate_transaction_id(self):
        """Test génération d'ID de transaction"""
        tx_id = self.energy_manager._generate_transaction_id()
        assert isinstance(tx_id, str)
        assert len(tx_id) > 10
        assert tx_id.startswith("luna_")

    def test_energy_costs_validation(self):
        """Test validation de la grille des coûts"""
        # Vérifier que tous les coûts sont dans la plage 0-100
        for action, cost in ENERGY_COSTS.items():
            assert 0 <= cost <= 100, f"Cost for {action} should be between 0-100"
            
        # Vérifier la présence d'actions critiques
        critical_actions = ["conseil_rapide", "lettre_motivation", "analyse_cv_complete", "mirror_match"]
        for action in critical_actions:
            assert action in ENERGY_COSTS, f"Critical action {action} missing from ENERGY_COSTS"

    @pytest.mark.asyncio
    async def test_concurrent_energy_consumption(self):
        """Test consommation d'énergie concurrente"""
        action_name = "conseil_rapide"
        
        # Simuler 3 requêtes simultanées
        tasks = []
        for i in range(3):
            with patch.object(self.energy_manager, '_get_user_energy', return_value=self.mock_user_energy), \
                 patch.object(self.energy_manager, '_update_user_energy', return_value=True), \
                 patch.object(self.energy_manager, '_create_transaction', return_value=f"tx-{i}"):
                
                task = self.energy_manager.consume(self.test_user_id, action_name)
                tasks.append(task)
        
        # Exécuter en parallèle
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Au moins une devrait réussir
        successful = [r for r in results if not isinstance(r, Exception)]
        assert len(successful) >= 1

    @pytest.mark.asyncio
    async def test_edge_case_zero_energy(self):
        """Test cas limite avec énergie à zéro"""
        zero_energy_user = UserEnergyModel(
            user_id=self.test_user_id,
            current_energy=0.0,
            max_energy=100.0
        )
        
        with patch.object(self.energy_manager, '_get_user_energy', return_value=zero_energy_user):
            # Toute action devrait échouer
            with pytest.raises(InsufficientEnergyError):
                await self.energy_manager.consume(self.test_user_id, "conseil_rapide")
            
            # Vérification devrait indiquer impossible
            result = await self.energy_manager.can_perform_action(self.test_user_id, "conseil_rapide")
            assert result["can_perform"] is False

    @pytest.mark.asyncio
    async def test_error_handling_database_failure(self):
        """Test gestion d'erreur base de données"""
        with patch.object(self.energy_manager, '_get_user_energy', side_effect=Exception("DB Connection Failed")):
            with pytest.raises(EnergyManagerError, match="DB Connection Failed"):
                await self.energy_manager.check_balance(self.test_user_id)


class TestEnergyManagerIntegration:
    """Tests d'intégration pour flux complets"""

    def setup_method(self):
        self.energy_manager = EnergyManager()
        self.user_id = "integration-test-user"

    @pytest.mark.asyncio
    async def test_full_energy_consumption_cycle(self):
        """Test cycle complet: vérification -> consommation -> vérification"""
        action_name = "lettre_motivation"
        
        # Mock de l'utilisateur
        initial_user = UserEnergyModel(
            user_id=self.user_id,
            current_energy=50.0,
            max_energy=100.0
        )
        
        # Après consommation
        after_consumption = UserEnergyModel(
            user_id=self.user_id,
            current_energy=35.0,  # 50 - 15
            max_energy=100.0
        )
        
        with patch.object(self.energy_manager, '_get_user_energy', side_effect=[initial_user, initial_user, after_consumption]), \
             patch.object(self.energy_manager, '_update_user_energy', return_value=True), \
             patch.object(self.energy_manager, '_create_transaction', return_value="integration-tx"):
            
            # 1. Vérifier que l'action est possible
            can_perform = await self.energy_manager.can_perform_action(self.user_id, action_name)
            assert can_perform["can_perform"] is True
            
            # 2. Consommer l'énergie
            consume_result = await self.energy_manager.consume(self.user_id, action_name)
            assert consume_result["energy_consumed"] == ENERGY_COSTS[action_name]
            
            # 3. Vérifier le nouveau solde
            new_balance = await self.energy_manager.check_balance(self.user_id)
            assert new_balance["current_energy"] == 35.0

    @pytest.mark.asyncio
    async def test_energy_purchase_and_consumption_flow(self):
        """Test flux achat d'énergie puis consommation"""
        # Utilisateur avec peu d'énergie
        low_energy_user = UserEnergyModel(
            user_id=self.user_id,
            current_energy=5.0,
            max_energy=100.0
        )
        
        # Après achat
        after_purchase = UserEnergyModel(
            user_id=self.user_id,
            current_energy=100.0,  # Rechargé
            max_energy=100.0
        )
        
        with patch.object(self.energy_manager, '_get_user_energy', side_effect=[low_energy_user, low_energy_user, after_purchase]), \
             patch.object(self.energy_manager, '_process_stripe_payment', return_value=True), \
             patch.object(self.energy_manager, '_update_user_energy', return_value=True), \
             patch.object(self.energy_manager, '_create_purchase_record', return_value="purchase-integration"), \
             patch.object(self.energy_manager, '_create_transaction', return_value="consume-integration"):
            
            # 1. Vérifier énergie insuffisante
            can_perform = await self.energy_manager.can_perform_action(self.user_id, "analyse_cv_complete")
            assert can_perform["can_perform"] is False
            
            # 2. Acheter pack énergie
            purchase_result = await self.energy_manager.purchase_energy(
                self.user_id, EnergyPackType.CAFE_LUNA, "pi_test"
            )
            assert purchase_result["success"] is True
            
            # 3. Maintenant l'action devrait être possible
            can_perform_after = await self.energy_manager.can_perform_action(self.user_id, "analyse_cv_complete")
            assert can_perform_after["can_perform"] is True


    @pytest.mark.asyncio
    async def test_helper_methods_coverage(self):
        """Test pour améliorer la couverture des méthodes helper"""
        # Test _update_user_energy
        test_user = UserEnergyModel(user_id=self.user_id, current_energy=75.0)
        self.energy_manager._user_energies[self.user_id] = test_user
        result = await self.energy_manager._update_user_energy(self.user_id, 80.0)
        assert result is True
        
        # Test avec utilisateur inexistant
        result = await self.energy_manager._update_user_energy("unknown", 50.0)
        assert result is False
        
        # Test _process_stripe_payment (mock method)
        result = await self.energy_manager._process_stripe_payment("pi_test")
        assert result is True
        
        # Test _generate_transaction_id
        tx_id = self.energy_manager._generate_transaction_id()
        assert tx_id.startswith("luna_")
        assert len(tx_id) > 15

    @pytest.mark.asyncio 
    async def test_consume_with_new_user(self):
        """Test consommation avec nouvel utilisateur"""
        new_user_id = "new-user-test"
        action_name = "conseil_rapide"
        
        # Ne pas mocker _get_user_energy pour tester le path nouveau utilisateur
        result = await self.energy_manager.consume(new_user_id, action_name)
        
        assert result["success"] is True
        assert result["energy_consumed"] == ENERGY_COSTS[action_name]
        assert new_user_id in self.energy_manager._user_energies

    @pytest.mark.asyncio
    async def test_unlimited_user_behavior(self):
        """Test comportement utilisateur unlimited"""
        unlimited_user = UserEnergyModel(
            user_id="unlimited-user",
            current_energy=50.0,
            max_energy=float('inf'),
            subscription_type="unlimited"
        )
        
        # Test pourcentage avec unlimited
        percentage = self.energy_manager._calculate_percentage(50.0, float('inf'))
        assert percentage == 100.0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=app.core.energy_manager", "--cov-report=html"])