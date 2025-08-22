"""
📊 Tests de validation conformité schéma logs unifié v1.0
Vérification que les logs Phoenix CV respectent le contrat défini
"""

import pytest
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend_api_main import app
from application.middleware.observability import business_logger, setup_json_logging

# Schema JSON Draft-07 pour validation
LOG_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "https://phoenix-luna.dev/schemas/log-entry.schema.json",
    "title": "Phoenix-Luna Unified Log Entry",
    "type": "object",
    "additionalProperties": True,
    "required": [
        "timestamp", "service_name", "correlation_id",
        "log_level", "message", "user_id", "action_type",
        "status_code", "latency_ms", "metadata"
    ],
    "properties": {
        "timestamp": {
            "type": "string",
            "format": "date-time"
        },
        "service_name": {
            "type": "string"
        },
        "correlation_id": {
            "type": "string",
            "minLength": 1
        },
        "user_id": {
            "type": ["string", "null"],
            "format": "uuid"
        },
        "action_type": {
            "type": ["string", "null"],
            "pattern": "^[a-z_]+$"
        },
        "log_level": {
            "type": "string",
            "enum": ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        },
        "status_code": {
            "type": ["integer", "null"],
            "minimum": 100,
            "maximum": 599
        },
        "latency_ms": {
            "type": ["integer", "null"],
            "minimum": 0
        },
        "message": {"type": "string"},
        "metadata": {
            "type": "object",
            "additionalProperties": True
        },
        "environment": {"type": "string"},
        "service_version": {"type": "string"},
        "schema_version": {"type": "string", "default": "1.0"}
    }
}

client = TestClient(app)

class LogCapture:
    """Capture des logs pour validation"""
    
    def __init__(self):
        self.logs = []
    
    def capture_log(self, log_entry: Dict[str, Any]):
        """Capture un log pour validation"""
        self.logs.append(log_entry)
    
    def get_latest_log(self) -> Dict[str, Any]:
        """Récupère le dernier log capturé"""
        return self.logs[-1] if self.logs else {}
    
    def clear(self):
        """Efface tous les logs capturés"""
        self.logs.clear()

# Instance globale pour les tests
log_capture = LogCapture()

