"""
🧪 Tests d'Intégration Phoenix CV ↔ Luna Hub
Validation complète du workflow Oracle: check → execute → consume
"""

import pytest
import uuid
import httpx
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

# Import de l'app principale
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend_api_main import app
from application.clients.luna_client import LunaClient, CheckRequest, ConsumeRequest
from application.models.actions import ActionType

client = TestClient(app)

class TestCVLunaIntegration:
    """
    🧪 Suite de tests d'intégration CV-Luna
    """
    
    def setup_method(self):
        """Setup pour chaque test"""
        self.user_id = str(uuid.uuid4())
        self.cv_id = str(uuid.uuid4())
        self.correlation_id = str(uuid.uuid4())
        self.test_token = "test.jwt.token"
    
    def test_cv_analyze_success_workflow(self):
        """
        ✅ Test workflow complet analyse CV avec succès
        """
        # Mock des réponses Luna Hub
        with patch('application.clients.luna_client.httpx.Client') as mock_client:
            # Configuration du mock client
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            # Mock check_energy (success)
            mock_check_response = Mock()
            mock_check_response.status_code = 200
            mock_check_response.json.return_value = {
                "success": True,
                "can_perform": True,
                "energy_required": 25,
                "current_energy": 75
            }
            
            # Mock consume_energy (success)
            mock_consume_response = Mock()
            mock_consume_response.status_code = 200
            mock_consume_response.json.return_value = {
                "success": True,
                "energy_consumed": 25,
                "energy_remaining": 50,
                "event_id": "evt_12345"
            }
            
            # Configuration des réponses selon l'URL
            def mock_post(url, headers=None, json=None):
                if "can-perform" in url:
                    return mock_check_response
                elif "consume" in url:
                    return mock_consume_response
                else:
                    raise AssertionError(f"Unexpected POST to {url}")
            
            mock_instance.post = mock_post
            
            # Requête de test
            response = client.post(
                "/cv/analyze",
                headers={
                    "Authorization": f"Bearer {self.test_token}",
                    "X-Request-ID": self.correlation_id
                },
                json={
                    "user_id": self.user_id,
                    "cv_id": self.cv_id,
                    "action_type": "analyse_cv_complete",
                    "content": {
                        "cv_content": "Test CV content"
                    }
                }
            )
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] is True
            assert data["energy_consumed"] == 25
            assert data["energy_remaining"] == 50
            assert data["event_id"] == "evt_12345"
            assert "result" in data
            assert data["result"]["cv_id"] == self.cv_id
            assert data["result"]["score"] == 82  # Score analyse CV
            
            # Vérification headers de corrélation
            assert response.headers.get("X-Request-ID") == self.correlation_id
            assert response.headers.get("X-Correlation-ID") == self.correlation_id
    
    def test_cv_analyze_insufficient_energy(self):
        """
        ❌ Test énergie insuffisante
        """
        with patch('application.clients.luna_client.httpx.Client') as mock_client:
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            # Mock check_energy (insufficient energy)
            mock_check_response = Mock()
            mock_check_response.status_code = 200
            mock_check_response.json.return_value = {
                "success": False,
                "can_perform": False,
                "deficit": 10,
                "current_energy": 15
            }
            
            mock_instance.post.return_value = mock_check_response
            
            response = client.post(
                "/cv/analyze",
                headers={"Authorization": f"Bearer {self.test_token}"},
                json={
                    "user_id": self.user_id,
                    "action_type": "analyse_cv_complete"
                }
            )
            
            assert response.status_code == 402
            data = response.json()
            assert data["detail"]["error"] == "insufficient_energy"
            assert data["detail"]["required_pack"] == "cafe_luna"
    
    def test_mirror_match_success_workflow(self):
        """
        ✅ Test workflow Mirror Match complet
        """
        with patch('application.clients.luna_client.httpx.Client') as mock_client:
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            # Mock responses
            mock_check_response = Mock()
            mock_check_response.status_code = 200
            mock_check_response.json.return_value = {
                "success": True,
                "can_perform": True,
                "energy_required": 30,
                "current_energy": 80
            }
            
            mock_consume_response = Mock()
            mock_consume_response.status_code = 200
            mock_consume_response.json.return_value = {
                "success": True,
                "energy_consumed": 30,
                "energy_remaining": 50,
                "event_id": "evt_mirror_123"
            }
            
            def mock_post(url, headers=None, json=None):
                if "can-perform" in url:
                    return mock_check_response
                elif "consume" in url:
                    return mock_consume_response
                else:
                    raise AssertionError(f"Unexpected POST to {url}")
            
            mock_instance.post = mock_post
            
            # Mock du use case Mirror Match
            with patch('application.routes.cv_analyze.get_mirror_match_use_case') as mock_use_case:
                mock_result = Mock()
                mock_result.success = True
                mock_result.ai_calls_made = 3
                mock_result.processing_time_ms = 2500
                mock_result.executive_summary = {
                    "overall_compatibility": 85,
                    "recommendation": "🟢 Candidature fortement recommandée"
                }
                
                # Mock de l'analyse
                mock_analysis = Mock()
                mock_analysis.overall_compatibility = 85
                mock_analysis.match_type.value = "excellent_match"
                mock_analysis.skill_matches = []
                mock_analysis.priority_improvements = ["Ajouter Python"]
                mock_analysis.application_success_probability = 78
                mock_result.analysis = mock_analysis
                
                mock_use_case_instance = Mock()
                mock_use_case_instance.execute.return_value = mock_result
                mock_use_case.return_value = mock_use_case_instance
                
                response = client.post(
                    "/cv/mirror-match",
                    headers={"Authorization": f"Bearer {self.test_token}"},
                    json={
                        "user_id": self.user_id,
                        "cv_id": self.cv_id,
                        "job_description": "Recherche développeur Python avec 3+ ans expérience. Compétences requises: Python, Django, PostgreSQL, Docker. Expérience API REST et tests unitaires appréciée.",
                        "job_title": "Développeur Python Senior",
                        "company_name": "Tech Corp"
                    }
                )
                
                assert response.status_code == 200
                data = response.json()
                
                assert data["success"] is True
                assert data["energy_consumed"] == 30
                assert data["event_id"] == "evt_mirror_123"
                assert "mirror_match_analysis" in data["result"]
                assert data["result"]["mirror_match_analysis"]["overall_compatibility"] == 85
    
    def test_luna_client_error_handling(self):
        """
        🚨 Test gestion d'erreurs client Luna
        """
        with patch('application.clients.luna_client.httpx.Client') as mock_client:
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            # Mock erreur serveur Luna Hub
            mock_error_response = Mock()
            mock_error_response.status_code = 503
            mock_error_response.text = "Service Unavailable"
            mock_instance.post.return_value = mock_error_response
            
            response = client.post(
                "/cv/analyze",
                headers={"Authorization": f"Bearer {self.test_token}"},
                json={
                    "user_id": self.user_id,
                    "action_type": "analyse_cv_complete"
                }
            )
            
            assert response.status_code == 502
            assert "Luna Hub 5xx" in str(response.json()["detail"])
    
    def test_validation_errors(self):
        """
        ❌ Test erreurs de validation
        """
        # Test user_id manquant
        response = client.post(
            "/cv/analyze",
            headers={"Authorization": f"Bearer {self.test_token}"},
            json={
                "action_type": "analyse_cv_complete"
            }
        )
        assert response.status_code == 422
        
        # Test action_type invalide
        response = client.post(
            "/cv/analyze", 
            headers={"Authorization": f"Bearer {self.test_token}"},
            json={
                "user_id": self.user_id,
                "action_type": "action_inexistante"
            }
        )
        assert response.status_code == 422
        
        # Test job_description trop courte pour Mirror Match
        response = client.post(
            "/cv/mirror-match",
            headers={"Authorization": f"Bearer {self.test_token}"},
            json={
                "user_id": self.user_id,
                "job_description": "Trop court"  # < 50 caractères
            }
        )
        assert response.status_code == 422
    
    def test_health_check_endpoints(self):
        """
        🏥 Test endpoints de santé
        """
        # Test health check CV
        response = client.get("/cv/health")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "phoenix-cv"
        assert "luna_hub_connected" in data
        assert "dependencies" in data
        
        # Test readiness check global
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["ready", "degraded"]
        assert "dependencies" in data
        assert "luna_hub" in data["dependencies"]
    
    def test_observability_middleware(self):
        """
        📊 Test middleware observabilité et corrélation
        """
        correlation_id = str(uuid.uuid4())
        
        with patch('application.clients.luna_client.httpx.Client') as mock_client:
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            # Mock success responses
            mock_check_response = Mock()
            mock_check_response.status_code = 200
            mock_check_response.json.return_value = {
                "success": True,
                "can_perform": True
            }
            
            mock_consume_response = Mock()
            mock_consume_response.status_code = 200
            mock_consume_response.json.return_value = {
                "success": True,
                "energy_consumed": 25,
                "energy_remaining": 50,
                "event_id": "evt_123"
            }
            
            def mock_post(url, headers=None, json=None):
                # Vérification que le correlation_id est bien propagé
                assert "X-Request-ID" in headers
                assert "X-Correlation-ID" in headers
                
                if "can-perform" in url:
                    return mock_check_response
                elif "consume" in url:
                    return mock_consume_response
                else:
                    raise AssertionError(f"Unexpected POST to {url}")
            
            mock_instance.post = mock_post
            
            response = client.post(
                "/cv/analyze",
                headers={
                    "Authorization": f"Bearer {self.test_token}",
                    "X-Request-ID": correlation_id
                },
                json={
                    "user_id": self.user_id,
                    "action_type": "analyse_cv_complete"
                }
            )
            
            # Vérification que les headers de corrélation sont retournés
            assert response.headers.get("X-Request-ID") == correlation_id
            assert response.headers.get("X-Correlation-ID") == correlation_id
            assert response.headers.get("X-Service") == "phoenix-cv"
    
    def test_action_type_enum_validation(self):
        """
        🎯 Test validation enum ActionType
        """
        with patch('application.clients.luna_client.httpx.Client') as mock_client:
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            # Mock success pour tous les types d'actions valides
            mock_success_response = Mock()
            mock_success_response.status_code = 200
            mock_success_response.json.return_value = {
                "success": True,
                "can_perform": True,
                "energy_consumed": 25,
                "energy_remaining": 50,
                "event_id": "evt_123"
            }
            mock_instance.post.return_value = mock_success_response
            
            # Test des actions valides
            valid_actions = [
                "analyse_cv_complete",
                "optimisation_cv",
                "mirror_match",
                "salary_analysis"
            ]
            
            for action in valid_actions:
                response = client.post(
                    "/cv/analyze",
                    headers={"Authorization": f"Bearer {self.test_token}"},
                    json={
                        "user_id": self.user_id,
                        "action_type": action
                    }
                )
                # Devrait réussir la validation mais peut échouer sur d'autres aspects
                assert response.status_code in [200, 502]  # 502 si Luna Hub mock échoue


