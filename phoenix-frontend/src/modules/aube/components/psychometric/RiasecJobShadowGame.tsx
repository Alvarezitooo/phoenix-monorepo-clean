import React, { useState, useEffect } from 'react';
import { Wrench, Search, Palette, Heart, TrendingUp, FileText, Clock, Star } from 'lucide-react';

interface RiasecJobShadow {
  id: string;
  type: 'realistic' | 'investigative' | 'artistic' | 'social' | 'enterprising' | 'conventional';
  title: string;
  setting: string;
  challenge: string;
  icon: React.ReactNode;
  bgColor: string;
  tasks: {
    id: string;
    description: string;
    action: string;
    enjoymentScore: number; // 1-5 scale
    difficultyLevel: 'facile' | 'moyen' | 'difficile';
    timeEstimate: string;
  }[];
}

const jobShadows: RiasecJobShadow[] = [
  {
    id: 'realistic_mechanic',
    type: 'realistic',
    title: '🔧 Atelier Mécanique',
    setting: 'Garage automobile moderne',
    challenge: 'Une voiture ne démarre plus. Le client part en vacances demain !',
    icon: <Wrench className="w-6 h-6" />,
    bgColor: 'from-blue-500 to-indigo-600',
    tasks: [
      {
        id: 'diagnostic',
        description: 'Brancher l\'ordinateur de diagnostic et analyser les codes erreur',
        action: 'Scanner les codes',
        enjoymentScore: 4,
        difficultyLevel: 'moyen',
        timeEstimate: '15 min'
      },
      {
        id: 'battery_check',
        description: 'Tester la batterie avec un multimètre et vérifier les connexions',
        action: 'Mesurer voltage',
        enjoymentScore: 3,
        difficultyLevel: 'facile',
        timeEstimate: '10 min'
      },
      {
        id: 'engine_repair',
        description: 'Démonter le démarreur défaillant et le remplacer',
        action: 'Réparer mécanisme',
        enjoymentScore: 5,
        difficultyLevel: 'difficile',
        timeEstimate: '45 min'
      }
    ]
  },
  {
    id: 'investigative_lab',
    type: 'investigative',
    title: '🔬 Laboratoire Recherche',
    setting: 'Centre de recherche biomédical',
    challenge: 'Analyser des échantillons sanguins pour détecter une nouvelle maladie',
    icon: <Search className="w-6 h-6" />,
    bgColor: 'from-purple-500 to-pink-600',
    tasks: [
      {
        id: 'hypothesis',
        description: 'Formuler 3 hypothèses sur la cause des symptômes observés',
        action: 'Théoriser causes',
        enjoymentScore: 5,
        difficultyLevel: 'difficile',
        timeEstimate: '30 min'
      },
      {
        id: 'data_analysis',
        description: 'Analyser les données statistiques de 500 patients',
        action: 'Analyser données',
        enjoymentScore: 4,
        difficultyLevel: 'moyen',
        timeEstimate: '60 min'
      },
      {
        id: 'experiment_design',
        description: 'Concevoir un protocole expérimental pour tester tes hypothèses',
        action: 'Planifier tests',
        enjoymentScore: 5,
        difficultyLevel: 'difficile',
        timeEstimate: '40 min'
      }
    ]
  },
  {
    id: 'artistic_studio',
    type: 'artistic',
    title: '🎨 Studio Créatif',
    setting: 'Agence de design graphique',
    challenge: 'Créer l\'identité visuelle d\'une startup tech en 4 heures !',
    icon: <Palette className="w-6 h-6" />,
    bgColor: 'from-pink-500 to-orange-600',
    tasks: [
      {
        id: 'brainstorm',
        description: 'Session brainstorming: générer 20 concepts créatifs différents',
        action: 'Créer concepts',
        enjoymentScore: 5,
        difficultyLevel: 'moyen',
        timeEstimate: '45 min'
      },
      {
        id: 'logo_design',
        description: 'Dessiner 5 variations du logo principal avec Adobe Illustrator',
        action: 'Designer logo',
        enjoymentScore: 5,
        difficultyLevel: 'moyen',
        timeEstimate: '90 min'
      },
      {
        id: 'color_palette',
        description: 'Choisir la palette de couleurs parfaite selon la psychologie des couleurs',
        action: 'Sélectionner couleurs',
        enjoymentScore: 4,
        difficultyLevel: 'facile',
        timeEstimate: '20 min'
      }
    ]
  },
  {
    id: 'social_counseling',
    type: 'social',
    title: '💝 Centre d\'Accompagnement',
    setting: 'Cabinet de coaching carrière',
    challenge: 'Aider quelqu\'un en reconversion à retrouver confiance en soi',
    icon: <Heart className="w-6 h-6" />,
    bgColor: 'from-emerald-500 to-teal-600',
    tasks: [
      {
        id: 'active_listening',
        description: 'Écouter activement les préoccupations et reformuler avec empathie',
        action: 'Écouter activement',
        enjoymentScore: 5,
        difficultyLevel: 'moyen',
        timeEstimate: '30 min'
      },
      {
        id: 'strengths_identification',
        description: 'Identifier 10 forces cachées et les faire reconnaître à la personne',
        action: 'Révéler forces',
        enjoymentScore: 5,
        difficultyLevel: 'difficile',
        timeEstimate: '45 min'
      },
      {
        id: 'action_plan',
        description: 'Co-créer un plan d\'action motivant avec des étapes réalisables',
        action: 'Planifier ensemble',
        enjoymentScore: 4,
        difficultyLevel: 'moyen',
        timeEstimate: '30 min'
      }
    ]
  },
  {
    id: 'enterprising_startup',
    type: 'enterprising',
    title: '🚀 Startup Pitch',
    setting: 'Incubateur d\'entreprises',
    challenge: 'Convaincre 5 investisseurs en 10 minutes de financer ton projet !',
    icon: <TrendingUp className="w-6 h-6" />,
    bgColor: 'from-orange-500 to-red-600',
    tasks: [
      {
        id: 'market_analysis',
        description: 'Présenter l\'analyse de marché avec des chiffres percutants',
        action: 'Analyser marché',
        enjoymentScore: 4,
        difficultyLevel: 'moyen',
        timeEstimate: '3 min'
      },
      {
        id: 'pitch_delivery',
        description: 'Pitcher avec passion et convaincre par ton charisme',
        action: 'Pitcher projet',
        enjoymentScore: 5,
        difficultyLevel: 'difficile',
        timeEstimate: '5 min'
      },
      {
        id: 'objection_handling',
        description: 'Répondre aux objections difficiles des investisseurs sceptiques',
        action: 'Gérer objections',
        enjoymentScore: 4,
        difficultyLevel: 'difficile',
        timeEstimate: '2 min'
      }
    ]
  },
  {
    id: 'conventional_audit',
    type: 'conventional',
    title: '📊 Bureau Audit',
    setting: 'Cabinet d\'expertise comptable',
    challenge: 'Auditer les comptes d\'une PME et détecter les anomalies',
    icon: <FileText className="w-6 h-6" />,
    bgColor: 'from-gray-500 to-slate-600',
    tasks: [
      {
        id: 'data_verification',
        description: 'Vérifier la cohérence de 1000 lignes comptables avec Excel',
        action: 'Vérifier données',
        enjoymentScore: 3,
        difficultyLevel: 'facile',
        timeEstimate: '60 min'
      },
      {
        id: 'anomaly_detection',
        description: 'Détecter 5 anomalies cachées dans les écritures comptables',
        action: 'Détecter erreurs',
        enjoymentScore: 4,
        difficultyLevel: 'moyen',
        timeEstimate: '45 min'
      },
      {
        id: 'report_writing',
        description: 'Rédiger un rapport d\'audit structuré et précis',
        action: 'Rédiger rapport',
        enjoymentScore: 3,
        difficultyLevel: 'moyen',
        timeEstimate: '40 min'
      }
    ]
  }
];

