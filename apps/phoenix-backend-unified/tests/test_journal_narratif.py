"""
🧪 Tests Journal Narratif - Arène du Premier Héros
Tests complets pour endpoints, services et modèles Journal
"""

import pytest
from unittest.mock import patch, Mock, AsyncMock
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.models.journal_dto import (
    JournalDTO, JournalUser, JournalEnergy, JournalNarrative,
    JournalKPIs, JournalChapter, JournalNextStep, JournalSocialProof,
    EnergyPreviewRequest, EnergyPreviewResponse
)


@pytest.fixture
def mock_journal_data():
    """Fixture avec données Journal minimales"""
    return JournalDTO(
        user=JournalUser(
            id="test_user_123",
            first_name="Alice",
            plan="standard"
        ),
        energy=JournalEnergy(
            balance_pct=75.5,
            last_purchase="2024-08-20T10:30:00Z"
        ),
        narrative=JournalNarrative(
            chapters=[
                JournalChapter(
                    id="chapter_1",
                    type="cv",
                    title="CV optimisé",
                    gain=["ATS 82", "+3 améliorations"],
                    ts="2024-08-20T14:22:00Z"
                )
            ],
            kpis=JournalKPIs(),
            last_doubt="Je me demande si mon expérience suffit pour ce poste",
            next_steps=[
                JournalNextStep(
                    action="lettre_motivation",
                    cost_pct=15.0,
                    expected_gain="Lettre personnalisée pour candidature"
                )
            ]
        ),
        social_proof=JournalSocialProof(
            peers_percentage_recommended_step=0.87,
            recommended_label="Optimisation CV approfondie"
        )
    )


class TestJournalModels:
    """Tests des modèles Pydantic Journal"""
    
    def test_journal_user_validation(self):
        """✅ Validation JournalUser"""
        user = JournalUser(
            id="user_123",
            first_name="Marie",
            plan="unlimited"
        )
        
        assert user.id == "user_123"
        assert user.first_name == "Marie"
        assert user.plan == "unlimited"
        
    def test_journal_energy_constraints(self):
        """✅ Contraintes JournalEnergy (0-100%)"""
        # Valide
        energy = JournalEnergy(balance_pct=50.0)
        assert energy.balance_pct == 50.0
        
        # Invalide - en dessous de 0
        with pytest.raises(ValueError):
            JournalEnergy(balance_pct=-5.0)
            
        # Invalide - au dessus de 100
        with pytest.raises(ValueError):
            JournalEnergy(balance_pct=105.0)
    
    def test_journal_chapter_types(self):
        """✅ Types autorisés pour JournalChapter"""
        valid_types = ["cv", "letter", "analysis", "milestone", "energy", "other"]
        
        for chapter_type in valid_types:
            chapter = JournalChapter(
                id=f"test_{chapter_type}",
                type=chapter_type,
                title=f"Test {chapter_type}",
                gain=[],
                ts="2024-08-20T10:00:00Z"
            )
            assert chapter.type == chapter_type
    
    def test_energy_preview_request_validation(self):
        """✅ Validation EnergyPreviewRequest avec Security Guardian"""
        # Test données valides
        request = EnergyPreviewRequest(
            user_id="valid_user_123",
            action="lettre_motivation"
        )
        
        assert request.user_id == "valid_user_123"
        assert request.action == "lettre_motivation"
        
        # Test action invalide
        with pytest.raises(ValueError, match="Action inconnue"):
            EnergyPreviewRequest(
                user_id="valid_user_123",
                action="action_inexistante"
            )


class TestJournalService:
    """Tests du service Journal"""
    
    @patch('app.core.journal_service.narrative_analyzer')
    @patch('app.core.journal_service.energy_manager')
    @pytest.mark.asyncio
    async def test_get_journal_data_success(self, mock_energy_manager, mock_narrative_analyzer):
        """✅ Génération Journal data réussie"""
        from app.core.journal_service import journal_service
        
        # Mock Context Packet du Narrative Analyzer
        mock_context = Mock()
        mock_context.user.first_name = "Alice"
        mock_context.user.plan = "standard"
        mock_context.confidence = 0.85
        mock_context.last_emotion_or_doubt = "Je doute de mes compétences"
        mock_context.progress.ats_mean = 78.5
        mock_context.progress.ats_delta_pct_14d = 5.2
        mock_context.progress.letters_count_total = 3
        mock_context.usage.session_count_7d = 4
        
        mock_narrative_analyzer.generate_context_packet = AsyncMock(return_value=mock_context)
        
        # Mock Energy Manager
        mock_energy_manager.check_balance = AsyncMock(return_value={
            "percentage": 82.3,
            "last_recharge": datetime.now(timezone.utc)
        })
        
        # Mock Event Store pour événements
        with patch('app.core.journal_service.event_store') as mock_event_store:
            mock_event_store.get_user_events = AsyncMock(return_value=[])
            
            # Appel du service
            result = await journal_service.get_journal_data("test_user")
            
            # Vérifications
            assert isinstance(result, JournalDTO)
            assert result.user.first_name == "Alice"
            assert result.energy.balance_pct == 82.3
            assert result.narrative.last_doubt == "Je doute de mes compétences"
    
    @patch('app.core.journal_service.journal_service._create_fallback_journal')
    @patch('app.core.journal_service.narrative_analyzer')
    @pytest.mark.asyncio
    async def test_get_journal_data_fallback(self, mock_narrative_analyzer, mock_fallback):
        """✅ Fallback en cas d'erreur Narrative Analyzer"""
        from app.core.journal_service import journal_service
        
        # Simulation erreur Narrative Analyzer
        mock_narrative_analyzer.generate_context_packet = AsyncMock(
            side_effect=Exception("Erreur analyzer")
        )
        
        # Mock fallback
        fallback_journal = JournalDTO(
            user=JournalUser(id="test_user", first_name="Utilisateur", plan="standard"),
            energy=JournalEnergy(balance_pct=100.0),
            narrative=JournalNarrative(chapters=[], kpis=JournalKPIs(), next_steps=[])
        )
        mock_fallback.return_value = fallback_journal
        
        # Test
        result = await journal_service.get_journal_data("test_user")
        
        # Vérifications
        assert isinstance(result, JournalDTO)
        mock_fallback.assert_called_once_with("test_user")
    
    def test_event_to_chapter_mapping(self):
        """✅ Transformation événement → chapitre"""
        from app.core.journal_service import journal_service
        
        # Test événement CV généré
        cv_event = {
            "id": "event_123",
            "type": "cv_generated",
            "payload": {
                "ats_score": 85,
                "improvements_count": 7
            },
            "created_at": "2024-08-20T10:30:00Z"
        }
        
        chapter = journal_service._event_to_chapter(cv_event)
        
        assert chapter is not None
        assert chapter.type == "cv"
        assert chapter.title == "CV optimisé"
        assert "ATS 85" in chapter.gain
        assert "+7 améliorations" in chapter.gain
        
        # Test événement non mappé
        unknown_event = {
            "id": "event_456",
            "type": "unknown_event_type",
            "payload": {},
            "created_at": "2024-08-20T10:30:00Z"
        }
        
        chapter = journal_service._event_to_chapter(unknown_event)
        assert chapter is None


class TestEnergyPreviewService:
    """Tests du service Energy Preview"""
    
    @patch('app.core.energy_preview_service.energy_manager')
    @pytest.mark.asyncio
    async def test_preview_action_cost_standard_user(self, mock_energy_manager):
        """✅ Prévisualisation coût pour utilisateur standard"""
        from app.core.energy_preview_service import energy_preview_service
        
        # Mock Energy Manager
        mock_energy_manager.check_balance = AsyncMock(return_value={
            "current_energy": 60.0,
            "subscription_type": "standard"
        })
        
        # Test
        request = EnergyPreviewRequest(user_id="test_user", action="lettre_motivation")
        result = await energy_preview_service.preview_action_cost(request)
        
        # Vérifications
        assert isinstance(result, EnergyPreviewResponse)
        assert result.action == "lettre_motivation"
        assert result.cost_pct == 15.0  # Selon grille Oracle
        assert result.balance_before == 60.0
        assert result.balance_after == 45.0
        assert result.can_perform is True
        assert result.unlimited_user is False
    
    @patch('app.core.energy_preview_service.energy_manager')
    @pytest.mark.asyncio
    async def test_preview_action_cost_unlimited_user(self, mock_energy_manager):
        """✅ Prévisualisation pour utilisateur unlimited"""
        from app.core.energy_preview_service import energy_preview_service
        
        # Mock Energy Manager pour unlimited
        mock_energy_manager.check_balance = AsyncMock(return_value={
            "current_energy": 100.0,
            "subscription_type": "luna_unlimited"
        })
        
        # Test
        request = EnergyPreviewRequest(user_id="unlimited_user", action="audit_complet_profil")
        result = await energy_preview_service.preview_action_cost(request)
        
        # Vérifications
        assert result.cost_pct == 0.0
        assert result.balance_before == 100.0
        assert result.balance_after == 100.0
        assert result.can_perform is True
        assert result.unlimited_user is True
    
    @patch('app.core.energy_preview_service.energy_manager')
    @pytest.mark.asyncio
    async def test_preview_insufficient_energy(self, mock_energy_manager):
        """✅ Prévisualisation avec énergie insuffisante"""
        from app.core.energy_preview_service import energy_preview_service
        
        # Mock avec peu d'énergie
        mock_energy_manager.check_balance = AsyncMock(return_value={
            "current_energy": 10.0,
            "subscription_type": "standard"
        })
        
        # Test action coûteuse
        request = EnergyPreviewRequest(user_id="test_user", action="audit_complet_profil")
        result = await energy_preview_service.preview_action_cost(request)
        
        # Vérifications
        assert result.can_perform is False
        assert result.balance_after == 0.0  # max(0, 10 - 45)
    
    def test_confirmation_messages(self):
        """✅ Messages de confirmation contextualisés"""
        from app.core.energy_preview_service import energy_preview_service
        
        # Test utilisateur unlimited
        unlimited_preview = EnergyPreviewResponse(
            action="conseil_rapide",
            cost_pct=0.0,
            balance_before=100.0,
            balance_after=100.0,
            can_perform=True,
            unlimited_user=True
        )
        
        message = energy_preview_service.get_confirmation_message(unlimited_preview)
        assert "énergie Luna illimitée" in message
        assert "🌙" in message
        
        # Test énergie insuffisante
        insufficient_preview = EnergyPreviewResponse(
            action="audit_complet_profil",
            cost_pct=45.0,
            balance_before=30.0,
            balance_after=0.0,
            can_perform=False,
            unlimited_user=False
        )
        
        message = energy_preview_service.get_confirmation_message(insufficient_preview)
        assert "15%" in message  # déficit = 45 - 30
        assert "Rechargeons" in message


