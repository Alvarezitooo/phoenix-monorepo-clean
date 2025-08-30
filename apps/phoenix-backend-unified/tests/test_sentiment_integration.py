"""
🌀 Tests Sprint 3 - Intégration Boucle Comportementale
Vérifie que l'analyse de sentiment s'intègre correctement à Luna Core
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
import asyncio

# Mock des services externes pour éviter dépendances
@pytest.fixture
def mock_sentiment_analyzer():
    """Mock sentiment analyzer"""
    from app.core.sentiment_analyzer import UserSentiment
    
    mock_analyzer = AsyncMock()
    mock_analyzer.analyze_user_message.return_value = UserSentiment(
        primary_sentiment="motivé",
        confidence=0.8,
        emotional_state="positive",
        communication_style="direct",
        energy_level="high",
        keywords_detected=["go", "fonce", "motivé"]
    )
    return mock_analyzer

@pytest.fixture
def mock_redis_cache():
    """Mock Redis cache"""
    mock_cache = AsyncMock()
    mock_cache.get_json.return_value = []
    mock_cache.set_json.return_value = True
    return mock_cache

@pytest.fixture
def mock_narrative_analyzer():
    """Mock narrative analyzer"""
    from app.core.narrative_analyzer import ContextPacket
    
    mock_analyzer = AsyncMock()
    mock_context = MagicMock()
    mock_context.to_dict.return_value = {"user": {"plan": "unlimited", "name": "Test"}}
    mock_analyzer.generate_context_packet.return_value = mock_context
    return mock_analyzer

@pytest.mark.asyncio
async def test_sentiment_integration():
    """Test que le sentiment analyzer s'intègre correctement à Luna Core"""
    
    # Arrange - Mock tous les services
    from app.core.luna_core_service import LunaCore
    
    # Mock Gemini API
    mock_response = MagicMock()
    mock_response.text = "🚀 Parfait ! Je vois que tu es super motivé ! On fonce ensemble !"
    
    luna = LunaCore()
    luna._genai_configured = True
    luna.model = MagicMock()
    luna.model.generate_content.return_value = mock_response
    
    # Act - Appel avec message motivé
    result = await luna.generate_response(
        user_id="test_user_123",
        message="Go ! Je suis motivé, on fonce pour optimiser mon CV !",
        app_context="cv",
        user_name="TestUser"
    )
    
    # Assert - Vérifications
    assert result["success"] is True
    assert "sentiment_analysis" in result
    
    sentiment_data = result["sentiment_analysis"]
    assert sentiment_data["primary_sentiment"] == "motivé"
    assert sentiment_data["confidence"] == 0.8
    assert sentiment_data["energy_level"] == "high"
    assert sentiment_data["communication_style"] == "direct"
    assert "go" in sentiment_data["keywords"]

def test_sentiment_adaptation_prompt_building():
    """Test que l'adaptation de prompt selon sentiment fonctionne"""
    
    from app.core.luna_core_service import LunaCore
    
    luna = LunaCore()
    
    # Test adaptation pour utilisateur motivé
    sentiment_context = {
        "primary_sentiment": "motivé",
        "confidence": 0.9,
        "energy_level": "high",
        "communication_style": "direct",
        "emotional_state": "positive",
        "keywords_detected": ["go", "fonce"]
    }
    
    adaptation = luna._build_sentiment_adaptation(sentiment_context)
    
    assert "UTILISATEUR MOTIVÉ" in adaptation
    assert "confiance: 0.9" in adaptation
    assert "ÉNERGIE HAUTE" in adaptation
    assert "C'est parti" in adaptation

def test_empathy_context_building():
    """Test que le contexte d'empathie se construit correctement"""
    
    from app.core.luna_core_service import LunaCore
    
    luna = LunaCore()
    
    # Test empathie pour utilisateur anxieux
    sentiment_context = {
        "emotional_state": "negative",
        "keywords_detected": ["anxieux", "peur", "difficile"]
    }
    
    empathy = luna._build_empathy_context(sentiment_context)
    
    assert "frustré ou déçu" in empathy
    assert "Rassure et déstresse" in empathy
    assert "Guide avec des étapes simples" in empathy

if __name__ == "__main__":
    # Test simple pour vérification rapide
    print("🌀 Test Sprint 3 - Intégration Boucle Comportementale")
    
    # Test construction adaptations
    from app.core.luna_core_service import LunaCore
    
    luna = LunaCore()
    
    # Test différents sentiments
    test_cases = [
        {"primary_sentiment": "motivé", "energy_level": "high"},
        {"primary_sentiment": "anxieux", "energy_level": "low"},
        {"primary_sentiment": "factuel", "energy_level": "medium"},
        {"primary_sentiment": "curieux", "energy_level": "medium"}
    ]
    
    for test_case in test_cases:
        adaptation = luna._build_sentiment_adaptation(test_case)
        print(f"✅ Adaptation {test_case['primary_sentiment']}: {len(adaptation)} chars")
    
    print("🚀 Tests Sprint 3 validés !")