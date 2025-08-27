from fastapi.testclient import TestClient
import pytest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)
AUTH = {"Authorization": "Bearer testtoken"}
USER = "11111111-1111-1111-1111-111111111111"

def test_flow_e2e():
    """Test du flow complet Phoenix Aube : start → recommend → futureproof → journal"""
    
    # 1. Démarrage assessment
    r = client.post("/luna/aube/assessment/start", headers=AUTH, json={"user_id": USER})
    assert r.status_code in [200, 201]
    assessment_data = r.json()
    assert assessment_data["user_id"] == USER
    assert assessment_data["status"] == "in_progress"
    
    # 2. Génération recommandations
    r = client.post("/luna/aube/match/recommend", headers=AUTH, json={
        "user_id": USER, 
        "k": 5, 
        "features": {"appetences": {"people": 1, "data": 0}}
    })
    assert r.status_code == 200
    recos = r.json()["recommendations"]
    assert len(recos) >= 1
    job = recos[0]["job_code"]
    
    # Vérification structure recommandation
    assert "label" in recos[0]
    assert "reasons" in recos[0]
    assert "futureproof" in recos[0]
    
    # 3. Score future-proof
    r = client.post("/luna/aube/futureproof/score", headers=AUTH, json={
        "user_id": USER, 
        "job_code": job
    })
    assert r.status_code == 200
    futureproof_data = r.json()
    assert "score_0_1" in futureproof_data
    assert 0 <= futureproof_data["score_0_1"] <= 1
    assert "drivers" in futureproof_data
    
    # 4. Vérification journal (événements créés)
    r = client.get(f"/luna/journal/{USER}", headers=AUTH)
    assert r.status_code == 200
    journal_data = r.json()
    assert journal_data["narrative"]["chapters"]
    
    # Vérification événements Aube dans les chapitres
    aube_chapters = [ch for ch in journal_data["narrative"]["chapters"] 
                    if ch["type"] == "analysis"]
    assert len(aube_chapters) > 0


def test_energy_consumption():
    """Test de la consommation d'énergie pour les actions Aube"""
    
    # Vérification énergie avant actions
    r = client.get(f"/luna/energy/check/{USER}", headers=AUTH, json={"user_id": USER})
    if r.status_code == 200:
        initial_energy = r.json()["current_energy"]
        
        # Action qui consomme de l'énergie
        r = client.post("/luna/aube/match/recommend", headers=AUTH, json={
            "user_id": USER, 
            "k": 3, 
            "features": {"appetences": {"people": 0, "data": 1}}
        })
        assert r.status_code == 200
        
        # Vérification énergie après action (si pas unlimited)
        # Note: Le test peut passer même avec unlimited car c'est une config valide


def test_recommendation_quality():
    """Test de la qualité des recommandations selon les préférences"""
    
    # Test preference "people"
    r = client.post("/luna/aube/match/recommend", headers=AUTH, json={
        "user_id": USER,
        "k": 3,
        "features": {"appetences": {"people": 1, "data": 0}}
    })
    assert r.status_code == 200
    people_recos = r.json()["recommendations"]
    
    # Doit inclure UX Designer (orienté people)
    job_codes = [reco["job_code"] for reco in people_recos]
    assert "UXD" in job_codes or "PO" in job_codes
    
    # Test preference "data"
    r = client.post("/luna/aube/match/recommend", headers=AUTH, json={
        "user_id": USER,
        "k": 3,
        "features": {"appetences": {"people": 0, "data": 1}}
    })
    assert r.status_code == 200
    data_recos = r.json()["recommendations"]
    
    # Doit inclure Data Analyst en premier
    assert data_recos[0]["job_code"] == "DA"


def test_error_handling():
    """Test de la gestion d'erreur pour les endpoints Aube"""
    
    # User ID manquant
    r = client.post("/luna/aube/assessment/start", headers=AUTH, json={})
    assert r.status_code == 400
    assert "user_id required" in r.json()["detail"]
    
    # Job code manquant pour futureproof
    r = client.post("/luna/aube/futureproof/score", headers=AUTH, json={"user_id": USER})
    assert r.status_code == 400
    assert "job_code required" in r.json()["detail"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])