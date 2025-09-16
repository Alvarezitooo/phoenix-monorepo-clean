import React, { memo, useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../shared/ui/card';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AnimatedGradient } from '../../../shared/components/AnimatedGradient';

interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  structure: string[];
  example: string;
  useCase: string;
  tips: string[];
  powerWords: string[];
}

interface PersonalStory {
  id: string;
  title: string;
  template: string;
  content: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  impact_score: number;
  feedback: string[];
  improvements: string[];
}

interface StorytellingAnalysis {
  stories: PersonalStory[];
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  narrativeStyle: string;
  communicationProfile: {
    clarity: number;
    engagement: number;
    authenticity: number;
    impact: number;
  };
}

export const StorytellingExcellenceTab = memo(() => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<StorytellingAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [currentStory, setCurrentStory] = useState<PersonalStory | null>(null);
  const [storyForm, setStoryForm] = useState({
    title: '',
    template: 'star',
    situation: '',
    task: '',
    action: '',
    result: ''
  });

  const storyTemplates: StoryTemplate[] = [
    {
      id: 'star',
      name: 'Méthode STAR',
      description: 'Structure classique pour entretiens comportementaux',
      structure: ['Situation', 'Task (Tâche)', 'Action', 'Result (Résultat)'],
      example: 'Situation: Dans mon précédent poste... Task: Je devais... Action: J\'ai... Result: Le résultat a été...',
      useCase: 'Entretiens d\'embauche, évaluations de performance',
      tips: [
        'Soyez spécifique et concret',
        'Quantifiez les résultats',
        'Mettez l\'accent sur vos actions',
        'Choisissez des exemples récents'
      ],
      powerWords: ['Dirigé', 'Optimisé', 'Résolu', 'Amélioré', 'Créé', 'Géré']
    },
    {
      id: 'problem_solution',
      name: 'Problème-Solution',
      description: 'Met l\'accent sur votre capacité à résoudre des défis',
      structure: ['Problème identifié', 'Analyse', 'Solution mise en place', 'Impact'],
      example: 'Nous faisions face à... J\'ai analysé... J\'ai mis en place... L\'impact a été...',
      useCase: 'Postes techniques, consulting, leadership',
      tips: [
        'Commencez par le problème pour créer de la tension',
        'Montrez votre processus de réflexion',
        'Détaillez votre solution unique',
        'Mesurez l\'impact de votre intervention'
      ],
      powerWords: ['Diagnostiqué', 'Innové', 'Transformé', 'Révolutionné', 'Surmonté']
    },
    {
      id: 'before_after',
      name: 'Avant-Après',
      description: 'Montre votre impact transformationnel',
      structure: ['État initial', 'Votre intervention', 'État final', 'Leçons apprises'],
      example: 'Avant mon arrivée... J\'ai entrepris... Maintenant... J\'ai appris que...',
      useCase: 'Postes de transformation, management, projets d\'amélioration',
      tips: [
        'Peignez un contraste saisissant',
        'Utilisez des métriques concrètes',
        'Mettez votre rôle en valeur',
        'Terminez par les apprentissages'
      ],
      powerWords: ['Transformé', 'Révolutionné', 'Modernisé', 'Optimisé', 'Restructuré']
    },
    {
      id: 'hero_journey',
      name: 'Parcours du Héros',
      description: 'Structure narrative engageante pour présentation personnelle',
      structure: ['Appel à l\'aventure', 'Défis rencontrés', 'Transformation', 'Sagesse acquise'],
      example: 'Quand j\'ai découvert... J\'ai dû faire face à... Cette expérience m\'a transformé... Maintenant je sais...',
      useCase: 'Pitch personnel, présentation de carrière, storytelling inspirant',
      tips: [
        'Créez de l\'émotion et de l\'engagement',
        'Montrez votre évolution personnelle',
        'Inspirez votre audience',
        'Connectez à votre mission actuelle'
      ],
      powerWords: ['Découvert', 'Évolué', 'Inspiré', 'Guidé', 'Motivé', 'Transformé']
    },
    {
      id: 'challenge_growth',
      name: 'Défi-Croissance',
      description: 'Focus sur l\'apprentissage et le développement',
      structure: ['Défi initial', 'Difficultés rencontrées', 'Apprentissages', 'Croissance personnelle'],
      example: 'Je me suis retrouvé face à... Les difficultés principales étaient... J\'ai appris... Cette expérience m\'a fait grandir...',
      useCase: 'Questions sur les échecs, développement personnel, résilience',
      tips: [
        'Montrez votre capacité d\'adaptation',
        'Soyez vulnérable mais positif',
        'Mettez l\'accent sur l\'apprentissage',
        'Démontrez votre croissance'
      ],
      powerWords: ['Appris', 'Adapté', 'Développé', 'Renforcé', 'Évolué', 'Progressé']
    },
    {
      id: 'vision_execution',
      name: 'Vision-Exécution',
      description: 'Idéal pour postes de leadership et d\'innovation',
      structure: ['Vision/Idée', 'Planification', 'Exécution', 'Résultats et impact'],
      example: 'J\'avais la vision de... J\'ai planifié... L\'exécution s\'est déroulée... Les résultats ont dépassé...',
      useCase: 'Postes de direction, innovation, entrepreneuriat',
      tips: [
        'Articulez clairement votre vision',
        'Montrez vos capacités de planification',
        'Détaillez votre exécution méthodique',
        'Quantifiez l\'impact final'
      ],
      powerWords: ['Imaginé', 'Conceptualisé', 'Orchestré', 'Livré', 'Réalisé', 'Concrétisé']
    }
  ];

  const generateStorytellingAnalysis = useCallback(async () => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockAnalysis: StorytellingAnalysis = {
      stories: [
        {
          id: '1',
          title: 'Transformation digitale équipe',
          template: 'problem_solution',
          content: {
            situation: 'Mon équipe utilisait encore des processus manuels obsolètes, causant des retards de 40% sur nos projets',
            task: 'Je devais moderniser nos workflows sans perturber la productivité existante',
            action: 'J\'ai analysé les points de friction, formé l\'équipe sur de nouveaux outils, et mis en place une transition progressive',
            result: 'Réduction de 60% du temps de traitement et amélioration de 85% de la satisfaction équipe'
          },
          impact_score: 89,
          feedback: [
            'Structure STAR parfaitement respectée',
            'Résultats quantifiés et impressionnants',
            'Montre leadership et vision stratégique'
          ],
          improvements: [
            'Ajouter plus de détails sur la résistance au changement',
            'Mentionner les défis spécifiques rencontrés',
            'Expliquer comment vous avez mesuré le succès'
          ]
        },
        {
          id: '2',
          title: 'Innovation produit breakthrough',
          template: 'vision_execution',
          content: {
            situation: 'Notre principal produit stagnait face à la concurrence avec un taux de croissance de seulement 2%',
            task: 'Identifier et développer une innovation majeure pour relancer la croissance',
            action: 'J\'ai mené des interviews clients, identifié un besoin non adressé, et dirigé le développement d\'une fonctionnalité révolutionnaire',
            result: 'Lancement réussi générant 35% de croissance additionnelle et acquisition de 12 000 nouveaux clients'
          },
          impact_score: 92,
          feedback: [
            'Excellent storytelling avec tension et résolution',
            'Impact business clairement démontré',
            'Approche méthodique bien articulée'
          ],
          improvements: [
            'Détailler davantage le processus d\'innovation',
            'Mentionner l\'équipe et la collaboration',
            'Ajouter le timeline du projet'
          ]
        }
      ],
      overallScore: 87,
      strengths: [
        'Excellente structure narrative',
        'Résultats toujours quantifiés',
        'Exemples concrets et percutants',
        'Bon équilibre défis/solutions'
      ],
      weaknesses: [
        'Pourrait ajouter plus d\'émotion',
        'Manque parfois de détails sur l\'équipe',
        'Timeline pas toujours claire'
      ],
      recommendations: [
        'Intégrer plus de storytelling émotionnel',
        'Développer des exemples d\'échecs instructifs',
        'Pratiquer la concision pour formats courts',
        'Adapter le style selon l\'audience'
      ],
      narrativeStyle: 'Orienté résultats avec approche analytique',
      communicationProfile: {
        clarity: 85,
        engagement: 78,
        authenticity: 82,
        impact: 90
      }
    };
    
    setAnalysis(mockAnalysis);
    setIsGenerating(false);
  }, []);

  const createStory = useCallback(() => {
    if (!storyForm.title || !storyForm.situation) return;
    
    // Simulate story creation and analysis
    const newStory: PersonalStory = {
      id: Date.now().toString(),
      title: storyForm.title,
      template: storyForm.template,
      content: {
        situation: storyForm.situation,
        task: storyForm.task,
        action: storyForm.action,
        result: storyForm.result
      },
      impact_score: Math.round(70 + Math.random() * 25),
      feedback: [
        'Structure narrative bien respectée',
        'Exemple concret et pertinent',
        'Résultats clairement exprimés'
      ],
      improvements: [
        'Ajouter plus de détails sur les défis',
        'Quantifier davantage les résultats',
        'Personnaliser pour l\'audience cible'
      ]
    };
    
    setCurrentStory(newStory);
    
    // Reset form
    setStoryForm({
      title: '',
      template: 'star',
      situation: '',
      task: '',
      action: '',
      result: ''
    });
  }, [storyForm]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const tabConfig = [
    { id: 'templates', label: 'Templates', icon: '📝' },
    { id: 'builder', label: 'Créateur', icon: '🏗️' },
    { id: 'analysis', label: 'Analyse', icon: '📊' },
    { id: 'practice', label: 'Entraînement', icon: '🎭' }
  ];

  if (isGenerating) {
    return (
      <Card className="relative h-[600px] overflow-hidden">
        <AnimatedGradient className="absolute inset-0 opacity-5" />
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <LoadingSpinner className="mx-auto w-12 h-12" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Analyse storytelling en cours...</h3>
              <p className="text-gray-600 max-w-md">
                Luna évalue vos narratives et identifie les axes d'amélioration
              </p>
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
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
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {storyTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                    <p className="text-gray-600">{template.description}</p>
                  </div>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {template.useCase.split(',')[0]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-700 mb-3">📋 Structure</h4>
                    <ol className="space-y-2">
                      {template.structure.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-blue-600 text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                    
                    <h4 className="font-medium text-green-700 mb-3 mt-4">💡 Conseils</h4>
                    <ul className="space-y-1">
                      {template.tips.map((tip, index) => (
                        <li key={index} className="text-green-600 text-sm flex items-start space-x-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-700 mb-3">💬 Exemple</h4>
                    <p className="text-purple-600 text-sm bg-purple-50 p-3 rounded-lg mb-4 italic">
                      {template.example}
                    </p>
                    
                    <h4 className="font-medium text-orange-700 mb-3">⚡ Mots de pouvoir</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.powerWords.map((word, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                    
                    <h4 className="font-medium text-gray-700 mb-2 mt-4">🎯 Cas d'usage</h4>
                    <p className="text-gray-600 text-sm">{template.useCase}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Créateur d'Histoire Personnelle</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de l'histoire
                  </label>
                  <input
                    type="text"
                    value={storyForm.title}
                    onChange={(e) => setStoryForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Ma plus grande réussite professionnelle"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template à utiliser
                  </label>
                  <select
                    value={storyForm.template}
                    onChange={(e) => setStoryForm(prev => ({ ...prev, template: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {storyTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Dynamic form based on selected template */}
              {storyForm.template === 'star' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📍 Situation (Contexte)
                    </label>
                    <textarea
                      value={storyForm.situation}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, situation: e.target.value }))}
                      placeholder="Décrivez le contexte dans lequel vous vous trouviez..."
                      className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Tâche (Objectif)
                    </label>
                    <textarea
                      value={storyForm.task}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, task: e.target.value }))}
                      placeholder="Quelle était votre mission ou objectif..."
                      className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⚡ Action (Ce que vous avez fait)
                    </label>
                    <textarea
                      value={storyForm.action}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, action: e.target.value }))}
                      placeholder="Décrivez précisément les actions que vous avez entreprises..."
                      className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎉 Résultat (Impact obtenu)
                    </label>
                    <textarea
                      value={storyForm.result}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, result: e.target.value }))}
                      placeholder="Quels ont été les résultats concrets et mesurables..."
                      className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}
              
              <button
                onClick={createStory}
                disabled={!storyForm.title || !storyForm.situation}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                🏗️ Créer et analyser mon histoire
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show created story */}
      {currentStory && activeTab === 'builder' && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Histoire créée: {currentStory.title}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(currentStory.impact_score)}`}>
                {currentStory.impact_score}/100
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">📖 Votre histoire</h4>
                <div className="space-y-3">
                  <p><strong>Situation:</strong> {currentStory.content.situation}</p>
                  <p><strong>Tâche:</strong> {currentStory.content.task}</p>
                  <p><strong>Action:</strong> {currentStory.content.action}</p>
                  <p><strong>Résultat:</strong> {currentStory.content.result}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-700 mb-3">✅ Points forts</h4>
                  <ul className="space-y-2">
                    {currentStory.feedback.map((item, index) => (
                      <li key={index} className="text-green-600 text-sm flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-orange-700 mb-3">📈 Améliorations</h4>
                  <ul className="space-y-2">
                    {currentStory.improvements.map((item, index) => (
                      <li key={index} className="text-orange-600 text-sm flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && !analysis && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Analyse de vos Compétences Narratives</h3>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Évaluez votre storytelling professionnel
              </h4>
              <p className="text-gray-600 mb-6">
                Luna analysera vos histoires existantes et vous donnera un feedback personnalisé
              </p>
              <button
                onClick={generateStorytellingAnalysis}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                🔍 Analyser mes compétences narratives
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {activeTab === 'analysis' && analysis && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Profil Storytelling</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.overallScore)}`}>
                  Score global: {analysis.overallScore}/100
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">🎭 Style narratif</h4>
                  <p className="text-blue-700">{analysis.narrativeStyle}</p>
                </div>
                
                <div className="grid md:grid-cols-4 gap-4">
                  {Object.entries(analysis.communicationProfile).map(([skill, score]) => (
                    <div key={skill} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`text-2xl font-bold mb-1 ${
                        score >= 85 ? 'text-green-600' :
                        score >= 70 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {score}%
                      </div>
                      <div className="text-sm text-gray-600 capitalize">{skill}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            score >= 85 ? 'bg-green-500' :
                            score >= 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-700 mb-3">🌟 Points forts</h4>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
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
                      {analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-orange-600 text-sm flex items-start space-x-2">
                          <span className="text-orange-500 mt-1">!</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-3">💡 Recommandations Luna</h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-purple-700 text-sm flex items-start space-x-2">
                        <span className="text-purple-500 mt-1">➤</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Vos Histoires Analysées</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analysis.stories.map((story) => (
                  <div key={story.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-800">{story.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(story.impact_score)}`}>
                        {story.impact_score}/100
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid gap-3 text-sm">
                        <p><strong>Situation:</strong> {story.content.situation}</p>
                        <p><strong>Tâche:</strong> {story.content.task}</p>
                        <p><strong>Action:</strong> {story.content.action}</p>
                        <p><strong>Résultat:</strong> {story.content.result}</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">✅ Réussites</h5>
                        <ul className="space-y-1">
                          {story.feedback.map((item, index) => (
                            <li key={index} className="text-green-600 text-sm">• {item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-orange-700 mb-2">📈 À améliorer</h5>
                        <ul className="space-y-1">
                          {story.improvements.map((item, index) => (
                            <li key={index} className="text-orange-600 text-sm">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Practice Tab */}
      {activeTab === 'practice' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Entraînement Storytelling</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-4">🎯 Exercices Quotidiens</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-blue-700 text-sm">Raconter une anecdote professionnelle en 2 minutes</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-blue-700 text-sm">Pratiquer 3 histoires STAR différentes</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-blue-700 text-sm">Enregistrer et analyser sa présentation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-blue-700 text-sm">Adapter une histoire selon l'audience</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-4">📈 Progression Hebdomadaire</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 text-sm">Clarté du message</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 text-sm">Engagement audience</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">78%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 text-sm">Impact émotionnel</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">72%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 text-sm">Concision</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">81%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-4">🎭 Challenges Storytelling</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl mb-2">⏱️</div>
                    <h5 className="font-medium text-gray-800 mb-2">Speed Storytelling</h5>
                    <p className="text-gray-600 text-sm">Racontez votre histoire en 60 secondes</p>
                    <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                      Commencer
                    </button>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl mb-2">🎯</div>
                    <h5 className="font-medium text-gray-800 mb-2">Adaptation Audience</h5>
                    <p className="text-gray-600 text-sm">Même histoire, 3 audiences différentes</p>
                    <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                      Essayer
                    </button>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl mb-2">💭</div>
                    <h5 className="font-medium text-gray-800 mb-2">Improvisation</h5>
                    <p className="text-gray-600 text-sm">Histoire spontanée sur thème donné</p>
                    <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                      Improviser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default StorytellingExcellenceTab;