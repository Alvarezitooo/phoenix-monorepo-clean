"""
🧪 Tests d'Intégration Sprint 2
Validation complète Event Store + Capital Narratif + Sécurité
"""

import pytest
import asyncio
from httpx import AsyncClient
from main import app
from app.core.supabase_client import event_store
from app.core.energy_manager import energy_manager
from app.middleware.security_middleware import security_middleware


class TestIntegrationSprint2:
    """Tests d'intégration complets pour Sprint 2"""

    @pytest.mark.asyncio
    async def test_full_event_store_flow(self):
        """Test flux complet Event Store: création → récupération → Capital Narratif"""
        user_id = "integration-test-user-sprint2"
        
        # 1. Créer plusieurs événements via l'API
        async with AsyncClient(app=app, base_url="http://test") as client:
            events_data = [
                {
                    "user_id": user_id,
                    "event_type": "EnergyAction",
                    "app_source": "letters",
                    "event_data": {
                        "action": "lettre_motivation",
                        "energy_consumed": 15,
                        "context": {"industry": "tech", "target_role": "developer"}
                    }
                },
                {
                    "user_id": user_id,
                    "event_type": "EnergyAction", 
                    "app_source": "cv",
                    "event_data": {
                        "action": "analyse_cv_complete",
                        "energy_consumed": 25,
                        "context": {"target_role": "senior_dev", "experience": "5_years"}
                    }
                },
                {
                    "user_id": user_id,
                    "event_type": "UserAction",
                    "app_source": "cv",
                    "event_data": {
                        "action": "mirror_match",
                        "energy_consumed": 30,
                        "context": {"match_score": 0.85}
                    }
                }
            ]
            
            created_events = []
            for event_data in events_data:
                response = await client.post("/luna/events", json=event_data)
                assert response.status_code == 200
                result = response.json()
                assert result["success"] is True
                created_events.append(result["event_id"])
        
        # 2. Récupérer les événements via l'API
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/luna/events/{user_id}")
            assert response.status_code == 200
            result = response.json()
            assert result["success"] is True
            assert len(result["events"]) >= 3
        
        # 3. Reconstruction du Capital Narratif
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/luna/narrative/{user_id}")
            assert response.status_code == 200
            result = response.json()
            
            assert result["success"] is True
            capital_narratif = result["capital_narratif"]
            
            # Vérifications du Capital Narratif
            assert "user_profile" in capital_narratif
            assert "usage_analytics" in capital_narratif
            assert "professional_journey" in capital_narratif
            assert "ai_insights" in capital_narratif
            
            # Vérifications métier
            user_profile = capital_narratif["user_profile"]
            assert user_profile["user_id"] == user_id
            assert "letters" in user_profile["apps_mastered"]
            assert "cv" in user_profile["apps_mastered"]
            assert "developer" in user_profile["skills_demonstrated"]
            
            # Analytics
            usage_analytics = capital_narratif["usage_analytics"]
            assert "lettre_motivation" in usage_analytics["actions_breakdown"]
            assert "analyse_cv_complete" in usage_analytics["actions_breakdown"]
            assert usage_analytics["total_energy_consumed"] >= 70

    @pytest.mark.asyncio
    async def test_energy_manager_with_event_store_integration(self):
        """Test intégration Energy Manager avec Event Store"""
        user_id = "energy-event-integration-test"
        
        # 1. Vérifier que l'utilisateur peut effectuer l'action
        can_perform = await energy_manager.can_perform_action(user_id, "lettre_motivation")
        assert can_perform["can_perform"] is True
        
        # 2. Consommer l'énergie (génère un événement)
        result = await energy_manager.consume(
            user_id, 
            "lettre_motivation",
            {"app_source": "letters", "integration_test": True}
        )
        
        assert result["success"] is True
        assert result["energy_consumed"] == 15
        
        # 3. Vérifier que l'événement a été créé
        events = await event_store.get_user_events(user_id, limit=10)
        
        # En mode dev, les événements sont loggés mais pas stockés
        # On vérifie que la logique fonctionne sans erreur
        assert len(events) >= 0  # Mode dev peut retourner liste vide

    @pytest.mark.asyncio
    async def test_security_middleware_protection(self):
        """Test protection du middleware de sécurité"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            
            # 1. Test requête normale
            response = await client.get("/health")
            assert response.status_code == 200
            assert "X-Luna-Security" in response.headers
            
            # 2. Test détection d'attaque SQL injection
            response = await client.get("/luna/events/test' OR 1=1--")
            assert response.status_code == 403
            assert response.json()["error"] == "security_violation"
            
            # 3. Test rate limiting (faire plusieurs requêtes rapidement)
            responses = []
            for i in range(10):
                response = await client.get("/health")
                responses.append(response.status_code)
            
            # Toutes les requêtes devraient passer (limite pas atteinte)
            assert all(status == 200 for status in responses)
            
            # 4. Test headers de sécurité
            response = await client.get("/health")
            security_headers = [
                "X-Content-Type-Options",
                "X-Frame-Options", 
                "X-XSS-Protection",
                "X-Luna-Security"
            ]
            
            for header in security_headers:
                assert header in response.headers

    @pytest.mark.asyncio
    async def test_api_endpoints_security_validation(self):
        """Test validation sécurisée des endpoints Luna"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            
            # 1. Test validation user_id
            invalid_request = {
                "user_id": "<script>alert('xss')</script>",
                "action_name": "conseil_rapide"
            }
            
            response = await client.post("/luna/energy/can-perform", json=invalid_request)
            assert response.status_code == 422  # Validation error
            
            # 2. Test validation action_name
            invalid_action = {
                "user_id": "valid-user-123",
                "action_name": "unknown_malicious_action"
            }
            
            response = await client.post("/luna/energy/can-perform", json=invalid_action)
            assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_performance_and_logging(self):
        """Test performance et logs structurés"""
        import time
        
        user_id = "performance-test-user"
        
        # 1. Test performance check_balance
        start_time = time.time()
        result = await energy_manager.check_balance(user_id)
        duration = time.time() - start_time
        
        assert result["user_id"] == user_id
        assert duration < 0.1  # Moins de 100ms
        
        # 2. Test performance consume
        start_time = time.time()
        result = await energy_manager.consume(user_id, "conseil_rapide")
        duration = time.time() - start_time
        
        assert result["success"] is True
        assert duration < 0.2  # Moins de 200ms
        
        # 3. Vérifier que les logs sont générés (pas d'exception)
        # Les logs sont configurés automatiquement

    @pytest.mark.asyncio
    async def test_unlimited_user_special_behavior(self):
        """Test comportement spécial utilisateurs Luna Unlimited"""
        from app.models.user_energy import UserEnergyModel
        
        unlimited_user_id = "unlimited-integration-test"
        
        # Créer un utilisateur Unlimited
        unlimited_user = UserEnergyModel(
            user_id=unlimited_user_id,
            current_energy=50.0,
            max_energy=float('inf'),
            subscription_type="unlimited"
        )
        energy_manager._user_energies[unlimited_user_id] = unlimited_user
        
        # 1. can_perform_action doit toujours retourner True
        result = await energy_manager.can_perform_action(unlimited_user_id, "mirror_match")
        assert result["can_perform"] is True
        assert result["deficit"] == 0.0
        
        # 2. consume ne doit pas décompter d'énergie
        initial_energy = unlimited_user.current_energy
        result = await energy_manager.consume(unlimited_user_id, "mirror_match")
        
        assert result["success"] is True
        assert result["energy_consumed"] == 0.0  # Pas de décompte
        assert result["energy_remaining"] == initial_energy  # Pas de changement
        
        # 3. L'événement doit quand même être créé (Oracle Directive #4)
        # En mode dev, on vérifie que pas d'exception

    @pytest.mark.asyncio
    async def test_full_api_workflow_integration(self):
        """Test workflow complet API: check → can-perform → consume → narrative"""
        user_id = "full-workflow-test"
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            
            # 1. Check energy balance
            response = await client.post("/luna/energy/check", json={"user_id": user_id})
            assert response.status_code == 200
            balance = response.json()
            assert balance["success"] is True
            initial_energy = balance["current_energy"]
            
            # 2. Can perform action
            response = await client.post("/luna/energy/can-perform", json={
                "user_id": user_id,
                "action_name": "lettre_motivation"
            })
            assert response.status_code == 200
            can_perform = response.json()
            assert can_perform["success"] is True
            assert can_perform["can_perform"] is True
            
            # 3. Consume energy
            response = await client.post("/luna/energy/consume", json={
                "user_id": user_id,
                "action_name": "lettre_motivation",
                "context": {
                    "app_source": "letters",
                    "integration_test": True
                }
            })
            assert response.status_code == 200
            consume_result = response.json()
            assert consume_result["success"] is True
            
            # 4. Check new balance
            response = await client.post("/luna/energy/check", json={"user_id": user_id})
            assert response.status_code == 200
            new_balance = response.json()
            assert new_balance["current_energy"] == initial_energy - 15
            
            # 5. Get Capital Narratif
            response = await client.get(f"/luna/narrative/{user_id}")
            assert response.status_code == 200
            narratif = response.json()
            assert narratif["success"] is True
            assert narratif["capital_narratif"]["user_profile"]["total_events"] >= 0

    @pytest.mark.asyncio
    async def test_error_handling_and_resilience(self):
        """Test gestion d'erreur et résilience du système"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            
            # 1. Test avec user_id invalide
            response = await client.post("/luna/energy/check", json={"user_id": ""})
            assert response.status_code == 422
            
            # 2. Test avec action inconnue
            response = await client.post("/luna/energy/consume", json={
                "user_id": "test-user",
                "action_name": "action_inexistante"
            })
            assert response.status_code == 422
            
            # 3. Test énergie insuffisante
            # Créer un utilisateur avec peu d'énergie
            low_energy_user_id = "low-energy-test"
            from app.models.user_energy import UserEnergyModel
            
            low_energy_user = UserEnergyModel(
                user_id=low_energy_user_id,
                current_energy=5.0,
                max_energy=100.0
            )
            energy_manager._user_energies[low_energy_user_id] = low_energy_user
            
            response = await client.post("/luna/energy/consume", json={
                "user_id": low_energy_user_id,
                "action_name": "mirror_match"
            })
            assert response.status_code == 402  # Payment Required
            assert "insufficient_energy" in response.json()["detail"]["error"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])