class TestLunaClientUnit:
    """
    🔧 Tests unitaires du LunaClient
    """
    
    def setup_method(self):
        self.token = "test.jwt.token"
        self.request_id = str(uuid.uuid4())
        self.client = LunaClient(
            token_provider=lambda: self.token,
            request_id_provider=lambda: self.request_id
        )
    
    def test_headers_generation(self):
        """Test génération des headers"""
        headers = self.client._headers()
        
        assert headers["Authorization"] == f"Bearer {self.token}"
        assert headers["Content-Type"] == "application/json"
        assert headers["X-Request-ID"] == self.request_id
        assert headers["X-Correlation-ID"] == self.request_id
    
    def test_headers_with_idempotency(self):
        """Test headers avec clé d'idempotence"""
        idem_key = "test-idem-123"
        headers = self.client._headers(idem_key=idem_key)
        
        assert headers["X-Idempotency-Key"] == idem_key
    
    @patch('application.clients.luna_client.httpx.Client')
    def test_retry_mechanism(self, mock_client_class):
        """Test mécanisme de retry"""
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Simuler 2 échecs puis succès
        mock_client.post.side_effect = [
            httpx.ConnectError("Connection failed"),
            httpx.ReadTimeout("Timeout"),
            Mock(status_code=200, json=lambda: {"success": True})
        ]
        
        # Le client devrait retry et finalement réussir
        result = self.client._retry(mock_client.post, "http://test", headers={})
        
        assert result.status_code == 200
        assert mock_client.post.call_count == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])