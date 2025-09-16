import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Coffee, Handshake, Crown, Timer } from 'lucide-react';

interface ExtraversionScenario {
  id: string;
  title: string;
  context: string;
  image: string;
  choices: {
    id: string;
    text: string;
    icon: React.ReactNode;
    extraversionScore: number; // 1-5 scale
    consequence: string;
  }[];
}

const scenarios: ExtraversionScenario[] = [
  {
    id: 'networking_arrival',
    title: '🎪 Arrivée à la Soirée Networking',
    context: 'Tu arrives à cette soirée professionnelle. 150 personnes, musique d\'ambiance, cocktails. Que fais-tu ?',
    image: '🏢',
    choices: [
      {
        id: 'direct_center',
        text: 'Je fonce au centre, me présente à tout le monde',
        icon: <Crown className="w-4 h-4" />,
        extraversionScore: 5,
        consequence: '🔥 Energy max! Tu attires l\'attention, 5 cartes échangées en 10 min!'
      },
      {
        id: 'strategic_small_groups',
        text: 'Je repère 2-3 petits groupes sympas et m\'approche',
        icon: <Users className="w-4 h-4" />,
        extraversionScore: 4,
        consequence: '🎯 Approche équilibrée! Conversations de qualité, contacts ciblés.'
      },
      {
        id: 'wait_and_observe',
        text: 'J\'observe d\'abord, puis rejoins un groupe qui m\'intéresse',
        icon: <MessageCircle className="w-4 h-4" />,
        extraversionScore: 3,
        consequence: '🤔 Stratégie réfléchie! Tu choisis bien tes interlocuteurs.'
      },
      {
        id: 'find_coffee_corner',
        text: 'Je me dirige vers le coin buffet/café, plus tranquille',
        icon: <Coffee className="w-4 h-4" />,
        extraversionScore: 2,
        consequence: '☕ Zone comfort! Tu engages des conversations plus intimes.'
      },
      {
        id: 'minimal_interaction',
        text: 'Je reste en périphérie, j\'attends qu\'on vienne me parler',
        icon: <Handshake className="w-4 h-4" />,
        extraversionScore: 1,
        consequence: '🌙 Approche zen! Tu attires les personnes authentiques vers toi.'
      }
    ]
  },
  {
    id: 'difficult_conversation',
    title: '🎭 Conversation Tendue',
    context: 'Quelqu\'un critique publiquement ton secteur d\'activité devant 6 personnes. Réaction ?',
    image: '⚡',
    choices: [
      {
        id: 'debate_publicly',
        text: 'Je débats ouvertement, j\'argumente avec passion',
        icon: <Crown className="w-4 h-4" />,
        extraversionScore: 5,
        consequence: '🔥 Tu domines le débat! Respect gagné mais quelques tensions...'
      },
      {
        id: 'diplomatic_response',
        text: 'Je nuance diplomatiquement avec des exemples concrets',
        icon: <Users className="w-4 h-4" />,
        extraversionScore: 4,
        consequence: '🏆 Excellente gestion! Tu fédères le groupe autour de ta vision.'
      },
      {
        id: 'redirect_conversation',
        text: 'Je redirige vers les points positifs et l\'évolution du secteur',
        icon: <MessageCircle className="w-4 h-4" />,
        extraversionScore: 3,
        consequence: '✨ Malin! Tu transformes le négatif en opportunité de discussion.'
      },
      {
        id: 'private_discussion',
        text: 'Je note mentalement et j\'en reparle en privé après',
        icon: <Coffee className="w-4 h-4" />,
        extraversionScore: 2,
        consequence: '🤝 Stratégie subtile! Tu évites le conflit public.'
      },
      {
        id: 'silent_discomfort',
        text: 'Je ne dis rien, ça me met mal à l\'aise',
        icon: <Handshake className="w-4 h-4" />,
        extraversionScore: 1,
        consequence: '😔 Tu ressens de la frustration mais préserves l\'harmonie.'
      }
    ]
  },
  {
    id: 'presentation_opportunity',
    title: '🎤 Opportunité de Présentation',
    context: 'L\'organisateur demande qui veut pitcher son projet en 2 minutes devant tous. Réaction immédiate ?',
    image: '🎯',
    choices: [
      {
        id: 'volunteer_immediately',
        text: 'Je lève la main en premier: "Moi!"',
        icon: <Crown className="w-4 h-4" />,
        extraversionScore: 5,
        consequence: '🚀 Leader naturel! Tu inspires et motives l\'audience.'
      },
      {
        id: 'consider_then_volunteer',
        text: 'Je réfléchis 10 secondes puis je me lance',
        icon: <Users className="w-4 h-4" />,
        extraversionScore: 4,
        consequence: '💡 Équilibre parfait! Confiance et réflexion.'
      },
      {
        id: 'volunteer_if_asked',
        text: 'J\'attends de voir, je me proposerai si besoin',
        icon: <MessageCircle className="w-4 h-4" />,
        extraversionScore: 3,
        consequence: '🎭 Tu participes quand l\'occasion se présente naturellement.'
      },
      {
        id: 'prefer_one_on_one',
        text: 'Trop public pour moi, je préfère les discussions 1-to-1',
        icon: <Coffee className="w-4 h-4" />,
        extraversionScore: 2,
        consequence: '💬 Tu excelles dans l\'intimité des conversations privées.'
      },
      {
        id: 'avoid_spotlight',
        text: 'Non merci, je déteste être au centre de l\'attention',
        icon: <Handshake className="w-4 h-4" />,
        extraversionScore: 1,
        consequence: '🌙 Tu préfères influencer en coulisses, c\'est tout aussi précieux.'
      }
    ]
  }
];

