import React, { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { PhoenixNavigation } from "../../shared";
import { useLuna } from "../../luna";
import { 
  FileText, 
  Target, 
  Sparkles, 
  Zap, 
  Loader2, 
  Moon,
  Palette,
  Shield,
  Building,
  Crown,
  TrendingUp,
  Award,
  Star,
  CheckCircle,
  Filter,
  Search
} from 'lucide-react';
// Luna CV Specialist Sidebar supprimée - Luna est maintenant globale via App.tsx

// Lazy loading des tabs avec les nouveaux modules
const CVOptimizationTab = lazy(() => import('./components/CVOptimizationTab'));
const MirrorMatchTab = lazy(() => import('./components/MirrorMatchTab'));
const CVBuilderTab = lazy(() => import('./components/CVBuilderTab'));
const TemplatesGalleryTab = lazy(() => import('./components/TemplatesGalleryTab'));
const ATSOptimizerTab = lazy(() => import('./components/ATSOptimizerTab'));
const SectorSpecialistTab = lazy(() => import('./components/SectorSpecialistTab'));

type CVTab = 'templates' | 'ats-optimizer' | 'sector-specialist' | 'mirror-match' | 'cv-builder' | 'optimization';

interface TabConfig {
  id: CVTab;
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

const CV_TABS: TabConfig[] = [
  {
    id: 'templates',
    name: 'Galerie Templates',
    description: 'Explorez 20 templates professionnels organisés par secteur',
    icon: Palette,
    energyCost: 0,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    badge: 'GRATUIT',
    features: ['20 templates premium', '5 catégories', 'Preview détaillé'],
    difficulty: 'facile',
    category: 'basic'
  },
  {
    id: 'ats-optimizer',
    name: 'ATS Performance',
    description: 'Analyseur avancé de compatibilité avec les systèmes ATS',
    icon: Shield,
    energyCost: 10,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    badge: 'AVANCÉ',
    features: ['Score ATS détaillé', 'Benchmarks secteur', 'Recommandations pro'],
    difficulty: 'intermédiaire',
    category: 'premium'
  },
  {
    id: 'sector-specialist',
    name: 'Spécialiste Secteur',
    description: 'Optimisation CV selon votre secteur d\'activité',
    icon: Building,
    energyCost: 8,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'EXPERT',
    features: ['Analyse sectorielle', 'Tendances marché', 'Stratégie personnalisée'],
    difficulty: 'avancé',
    category: 'expert'
  },
  {
    id: 'mirror-match',
    name: 'Mirror Match Pro',
    description: 'Analyse sophistiquée CV vs offre d\'emploi',
    icon: Target,
    energyCost: 25,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    badge: 'PREMIUM',
    features: ['Scoring précis', 'Mots-clés manquants', 'Suggestions ciblées'],
    difficulty: 'intermédiaire',
    category: 'premium'
  },
  {
    id: 'cv-builder',
    name: 'CV Builder Intelligent',
    description: 'Créateur CV guidé avec templates et IA',
    icon: Sparkles,
    energyCost: 20,
    color: 'orange',
    gradient: 'from-orange-500 to-red-600',
    badge: 'POPULAIRE',
    features: ['Création guidée', 'Templates intégrés', 'Export PDF'],
    difficulty: 'facile',
    category: 'premium'
  },
  {
    id: 'optimization',
    name: 'Optimisation Rapide',
    description: 'Amélioration express de votre CV existant',
    icon: Zap,
    energyCost: 15,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-600',
    features: ['Optimisation rapide', 'Suggestions IA', 'Amélioration score'],
    difficulty: 'facile',
    category: 'basic'
  }
];

const TabLoadingFallback = ({ tabName }: { tabName?: string }) => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
      <p className="text-gray-600 font-medium">Luna charge {tabName || 'le module CV'}...</p>
      <p className="text-sm text-gray-500 mt-1">Préparation de l'excellence CV ✨</p>
    </div>
  </div>
);

export default function CVPage() {
  const luna = useLuna();
  const [activeTab, setActiveTab] = useState<CVTab>('templates');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'basic' | 'premium' | 'expert'>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // 🎯 Navigation handler pour passer de Templates vers CV Builder
  const handleNavigateToBuilder = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setActiveTab('cv-builder');
  }, []);

  useEffect(() => {
    // Prefetch des autres tabs pour performance optimale
    const prefetchTabs = CV_TABS.filter(tab => tab.id !== activeTab);
    prefetchTabs.forEach(tab => {
      switch (tab.id) {
        case 'optimization':
          import('./components/CVOptimizationTab');
          break;
        case 'mirror-match':
          import('./components/MirrorMatchTab');
          break;
        case 'cv-builder':
          import('./components/CVBuilderTab');
          break;
        case 'templates':
          import('./components/TemplatesGalleryTab');
          break;
        case 'ats-optimizer':
          import('./components/ATSOptimizerTab');
          break;
        case 'sector-specialist':
          import('./components/SectorSpecialistTab');
          break;
      }
    });
  }, [activeTab]);

  const filteredTabs = selectedCategory === 'all' 
    ? CV_TABS 
    : CV_TABS.filter(tab => tab.category === selectedCategory);

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
      case 'optimization':
        return <CVOptimizationTab />;
      case 'mirror-match':
        return <MirrorMatchTab />;
      case 'cv-builder':
        return <CVBuilderTab selectedTemplateId={selectedTemplateId} />;
      case 'templates':
        return <TemplatesGalleryTab onNavigateToBuilder={handleNavigateToBuilder} />;
      case 'ats-optimizer':
        return <ATSOptimizerTab />;
      case 'sector-specialist':
        return <SectorSpecialistTab />;
      default:
        return <TemplatesGalleryTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-blue-50">
      <PhoenixNavigation />
      
      <div className="pt-24 pb-16 px-4">
        <div className="w-full">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse">
                <FileText className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Phoenix <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">CV</span>
              <span className="ml-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm px-3 py-1 rounded-full animate-bounce">MAGISTRAL</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto mb-8">
              📄 **Suite complète** de création et optimisation CV : 20 templates premium, analyse ATS, spécialisation sectorielle et IA avancée
            </p>
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 max-w-4xl mx-auto mb-8 border border-cyan-200">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Moon className="h-6 w-6 text-cyan-500 animate-pulse" />
                <span className="font-bold text-cyan-700 text-lg">Luna CV - Suite Professionnelle Complète</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-cyan-600">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>20 templates premium</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Analyse ATS avancée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>Spécialisation secteur</span>
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
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
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
                      ? 'border-cyan-500 shadow-xl shadow-cyan-200' 
                      : 'border-gray-200 hover:border-cyan-300'
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
              <h3 className="text-2xl font-bold mb-2">📊 Statistiques de Performance CV</h3>
              <p className="opacity-80">Impact mesurable de nos outils sur votre succès professionnel</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-2">+73%</div>
                <p className="text-sm opacity-80">Taux de réponse amélioré</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">+45%</div>
                <p className="text-sm opacity-80">Visibilité ATS augmentée</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">-60%</div>
                <p className="text-sm opacity-80">Temps de recherche réduit</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">94%</div>
                <p className="text-sm opacity-80">Satisfaction utilisateurs</p>
              </div>
            </div>
          </div>

          {/* Dynamic Tab Content */}
          <div className="relative">
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
              <div className={`px-6 py-3 bg-gradient-to-r ${CV_TABS.find(t => t.id === activeTab)?.gradient || 'from-cyan-500 to-blue-600'} text-white rounded-full shadow-lg flex items-center space-x-2`}>
                <span className="text-lg">
                  {CV_TABS.find(t => t.id === activeTab)?.icon && 
                    React.createElement(CV_TABS.find(t => t.id === activeTab)!.icon, { className: 'w-5 h-5' })}
                </span>
                <span className="font-semibold">
                  {CV_TABS.find(t => t.id === activeTab)?.name}
                </span>
              </div>
            </div>
            
            <Suspense fallback={<TabLoadingFallback tabName={CV_TABS.find(t => t.id === activeTab)?.name} />}>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {renderTabContent()}
              </div>
            </Suspense>
          </div>

          {/* Call to Action Final */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white">
              <Crown className="h-12 w-12 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold mb-4">Votre CV parfait vous attend !</h3>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Avec Phoenix CV, transformez votre recherche d'emploi en success story. 
                Nos outils IA avancés vous donnent l'avantage concurrentiel dont vous avez besoin.
              </p>
              <div className="flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-300" />
                  <span>20 templates premium</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-300" />
                  <span>Analyse ATS avancée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-300" />
                  <span>Expertise sectorielle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Luna est maintenant globale via le bouton flottant dans App.tsx */}
    </div>
  );
}