interface RiasecJobShadowGameProps {
  onComplete: (scores: Record<string, number>, insights: string[]) => void;
  onProgress: (current: number, total: number) => void;
}

const RiasecJobShadowGame: React.FC<RiasecJobShadowGameProps> = ({ onComplete, onProgress }) => {
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number[]>>({
    realistic: [],
    investigative: [],
    artistic: [],
    social: [],
    enterprising: [],
    conventional: []
  });
  const [insights, setInsights] = useState<string[]>([]);
  const [selectedEnjoyment, setSelectedEnjoyment] = useState<number | null>(null);
  const [showTaskResult, setShowTaskResult] = useState(false);

  const currentJob = jobShadows[currentJobIndex];
  const currentTask = currentJob.tasks[currentTaskIndex];
  const totalTasks = jobShadows.reduce((acc, job) => acc + job.tasks.length, 0);
  const completedTasks = jobShadows.slice(0, currentJobIndex).reduce((acc, job) => acc + job.tasks.length, 0) + currentTaskIndex;

  useEffect(() => {
    onProgress(completedTasks + 1, totalTasks);
  }, [currentJobIndex, currentTaskIndex, completedTasks, totalTasks, onProgress]);

  const handleEnjoymentSelect = (enjoymentLevel: number) => {
    setSelectedEnjoyment(enjoymentLevel);
    setShowTaskResult(true);

    // Store score
    const newScores = { ...scores };
    newScores[currentJob.type] = [...newScores[currentJob.type], enjoymentLevel];
    setScores(newScores);

    // Generate insight
    const insightTexts = [
      `${currentJob.title}: ${enjoymentLevel >= 4 ? '❤️ Tu adores!' : enjoymentLevel >= 3 ? '👍 Ça te plaît' : '😐 Mitigé'} (${currentTask.action})`,
    ];
    setInsights([...insights, ...insightTexts]);

    setTimeout(() => {
      // Move to next task/job
      if (currentTaskIndex < currentJob.tasks.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      } else if (currentJobIndex < jobShadows.length - 1) {
        setCurrentJobIndex(currentJobIndex + 1);
        setCurrentTaskIndex(0);
      } else {
        // Calculate final RIASEC scores
        const finalScores: Record<string, number> = {};
        Object.entries(newScores).forEach(([type, typeScores]) => {
          finalScores[type] = typeScores.reduce((a, b) => a + b, 0) / typeScores.length;
        });
        onComplete(finalScores, insights);
      }
      
      setSelectedEnjoyment(null);
      setShowTaskResult(false);
    }, 2500);
  };

  const getEnjoymentText = (level: number) => {
    switch (level) {
      case 1: return 'Ennuyeux 😴';
      case 2: return 'Peu motivant 😐';
      case 3: return 'Correct ✅';
      case 4: return 'Motivant 😊';
      case 5: return 'Passionnant 🔥';
      default: return '';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'facile': return 'bg-green-100 text-green-800';
      case 'moyen': return 'bg-yellow-100 text-yellow-800';
      case 'difficile': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            🎯 Job Shadow RIASEC - Tâche {completedTasks + 1}/{totalTasks}
          </h2>
          <div className="flex items-center space-x-2 text-purple-600">
            <Clock className="w-5 h-5" />
            <span className="font-bold">{currentTask.timeEstimate}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((completedTasks + 1) / totalTasks) * 100}%` }}
          />
        </div>
      </div>

      {/* Job Environment Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
        {/* Job Header */}
        <div className={`bg-gradient-to-r ${currentJob.bgColor} p-6 text-white`}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              {currentJob.icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold">{currentJob.title}</h3>
              <p className="text-lg opacity-90">{currentJob.setting}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <p className="text-lg">
              <strong>🎯 Challenge:</strong> {currentJob.challenge}
            </p>
          </div>
        </div>

        {/* Current Task */}
        <div className="p-8">
          {!showTaskResult ? (
            <>
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  Tâche à réaliser:
                </h4>
                <p className="text-lg text-gray-600 mb-4">{currentTask.description}</p>
                
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentTask.difficultyLevel)}`}>
                    {currentTask.difficultyLevel}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    ⏱️ {currentTask.timeEstimate}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h5 className="text-center text-lg font-semibold text-gray-700 mb-4">
                  À quel point cette tâche t'intéresse-t-elle ?
                </h5>
                
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleEnjoymentSelect(level)}
                      className="group p-4 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 text-center"
                    >
                      <div className="text-2xl mb-2">
                        {level === 1 ? '😴' : level === 2 ? '😐' : level === 3 ? '✅' : level === 4 ? '😊' : '🔥'}
                      </div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-purple-800">
                        {getEnjoymentText(level)}
                      </p>
                      <div className="flex justify-center mt-2">
                        {Array.from({ length: level }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Task Result */
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="text-6xl mb-4">
                  {selectedEnjoyment && selectedEnjoyment >= 4 ? '🔥' : selectedEnjoyment === 3 ? '👍' : '😐'}
                </div>
                <p className="text-xl font-semibold text-gray-800">
                  {selectedEnjoyment && getEnjoymentText(selectedEnjoyment)}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <p className="text-lg text-gray-700">
                  <strong>Tâche :</strong> {currentTask.action}<br/>
                  <strong>Ton ressenti :</strong> {selectedEnjoyment && selectedEnjoyment >= 4 ? 
                    'Tu as adoré cette activité ! 🎉' : 
                    selectedEnjoyment === 3 ? 
                    'Activité correcte, sans plus 👌' : 
                    'Pas vraiment ton truc... 🤷‍♂️'
                  }
                </p>
              </div>

              <div className="mt-6">
                <div className="inline-flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
                  <span>Analyse de tes préférences professionnelles...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Luna Commentary */}
      <div className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">🌙</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Luna analyse :</strong> {
                currentJob.type === 'realistic' ? "J'observe tes préférences pour le concret... 🔧" :
                currentJob.type === 'investigative' ? "Ton côté analytique se révèle ! 🔬" :
                currentJob.type === 'artistic' ? "Ta créativité s'exprime clairement ! 🎨" :
                currentJob.type === 'social' ? "Ton empathie et ton leadership transparaissent ! 💝" :
                currentJob.type === 'enterprising' ? "Ton esprit entrepreneurial prend forme ! 🚀" :
                "Ton sens de l'organisation se confirme ! 📊"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiasecJobShadowGame;