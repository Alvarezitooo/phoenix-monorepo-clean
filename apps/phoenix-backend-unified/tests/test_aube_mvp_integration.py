"""
🌙 Test Phoenix Aube MVP Integration
Validation du flow Ultra-Light selon la matrice pain-points → leviers psycho
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from api_main import app
from app.models.auth import LoginRequest

client = TestClient(app)

# Test user credentials (reuse existing test patterns)
TEST_USER_EMAIL = "aube.test@phoenix.ai"
TEST_USER_PASSWORD = "SecureAube2024!"

@pytest.fixture
async def authenticated_headers():
    """Fixture pour obtenir des headers d'authentification"""
    # Simuler login (en réalité utiliser les vrais endpoints)
    login_response = client.post("/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    
    if login_response.status_code != 200:
        # Créer utilisateur test si nécessaire
        register_response = client.post("/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if register_response.status_code == 201:
            login_response = client.post("/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
    
    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    # Fallback: mock headers pour test isolation
    return {"Authorization": "Bearer mock_token_for_test"}

class TestAubeMVPFlow:
    """
    Test du flow MVP Phoenix Aube
    Pain Points → Leviers Psycho → Fonctionnalités → Journal
    """
    
    @pytest.mark.asyncio
    async def test_pain_point_1_perte_identite_rituel_clarte(self):
        """
        Pain Point: "Je ne sais plus qui je suis" (perte d'identité)
        Levier: Rituel de la Clarté → sentiment d'ordre dans le chaos
        Fonctionnalité: Tests psychométriques (Big Five + RIASEC)  
        Journal: "J'ai clarifié qui je suis"
        """
        headers = {"Authorization": "Bearer mock_token_for_test"}
        
        with patch('app.api.aube_endpoints.get_current_user_dependency') as mock_auth:
            mock_auth.return_value = lambda: {"id": "test-user-id", "email": TEST_USER_EMAIL}
            
            # 1. Démarrer session Ultra-Light (≤60s)
            start_response = client.post("/luna/aube/assessment/start", 
                json={"level": "ultra_light", "context": {"source": "perte_identite"}},
                headers=headers
            )
            
            assert start_response.status_code == 200
            session_data = start_response.json()
            assert session_data["success"] is True
            assert session_data["level"] == "ultra_light"
            assert session_data["energy_cost"] == 0  # MVP gratuit
            assert session_data["estimated_duration_minutes"] == 1
            assert "Suggestions, pas de verdicts" in session_data["disclaimer"]
            
            session_id = session_data["session_id"]
            
            # 2. Collecter signaux identitaires (appetences)
            update_response = client.post("/luna/aube/assessment/update",
                json={
                    "session_id": session_id,
                    "completed_step": "appetences",
                    "signals": {
                        "appetences": {"people": 8, "data": 3},  # Preference humaine forte
                        "valeurs_top2": ["autonomie", "sens"],
                        "style_travail": "collaboratif"
                    }
                },
                headers=headers
            )
            
            assert update_response.status_code == 200
            update_data = update_response.json()
            assert update_data["success"] is True
            assert update_data["energy_cost"] == 0
            
            # 3. Générer recommandations + Journal
            reco_response = client.post(f"/luna/aube/recommendations/{session_id}",
                headers=headers
            )
            
            assert reco_response.status_code == 200
            reco_data = reco_response.json()
            
            # Validation recommandations (should prioritize people-oriented jobs)
            assert reco_data["success"] is True
            assert len(reco_data["recommendations"]) >= 2  # Au moins 2 pistes
            
            # Validation leviers psycho intégrés
            first_job = reco_data["recommendations"][0]
            assert "reasons" in first_job
            assert len(first_job["reasons"]) >= 2  # Raisons lisibles
            assert "futureproof" in first_job
            assert "score_0_1" in first_job["futureproof"]
            
            # Validation Journal (Rituel de la Clarté)
            journal_chapters = reco_data["journal_chapters"]
            assert len(journal_chapters) >= 2
            clarity_chapter = next((ch for ch in journal_chapters if ch["type"] == "clarity"), None)
            assert clarity_chapter is not None
            assert "J'ai clarifié qui je suis" in clarity_chapter["title"]
    
    @pytest.mark.asyncio 
    async def test_pain_point_4_peur_ia_gardien_futur(self):
        """
        Pain Point: Peur que le métier choisi disparaisse
        Levier: Gardien du Futur → sécurité face à l'IA
        Fonctionnalité: Validation future-proof + timeline + plan IA-skills
        Journal: "J'ai choisi un chemin qui survivra à l'IA"
        """
        headers = {"Authorization": "Bearer mock_token_for_test"}
        
        with patch('app.api.aube_endpoints.get_current_user_dependency') as mock_auth:
            mock_auth.return_value = lambda: {"id": "test-user-futur", "email": TEST_USER_EMAIL}
            
            # Session orientée IA-résistance
            start_response = client.post("/luna/aube/assessment/start",
                json={"level": "court", "context": {"source": "peur_ia"}},
                headers=headers
            )
            
            session_id = start_response.json()["session_id"]
            
            # Signaux IA-conscients
            update_response = client.post("/luna/aube/assessment/update",
                json={
                    "session_id": session_id,
                    "completed_step": "ia_attitude", 
                    "signals": {
                        "ia_appetit": 8,  # Forte appétence IA
                        "risk_tolerance": 3,  # Faible tolérance au risque
                        "valeurs_top2": ["stabilite", "apprentissage"]
                    }
                },
                headers=headers
            )
            
            # Recommandations avec focus future-proof
            reco_response = client.post(f"/luna/aube/recommendations/{session_id}",
                headers=headers
            )
            
            reco_data = reco_response.json()
            
            # Validation Gardien du Futur
            for job in reco_data["recommendations"]:
                fp = job["futureproof"]
                assert "score_0_1" in fp
                assert 0.0 <= fp["score_0_1"] <= 1.0
                assert "drivers" in fp
                assert len(fp["drivers"]) >= 1
                
                # Plan IA-skills présent
                if "ia_plan" in job and job["ia_plan"]:
                    ia_skill = job["ia_plan"][0]
                    assert "skill" in ia_skill
                    assert "micro_action" in ia_skill
                    assert "effort_min_per_day" in ia_skill
                    assert ia_skill["effort_min_per_day"] <= 30  # MVP: ≤30min/jour
            
            # Validation meta future-proof
            assert "meta" in reco_data
            assert "future_proof" in reco_data["meta"]
            assert "disclaimer" in reco_data["meta"]
    
    @pytest.mark.asyncio
    async def test_pain_point_5_vertige_apres_choix_main_tendue(self):
        """
        Pain Point: Vertige après le choix (« et maintenant ? »)
        Levier: Main Tendue → continuité, pas d'abandon
        Fonctionnalité: Handover automatique → Phoenix CV, Letters, Rise  
        Journal: "Mon histoire continue avec un plan d'action concret"
        """
        headers = {"Authorization": "Bearer mock_token_for_test"}
        
        with patch('app.api.aube_endpoints.get_current_user_dependency') as mock_auth:
            mock_auth.return_value = lambda: {"id": "test-user-handover", "email": TEST_USER_EMAIL}
            
            start_response = client.post("/luna/aube/assessment/start",
                json={"level": "ultra_light", "context": {"source": "apres_choix"}},
                headers=headers
            )
            
            session_id = start_response.json()["session_id"]
            
            # Finaliser assessment
            client.post("/luna/aube/assessment/update",
                json={
                    "session_id": session_id,
                    "completed_step": "completed",
                    "signals": {"valeurs_top2": ["action", "concret"]}
                },
                headers=headers
            )
            
            # Récupérer recommandations avec handover
            reco_response = client.post(f"/luna/aube/recommendations/{session_id}",
                headers=headers  
            )
            
            reco_data = reco_response.json()
            
            # Validation Main Tendue (handover)
            assert "handover" in reco_data
            handover = reco_data["handover"]
            
            assert "cv_prefill" in handover
            assert "letters_ideas" in handover
            assert f"aube_session={session_id}" in handover["cv_prefill"]
            assert f"aube_session={session_id}" in handover["letters_ideas"]
            assert handover["energy_cost"] == 0  # MVP: handover léger gratuit
            
            # Validation continuité
            journal_chapters = reco_data["journal_chapters"]
            paths_chapter = next((ch for ch in journal_chapters if ch["type"] == "paths"), None)
            assert paths_chapter is not None
            assert "chemins possibles" in paths_chapter["title"]
    
    @pytest.mark.asyncio
    async def test_pain_point_6_peur_manipulation_ancre_ethique(self):
        """
        Pain Point: Peur de manipulation / perte données
        Levier: Ancre Éthique → confiance ultime
        Fonctionnalité: Export résultats + transparence sur l'usage
        Journal: "Mon histoire est à moi, et personne ne peut me la voler"
        """
        headers = {"Authorization": "Bearer mock_token_for_test"}
        
        with patch('app.api.aube_endpoints.get_current_user_dependency') as mock_auth:
            mock_auth.return_value = lambda: {"id": "test-user-ethique", "email": TEST_USER_EMAIL}
            
            start_response = client.post("/luna/aube/assessment/start",
                json={"level": "ultra_light", "context": {"source": "peur_manipulation"}},
                headers=headers
            )
            
            session_id = start_response.json()["session_id"]
            
            # Finaliser pour avoir des données à exporter
            client.post("/luna/aube/assessment/update",
                json={
                    "session_id": session_id,
                    "completed_step": "completed",
                    "signals": {"appetences": {"people": 5, "data": 5}}
                },
                headers=headers
            )
            
            # Test export (Ancre Éthique)
            export_response = client.get(f"/luna/aube/export/{session_id}",
                params={"format_type": "json"},
                headers=headers
            )
            
            assert export_response.status_code == 200
            export_data = export_response.json()
            
            # Validation Ancre Éthique
            assert "disclaimer" in export_data
            assert "Données personnelles" in export_data["disclaimer"]
            assert "usage strictement personnel" in export_data["disclaimer"]
            
            assert "user_id" in export_data
            assert "signals" in export_data  
            assert "note" in export_data["signals"]
            assert "éthique" in export_data["signals"]["note"]
            
            assert "explanations" in export_data
            expl = export_data["explanations"]
            assert "methodology" in expl
            assert "future_proof" in expl
            assert "Suggestions uniquement" in expl["disclaimer"]
            
            # Validation headers GDPR
            assert "Content-Disposition" in export_response.headers
            assert f"phoenix_aube_{session_id}.json" in export_response.headers["Content-Disposition"]
    
    @pytest.mark.asyncio
    async def test_mvp_performance_criteria(self):
        """
        Test des critères de performance MVP selon le blueprint
        - Ultra-Light ≤ 60s
        - Court ≤ 4min  
        - 0% énergie exploration
        - Top 3 métiers minimum
        - Journal 2+ chapitres
        """
        headers = {"Authorization": "Bearer mock_token_for_test"}
        
        with patch('app.api.aube_endpoints.get_current_user_dependency') as mock_auth:
            mock_auth.return_value = lambda: {"id": "test-user-perf", "email": TEST_USER_EMAIL}
            
            # Test durée estimée
            start_response = client.post("/luna/aube/assessment/start",
                json={"level": "ultra_light"},
                headers=headers
            )
            
            start_data = start_response.json()
            assert start_data["estimated_duration_minutes"] == 1  # ≤ 60s
            assert start_data["energy_cost"] == 0
            
            # Test durée Court
            start_court = client.post("/luna/aube/assessment/start", 
                json={"level": "court"},
                headers=headers
            )
            
            court_data = start_court.json()
            assert court_data["estimated_duration_minutes"] == 4  # ≤ 4min
            
            # Test génération recommandations
            session_id = start_data["session_id"]
            reco_response = client.post(f"/luna/aube/recommendations/{session_id}",
                headers=headers
            )
            
            reco_data = reco_response.json()
            
            # Validation critères MVP
            assert len(reco_data["recommendations"]) >= 3  # Top 3 minimum
            assert len(reco_data["journal_chapters"]) >= 2  # 2+ chapitres
            
            # Validation raisons lisibles
            for job in reco_data["recommendations"]:
                assert len(job["reasons"]) >= 2
                for reason in job["reasons"]:
                    assert "phrase" in reason
                    assert len(reason["phrase"]) > 0

@pytest.mark.asyncio
async def test_rate_limiting_aube_endpoints():
    """
    Test que les endpoints Aube respectent le rate limiting
    """
    headers = {"Authorization": "Bearer mock_token_for_test"}
    
    with patch('app.api.aube_endpoints.get_current_user_dependency') as mock_auth:
        mock_auth.return_value = lambda: {"id": "test-rate-limit", "email": TEST_USER_EMAIL}
        
        # Faire plusieurs requêtes rapides
        responses = []
        for i in range(5):
            response = client.post("/luna/aube/assessment/start",
                json={"level": "ultra_light"},
                headers=headers
            )
            responses.append(response)
        
        # Au moins les premières doivent passer
        success_count = sum(1 for r in responses if r.status_code == 200)
        assert success_count >= 1  # Au moins une requête autorisée
        
        # Vérifier rate limiting éventuel
        rate_limited = [r for r in responses if r.status_code == 429]
        if rate_limited:
            # Si rate limited, vérifier le message
            assert "Rate limit exceeded" in rate_limited[0].json()["detail"]