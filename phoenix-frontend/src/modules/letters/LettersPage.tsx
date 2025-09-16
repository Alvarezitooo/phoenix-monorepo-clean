import React, { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { PhoenixNavigation } from "../../shared";
import { useLuna } from "../../luna";
import { 
  FileText, 
  PenTool, 
  Route, 
  Moon, 
  Loader2,
  Search,
  Sparkles,
  MessageSquare,
  Library,
  Crown,
  Rocket,
  Users,
  Building,
  Palette,
  Zap,
  Star,
  TrendingUp
} from 'lucide-react';
// Luna Letters Specialist Sidebar supprimée - Luna est maintenant globale via App.tsx

const LetterGenerationTab = lazy(() => import('./components/LetterGenerationTab'));
const CareerTransitionTab = lazy(() => import('./components/CareerTransitionTab'));
const CompanyResearchTab = lazy(() => import('./components/CompanyResearchTab'));
const AdvancedLetterTypesTab = lazy(() => import('./components/AdvancedLetterTypesTab'));
const InteractiveFlowTab = lazy(() => import('./components/InteractiveFlowTab'));
const TemplatesLibraryTab = lazy(() => import('./components/TemplatesLibraryTab'));

type LettersTab = 'generation' | 'transition' | 'research' | 'advanced' | 'interactive' | 'templates';

interface TabConfig {
  id: LettersTab;
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

const LETTERS_TABS: TabConfig[] = [
  {
    id: 'interactive',
    name: 'Chat Luna Letters',
    description: 'Conversation guidée avec Luna pour une lettre parfaite',
    icon: MessageSquare,
    energyCost: 0,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    badge: 'NOUVEAU',
    features: ['8 étapes guidées', 'Recherche entreprise', 'Génération temps réel'],
    difficulty: 'facile',
    category: 'premium'
  },
  {
    id: 'advanced',
    name: 'Types Avancés',
    description: '6 types de lettres sophistiquées selon votre profil',
    icon: Crown,
    energyCost: 15,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'PREMIUM',
    features: ['6 types spécialisés', 'Coûts variables', 'Taux de succès élevés'],
    difficulty: 'intermédiaire',
    category: 'premium'
  },
  {
    id: 'research',
    name: 'Company Research',
    description: 'Intelligence d\'entreprise pour personnaliser votre approche',
    icon: Search,
    energyCost: 10,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'SMART',
    features: ['Analyse complète', 'Actualités récentes', 'Recommandations ton'],
    difficulty: 'intermédiaire',
    category: 'expert'
  },
  {
    id: 'templates',
    name: 'Bibliothèque Templates',
    description: 'Collection premium d\'accroches et templates professionnels',
    icon: Library,
    energyCost: 0,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    badge: 'GRATUIT',
    features: ['50+ phrases d\'accroche', 'Templates sectoriels', 'Copie rapide'],
    difficulty: 'facile',
    category: 'basic'
  },
  {
    id: 'generation',
    name: 'Générateur Simple',
    description: 'Version classique pour générer rapidement une lettre',
    icon: PenTool,
    energyCost: 15,
    color: 'orange',
    gradient: 'from-orange-500 to-red-600',
    features: ['Génération rapide', 'Formulaire simple', 'Résultats instantanés'],
    difficulty: 'facile',
    category: 'basic'
  },
  {
    id: 'transition',
    name: 'Analyse Transition',
    description: 'Spécialisé reconversion et évolution professionnelle',
    icon: Route,
    energyCost: 25,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    features: ['Analyse transition', 'Roadmap détaillée', 'Compétences transférables'],
    difficulty: 'avancé',
    category: 'expert'
  }
];

const TabLoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
      <p className="text-gray-600">Chargement du module Letters...</p>
    </div>
  </div>
);

export default function LettersPage() {
  const luna = useLuna();
  const [activeTab, setActiveTab] = useState<LettersTab>('interactive');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'basic' | 'premium' | 'expert'>('all');

  useEffect(() => {
    const prefetchTabs = LETTERS_TABS.filter(tab => tab.id !== activeTab);
    prefetchTabs.forEach(tab => {
      switch (tab.id) {
        case 'generation':
          import('./components/LetterGenerationTab');
          break;
        case 'transition':
          import('./components/CareerTransitionTab');
          break;
        case 'research':
          import('./components/CompanyResearchTab');
          break;
        case 'advanced':
          import('./components/AdvancedLetterTypesTab');
          break;
        case 'interactive':
          import('./components/InteractiveFlowTab');
          break;
        case 'templates':
          import('./components/TemplatesLibraryTab');
          break;
      }
    });
  }, [activeTab]);

  const filteredTabs = selectedCategory === 'all' 
    ? LETTERS_TABS 
    : LETTERS_TABS.filter(tab => tab.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'facile': 'green',
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
      case 'generation':
        return <LetterGenerationTab />;
      case 'transition':
        return <CareerTransitionTab />;
      case 'research':
        return <CompanyResearchTab />;
      case 'advanced':
        return <AdvancedLetterTypesTab />;
      case 'interactive':
        return <InteractiveFlowTab />;
      case 'templates':
        return <TemplatesLibraryTab />;
      default:
        return <InteractiveFlowTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      <PhoenixNavigation />
      
      <div className="pt-24 pb-16 px-4">
        <div className="w-full">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse">
                <FileText className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Phoenix <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Letters</span>
              <span className="ml-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm px-3 py-1 rounded-full animate-bounce">MAGISTRAL</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto mb-8">
              ✨ **Suite complète** de création de lettres : recherche d'entreprise, conversation IA, templates sectoriels et génération avancée
            </p>
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 max-w-4xl mx-auto mb-8 border border-indigo-200">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Moon className="h-6 w-6 text-indigo-500 animate-pulse" />
                <span className="font-bold text-indigo-700 text-lg">Luna Letters - Suite Professionnelle</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-indigo-600">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Recherche entreprise IA</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Conversation guidée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>6 types spécialisés</span>
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
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
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
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:shadow-2xl ${
                    isActive 
                      ? 'border-indigo-500 shadow-xl shadow-indigo-200' 
                      : 'border-gray-200 hover:border-gray-300'
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

          {/* Dynamic Tab Content */}
          <div className="relative">
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
              <div className={`px-6 py-3 bg-gradient-to-r ${LETTERS_TABS.find(t => t.id === activeTab)?.gradient || 'from-indigo-500 to-purple-600'} text-white rounded-full shadow-lg flex items-center space-x-2`}>
                <span className="text-lg">
                  {LETTERS_TABS.find(t => t.id === activeTab)?.icon && 
                    React.createElement(LETTERS_TABS.find(t => t.id === activeTab)!.icon, { className: 'w-5 h-5' })}
                </span>
                <span className="font-semibold">
                  {LETTERS_TABS.find(t => t.id === activeTab)?.name}
                </span>
              </div>
            </div>
            
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${LETTERS_TABS.find(t => t.id === activeTab)?.gradient || 'from-indigo-500 to-purple-600'} rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse`}>
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                  <p className="text-gray-600 font-medium">Luna charge le module {LETTERS_TABS.find(t => t.id === activeTab)?.name}...</p>
                  <p className="text-sm text-gray-500 mt-1">Préparation de l'excellence ✨</p>
                </div>
              </div>
            }>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {renderTabContent()}
              </div>
            </Suspense>
          </div>
        </div>
      </div>

      {/* Luna est maintenant globale via le bouton flottant dans App.tsx */}
    </div>
  );
}