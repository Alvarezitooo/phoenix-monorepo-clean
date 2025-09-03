"""
🧪 Tests d'Intégration Billing Complet - Sprint 4
Oracle Directives: Tests exhaustifs du flow Stripe → Luna Hub → Events
"""

import pytest
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

# Test framework
import httpx
from fastapi.testclient import TestClient

# Application sous test
from app.api_main import app
from app.billing.stripe_manager import StripeManager
from app.models.billing import PackCode, CreateIntentRequest
from app.database.event_store import event_store
from app.database.energy_tracker import energy_tracker


class TestBillingFlowComplete:
    """
    🎯 Test Suite Complète - Flow Billing Luna Hub
    Pattern: E2E Testing avec mocks Stripe
    """
    
    @pytest.fixture(scope="class")
    def client(self):
        """Client FastAPI pour tests"""
        return TestClient(app)
    
    @pytest.fixture
    def test_user_id(self):
        """User ID pour tests"""
        return f"test_user_{uuid.uuid4().hex[:8]}"
    
    @pytest.fixture
    def mock_jwt_token(self):
        """JWT Token mock pour tests"""
        return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoidGVzdF91c2VyIiwiaWF0IjoxNzAwMDAwMDAwfQ.mock_signature"
    
    def test_01_billing_health_check(self, client):
        """✅ Test 1: Health check système billing"""
        response = client.get("/billing/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "stripe_status" in data
        assert data["stripe_status"]["connected"] is True
        assert "pack_catalog" in data
        assert len(data["pack_catalog"]) >= 4  # 4 packs minimum
    
    def test_02_pack_catalog_integrity(self, client):
        """✅ Test 2: Intégrité catalogue des packs"""
        response = client.get("/billing/packs")
        assert response.status_code == 200
        
        packs = response.json()
        assert len(packs) >= 4
        
        # Vérification pack café_luna
        cafe_pack = next((p for p in packs if p["code"] == "cafe_luna"), None)
        assert cafe_pack is not None
        assert cafe_pack["name"] == "☕ Café Luna"
        assert cafe_pack["price_cents"] == 299
        assert cafe_pack["energy_units"] == 100
        assert "Bonus +10% premier achat" in str(cafe_pack["features"])
    
    @pytest.mark.asyncio
    async def test_03_create_payment_intent_first_purchase(self, test_user_id, mock_jwt_token):
        """🔥 Test 3: Création PaymentIntent avec bonus 1er achat"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            # Clear user history pour simuler 1er achat
            await event_store.clear_user_events(test_user_id)
            await energy_tracker.reset_user_energy(test_user_id)
            
            payload = {
                "user_id": test_user_id,
                "pack": "cafe_luna",
                "currency": "eur"
            }
            
            response = await client.post(
                "/billing/create-intent",
                json=payload,
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Validation structure réponse
            assert data["success"] is True
            assert "intent_id" in data
            assert "client_secret" in data
            assert data["amount_cents"] == 299
            assert data["currency"] == "eur"
            
            # Vérification bonus 1er achat
            assert data["is_first_purchase"] is True
            assert data["bonus_energy"] == 10  # +10% de 100 = 10
            assert data["total_energy_units"] == 110  # 100 + 10
            
            return data["intent_id"]
    
    @pytest.mark.asyncio  
    async def test_04_confirm_payment_and_energy_credit(self, test_user_id, mock_jwt_token):
        """💰 Test 4: Confirmation payment et crédit énergie"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            # Étape 1: Créer intent
            intent_response = await client.post(
                "/billing/create-intent",
                json={"user_id": test_user_id, "pack": "cafe_luna"},
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            intent_data = intent_response.json()
            intent_id = intent_data["intent_id"]
            
            # Étape 2: Confirmer payment
            confirm_response = await client.post(
                "/billing/confirm-payment",
                json={"user_id": test_user_id, "intent_id": intent_id},
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            
            assert confirm_response.status_code == 200
            confirm_data = confirm_response.json()
            
            # Validation confirmation
            assert confirm_data["success"] is True
            assert confirm_data["energy_credited"] == 110  # Avec bonus
            assert confirm_data["new_energy_balance"] == 110
            assert "event_id" in confirm_data
            
            # Vérification Event Store
            events = await event_store.get_user_events(
                user_id=test_user_id,
                event_type="EnergyPurchased"
            )
            assert len(events) == 1
            
            purchase_event = events[0]
            assert purchase_event["user_id"] == test_user_id
            assert purchase_event["event_data"]["pack"] == "cafe_luna"
            assert purchase_event["event_data"]["energy_units"] == 110
            assert purchase_event["event_data"]["bonus_applied"] is True
    
    @pytest.mark.asyncio
    async def test_05_payment_history(self, test_user_id, mock_jwt_token):
        """📜 Test 5: Historique des paiements"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/billing/history/{test_user_id}",
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] is True
            assert "payments" in data
            assert len(data["payments"]) >= 1
            
            # Vérification dernier paiement
            last_payment = data["payments"][0]
            assert last_payment["pack"] == "cafe_luna"
            assert last_payment["amount_cents"] == 299
            assert last_payment["energy_units"] == 110  # Avec bonus
            assert last_payment["status"] == "completed"
    
    @pytest.mark.asyncio
    async def test_06_second_purchase_no_bonus(self, test_user_id, mock_jwt_token):
        """🔄 Test 6: 2ème achat sans bonus"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            # Intent pour 2ème achat
            response = await client.post(
                "/billing/create-intent",
                json={"user_id": test_user_id, "pack": "cafe_luna"},
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            
            data = response.json()
            
            # Plus de bonus car pas 1er achat
            assert data["is_first_purchase"] is False
            assert data["bonus_energy"] == 0
            assert data["total_energy_units"] == 100  # Sans bonus
    
    @pytest.mark.asyncio
    async def test_07_refund_eligibility_check(self, test_user_id, mock_jwt_token):
        """🔄 Test 7: Vérification éligibilité remboursement"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            # Récupérer un event d'achat récent
            events = await event_store.get_user_events(
                user_id=test_user_id,
                event_type="EnergyPurchased"
            )
            assert len(events) >= 1
            
            event_id = events[0]["event_id"]
            
            # Checker éligibilité
            response = await client.post(
                "/refund/check-eligibility",
                json={
                    "user_id": test_user_id,
                    "action_event_id": event_id
                },
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] is True
            assert data["eligible"] is True  # Récent, donc éligible
            assert "reason" in data
            assert "action_details" in data
    
    @pytest.mark.asyncio
    async def test_08_refund_execution(self, test_user_id, mock_jwt_token):
        """💸 Test 8: Exécution remboursement"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            # Récupérer event à rembourser
            events = await event_store.get_user_events(
                user_id=test_user_id,
                event_type="EnergyPurchased"
            )
            event_id = events[0]["event_id"]
            original_energy = events[0]["event_data"]["energy_units"]
            
            # Balance avant refund
            balance_before = await energy_tracker.get_user_energy(test_user_id)
            
            # Exécuter refund
            response = await client.post(
                "/refund/request",
                json={
                    "user_id": test_user_id,
                    "action_event_id": event_id,
                    "reason": "Test automatisé - satisfaction non garantie"
                },
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] is True
            assert data["refunded_units"] == original_energy
            assert data["new_energy_balance"] == balance_before["current_energy"] + original_energy
            assert "refund_id" in data
            
            # Vérification Event Store refund
            refund_events = await event_store.get_user_events(
                user_id=test_user_id,
                event_type="EnergyRefunded"
            )
            assert len(refund_events) >= 1
    
    @pytest.mark.asyncio
    async def test_09_refund_history(self, test_user_id, mock_jwt_token):
        """📋 Test 9: Historique des remboursements"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/refund/history/{test_user_id}",
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] is True
            assert "refunds" in data
            assert len(data["refunds"]) >= 1
            
            # Vérification refund
            refund = data["refunds"][0]
            assert refund["user_id"] == test_user_id
            assert refund["reason"] == "Test automatisé - satisfaction non garantie"
            assert refund["status"] == "completed"
    
    @pytest.mark.asyncio
    async def test_10_idempotency_protection(self, test_user_id, mock_jwt_token):
        """🛡️ Test 10: Protection idempotence"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            # Intent avec clé idempotence
            idem_key = f"test_idem_{uuid.uuid4().hex}"
            
            # 1er appel
            response1 = await client.post(
                "/billing/create-intent",
                json={"user_id": test_user_id, "pack": "cafe_luna"},
                headers={
                    "Authorization": f"Bearer {mock_jwt_token}",
                    "X-Idempotency-Key": idem_key
                }
            )
            
            # 2ème appel identique 
            response2 = await client.post(
                "/billing/create-intent", 
                json={"user_id": test_user_id, "pack": "cafe_luna"},
                headers={
                    "Authorization": f"Bearer {mock_jwt_token}",
                    "X-Idempotency-Key": idem_key
                }
            )
            
            # Même réponse (idempotence)
            assert response1.status_code == response2.status_code
            data1, data2 = response1.json(), response2.json()
            assert data1["intent_id"] == data2["intent_id"]
    
    @pytest.mark.asyncio
    async def test_11_energy_consumption_flow(self, test_user_id, mock_jwt_token):
        """⚡ Test 11: Flow complet consommation énergie"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            # S'assurer que user a de l'énergie
            await energy_tracker.credit_energy(test_user_id, 50, "test_setup")
            
            # Test can-perform
            can_perform_response = await client.post(
                "/luna/energy/can-perform",
                json={"user_id": test_user_id, "action_name": "analyse_cv"},
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            
            assert can_perform_response.status_code == 200
            can_data = can_perform_response.json()
            assert can_data["success"] is True
            assert can_data["can_perform"] is True
            
            # Test consume
            consume_response = await client.post(
                "/luna/energy/consume",
                json={
                    "user_id": test_user_id,
                    "action_name": "analyse_cv",
                    "context": {"test": True}
                },
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            
            assert consume_response.status_code == 200
            consume_data = consume_response.json()
            assert consume_data["success"] is True
            assert consume_data["energy_consumed"] > 0
    
    @pytest.mark.asyncio
    async def test_12_pack_variations_pricing(self, test_user_id, mock_jwt_token):
        """💎 Test 12: Variations prix selon packs"""
        packs_to_test = [
            ("cafe_luna", 299, 100),
            ("energie_pro", 599, 250),
            ("power_unlimited", 999, 500),
            ("luna_unlimited", 1999, 2000)
        ]
        
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            for pack_code, expected_price, expected_energy in packs_to_test:
                response = await client.post(
                    "/billing/create-intent",
                    json={"user_id": f"{test_user_id}_{pack_code}", "pack": pack_code},
                    headers={"Authorization": f"Bearer {mock_jwt_token}"}
                )
                
                data = response.json()
                assert data["amount_cents"] == expected_price
                # Energy peut avoir bonus si 1er achat
                base_energy = expected_energy
                assert data["total_energy_units"] >= base_energy
    
    @pytest.mark.asyncio
    async def test_13_edge_cases_error_handling(self, mock_jwt_token):
        """🚨 Test 13: Gestion erreurs et cas limites"""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            # Pack inexistant
            response = await client.post(
                "/billing/create-intent",
                json={"user_id": "test", "pack": "pack_inexistant"},
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            assert response.status_code == 422
            
            # Intent inexistant pour confirm
            response = await client.post(
                "/billing/confirm-payment",
                json={"user_id": "test", "intent_id": "intent_inexistant"},
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            assert response.status_code in [400, 404]
            
            # Refund sur action inexistante
            response = await client.post(
                "/refund/request",
                json={"user_id": "test", "action_event_id": "event_inexistant"},
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )
            assert response.status_code in [400, 404]


if __name__ == "__main__":
    # Run tests avec pytest
    pytest.main([__file__, "-v", "--tb=short"])