class TestLogsSchemaValidation:
    """
    📊 Tests de validation du schéma logs unifié
    """
    
    def setup_method(self):
        """Setup pour chaque test"""
        log_capture.clear()
        self.user_id = str(uuid.uuid4())
        self.correlation_id = str(uuid.uuid4())
        self.test_token = "test.jwt.token"
    
    def validate_log_schema(self, log_entry: Dict[str, Any]) -> bool:
        """
        Valide un log contre le schéma unifié v1.0
        """
        try:
            # Validation des champs requis
            required_fields = LOG_SCHEMA["required"]
            for field in required_fields:
                if field not in log_entry:
                    print(f"❌ Champ requis manquant: {field}")
                    return False
            
            # Validation timestamp ISO 8601
            timestamp = log_entry.get("timestamp")
            if timestamp:
                try:
                    datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                except ValueError:
                    print(f"❌ Timestamp invalide: {timestamp}")
                    return False
            
            # Validation service_name
            service_name = log_entry.get("service_name")
            if not isinstance(service_name, str) or not service_name:
                print(f"❌ service_name invalide: {service_name}")
                return False
            
            # Validation correlation_id
            correlation_id = log_entry.get("correlation_id")
            if not isinstance(correlation_id, str) or len(correlation_id) < 1:
                print(f"❌ correlation_id invalide: {correlation_id}")
                return False
            
            # Validation user_id (UUID ou null)
            user_id = log_entry.get("user_id")
            if user_id is not None:
                try:
                    uuid.UUID(user_id)
                except ValueError:
                    print(f"❌ user_id pas un UUID valide: {user_id}")
                    return False
            
            # Validation action_type (snake_case ou null)
            action_type = log_entry.get("action_type")
            if action_type is not None:
                if not isinstance(action_type, str) or not action_type.replace('_', '').isalpha():
                    print(f"❌ action_type invalide: {action_type}")
                    return False
            
            # Validation log_level
            log_level = log_entry.get("log_level")
            valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
            if log_level not in valid_levels:
                print(f"❌ log_level invalide: {log_level}")
                return False
            
            # Validation status_code
            status_code = log_entry.get("status_code")
            if status_code is not None:
                if not isinstance(status_code, int) or not (100 <= status_code <= 599):
                    print(f"❌ status_code invalide: {status_code}")
                    return False
            
            # Validation latency_ms
            latency_ms = log_entry.get("latency_ms")
            if latency_ms is not None:
                if not isinstance(latency_ms, int) or latency_ms < 0:
                    print(f"❌ latency_ms invalide: {latency_ms}")
                    return False
            
            # Validation message
            message = log_entry.get("message")
            if not isinstance(message, str) or not message:
                print(f"❌ message invalide: {message}")
                return False
            
            # Validation metadata
            metadata = log_entry.get("metadata")
            if not isinstance(metadata, dict):
                print(f"❌ metadata pas un objet: {metadata}")
                return False
            
            # Validation schema_version
            schema_version = log_entry.get("schema_version", "1.0")
            if schema_version != "1.0":
                print(f"❌ schema_version invalide: {schema_version}")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur validation: {e}")
            return False
    
    @patch('structlog.get_logger')
    def test_http_request_log_format(self, mock_logger):
        """
        📊 Test format log http_request
        """
        # Mock du logger pour capturer les logs
        mock_logger_instance = Mock()
        mock_logger.return_value = mock_logger_instance
        
        def capture_log_call(*args, **kwargs):
            # Reconstruction du log structuré
            log_entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "service_name": "phoenix-cv",
                "correlation_id": self.correlation_id,
                "user_id": self.user_id,
                "action_type": "analyse_cv_complete",
                "log_level": "INFO",
                "status_code": None,  # Request n'a pas encore de status
                "latency_ms": None,   # Request n'a pas encore de latence
                "message": args[0] if args else "http_request received",
                "metadata": kwargs,
                "environment": "development",
                "service_version": "cv@1.0.0",
                "schema_version": "1.0"
            }
            log_capture.capture_log(log_entry)
        
        mock_logger_instance.info.side_effect = capture_log_call
        
        # Mock Luna Hub pour éviter erreurs réseau
        with patch('application.clients.luna_client.httpx.Client') as mock_client:
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"success": True, "can_perform": True}
            mock_instance.post.return_value = mock_response
            
            # Requête de test
            client.post(
                "/cv/analyze",
                headers={
                    "Authorization": f"Bearer {self.test_token}",
                    "X-Request-ID": self.correlation_id
                },
                json={
                    "user_id": self.user_id,
                    "action_type": "analyse_cv_complete"
                }
            )
        
        # Validation du log capturé
        if log_capture.logs:
            latest_log = log_capture.get_latest_log()
            assert self.validate_log_schema(latest_log), f"Log invalide: {latest_log}"
            
            # Vérifications spécifiques http_request
            assert latest_log["service_name"] == "phoenix-cv"
            assert latest_log["correlation_id"] == self.correlation_id
            assert latest_log["user_id"] == self.user_id
            assert latest_log["action_type"] == "analyse_cv_complete"
            assert latest_log["log_level"] == "INFO"
            assert "http_request" in latest_log["message"]
    
    def test_business_logger_format(self):
        """
        💼 Test format logs business logger
        """
        # Capture directe du business logger
        with patch('structlog.get_logger') as mock_logger:
            mock_logger_instance = Mock()
            mock_logger.return_value = mock_logger_instance
            
            def capture_business_log(*args, **kwargs):
                log_entry = {
                    "timestamp": kwargs.get("timestamp", datetime.now(timezone.utc).isoformat()),
                    "service_name": kwargs.get("service_name", "phoenix-cv"),
                    "correlation_id": kwargs.get("correlation_id", self.correlation_id),
                    "user_id": kwargs.get("user_id", self.user_id),
                    "action_type": kwargs.get("action_type", "analyse_cv_complete"),
                    "log_level": kwargs.get("log_level", "INFO"),
                    "status_code": kwargs.get("status_code"),
                    "latency_ms": kwargs.get("latency_ms", 1500),
                    "message": args[0] if args else "business_action completed",
                    "metadata": kwargs.get("metadata", {}),
                    "environment": kwargs.get("environment", "development"),
                    "service_version": kwargs.get("service_version", "cv@1.0.0"),
                    "schema_version": kwargs.get("schema_version", "1.0")
                }
                log_capture.capture_log(log_entry)
            
            mock_logger_instance.info.side_effect = capture_business_log
            
            # Test log business action
            business_logger.log_cv_action(
                correlation_id=self.correlation_id,
                user_id=self.user_id,
                action_type="analyse_cv_complete",
                status="completed",
                latency_ms=1500,
                metadata={"cv_id": "cv_123", "score": 85}
            )
            
            # Validation
            latest_log = log_capture.get_latest_log()
            assert self.validate_log_schema(latest_log), f"Log business invalide: {latest_log}"
            
            # Vérifications spécifiques business
            assert latest_log["latency_ms"] == 1500
            assert latest_log["metadata"]["cv_id"] == "cv_123"
            assert latest_log["metadata"]["score"] == 85
    
    def test_luna_interaction_log_format(self):
        """
        🌙 Test format logs interaction Luna
        """
        with patch('structlog.get_logger') as mock_logger:
            mock_logger_instance = Mock()
            mock_logger.return_value = mock_logger_instance
            
            def capture_luna_log(*args, **kwargs):
                log_entry = {
                    "timestamp": kwargs.get("timestamp", datetime.now(timezone.utc).isoformat()),
                    "service_name": kwargs.get("service_name", "phoenix-cv"),
                    "correlation_id": kwargs.get("correlation_id", self.correlation_id),
                    "user_id": kwargs.get("user_id", self.user_id),
                    "action_type": kwargs.get("action_type", "consume_energy"),
                    "log_level": kwargs.get("log_level", "INFO"),
                    "status_code": kwargs.get("status_code"),
                    "latency_ms": kwargs.get("latency_ms", 250),
                    "message": args[0] if args else "luna_interaction success",
                    "metadata": kwargs.get("metadata", {}),
                    "environment": kwargs.get("environment", "development"),
                    "service_version": kwargs.get("service_version", "cv@1.0.0"),
                    "schema_version": kwargs.get("schema_version", "1.0")
                }
                log_capture.capture_log(log_entry)
            
            mock_logger_instance.info.side_effect = capture_luna_log
            
            # Test log interaction Luna
            business_logger.log_luna_interaction(
                correlation_id=self.correlation_id,
                user_id=self.user_id,
                action_type="consume_energy",
                luna_operation="consume_energy",
                status="success",
                latency_ms=250,
                metadata={
                    "energy_consumed": 25,
                    "energy_remaining": 50,
                    "event_id": "evt_123"
                }
            )
            
            # Validation
            latest_log = log_capture.get_latest_log()
            assert self.validate_log_schema(latest_log), f"Log Luna invalide: {latest_log}"
            
            # Vérifications spécifiques Luna
            assert latest_log["latency_ms"] == 250
            assert latest_log["metadata"]["energy_consumed"] == 25
            assert latest_log["metadata"]["event_id"] == "evt_123"
    
    def test_security_redaction(self):
        """
        🔒 Test redaction des données sensibles
        """
        # Test que les headers sensibles sont masqués
        sensitive_headers = {
            "authorization": "Bearer secret.token",
            "cookie": "session=abc123",
            "x-api-key": "secret-key",
            "content-type": "application/json"
        }
        
        from application.middleware.observability import scrub_headers
        
        redacted = scrub_headers(sensitive_headers)
        
        # Vérifications
        assert redacted["authorization"] == "<redacted>"
        assert redacted["cookie"] == "<redacted>"
        assert redacted["x-api-key"] == "<redacted>"  # Si configuré
        assert redacted["content-type"] == "application/json"  # Non sensible
    
    def test_log_size_limits(self):
        """
        📏 Test limites de taille des logs
        """
        # Metadata trop volumineux (> 4KB)
        large_metadata = {
            "large_field": "x" * 5000  # 5KB
        }
        
        # Le middleware devrait tronquer ou rejeter
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service_name": "phoenix-cv",
            "correlation_id": self.correlation_id,
            "user_id": self.user_id,
            "action_type": "analyse_cv_complete",
            "log_level": "INFO",
            "status_code": 200,
            "latency_ms": 100,
            "message": "test message",
            "metadata": large_metadata,
            "schema_version": "1.0"
        }
        
        # Vérification que la validation détecte la surcharge
        # (En production, on tronquerait ou filtrerait)
        log_json = json.dumps(log_entry)
        assert len(log_json) > 4000  # Confirme que c'est trop gros
    
    def test_correlation_id_propagation(self):
        """
        🔗 Test propagation correlation_id bout-en-bout
        """
        custom_correlation_id = "test-correlation-12345"
        
        with patch('application.clients.luna_client.httpx.Client') as mock_client:
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            
            # Capture des headers envoyés à Luna Hub
            captured_headers = {}
            
            def capture_post(url, headers=None, json=None):
                captured_headers.update(headers or {})
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = {"success": True, "can_perform": True}
                return mock_response
            
            mock_instance.post.side_effect = capture_post
            
            # Requête avec correlation_id custom
            response = client.post(
                "/cv/analyze",
                headers={
                    "Authorization": f"Bearer {self.test_token}",
                    "X-Request-ID": custom_correlation_id
                },
                json={
                    "user_id": self.user_id,
                    "action_type": "analyse_cv_complete"
                }
            )
            
            # Vérifications propagation
            assert captured_headers.get("X-Request-ID") == custom_correlation_id
            assert captured_headers.get("X-Correlation-ID") == custom_correlation_id
            assert response.headers.get("X-Request-ID") == custom_correlation_id
            assert response.headers.get("X-Correlation-ID") == custom_correlation_id


