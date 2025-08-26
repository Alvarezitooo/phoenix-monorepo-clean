"""
🧪 Configuration Tests - Phoenix Sprint 4
Setup global pour tous les tests
"""

import pytest
import asyncio
import os
from typing import AsyncGenerator
from unittest.mock import patch, Mock

# FastAPI testing
from fastapi.testclient import TestClient
import httpx

# Application  
from api_main import app


@pytest.fixture(scope="session")
def event_loop():
    """Event loop pour tests async"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Client FastAPI synchrone"""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Client FastAPI asynchrone"""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture(autouse=True)
async def clean_test_data():
    """Nettoie données de test avant/après chaque test"""
    # Avant test - nettoyer
    test_user_ids = [
        "test_user_energy",
        "test_user_events", 
        "test_user_billing",
        "demo-user"
    ]
    
    # Note: Nettoyage simplifié pour tests
    # En production, utiliser energy_manager pour operations
    
    yield  # Exécuter le test
    
    # Après test - nettoyage


@pytest.fixture
def mock_stripe_env():
    """Environment variables pour Stripe test"""
    with patch.dict(os.environ, {
        "STRIPE_SECRET_KEY": "sk_test_mock_key_for_testing",
        "STRIPE_PUBLISHABLE_KEY": "pk_test_mock_key_for_testing", 
        "STRIPE_WEBHOOK_SECRET": "whsec_test_mock_webhook_secret",
        "LUNA_HUB_ENVIRONMENT": "test"
    }):
        yield


@pytest.fixture
def mock_supabase_env():
    """Environment variables pour Supabase test"""
    with patch.dict(os.environ, {
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_SERVICE_KEY": "test_service_key",
        "SUPABASE_PROJECT_ID": "test_project"
    }):
        yield


@pytest.fixture
def mock_jwt_token():
    """JWT token valide pour tests"""
    return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoidGVzdF91c2VyIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.mock_signature_for_testing"


@pytest.fixture
def mock_user_data():
    """Données utilisateur de test"""
    return {
        "id": "test_user_123",
        "email": "test@example.com",
        "name": "Test User",
        "created_at": "2024-01-01T00:00:00Z",
        "subscription_type": "free"
    }


@pytest.fixture
def sample_payment_intent():
    """PaymentIntent exemple pour tests"""
    return {
        "intent_id": "pi_test_1234567890",
        "client_secret": "pi_test_1234567890_secret_abcdef",
        "amount_cents": 299,
        "currency": "eur",
        "status": "requires_payment_method",
        "metadata": {
            "user_id": "test_user_123",
            "pack": "cafe_luna",
            "luna_env": "test"
        }
    }


@pytest.fixture
def sample_energy_events():
    """Événements énergie exemples"""
    return [
        {
            "event_type": "EnergyPurchased",
            "event_data": {
                "pack": "cafe_luna",
                "energy_units": 110,
                "amount_cents": 299,
                "bonus_applied": True,
                "is_first_purchase": True
            }
        },
        {
            "event_type": "EnergyConsumed", 
            "event_data": {
                "action": "analyse_cv",
                "energy_consumed": 8,
                "energy_remaining": 102,
                "context": {"cv_length": "standard"}
            }
        },
        {
            "event_type": "ActionPerformed",
            "event_data": {
                "action": "mirror_match",
                "result": "success",
                "score": 87.5,
                "processing_time_ms": 2340
            }
        }
    ]


# Mocks pour services externes
@pytest.fixture
def mock_stripe_service():
    """Mock pour service Stripe"""
    mock = Mock()
    mock.create_payment_intent.return_value = {
        "intent_id": "pi_mock_123",
        "client_secret": "pi_mock_123_secret_abc",
        "amount_cents": 299,
        "currency": "eur",
        "status": "requires_payment_method"
    }
    mock.get_payment_intent.return_value = {
        "intent_id": "pi_mock_123",
        "status": "succeeded",
        "amount_cents": 299,
        "user_id": "test_user",
        "pack": "cafe_luna"
    }
    mock.health_check.return_value = {
        "connected": True,
        "account_id": "acct_test_123"
    }
    return mock


@pytest.fixture
def mock_supabase_client():
    """Mock pour client Supabase"""
    mock = Mock()
    mock.table.return_value = mock
    mock.insert.return_value = mock
    mock.select.return_value = mock
    mock.eq.return_value = mock
    mock.order.return_value = mock
    mock.limit.return_value = mock
    mock.execute.return_value = Mock(data=[])
    return mock


# Helpers de test
@pytest.fixture
def create_test_user():
    """Helper pour créer utilisateur de test"""
    async def _create_user(user_id: str, energy_balance: int = 0):
        return {
            "id": user_id,
            "email": f"{user_id}@test.com",
            "energy_balance": energy_balance
        }
    return _create_user


@pytest.fixture
def create_test_events():
    """Helper pour créer événements de test"""
    async def _create_events(user_id: str, events: list):
        # Mock event creation for tests
        return ["event_1", "event_2", "event_3"][:len(events)]
    return _create_events


# Markers personnalisés
def pytest_configure(config):
    """Configuration pytest avec markers custom"""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
    config.addinivalue_line(
        "markers", "billing: mark test as billing-related"
    )
    config.addinivalue_line(
        "markers", "energy: mark test as energy-related"
    )
    config.addinivalue_line(
        "markers", "stripe: mark test as Stripe-related"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )


# Configuration logging pour tests
import logging

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("app").setLevel(logging.INFO)


# Timeout global pour tests async
@pytest.fixture(autouse=True)
def set_async_timeout():
    """Timeout par défaut pour tests async"""
    pytest.timeout = 30  # 30 secondes max par test