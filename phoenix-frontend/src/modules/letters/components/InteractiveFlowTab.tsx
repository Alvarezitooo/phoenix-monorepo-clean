import React, { useState, memo, useCallback, useEffect } from 'react';
import { 
  MessageSquare, 
  Send,
  User,
  Bot,
  Loader2,
  Sparkles,
  ArrowRight,
  Building,
  Search,
  Palette,
  FileText,
  Edit3,
  CheckCircle,
  Download,
  RefreshCw,
  Lightbulb,
  Target,
  Briefcase,
  Clock,
  Zap
} from 'lucide-react';

type FlowState = 'greeting' | 'context_gathering' | 'company_research' | 'tone_selection' | 
                 'content_generation' | 'review_and_edit' | 'final_optimization' | 'delivery';

interface ChatMessage {
  id: string;
  type: 'user' | 'luna';
  content: string;
  timestamp: Date;
  flowState?: FlowState;
  suggestions?: string[];
  isTyping?: boolean;
}

interface ConversationContext {
  company_name?: string;
  position_title?: string;
  job_description?: string;
  candidate_experience?: string;
  key_skills?: string[];
  letter_type?: string;
  letter_tone?: string;
  generated_letter?: string;
  progress: number;
  energy_consumed: number;
}

const FLOW_STEPS = [
  { id: 'greeting', name: 'Accueil', icon: MessageSquare, progress: 0 },
  { id: 'context_gathering', name: 'Contexte', icon: User, progress: 15 },
  { id: 'company_research', name: 'Recherche', icon: Search, progress: 35 },
  { id: 'tone_selection', name: 'Style', icon: Palette, progress: 50 },
  { id: 'content_generation', name: 'Génération', icon: FileText, progress: 75 },
  { id: 'review_and_edit', name: 'Révision', icon: Edit3, progress: 90 },
  { id: 'final_optimization', name: 'Finalisation', icon: CheckCircle, progress: 95 },
  { id: 'delivery', name: 'Livraison', icon: Download, progress: 100 }
];

