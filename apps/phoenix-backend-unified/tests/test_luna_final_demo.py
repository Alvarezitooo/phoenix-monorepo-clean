"""
🌙 Démo Finale Luna - Triple Boucle
Démonstration complète de la transformation Luna
"""

import asyncio

async def demo_luna_transformation():
    """Démontre la transformation complète de Luna"""
    
    print("🌙 DÉMO TRANSFORMATION LUNA - TRIPLE BOUCLE")
    print("=" * 70)
    print()
    
    # Import des services  
    from app.core.sentiment_analyzer import sentiment_analyzer
    from app.core.progress_tracker import ProgressMetricType, ProgressTrend, ProgressMetric, UserProgressProfile
    from app.core.vision_tracker import CareerPhase, VisionGoal, CareerNarrative, UserVisionProfile, VisionCategory
    from app.core.celebration_engine import celebration_engine
    from app.core.luna_core_service import get_luna_core
    from datetime import datetime, timezone
    
    # Scénarios utilisateur réalistes
    scenarios = [
        {
            "user_type": "Utilisateur Motivé",
            "message": "Salut ! Je suis super motivé, on fonce pour booster mon CV !",
            "expected_sentiment": "motivé",
            "expected_energy": "high"
        },
        {
            "user_type": "Utilisateur Anxieux", 
            "message": "Je suis un peu perdu, je ne sais pas par où commencer avec mon CV...",
            "expected_sentiment": "anxieux",
            "expected_energy": "low"
        },
        {
            "user_type": "Utilisateur Factuel",
            "message": "Peux-tu m'expliquer concrètement comment optimiser les mots-clés ATS ?",
            "expected_sentiment": "factuel", 
            "expected_energy": "medium"
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"📝 SCÉNARIO {i}: {scenario['user_type']}")
        print(f"💬 Message: \"{scenario['message']}\"")
        print("-" * 60)
        
        # 🌀 BOUCLE COMPORTEMENTALE
        sentiment = await sentiment_analyzer.analyze_user_message(
            message=scenario["message"],
            user_id=f"demo_user_{i}"
        )
        
        print(f"🌀 BOUCLE COMPORTEMENTALE:")
        print(f"   😊 Sentiment: {sentiment.primary_sentiment}")
        print(f"   💡 État émotionnel: {sentiment.emotional_state}")
        print(f"   ⚡ Énergie: {sentiment.energy_level}")
        print(f"   🎭 Style: {sentiment.communication_style}")
        
        # 📈 BOUCLE PROGRESSION (Mock données)
        mock_progress = UserProgressProfile(
            user_id=f"demo_user_{i}",
            metrics={
                ProgressMetricType.ATS_SCORE: ProgressMetric(
                    metric_type=ProgressMetricType.ATS_SCORE,
                    current_value=75.0 + i*10,
                    previous_value=60.0 + i*5,
                    delta_7d=15.0,
                    trend=ProgressTrend.RISING
                )
            },
            overall_trend=ProgressTrend.RISING,
            momentum_score=70.0 + i*10,
            last_victory={
                "metric_type": "ats_score",
                "improvement": 15.0,
                "level": "major"
            }
        )
        
        print(f"📈 BOUCLE PROGRESSION:")
        print(f"   📊 Tendance: {mock_progress.overall_trend.value}")
        print(f"   ⚡ Momentum: {mock_progress.momentum_score:.0f}/100")
        
        # Test célébration
        if celebration_engine.should_trigger_celebration(mock_progress):
            celebration = celebration_engine.generate_celebration(
                metric_type=ProgressMetricType.ATS_SCORE,
                improvement=15.0,
                trend=ProgressTrend.RISING,
                user_sentiment=sentiment.primary_sentiment
            )
            print(f"   🎉 Célébration: {celebration.level.value} - {celebration.title}")
        
        # 🎯 BOUCLE NARRATIVE (Mock données)
        mock_narrative = CareerNarrative(
            user_id=f"demo_user_{i}",
            career_phase=CareerPhase.GROWTH,
            current_chapter="Tu développes ton expertise et gagnes en confiance",
            transformation_theme="L'ascension vers l'expertise",
            vision_statement="Devenir un expert reconnu"
        )
        
        mock_vision = UserVisionProfile(
            user_id=f"demo_user_{i}",
            career_narrative=mock_narrative,
            active_goals=[
                VisionGoal(
                    goal_id=f"goal_{i}",
                    category=VisionCategory.CAREER_GOAL,
                    title="Décrocher un poste senior",
                    target_timeline="12 mois",
                    status="executing",
                    progress_percentage=40.0 + i*10
                )
            ],
            vision_momentum=75.0,
            story_coherence_score=85.0
        )
        
        primary_goal = mock_vision.get_primary_goal()
        print(f"🎯 BOUCLE NARRATIVE:")
        print(f"   🎭 Phase: {mock_narrative.career_phase.value}")
        print(f"   🌟 Objectif: {primary_goal.title if primary_goal else 'None'}")
        print(f"   📖 Thème: {mock_narrative.transformation_theme}")
        
        # Connexion narrative
        story_connection = mock_vision.get_story_connection("optimisation CV")
        print(f"   🔗 Connexion: {story_connection[:50]}...")
        
        print("✅ Triple boucle analysée avec succès !")
        print()
    
    # Comparaison AVANT / APRÈS
    print("🚀 COMPARAISON TRANSFORMATION LUNA")
    print("=" * 60)
    
    comparisons = [
        {
            "aspect": "Coûts énergétiques",
            "avant": "❌ -5⚡ pour 'Salut !' (toxic)",
            "après": "✅ Conversations gratuites, coûts intelligents"
        },
        {
            "aspect": "Empathie",
            "avant": "❌ Réponses génériques identiques",  
            "après": "✅ Adaptation sentiment temps réel (motivé/anxieux)"
        },
        {
            "aspect": "Progression",
            "avant": "❌ Aucune reconnaissance des efforts",
            "après": "✅ Célébrations victoires + encouragements data-driven"
        },
        {
            "aspect": "Vision long terme", 
            "avant": "❌ Actions isolées sans contexte",
            "après": "✅ Connexion chaque action → rêves professionnels"
        },
        {
            "aspect": "Intelligence",
            "avant": "❌ Scripts statiques répétitifs",
            "après": "✅ IA adaptative avec 3 boucles d'intelligence"
        }
    ]
    
    for comparison in comparisons:
        print(f"🎯 {comparison['aspect']}:")
        print(f"   {comparison['avant']}")
        print(f"   {comparison['après']}")
        print()
    
    # Fonctionnalités Luna finales
    print("🌙 FONCTIONNALITÉS LUNA FINALES")
    print("=" * 50)
    
    features = [
        "🌀 Boucle Comportementale - Adaptation ton selon sentiment utilisateur",
        "📈 Boucle Progression - Célébrations victoires & encouragements intelligents", 
        "🎯 Boucle Narrative - Connexion actions vers vision long terme",
        "💬 Conversation Memory - Plus de répétitions, dialogue naturel",
        "⚡ Énergie Intelligente - Coûts justes, conversations gratuites",
        "🎉 Célébrations Auto - Reconnaissance progrès avec bonus énergie",
        "📖 Storytelling - Narrative personnalisée selon phase carrière",
        "🤗 Empathie Contextuelle - Réponses selon état psychologique"
    ]
    
    for feature in features:
        print(f"✅ {feature}")
    
    print("\n🏆 MISSION ACCOMPLIE !")
    print("🌙 Luna n'est plus un chatbot, c'est un copilote IA empathique !")
    print("🚀 Digne d'être le #1 différenciateur Phoenix !")


if __name__ == "__main__":
    print("🚀 DÉMO FINALE - TRANSFORMATION LUNA RÉUSSIE")
    print("De chatbot frustrant à copilote IA empathique")
    print()
    
    asyncio.run(demo_luna_transformation())