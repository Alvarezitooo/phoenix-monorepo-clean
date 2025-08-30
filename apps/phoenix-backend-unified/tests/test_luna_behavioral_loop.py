"""
🌀 Test Comportemental Luna - Sprint 3 
Validation complète de la Boucle Comportementale
"""

import asyncio
from datetime import datetime

async def test_behavioral_patterns():
    """Test des patterns comportementaux selon différents sentiments"""
    
    from app.core.sentiment_analyzer import sentiment_analyzer
    from app.core.luna_core_service import get_luna_core
    
    print("🌀 TEST BOUCLE COMPORTEMENTALE LUNA")
    print("=" * 60)
    
    test_messages = [
        {
            "message": "Salut ! Je suis super motivé, on fonce pour booster mon CV !",
            "expected_sentiment": "motivé",
            "user_profile": "Utilisateur énergique"
        },
        {
            "message": "Je suis un peu perdu avec mon CV, je ne sais pas par où commencer...",
            "expected_sentiment": "anxieux", 
            "user_profile": "Utilisateur hésitant"
        },
        {
            "message": "Peux-tu m'expliquer concrètement comment optimiser les mots-clés ATS ?",
            "expected_sentiment": "factuel",
            "user_profile": "Utilisateur analytique"
        },
        {
            "message": "Qu'est-ce qui rend une lettre de motivation vraiment différente des autres ?",
            "expected_sentiment": "curieux",
            "user_profile": "Utilisateur exploratoire"
        }
    ]
    
    for i, test_case in enumerate(test_messages, 1):
        print(f"\n📝 TEST {i}: {test_case['user_profile']}")
        print(f"Message: \"{test_case['message']}\"")
        
        # 1. Analyse du sentiment
        sentiment = await sentiment_analyzer.analyze_user_message(
            message=test_case['message'],
            user_id=f"test_user_{i}"
        )
        
        print(f"🧠 Sentiment détecté: {sentiment.primary_sentiment} (confiance: {sentiment.confidence:.1f})")
        print(f"💡 État émotionnel: {sentiment.emotional_state}")
        print(f"🎭 Style communication: {sentiment.communication_style}")
        print(f"⚡ Niveau énergie: {sentiment.energy_level}")
        print(f"🔍 Mots-clés: {', '.join(sentiment.keywords_detected[:3])}")
        
        # 2. Vérification sentiment attendu
        assert sentiment.primary_sentiment == test_case['expected_sentiment'], \
            f"Sentiment attendu: {test_case['expected_sentiment']}, reçu: {sentiment.primary_sentiment}"
        
        # 3. Test adaptation prompt
        luna = get_luna_core()
        adaptation = luna._build_sentiment_adaptation(sentiment.to_dict())
        empathy = luna._build_empathy_context(sentiment.to_dict())
        
        print(f"✅ Adaptation générée: {len(adaptation)} caractères")
        print(f"✅ Empathie générée: {len(empathy)} caractères")
        
        # Vérifications spécifiques selon sentiment
        if sentiment.primary_sentiment == "motivé":
            assert "MOTIVÉ" in adaptation.upper()
            assert any(emoji in adaptation for emoji in ["🚀", "🔥", "⚡"])
            
        elif sentiment.primary_sentiment == "anxieux":
            assert "ANXIEUX" in adaptation.upper()
            assert "étape par étape" in adaptation or "rassur" in adaptation.lower()
            
        elif sentiment.primary_sentiment == "factuel":
            assert "FACTUEL" in adaptation.upper()
            assert "structur" in adaptation.lower() or "précis" in adaptation.lower()
            
        elif sentiment.primary_sentiment == "curieux":
            assert "CURIEUX" in adaptation.upper()
            assert "explor" in adaptation.lower() or "découvr" in adaptation.lower()
        
        print(f"✅ Adaptations comportementales validées pour {sentiment.primary_sentiment}")
        print("-" * 50)
    
    print("\n🎉 TOUS LES TESTS COMPORTEMENTAUX RÉUSSIS !")
    print("🌀 La Boucle Comportementale fonctionne parfaitement")

async def test_empathy_keywords():
    """Test spécifique des mots-clés d'empathie"""
    
    print("\n🤗 TEST EMPATHIE CONTEXTUELLE")
    print("=" * 40)
    
    test_cases = [
        {
            "keywords": ["peur", "anxieux"],
            "expected_empathy": "Rassure et déstresse"
        },
        {
            "keywords": ["perdu", "compliqué"], 
            "expected_empathy": "Guide avec des étapes simples"
        },
        {
            "keywords": ["motivé", "go"],
            "expected_empathy": "Alimente et canalise"
        }
    ]
    
    from app.core.luna_core_service import get_luna_core
    luna = get_luna_core()
    
    for test_case in test_cases:
        sentiment_context = {
            "emotional_state": "neutral",
            "keywords_detected": test_case["keywords"]
        }
        
        empathy = luna._build_empathy_context(sentiment_context)
        print(f"Keywords: {test_case['keywords']} → {test_case['expected_empathy']}")
        
        assert test_case["expected_empathy"] in empathy, \
            f"Empathie attendue non trouvée dans: {empathy}"
        
        print("✅ Empathie contextuelle validée")

if __name__ == "__main__":
    print("🚀 VALIDATION SPRINT 3 - BOUCLE COMPORTEMENTALE")
    print("🌀 Luna va maintenant adapter son ton selon votre état émotionnel!")
    print()
    
    # Exécution des tests
    asyncio.run(test_behavioral_patterns())
    asyncio.run(test_empathy_keywords())
    
    print("\n" + "="*60)
    print("🎯 SPRINT 3 TERMINÉ AVEC SUCCÈS !")
    print("🌀 Boucle Comportementale opérationnelle")
    print("💙 Luna adapte maintenant son empathie en temps réel")
    print("🚀 Prêt pour Sprint 4 - Boucle Progression")
    print("="*60)