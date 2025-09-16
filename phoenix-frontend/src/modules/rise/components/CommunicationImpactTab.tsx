import React, { useState, useCallback, memo } from 'react';
import { AnimatedGradient } from '../../../shared/components/AnimatedGradient';

interface PersuasionTechnique {
  id: string;
  name: string;
  category: 'Logique' | 'Émotion' | 'Éthique' | 'Psychologie';
  description: string;
  example: string;
  effectiveness: number;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  applicationContext: string[];
}

interface InfluenceStrategy {
  id: string;
  name: string;
  type: 'Directe' | 'Indirecte' | 'Collaborative' | 'Inspirante';
  description: string;
  steps: string[];
  bestFor: string[];
  avoidWhen: string[];
}

interface CommunicationAssessment {
  clarity: number;
  persuasion: number;
  empathy: number;
  authority: number;
  adaptability: number;
  nonVerbal: number;
}

interface CommunicationGoals {
  audience: string;
  objective: string;
  context: string;
  timeframe: string;
  constraints: string;
}

const CommunicationImpactTab: React.FC = memo(() => {
  const [activeTab, setActiveTab] = useState<'techniques' | 'strategies' | 'assessment' | 'coach'>('techniques');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [communicationGoals, setCommunicationGoals] = useState<CommunicationGoals>({
    audience: '',
    objective: '',
    context: '',
    timeframe: '',
    constraints: ''
  });

  const persuasionTechniques: PersuasionTechnique[] = [
    {
      id: 'reciprocity',
      name: 'Réciprocité',
      category: 'Psychologie',
      description: 'Les gens ont tendance à rendre les faveurs reçues',
      example: 'Offrir de l\'aide ou des conseils gratuits avant de faire une demande',
      effectiveness: 85,
      difficulty: 'Débutant',
      applicationContext: ['Négociation', 'Vente', 'Leadership', 'Networking']
    },
    {
      id: 'social_proof',
      name: 'Preuve Sociale',
      category: 'Psychologie',
      description: 'Utiliser des témoignages et références pour valider ses arguments',
      example: '"93% de nos clients ont vu une amélioration significative"',
      effectiveness: 78,
      difficulty: 'Débutant',
      applicationContext: ['Présentation', 'Marketing', 'Recrutement']
    },
    {
      id: 'storytelling_impact',
      name: 'Storytelling d\'Impact',
      category: 'Émotion',
      description: 'Utiliser des histoires pour créer une connexion émotionnelle',
      example: 'Partager un échec personnel transformé en apprentissage',
      effectiveness: 82,
      difficulty: 'Intermédiaire',
      applicationContext: ['Leadership', 'Formation', 'Motivation']
    },
    {
      id: 'scarcity',
      name: 'Rareté',
      category: 'Psychologie',
      description: 'Créer un sentiment d\'urgence ou d\'exclusivité',
      example: '"Cette opportunité n\'est disponible que pour 3 candidats"',
      effectiveness: 75,
      difficulty: 'Intermédiaire',
      applicationContext: ['Négociation', 'Vente', 'Opportunités']
    },
    {
      id: 'authority_positioning',
      name: 'Positionnement d\'Autorité',
      category: 'Éthique',
      description: 'Établir sa crédibilité par l\'expertise et l\'expérience',
      example: 'Présenter ses qualifications et succès pertinents',
      effectiveness: 88,
      difficulty: 'Avancé',
      applicationContext: ['Leadership', 'Consultation', 'Expertise']
    },
    {
      id: 'framing',
      name: 'Recadrage Cognitif',
      category: 'Logique',
      description: 'Présenter l\'information sous un angle favorable',
      example: '"Cette solution économise 20%" vs "Cette solution coûte 80%"',
      effectiveness: 80,
      difficulty: 'Avancé',
      applicationContext: ['Négociation', 'Présentation', 'Argumentation']
    }
  ];

  const influenceStrategies: InfluenceStrategy[] = [
    {
      id: 'consultative_approach',
      name: 'Approche Consultative',
      type: 'Collaborative',
      description: 'Impliquer la personne dans la réflexion pour qu\'elle arrive à votre conclusion',
      steps: [
        'Poser des questions ouvertes exploratoires',
        'Écouter activement les réponses',
        'Reformuler pour montrer la compréhension',
        'Guider vers les insights désirés',
        'Co-construire la solution'
      ],
      bestFor: ['Résistance au changement', 'Décisions complexes', 'Buy-in nécessaire'],
      avoidWhen: ['Urgence extrême', 'Contexte très hiérarchique', 'Personne fermée au dialogue']
    },
    {
      id: 'inspirational_vision',
      name: 'Vision Inspirante',
      type: 'Inspirante',
      description: 'Motiver par une vision positive et engageante du futur',
      steps: [
        'Peindre un futur désirable et concret',
        'Connecter aux valeurs personnelles',
        'Montrer le rôle clé de la personne',
        'Créer un sentiment d\'urgence positive',
        'Proposer les premiers pas'
      ],
      bestFor: ['Motivation d\'équipe', 'Changement organisationnel', 'Innovation'],
      avoidWhen: ['Contexte de crise', 'Personnes très analytiques', 'Problèmes techniques']
    },
    {
      id: 'logical_persuasion',
      name: 'Persuasion Logique',
      type: 'Directe',
      description: 'Convaincre par des arguments rationnels et des preuves',
      steps: [
        'Structurer l\'argumentation (problème-solution)',
        'Présenter des données probantes',
        'Anticiper les objections',
        'Proposer des alternatives',
        'Demander l\'engagement'
      ],
      bestFor: ['Décisions techniques', 'Personnes analytiques', 'Contexte professionnel'],
      avoidWhen: ['Décisions émotionnelles', 'Résistance forte', 'Manque de données']
    },
    {
      id: 'tactical_flexibility',
      name: 'Flexibilité Tactique',
      type: 'Indirecte',
      description: 'Adapter son approche en temps réel selon les réactions',
      steps: [
        'Observer les signaux non-verbaux',
        'Tester différentes approches',
        'Pivoter selon les réactions',
        'Utiliser les pauses stratégiques',
        'Conclure au bon moment'
      ],
      bestFor: ['Négociations complexes', 'Personnalités diverses', 'Enjeux élevés'],
      avoidWhen: ['Manque d\'expérience', 'Stress élevé', 'Time pressure']
    }
  ];

  const mockAssessment: CommunicationAssessment = {
    clarity: 82,
    persuasion: 75,
    empathy: 88,
    authority: 70,
    adaptability: 79,
    nonVerbal: 85
  };

  const handleAnalyzeCommunication = useCallback(async () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2500);
  }, []);

  const handleGoalsChange = useCallback((field: keyof CommunicationGoals, value: string) => {
    setCommunicationGoals(prev => ({ ...prev, [field]: value }));
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Bon';
    if (score >= 65) return 'Correct';
    return 'À améliorer';
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('techniques')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'techniques'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          Techniques Persuasion
        </button>
        <button
          onClick={() => setActiveTab('strategies')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'strategies'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          Stratégies Influence
        </button>
        <button
          onClick={() => setActiveTab('assessment')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'assessment'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          Évaluation
        </button>
        <button
          onClick={() => setActiveTab('coach')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'coach'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          Coach IA
        </button>
      </div>

      {/* Techniques Persuasion */}
      {activeTab === 'techniques' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">
              🎯 Techniques de Persuasion Avancées
            </h3>
            <p className="text-emerald-700">
              Maîtrisez les 6 techniques psychologiques les plus efficaces pour influencer positivement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {persuasionTechniques.map((technique) => (
              <div
                key={technique.id}
                onClick={() => setSelectedTechnique(selectedTechnique === technique.id ? null : technique.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedTechnique === technique.id
                    ? 'border-emerald-300 bg-emerald-50 shadow-md'
                    : 'border-gray-200 hover:border-emerald-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{technique.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      technique.category === 'Logique' ? 'bg-blue-100 text-blue-800' :
                      technique.category === 'Émotion' ? 'bg-pink-100 text-pink-800' :
                      technique.category === 'Éthique' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {technique.category}
                    </span>
                    <span className="text-emerald-600 font-medium">{technique.effectiveness}%</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3">{technique.description}</p>

                {selectedTechnique === technique.id && (
                  <div className="space-y-3 pt-3 border-t border-emerald-200">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Exemple d'Application</h5>
                      <p className="text-sm text-gray-600 italic">"{technique.example}"</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Contextes d'Usage</h5>
                      <div className="flex flex-wrap gap-1">
                        {technique.applicationContext.map((context) => (
                          <span key={context} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
                            {context}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Difficulté: {technique.difficulty}</span>
                      <span className="text-emerald-600 font-medium">Efficacité: {technique.effectiveness}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stratégies Influence */}
      {activeTab === 'strategies' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-xl border border-teal-200">
            <h3 className="text-lg font-semibold text-teal-800 mb-2">
              🧠 Stratégies d'Influence Sophistiquées
            </h3>
            <p className="text-teal-700">
              4 approches stratégiques pour maximiser votre impact dans toute situation
            </p>
          </div>

          <div className="space-y-4">
            {influenceStrategies.map((strategy) => (
              <div
                key={strategy.id}
                onClick={() => setSelectedStrategy(selectedStrategy === strategy.id ? null : strategy.id)}
                className={`p-5 border rounded-lg cursor-pointer transition-all ${
                  selectedStrategy === strategy.id
                    ? 'border-teal-300 bg-teal-50 shadow-md'
                    : 'border-gray-200 hover:border-teal-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{strategy.name}</h4>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                      strategy.type === 'Directe' ? 'bg-red-100 text-red-800' :
                      strategy.type === 'Indirecte' ? 'bg-blue-100 text-blue-800' :
                      strategy.type === 'Collaborative' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      Approche {strategy.type}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-teal-500 transition-transform ${
                      selectedStrategy === strategy.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <p className="text-gray-600 mb-4">{strategy.description}</p>

                {selectedStrategy === strategy.id && (
                  <div className="space-y-4 pt-4 border-t border-teal-200">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">🔄 Étapes Clés</h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        {strategy.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">✅ Idéal Pour</h5>
                        <ul className="space-y-1 text-sm">
                          {strategy.bestFor.map((item, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              <span className="text-gray-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-red-700 mb-2">❌ Éviter Quand</h5>
                        <ul className="space-y-1 text-sm">
                          {strategy.avoidWhen.map((item, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span className="text-gray-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Évaluation */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-xl border border-emerald-200">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">
              📊 Évaluation Communication Impact
            </h3>
            <p className="text-emerald-700">
              Analysez vos compétences actuelles et identifiez les axes d'amélioration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(mockAssessment).map(([skill, score]) => (
              <div key={skill} className="bg-white p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700 capitalize">
                    {skill === 'nonVerbal' ? 'Communication Non-Verbale' : skill}
                  </h4>
                  <span className={`font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <span className={`text-sm ${getScoreColor(score)}`}>
                  {getScoreLabel(score)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-4">🎯 Recommandations Personnalisées</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                <div>
                  <h5 className="font-medium text-gray-700">Renforcer votre Autorité</h5>
                  <p className="text-gray-600 text-sm">
                    Travaillez sur le positionnement d'expertise et l'utilisation de preuves sociales
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <h5 className="font-medium text-gray-700">Améliorer la Persuasion</h5>
                  <p className="text-gray-600 text-sm">
                    Pratiquez les techniques de recadrage et d'argumentation structurée
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                <div>
                  <h5 className="font-medium text-gray-700">Capitaliser sur l'Empathie</h5>
                  <p className="text-gray-600 text-sm">
                    Votre score élevé en empathie est un atout majeur - utilisez-le dans l'approche consultative
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coach IA */}
      {activeTab === 'coach' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-emerald-50 p-6 rounded-xl border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">
              🤖 Coach IA Communication
            </h3>
            <p className="text-purple-700">
              Obtenez des conseils personnalisés pour vos défis de communication
            </p>
          </div>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AnimatedGradient />
              <p className="text-gray-600 font-medium">Luna analyse votre situation...</p>
              <p className="text-gray-500 text-sm">Préparation de recommandations personnalisées</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-6 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-4">📋 Définir vos Objectifs</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audience cible
                    </label>
                    <input
                      type="text"
                      value={communicationGoals.audience}
                      onChange={(e) => handleGoalsChange('audience', e.target.value)}
                      placeholder="Ex: Équipe de développement, Comité de direction..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Objectif de communication
                    </label>
                    <input
                      type="text"
                      value={communicationGoals.objective}
                      onChange={(e) => handleGoalsChange('objective', e.target.value)}
                      placeholder="Ex: Obtenir l'approbation du budget, Motiver l'équipe..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contexte et enjeux
                    </label>
                    <textarea
                      value={communicationGoals.context}
                      onChange={(e) => handleGoalsChange('context', e.target.value)}
                      placeholder="Décrivez la situation, les enjeux, l'historique..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Délai
                      </label>
                      <input
                        type="text"
                        value={communicationGoals.timeframe}
                        onChange={(e) => handleGoalsChange('timeframe', e.target.value)}
                        placeholder="Ex: D'ici vendredi, Fin du mois..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraintes
                      </label>
                      <input
                        type="text"
                        value={communicationGoals.constraints}
                        onChange={(e) => handleGoalsChange('constraints', e.target.value)}
                        placeholder="Ex: Budget limité, Résistance au changement..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleAnalyzeCommunication}
                  disabled={!communicationGoals.audience || !communicationGoals.objective}
                  className="mt-6 w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Obtenir mes Recommandations IA
                </button>
              </div>

              {communicationGoals.audience && communicationGoals.objective && (
                <div className="bg-emerald-50 p-6 border border-emerald-200 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 mb-4">🎯 Stratégie Recommandée</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-emerald-700 mb-2">Approche Optimale</h5>
                      <p className="text-emerald-600 bg-white p-3 rounded border">
                        Approche Consultative avec intégration de Preuve Sociale
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium text-emerald-700 mb-2">Techniques Prioritaires</h5>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-emerald-200 text-emerald-800 text-sm rounded-full">
                          Questions Ouvertes
                        </span>
                        <span className="px-3 py-1 bg-emerald-200 text-emerald-800 text-sm rounded-full">
                          Storytelling d'Impact
                        </span>
                        <span className="px-3 py-1 bg-emerald-200 text-emerald-800 text-sm rounded-full">
                          Preuves Sociales
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-emerald-700 mb-2">Points d'Attention</h5>
                      <ul className="space-y-1 text-emerald-600">
                        <li>• Adapter le niveau technique au public cible</li>
                        <li>• Préparer des exemples concrets et mesurables</li>
                        <li>• Anticiper les objections principales</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CommunicationImpactTab.displayName = 'CommunicationImpactTab';

export default CommunicationImpactTab;