class TestJournalEndpoints:
    """Tests des endpoints API Journal"""
    
    @pytest.fixture
    def client(self):
        """Client de test FastAPI"""
        from api_main import app
        return TestClient(app)
    
    @patch('app.api.luna_endpoints.journal_service')
    @patch('app.api.luna_endpoints._emit_journal_event')
    def test_get_journal_endpoint(self, mock_emit_event, mock_journal_service, client, mock_journal_data):
        """✅ Test endpoint GET /luna/journal/{user_id}"""
        
        # Mock service
        mock_journal_service.get_journal_data = AsyncMock(return_value=mock_journal_data)
        mock_emit_event.return_value = AsyncMock()
        
        # Test request
        response = client.get("/luna/journal/test_user_123?window=14d")
        
        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        assert data["user"]["id"] == "test_user_123"
        assert data["user"]["first_name"] == "Alice"
        assert data["energy"]["balance_pct"] == 75.5
        assert len(data["narrative"]["chapters"]) == 1
        assert data["narrative"]["chapters"][0]["type"] == "cv"
    
    @patch('app.api.luna_endpoints.energy_preview_service')
    @patch('app.api.luna_endpoints._emit_journal_event')
    def test_energy_preview_endpoint(self, mock_emit_event, mock_preview_service, client):
        """✅ Test endpoint POST /luna/energy/preview"""
        
        # Mock service
        preview_result = EnergyPreviewResponse(
            action="lettre_motivation",
            cost_pct=15.0,
            balance_before=80.0,
            balance_after=65.0,
            can_perform=True,
            unlimited_user=False
        )
        mock_preview_service.preview_action_cost = AsyncMock(return_value=preview_result)
        mock_emit_event.return_value = AsyncMock()
        
        # Test request
        response = client.post("/luna/energy/preview", json={
            "user_id": "test_user",
            "action": "lettre_motivation"
        })
        
        # Vérifications
        assert response.status_code == 200
        data = response.json()
        
        assert data["action"] == "lettre_motivation"
        assert data["cost_pct"] == 15.0
        assert data["can_perform"] is True
    
    def test_invalid_user_id_endpoint(self, client):
        """✅ Test validation user_id invalide"""
        
        # Test avec user_id invalide
        response = client.get("/luna/journal/invalid@user#id")
        
        # Devrait retourner erreur 422 (validation Pydantic)
        assert response.status_code in [422, 400]


class TestJournalEventTracking:
    """Tests du système d'événements Journal"""
    
    @patch('app.core.supabase_client.event_store')
    @pytest.mark.asyncio
    async def test_journal_event_emission(self, mock_event_store):
        """✅ Émission événement Journal spécifique"""
        from app.api.luna_endpoints import _emit_journal_event
        
        mock_event_store.create_journal_event = AsyncMock()
        
        # Test émission événement
        await _emit_journal_event("JournalViewed", {
            "user_id": "test_user",
            "chapters_count": 5,
            "energy_balance_pct": 75.0
        })
        
        # Vérifications
        mock_event_store.create_journal_event.assert_called_once_with(
            user_id="test_user",
            event_type="JournalViewed",
            event_data={
                "user_id": "test_user",
                "chapters_count": 5,
                "energy_balance_pct": 75.0
            },
            metadata={
                "source": "journal_narratif",
                "version": "v1.0"
            }
        )
    
    @pytest.mark.asyncio
    async def test_event_emission_no_user_id(self):
        """✅ Gestion erreur émission sans user_id"""
        from app.api.luna_endpoints import _emit_journal_event
        
        # Test sans user_id (ne devrait pas planter)
        try:
            await _emit_journal_event("TestEvent", {
                "data": "without_user_id"
            })
            # Si pas d'exception = bon comportement
            assert True
        except Exception:
            # Ne devrait pas planter même avec données invalides
            assert False, "Event emission should not crash without user_id"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])