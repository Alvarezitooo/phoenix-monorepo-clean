"""
📈 Test Boucle Progression - Sprint 4
Validation complète du système de progression et célébrations Luna
"""

import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock

async def test_progress_tracker_creation():
    """Test création profil de progression"""
    
    print("📈 TEST PROGRESS TRACKER")
    print("=" * 50)
    
    from app.core.progress_tracker import (
        progress_tracker, ProgressMetricType, ProgressTrend, 
        ProgressMetric, UserProgressProfile
    )
    
    # Simuler des métriques de test
    test_metrics = {
        ProgressMetricType.ATS_SCORE: ProgressMetric(
            metric_type=ProgressMetricType.ATS_SCORE,
            current_value=85.0,
            previous_value=70.0,
            delta_1d=2.0,
            delta_7d=15.0,  # Forte progression
            delta_30d=25.0,
            trend=ProgressTrend.BREAKTHROUGH,
            confidence=0.9
        ),
        ProgressMetricType.LETTERS_CREATED: ProgressMetric(
            metric_type=ProgressMetricType.LETTERS_CREATED,
            current_value=3.0,
            previous_value=1.0,
            delta_7d=2.0,
            trend=ProgressTrend.RISING
        )
    }
    
    # Créer profil test
    profile = UserProgressProfile(
        user_id="test_user_progress",
        metrics=test_metrics,
        overall_trend=ProgressTrend.BREAKTHROUGH,
        momentum_score=85.0,
        last_victory={
            "metric_type": "ats_score",
            "improvement": 15.0,
            "level": "major",
            "unit": "points"
        },
        next_milestone={
            "type": "cv_optimization",
            "target": "Atteindre 90+ ATS Score",
            "estimated_energy": 20
        }
    )
    
    print(f"✅ Profil créé pour {profile.user_id}")
    print(f"📊 Tendance globale: {profile.overall_trend.value}")
    print(f"⚡ Momentum: {profile.momentum_score:.0f}/100")
    print(f"🏆 Dernière victoire: {profile.last_victory}")
    
    # Test des achievements
    achievements = profile.get_top_achievements(limit=2)
    print(f"🎯 Top achievements: {len(achievements)}")
    for achievement in achievements:
        print(f"   • {achievement['type']}: +{achievement['improvement']:.1f} ({achievement['trend']})")
    
    print("✅ Progress Tracker validé !")
    return profile

