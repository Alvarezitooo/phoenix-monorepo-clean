import React, { useState, useEffect } from 'react';
import { useLuna } from './LunaContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, X, Zap, Moon, Send, ArrowRight, BookOpen, Navigation, User, Target, TrendingUp, Calendar, Star, Award, FileText, MessageSquare, Users, Sunrise } from 'lucide-react';
import { sendLunaChatMessage, checkLunaEnergy, type LunaChatRequest } from '../services/api';
import { narrativeCapture, useNarrativeCapture, type NarrativeEnrichment, type UserBehaviorSignals } from '../services/narrativeCapture';
import LunaEnergyWidget from './LunaEnergyWidget';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'luna';
  timestamp: Date;
  energyCost?: number;
}

interface PhoenixProgress {
  currentStep: number;
  totalSteps: number;
  completed: string[];
  nextAction: string;
  module: string;
}

interface NarrativeState {
  emotionalState: string;
  behavioralSignals: UserBehaviorSignals;
  sessionMomentum: 'building' | 'maintaining' | 'declining';
  nextPredictions: string[];
  blockers: string[];
  opportunities: string[];
  journeyStage: string;
  lastActionTime: number;
}

// Smart contextual responses
const getContextualResponse = (message: string, module: string, progress: PhoenixProgress) => {
  const responses = {
    aube: [
      "🌅 Parfait ! Tu es sur Aube - le module pour découvrir tes nouveaux métiers possibles !",
      "Super ! Aube c'est ton tremplin vers de nouvelles opportunités carrière ! 🚀",
      "Excellent choix ! Aube va t'aider à identifier tes métiers de rêve ✨"
    ],
    cv: [
      "📄 Tu bosses sur ton CV - c'est ton passeport professionnel ! Fais-le briller !",
      "CV = première impression ! On va le rendre irrésistible ensemble 💪",
      "Ton CV doit raconter TON histoire unique ! Dis-moi ton secteur ?"
    ],
    letters: [
      "✉️ Les lettres de motivation - l'art de séduire par les mots ! Tu postules où ?",
      "Une bonne lettre = entretien assuré ! On peut optimiser ça ensemble 🎯",
      "Les recruteurs adorent l'authenticité ! Raconte-moi ton projet ?"
    ],
    rise: [
      "🚀 Module Rise - ton école d'entretiens ! Prépare-toi à briller !",
      "Rise = confiance et technique ! Tu te prépares pour quel type d'entretien ?",
      "Storytelling, simulations... Rise va booster tes soft skills ! 💡"
    ],
    default: [
      "Salut ! Bienvenue sur Phoenix ! 🌟 Prêt à transformer ta carrière ?",
      "Hello ! Je suis Luna, ton guide carrière personnalisé ! Comment ça va ?",
      "Coucou ! Phoenix c'est ton allié évolution pro ! Par quoi on commence ? ✨"
    ]
  };
  
  const moduleResponses = responses[module as keyof typeof responses] || responses.default;
  const baseResponse = moduleResponses[Math.floor(Math.random() * moduleResponses.length)];
  
  // Add progress context
  const progressText = progress.nextAction ? 
    `\n\n📍 **Ton parcours**: ${progress.currentStep}/${progress.totalSteps} étapes\n➡️ Prochaine action: ${progress.nextAction}` : 
    '';
    
  return baseResponse + progressText;
};

// Phoenix journey progress tracking
const getPhoenixProgress = (module: string): PhoenixProgress => {
  const journeyMap = {
    'aube': { step: 1, total: 4, completed: [], next: 'Découvrir tes métiers compatibles' },
    'cv': { step: 2, total: 4, completed: ['Aube'], next: 'Optimiser ton CV' },
    'letters': { step: 3, total: 4, completed: ['Aube', 'CV'], next: 'Rédiger des lettres percutantes' },
    'rise': { step: 4, total: 4, completed: ['Aube', 'CV', 'Letters'], next: 'Maîtriser tes entretiens' },
    'default': { step: 0, total: 4, completed: [], next: 'Commencer par Aube - Découverte Carrière' }
  };
  
  const progress = journeyMap[module as keyof typeof journeyMap] || journeyMap.default;
  
  return {
    currentStep: progress.step,
    totalSteps: progress.total,
    completed: progress.completed,
    nextAction: progress.next,
    module
  };
};

