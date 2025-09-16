import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLuna } from './LunaContext';
import { 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  Star, 
  Award, 
  Target, 
  CheckCircle, 
  Circle,
  ArrowRight,
  Lightbulb,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  Zap,
  ArrowLeft,
  Home,
  Map,
  Clock,
  Brain,
  Rocket,
  Sparkles,
  Moon,
  Sun,
  Sunset,
  Sunrise,
  ChevronRight,
  GraduationCap,
  TrendingUp as Growth,
  BarChart3,
  PlayCircle,
  Menu,
  X,
  Eye,
  Heart,
  Flame,
  Compass,
  Trophy
} from 'lucide-react';
import LunaEnergyWidget from './LunaEnergyWidget';

type ViewType = 'dashboard' | 'roadmap' | 'timeline' | 'insights' | 'actions';

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  module: 'aube' | 'cv' | 'letters' | 'rise';
  status: 'completed' | 'current' | 'upcoming';
  progress: number;
  icon: React.ReactNode;
  insights: string[];
  nextActions: string[];
  estimatedTime: string;
  completedAt?: string;
  startedAt?: string;
}

interface Milestone {
  id: string;
  title: string;
  date: string;
  description: string;
  type: 'discovery' | 'achievement' | 'breakthrough' | 'goal';
  module: string;
  impact: 'low' | 'medium' | 'high';
}

interface UserInsight {
  id: string;
  title: string;
  content: string;
  confidence: number;
  source: string;
  date: string;
  category: 'personality' | 'skills' | 'career' | 'potential';
  actionable: boolean;
}

interface SkillGap {
  id: string;
  skill: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'critical' | 'important' | 'nice-to-have';
  estimatedTime: string;
  learningPath: string[];
  resources: {
    type: 'course' | 'certification' | 'practice' | 'mentoring';
    title: string;
    provider: string;
    duration: string;
    cost: string;
    url?: string;
  }[];
}

interface Formation {
  id: string;
  title: string;
  provider: string;
  type: 'certification' | 'diploma' | 'bootcamp' | 'course';
  duration: string;
  cost: string;
  startDate: string;
  relevanceScore: number;
  skills: string[];
  prerequisite: string[];
  outcomeJobs: string[];
  testimonials?: string[];
}