interface BigFiveExtraversionGameProps {
  onComplete: (score: number, insights: string[]) => void;
  onProgress: (current: number, total: number) => void;
}

const BigFiveExtraversionGame: React.FC<BigFiveExtraversionGameProps> = ({ onComplete, onProgress }) => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showConsequence, setShowConsequence] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    onProgress(currentScenario + 1, scenarios.length);
  }, [currentScenario, onProgress]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1 && !selectedChoice) {
          // Auto-select middle choice if time runs out
          handleChoiceSelect(scenarios[currentScenario].choices[2]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentScenario, selectedChoice]);

  const handleChoiceSelect = (choice: any) => {
    setSelectedChoice(choice.id);
    setShowConsequence(true);

    const newScores = [...scores, choice.extraversionScore];
    const newInsights = [...insights, choice.consequence];
    
    setScores(newScores);
    setInsights(newInsights);

    setTimeout(() => {
      if (currentScenario < scenarios.length - 1) {
        setCurrentScenario(currentScenario + 1);
        setSelectedChoice(null);
        setShowConsequence(false);
        setTimeLeft(30);
      } else {
        // Calculate final score
        const avgScore = newScores.reduce((a, b) => a + b, 0) / newScores.length;
        onComplete(avgScore, newInsights);
      }
    }, 3000);
  };

  const scenario = scenarios[currentScenario];
  const selectedChoiceData = selectedChoice 
    ? scenario.choices.find(c => c.id === selectedChoice)
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            🧠 Test Extraversion - Scénario {currentScenario + 1}/{scenarios.length}
          </h2>
          <div className="flex items-center space-x-2 text-orange-600">
            <Timer className="w-5 h-5" />
            <span className="font-bold">{timeLeft}s</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((currentScenario + 1) / scenarios.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Scenario Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{scenario.image}</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{scenario.title}</h3>
          <p className="text-lg text-gray-600">{scenario.context}</p>
        </div>

        {!showConsequence ? (
          /* Choices */
          <div className="grid gap-4">
            {scenario.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoiceSelect(choice)}
                className="group p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 text-left flex items-center space-x-4"
                disabled={!!selectedChoice}
              >
                <div className="flex-shrink-0 p-3 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                  {choice.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 group-hover:text-orange-800">
                    {choice.text}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 border-2 border-gray-300 rounded-full group-hover:border-orange-500" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Consequence Display */
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="inline-flex items-center space-x-3 p-4 bg-orange-100 rounded-full">
                {selectedChoiceData?.icon}
                <span className="font-semibold text-orange-800">Excellent choix !</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
              <p className="text-lg text-gray-700 mb-4">
                <strong>Tu as choisi :</strong> {selectedChoiceData?.text}
              </p>
              <p className="text-xl font-medium text-orange-800">
                {selectedChoiceData?.consequence}
              </p>
            </div>

            <div className="mt-6">
              <div className="inline-flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
                <span>Analyse de ta personnalité en cours...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Luna Commentary */}
      <div className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">🌙</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Luna observe :</strong> {
                currentScenario === 0 ? "Intéressant... je vois des patterns dans tes préférences sociales 🤔" :
                currentScenario === 1 ? "Ton style de communication se précise ! 💡" :
                "Profil extraversion quasi complet, j'ai hâte de t'analyser ! ✨"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BigFiveExtraversionGame;