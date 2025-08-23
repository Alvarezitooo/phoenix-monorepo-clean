import React, { useState } from 'react';
import { 
  Flame, 
  Zap, 
  Rocket, 
  FileText, 
  BarChart3, 
  Sunrise, 
  TrendingUp,
  Star,
  Check,
  ArrowRight,
  Users,
  Target,
  Award,
  Play,
  ChevronRight,
  Moon,
  Coffee,
  Croissant,
  Pizza,
  Crown,
  Heart,
  Sparkles,
  Brain,
  Lightbulb
} from 'lucide-react';
import LunaEnergyGauge from './components/LunaEnergyGauge';
import PhoenixButton from './components/PhoenixButton';
import AppCard from './components/AppCard';
import PricingCard from './components/PricingCard';
import AnimatedGradient from './components/AnimatedGradient';
import LunaAvatar from './components/LunaAvatar';
import EnergyConsumptionGuide from './components/EnergyConsumptionGuide';
import ActionConfirmation from './components/ActionConfirmation';
import { LunaPresence } from './components/LunaPresence';
import { LunaModal } from './components/LunaModalV2';
import { redirectToService } from './services/api';

function App() {
  const [lunaEnergy, setLunaEnergy] = useState(85);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasFirstPurchaseBonus, setHasFirstPurchaseBonus] = useState(true);
  const [showLunaModal, setShowLunaModal] = useState(false);

  // Fonction pour démarrer avec Luna (redirige vers Letters en premier)
  const handleStartWithLuna = () => {
    setLunaEnergy(prev => Math.min(100, prev + 15));
    // Petite pause pour l'animation puis redirection
    setTimeout(() => redirectToService('letters'), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50 text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-orange-400 animate-ping opacity-75">
                  <Flame className="h-8 w-8" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Phoenix
                </span>
                <div className="flex items-center space-x-1 text-sm">
                  <span className="text-slate-400">avec</span>
                  <Moon className="h-4 w-4 text-indigo-500" />
                  <span className="font-semibold text-indigo-600">Luna</span>
                </div>
              </div>
            </div>
            <LunaEnergyGauge energy={lunaEnergy} hasFirstPurchaseBonus={hasFirstPurchaseBonus} />
          </div>
        </div>
      </nav>

      {/* Hero Section Luna */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-orange-50 via-white to-indigo-50 relative">
        <AnimatedGradient />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <LunaAvatar size="large" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Rencontrez Luna,
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent relative">
                votre guide IA
                <div className="absolute -top-2 -right-2 text-indigo-500 animate-bounce">
                  <Sparkles className="h-8 w-8" />
                </div>
              </span>
              <br />
              pour la reconversion
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto mb-6">
              La première IA qui vous connaît personnellement et transforme chaque action en capital pour votre réussite
            </p>
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-4 max-w-3xl mx-auto mb-8 border border-orange-200">
              <p className="text-lg font-semibold text-orange-700">
                🚀 Fini les abonnements ! Investissez dans votre transformation quand vous en avez besoin, comme vous le voulez.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <PhoenixButton 
              variant="primary" 
              size="large"
              icon={<Coffee className="h-5 w-5" />}
              onClick={handleStartWithLuna}
            >
              ☕ Commencer avec Luna (Session découverte offerte)
            </PhoenixButton>
            <PhoenixButton 
              variant="secondary" 
              size="large"
              icon={<Sparkles className="h-5 w-5" />}
            >
              🌟 Découvrir le modèle révolutionnaire
            </PhoenixButton>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span>🔥 Pionniers de la reconversion intelligente</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-amber-400 fill-current" />
              <span>4.9/5 satisfaction Luna</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution avec Luna */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">
                Le marché du travail a changé...
                <br />
                <span className="text-red-500">Pas vos outils</span>
              </h2>
              <div className="space-y-4">
                {[
                  "Lettres génériques qui ne passent plus",
                  "CV obsolète face aux ATS",
                  "Peur de la reconversion",
                  "Stress des entretiens"
                ].map((problem, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-slate-600">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <span>{problem}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Moon className="h-8 w-8 text-indigo-500" />
                <h2 className="text-3xl font-bold text-slate-800">
                  Phoenix avec Luna :
                  <br />
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Votre partenaire IA bienveillant</span>
                </h2>
              </div>
              <div className="space-y-4">
                {[
                  "Lettres personnalisées avec Luna IA",
                  "CV optimisé 2024 avec Luna",
                  "Guide reconversion intelligent Luna",
                  "Coach entretien bienveillant Luna"
                ].map((solution, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-slate-600">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>{solution}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                <div className="flex items-center space-x-2 text-indigo-700 mb-2">
                  <Moon className="h-5 w-5" />
                  <span className="font-semibold">Luna vous explique :</span>
                </div>
                <p className="text-sm text-indigo-600 italic">
                  "Je ne suis pas un abonnement. Je suis votre investissement. Chaque session ensemble enrichit votre Capital Narratif et vous rapproche de votre objectif."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Écosystème Luna */}
      <section className="py-16 px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-indigo-600">1 Luna.</span>{' '}
              <span className="text-slate-700">4 Apps.</span>{' '}
              <span className="bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                Votre Capital Narratif.
              </span>
            </h2>
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 max-w-4xl mx-auto mb-8 border border-indigo-200">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Moon className="h-6 w-6 text-indigo-500" />
                <span className="font-semibold text-indigo-700">Luna traverse tout votre parcours</span>
              </div>
              <p className="text-indigo-600">
                🌟 Luna connecte chaque app pour enrichir votre histoire de réussite. Chaque action dans Letters enrichit votre profil CV, votre évolution Aube influence vos stratégies, et plus vous utilisez l'écosystème, plus Luna devient votre parfait partenaire.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AppCard
              icon={<FileText className="h-8 w-8" />}
              title="Phoenix Letters"
              subtitle="avec Luna"
              description="Luna génère des lettres personnalisées basées sur votre Capital Narratif"
              status="available"
              url="letters.phoenix.ai"
              stats="12 lettres générées avec Luna"
              lunaFeature="Luna connaît votre parcours et adapte chaque lettre à votre évolution"
              energyCost={15}
              serviceKey="letters"
            />
            <AppCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Phoenix CV"
              subtitle="avec Luna"
              description="Luna optimise votre CV en analysant votre progression globale"
              status="available"
              url="cv.phoenix.ai"
              stats="3 analyses approfondies Luna"
              lunaFeature="Luna intègre vos réussites de Letters pour renforcer votre profil"
              energyCost={25}
              serviceKey="cv"
            />
            <AppCard
              icon={<Sunrise className="h-8 w-8" />}
              title="Phoenix Aube"
              subtitle="avec Luna"
              description="Luna vous guide dans votre reconversion avec ses 3 boucles d'analyse"
              status="coming-soon"
              stats="Luna arrive bientôt"
              lunaFeature="Luna projette votre évolution vers votre nouveau métier"
            />
            <AppCard
              icon={<Rocket className="h-8 w-8" />}
              title="Phoenix Rise"
              subtitle="avec Luna"
              description="Luna vous coach pour les entretiens en s'appuyant sur votre Capital complet"
              status="coming-soon"
              stats="Luna arrive bientôt"
              lunaFeature="Luna simule des entretiens basés sur votre vraie personnalité"
            />
          </div>
        </div>
      </section>

      {/* Modèle Énergie Luna Révolutionnaire */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Investissez dans votre transformation,
              <br />
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                pas dans un abonnement
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              🌙 Avec Luna, chaque euro devient du capital pour votre réussite
            </p>
            
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 max-w-4xl mx-auto mb-8 border border-indigo-200">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Moon className="h-6 w-6 text-indigo-500" />
                <span className="font-semibold text-indigo-700">Luna explique la révolution :</span>
              </div>
              <p className="text-indigo-600 italic text-lg">
                "Je ne suis pas un abonnement. Je suis votre investissement. Chaque session ensemble enrichit votre Capital Narratif et vous rapproche de votre objectif."
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <PricingCard
              type="founders"
              badge="🚀 PIONNIERS LUNA - 50 premiers"
              title="Accès Complet Pionniers"
              price="9€/mois"
              features={[
                "Énergie Luna illimitée",
                "Accès Phoenix Letters + CV",
                "Prix à vie garanti",
                "Badge Pionnier Luna",
                "Capital Narratif premium"
              ]}
              cta="Commencez votre légende (42 places restantes)"
              highlight={true}
            />
            <PricingCard
              type="energie"
              title="🌙 Énergie Luna"
              subtitle="La révolution du micro-investissement conscient"
              energyOptions={[
                { 
                  type: 'cafe', 
                  icon: Coffee, 
                  name: 'Café Luna', 
                  price: 2.99, 
                  energy: '100% d\'énergie Luna', 
                  description: 'Un moment productif ensemble',
                  actions: [
                    '20 conseils rapides (5% chacun)',
                    '6-7 lettres complètes (15% chacune)',
                    '4 analyses CV (25% chacune)'
                  ]
                },
                { 
                  type: 'croissant', 
                  icon: Croissant, 
                  name: 'Petit-déj Luna', 
                  price: 5.99, 
                  energy: '100% d\'énergie Luna', 
                  description: 'Commençons la journée du bon pied', 
                  popular: true,
                  actions: [
                    'Pack plus économique',
                    'Analyses approfondies CV + LinkedIn',
                    'Stratégies personnalisées complètes'
                  ]
                },
                { 
                  type: 'pizza', 
                  icon: Pizza, 
                  name: 'Repas Luna', 
                  price: 9.99, 
                  energy: '100% d\'énergie Luna', 
                  description: 'Une transformation en profondeur',
                  bestDeal: true,
                  actions: [
                    'Pack le plus avantageux',
                    'Sessions Mirror Match complètes',
                    'Suivi évolution et projections'
                  ]
                },
                { 
                  type: 'unlimited', 
                  icon: Moon, 
                  name: 'Luna Unlimited', 
                  price: 29.99, 
                  energy: 'Énergie illimitée', 
                  description: 'Pour les transformations intensives', 
                  subscription: true,
                  actions: [
                    'Accès complet à Luna',
                    'Priorité nouvelles fonctionnalités',
                    'Support premium personnalisé'
                  ]
                }
              ]}
              valueMessage="💫 Votre investissement = Votre capital de réussite"
            />
          </div>

          {/* Grille de consommation énergie */}
          <div className="max-w-4xl mx-auto mb-12">
            <EnergyConsumptionGuide />
          </div>

          <div className="text-center mt-12 p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20">
            <div className="flex items-center justify-center space-x-2 text-orange-600 mb-2">
              <Brain className="h-5 w-5" />
              <span className="font-semibold">La différence psychologique</span>
            </div>
            <p className="text-slate-600">
              🧠 Nos utilisateurs investissent <span className="font-bold text-orange-500">6-12€/mois</span> en moyenne et voient chaque euro comme 
              <span className="font-bold text-emerald-500"> un pas vers leur réussite</span>, pas comme une charge.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { icon: FileText, value: "12,847", label: "lettres générées avec Luna" },
              { icon: BarChart3, value: "3,291", label: "CV optimisés par Luna" },
              { icon: Target, value: "89%", label: "taux de réponse" },
              { icon: Star, value: "4.9/5", label: "satisfaction Luna" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-slate-600 text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <blockquote className="text-xl md:text-2xl italic text-slate-700 mb-6">
              "Luna m'a accompagnée personnellement. Chaque session était un investissement dans ma réussite !"
            </blockquote>
            <cite className="text-orange-600 font-semibold">
              - Sarah, Dev reconvertie avec Luna
            </cite>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <LunaAvatar size="medium" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt pour votre
            <br />
            <span className="bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 bg-clip-text text-transparent">
              Renaissance avec Luna ?
            </span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Rejoignez la révolution Phoenix et transformez votre carrière avec Luna, votre partenaire IA bienveillant
          </p>
          <PhoenixButton 
            variant="primary" 
            size="large"
            icon={<Coffee className="h-5 w-5" />}
            onClick={handleStartWithLuna}
          >
            ☕ Commencer avec Luna (Session découverte offerte)
          </PhoenixButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white border-t border-orange-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Phoenix
              </span>
              <span className="text-slate-400">avec</span>
              <Moon className="h-5 w-5 text-indigo-500" />
              <span className="font-semibold text-indigo-600">Luna</span>
            </div>
            <div className="text-slate-600 text-sm">
              © 2024 Phoenix avec Luna. La renaissance professionnelle bienveillante.
            </div>
          </div>
        </div>
      </footer>
      
      {/* Action Confirmation Modal */}
      <ActionConfirmation
        actionName="analyse Mirror Match"
        energyCost={30}
        currentEnergy={lunaEnergy}
        onConfirm={() => {
          setLunaEnergy(prev => Math.max(0, prev - 30));
          setShowConfirmation(false);
        }}
        onCancel={() => setShowConfirmation(false)}
        isOpen={showConfirmation}
      />

      {/* Luna Presence + Modal */}
      <LunaPresence onClick={() => setShowLunaModal(true)} />
      <LunaModal isOpen={showLunaModal} onClose={() => setShowLunaModal(false)} />
    </div>
  );
}

export default App;