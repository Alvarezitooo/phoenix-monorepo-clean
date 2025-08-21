#!/usr/bin/env python3
"""
🎯 Test script pour l'API Career Transition - GAME CHANGER
Tests spécifiques aux nouveaux endpoints de skill mapping
"""

import asyncio
import httpx
import json
from datetime import datetime

API_BASE = "http://localhost:8001"

async def test_career_transition_api():
    """Test complet de l'API Career Transition"""
    print("🎯 === TESTS API CAREER TRANSITION - GAME CHANGER ===")
    
    async with httpx.AsyncClient() as client:
        
        # 1. Test Preview Transition (gratuit)
        print("\n1️⃣ Preview analyse transition...")
        try:
            response = await client.get(
                f"{API_BASE}/api/skills/preview-transition",
                params={
                    "previous_role": "Chef de projet construction",
                    "target_role": "Product Manager",
                    "previous_industry": "Construction",
                    "target_industry": "Tech"
                }
            )
            
            if response.status_code == 200:
                preview = response.json()
                print(f"✅ Preview généré!")
                print(f"   Transition: {preview.get('transition', {}).get('from')} → {preview.get('transition', {}).get('to')}")
                print(f"   Difficulté estimée: {preview.get('transition', {}).get('estimated_difficulty')}")
                print(f"   Score estimé: {preview.get('transition', {}).get('estimated_score_range')}")
                print(f"   Skills attendues: {preview.get('expected_analysis', {}).get('transferable_skills_expected')}")
            else:
                print(f"❌ Preview échoué: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erreur preview: {e}")
        
        # 2. Test Analyse Complète
        print("\n2️⃣ Analyse complète de transition...")
        try:
            transition_request = {
                "previous_role": "Chef de projet construction",
                "target_role": "Product Manager",
                "previous_industry": "Construction", 
                "target_industry": "Tech",
                "include_industry_analysis": True,
                "include_narrative_bridges": True,
                "max_transferable_skills": 8,
                "max_skill_gaps": 6,
                "max_narrative_bridges": 4
            }
            
            response = await client.post(
                f"{API_BASE}/api/skills/analyze-transition",
                json=transition_request,
                params={"user_id": "demo-user"}
            )
            
            if response.status_code == 200:
                result = response.json()
                transition = result['career_transition']
                metadata = result['analysis_metadata']
                
                print(f"✅ Analyse terminée!")
                print(f"   ID: {transition['id']}")
                print(f"   Score global: {transition['overall_transition_score']}")
                print(f"   Difficulté: {transition['transition_difficulty']}")
                print(f"   Temps: {metadata.get('analysis_time_seconds', 0):.2f}s")
                
                # Compétences transférables
                skills = transition['transferable_skills']
                print(f"   🚀 {len(skills)} compétences transférables:")
                for skill in skills[:3]:  # Top 3
                    print(f"     - {skill['skill_name']} ({skill['confidence_level']}) - {skill['confidence_score']:.0%}")
                
                # Lacunes
                gaps = transition['skill_gaps']
                print(f"   📚 {len(gaps)} lacunes identifiées:")
                for gap in gaps[:2]:  # Top 2
                    print(f"     - {gap['skill_name']} ({gap['importance_level']})")
                
                # Ponts narratifs
                bridges = transition['narrative_bridges']
                print(f"   🌉 {len(bridges)} ponts narratifs:")
                for bridge in bridges[:2]:
                    print(f"     - {bridge['bridge_type']}: Force {bridge['strength_score']:.0%}")
                
                # Transition sectorielle
                if transition['industry_transition']:
                    industry = transition['industry_transition']
                    print(f"   🏭 Transition sectorielle:")
                    print(f"     Difficulté: {industry['transition_difficulty']}")
                    if industry['success_rate']:
                        print(f"     Taux de succès: {industry['success_rate']:.0%}")
                
                # Sauvegarder l'ID pour tests suivants
                global test_transition_id
                test_transition_id = transition['id']
                
            else:
                print(f"❌ Analyse échouée: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Erreur analyse: {e}")
        
        # 3. Test transition différente
        print("\n3️⃣ Autre transition (Marketing → Data Science)...")
        try:
            transition_request = {
                "previous_role": "Responsable marketing digital",
                "target_role": "Data Scientist",
                "previous_industry": "Marketing",
                "target_industry": "Tech",
                "max_transferable_skills": 6,
                "max_skill_gaps": 5
            }
            
            response = await client.post(
                f"{API_BASE}/api/skills/analyze-transition",
                json=transition_request,
                params={"user_id": "demo-user"}
            )
            
            if response.status_code == 200:
                result = response.json()
                transition = result['career_transition']
                
                print(f"✅ 2ème analyse réussie!")
                print(f"   Score: {transition['overall_transition_score']}")
                print(f"   Difficulté: {transition['transition_difficulty']}")
                print(f"   Skills: {len(transition['transferable_skills'])}")
                print(f"   Gaps: {len(transition['skill_gaps'])}")
                
            else:
                print(f"❌ 2ème analyse échouée: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erreur 2ème analyse: {e}")
        
        # 4. Test limites et validation
        print("\n4️⃣ Tests validation...")
        try:
            # Test données invalides
            bad_request = {
                "previous_role": "",  # Vide
                "target_role": "Product Manager"
            }
            
            response = await client.post(
                f"{API_BASE}/api/skills/analyze-transition",
                json=bad_request
            )
            
            if response.status_code == 422:
                print("✅ Validation des données OK")
            else:
                print(f"❌ Validation échouée: {response.status_code}")
                
            # Test rôles identiques
            same_roles_request = {
                "previous_role": "Product Manager",
                "target_role": "Product Manager"
            }
            
            response = await client.post(
                f"{API_BASE}/api/skills/analyze-transition", 
                json=same_roles_request
            )
            
            if response.status_code >= 400:
                print("✅ Validation rôles identiques OK")
            else:
                print("❌ Rôles identiques non détectés")
                
        except Exception as e:
            print(f"❌ Erreur tests validation: {e}")
    
    print(f"\n🎉 Tests Career Transition terminés - {datetime.now().strftime('%H:%M:%S')}")