const LunaNarrativeJournal = memo(() => {
  const luna = useLuna();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('day');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animationDelay, setAnimationDelay] = useState(0);
  
  // Déterminer l'heure pour la thématique
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 18) setTimeOfDay('day');
    else if (hour >= 18 && hour < 22) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);

  // 🎯 Gestion automatique données Aube → Journal
  useEffect(() => {
    const aubeData = location.state;
    if (aubeData?.fromAube && aubeData?.selectedCareer) {
      // Adapter roadmap selon choix Aube
      console.log('🌅 Données Aube détectées:', aubeData.selectedCareer.title);
      
      // Auto-switch vers roadmap view si venant d'Aube
      if (aubeData.nextStep === 'roadmap_generation') {
        setCurrentView('roadmap');
      }
      
      // TODO: Adapter journeySteps selon selectedCareer
      // Example: Modifier le step CV selon les compétences du métier choisi
    }
  }, [location.state]);

  const getThemeClasses = useCallback(() => {
    const themes = {
      morning: {
        bg: 'from-amber-50 via-orange-50 to-rose-100',
        accent: 'from-amber-500 to-orange-600',
        text: 'text-amber-900',
        card: 'bg-white/80 backdrop-blur-sm border-amber-200/50'
      },
      day: {
        bg: 'from-blue-50 via-indigo-50 to-purple-100',
        accent: 'from-indigo-500 to-purple-600',
        text: 'text-indigo-900',
        card: 'bg-white/80 backdrop-blur-sm border-indigo-200/50'
      },
      evening: {
        bg: 'from-purple-50 via-pink-50 to-rose-100',
        accent: 'from-purple-500 to-pink-600',
        text: 'text-purple-900',
        card: 'bg-white/80 backdrop-blur-sm border-purple-200/50'
      },
      night: {
        bg: 'from-slate-900 via-purple-900 to-indigo-900',
        accent: 'from-purple-400 to-indigo-400',
        text: 'text-purple-100',
        card: 'bg-black/20 backdrop-blur-sm border-purple-500/20'
      }
    };
    return themes[timeOfDay];
  }, [timeOfDay]);

  const getThemeIcon = useCallback(() => {
    const icons = {
      morning: <Sunrise className="w-5 h-5 text-amber-500" />,
      day: <Sun className="w-5 h-5 text-indigo-500" />,
      evening: <Sunset className="w-5 h-5 text-purple-500" />,
      night: <Moon className="w-5 h-5 text-purple-400" />
    };
    return icons[timeOfDay];
  }, [timeOfDay]);

  const views = [
    {
      id: 'dashboard' as ViewType,
      name: 'Tableau de Bord',
      icon: Home,
      description: 'Vue d\'ensemble de votre parcours'
    },
    {
      id: 'roadmap' as ViewType,
      name: 'Roadmap Reconversion',
      icon: Map,
      description: 'Votre plan de transformation'
    },
    {
      id: 'timeline' as ViewType,
      name: 'Chronologie',
      icon: Clock,
      description: 'L\'histoire de vos progrès'
    },
    {
      id: 'insights' as ViewType,
      name: 'Insights Luna',
      icon: Brain,
      description: 'Découvertes sur votre profil'
    },
    {
      id: 'actions' as ViewType,
      name: 'Actions Prioritaires',
      icon: Rocket,
      description: 'Ce qui compte maintenant'
    }
  ];

  // Mock data enrichi - sera remplacé par API
  const [journeySteps] = useState<JourneyStep[]>([
    {
      id: '1',
      title: 'Découverte de tes métiers compatibles',
      description: 'Explore tes compétences et identifie les carrières qui te correspondent',
      module: 'aube',
      status: 'completed',
      progress: 100,
      icon: <Users className="w-5 h-5" />,
      insights: [
        'Tu as des compétences fortes en communication',
        'Ton profil correspond à 3 métiers émergents',
        'Reconversion possible en 8-12 mois'
      ],
      nextActions: [],
      estimatedTime: 'Terminé',
      completedAt: '2024-09-05',
      startedAt: '2024-09-03'
    },
    {
      id: '2', 
      title: 'Optimisation de ton CV',
      description: 'Rends ton CV irrésistible pour les ATS et recruteurs',
      module: 'cv',
      status: 'current',
      progress: 65,
      icon: <FileText className="w-5 h-5" />,
      insights: [
        'Score ATS actuel: 72/100',
        '5 compétences clés à mettre en valeur',
        'Format recommandé: Chronologique inversé'
      ],
      nextActions: [
        'Ajouter 3 mots-clés sectoriels',
        'Quantifier tes réalisations',
        'Optimiser la section expérience'
      ],
      estimatedTime: '2-3h restantes',
      startedAt: '2024-09-06'
    },
    {
      id: '3',
      title: 'Création de tes lettres percutantes', 
      description: 'Rédige des lettres de motivation qui marquent les recruteurs',
      module: 'letters',
      status: 'upcoming',
      progress: 0,
      icon: <MessageSquare className="w-5 h-5" />,
      insights: [],
      nextActions: [
        'Analyser 3 entreprises cibles',
        'Définir ton storytelling unique',
        'Créer 2 templates personnalisés'
      ],
      estimatedTime: '3-4h estimées'
    },
    {
      id: '4',
      title: 'Maîtrise des entretiens',
      description: 'Développe ta confiance et tes techniques pour des entretiens mémorables',
      module: 'rise', 
      status: 'upcoming',
      progress: 0,
      icon: <Briefcase className="w-5 h-5" />,
      insights: [],
      nextActions: [
        'Préparer ton pitch de 2 minutes',
        'Anticiper 10 questions courantes', 
        'Simuler 2 entretiens types'
      ],
      estimatedTime: '4-5h estimées'
    }
  ]);

  const [milestones] = useState<Milestone[]>([
    {
      id: '1',
      title: 'Première découverte Aube complétée',
      date: '2024-09-05',
      description: 'Tu as identifié tes 3 métiers cibles avec 85% de compatibilité',
      type: 'achievement',
      module: 'aube',
      impact: 'high'
    },
    {
      id: '2', 
      title: 'Breakthrough: Compétences transférables identifiées',
      date: '2024-09-06',
      description: 'Luna a détecté 7 compétences clés transférables vers tes métiers cibles',
      type: 'breakthrough',
      module: 'aube',
      impact: 'high'
    },
    {
      id: '3',
      title: 'Roadmap de reconversion personnalisée',
      date: '2024-09-07',
      description: 'Plan détaillé avec formations et compétences à acquérir sur 10 mois',
      type: 'discovery',
      module: 'aube',
      impact: 'high'
    }
  ]);

  const [insights] = useState<UserInsight[]>([
    {
      id: '1',
      title: 'Profil Leadership Naturel',
      content: 'Tes réponses révèlent des qualités de leadership naturel. 3 métiers identifiés exploitent cette force.',
      confidence: 92,
      source: 'Analyse Aube',
      date: '2024-09-05',
      category: 'personality',
      actionable: true
    },
    {
      id: '2',
      title: 'Secteur Tech Émergent Compatible',
      content: 'Ton profil correspond parfaitement aux métiers tech émergents (IA, Data, UX/UI).',
      confidence: 87,
      source: 'Algorithme Phoenix',
      date: '2024-09-06',
      category: 'career',
      actionable: true
    },
    {
      id: '3',
      title: 'Adaptabilité Exceptionnelle',
      content: 'Capacité rare à apprendre rapidement dans des contextes variés. Atout majeur pour la reconversion.',
      confidence: 94,
      source: 'Analyse comportementale Luna',
      date: '2024-09-07',
      category: 'skills',
      actionable: true
    }
  ]);



  const currentStep = journeySteps.find(step => step.status === 'current');
  const completedSteps = journeySteps.filter(step => step.status === 'completed').length;
  const totalProgress = (completedSteps / journeySteps.length) * 100;
  const theme = getThemeClasses();

  // 🌙 Luna GPS - Smart Context Handler
  const handleLunaGPS = useCallback(() => {
    const aubeData = location.state;
    
    // Contexte intelligent selon situation utilisateur
    const smartContext = {
      // Contexte actuel
      currentModule: 'journal',
      currentView: currentView,
      currentStep: currentStep?.module || 'unknown',
      progress: currentStep?.progress || 0,
      totalProgress: Math.round(totalProgress),
      
      // Données Aube si venant de découverte carrière
      fromAube: aubeData?.fromAube || false,
      selectedCareer: aubeData?.selectedCareer || null,
      allCareers: aubeData?.allCareers || null,
      
      // Actions suggérées selon contexte
      nextActions: currentStep?.nextActions || [],
      availableViews: views.map(v => v.name),
      
      // Insights utilisateur pour personnalisation
      userInsights: insights,
      userMilestones: milestones,
      
      // Recommandations contextuelles
      suggestions: currentStep ? [
        `Continuer ${currentStep.title}`,
        'Voir ma roadmap personnalisée',
        'Analyser mes insights Luna'
      ] : [
        'Explorer mes options de carrière',
        'Planifier ma transition',
        'Optimiser mon profil'
      ],
      
      // Timing et urgence
      timestamp: Date.now(),
      timeOfDay: timeOfDay,
      urgentActions: currentStep?.nextActions?.slice(0, 2) || []
    };

    // Luna GPS : Ouvrir la sidebar existante avec contexte intelligent
    luna.openSmartChat(smartContext);
  }, [currentView, currentStep, totalProgress, location.state, insights, milestones, views, timeOfDay, luna, navigate]);

  const renderDashboardView = () => (
    <div className="space-y-8">
      {/* Header héroïque avec animation */}
      <div className={`${theme.card} rounded-3xl p-8 shadow-xl relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} animate-pulse`} />
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`p-4 bg-gradient-to-br ${theme.accent} rounded-2xl shadow-lg`}>
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${theme.text}`}>
                  Journal Phoenix ✨
                </h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  {getThemeIcon()}
                  <span>Votre parcours de transformation personnelle</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${theme.text} animate-pulse`}>
                {Math.round(totalProgress)}%
              </div>
              <div className="text-sm text-gray-500">Progression totale</div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Avancement global</span>
              <span className={`font-bold ${theme.text}`}>{completedSteps} / {journeySteps.length} modules</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div 
                className={`bg-gradient-to-r ${theme.accent} h-4 rounded-full transition-all duration-1000 relative`}
                style={{ width: `${totalProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats rapides avec animations */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl border border-emerald-200">
              <Trophy className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-800">{milestones.length}</div>
              <div className="text-xs text-emerald-600">Moments clés</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
              <Brain className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">{insights.length}</div>
              <div className="text-xs text-blue-600">Insights Luna</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl border border-purple-200">
              <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-800">
                {luna.careerChoice?.chosenRoadmap?.phoenixActions?.length || 0}
              </div>
              <div className="text-xs text-purple-600">Actions recommandées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Énergie Luna */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
        <div className="lg:col-span-2">
          <LunaEnergyWidget isCompact={false} showActions={true} />
        </div>
        <div className="space-y-4">
          <div className={`${theme.card} rounded-xl p-4`}>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Historique énergétique</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Aujourd'hui</span>
                <span className="font-medium">-15⚡</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hier</span>
                <span className="font-medium">-8⚡</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cette semaine</span>
                <span className="font-medium">-42⚡</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus actuel avec magnifique design */}
      {currentStep && (
        <div className={`${theme.card} rounded-3xl p-8 shadow-xl border-2 border-gradient-to-r ${theme.accent}`}>
          <div className="flex items-start space-x-6">
            <div className={`p-4 bg-gradient-to-br ${theme.accent} rounded-2xl shadow-lg`}>
              {currentStep.icon}
              <div className="text-white mt-2">
                <div className="text-2xl font-bold">{currentStep.progress}%</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h2 className={`text-2xl font-bold ${theme.text}`}>🎯 Focus Actuel</h2>
                <div className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm rounded-full animate-pulse">
                  En cours
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">{currentStep.title}</h3>
              <p className="text-gray-600 mb-4">{currentStep.description}</p>
              
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`bg-gradient-to-r ${theme.accent} h-3 rounded-full transition-all duration-500 relative`}
                    style={{ width: `${currentStep.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                  </div>
                </div>
              </div>

              {currentStep.nextActions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 mb-2">🚀 Prochaines étapes</h4>
                  {currentStep.nextActions.slice(0, 2).map((action, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <Circle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 🌙 Luna Proactive Suggestions Section */}
          <div className={`${theme.card} rounded-3xl p-6 shadow-xl border-2 border-purple-200/50`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 bg-gradient-to-br ${theme.accent} rounded-xl shadow-lg`}>
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme.text}`}>🌙 Luna te suggère</h3>
                <p className="text-gray-600">Recommandations personnalisées selon ton profil</p>
              </div>
            </div>
            
            <div className="grid gap-3">
              {currentStep ? (
                <>
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 text-emerald-600" />
                      <div className="flex-1">
                        <div className="font-semibold text-emerald-800">Focus immédiat</div>
                        <div className="text-sm text-emerald-700">{currentStep.title} ({currentStep.progress}% terminé)</div>
                      </div>
                      <button 
                        onClick={handleLunaGPS}
                        className="px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Aide Luna
                      </button>
                    </div>
                  </div>
                  
                  {currentStep.nextActions.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <ArrowRight className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-semibold text-blue-800">Prochaine étape</div>
                          <div className="text-sm text-blue-700">{currentStep.nextActions[0]}</div>
                        </div>
                        <button 
                          onClick={() => setCurrentView('actions')}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Voir tout
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <Compass className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-purple-800">Commencer ton parcours</div>
                      <div className="text-sm text-purple-700">Luna peut t'aider à découvrir tes métiers compatibles</div>
                    </div>
                    <button 
                      onClick={() => navigate('/aube')}
                      className="px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Découvrir
                    </button>
                  </div>
                </div>
              )}
              
              {location.state?.fromAube && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-5 h-5 text-amber-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-amber-800">Roadmap personnalisée</div>
                      <div className="text-sm text-amber-700">
                        Basée sur ton choix : {location.state.selectedCareer?.title}
                      </div>
                    </div>
                    <button 
                      onClick={() => setCurrentView('roadmap')}
                      className="px-3 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Explorer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRoadmapView = () => {
    const careerChoice = luna.careerChoice;
    
    // If no roadmap chosen yet, show prompt to go to Aube
    if (!careerChoice?.chosenRoadmap) {
      return (
        <div className="space-y-8">
          <div className={`${theme.card} rounded-3xl p-8 shadow-xl text-center`}>
            <div className="mb-6">
              <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className={`text-3xl font-bold ${theme.text} mb-4`}>
                🗺️ Votre Roadmap de Reconversion
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Définissez votre parcours personnalisé avec l'assessment Aube
              </p>
            </div>
            <button
              onClick={() => navigate('/aube')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg"
            >
              🎯 Commencer l'Assessment Aube
            </button>
          </div>
        </div>
      );
    }

    const roadmap = careerChoice.chosenRoadmap;
    const selectedCareer = careerChoice.selectedCareer;
    
    return (
      <div className="space-y-8">
        {/* Roadmap Header */}
        <div className={`${theme.card} rounded-3xl p-8 shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-3xl font-bold ${theme.text} mb-2 flex items-center space-x-3`}>
                <Map className="w-8 h-8" />
                <span>{roadmap.title}</span>
              </h2>
              <p className="text-xl text-gray-600">
                Transition vers <strong>{selectedCareer.title}</strong>
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                {roadmap.duration}
              </div>
              <div className="text-sm text-gray-500">
                {roadmap.matchScore}% compatible avec votre profil
              </div>
            </div>
          </div>

          {/* Roadmap Insight */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">💡 Analyse Luna personnalisée</h3>
            <p className="text-purple-700">{roadmap.personalizedInsight}</p>
          </div>
        </div>

        {/* Roadmap Phases */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Rocket className="w-6 h-6 text-blue-500" />
            <span>Phases de votre roadmap</span>
          </h3>
          <div className="space-y-6">
            {roadmap.phases?.map((phase, index) => (
              <div 
                key={phase.id} 
                className={`p-6 rounded-2xl border-2 ${
                  index === 0 ? 'bg-blue-50 border-blue-200' :
                  index === 1 ? 'bg-orange-50 border-orange-200' :
                  'bg-green-50 border-green-200'
                } transition-all duration-300 hover:shadow-lg`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{phase.title}</h4>
                    <p className="text-sm text-gray-600">{phase.duration}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-blue-200 text-blue-800' :
                    index === 1 ? 'bg-orange-200 text-orange-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    Phase {index + 1}
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{phase.description}</p>

                {/* Actions clés */}
                <div className="mb-4">
                  <h5 className="font-medium text-sm mb-2">🎯 Actions clés :</h5>
                  <ul className="space-y-1">
                    {phase.keyActions?.map((action, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Milestones */}
                {phase.milestones && phase.milestones.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">🏆 Jalons de réussite :</h5>
                    {phase.milestones.slice(0, 2).map((milestone, idx) => (
                      <div key={idx} className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{milestone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions Phoenix recommandées */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-indigo-500" />
            <span>Actions Phoenix recommandées</span>
          </h3>
          <div className="grid gap-6">
            {roadmap.phoenixActions?.map((action, index) => (
              <div 
                key={action.id || index} 
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold">{action.title}</h4>
                    <p className="text-gray-600">{action.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>📅 {action.duration}</span>
                      <span>⚡ {action.energyCost} énergie</span>
                      <span>🎯 Priorité: {action.priority}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    action.type === 'cv' ? 'bg-blue-200 text-blue-800' :
                    action.type === 'lettre' ? 'bg-green-200 text-green-800' :
                    action.type === 'formation' ? 'bg-purple-200 text-purple-800' :
                    'bg-orange-200 text-orange-800'
                  }`}>
                    {action.type}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {action.benefits && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">🎯 Bénéfices attendus:</h5>
                      <div className="flex flex-wrap gap-1">
                        {action.benefits.map((benefit, idx) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {action.requirements && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">⚠️ Prérequis:</h5>
                      <div className="flex flex-wrap gap-1">
                        {action.requirements.map((req, idx) => (
                          <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {action.outcome && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                    <h5 className="font-medium text-sm mb-2">🏆 Résultat attendu:</h5>
                    <p className="text-sm text-gray-700">
                      {action.outcome}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTimelineView = () => (
    <div className="space-y-8">
      <div className={`${theme.card} rounded-3xl p-8 shadow-xl`}>
        <h2 className={`text-3xl font-bold ${theme.text} mb-8 flex items-center space-x-3`}>
          <Clock className="w-8 h-8" />
          <span>Chronologie de votre parcours</span>
        </h2>

        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div 
              key={milestone.id} 
              className="flex items-start space-x-6 pb-6 border-b border-gray-200 last:border-b-0"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                  milestone.type === 'achievement' ? 'bg-gradient-to-br from-green-400 to-emerald-600' :
                  milestone.type === 'breakthrough' ? 'bg-gradient-to-br from-purple-400 to-pink-600' :
                  milestone.type === 'discovery' ? 'bg-gradient-to-br from-blue-400 to-indigo-600' :
                  'bg-gradient-to-br from-amber-400 to-orange-600'
                }`}>
                  {milestone.type === 'achievement' && <Trophy className="w-6 h-6 text-white" />}
                  {milestone.type === 'breakthrough' && <Zap className="w-6 h-6 text-white" />}
                  {milestone.type === 'discovery' && <Eye className="w-6 h-6 text-white" />}
                  {milestone.type === 'goal' && <Target className="w-6 h-6 text-white" />}
                </div>
                {index < milestones.length - 1 && (
                  <div className="w-0.5 h-16 bg-gradient-to-b from-gray-300 to-gray-100 mt-4" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">{milestone.title}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    milestone.impact === 'high' ? 'bg-red-100 text-red-700' :
                    milestone.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {milestone.impact === 'high' ? '🔥 Impact fort' :
                     milestone.impact === 'medium' ? '⚡ Impact moyen' :
                     '✨ Impact léger'}
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{milestone.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(milestone.date).toLocaleDateString('fr-FR')}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full" />
                    <span className="capitalize">{milestone.module}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsightsView = () => (
    <div className="space-y-8">
      <div className={`${theme.card} rounded-3xl p-8 shadow-xl`}>
        <h2 className={`text-3xl font-bold ${theme.text} mb-8 flex items-center space-x-3`}>
          <Brain className="w-8 h-8" />
          <span>Insights Luna sur votre profil</span>
        </h2>

        <div className="grid gap-6">
          {insights.map((insight, index) => (
            <div 
              key={insight.id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    insight.category === 'personality' ? 'bg-purple-100' :
                    insight.category === 'skills' ? 'bg-blue-100' :
                    insight.category === 'career' ? 'bg-green-100' :
                    'bg-amber-100'
                  }`}>
                    {insight.category === 'personality' && <Heart className="w-6 h-6 text-purple-600" />}
                    {insight.category === 'skills' && <Zap className="w-6 h-6 text-blue-600" />}
                    {insight.category === 'career' && <Compass className="w-6 h-6 text-green-600" />}
                    {insight.category === 'potential' && <Star className="w-6 h-6 text-amber-600" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{insight.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{insight.source}</span>
                      <span>•</span>
                      <span>{new Date(insight.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                    insight.confidence >= 90 ? 'bg-green-100 text-green-800' :
                    insight.confidence >= 80 ? 'bg-blue-100 text-blue-800' :
                    insight.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {insight.confidence}%
                  </div>
                  {insight.actionable && (
                    <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                      ⚡ Actionnable
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 leading-relaxed">{insight.content}</p>
              
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                insight.category === 'personality' ? 'bg-purple-50 text-purple-700' :
                insight.category === 'skills' ? 'bg-blue-50 text-blue-700' :
                insight.category === 'career' ? 'bg-green-50 text-green-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                <span className="capitalize">{insight.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActionsView = () => {
    const priorityActions = currentStep ? currentStep.nextActions : [];
    
    return (
      <div className="space-y-8">
        <div className={`${theme.card} rounded-3xl p-8 shadow-xl`}>
          <h2 className={`text-3xl font-bold ${theme.text} mb-8 flex items-center space-x-3`}>
            <Rocket className="w-8 h-8" />
            <span>Actions prioritaires</span>
          </h2>

          {currentStep && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Target className="w-6 h-6 text-indigo-500" />
                <span>Focus immédiat: {currentStep.title}</span>
              </h3>
              
              <div className="space-y-3">
                {priorityActions.map((action, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 hover:shadow-lg transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{action}</p>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200">
                      Commencer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions suggérées basées sur les insights */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Lightbulb className="w-6 h-6 text-amber-500" />
              <span>Suggestions Luna</span>
            </h3>
            
            <div className="grid gap-4">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                <div className="flex items-center space-x-3 mb-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium">Commencer par les bases en Python</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Votre profil montre une forte capacité d'apprentissage. Python sera votre tremplin vers la Data Science.</p>
                <button className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 transition-colors">
                  Voir formations Python
                </button>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Rejoindre la communauté Data Science</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Votre leadership naturel sera un atout. Connectez-vous avec d'autres professionnels en reconversion.</p>
                <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                  Trouver communautés
                </button>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-3 mb-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Optimiser votre storytelling</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Préparez dès maintenant le récit de votre reconversion pour les futurs entretiens.</p>
                <button className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors">
                  Créer mon pitch
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard': return renderDashboardView();
      case 'roadmap': return renderRoadmapView();
      case 'timeline': return renderTimelineView();
      case 'insights': return renderInsightsView();
      case 'actions': return renderActionsView();
      default: return renderDashboardView();
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} relative`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Navigation bar fixe */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar navigation */}
      <div className={`fixed top-20 left-6 bottom-6 w-80 z-40 transition-all duration-300 ${sidebarOpen || window.innerWidth >= 1024 ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className={`${theme.card} rounded-3xl shadow-2xl p-6 h-full flex flex-col`}>
          <div className="mb-8">
            <h3 className={`text-2xl font-bold ${theme.text} flex items-center space-x-3`}>
              <BookOpen className="w-7 h-7" />
              <span>Navigation</span>
            </h3>
            <p className="text-gray-600 mt-1">Explorez votre parcours</p>
          </div>

          <div className="space-y-3 flex-1">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = currentView === view.id;
              
              return (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-200 ${
                    isActive 
                      ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                      : 'bg-white/50 hover:bg-white/80 border border-gray-200/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {view.name}
                    </span>
                  </div>
                  <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-600'}`}>
                    {view.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            {/* 🌙 Luna GPS - Smart Context Button */}
            <div className="space-y-3">
              <button 
                onClick={handleLunaGPS}
                className={`w-full p-4 bg-gradient-to-r ${theme.accent} text-white rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-200 relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                <MessageSquare className="w-5 h-5 relative z-10" />
                <span className="relative z-10">
                  {location.state?.fromAube ? 'Luna GPS : Planifier ma transition' : 'Laisse toi guider par Luna'}
                </span>
                <Sparkles className="w-4 h-4 relative z-10 animate-pulse" />
              </button>
              
              {/* Suggestions contextuelles */}
              {currentStep && (
                <div className="text-xs text-gray-500 text-center px-2">
                  💡 Luna peut t'aider avec : {currentStep.title.toLowerCase()}
                </div>
              )}
              
              {location.state?.fromAube && (
                <div className="text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-center border border-emerald-200">
                  🎯 Données Aube détectées : roadmap personnalisée disponible
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`pt-24 pb-16 ${sidebarOpen || window.innerWidth >= 1024 ? 'pl-96' : 'pl-6'} pr-6 transition-all duration-300 lg:pl-96`}>
        <div className="max-w-5xl mx-auto">
          {renderCurrentView()}
        </div>
      </div>

      {/* Overlay pour mobile */}
      {sidebarOpen && (typeof window !== 'undefined' && window.innerWidth < 1024) && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
});

LunaNarrativeJournal.displayName = 'LunaNarrativeJournal';

export default LunaNarrativeJournal;