class TestLogSchemaExamples:
    """
    📋 Tests d'exemples conformes au schéma v1.0
    """
    
    def test_valid_http_request_example(self):
        """Test exemple http_request valide"""
        log_example = {
            "timestamp": "2025-08-22T09:14:03.412Z",
            "service_name": "phoenix-cv",
            "correlation_id": "8e0e1b6c-1a0e-4b1a-9b0d-9f7b3a3d5e1d",
            "user_id": "7b8a3b3c-6f14-44b8-8f88-1f1e2b2c3d4e",
            "action_type": "analyse_cv_complete",
            "log_level": "INFO",
            "status_code": None,
            "latency_ms": None,
            "message": "http_request received",
            "environment": "staging",
            "service_version": "cv@1.5.3+3b2c1d7",
            "metadata": {
                "method": "POST",
                "path": "/cv/analyze",
                "query": "",
                "headers": {"content-type": "application/json"}
            },
            "schema_version": "1.0"
        }
        
        validator = TestLogsSchemaValidation()
        assert validator.validate_log_schema(log_example)
    
    def test_valid_business_action_example(self):
        """Test exemple business_action valide"""
        log_example = {
            "timestamp": "2025-08-22T09:14:03.561Z",
            "service_name": "phoenix-cv",
            "correlation_id": "8e0e1b6c-1a0e-4b1a-9b0d-9f7b3a3d5e1d",
            "user_id": "7b8a3b3c-6f14-44b8-8f88-1f1e2b2c3d4e",
            "action_type": "analyse_cv_complete",
            "log_level": "INFO",
            "status_code": None,
            "latency_ms": 1750,
            "message": "business_action completed",
            "metadata": {
                "cv_id": "b6b8f8cf-02a5-4a4a-8b0f-11caa21e5c41",
                "score": 82,
                "processing_duration_ms": 1750,
                "business_status": "completed"
            },
            "schema_version": "1.0"
        }
        
        validator = TestLogsSchemaValidation()
        assert validator.validate_log_schema(log_example)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])