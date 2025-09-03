"""
🔬 Tests Unitaires Stripe Manager - Sprint 4
Validation logique métier et intégrations Stripe
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import stripe
from datetime import datetime, timezone

from app.billing.stripe_manager import StripeManager
from app.models.billing import PackCode


class TestStripeManager:
    """
    🎯 Test Suite - Stripe Manager
    Validation sans appels API réels
    """
    
    @pytest.fixture
    def mock_stripe_key(self):
        return "sk_test_mock_key_for_testing"
    
    @pytest.fixture
    def stripe_manager(self, mock_stripe_key):
        with patch('app.billing.stripe_manager.stripe.api_key', mock_stripe_key):
            return StripeManager(api_key=mock_stripe_key)
    
    def test_initialization_success(self, mock_stripe_key):
        """✅ Test initialisation réussie"""
        manager = StripeManager(api_key=mock_stripe_key)
        assert manager.api_key == mock_stripe_key
        assert stripe.api_key == mock_stripe_key
    
    def test_initialization_missing_key(self):
        """❌ Test initialisation sans clé"""
        with pytest.raises(StripeConfigError, match="Stripe API key is required"):
            StripeManager(api_key=None)
    
    @patch('stripe.PaymentIntent.create')
    def test_create_payment_intent_success(self, mock_stripe_create, stripe_manager):
        """💳 Test création PaymentIntent réussie"""
        # Mock Stripe response
        mock_intent = Mock()
        mock_intent.id = "pi_test_123456"
        mock_intent.client_secret = "pi_test_123456_secret_abc"
        mock_intent.amount = 299
        mock_intent.currency = "eur"
        mock_intent.status = "requires_payment_method"
        mock_stripe_create.return_value = mock_intent
        
        # Test création
        result = stripe_manager.create_payment_intent(
            user_id="test_user",
            pack=PackCode.CAFE_LUNA,
            currency="eur"
        )
        
        # Validations
        assert result["intent_id"] == "pi_test_123456"
        assert result["client_secret"] == "pi_test_123456_secret_abc"
        assert result["amount_cents"] == 299
        assert result["currency"] == "eur"
        assert result["status"] == "requires_payment_method"
        
        # Vérification appel Stripe
        mock_stripe_create.assert_called_once()
        call_args = mock_stripe_create.call_args[1]
        assert call_args["amount"] == 299
        assert call_args["currency"] == "eur"
        assert "test_user" in call_args["metadata"]["user_id"]
        assert call_args["metadata"]["pack"] == "cafe_luna"
    
    @patch('stripe.PaymentIntent.create')
    def test_create_payment_intent_stripe_error(self, mock_stripe_create, stripe_manager):
        """🚨 Test erreur Stripe lors création"""
        # Mock Stripe exception
        mock_stripe_create.side_effect = stripe.error.CardError(
            "Card was declined",
            param="card",
            code="card_declined"
        )
        
        # Test gestion erreur
        with pytest.raises(StripePaymentError, match="Card was declined"):
            stripe_manager.create_payment_intent(
                user_id="test_user",
                pack=PackCode.CAFE_LUNA
            )
    
    @patch('stripe.PaymentIntent.retrieve')
    def test_get_payment_intent_success(self, mock_stripe_retrieve, stripe_manager):
        """🔍 Test récupération PaymentIntent"""
        # Mock response
        mock_intent = Mock()
        mock_intent.id = "pi_test_123"
        mock_intent.status = "succeeded"
        mock_intent.amount = 599
        mock_intent.metadata = {"user_id": "test_user", "pack": "energie_pro"}
        mock_stripe_retrieve.return_value = mock_intent
        
        # Test récupération
        result = stripe_manager.get_payment_intent("pi_test_123")
        
        assert result["intent_id"] == "pi_test_123"
        assert result["status"] == "succeeded"
        assert result["amount_cents"] == 599
        assert result["user_id"] == "test_user"
        assert result["pack"] == "energie_pro"
    
    @patch('stripe.PaymentIntent.retrieve')
    def test_get_payment_intent_not_found(self, mock_stripe_retrieve, stripe_manager):
        """❓ Test PaymentIntent introuvable"""
        mock_stripe_retrieve.side_effect = stripe.error.InvalidRequestError(
            "No such payment_intent",
            param="id"
        )
        
        with pytest.raises(StripeError, match="No such payment_intent"):
            stripe_manager.get_payment_intent("pi_inexistant")
    
    @patch('stripe.PaymentIntent.confirm')
    def test_confirm_payment_intent_success(self, mock_stripe_confirm, stripe_manager):
        """✅ Test confirmation PaymentIntent"""
        # Mock confirmation
        mock_intent = Mock()
        mock_intent.id = "pi_test_123"
        mock_intent.status = "succeeded"
        mock_intent.charges = Mock()
        mock_intent.charges.data = [Mock()]
        mock_intent.charges.data[0].id = "ch_test_abc"
        mock_stripe_confirm.return_value = mock_intent
        
        # Test confirmation
        result = stripe_manager.confirm_payment_intent("pi_test_123")
        
        assert result["intent_id"] == "pi_test_123"
        assert result["status"] == "succeeded"
        assert result["confirmed"] is True
        assert result["charge_id"] == "ch_test_abc"
    
    @patch('stripe.PaymentIntent.confirm')
    def test_confirm_payment_intent_failed(self, mock_stripe_confirm, stripe_manager):
        """❌ Test confirmation échouée"""
        mock_stripe_confirm.side_effect = stripe.error.CardError(
            "Your card was declined",
            param="payment_method",
            code="card_declined"
        )
        
        with pytest.raises(StripePaymentError, match="Your card was declined"):
            stripe_manager.confirm_payment_intent("pi_test_123")
    
    @patch('stripe.Refund.create')
    def test_create_refund_success(self, mock_stripe_refund, stripe_manager):
        """💸 Test création refund"""
        # Mock refund response
        mock_refund = Mock()
        mock_refund.id = "re_test_123"
        mock_refund.amount = 299
        mock_refund.status = "succeeded"
        mock_refund.charge = "ch_test_abc"
        mock_stripe_refund.return_value = mock_refund
        
        # Test création refund
        result = stripe_manager.create_refund(
            payment_intent_id="pi_test_123",
            reason="Test refund"
        )
        
        assert result["refund_id"] == "re_test_123"
        assert result["amount_refunded"] == 299
        assert result["status"] == "succeeded"
        assert result["charge_id"] == "ch_test_abc"
    
    def test_pack_pricing_consistency(self, stripe_manager):
        """💰 Test cohérence prix des packs"""
        test_cases = [
            (PackCode.CAFE_LUNA, 299, 100),
            (PackCode.ENERGIE_PRO, 599, 250),
            (PackCode.POWER_UNLIMITED, 999, 500),
            (PackCode.LUNA_UNLIMITED, 1999, 2000)
        ]
        
        for pack, expected_price, expected_energy in test_cases:
            assert get_pack_price(pack) == expected_price
            assert get_pack_energy(pack) == expected_energy
    
    @patch('stripe.Account.retrieve')
    def test_health_check_success(self, mock_stripe_account, stripe_manager):
        """🏥 Test health check réussi"""
        # Mock account info
        mock_account = Mock()
        mock_account.id = "acct_test_123"
        mock_account.country = "FR"
        mock_account.default_currency = "eur"
        mock_stripe_account.return_value = mock_account
        
        # Test health check
        health = stripe_manager.health_check()
        
        assert health["connected"] is True
        assert health["account_id"] == "acct_test_123"
        assert health["country"] == "FR"
        assert health["currency"] == "eur"
        assert "last_check" in health
    
    @patch('stripe.Account.retrieve')
    def test_health_check_failure(self, mock_stripe_account, stripe_manager):
        """🚨 Test health check échoué"""
        mock_stripe_account.side_effect = stripe.error.AuthenticationError(
            "Invalid API key"
        )
        
        health = stripe_manager.health_check()
        
        assert health["connected"] is False
        assert "error" in health
        assert "Invalid API key" in health["error"]
    
    @patch('stripe.BalanceTransaction.list')
    def test_get_statistics_success(self, mock_stripe_list, stripe_manager):
        """📊 Test statistiques Stripe"""
        # Mock transactions
        mock_txn = Mock()
        mock_txn.amount = 299
        mock_txn.fee = 15
        mock_txn.currency = "eur"
        mock_txn.created = int(datetime.now(timezone.utc).timestamp())
        
        mock_response = Mock()
        mock_response.data = [mock_txn]
        mock_stripe_list.return_value = mock_response
        
        # Test stats
        stats = stripe_manager.get_statistics()
        
        assert stats["total_transactions"] == 1
        assert stats["total_volume"] == 299
        assert stats["total_fees"] == 15
        assert stats["currency"] == "eur"
    
    def test_idempotency_key_generation(self, stripe_manager):
        """🔑 Test génération clés idempotence"""
        key1 = stripe_manager._generate_idempotency_key("user1", "cafe_luna")
        key2 = stripe_manager._generate_idempotency_key("user1", "cafe_luna")
        key3 = stripe_manager._generate_idempotency_key("user2", "cafe_luna")
        
        # Keys différentes à chaque fois
        assert key1 != key2
        assert key1 != key3
        assert key2 != key3
        
        # Format attendu
        assert key1.startswith("luna_")
        assert "user1" in key1
        assert "cafe_luna" in key1
    
    @patch('stripe.PaymentIntent.create')
    def test_metadata_enrichment(self, mock_stripe_create, stripe_manager):
        """🏷️ Test enrichissement metadata"""
        mock_intent = Mock()
        mock_intent.id = "pi_test"
        mock_intent.client_secret = "pi_test_secret"
        mock_stripe_create.return_value = mock_intent
        
        # Test avec metadata custom
        stripe_manager.create_payment_intent(
            user_id="user123",
            pack=PackCode.CAFE_LUNA,
            metadata={"source": "website", "campaign": "spring2024"}
        )
        
        # Vérification metadata
        call_args = mock_stripe_create.call_args[1]
        metadata = call_args["metadata"]
        
        assert metadata["user_id"] == "user123"
        assert metadata["pack"] == "cafe_luna"
        assert metadata["source"] == "website"
        assert metadata["campaign"] == "spring2024"
        assert "luna_env" in metadata


if __name__ == "__main__":
    pytest.main([__file__, "-v"])