const InteractiveFlowTab = memo(() => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLunaTyping, setIsLunaTyping] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<FlowState>('greeting');
  const [context, setContext] = useState<ConversationContext>({
    progress: 0,
    energy_consumed: 0
  });

  // Initialize conversation
  useEffect(() => {
    const initMessage: ChatMessage = {
      id: '1',
      type: 'luna',
      content: `🌙 Salut champion ! Moi c'est Luna, ta rédactrice de lettres qui tuent ! ✉️

Je transforme tes candidatures en **armes de persuasion massive** ! 🎯
Recherche entreprise, ton personnalisé, accroche qui marque... je maîtrise tout !

📝 **Tu veux créer une lettre de motivation ?**
Dis-moi pour quelle entreprise et quel poste, je vais faire des miracles ! ✨

💡 **Ou tu as déjà une lettre à améliorer ?** Montre-moi ça, on va la rendre irrésistible !`,
      timestamp: new Date(),
      flowState: 'greeting',
      suggestions: [
        "Créer nouvelle lettre",
        "Améliorer lettre existante",
        "Google - Product Manager",
        "Airbnb - Designer"
      ]
    };

    setMessages([initMessage]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLunaTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLunaTyping(true);

    // Process user message and get Luna response
    const lunaResponse = await processUserMessage(content.trim(), currentFlow, context);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    const lunaMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'luna',
      content: lunaResponse.content,
      timestamp: new Date(),
      flowState: lunaResponse.nextFlow,
      suggestions: lunaResponse.suggestions
    };

    setMessages(prev => [...prev, lunaMessage]);
    setCurrentFlow(lunaResponse.nextFlow);
    setContext(prev => ({
      ...prev,
      ...lunaResponse.contextUpdate,
      progress: FLOW_STEPS.find(s => s.id === lunaResponse.nextFlow)?.progress || prev.progress
    }));
    setIsLunaTyping(false);
  }, [currentFlow, context, isLunaTyping]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }, [inputValue, sendMessage]);

  const currentStep = FLOW_STEPS.find(step => step.id === currentFlow);

  return (
    <div className="flex flex-col h-[800px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl border border-indigo-200">
      
      {/* Progress Header */}
      <div className="bg-white border-b border-indigo-200 p-4 rounded-t-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Conversation Interactive Luna</h3>
              <p className="text-sm text-gray-600">
                {currentStep ? `Étape: ${currentStep.name}` : 'Chat guidé'} • {context.energy_consumed}⚡ consommée
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">{context.progress}%</div>
            <div className="text-xs text-gray-500">Progression</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500 relative overflow-hidden"
            style={{ width: `${context.progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-3 px-1">
          {FLOW_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = context.progress > step.progress;
            const isCurrent = currentFlow === step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-indigo-500 text-white animate-pulse' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
                </div>
                <span className={`text-xs mt-1 ${
                  isCurrent ? 'text-indigo-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onSuggestionClick={handleSuggestionClick}
          />
        ))}
        
        {isLunaTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-indigo-200 max-w-md">
              <div className="flex items-center space-x-1">
                <span className="text-gray-600">Luna réfléchit</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-indigo-200 p-4 rounded-b-2xl">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLunaTyping}
              className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={isLunaTyping ? "Luna tape..." : "Tapez votre message..."}
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={isLunaTyping || !inputValue.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLunaTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const MessageBubble = memo(({ 
  message, 
  onSuggestionClick 
}: { 
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
}) => {
  const isUser = message.type === 'user';

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      
      <div className={`max-w-lg ${isUser ? 'ml-auto' : ''}`}>
        <div className={`rounded-2xl p-4 shadow-sm ${
          isUser 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-tr-sm' 
            : 'bg-white border border-indigo-200 rounded-tl-sm'
        }`}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          
          <div className={`text-xs mt-2 ${
            isUser ? 'text-white/70' : 'text-gray-500'
          }`}>
            {message.timestamp.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Suggestions */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Lightbulb className="w-3 h-3" />
              <span>Suggestions rapides:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs rounded-lg transition-colors duration-200 border border-indigo-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Process user message and return Luna response
async function processUserMessage(
  message: string, 
  currentFlow: FlowState, 
  context: ConversationContext
): Promise<{
  content: string;
  nextFlow: FlowState;
  suggestions: string[];
  contextUpdate: Partial<ConversationContext>;
}> {
  const messageLower = message.toLowerCase();

  switch (currentFlow) {
    case 'greeting':
      return processGreeting(message, messageLower);
    
    case 'context_gathering':
      return processContextGathering(message, messageLower, context);
    
    case 'company_research':
      return processCompanyResearch(message, messageLower, context);
    
    case 'tone_selection':
      return processToneSelection(message, messageLower, context);
    
    case 'content_generation':
      return processContentGeneration(message, messageLower, context);
    
    case 'review_and_edit':
      return processReviewAndEdit(message, messageLower, context);
    
    case 'final_optimization':
      return processFinalOptimization(message, messageLower, context);
    
    case 'delivery':
      return processDelivery(message, messageLower, context);
    
    default:
      return {
        content: "🌙 Je ne suis pas sûre de comprendre. Peux-tu reformuler ? 😊",
        nextFlow: currentFlow,
        suggestions: ["Recommencer", "Aide"],
        contextUpdate: {}
      };
  }
}

function processGreeting(message: string, messageLower: string) {
  // Extract company and position if provided
  const companyMatch = message.match(/([A-Z][a-zA-Z]+)\s*[-–]\s*(.+)/);
  let company = '';
  let position = '';

  if (companyMatch) {
    company = companyMatch[1].trim();
    position = companyMatch[2].trim();
  }

  if (company && position) {
    return {
      content: `🌙 Parfait ! **${company}** pour le poste de **${position}** ! 🎯

📊 **Je vais faire une recherche approfondie sur cette entreprise** :
• 🏢 Secteur, mission, valeurs  
• 📈 Actualités et croissance récente
• 💼 Culture d'entreprise
• 🎪 Tone de communication préféré

⚡ **En parallèle, dis-moi :**
• Quel est ton **niveau d'expérience** en ${position.toLowerCase()} ?
• Quelles sont tes **compétences clés** qui matchent ?
• As-tu l'**offre d'emploi complète** ? (ça m'aide énormément !)`,
      nextFlow: 'company_research' as FlowState,
      suggestions: [
        "Je suis débutant (0-2 ans)",
        "J'ai 5+ ans d'expérience",
        "Voici l'offre d'emploi",
        "Mes compétences principales"
      ],
      contextUpdate: { company_name: company, position_title: position, energy_consumed: 2 }
    };
  }

  return {
    content: `🌙 Super ! Pour créer la lettre parfaite, j'ai besoin de connaître :

🎯 **L'entreprise ciblée** ?
💼 **Le poste exact** ?

Dis-moi ça et on démarre ! 🚀

💡 **Format pratique** : "Entreprise - Poste" 
Exemple : "Microsoft - Product Manager"`,
    nextFlow: 'context_gathering' as FlowState,
    suggestions: [
      "Google - Software Engineer",
      "Airbnb - Designer",
      "Tesla - Product Manager",
      "J'ai une offre précise"
    ],
    contextUpdate: { energy_consumed: 1 }
  };
}

function processContextGathering(message: string, messageLower: string, context: ConversationContext) {
  // Extract company and position
  const companyMatch = message.match(/([A-Z][a-zA-Z]+)\s*[-–]\s*(.+)/);
  
  if (companyMatch) {
    const company = companyMatch[1].trim();
    const position = companyMatch[2].trim();
    
    return {
      content: `🌙 Excellent ! **${company}** pour **${position}** ! 

🔍 **Recherche en cours sur ${company}...**

Pendant que j'analyse leur secteur, culture et actualités récentes, peux-tu me dire :

💪 **Ton niveau d'expérience** :
• Débutant (0-2 ans) 
• Intermédiaire (3-7 ans)
• Senior (8+ ans)

🎯 **3 compétences clés** qui collent au poste ?`,
      nextFlow: 'company_research' as FlowState,
      suggestions: [
        "Débutant - JavaScript, React",
        "Senior - Leadership, Strategy",
        "Intermédiaire - Design, Figma",
        "J'ai l'offre complète"
      ],
      contextUpdate: { 
        company_name: company, 
        position_title: position,
        energy_consumed: (context.energy_consumed || 0) + 3
      }
    };
  }

  return {
    content: `🌙 Je n'ai pas bien saisi le nom de l'entreprise et du poste ! 

Peux-tu me dire exactement :
**Entreprise - Poste visé** ? 📝

Exemples qui marchent bien :
• "Tesla - Software Engineer"
• "Airbnb - Product Designer"  
• "Microsoft - Data Scientist"`,
    nextFlow: 'context_gathering' as FlowState,
    suggestions: [
      "Tesla - Software Engineer",
      "Airbnb - Product Designer", 
      "Microsoft - Data Scientist",
      "J'ai une offre précise"
    ],
    contextUpdate: {}
  };
}

function processCompanyResearch(message: string, messageLower: string, context: ConversationContext) {
  // Mock company research results
  const company = context.company_name || 'cette entreprise';
  
  return {
    content: `🌙 **Recherche ${company} terminée !** Voici ce que j'ai trouvé : 🔍

🏢 **Secteur** : Technology / Innovation
🎯 **Mission** : Simplifier la vie avec des produits exceptionnels
💼 **Culture** : Innovation, excellence, impact utilisateur
📈 **Actualité** : Croissance +40% et expansion internationale

🎨 **Style de lettre recommandé** :
• **Ton** : Confiant et tech-forward
• **Approche** : Impact + expertise technique

✨ **Prêt(e) à choisir le style parfait ?**

Quel ton préfères-tu ?`,
    nextFlow: 'tone_selection' as FlowState,
    suggestions: [
      "Confiant (Recommandé)",
      "Créatif et original",
      "Professionnel classique",
      "Enthousiaste"
    ],
    contextUpdate: { 
      energy_consumed: (context.energy_consumed || 0) + 5
    }
  };
}

function processToneSelection(message: string, messageLower: string, context: ConversationContext) {
  let selectedTone = 'professional';
  
  if (messageLower.includes('confiant') || messageLower.includes('recommandé')) {
    selectedTone = 'confident';
  } else if (messageLower.includes('créatif')) {
    selectedTone = 'creative';
  } else if (messageLower.includes('enthousiaste')) {
    selectedTone = 'enthusiastic';
  }

  return {
    content: `🌙 Parfait ! **Style ${selectedTone}** pour ${context.company_name} ! 🎯

⚡ **Génération en cours...**
• 🏢 Analyse ${context.company_name} intégrée
• 💼 Adaptation poste ${context.position_title}
• 🎨 Ton ${selectedTone} appliqué
• ✨ Personnalisation selon ton profil

📝 **Ta lettre sera prête dans quelques secondes !** ⏰

*Luna travaille sa magie...*`,
    nextFlow: 'content_generation' as FlowState,
    suggestions: ["Attendre la génération"],
    contextUpdate: { 
      letter_tone: selectedTone,
      energy_consumed: (context.energy_consumed || 0) + 15
    }
  };
}

function processContentGeneration(message: string, messageLower: string, context: ConversationContext) {
  const mockLetter = `Bonjour l'équipe ${context.company_name} !

Transformer des idées en produits qui impactent des millions d'utilisateurs, c'est exactement ce qui me passionne et ce que j'ai découvert en explorant votre mission.

En tant que ${context.position_title} expérimenté(e), j'ai eu la chance de contribuer à des projets qui ont révolutionné l'expérience utilisateur. Mon approche ? Combiner excellence technique et vision produit pour créer des solutions qui comptent vraiment.

Ce qui me motive chez ${context.company_name}, c'est votre capacité à innover tout en gardant l'humain au centre. Votre récent développement correspond parfaitement avec ma vision : la technologie doit simplifier, pas complexifier.

Je serais ravi(e) d'échanger sur comment mes compétences peuvent contribuer à vos prochains défis.

Hâte de contribuer à l'aventure ${context.company_name} !

Cordialement`;

  return {
    content: `🌙 **Ta lettre de motivation est prête !** Regarde-moi ça : ✨

📧 **LETTRE DE MOTIVATION**
${'─'.repeat(50)}

${mockLetter}

${'─'.repeat(50)}

💡 **Qu'est-ce que tu en penses ?**
• ✅ **Parfait** → On finalise !
• 🔄 **À modifier** → Dis-moi quoi changer !
• 🎨 **Autre ton** → On recommence avec un style différent !

🚀 **Cette lettre va faire mouche !** Elle est personnalisée pour ${context.company_name} et ton profil !`,
    nextFlow: 'review_and_edit' as FlowState,
    suggestions: [
      "Parfait, on finalise !",
      "Modifier l'introduction",
      "Changer le ton général",
      "Ajouter plus de détails"
    ],
    contextUpdate: { 
      generated_letter: mockLetter
    }
  };
}

function processReviewAndEdit(message: string, messageLower: string, context: ConversationContext) {
  if (messageLower.includes('parfait') || messageLower.includes('finalise') || messageLower.includes('valider')) {
    return {
      content: `🌙 **Lettre finalisée et optimisée !** Elle est prête à conquérir les recruteurs ! 🚀

✅ **Optimisations appliquées :**
• 🎯 Personnalisation entreprise maximisée
• 💪 Points forts mis en avant  
• ⚡ Call-to-action percutant
• 🔍 Mots-clés sectoriels intégrés

📧 **Ta lettre est prête à envoyer !**

💡 **Conseils bonus pour l'envoi :**
• 📎 Assure-toi que ton CV match la lettre
• ⏰ Envoie en début de semaine, matin
• 🔄 Personnalise l'objet du mail

🎯 **Prochaine étape ?** Préparation entretien avec Luna Rise ! 😉`,
      nextFlow: 'delivery' as FlowState,
      suggestions: [
        "Télécharger la lettre",
        "Nouvelle lettre",
        "Préparation entretien",
        "Conseils candidature"
      ],
      contextUpdate: {
        final_letter: context.generated_letter
      }
    };
  }

  return {
    content: `🌙 Parfait ! Je vais améliorer ta lettre ! 🔄

📝 **Dis-moi précisément ce que tu veux modifier :**
• 🎯 **Introduction** → Plus percutante ? Différente approche ?
• 💼 **Corps de lettre** → Plus de détails ? Autres exemples ?
• ✨ **Conclusion** → Plus dynamique ? Call-to-action différent ?
• 🎨 **Ton général** → Plus formel ? Plus créatif ?

Plus tu es précis(e), mieux je peux t'aider ! 💡`,
    nextFlow: 'review_and_edit' as FlowState,
    suggestions: [
      "Modifier l'introduction",
      "Améliorer le corps de lettre", 
      "Changer la conclusion",
      "Ajuster le ton"
    ],
    contextUpdate: {}
  };
}

function processFinalOptimization(message: string, messageLower: string, context: ConversationContext) {
  return processDelivery(message, messageLower, context);
}

function processDelivery(message: string, messageLower: string, context: ConversationContext) {
  return {
    content: `🌙 Tu as maintenant une lettre de motivation **redoutable** ! 💪

🎯 **Elle est calibrée pour** :
• ${context.company_name} spécifiquement
• Ton profil expérimenté
• Style ${context.letter_tone}

🚀 **Envoi et bonne chance !** Tu vas les impressionner !

💡 **Besoin d'une autre lettre ?** Je suis là ! Ou alors on prépare l'entretien ? 😊

**Total énergie utilisée : ${context.energy_consumed}⚡**`,
    nextFlow: 'delivery' as FlowState,
    suggestions: [
      "Nouvelle lettre motivation",
      "Préparation entretien",
      "Optimisation profil LinkedIn",
      "Télécharger PDF"
    ],
    contextUpdate: {}
  };
}

InteractiveFlowTab.displayName = 'InteractiveFlowTab';
MessageBubble.displayName = 'MessageBubble';

export default InteractiveFlowTab;