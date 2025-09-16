import React, { memo, useState, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '../../../shared/ui/card';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AnimatedGradient } from '../../../shared/components/AnimatedGradient';

interface NegotiationScenario {
  id: string;
  title: string;
  context: string;
  stakeholders: string[];
  objectives: string[];
  challenges: string[];
  tactics: string[];
  pitfalls: string[];
  successMetrics: string[];
}

interface NegotiationAnalysis {
  scenario: string;
  userStrategy: string;
  analysis: {
    strengths: string[];
    weaknesses: string[];
    effectiveness: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    alternativeApproaches: string[];
    outcomePredict: string;
  };
  improvement: {
    tacticalAdjustments: string[];
    communicationTips: string[];
    psychologyInsights: string[];
  };
}

export const NegotiationSkillsTab = memo(() => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NegotiationAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('scenarios');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [userStrategy, setUserStrategy] = useState('');

  const negotiationScenarios: NegotiationScenario[] = [
    {
      id: 'salary_negotiation',
      title: 'Négociation Salariale',
      context: 'Vous avez reçu une offre d\'emploi attractive mais le salaire proposé est 15% en dessous de vos attentes et du marché.',
      stakeholders: ['Vous', 'RH Manager', 'Hiring Manager', 'Budget Owner'],
      objectives: [
        'Obtenir une augmentation salariale de 10-15%',
        'Maintenir une relation positive',
        'Sécuriser des avantages compensatoires si besoin',
        'Préserver l\'opportunité d\'emploi'
      ],
      challenges: [
        'Budget potentiellement fixe',
        'Concurrence avec autres candidats',
        'Risque de paraître trop gourmand',
        'Timing délicat dans le processus'
      ],
      tactics: [
        'Recherche salariale préalable approfondie',
        'Mise en avant de la valeur apportée',
        'Négociation package global (formation, télétravail)',
        'Technique de l\'ancrage avec justification',
        'Demande de révision à 6 mois si budget contraint'
      ],
      pitfalls: [
        'Négocier trop tôt dans le processus',
        'Se focaliser uniquement sur l\'argent',
        'Donner un ultimatum',
        'Ne pas avoir de plan B'
      ],
      successMetrics: [
        'Augmentation obtenue >= 8%',
        'Relation préservée avec futurs collègues',
        'Avantages additionnels négociés',
        'Timeline de révision établie'
      ]
    },
    {
      id: 'project_scope',
      title: 'Négociation Périmètre Projet',
      context: 'Votre client demande des fonctionnalités supplémentaires importantes sans ajustement de budget ni timeline.',
      stakeholders: ['Vous', 'Client/Sponsor', 'Équipe projet', 'Management interne'],
      objectives: [
        'Préserver la qualité du livrable',
        'Maintenir la rentabilité',
        'Éviter le scope creep',
        'Garder la satisfaction client'
      ],
      challenges: [
        'Pression temporelle et budgétaire',
        'Relation client à préserver',
        'Équipe déjà sous tension',
        'Concurrence potentielle'
      ],
      tactics: [
        'Documentation précise des demandes',
        'Présentation des impacts (coût/délai/qualité)',
        'Proposition d\'alternatives créatives',
        'Phasage du projet en sprints',
        'Clause de révision contractuelle'
      ],
      pitfalls: [
        'Accepter sans évaluation',
        'Refus catégorique sans alternative',
        'Sous-estimer les impacts',
        'Communication uniquement par email'
      ],
      successMetrics: [
        'Scope clairement redéfini',
        'Budget/timeline ajustés',
        'Client comprend les trade-offs',
        'Équipe projet soulagée'
      ]
    },
    {
      id: 'vendor_contract',
      title: 'Négociation Contrat Fournisseur',
      context: 'Vous négociez un contrat annuel crucial avec un fournisseur qui a augmenté ses tarifs de 20% et durci ses conditions.',
      stakeholders: ['Vous', 'Account Manager fournisseur', 'Legal teams', 'Procurement'],
      objectives: [
        'Réduire l\'impact de l\'augmentation',
        'Obtenir des garanties de service',
        'Flexibilité contractuelle',
        'Protection contre futures hausses'
      ],
      challenges: [
        'Position de force du fournisseur',
        'Coût de changement élevé',
        'Urgence de renouvellement',
        'Contraintes budgétaires internes'
      ],
      tactics: [
        'Analyse comparative avec concurrents',
        'Mise en avant du volume/fidélité',
        'Négociation par blocs de services',
        'Clauses d\'indexation contrôlées',
        'SLA renforcés avec pénalités'
      ],
      pitfalls: [
        'Accepter la première offre',
        'Menacer sans alternative crédible',
        'Négliger les clauses de sortie',
        'Focalisation sur le prix uniquement'
      ],
      successMetrics: [
        'Réduction >= 10% vs offre initiale',
        'SLA améliorés',
        'Flexibilité contractuelle obtenue',
        'Clause de révision négociée'
      ]
    },
    {
      id: 'internal_resources',
      title: 'Négociation Ressources Internes',
      context: 'Vous devez obtenir 2 développeurs seniors supplémentaires pour votre projet critique alors que toutes les équipes sont surchargées.',
      stakeholders: ['Vous', 'Managers autres équipes', 'CTO', 'Project Sponsors'],
      objectives: [
        'Sécuriser les ressources nécessaires',
        'Minimiser l\'impact sur autres projets',
        'Maintenir les relations inter-équipes',
        'Respecter les délais projet'
      ],
      challenges: [
        'Ressources limitées et disputées',
        'Priorités conflictuelles',
        'Résistance managériale',
        'Implications politiques'
      ],
      tactics: [
        'Business case avec ROI clair',
        'Proposition de partage/rotation',
        'Compensation/échange de ressources',
        'Escalade stratégique si nécessaire',
        'Timeline flexible négociée'
      ],
      pitfalls: [
        'Demander sans proposer de contrepartie',
        'Bypasser les managers',
        'Sous-estimer les enjeux politiques',
        'Ne pas impliquer les équipes concernées'
      ],
      successMetrics: [
        'Ressources allouées (même partiellement)',
        'Accord sur la priorisation',
        'Relations préservées',
        'Plan B établi'
      ]
    }
  ];

  const negotiationPrinciples = [
    {
      category: 'Préparation',
      principles: [
        'Connaître son BATNA (Best Alternative)',
        'Rechercher les intérêts cachés des parties',
        'Définir ses limites non-négociables',
        'Préparer plusieurs scénarios'
      ]
    },
    {
      category: 'Communication',
      principles: [
        'Écouter plus que parler (règle 70/30)',
        'Poser des questions ouvertes',
        'Reformuler pour valider la compréhension',
        'Utiliser le silence stratégiquement'
      ]
    },
    {
      category: 'Tactiques',
      principles: [
        'Ancrer avec une première offre forte',
        'Négocier plusieurs variables simultanément',
        'Créer de la valeur avant de la répartir',
        'Utiliser le timing à son avantage'
      ]
    },
    {
      category: 'Psychologie',
      principles: [
        'Comprendre les biais cognitifs',
        'Gérer ses émotions et celles des autres',
        'Construire la confiance et le rapport',
        'Savoir quand faire des concessions'
      ]
    }
  ];

  const analyzeNegotiation = useCallback(async () => {
    if (!selectedScenario || !userStrategy.trim()) return;
    
    setIsAnalyzing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const scenario = negotiationScenarios.find(s => s.id === selectedScenario);
    
    const mockAnalysis: NegotiationAnalysis = {
      scenario: scenario?.title || '',
      userStrategy: userStrategy,
      analysis: {
        strengths: [
          'Approche structurée et méthodique',
          'Prise en compte des intérêts multiples',
          'Préparation d\'alternatives créatives',
          'Focus sur la relation long terme'
        ],
        weaknesses: [
          'Manque de techniques d\'ancrage',
          'Pas assez de focus sur le BATNA',
          'Communication trop directe',
          'Timeline pas assez exploitée'
        ],
        effectiveness: Math.round(70 + Math.random() * 25),
        riskLevel: Math.random() > 0.6 ? 'Low' : Math.random() > 0.3 ? 'Medium' : 'High',
        alternativeApproaches: [
          'Commencer par construire plus de rapport',
          'Utiliser l\'écoute active pour découvrir les vrais enjeux',
          'Proposer des options à valeur ajoutée mutuelle',
          'Établir des critères objectifs de décision'
        ],
        outcomePredict: 'Succès probable avec quelques ajustements tactiques. Relation préservée.'
      },
      improvement: {
        tacticalAdjustments: [
          'Ancrer plus fermement avec votre première proposition',
          'Préparer 3-4 concessions graduelles',
          'Utiliser des silences stratégiques après vos propositions',
          'Négocier le timing en votre faveur'
        ],
        communicationTips: [
          'Reformuler leurs besoins avant de proposer',
          'Utiliser "Si... alors..." pour les propositions conditionnelles',
          'Poser plus de questions pour comprendre leurs contraintes',
          'Terminer chaque point par une validation'
        ],
        psychologyInsights: [
          'Identifiez leur style de décision (analytique/relationnel)',
          'Utilisez la réciprocité après leurs concessions',
          'Gérez l\'urgence sans vous laisser presser',
          'Maintenez une posture collaborative mais ferme'
        ]
      }
    };
    
    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
  }, [selectedScenario, userStrategy, negotiationScenarios]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      case 'High': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tabConfig = [
    { id: 'scenarios', label: 'Scénarios', icon: '🎭' },
    { id: 'principles', label: 'Principes', icon: '📚' },
    { id: 'simulator', label: 'Simulateur', icon: '🎯' },
    { id: 'toolkit', label: 'Boîte à Outils', icon: '🧰' }
  ];

  if (isAnalyzing) {
    return (
      <Card className="relative h-[600px] overflow-hidden">
        <AnimatedGradient className="absolute inset-0 opacity-5" />
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <LoadingSpinner className="mx-auto w-12 h-12" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Analyse négociation en cours...</h3>
              <p className="text-gray-600 max-w-md">
                Luna évalue votre stratégie et propose des améliorations tactiques
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

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          {negotiationScenarios.map((scenario) => (
            <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-800">{scenario.title}</h3>
                <p className="text-gray-600">{scenario.context}</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">👥 Parties prenantes</h4>
                      <div className="flex flex-wrap gap-2">
                        {scenario.stakeholders.map((stakeholder, index) => (
                          <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
                            {stakeholder}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">🎯 Objectifs</h4>
                      <ul className="space-y-1">
                        {scenario.objectives.map((objective, index) => (
                          <li key={index} className="text-green-600 text-sm flex items-start space-x-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2">⚠️ Défis</h4>
                      <ul className="space-y-1">
                        {scenario.challenges.map((challenge, index) => (
                          <li key={index} className="text-orange-600 text-sm flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-purple-700 mb-2">🧠 Tactiques recommandées</h4>
                      <ul className="space-y-1">
                        {scenario.tactics.map((tactic, index) => (
                          <li key={index} className="text-purple-600 text-sm flex items-start space-x-2">
                            <span className="text-purple-500 mt-1">✓</span>
                            <span>{tactic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">🚫 Pièges à éviter</h4>
                      <ul className="space-y-1">
                        {scenario.pitfalls.map((pitfall, index) => (
                          <li key={index} className="text-red-600 text-sm flex items-start space-x-2">
                            <span className="text-red-500 mt-1">✗</span>
                            <span>{pitfall}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-indigo-700 mb-2">📏 Mesures de succès</h4>
                      <ul className="space-y-1">
                        {scenario.successMetrics.map((metric, index) => (
                          <li key={index} className="text-indigo-600 text-sm flex items-start space-x-2">
                            <span className="text-indigo-500 mt-1">📊</span>
                            <span>{metric}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Principles Tab */}
      {activeTab === 'principles' && (
        <div className="grid md:grid-cols-2 gap-6">
          {negotiationPrinciples.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-800">{category.category}</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {category.principles.map((principle, index) => (
                    <li key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-emerald-500 font-bold">{index + 1}</span>
                      <span className="text-gray-700">{principle}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Simulator Tab */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Simulateur de Négociation</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choisissez un scénario
                  </label>
                  <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Sélectionnez un scénario...</option>
                    {negotiationScenarios.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedScenario && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Contexte du scénario</h4>
                    <p className="text-blue-700">
                      {negotiationScenarios.find(s => s.id === selectedScenario)?.context}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre stratégie de négociation
                  </label>
                  <textarea
                    value={userStrategy}
                    onChange={(e) => setUserStrategy(e.target.value)}
                    placeholder="Décrivez votre approche: préparation, tactiques, arguments clés, concessions possibles..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <button
                  onClick={analyzeNegotiation}
                  disabled={!selectedScenario || !userStrategy.trim()}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  🎯 Analyser ma stratégie
                </button>
              </div>
            </CardContent>
          </Card>
          
          {/* Analysis Results */}
          {analysis && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Analyse: {analysis.scenario}</h3>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.analysis.riskLevel)}`}>
                      Risque: {analysis.analysis.riskLevel}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      Efficacité: {analysis.analysis.effectiveness}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">📝 Votre stratégie</h4>
                    <p className="text-gray-700 italic">{analysis.userStrategy}</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-green-700 mb-3">✅ Points forts</h4>
                      <ul className="space-y-2">
                        {analysis.analysis.strengths.map((strength, index) => (
                          <li key={index} className="text-green-600 text-sm flex items-start space-x-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-orange-700 mb-3">📈 Axes d'amélioration</h4>
                      <ul className="space-y-2">
                        {analysis.analysis.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-orange-600 text-sm flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">!</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">🔮 Prédiction de résultat</h4>
                    <p className="text-purple-700">{analysis.analysis.outcomePredict}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-700 mb-3">🔄 Approches alternatives</h4>
                    <ul className="space-y-2">
                      {analysis.analysis.alternativeApproaches.map((approach, index) => (
                        <li key={index} className="text-blue-600 text-sm flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span>{approach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-emerald-700 mb-3">⚡ Ajustements tactiques</h4>
                      <ul className="space-y-1">
                        {analysis.improvement.tacticalAdjustments.map((adjustment, index) => (
                          <li key={index} className="text-emerald-600 text-sm">• {adjustment}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-indigo-700 mb-3">💬 Communication</h4>
                      <ul className="space-y-1">
                        {analysis.improvement.communicationTips.map((tip, index) => (
                          <li key={index} className="text-indigo-600 text-sm">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-pink-700 mb-3">🧠 Psychologie</h4>
                      <ul className="space-y-1">
                        {analysis.improvement.psychologyInsights.map((insight, index) => (
                          <li key={index} className="text-pink-600 text-sm">• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Toolkit Tab */}
      {activeTab === 'toolkit' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-800">📋 Checklist Pré-négociation</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    'Définir votre BATNA (meilleure alternative)',
                    'Rechercher les contraintes de la partie adverse',
                    'Préparer 3 scénarios (optimiste, réaliste, pessimiste)',
                    'Identifier vos limites non-négociables',
                    'Lister les variables négociables',
                    'Préparer vos arguments avec preuves',
                    'Anticiper leurs objections principales',
                    'Choisir le bon timing et lieu'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-800">💬 Phrases Clés</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">🎯 Ouverture</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="text-blue-600">• "Quels sont vos objectifs prioritaires?"</li>
                      <li className="text-blue-600">• "Comment voyez-vous une solution gagnant-gagnant?"</li>
                      <li className="text-blue-600">• "Qu'est-ce qui serait idéal pour vous?"</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">🤝 Proposition</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="text-green-600">• "Si nous pouvions..., seriez-vous prêt à...?"</li>
                      <li className="text-green-600">• "Voici ce que je propose..."</li>
                      <li className="text-green-600">• "Considérez cette option..."</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-700 mb-2">⏸️ Pause</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="text-orange-600">• "Laissez-moi réfléchir à cela..."</li>
                      <li className="text-orange-600">• "C'est une option intéressante..."</li>
                      <li className="text-orange-600">• "J'ai besoin de consulter mon équipe"</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-700 mb-2">🎯 Clôture</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="text-purple-600">• "Récapitulons ce sur quoi nous sommes d'accord"</li>
                      <li className="text-purple-600">• "Quelles sont les prochaines étapes?"</li>
                      <li className="text-purple-600">• "Quand pouvons-nous finaliser cela?"</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">🎭 Styles de Négociateur</h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  {
                    type: 'Analytique',
                    traits: ['Données', 'Logique', 'Preuves'],
                    approach: 'Préparer des faits et chiffres détaillés'
                  },
                  {
                    type: 'Relationnel',
                    traits: ['Harmonie', 'Consensus', 'Équipe'],
                    approach: 'Construire la confiance avant de négocier'
                  },
                  {
                    type: 'Directeur',
                    traits: ['Efficacité', 'Résultats', 'Contrôle'],
                    approach: 'Aller droit au but avec des options claires'
                  },
                  {
                    type: 'Expressif',
                    traits: ['Vision', 'Innovation', 'Créativité'],
                    approach: 'Présenter des scénarios inspirants'
                  }
                ].map((style) => (
                  <div key={style.type} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">{style.type}</h4>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {style.traits.map((trait, index) => (
                          <span key={index} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs">
                            {trait}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm">{style.approach}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});

export default NegotiationSkillsTab;