export default function LunaConversationalSidebar() {
  const luna = useLuna();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [freeMessagesCount, setFreeMessagesCount] = useState(15);
  const [smartContext, setSmartContext] = useState<any>(null);
  const [narrativeState, setNarrativeState] = useState<NarrativeState | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // 🧠 Hook de capture narrative pour connexion temps réel
  const { captureAction } = useNarrativeCapture();

  // Context awareness - detect current module
  const currentModule = location.pathname.includes('/aube') ? 'aube' : 
                       location.pathname.includes('/cv') ? 'cv' : 
                       location.pathname.includes('/letters') ? 'letters' :
                       location.pathname.includes('/rise') ? 'rise' : 'default';

  const phoenixProgress = getPhoenixProgress(currentModule);

  // 🧠 Synchronisation avec les données narratives
  useEffect(() => {
    const syncNarrativeData = async () => {
      if (luna.authenticatedUser?.id) {
        try {
          // Récupérer les données narratives actuelles depuis Luna Hub
          const narrativeData = await fetchCurrentNarrativeState(currentModule);
          if (narrativeData) {
            setNarrativeState(narrativeData);
          }
        } catch (error) {
          console.warn('⚠️ Narrative sync failed:', error);
        }
      }
    };

    syncNarrativeData();
    
    // Sync périodique des données narratives (toutes les 30s)
    const syncInterval = setInterval(syncNarrativeData, 30000);
    
    return () => clearInterval(syncInterval);
  }, [currentModule, luna.authenticatedUser?.id]);

  // 🎯 Fonction pour récupérer l'état narratif actuel
  const fetchCurrentNarrativeState = async (module: string): Promise<NarrativeState | null> => {
    try {
      const response = await fetch(`${import.meta.env.MODE === 'development' 
        ? 'http://localhost:8003' 
        : 'https://luna-hub-production.up.railway.app'}/luna/narrative/current-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: luna.authenticatedUser?.id,
          module: module
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.narrative_state || null;
      }
    } catch (error) {
      console.warn('Failed to fetch narrative state:', error);
    }
    return null;
  };

  // Initialize context-aware welcome message with AI
  useEffect(() => {
    if (luna.authenticatedUser && messages.length === 0) {
      const initializeWelcome = async () => {
        try {
          // Get AI-powered welcome message from Luna
          const welcomeResponse = await sendLunaChatMessage({
            user_id: luna.authenticatedUser?.id || 'anonymous',
            message: 'Hello',
            app_context: currentModule,
            user_name: luna.authenticatedUser?.name || luna.authenticatedUser?.email
          });
          
          const welcomeMessage: Message = {
            id: 'luna-welcome',
            text: welcomeResponse.message,
            sender: 'luna',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        } catch (error) {
          // Fallback to static welcome
          const welcomeMessage: Message = {
            id: 'luna-welcome',
            text: `Salut ! 🌙 Je suis Luna, ton guide Phoenix personnalisé !\n\n📍 **Module actuel**: ${currentModule}\n\n💬 Tu as **${freeMessagesCount} messages gratuits** aujourd'hui.\n\nComment puis-je t'aider ?`,
            sender: 'luna',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
      };
      
      initializeWelcome();
    }
  }, [luna.authenticatedUser, currentModule]);

  // 🌙 Luna GPS Event Listener
  useEffect(() => {
    const handleLunaOpen = (event: any) => {
      console.log('🌙 Luna GPS triggered with context:', event.detail);
      setSmartContext(event.detail);
      setIsOpen(true);
      
      // Message contextuel intelligent selon les données
      if (event.detail) {
        const contextMessage: Message = {
          id: `luna-context-${Date.now()}`,
          text: `🎯 Parfait ! Je vois que tu ${event.detail.fromAube ? 'arrives d\'Aube avec ton choix carrière' : 'es dans le journal narratif'}.\n\n${event.detail.selectedCareer ? `💼 **Métier choisi**: ${event.detail.selectedCareer.title}\n` : ''}${event.detail.currentStep ? `📍 **Étape actuelle**: ${event.detail.currentStep}\n` : ''}${event.detail.nextActions?.length ? `🚀 **Prochaines actions**: ${event.detail.nextActions[0]}\n` : ''}\nComment puis-je t'aider à avancer ? ✨`,
          sender: 'luna',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, contextMessage]);
      }
    };

    window.addEventListener('luna:openSidebar', handleLunaOpen);
    
    return () => {
      window.removeEventListener('luna:openSidebar', handleLunaOpen);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    console.log('🔄 Messages updated, count:', messages.length, 'isLoading:', isLoading);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Debug messages state
  useEffect(() => {
    console.log('🎯 Current messages state:', messages.map(m => ({ id: m.id, sender: m.sender, text: m.text.substring(0, 50) })));
  }, [messages]);

  const handleToggleSidebar = () => {
    if (!luna.authenticatedUser) {
      luna.openAuthChat();
      return;
    }
    setIsOpen(!isOpen);
  };

  // 🧠 Quick Actions intelligentes adaptées selon l'état narratif
  const getSmartQuickActions = () => {
    // Actions de base par module
    const baseActions = {
      'aube': [
        { icon: FileText, label: 'Analyser mon CV', path: '/cv', color: 'from-blue-500 to-cyan-600', priority: 'high' },
        { icon: MessageSquare, label: 'Créer une lettre', path: '/letters', color: 'from-green-500 to-emerald-600', priority: 'medium' }
      ],
      'cv': [
        { icon: MessageSquare, label: 'Rédiger une lettre', path: '/letters', color: 'from-green-500 to-emerald-600', priority: 'high' },
        { icon: Users, label: 'Préparer entretien', path: '/rise', color: 'from-purple-500 to-pink-600', priority: 'medium' }
      ],
      'letters': [
        { icon: FileText, label: 'Optimiser mon CV', path: '/cv', color: 'from-blue-500 to-cyan-600', priority: 'medium' },
        { icon: Users, label: 'Simuler entretien', path: '/rise', color: 'from-purple-500 to-pink-600', priority: 'high' }
      ],
      'rise': [
        { icon: Sunrise, label: 'Découvrir métiers', path: '/aube', color: 'from-orange-500 to-red-600', priority: 'medium' },
        { icon: FileText, label: 'Peaufiner mon CV', path: '/cv', color: 'from-blue-500 to-cyan-600', priority: 'high' }
      ],
      'default': [
        { icon: Sunrise, label: 'Commencer par Aube', path: '/aube', color: 'from-orange-500 to-red-600', priority: 'high' },
        { icon: FileText, label: 'Analyser mon CV', path: '/cv', color: 'from-blue-500 to-cyan-600', priority: 'medium' }
      ]
    };
    
    let actions = baseActions[currentModule as keyof typeof baseActions] || baseActions.default;
    
    // 🧠 Adaptation intelligente selon l'état narratif
    if (narrativeState) {
      // Adapter les suggestions selon les prédictions narratives
      if (narrativeState.nextPredictions.includes('cv')) {
        actions = actions.map(action => 
          action.path === '/cv' ? { ...action, label: '⚡ ' + action.label, priority: 'urgent' } : action
        );
      }
      
      // Adapter selon l'état émotionnel
      if (narrativeState.emotionalState.includes('confident')) {
        actions = actions.map(action => 
          action.priority === 'high' ? { ...action, label: action.label + ' 🚀' } : action
        );
      } else if (narrativeState.emotionalState.includes('uncertain')) {
        actions = actions.map(action => 
          action.priority === 'high' ? { ...action, label: '💡 ' + action.label } : action
        );
      }
      
      // Ajouter actions urgentes selon blockers détectés
      if (narrativeState.blockers.includes('decision_paralysis')) {
        actions.unshift({
          icon: Target,
          label: '🎯 Aide pour décision',
          path: location.pathname, // Reste sur la page actuelle
          color: 'from-red-500 to-pink-600',
          priority: 'urgent'
        });
      }
    }
    
    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    }).slice(0, 3); // Limiter à 3 actions max
  };

  const handleQuickAction = async (path: string, label: string, priority?: string) => {
    const actionStartTime = Date.now();
    
    // 🧠 Capture narrative de l'action Quick Action
    await captureAction('luna_quick_action', currentModule, {
      action_label: label,
      target_path: path,
      priority_level: priority,
      emotional_state: narrativeState?.emotionalState,
      session_momentum: narrativeState?.sessionMomentum
    }, actionStartTime);
    
    navigate(path);
    
    // Message contextuel intelligente selon l'état narratif
    let contextualMessage = `🚀 Perfect ! Direction ${label} !`;
    
    if (narrativeState) {
      if (narrativeState.emotionalState.includes('confident')) {
        contextualMessage = `🔥 Excellent choix ! ${label} va booster ton parcours !`;
      } else if (narrativeState.emotionalState.includes('uncertain')) {
        contextualMessage = `💡 Bonne direction ! ${label} va t'aider à clarifier tes objectifs.`;
      }
      
      if (priority === 'urgent') {
        contextualMessage = `⚡ Action prioritaire ! ${label} - exactement ce dont tu as besoin maintenant !`;
      }
    }
    
    const contextMessage: Message = {
      id: `quick-action-${Date.now()}`,
      text: `${contextualMessage}\n\nJe reste ici pour t'accompagner sur ce nouveau module. Dis-moi si tu as des questions ! ✨`,
      sender: 'luna',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, contextMessage]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInputText = input.trim();
    const messageCost = freeMessagesCount > 0 ? 0 : 1;
    
    // Check energy if not free
    if (messageCost > 0 && luna.lunaEnergy && luna.lunaEnergy < messageCost) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: `Oups ! Plus de messages gratuits aujourd'hui et il te faut 1⚡ pour continuer.\n\n☕ Recharge ton énergie Luna :\n• Café Luna: 2,99€ → 100⚡\n• Petit-déj Luna: 5,99€ → 220⚡`,
        sender: 'luna',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: userInputText,
      sender: 'user',
      timestamp: new Date(),
      energyCost: messageCost
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Update counters
    if (freeMessagesCount > 0) {
      setFreeMessagesCount(prev => prev - 1);
    } else {
      luna.updateEnergy((luna.lunaEnergy || 0) - messageCost);
    }

    try {
      // Call the distributed Luna API with real AI
      const lunaApiResponse = await sendLunaChatMessage({
        user_id: luna.authenticatedUser?.id || 'anonymous',
        message: userInputText,
        app_context: currentModule,
        user_name: luna.authenticatedUser?.name || luna.authenticatedUser?.email
      });
      
      const lunaMessage: Message = {
        id: `luna-${Date.now()}`,
        text: lunaApiResponse.message,
        sender: 'luna',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, lunaMessage]);
      
      // Update energy if consumed
      if (lunaApiResponse.energy_consumed > 0) {
        luna.updateEnergy((luna.lunaEnergy || 0) - lunaApiResponse.energy_consumed);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "Désolée, j'ai eu un petit problème technique ! 😅 Peux-tu réessayer ?",
        sender: 'luna',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Luna Guide</h2>
                <p className="text-sm opacity-90">
                  {freeMessagesCount > 0 
                    ? `${freeMessagesCount} messages gratuits`
                    : `1⚡ par message • ${luna.lunaEnergy || 0}⚡ restant`
                  }
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🌟 Energy Widget */}
        <div className="p-4 border-b border-gray-100">
          <LunaEnergyWidget isCompact={true} showActions={false} />
        </div>

        {/* 🚀 Quick Actions contextuelles */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>Actions suggérées</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {getSmartQuickActions().map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.path, action.label, (action as any).priority)}
                  className={`p-3 bg-gradient-to-r ${action.color} text-white rounded-lg text-xs font-medium hover:shadow-md transition-all duration-200 flex items-center space-x-2 ${(action as any).priority === 'urgent' ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="flex-1 text-left">{action.label}</span>
                  {(action as any).priority === 'urgent' && <span className="text-xs">⚡</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 🧠 Luna Narrative Insights (si disponibles) */}
        {narrativeState && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>Luna Insights</span>
              </h3>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                narrativeState.sessionMomentum === 'building' ? 'bg-green-100 text-green-700' :
                narrativeState.sessionMomentum === 'maintaining' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {narrativeState.sessionMomentum === 'building' ? '📈 En progression' :
                 narrativeState.sessionMomentum === 'maintaining' ? '🎯 Focalisé' : 
                 '💭 Réflexion'}
              </div>
            </div>
            
            <div className="space-y-2 text-xs">
              {/* État émotionnel */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">État:</span>
                <span className="font-medium text-indigo-700">
                  {narrativeState.emotionalState.includes('confident') ? '🔥 Confiant' :
                   narrativeState.emotionalState.includes('uncertain') ? '💡 En réflexion' :
                   narrativeState.emotionalState.includes('curious') ? '🧭 Exploratoire' :
                   '🚀 Motivé'}
                </span>
              </div>
              
              {/* Opportunités détectées */}
              {narrativeState.opportunities.length > 0 && (
                <div className="flex items-start space-x-2">
                  <span className="text-gray-600 mt-0.5">Opportunité:</span>
                  <span className="font-medium text-green-700">
                    {narrativeState.opportunities[0].includes('accelerate') ? '⚡ Prêt pour étape suivante' :
                     narrativeState.opportunities[0].includes('leverage') ? '🎯 Exploiter résultats' :
                     '🚀 Fonctionnalités avancées'}
                  </span>
                </div>
              )}
              
              {/* Blockers s'il y en a */}
              {narrativeState.blockers.length > 0 && (
                <div className="flex items-start space-x-2">
                  <span className="text-gray-600 mt-0.5">Attention:</span>
                  <span className="font-medium text-amber-700">
                    {narrativeState.blockers[0].includes('decision') ? '🤔 Aide à la décision' :
                     narrativeState.blockers[0].includes('engagement') ? '💪 Motivation' :
                     '🎯 Support qualité'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phoenix Progress Bar */}
        <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Parcours Phoenix</span>
            <span className="text-xs text-gray-500">{phoenixProgress.currentStep}/{phoenixProgress.totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(phoenixProgress.currentStep / phoenixProgress.totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <BookOpen className="h-3 w-3 mr-1" />
            {phoenixProgress.nextAction}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'luna' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-sm px-4 py-2 rounded-2xl whitespace-pre-line ${
                    message.sender === 'luna'
                      ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  }`}
                >
                  {message.text}
                  <div className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                    {message.energyCost !== undefined && message.energyCost > 0 && (
                      <span className="ml-2">• {message.energyCost}⚡</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150" />
                    </div>
                    <span className="text-sm text-gray-600">Luna réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>


        {/* Input */}
        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                freeMessagesCount > 0 
                  ? "Parle à Luna (gratuit)..." 
                  : "Message à Luna (1⚡)..."
              }
              className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Toggle Button - Positioned on the right side, mid-screen */}
      <button
        onClick={handleToggleSidebar}
        className={`fixed top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-40 ${
          isOpen ? 'right-96' : 'right-0'
        } rounded-l-full group`}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            {freeMessagesCount > 0 && (
              <span className="absolute -top-2 -left-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {freeMessagesCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}