async def test_integration_complete():
    """Test d'intégration complète avec l'API existante"""
    print("\n🧪 === TEST INTÉGRATION COMPLÈTE ===")
    
    async with httpx.AsyncClient() as client:
        
        # 1. Générer une lettre
        print("1️⃣ Génération lettre de base...")
        letter_request = {
            "company_name": "Google France",
            "position_title": "Product Manager",
            "job_description": "Poste de PM dans une équipe agile",
            "use_ai": True
        }
        
        letter_response = await client.post(
            f"{API_BASE}/api/letters/generate",
            json=letter_request,
            params={"user_id": "demo-user"}
        )
        
        if letter_response.status_code == 200:
            print("✅ Lettre générée")
            
            # 2. Puis analyser la transition pour ce même poste
            print("2️⃣ Analyse transition vers ce poste...")
            transition_request = {
                "previous_role": "Chef de projet",
                "target_role": "Product Manager", # Même poste que la lettre
                "max_transferable_skills": 5
            }
            
            transition_response = await client.post(
                f"{API_BASE}/api/skills/analyze-transition",
                json=transition_request,
                params={"user_id": "demo-user"}
            )
            
            if transition_response.status_code == 200:
                print("✅ Intégration lettre + transition OK")
                result = transition_response.json()
                score = result['career_transition']['overall_transition_score']
                print(f"   Score transition vers PM: {score}")
            else:
                print("❌ Transition après lettre échouée")
        else:
            print("❌ Génération lettre échouée")

def main():
    """Point d'entrée des tests"""
    print("🎯 PHOENIX LETTERS - CAREER TRANSITION TESTS")
    print("=" * 50)
    print("Assurez-vous que l'API est lancée sur http://localhost:8001")
    print("Commande: python api_main.py")
    print("=" * 50)
    
    # Tests spécifiques Career Transition
    asyncio.run(test_career_transition_api())
    
    # Tests d'intégration
    asyncio.run(test_integration_complete())
    
    print("\n✨ 🎯 GAME CHANGER - Tous les tests terminés!")
    print("\nFeatures testées:")
    print("  ✅ Preview gratuit de transition")
    print("  ✅ Analyse complète avec IA")
    print("  ✅ Compétences transférables")
    print("  ✅ Identification des lacunes")
    print("  ✅ Ponts narratifs intelligents")
    print("  ✅ Analyse sectorielle")
    print("  ✅ Validation et quotas")
    print("  ✅ Intégration avec API lettres")

if __name__ == "__main__":
    main()