import React, { memo, useState, useEffect, useRef } from 'react';
import { Send, Loader2, ArrowRight, Sparkles, Moon } from 'lucide-react';
import { phoenixAubeApi } from '../../../services/aubeApiPhoenix';
import { CareerSuggestion } from '../hooks/useCareerDiscovery';

interface AssessmentQuestion {
  id: string;
  type: 'welcome' | 'big_five' | 'riasec' | 'interests' | 'summary';
  question: string;
  choices?: string[];
  allowFreeText?: boolean;
  trait?: string; // Pour Big Five: openness, conscientiousness, etc.
}

interface AssessmentResponse {
  questionId: string;
  answer: string;
  timestamp: number;
}

interface ChatMessage {
  id: string;
  sender: 'luna' | 'user';
  content: string;
  timestamp: number;
  expression?: string; // Simplified - no longer using LunaExpression
}

const LunaAssessmentChat = memo(() => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [isLunaTyping, setIsLunaTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [assessmentResults, setAssessmentResults] = useState<CareerSuggestion[] | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Questions psychométriques déguisées
  const assessmentQuestions: AssessmentQuestion[] = [
    {
      id: 'welcome',
      type: 'welcome',
      question: "Salut ! Je suis Luna 🌙 Prête à découvrir tes métiers de rêve ? On va faire ça ensemble, étape par étape !",
      choices: ["C'est parti !", "Je suis prêt·e", "Let's go !"]
    },
    {
      id: 'energy_source',
      type: 'big_five',
      trait: 'extraversion',
      question: "Super ! D'abord, raconte-moi : dans ton travail, qu'est-ce qui te donne le plus d'énergie ?",
      choices: [
        "💬 Échanger avec des collègues et clients",
        "🤔 Réfléchir seul·e sur des projets complexes", 
        "👥 Animer des réunions et présenter",
        "📚 Approfondir un sujet qui m'intéresse"
      ],
      allowFreeText: true
    },
    {
      id: 'problem_solving',
      type: 'big_five', 
      trait: 'openness',
      question: "Très intéressant ! Et quand tu rencontres un problème au travail, comment tu l'abordes ?",
      choices: [
        "🔍 J'analyse méthodiquement les données",
        "💡 Je cherche des solutions créatives",
        "👂 Je demande conseil autour de moi",
        "📋 Je suis les procédures établies"
      ],
      allowFreeText: true
    },
    {
      id: 'work_environment',
      type: 'riasec',
      question: "Parfait ! Maintenant, décris-moi ton environnement de travail idéal :",
      choices: [
        "🏢 Bureau moderne avec équipe dynamique",
        "🌿 Espace calme pour me concentrer",
        "🚀 Startup avec beaucoup d'innovation",
        "🏛️ Structure stable avec sécurité d'emploi"
      ],
      allowFreeText: true
    },
    {
      id: 'skills_passion',
      type: 'riasec',
      question: "Et dis-moi, qu'est-ce que tu ADORES faire ? Même sans être payé·e pour ça ?",
      choices: [
        "🎨 Créer, dessiner, concevoir",
        "📊 Analyser des données et tendances", 
        "🤝 Aider les autres et conseiller",
        "🔧 Construire et réparer des choses",
        "📖 Apprendre et transmettre",
        "💼 Organiser et coordonner des projets"
      ],
      allowFreeText: true
    },
    {
      id: 'motivations',
      type: 'interests',
      question: "Excellent ! Dernière question : qu'est-ce qui te motiverait le plus dans un nouveau job ?",
      choices: [
        "💰 Un salaire attractif et évolutif",
        "🎯 Un impact positif sur la société",
        "🧠 Des défis intellectuels stimulants",
        "⚖️ Un équilibre vie pro/perso parfait",
        "🏆 Reconnaissance et possibilités d'évolution"
      ],
      allowFreeText: true
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addLunaMessage = async (content: string, expression: string = 'idle') => {
    setIsLunaTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation typing
    
    const message: ChatMessage = {
      id: `luna-${Date.now()}`,
      sender: 'luna',
      content,
      timestamp: Date.now(),
      expression
    };
    
    setMessages(prev => [...prev, message]);
    setIsLunaTyping(false);
  };

  const handleChoiceSelect = async (choice: string) => {
    if (!currentQuestion) return;
    
    setSelectedChoice(choice);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user', 
      content: choice,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Save response
    const response: AssessmentResponse = {
      questionId: currentQuestion.id,
      answer: choice,
      timestamp: Date.now()
    };
    
    setResponses(prev => [...prev, response]);
    
    // Next question
    setTimeout(() => {
      nextQuestion();
    }, 1000);
  };

  const handleFreeTextSubmit = async () => {
    if (!currentQuestion || !userInput.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: userInput,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Save response  
    const response: AssessmentResponse = {
      questionId: currentQuestion.id,
      answer: userInput,
      timestamp: Date.now()
    };
    
    setResponses(prev => [...prev, response]);
    setUserInput('');
    
    // Next question
    setTimeout(() => {
      nextQuestion();
    }, 1000);
  };

  const processAssessmentResults = async () => {
    try {
      // Transform responses to API format
      const assessmentData = responses.reduce((acc, response) => {
        const question = assessmentQuestions.find(q => q.id === response.questionId);
        if (question?.trait) {
          acc[question.trait] = response.answer;
        } else {
          acc[response.questionId] = response.answer;
        }
        return acc;
      }, {} as any);

      // Call Phoenix API pour assessment
      const apiResults = await phoenixAubeApi.processLunaAssessment({
        assessment_responses: assessmentData,
        response_count: responses.length,
        completion_time: Date.now()
      });

      if (apiResults?.compatible_careers) {
        let careersData = apiResults.compatible_careers;
        
        // Parse si c'est du JSON string
        if (typeof careersData === 'string') {
          try {
            careersData = JSON.parse(careersData);
          } catch (e) {
            console.warn('Failed to parse careers JSON from assessment');
          }
        }
        
        if (Array.isArray(careersData)) {
          const transformedResults: CareerSuggestion[] = careersData.map((career: any) => ({
            title: career.title || career.name || 'Métier compatible',
            compatibility: career.compatibility_score || career.score || 85,
            sector: career.sector || career.industry || 'Technologie',
            description: career.description || career.descriptif || 'Description du métier',
            skills: career.skills || career.competences_requises || [],
            salaryRange: career.salary_range || career.salaire || '40k-60k€',
            demand: career.demand || career.demande || 'Modérée',
            transitionTime: career.transition_time || career.duree_transition || '6-12 mois'
          }));
          
          setAssessmentResults(transformedResults);
          
          const resultsMessage = `🎉 Analyse terminée ! Voici tes métiers les plus compatibles :

${transformedResults.map((career, index) => 
  `🎯 **${index + 1}. ${career.title}** (${career.compatibility}% compatible)
  ${career.description}`
).join('\n\n')}

✨ Ces suggestions sont basées sur ton profil psychométrique complet !`;
          
          await addLunaMessage(resultsMessage, 'excited');
        }
      }
    } catch (error) {
      console.error('Assessment processing failed:', error);
      await addLunaMessage(
        "🤖 J'ai eu un petit souci technique pour analyser tes réponses, mais ne t'inquiète pas ! Tu peux utiliser le formulaire rapide pour obtenir tes recommandations métiers.",
        'apologetic'
      );
    }
  };

  const nextQuestion = async () => {
    if (questionIndex >= assessmentQuestions.length - 1) {
      // Assessment complete
      await addLunaMessage(
        "Waouh ! Merci pour toutes ces réponses 🌟 Je vais maintenant analyser ton profil pour te proposer tes métiers les plus compatibles. Ça va être passionnant !",
        'celebrating'
      );
      setIsComplete(true);
      
      // Process real assessment results
      setTimeout(async () => {
        await processAssessmentResults();
      }, 2000);
      
      return;
    }
    
    const nextQ = assessmentQuestions[questionIndex + 1];
    setCurrentQuestion(nextQ);
    setQuestionIndex(prev => prev + 1);
    setSelectedChoice('');
    
    // Luna responses based on previous answers
    const encouragements = [
      "Super réponse ! 😊",
      "Très intéressant ! 💡", 
      "Parfait, ça m'aide beaucoup ! ✨",
      "Excellent ! 🎯",
      "J'adore ta façon de voir les choses ! 🌟"
    ];
    
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    await addLunaMessage(randomEncouragement, 'confirming');
    await addLunaMessage(nextQ.question, 'listening');
  };

  // Initialize chat
  useEffect(() => {
    if (assessmentQuestions.length > 0 && messages.length === 0) {
      setCurrentQuestion(assessmentQuestions[0]);
      addLunaMessage(assessmentQuestions[0].question, 'idle');
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLunaTyping]);

  const currentExpression: string = isLunaTyping ? 'thinking' : 
                                    isComplete ? 'insight' :
                                    messages.length > 0 ? messages[messages.length - 1].expression || 'idle' : 'idle';

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
      {/* Header avec Luna */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center flex-shrink-0">
            <Moon className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Découverte Carrière avec Luna</h2>
            <p className="text-emerald-100">Test psychométrique personnalisé • Big Five + RIASEC</p>
            <div className="mt-2 bg-emerald-400 rounded-full h-2 w-64">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${(questionIndex / assessmentQuestions.length) * 100}%` }}
              />
            </div>
            <p className="text-xs mt-1 text-emerald-100">
              Question {questionIndex + 1} / {assessmentQuestions.length} • 0⚡ énergie
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-6 bg-gradient-to-b from-emerald-50 to-white">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'luna' ? 'justify-start' : 'justify-end'}`}
            >
              {message.sender === 'luna' && (
                <div className="flex-shrink-0 mr-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                    <Moon className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-md px-4 py-3 rounded-2xl ${
                  message.sender === 'luna'
                    ? 'bg-white border border-emerald-200 text-gray-800 shadow-sm'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="text-xs mt-2 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {/* Luna typing indicator */}
          {isLunaTyping && (
            <div className="flex justify-start">
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                  <Moon className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="bg-white border border-emerald-200 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span className="text-sm text-gray-600">Luna réfléchit...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isComplete && currentQuestion && !isLunaTyping && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          {/* Choice buttons */}
          {currentQuestion.choices && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {currentQuestion.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoiceSelect(choice)}
                  className="text-left p-4 bg-white border border-emerald-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{choice}</span>
                    <ArrowRight className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Free text input */}
          {currentQuestion.allowFreeText && (
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFreeTextSubmit()}
                  placeholder="Ou écris ta propre réponse..."
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-400" />
              </div>
              <button
                onClick={handleFreeTextSubmit}
                disabled={!userInput.trim()}
                className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Completion state */}
      {isComplete && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
              <Moon className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-800">Assessment Terminé !</h3>
              <p className="text-emerald-600">Luna analyse tes réponses...</p>
            </div>
          </div>
          <div className="animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
});

LunaAssessmentChat.displayName = 'LunaAssessmentChat';

export default LunaAssessmentChat;