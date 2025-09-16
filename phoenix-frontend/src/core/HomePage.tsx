import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLuna } from '../luna';
import { PhoenixNavigation } from '../shared';
import { AnimatedGradient } from '../shared/components/AnimatedGradient';
import ActionConfirmation from '../shared/ActionConfirmation';
import {
  Sparkles,
  Moon
} from 'lucide-react';

export default function HomePage() {
  const luna = useLuna();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);


  const handleCTAClick = () => {
    if (luna.authenticatedUser) {
      // Si connecté, aller directement sur Aube
      navigate('/aube');
    } else {
      // Si pas connecté, aller sur auth en mode register
      navigate('/auth');
    }
  };

  const handleEnergyPackClick = (packId: string) => {
    if (luna.authenticatedUser) {
      // Si connecté, aller sur la page energy avec le pack sélectionné
      navigate(`/energy?pack=${packId}`);
    } else {
      // Si pas connecté, aller sur auth d'abord
      navigate('/auth');
    }
  };

  const lunaModules = [
    {
      name: 'Aube',
      description: 'Explore tes métiers futurs et identifie tes compétences transférables',
      icon: '🌅',
      color: 'purple' as const,
      path: '/aube',
      energyCost: 15
    },
    {
      name: 'CV',
      description: 'Crée ton histoire narrative et cohérente avec un CV qui te ressemble',
      icon: '📄',
      color: 'cyan' as const,
      path: '/cv',
      energyCost: 20
    },
    {
      name: 'Letters',
      description: 'Rédige des lettres de motivation adaptées et personnalisées',
      icon: '✍️',
      color: 'orange' as const,
      path: '/letters',
      energyCost: 25
    },
    {
      name: 'Rise',
      description: 'Maîtrise tes entretiens avec simulation et coaching narratif',
      icon: '🎯',
      color: 'green' as const,
      path: '/rise',
      energyCost: 30,
      badge: 'NOUVEAU'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50 text-slate-900 overflow-x-hidden">
      <PhoenixNavigation />
      
      {/* Hero Section Luna Copilot */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative">
        <AnimatedGradient />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Avatar placeholder - removed for now */}
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto">
              <Moon className="h-12 w-12 text-indigo-400" />
            </div>
          </div>

          {/* Hero Message Révolutionnaire */}
          <div className="mb-12">
            {luna.authenticatedUser ? (
              <div key="authenticated">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  Salut {luna.authenticatedUser.profile?.name || luna.authenticatedUser.email?.split('@')[0]} ! 👋
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Luna</span> se souvient de ton parcours
                </p>
                <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
                  Ton coach IA qui apprend de chaque interaction et construit ton histoire professionnelle
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 text-lg">
                  <span>Énergie disponible:</span>
                  <span className="font-bold text-indigo-600 text-2xl">{luna.lunaEnergy || 100}⚡</span>
                  <span className="text-slate-500">• Consomme seulement ce que tu utilises</span>
                </div>
              </div>
            ) : (
              <div key="unauthenticated">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  🌙 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PHOENIX LUNA</span>
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
                  Ton Coach IA qui se SOUVIENT de ton parcours
                </p>
                <p className="text-lg text-slate-600 mb-6 max-w-3xl mx-auto">
                  Pas juste des outils. Une IA qui te connaît et évolue avec toi pour transformer ta carrière
                </p>
                
                {/* CTA Principal */}
                <div className="mb-8">
                  <button 
                    onClick={handleCTAClick}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl text-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    🌅 Découvrir mes métiers GRATUITEMENT
                  </button>
                  <p className="text-sm text-slate-500 mt-2">Aucune carte bancaire • Luna commence à apprendre</p>
                </div>

                {/* Différenciateur clé */}
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto border border-indigo-100">
                  <p className="text-lg font-semibold text-slate-700 mb-3">
                    💡 La seule IA carrière qui garde ta progression en mémoire
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                      <p className="text-red-600 font-medium">❌ Les autres tools:</p>
                      <p className="text-sm text-slate-600">• Oublient tout entre les sessions</p>
                      <p className="text-sm text-slate-600">• Abonnements 15€/mois même pour 1 CV</p>
                      <p className="text-sm text-slate-600">• Outils isolés sans cohérence</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-green-600 font-medium">✅ Phoenix Luna:</p>
                      <p className="text-sm text-slate-600">• Se souvient de tes objectifs et préférences</p>
                      <p className="text-sm text-slate-600">• Système énergie: paies seulement ce que tu utilises</p>
                      <p className="text-sm text-slate-600">• Coach personnel qui évolue avec toi</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Parcours Narratif Visuel */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl p-8 mb-12 border border-indigo-200 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-indigo-800 mb-4">TON PARCOURS AVEC LUNA</h2>
              <p className="text-lg text-indigo-700 max-w-2xl mx-auto">
                Chaque module nourrit la mémoire de Luna. Elle apprend, se souvient et s'améliore avec toi.
              </p>
            </div>
            
            {/* Timeline Interactive */}
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {/* Étape 1 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-purple-300">
                    <span className="text-2xl">🌅</span>
                  </div>
                  <h3 className="font-bold text-purple-800 mb-2">ÉTAPE 1: Découverte</h3>
                  <p className="text-sm text-slate-600">Luna Aube trouve tes métiers compatibles</p>
                </div>
                
                {/* Étape 2 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-cyan-300">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="font-bold text-cyan-800 mb-2">ÉTAPE 2: Profil</h3>
                  <p className="text-sm text-slate-600">Luna CV utilise tes découvertes pour optimiser</p>
                </div>
                
                {/* Étape 3 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-orange-300">
                    <span className="text-2xl">✍️</span>
                  </div>
                  <h3 className="font-bold text-orange-800 mb-2">ÉTAPE 3: Candidatures</h3>
                  <p className="text-sm text-slate-600">Luna Letters connaît tes préférences</p>
                </div>
                
                {/* Étape 4 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-green-300">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-bold text-green-800 mb-2">ÉTAPE 4: Entretiens</h3>
                  <p className="text-sm text-slate-600">Luna Rise adapte le coaching à ton profil</p>
                </div>
              </div>
              
              {/* Flèche progression */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-2 bg-white/80 rounded-full px-6 py-3 border border-indigo-200">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <span className="font-semibold text-indigo-800">LUNA SE SOUVIENT DE TOUT</span>
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                </div>
              </div>
              
              {/* Message mémoire */}
              <div className="bg-white/80 rounded-2xl p-6 border border-indigo-200">
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-800 mb-3">
                    📚 Elle connaît tes préférences, tes forces, ton évolution
                  </p>
                  <p className="text-slate-600 max-w-3xl mx-auto">
                    "Luna se souvient que je voulais éviter les startups et préfère les entreprises +200 personnes. 
                    3 mois après, elle continue de me conseiller en gardant ces préférences en tête."
                  </p>
                  <p className="text-sm text-slate-500 mt-3 italic">- Sarah, Product Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>




      {/* PRICING ÉTHIQUE ÉNERGIE - LA RÉVOLUTION */}
      <section className="py-20 px-4 bg-gradient-to-r from-slate-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          
          {/* Header révolutionnaire */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-3 bg-red-100 text-red-800 px-6 py-2 rounded-full mb-6">
              <span className="font-bold">🚫 FINI LES ABONNEMENTS PIÈGES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              LA RÉVOLUTION <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PRICING</span> CARRIÈRE
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Première plateforme IA carrière 100% pay-per-use. Tu consommes → Tu paies → Point final.
            </p>
            
            {/* Comparaison Brutale */}
            <div className="bg-white rounded-2xl p-8 max-w-4xl mx-auto shadow-xl border border-indigo-200">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-left">
                  <h3 className="text-xl font-bold text-red-600 mb-4">❌ Les autres (Resume.io, Canva Pro)</h3>
                  <ul className="space-y-3 text-slate-600">
                    <li>• <strong>15€/mois</strong> même si tu fais rien</li>
                    <li>• Abonnement se renouvelle automatiquement</li>
                    <li>• Cancel complexe, frais cachés</li>
                    <li>• Tu paies pour des features que tu n'utilises pas</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-green-600 mb-4">✅ Phoenix Luna (Pay-per-use)</h3>
                  <ul className="space-y-3 text-slate-600">
                    <li>• <strong>0€ si tu utilises pas</strong></li>
                    <li>• Ton énergie n'expire JAMAIS</li>
                    <li>• Acheté en janvier, utilisé en juin = OK !</li>
                    <li>• Tu sais EXACTEMENT combien coûte chaque action</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Calculateur exemple */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-slate-800 mb-4">💡 CALCULE TON BESOIN ÉNERGIE</h3>
              <p className="text-xl text-slate-600">Exemple concret de recherche d'emploi</p>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-8 max-w-4xl mx-auto">
              <div className="grid md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">🌅</div>
                  <p className="font-semibold">Découverte métiers</p>
                  <p className="text-green-600 font-bold">GRATUIT</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📄</div>
                  <p className="font-semibold">1 CV optimisé</p>
                  <p className="text-cyan-600 font-bold">25⚡</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">✍️</div>
                  <p className="font-semibold">3 lettres perso</p>
                  <p className="text-orange-600 font-bold">45⚡</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="font-semibold">2 coachings</p>
                  <p className="text-green-600 font-bold">80⚡</p>
                </div>
              </div>
              
              <div className="text-center bg-white rounded-xl p-6 border-2 border-indigo-300">
                <p className="text-lg mb-2">TOTAL BESOIN: <strong className="text-2xl text-indigo-600">150⚡</strong></p>
                <p className="text-xl font-bold text-indigo-800">💡 Recommandation: Petit-déj Luna (220⚡) = 5,99€</p>
                <p className="text-indigo-600 mt-2">Il te restera 70⚡ pour plus tard ! (vs 15€/mois Resume.io)</p>
              </div>
            </div>
          </div>

          {/* Packs énergie révolutionnaires */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-slate-800 mb-4">RECHARGE TON ÉNERGIE QUAND TU VEUX</h3>
              <p className="text-xl text-slate-600">Aucune date d'expiration • Aucun engagement</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {/* Café Luna */}
              <button 
                onClick={() => handleEnergyPackClick('cafe_luna')}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-amber-200 hover:border-amber-400 transition-all duration-300 hover:scale-105 transform cursor-pointer">
                <div className="text-center">
                  <div className="text-4xl mb-3">☕</div>
                  <h4 className="text-xl font-bold text-amber-800 mb-2">Café Luna</h4>
                  <p className="text-3xl font-bold text-amber-600 mb-2">2,99€</p>
                  <p className="text-lg font-semibold text-slate-700 mb-4">100⚡</p>
                  <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full mb-3">
                    +10⚡ bonus 1er achat
                  </div>
                  <ul className="text-sm text-slate-600 text-left space-y-1">
                    <li>✅ Parfait pour débuter</li>
                    <li>✅ Énergie n'expire jamais</li>
                    <li>✅ Pas d'engagement</li>
                  </ul>
                </div>
              </button>

              {/* Petit-déj Luna - POPULAIRE */}
              <button 
                onClick={() => handleEnergyPackClick('petit_dej_luna')}
                className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-400 relative transform scale-105 hover:scale-110 transition-all duration-300 cursor-pointer">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                    POPULAIRE
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-3">🥐</div>
                  <h4 className="text-xl font-bold text-blue-800 mb-2">Petit-déj Luna</h4>
                  <p className="text-3xl font-bold text-blue-600 mb-2">5,99€</p>
                  <p className="text-lg font-semibold text-slate-700 mb-4">220⚡</p>
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-3">
                    Meilleur rapport qualité-prix
                  </div>
                  <ul className="text-sm text-slate-600 text-left space-y-1">
                    <li>✅ Plus de 2x l'énergie</li>
                    <li>✅ Idéal recherche complète</li>
                    <li>✅ -60% vs Resume.io</li>
                  </ul>
                </div>
              </button>

              {/* Repas Luna */}
              <button 
                onClick={() => handleEnergyPackClick('repas_luna')}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:scale-105 transform cursor-pointer">
                <div className="text-center">
                  <div className="text-4xl mb-3">🍕</div>
                  <h4 className="text-xl font-bold text-purple-800 mb-2">Repas Luna</h4>
                  <p className="text-3xl font-bold text-purple-600 mb-2">9,99€</p>
                  <p className="text-lg font-semibold text-slate-700 mb-4">400⚡</p>
                  <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mb-3">
                    Maximum énergie
                  </div>
                  <ul className="text-sm text-slate-600 text-left space-y-1">
                    <li>✅ 4x plus d'énergie</li>
                    <li>✅ Reconversion complète</li>
                    <li>✅ -66% vs abonnements</li>
                  </ul>
                </div>
              </button>

              {/* Luna Unlimited - PRO */}
              <button 
                onClick={() => handleEnergyPackClick('unlimited_luna')}
                className="bg-gradient-to-b from-indigo-600 to-purple-700 text-white rounded-2xl p-6 shadow-xl hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 transform cursor-pointer">
                <div className="text-center">
                  <div className="text-4xl mb-3">👑</div>
                  <h4 className="text-xl font-bold mb-2">Luna Unlimited</h4>
                  <p className="text-3xl font-bold text-yellow-300 mb-2">29,99€/mois</p>
                  <p className="text-lg font-semibold mb-4">⚡ ILLIMITÉ</p>
                  <div className="bg-yellow-300 text-purple-800 text-xs px-2 py-1 rounded-full mb-3">
                    Professionnels RH
                  </div>
                  <ul className="text-sm text-left space-y-1">
                    <li>✅ Consultants carrière</li>
                    <li>✅ Coachs professionnels</li>
                    <li>✅ Services RH</li>
                  </ul>
                </div>
              </button>
            </div>
          </div>

          {/* Témoignage éthique */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-8 max-w-4xl mx-auto border border-green-200">
              <h4 className="text-2xl font-bold text-green-800 mb-4">💚 "Enfin une plateforme honnête !"</h4>
              <p className="text-lg text-green-700 mb-4 italic">
                "Je préfère payer 3€ pour mon CV que 15€/mois d'abonnement. Luna se souvient de mes préférences, 
                et je ne paie que quand j'en ai besoin. C'est ça l'éthique !"
              </p>
              <p className="text-green-600 font-semibold">- Sarah, reconversion réussie vers Product Manager</p>
              
              <div className="grid md:grid-cols-3 gap-6 mt-6 text-sm text-green-700">
                <div>
                  <strong>🎯 Transparence totale:</strong><br/>
                  Prix fixe par action, aucune surprise
                </div>
                <div>
                  <strong>⚡ Flexibilité max:</strong><br/>
                  Ton énergie reste à vie, utilise quand tu veux
                </div>
                <div>
                  <strong>🚫 Anti-gaspillage:</strong><br/>
                  Pas de "tout illimité" pour faire du chiffre
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Confirmation Modal */}
      <ActionConfirmation
        actionName="commencer avec Luna"
        energyCost={10}
        currentEnergy={luna.lunaEnergy}
        onConfirm={() => {
          luna.updateEnergy(Math.max(0, luna.lunaEnergy - 10));
          setShowConfirmation(false);
        }}
        onCancel={() => setShowConfirmation(false)}
        isOpen={showConfirmation}
      />
    </div>
  );
}