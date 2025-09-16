import React, { useState, lazy, Suspense, useCallback, useEffect } from 'react';
import { PhoenixNavigation } from "../../shared";
import { useLuna } from "../../luna";
import { 
  Sunrise, 
  Moon, 
  Target, 
  Brain, 
  Route, 
  Loader2,
  Search,
  TrendingUp,
  Zap,
  ArrowRight,
  BarChart3,
  Network,
  GraduationCap,
  Sparkles,
  Crown,
  CheckCircle,
  Filter,
  Star,
  Award
} from 'lucide-react';
// Removed: LunaAubeSpecialistSidebar - now using global LunaConversationalSidebar

// Lazy loading des composants consolidés
const CareerDiscoveryTab = lazy(() => import('./components/CareerDiscoveryTab'));
const SkillsAnalysisTab = lazy(() => import('./components/SkillsAnalysisTab')); 
const MarketIntelligenceTab = lazy(() => import('./components/MarketIntelligenceTab'));
const NetworkingLearningTab = lazy(() => import('./components/NetworkingLearningTab'));

type AubeTab = 'discovery' | 'analysis' | 'market' | 'networking-learning';

interface TabConfig {
  id: AubeTab;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  energyCost: number;
  color: string;
  gradient: string;
  badge?: string;
  features: string[];
  difficulty: 'facile' | 'intermédiaire' | 'avancé';
  category: 'basic' | 'premium' | 'expert';
}

const AUBE_TABS: TabConfig[] = [
  {
    id: 'discovery',
    name: 'Découverte & Personnalité',
    description: 'Identifiez vos métiers compatibles avec analyse psychométrique Big Five intégrée',
    icon: Search,
    energyCost: 25,
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600',
    badge: 'CORE',
    features: ['Profil psychométrique', 'Métiers compatibles', 'Matching personnalité-métier'],
    difficulty: 'facile',
    category: 'basic'
  },
  {
    id: 'analysis',
    name: 'Analyse & Prédictions',
    description: 'Analysez vos compétences transférables avec prédictions IA de succès',
    icon: Target,
    energyCost: 35,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    badge: 'IA',
    features: ['Compétences transférables', 'Prédictions succès IA', 'Évaluation potentiel'],
    difficulty: 'intermédiaire',
    category: 'premium'
  },
  {
    id: 'market',
    name: 'Market Intelligence',
    description: 'Tendances sectorielles et opportunités émergentes du marché du travail',
    icon: TrendingUp,
    energyCost: 20,
    color: 'orange',
    gradient: 'from-orange-500 to-red-600',
    badge: 'ALPHA',
    features: ['Analyses sectorielles', 'Opportunités émergentes', 'Salaires et tendances'],
    difficulty: 'intermédiaire',
    category: 'expert'
  },
  {
    id: 'networking-learning',
    name: 'Networking & Formation',
    description: 'Stratégie réseau professionnel avec parcours d\'apprentissage personnalisés',
    icon: Network,
    energyCost: 30,
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-600',
    badge: 'ALPHA',
    features: ['Stratégie networking', 'Parcours formations', 'Développement compétences'],
    difficulty: 'avancé',
    category: 'expert'
  }
];

const TabLoadingFallback = ({ tabName }: { tabName?: string }) => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
      <p className="text-gray-600 font-medium">Luna charge {tabName || 'le module Aube'}...</p>
      <p className="text-sm text-gray-500 mt-1">Découverte de votre potentiel carrière ✨</p>
    </div>
  </div>
);

