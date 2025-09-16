import React, { memo, useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../shared/ui/card';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AnimatedGradient } from '../../../shared/components/AnimatedGradient';

interface InterviewQuestion {
  id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'competency';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tips: string[];
  goodAnswerStructure: string;
  commonMistakes: string[];
  followUpQuestions: string[];
}

interface InterviewPreparation {
  position: string;
  company: string;
  industry: string;
  interviewFormat: string;
  questions: InterviewQuestion[];
  companyInsights: {
    culture: string[];
    values: string[];
    recentNews: string[];
    challenges: string[];
  };
  preparationStrategy: {
    research: string[];
    practice: string[];
    materials: string[];
    timeline: string;
  };
  dresscode: {
    recommendation: string;
    details: string[];
  };
  logistics: {
    arrivalTime: string;
    documents: string[];
    backup: string[];
  };
}

export const InterviewMasteryTab = memo(() => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [preparation, setPreparation] = useState<InterviewPreparation | null>(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const [setupForm, setSetupForm] = useState({
    position: '',
    company: '',
    industry: 'Tech',
    interviewFormat: 'in_person',
    experienceLevel: 'intermediate',
    focusAreas: [] as string[]
  });

  const generateInterviewPreparation = useCallback(async () => {
    if (!setupForm.position || !setupForm.company) return;
    
    setIsGenerating(true);
    
    // Simulate AI-powered interview preparation
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    // Mock comprehensive interview preparation
    const mockPreparation: InterviewPreparation = {
      position: setupForm.position,
      company: setupForm.company,
      industry: setupForm.industry,
      interviewFormat: setupForm.interviewFormat,
      questions: [
        {
          id: '1',
          question: 'Parlez-moi de vous et de votre parcours professionnel.',
          type: 'behavioral',
          difficulty: 'Easy',
          category: 'Présentation personnelle',
          tips: [
            'Structurez en 3 parties: passé, présent, futur',
            'Connectez chaque étape au poste visé',
            'Gardez un ton professionnel mais authentique',
            'Durée idéale: 2-3 minutes maximum'
          ],
          goodAnswerStructure: 'Mon parcours a commencé par... Actuellement, je... Ce qui m\'amène vers ce poste car...',
          commonMistakes: [
            'Réciter son CV sans personnaliser',
            'Parler de sa vie privée en détail',
            'Ne pas faire le lien avec le poste',
            'Réponse trop longue (> 5 minutes)'
          ],
          followUpQuestions: [
            'Qu\'est-ce qui vous motivate le plus dans votre travail?',
            'Comment vos collègues vous décriraient-ils?'
          ]
        },
        {
          id: '2',
          question: 'Décrivez une situation où vous avez dû résoudre un problème complexe au travail.',
          type: 'behavioral',
          difficulty: 'Medium',
          category: 'Résolution de problèmes',
          tips: [
            'Utilisez la méthode STAR (Situation, Task, Action, Result)',
            'Choisissez un exemple récent et pertinent',
            'Quantifiez les résultats obtenus',
            'Montrez votre processus de réflexion'
          ],
          goodAnswerStructure: 'Situation: ... Tâche: ... Actions: ... Résultats: ...',
          commonMistakes: [
            'Exemple trop vague ou ancien',
            'Ne pas expliquer le processus de résolution',
            'Pas de résultats mesurables',
            'S\'attribuer tout le mérite'
          ],
          followUpQuestions: [
            'Comment avez-vous identifié la cause racine?',
            'Que feriez-vous différemment aujourd\'hui?'
          ]
        },
        {
          id: '3',
          question: `Quelles sont vos connaissances techniques en ${setupForm.industry}?`,
          type: 'technical',
          difficulty: 'Hard',
          category: 'Expertise technique',
          tips: [
            'Soyez spécifique sur vos compétences',
            'Donnez des exemples concrets d\'utilisation',
            'Admettez vos limites avec honnêteté',
            'Montrez votre capacité d\'apprentissage'
          ],
          goodAnswerStructure: 'Mes compétences principales sont... J\'ai utilisé X pour... Je continue à apprendre...',
          commonMistakes: [
            'Surestimer ses compétences',
            'Rester trop vague',
            'Ne pas donner d\'exemples',
            'Paraître arrogant'
          ],
          followUpQuestions: [
            'Comment vous tenez-vous à jour techniquement?',
            'Quel projet technique vous a le plus marqué?'
          ]
        },
        {
          id: '4',
          question: `Pourquoi voulez-vous rejoindre ${setupForm.company}?`,
          type: 'competency',
          difficulty: 'Medium',
          category: 'Motivation',
          tips: [
            'Montrez que vous avez recherché l\'entreprise',
            'Connectez vos valeurs aux leurs',
            'Mentionnez des projets/innovations spécifiques',
            'Évitez les clichés généralistes'
          ],
          goodAnswerStructure: 'Ce qui m\'attire chez X c\'est... Votre approche de... correspond à...',
          commonMistakes: [
            'Réponse générique qui pourrait s\'appliquer partout',
            'Focus uniquement sur ce que l\'entreprise peut apporter',
            'Pas de recherche préalable visible',
            'Mentionner uniquement le salaire/avantages'
          ],
          followUpQuestions: [
            'Qu\'est-ce qui vous inquiète le plus dans ce poste?',
            'Comment voyez-vous votre évolution ici?'
          ]
        },
        {
          id: '5',
          question: 'Décrivez une situation où vous avez échoué et comment vous l\'avez gérée.',
          type: 'behavioral',
          difficulty: 'Hard',
          category: 'Gestion d\'échec',
          tips: [
            'Choisissez un échec réel mais pas catastrophique',
            'Focus sur les leçons apprises',
            'Montrez votre résilience et adaptabilité',
            'Expliquez comment cela vous a fait grandir'
          ],
          goodAnswerStructure: 'J\'ai échoué quand... J\'ai appris que... Maintenant je...',
          commonMistakes: [
            'Déguiser un succès en échec',
            'Rejeter la faute sur les autres',
            'Pas de leçons tirées',
            'Échec trop personnel/dramatique'
          ],
          followUpQuestions: [
            'Comment prévenez-vous ce type d\'échec maintenant?',
            'Qu\'est-ce qui vous aide à rebondir après un échec?'
          ]
        }
      ],
      companyInsights: {
        culture: [
          'Innovation et prise d\'initiative encouragées',
          'Environnement collaboratif et bienveillant',
          'Focus sur le développement personnel',
          'Flexibilité et équilibre vie pro/perso'
        ],
        values: [
          'Transparence dans la communication',
          'Excellence dans l\'exécution',
          'Respect de la diversité',
          'Impact social positif'
        ],
        recentNews: [
          'Levée de fonds série B de 50M€',
          'Lancement nouveau produit international',
          'Certification B-Corp obtenue',
          'Partenariat stratégique avec leader du secteur'
        ],
        challenges: [
          'Scale-up rapide et maintien de la culture',
          'Concurrence accrue sur le marché',
          'Attraction et rétention des talents',
          'Transformation digitale continue'
        ]
      },
      preparationStrategy: {
        research: [
          'Analyser le site web et blog entreprise',
          'Consulter profils LinkedIn des futurs managers',
          'Lire dernières actualités et communiqués',
          'Rechercher avis salariés sur Glassdoor/Welcome'
        ],
        practice: [
          'Répéter présentation personnelle (2-3 min)',
          'Préparer 3 exemples STAR détaillés',
          'Simuler entretien avec ami/famille',
          'Entraîner questions techniques spécifiques'
        ],
        materials: [
          'CV actualisé et adapté au poste',
          'Portfolio de réalisations concrètes',
          'Liste de questions à poser',
          'Références professionnelles préparées'
        ],
        timeline: '2 semaines de préparation intensive recommandées'
      },
      dresscode: {
        recommendation: setupForm.industry === 'Tech' ? 'Smart Casual' : 'Business Professional',
        details: setupForm.industry === 'Tech' ? [
          'Chino ou jean propre + chemise/polo',
          'Chaussures de ville ou sneakers propres',
          'Éviter short, tongs, vêtements troués',
          'Accessoires minimalistes'
        ] : [
          'Costume sombre + chemise claire + cravate',
          'Chaussures de ville cirées',
          'Accessoires discrets (montre, ceinture)',
          'Éviter couleurs flashy ou motifs'
        ]
      },
      logistics: {
        arrivalTime: '10-15 minutes avant l\'heure',
        documents: [
          'Pièce d\'identité',
          'CV papier (3 exemplaires)',
          'Lettre de motivation si demandée',
          'Certificats/diplômes si pertinents'
        ],
        backup: [
          'Numéro de téléphone du contact RH',
          'Itinéraire alternatif prévu',
          'Tenue de rechange si nécessaire',
          'Collations énergétiques'
        ]
      }
    };
    
    setPreparation(mockPreparation);
    setIsGenerating(false);
  }, [setupForm]);

  const addFocusArea = useCallback((area: string) => {
    if (area && !setupForm.focusAreas.includes(area)) {
      setSetupForm(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, area]
      }));
    }
  }, [setupForm.focusAreas]);

  const removeFocusArea = useCallback((area: string) => {
    setSetupForm(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.filter(a => a !== area)
    }));
  }, []);

  const startPractice = useCallback(() => {
    setPracticeMode(true);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setActiveTab('practice');
  }, []);

  const submitAnswer = useCallback(async () => {
    if (!userAnswer.trim() || !preparation) return;
    
    // Simulate AI feedback
    const mockFeedback = {
      score: Math.round(65 + Math.random() * 30),
      strengths: [
        'Structure STAR bien respectée',
        'Exemple concret et pertinent',
        'Résultats quantifiés clairement'
      ],
      improvements: [
        'Approfondir l\'impact sur l\'équipe',
        'Mentionner les leçons apprises',
        'Connecter davantage au poste visé'
      ],
      nextSteps: 'Excellente base ! Travaillez sur les points d\'amélioration pour une réponse parfaite.'
    };
    
    setFeedback(mockFeedback);
  }, [userAnswer, preparation]);

  const nextQuestion = useCallback(() => {
    if (preparation && currentQuestionIndex < preparation.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setFeedback(null);
    }
  }, [preparation, currentQuestionIndex]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      case 'Hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'behavioral': return 'bg-blue-100 text-blue-700';
      case 'technical': return 'bg-purple-100 text-purple-700';
      case 'situational': return 'bg-green-100 text-green-700';
      case 'competency': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tabConfig = [
    { id: 'setup', label: 'Configuration', icon: '⚙️' },
    { id: 'questions', label: 'Questions', icon: '❓' },
    { id: 'company', label: 'Entreprise', icon: '🏢' },
    { id: 'preparation', label: 'Préparation', icon: '📋' },
    { id: 'practice', label: 'Pratique', icon: '🎯' }
  ];

  if (isGenerating) {
    return (
      <Card className="relative h-[600px] overflow-hidden">
        <AnimatedGradient className="absolute inset-0 opacity-5" />
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <LoadingSpinner className="mx-auto w-12 h-12" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Préparation d'entretien en cours...</h3>
              <p className="text-gray-600 max-w-md">
                Luna analyse le poste et l'entreprise pour créer votre préparation sur-mesure
              </p>
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Setup Tab */}
      {activeTab === 'setup' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Configuration Entretien</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poste visé *
                  </label>
                  <input
                    type="text"
                    value={setupForm.position}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Ex: Senior Frontend Developer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entreprise cible *
                  </label>
                  <input
                    type="text"
                    value={setupForm.company}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Ex: Spotify, Uber, BlaBlaCar"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur d'activité
                  </label>
                  <select
                    value={setupForm.industry}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="Tech">Tech/Digital</option>
                    <option value="Finance">Finance</option>
                    <option value="Conseil">Conseil</option>
                    <option value="Retail">Commerce/Retail</option>
                    <option value="Industry">Industrie</option>
                    <option value="Healthcare">Santé</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format d'entretien
                  </label>
                  <select
                    value={setupForm.interviewFormat}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, interviewFormat: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="in_person">En présentiel</option>
                    <option value="video">Visioconférence</option>
                    <option value="phone">Téléphonique</option>
                    <option value="panel">Panel (multiple interviewers)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domaines de focus (optionnel)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {setupForm.focusAreas.map((area, index) => (
                    <span
                      key={index}
                      className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{area}</span>
                      <button
                        onClick={() => removeFocusArea(area)}
                        className="text-emerald-500 hover:text-emerald-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Leadership', 'Technique', 'Communication', 'Gestion équipe', 'Innovation', 'Résolution problèmes'].map((area) => (
                    <button
                      key={area}
                      onClick={() => addFocusArea(area)}
                      disabled={setupForm.focusAreas.includes(area)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        setupForm.focusAreas.includes(area)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700'
                      }`}
                    >
                      + {area}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={generateInterviewPreparation}
                disabled={!setupForm.position || !setupForm.company}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                🎯 Générer ma préparation d'entretien
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && preparation && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Questions d'Entretien Probables</h3>
              <button
                onClick={startPractice}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
              >
                🎯 Mode Pratique
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {preparation.questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Question #{index + 1}: {question.question}
                      </h4>
                      <div className="flex space-x-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
                          {question.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                          {question.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-green-700 mb-2">✅ Conseils pour réussir</h5>
                      <ul className="space-y-1 text-sm">
                        {question.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="text-green-600">• {tip}</li>
                        ))}
                      </ul>
                      
                      <h5 className="font-medium text-blue-700 mb-2 mt-4">📝 Structure recommandée</h5>
                      <p className="text-blue-600 text-sm italic">{question.goodAnswerStructure}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-red-700 mb-2">⚠️ Erreurs à éviter</h5>
                      <ul className="space-y-1 text-sm">
                        {question.commonMistakes.map((mistake, mistakeIndex) => (
                          <li key={mistakeIndex} className="text-red-600">• {mistake}</li>
                        ))}
                      </ul>
                      
                      <h5 className="font-medium text-purple-700 mb-2 mt-4">🔄 Questions de suivi possibles</h5>
                      <ul className="space-y-1 text-sm">
                        {question.followUpQuestions.map((followUp, followIndex) => (
                          <li key={followIndex} className="text-purple-600">• {followUp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && preparation && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Insights Entreprise: {preparation.company}</h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-blue-700 mb-3">🏢 Culture d'entreprise</h4>
                  <ul className="space-y-2">
                    {preparation.companyInsights.culture.map((item, index) => (
                      <li key={index} className="text-blue-600 text-sm flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-700 mb-3">💎 Valeurs clés</h4>
                  <ul className="space-y-2">
                    {preparation.companyInsights.values.map((item, index) => (
                      <li key={index} className="text-green-600 text-sm flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-purple-700 mb-3">📰 Actualités récentes</h4>
                  <ul className="space-y-2">
                    {preparation.companyInsights.recentNews.map((item, index) => (
                      <li key={index} className="text-purple-600 text-sm flex items-start space-x-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-orange-700 mb-3">⚡ Défis actuels</h4>
                  <ul className="space-y-2">
                    {preparation.companyInsights.challenges.map((item, index) => (
                      <li key={index} className="text-orange-600 text-sm flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preparation Tab */}
      {activeTab === 'preparation' && preparation && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Plan de Préparation</h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-700 mb-3">🔍 Recherche à effectuer</h4>
                    <ul className="space-y-2">
                      {preparation.preparationStrategy.research.map((item, index) => (
                        <li key={index} className="text-blue-600 text-sm flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-700 mb-3">🎯 Entraînement pratique</h4>
                    <ul className="space-y-2">
                      {preparation.preparationStrategy.practice.map((item, index) => (
                        <li key={index} className="text-green-600 text-sm flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-purple-700 mb-3">📋 Matériel à préparer</h4>
                    <ul className="space-y-2">
                      {preparation.preparationStrategy.materials.map((item, index) => (
                        <li key={index} className="text-purple-600 text-sm flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="font-medium text-emerald-700 mb-2">⏰ Timeline recommandée</h4>
                    <p className="text-emerald-600 text-sm">{preparation.preparationStrategy.timeline}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h4 className="font-medium text-gray-800">👔 Dress Code</h4>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {preparation.dresscode.recommendation}
                  </span>
                </div>
                <ul className="space-y-2">
                  {preparation.dresscode.details.map((detail, index) => (
                    <li key={index} className="text-gray-600 text-sm flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h4 className="font-medium text-gray-800">📍 Logistique</h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-green-700 text-sm mb-1">Arrivée</h5>
                    <p className="text-green-600 text-sm">{preparation.logistics.arrivalTime}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-blue-700 text-sm mb-1">Documents à apporter</h5>
                    <ul className="space-y-1">
                      {preparation.logistics.documents.map((doc, index) => (
                        <li key={index} className="text-blue-600 text-sm">• {doc}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-purple-700 text-sm mb-1">Plan B</h5>
                    <ul className="space-y-1">
                      {preparation.logistics.backup.map((backup, index) => (
                        <li key={index} className="text-purple-600 text-sm">• {backup}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Practice Tab */}
      {activeTab === 'practice' && preparation && practiceMode && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Mode Pratique - Question {currentQuestionIndex + 1}/{preparation.questions.length}
              </h3>
              <div className="text-sm text-gray-500">
                {feedback ? `Score: ${feedback.score}/100` : 'En attente de votre réponse'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {preparation.questions[currentQuestionIndex] && (
                <>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="bg-blue-100 rounded-full p-2">
                        <span className="text-blue-600 text-sm font-bold">Q</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          {preparation.questions[currentQuestionIndex].question}
                        </h4>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(preparation.questions[currentQuestionIndex].type)}`}>
                            {preparation.questions[currentQuestionIndex].type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(preparation.questions[currentQuestionIndex].difficulty)}`}>
                            {preparation.questions[currentQuestionIndex].difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Votre réponse (simulez un entretien réel)
                    </label>
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Tapez votre réponse comme si vous étiez en entretien..."
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  {!feedback ? (
                    <button
                      onClick={submitAnswer}
                      disabled={!userAnswer.trim()}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      📝 Obtenir le feedback Luna
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-green-800">Feedback Luna</h5>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                              {feedback.score}/100
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h6 className="font-medium text-green-700 mb-2">✅ Points forts</h6>
                              <ul className="space-y-1">
                                {feedback.strengths.map((strength, index) => (
                                  <li key={index} className="text-green-600 text-sm">• {strength}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h6 className="font-medium text-orange-700 mb-2">📈 Améliorations</h6>
                              <ul className="space-y-1">
                                {feedback.improvements.map((improvement, index) => (
                                  <li key={index} className="text-orange-600 text-sm">• {improvement}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-blue-700 text-sm"><strong>Conseil Luna:</strong> {feedback.nextSteps}</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="flex space-x-4">
                        <button
                          onClick={() => {
                            setUserAnswer('');
                            setFeedback(null);
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          🔄 Recommencer cette question
                        </button>
                        
                        {currentQuestionIndex < preparation.questions.length - 1 && (
                          <button
                            onClick={nextQuestion}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            ➡️ Question suivante
                          </button>
                        )}
                        
                        {currentQuestionIndex === preparation.questions.length - 1 && (
                          <button
                            onClick={() => {
                              setPracticeMode(false);
                              setActiveTab('questions');
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                          >
                            🎉 Terminer la pratique
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default InterviewMasteryTab;