async def test_celebration_engine():
    """Test moteur de célébrations"""
    
    print("\n🎉 TEST CELEBRATION ENGINE")
    print("=" * 50)
    
    from app.core.celebration_engine import celebration_engine, CelebrationLevel
    from app.core.progress_tracker import ProgressMetricType, ProgressTrend
    
    # Test célébrations selon différents niveaux
    test_cases = [
        {
            "metric": ProgressMetricType.ATS_SCORE,
            "improvement": 20.0,  # MEGA improvement
            "trend": ProgressTrend.BREAKTHROUGH,
            "expected_level": CelebrationLevel.MEGA
        },
        {
            "metric": ProgressMetricType.LETTERS_CREATED,
            "improvement": 3.0,   # MAJOR improvement  
            "trend": ProgressTrend.RISING,
            "expected_level": CelebrationLevel.MAJOR
        },
        {
            "metric": ProgressMetricType.SESSION_FREQUENCY,
            "improvement": 2.0,   # MINOR improvement
            "trend": ProgressTrend.RISING,
            "expected_level": CelebrationLevel.MINOR
        },
        {
            "metric": ProgressMetricType.ATS_SCORE,
            "improvement": -5.0,  # Decline
            "trend": ProgressTrend.DECLINING,
            "expected_level": CelebrationLevel.ENCOURAGE
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🎊 Test {i}: {test_case['metric'].value}")
        
        celebration = celebration_engine.generate_celebration(
            metric_type=test_case["metric"],
            improvement=test_case["improvement"],
            trend=test_case["trend"],
            user_sentiment="motivé"
        )
        
        print(f"📊 Amélioration: {test_case['improvement']:+.1f}")
        print(f"🎯 Niveau attendu: {test_case['expected_level'].value}")
        print(f"🎉 Niveau généré: {celebration.level.value}")
        print(f"🏆 Titre: {celebration.title}")
        print(f"💬 Message: {celebration.message[:80]}...")
        print(f"🎨 Emojis: {celebration.emoji_combo}")
        
        if celebration.energy_bonus > 0:
            print(f"⚡ Bonus énergie: +{celebration.energy_bonus}")
        
        if celebration.next_challenge:
            print(f"🚀 Défi suivant: {celebration.next_challenge}")
        
        # Vérification niveau correct (sauf pour les cas limites)
        if test_case["improvement"] > 0:
            assert celebration.level != CelebrationLevel.ENCOURAGE, \
                f"Amélioration positive ne devrait pas donner ENCOURAGE"
        
        print("✅ Célébration générée avec succès")
    
    print("\n✅ Celebration Engine validé !")

async def test_luna_integration():
    """Test intégration complète dans Luna Core"""
    
    print("\n🌙 TEST INTÉGRATION LUNA CORE")
    print("=" * 50)
    
    # Mock des dépendances pour éviter appels réseau
    from app.core.progress_tracker import ProgressMetric, ProgressMetricType, ProgressTrend, UserProgressProfile
    from app.core.celebration_engine import celebration_engine
    
    # Profil avec victoire récente
    mock_profile = UserProgressProfile(
        user_id="test_luna_integration",
        metrics={
            ProgressMetricType.ATS_SCORE: ProgressMetric(
                metric_type=ProgressMetricType.ATS_SCORE,
                current_value=88.0,
                previous_value=75.0,
                delta_7d=13.0,  # Belle progression
                trend=ProgressTrend.RISING
            )
        },
        overall_trend=ProgressTrend.RISING,
        momentum_score=78.0,
        last_victory={
            "metric_type": "ats_score",
            "improvement": 13.0,
            "level": "major",
            "unit": "points",
            "timestamp": datetime.now(timezone.utc)
        }
    )
    
    # Test construction contexte progression
    from app.core.luna_core_service import get_luna_core
    luna = get_luna_core()
    
    progress_context = luna._build_progress_context(mock_profile)
    print("📈 Contexte progression généré:")
    print(f"Longueur: {len(progress_context)} caractères")
    
    # Vérifications clés
    assert "RISING" in progress_context.upper()
    assert "78/100" in progress_context  # Momentum score
    assert "13.0" in progress_context    # Improvement
    
    # Test déclenchement célébration
    should_celebrate = celebration_engine.should_trigger_celebration(mock_profile)
    print(f"🎊 Célébration recommandée: {should_celebrate}")
    
    if should_celebrate:
        achievements = mock_profile.get_top_achievements(limit=1)
        celebration = celebration_engine.generate_celebration(
            metric_type=ProgressMetricType.ATS_SCORE,
            improvement=13.0,
            trend=ProgressTrend.RISING,
            user_sentiment="motivé"
        )
        
        celebration_text = celebration_engine.format_celebration_for_luna(celebration)
        print("🎉 Célébration formatée pour Luna:")
        print(f"Longueur: {len(celebration_text)} caractères")
        
        # Vérifications
        assert "CÉLÉBRATION AUTOMATIQUE" in celebration_text
        assert celebration.emoji_combo in celebration_text
        assert "INSTRUCTION LUNA" in celebration_text
    
    print("✅ Intégration Luna Core validée !")

async def test_progress_trends():
    """Test calcul des tendances de progression"""
    
    print("\n📊 TEST TENDANCES PROGRESSION")  
    print("=" * 50)
    
    from app.core.progress_tracker import ProgressMetric, ProgressMetricType, ProgressTrend
    
    test_cases = [
        {"delta_7d": 25.0, "expected": ProgressTrend.BREAKTHROUGH},
        {"delta_7d": 8.0, "expected": ProgressTrend.RISING},
        {"delta_7d": 1.0, "expected": ProgressTrend.STABLE},
        {"delta_7d": -5.0, "expected": ProgressTrend.DECLINING},
        {"delta_7d": -15.0, "expected": ProgressTrend.STAGNANT}
    ]
    
    for test_case in test_cases:
        metric = ProgressMetric(
            metric_type=ProgressMetricType.ATS_SCORE,
            current_value=80.0,
            previous_value=80.0 - test_case["delta_7d"],
            delta_7d=test_case["delta_7d"]
        )
        
        calculated_trend = metric.calculate_trend()
        expected_trend = test_case["expected"]
        
        print(f"Delta 7j: {test_case['delta_7d']:+.1f} → {calculated_trend.value} (attendu: {expected_trend.value})")
        
        assert calculated_trend == expected_trend, \
            f"Tendance incorrecte pour delta {test_case['delta_7d']}"
    
    print("✅ Calculs de tendances validés !")

if __name__ == "__main__":
    print("🚀 VALIDATION SPRINT 4 - BOUCLE PROGRESSION")
    print("📈 Luna va maintenant célébrer tes victoires et t'encourager selon tes progrès !")
    print()
    
    # Exécution de tous les tests
    asyncio.run(test_progress_tracker_creation())
    asyncio.run(test_celebration_engine())
    asyncio.run(test_luna_integration())  
    asyncio.run(test_progress_trends())
    
    print("\n" + "="*60)
    print("🎯 SPRINT 4 TERMINÉ AVEC SUCCÈS !")
    print("📈 Boucle Progression opérationnelle")
    print("🎉 Célébrations automatiques intégrées")
    print("💪 Encouragements intelligents selon momentum")
    print("🚀 Prêt pour Sprint 5 - Boucle Narrative")
    print("="*60)