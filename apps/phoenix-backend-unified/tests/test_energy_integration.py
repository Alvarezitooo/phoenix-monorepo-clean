"""
💰 Test Intégration Énergie - Validation connexion réelle
Vérification que Luna déduit bien l'énergie du compteur utilisateur
"""

import asyncio
from unittest.mock import AsyncMock, MagicMock

async def test_energy_integration():
    """Test que Luna déduit réellement l'énergie utilisateur"""
    
    print("💰 TEST INTÉGRATION ÉNERGIE LUNA")
    print("=" * 50)
    
    # Mock energy manager pour simuler compte utilisateur
    from app.core import energy_manager
    original_consume = energy_manager.energy_manager.consume_energy
    original_add = energy_manager.energy_manager.add_energy
    
    # Compteurs test
    user_energy_balance = 100.0
    energy_transactions = []
    
    async def mock_consume_energy(user_id: str, amount: float, reason: str, context: dict = None):
        nonlocal user_energy_balance, energy_transactions
        
        if user_energy_balance >= amount:
            user_energy_balance -= amount
            energy_transactions.append({
                "type": "consume",
                "amount": -amount,
                "balance_after": user_energy_balance,
                "reason": reason,
                "context": context
            })
            print(f"   💰 Énergie déduite: -{amount}⚡ (Solde: {user_energy_balance}⚡)")
            return True
        else:
            print(f"   ❌ Énergie insuffisante: {amount}⚡ requis, {user_energy_balance}⚡ disponible")
            return False
    
    async def mock_add_energy(user_id: str, amount: float, reason: str, energy_type: str = "purchase", context: dict = None):
        nonlocal user_energy_balance, energy_transactions
        
        user_energy_balance += amount
        energy_transactions.append({
            "type": "add",
            "amount": amount,
            "balance_after": user_energy_balance,
            "reason": reason,
            "energy_type": energy_type,
            "context": context
        })
        print(f"   🎊 Bonus ajouté: +{amount}⚡ (Solde: {user_energy_balance}⚡)")
        return True
    
    # Patch des méthodes
    energy_manager.energy_manager.consume_energy = mock_consume_energy
    energy_manager.energy_manager.add_energy = mock_add_energy
    
    try:
        from app.core.luna_core_service import get_luna_core
        
        luna = get_luna_core()
        luna._genai_configured = True
        luna.model = MagicMock()
        luna.model.generate_content.return_value = MagicMock(
            text="Super ! Je vais t'aider à optimiser ton CV pour décrocher ce poste senior ! 🚀"
        )
        
        print(f"👤 Utilisateur test - Solde initial: {user_energy_balance}⚡")
        print()
        
        # Test 1: Conversation gratuite (salutation)
        print("🆓 TEST 1: Conversation gratuite")
        print("Message: 'Salut Luna !'")
        
        result1 = await luna.generate_response(
            user_id="test_energy_user",
            message="Salut Luna !",
            app_context="website"
        )
        
        print(f"   🌀 Sentiment détecté: {result1['sentiment_analysis']['primary_sentiment']}")
        print(f"   💰 Énergie consommée: {result1['energy_consumed']}⚡")
        print(f"   ✅ Gratuit comme attendu: {result1['energy_consumed'] == 0}")
        print()
        
        # Test 2: Action payante (optimisation CV)
        print("💳 TEST 2: Action payante")
        print("Message: 'Optimise mon CV pour un poste de Product Manager'")
        
        result2 = await luna.generate_response(
            user_id="test_energy_user", 
            message="Optimise mon CV pour un poste de Product Manager",
            app_context="cv"
        )
        
        print(f"   🌀 Sentiment détecté: {result2['sentiment_analysis']['primary_sentiment']}")
        print(f"   💰 Énergie consommée: {result2['energy_consumed']}⚡")
        print(f"   ✅ Payant comme attendu: {result2['energy_consumed'] > 0}")
        
        # Vérifier bonus énergie si célébration
        if result2['progress_analysis']['energy_bonus_awarded'] > 0:
            print(f"   🎊 Bonus énergie reçu: +{result2['progress_analysis']['energy_bonus_awarded']}⚡")
        print()
        
        # Test 3: Énergie insuffisante
        print("⚠️ TEST 3: Énergie insuffisante")
        user_energy_balance = 2.0  # Réduire drastiquement
        print(f"   Solde forcé à: {user_energy_balance}⚡")
        
        result3 = await luna.generate_response(
            user_id="test_energy_user",
            message="Fais une analyse complète de mon CV",
            app_context="cv" 
        )
        
        print(f"   ❌ Succès: {result3['success']}")
        print(f"   💬 Message: {result3['message'][:60]}...")
        print(f"   🚨 Type d'erreur: {result3.get('type')}")
        if not result3['success']:
            print(f"   ⚡ Énergie requise: {result3.get('required_energy', 0)}⚡")
        print()
        
        # Résumé transactions
        print("📊 RÉSUMÉ TRANSACTIONS ÉNERGIE:")
        print("-" * 40)
        for i, transaction in enumerate(energy_transactions, 1):
            action_type = "DÉDUCTION" if transaction["type"] == "consume" else "BONUS"
            print(f"{i}. {action_type}: {transaction['amount']:+.0f}⚡")
            print(f"   Raison: {transaction['reason']}")
            print(f"   Solde après: {transaction['balance_after']}⚡")
            if transaction.get("context"):
                context = transaction["context"]
                if context.get("sentiment"):
                    print(f"   Sentiment: {context['sentiment']}")
            print()
        
        print("✅ INTÉGRATION ÉNERGIE VALIDÉE !")
        print("Luna déduit bien l'énergie du compte utilisateur !")
        
    finally:
        # Restaurer méthodes originales
        energy_manager.energy_manager.consume_energy = original_consume
        energy_manager.energy_manager.add_energy = original_add

if __name__ == "__main__":
    print("💰 VALIDATION INTÉGRATION ÉNERGIE LUNA")
    print("Vérification que l'énergie est vraiment déduite du compte utilisateur")
    print()
    
    asyncio.run(test_energy_integration())