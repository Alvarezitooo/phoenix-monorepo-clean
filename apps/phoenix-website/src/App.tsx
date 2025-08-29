import React, { useState, useEffect } from 'react';
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
  Lightbulb,
  ChevronDown,
  User,
  LogOut,
  Settings,
  BookOpen
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
import { LunaSessionZero } from './components/LunaSessionZero';
import LunaChat from './components/LunaChat';
import LunaChatButton from './components/LunaChatButton';
import { redirectToService, api } from './services/api';
import type { User } from './services/api';
import JournalPage from './components/journal/JournalPage';

function App() {
  const [lunaEnergy, setLunaEnergy] = useState(85);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasFirstPurchaseBonus, setHasFirstPurchaseBonus] = useState(true);
  const [showLunaModal, setShowLunaModal] = useState(false);
  const [showSessionZero, setShowSessionZero] = useState(false);
  const [sessionZeroMode, setSessionZeroMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  
  // 🌙 Luna Chat states
  const [showLunaChat, setShowLunaChat] = useState(false);
  const [isLunaChatMinimized, setIsLunaChatMinimized] = useState(false);

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      if (api.isAuthenticated()) {
        try {
          const user = await api.getCurrentUser();
          setCurrentUser(user);
          setLunaEnergy(user.luna_energy || 85);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token invalide, on le supprime
          api.logout();
        }
      }
      setIsLoadingAuth(false);
    };

    checkAuth();
  }, []);

  // Fonctions pour ouvrir le modal Luna avec modes spécifiques
  const handleStartWithLuna = () => {
    if (currentUser) {
      setLunaEnergy(prev => Math.min(100, prev + 15));
      // Petite pause pour l'animation puis redirection
      setTimeout(() => redirectToService('letters'), 500);
    } else {
      openLunaModal('welcome');
    }
  };

  const openLunaModal = (mode: 'welcome' | 'login' | 'register') => {
    setSessionZeroMode(mode);
    setShowSessionZero(true);
  };

  const handleLogin = () => openLunaModal('login');
  const handleRegister = () => openLunaModal('register');

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setLunaEnergy(85);
    setShowProfileMenu(false);
  };

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    setLunaEnergy(user.luna_energy || 100);
    setShowSessionZero(false);
    // Rester sur le website après authentification - pas de redirection auto
  };

  // Si le journal est ouvert, afficher seulement le journal
  if (showJournal && currentUser) {
    return (
      <JournalPage 
        userId={currentUser.id} 
        onClose={() => setShowJournal(false)} 
      />
    );
  }

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
            <div className="flex items-center space-x-4">
              {isLoadingAuth ? (
                // Loading state
                <div className="animate-pulse flex space-x-4">
                  <div className="h-8 w-20 bg-slate-200 rounded"></div>
                  <div className="h-8 w-24 bg-slate-200 rounded"></div>
                </div>
              ) : currentUser ? (
                // Utilisateur connecté : Menu Profil + Énergie
                <>
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="text-sm text-slate-600 hover:text-slate-800 flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>{currentUser.email}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-slate-200">
                          <p className="text-xs text-slate-500">Profil</p>
                          <p className="text-sm font-medium text-slate-700">{currentUser.email}</p>
                          {currentUser.is_unlimited && (
                            <p className="text-xs text-emerald-600 font-semibold">Luna Unlimited ✨</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setShowJournal(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>📖 Mon Journal Narratif</span>
                        </button>
                        <button
                          onClick={() => {
                            redirectToService('cv');
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Mon Tableau de Bord</span>
                        </button>
                        <button
                          onClick={() => {
                            redirectToService('letters');
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Phoenix Letters</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Se Déconnecter</span>
                        </button>
                        </div>
                      </>
                    )}
                  </div>
                  <LunaEnergyGauge energy={lunaEnergy} hasFirstPurchaseBonus={hasFirstPurchaseBonus} />
                </>
              ) : (
                // Visiteur : Portes d'entrée traditionnelles + Énergie 
                <>
                  <button
                    onClick={handleLogin} // Modal Luna pour Login
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all duration-200"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={handleRegister} // Modal Luna pour Inscription
                    className="text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-4 py-2 rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Inscription</span>
                  </button>
                  <LunaEnergyGauge energy={lunaEnergy} hasFirstPurchaseBonus={hasFirstPurchaseBonus} />
                </>
              )
              }
            </div>
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
              icon={<Lightbulb className="h-5 w-5" />}
              onClick={() => {
                // Scroll vers la section énergie Luna
                document.getElementById('energie-luna')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              💡 Comment ça marche ?
            </PhoenixButton>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span>🔥 Pionniers de la reconversion intelligente</span>
            </div>
            <div className="flex items-center space-x-2">
              <Moon className="h-4 w-4 text-indigo-500" />
              <span>IA bienveillante et transparente</span>
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
                🌟 Luna connecte chaque app pour enrichir votre histoire de réussite. Chaque action dans Letters enrichit votre profil CV, et plus vous utilisez l'écosystème, plus Luna devient votre parfait partenaire.
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
              stats="Prêt pour vos premières lettres Luna"
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
              stats="Analyses CV disponibles avec Luna"
              lunaFeature="Luna intègre vos réussites de Letters pour renforcer votre profil"
              energyCost={25}
              serviceKey="cv"
            />
            <AppCard
              icon={<Sunrise className="h-8 w-8" />}
              title="Phoenix Rise"
              subtitle="avec Luna"
              description="Votre prochaine aventure entrepreneuriale commence ici"
              status="coming-soon"
              stats="Bientôt disponible"
              lunaFeature="Luna vous accompagne dans votre lancement"
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
      <section id="energie-luna" className="py-16 px-4">
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
              currentUser={currentUser}
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
              currentUser={currentUser}
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

      {/* Mission & Vision Honnête */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          
          {/* Message honnête de lancement */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              🚀 <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Rejoignez nos premiers pionniers
              </span>
            </h2>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200 max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-700">Notre engagement transparence</h3>
              </div>
              <p className="text-orange-700 text-lg leading-relaxed mb-4">
                Phoenix avec Luna est en plein lancement ! Nous construisons ensemble l'avenir de la reconversion professionnelle. 
                Pas de fausses statistiques, pas de promesses creuses - juste une IA bienveillante qui grandit avec vous.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-orange-600">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 fill-current" />
                  <span>Innovation authentique</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Résultats mesurables</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Communauté bienveillante</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vision Luna */}
          <div className="text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto border border-indigo-100">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Moon className="h-8 w-8 text-indigo-500" />
                <h3 className="text-2xl font-bold text-slate-800">La vision Luna</h3>
              </div>
              <blockquote className="text-xl md:text-2xl italic text-slate-700 mb-6 leading-relaxed">
                "Chaque personne mérite une IA qui la comprend vraiment. Pas une machine froide, mais un partenaire bienveillant qui investit dans sa réussite."
              </blockquote>
              <cite className="text-indigo-600 font-semibold">
                - L'équipe Phoenix, créateurs de Luna
              </cite>
            </div>
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
      <LunaPresence onClick={() => openLunaModal('welcome')} />
      <LunaModal isOpen={showLunaModal} onClose={() => setShowLunaModal(false)} />
      
      {/* Luna Session Zero */}
      <LunaSessionZero 
        isOpen={showSessionZero} 
        onClose={() => setShowSessionZero(false)}
        onAuthenticated={handleAuthenticated}
        initialMode={sessionZeroMode}
      />
      
      {/* 🌙 Luna Chat System */}
      <LunaChatButton 
        onClick={() => {
          if (!currentUser) {
            // Si pas connecté, ouvrir la connexion
            setSessionZeroMode('welcome');
            setShowSessionZero(true);
          } else {
            // Si connecté, ouvrir le chat
            setShowLunaChat(true);
            setIsLunaChatMinimized(false);
          }
        }}
        isAuthenticated={!!currentUser}
        hasUnreadMessages={false}
      />
      
      <LunaChat
        isOpen={showLunaChat}
        onClose={() => setShowLunaChat(false)}
        onMinimize={() => setIsLunaChatMinimized(!isLunaChatMinimized)}
        isMinimized={isLunaChatMinimized}
        userId={currentUser?.id}
        userName={currentUser?.name || currentUser?.email?.split('@')[0]}
      />
    </div>
  );
}

export default App;