export default function AubePageOptimized() {
  const luna = useLuna();
  const [activeTab, setActiveTab] = useState<AubeTab>('discovery');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'basic' | 'premium' | 'expert'>('all');

  useEffect(() => {
    // Prefetch des autres tabs pour performance optimale
    const prefetchTabs = AUBE_TABS.filter(tab => tab.id !== activeTab);
    prefetchTabs.forEach(tab => {
      switch (tab.id) {
        case 'discovery':
          import('./components/CareerDiscoveryTab');
          break;
        case 'analysis':
          import('./components/SkillsAnalysisTab');
          break;
        case 'market':
          import('./components/MarketIntelligenceTab');
          break;
        case 'networking-learning':
          import('./components/NetworkingLearningTab');
          break;
      }
    });
  }, [activeTab]);

  const filteredTabs = selectedCategory === 'all' 
    ? AUBE_TABS 
    : AUBE_TABS.filter(tab => tab.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'facile': 'emerald',
      'intermédiaire': 'yellow', 
      'avancé': 'red'
    };
    return colors[difficulty as keyof typeof colors] || 'gray';
  };

  const getDifficultyIcon = (difficulty: string) => {
    const icons = {
      'facile': '🟢',
      'intermédiaire': '🟡',
      'avancé': '🔴'
    };
    return icons[difficulty as keyof typeof icons] || '⚪';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'discovery':
        return <CareerDiscoveryTab />;
      case 'analysis':
        return <SkillsAnalysisTab />;
      case 'market':
        return <MarketIntelligenceTab />;
      case 'networking-learning':
        return <NetworkingLearningTab />;
      default:
        return <CareerDiscoveryTab />;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50">
      <PhoenixNavigation />
      
      <div className="pt-24 pb-16 px-4">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full">
                <Sunrise className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Phoenix <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">Aube</span>
              <span className="ml-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm px-3 py-1 rounded-full animate-bounce">MAGISTRAL</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto mb-8">
              🌅 **Suite complète** de découverte carrière : analyse psychométrique, prédictions IA, market intelligence et roadmaps personnalisées
            </p>
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl p-6 max-w-4xl mx-auto mb-8 border border-purple-200">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Moon className="h-6 w-6 text-purple-500 animate-pulse" />
                <span className="font-bold text-purple-700 text-lg">Luna Aube - Suite Professionnelle Complète</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-purple-600">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Analyse psychométrique</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Prédictions IA avancées</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Market intelligence</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
              {['all', 'basic', 'premium', 'expert'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category as any)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category === 'all' ? '🎯 Tous' :
                   category === 'basic' ? '⚡ Basique' :
                   category === 'premium' ? '👑 Premium' : '🚀 Expert'}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Tabs Grid */}
          <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-6 mb-12">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const difficultyColor = getDifficultyColor(tab.difficulty);
              
              return (
                <div
                  key={tab.id}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 ${
                    isActive 
                      ? 'border-purple-500 shadow-xl shadow-purple-200' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {/* Header avec gradient */}
                  <div className={`bg-gradient-to-r ${tab.gradient} text-white p-6 relative overflow-hidden`}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-white" style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                        backgroundSize: '20px 20px'
                      }} />
                    </div>
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg leading-tight">{tab.name}</h3>
                            {tab.badge && (
                              <span className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs font-bold mt-1 backdrop-blur-sm">
                                {tab.badge}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {tab.energyCost === 0 ? 'GRATUIT' : `${tab.energyCost}⚡`}
                          </div>
                          <div className="text-xs opacity-75">énergie</div>
                        </div>
                      </div>
                      
                      <p className="text-sm opacity-90 leading-relaxed mb-4">
                        {tab.description}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 bg-white">
                    {/* Features */}
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-800 mb-3 text-sm">✨ Fonctionnalités:</h5>
                      <div className="space-y-2">
                        {tab.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className={`w-1.5 h-1.5 rounded-full bg-${tab.color}-500`} />
                            <span className="text-xs text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty & Category */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getDifficultyIcon(tab.difficulty)}</span>
                        <span className={`text-xs font-medium text-${difficultyColor}-700`}>
                          {tab.difficulty}
                        </span>
                      </div>
                      <span className={`px-2 py-1 bg-${tab.color}-100 text-${tab.color}-700 rounded-full text-xs font-medium`}>
                        {tab.category === 'basic' ? 'Basique' :
                         tab.category === 'premium' ? 'Premium' : 'Expert'}
                      </span>
                    </div>

                    {/* Action Button */}
                    <button className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                      isActive
                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                        : `border-2 border-${tab.color}-200 text-${tab.color}-600 hover:bg-${tab.color}-50 hover:shadow-md`
                    }`}>
                      {isActive ? (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Module actif</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Découvrir</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-4 right-4">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Performance Stats */}
          <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-2xl p-8 mb-12 text-white">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">📊 Statistiques de Performance Carrière</h3>
              <p className="opacity-80">Impact mesurable de nos outils sur votre évolution professionnelle</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <Search className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-400">2,847</div>
                <div className="text-gray-300 text-sm">Découvertes Réalisées</div>
              </div>
              <div className="text-center">
                <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-400">94.2%</div>
                <div className="text-gray-300 text-sm">Précision Matching</div>
              </div>
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-400">73%</div>
                <div className="text-gray-300 text-sm">Transitions Réussies</div>
              </div>
              <div className="text-center">
                <Crown className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-400">4.9/5</div>
                <div className="text-gray-300 text-sm">Satisfaction Globale</div>
              </div>
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="relative mb-12">
            {/* Floating Tab Indicator */}
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
              <div className={`px-6 py-3 bg-gradient-to-r ${AUBE_TABS.find(t => t.id === activeTab)?.gradient || 'from-purple-500 to-indigo-600'} text-white rounded-full shadow-lg flex items-center space-x-2`}>
                <span className="text-lg">
                  {AUBE_TABS.find(t => t.id === activeTab)?.icon && 
                    React.createElement(AUBE_TABS.find(t => t.id === activeTab)!.icon, { className: 'w-5 h-5' })}
                </span>
                <span className="font-semibold">
                  {AUBE_TABS.find(t => t.id === activeTab)?.name}
                </span>
              </div>
            </div>
            
            <Suspense fallback={<TabLoadingFallback tabName={AUBE_TABS.find(t => t.id === activeTab)?.name} />}>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {renderTabContent()}
              </div>
            </Suspense>
          </div>

          {/* Call to Action Final */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-white">
              <Crown className="h-12 w-12 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold mb-4">Votre nouvelle carrière vous attend !</h3>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Avec Phoenix Aube, transformez votre potentiel en réalité professionnelle. 
                Nos outils IA avancés vous guident vers le métier qui vous correspond vraiment.
              </p>
              <div className="flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-300" />
                  <span>Analyse psychométrique</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-300" />
                  <span>Prédictions IA précises</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-300" />
                  <span>Roadmaps personnalisées</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Luna Omnisciente via App.tsx - plus besoin de sidebar spécialisée */}
    </div>
  );
}

