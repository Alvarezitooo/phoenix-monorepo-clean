#!/usr/bin/env python3
"""
🧪 Test script pour l'API Phoenix Letters
Tests rapides des endpoints principaux
"""

import asyncio
import httpx
import json
from datetime import datetime

API_BASE = "http://localhost:8001"

async def test_api():
    """Test complet de l'API"""
    print("🧪 === TESTS API PHOENIX LETTERS ===")
    
    async with httpx.AsyncClient() as client:
        
        # 1. Test health check
        print("\n1️⃣ Health Check...")
        try:
            response = await client.get(f"{API_BASE}/health")
            if response.status_code == 200:
                health = response.json()
                print(f"✅ API healthy - {health['status']}")
                print(f"   Version: {health['version']}")
                print(f"   Environment: {health['environment']}")
                print(f"   AI Service: {health['ai_service']['status']}")
            else:
                print(f"❌ Health check failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Health check error: {e}")
        
        # 2. Test génération de lettre
        print("\n2️⃣ Génération de lettre...")
        try:
            letter_request = {
                "company_name": "Google France",
                "position_title": "Développeur Full-Stack",
                "job_description": "Poste de développeur React/Node.js dans une équipe agile",
                "experience_level": "intermédiaire",
                "desired_tone": "professionnel", 
                "max_words": 350,
                "use_ai": True
            }
            
            response = await client.post(
                f"{API_BASE}/api/letters/generate",
                json=letter_request,
                params={"user_id": "demo-user"}
            )
            
            if response.status_code == 200:
                result = response.json()
                letter = result['letter']
                gen_info = result['generation_info']
                
                print(f"✅ Lettre générée!")
                print(f"   ID: {letter['id']}")
                print(f"   Mots: {letter['word_count']}")
                print(f"   IA: {letter['ai_generated']}")
                print(f"   Temps: {gen_info.get('generation_time_seconds', 0):.2f}s")
                print(f"   Preview: {letter['content'][:100]}...")
                
                # Sauvegarder l'ID pour tests suivants
                global test_letter_id
                test_letter_id = letter['id']
                
            else:
                print(f"❌ Génération échouée: {response.status_code}")
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"❌ Erreur génération: {e}")
        
        # 3. Test récupération lettres utilisateur
        print("\n3️⃣ Lettres utilisateur...")
        try:
            response = await client.get(f"{API_BASE}/api/letters/user/demo-user")
            
            if response.status_code == 200:
                letters = response.json()
                print(f"✅ {len(letters)} lettres trouvées")
                for letter in letters[:3]:  # Top 3
                    print(f"   - {letter['company_name']} | {letter['status']} | {letter['word_count']} mots")
            else:
                print(f"❌ Récupération lettres échouée: {response.status_code}")
        except Exception as e:
            print(f"❌ Erreur lettres utilisateur: {e}")
        
        # 4. Test récupération lettre spécifique
        if 'test_letter_id' in globals():
            print("\n4️⃣ Lettre spécifique...")
            try:
                response = await client.get(
                    f"{API_BASE}/api/letters/{test_letter_id}",
                    params={"user_id": "demo-user"}
                )
                
                if response.status_code == 200:
                    letter = response.json()
                    print(f"✅ Lettre récupérée: {letter['company_name']}")
                    print(f"   Contenu: {len(letter['content'])} caractères")
                    print(f"   Qualité: {letter['quality_indicators']}")
                else:
                    print(f"❌ Récupération lettre échouée: {response.status_code}")
            except Exception as e:
                print(f"❌ Erreur lettre spécifique: {e}")
        
        # 5. Test statistiques utilisateur
        print("\n5️⃣ Statistiques utilisateur...")
        try:
            response = await client.get(f"{API_BASE}/api/user/demo-user/statistics")
            
            if response.status_code == 200:
                stats = response.json()
                print(f"✅ Statistiques récupérées")
                print(f"   Total lettres: {stats['total_letters']}")
                print(f"   Ce mois: {stats['this_month']}")
                print(f"   Qualité moyenne: {stats['average_quality']:.2f}")
                print(f"   Tendance: {stats['productivity_trend']}")
            else:
                print(f"❌ Statistiques échouées: {response.status_code}")
        except Exception as e:
            print(f"❌ Erreur statistiques: {e}")
        
        # 6. Test status IA
        print("\n6️⃣ Status service IA...")
        try:
            response = await client.get(f"{API_BASE}/api/ai/status")
            
            if response.status_code == 200:
                ai_status = response.json()
                print(f"✅ IA Status: {ai_status['status']}")
                if 'model_info' in ai_status:
                    model = ai_status['model_info']
                    print(f"   Provider: {model['provider']}")
                    print(f"   Model: {model['model_name']}")
            else:
                print(f"❌ Status IA échoué: {response.status_code}")
        except Exception as e:
            print(f"❌ Erreur status IA: {e}")
    
    print(f"\n🎉 Tests terminés - {datetime.now().strftime('%H:%M:%S')}")

async def test_error_handling():
    """Test de la gestion d'erreurs"""
    print("\n🧪 === TESTS GESTION ERREURS ===")
    
    async with httpx.AsyncClient() as client:
        
        # Test données invalides
        print("1️⃣ Test données invalides...")
        try:
            bad_request = {
                "company_name": "",  # Vide = invalide
                "position_title": "Test"
            }
            
            response = await client.post(
                f"{API_BASE}/api/letters/generate",
                json=bad_request
            )
            
            if response.status_code == 422:
                print("✅ Validation des données OK")
            else:
                print(f"❌ Validation échouée: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erreur test validation: {e}")
        
        # Test ressource introuvable
        print("2️⃣ Test ressource introuvable...")
        try:
            response = await client.get(f"{API_BASE}/api/letters/fake-id")
            
            if response.status_code == 404:
                print("✅ Gestion 404 OK")
            else:
                print(f"❌ 404 non géré: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erreur test 404: {e}")

def main():
    """Point d'entrée des tests"""
    print("🔥 PHOENIX LETTERS API TESTS")
    print("=" * 40)
    print("Assurez-vous que l'API est lancée sur http://localhost:8000")
    print("Commande: python api_main.py")
    print("=" * 40)
    
    # Tests principaux
    asyncio.run(test_api())
    
    # Tests erreurs
    asyncio.run(test_error_handling())
    
    print("\n✨ Tous les tests terminés!")

if __name__ == "__main__":
    main()