import React, { memo, useState, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '../../../shared/ui/card';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AnimatedGradient } from '../../../shared/components/AnimatedGradient';

interface BrandAnalysis {
  currentBrand: {
    strengths: string[];
    weaknesses: string[];
    uniqueValue: string;
    audiencePerception: string;
    consistencyScore: number;
    visibilityScore: number;
  };
  recommendations: {
    messaging: string[];
    content: string[];
    platforms: string[];
    networking: string[];
  };
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  competitorAnalysis: {
    name: string;
    strengths: string[];
    opportunities: string[];
  }[];
}

interface ContentIdea {
  platform: string;
  type: string;
  title: string;
  description: string;
  engagement: number;
  effort: 'Low' | 'Medium' | 'High';
  frequency: string;
}

export const PersonalBrandingTab = memo(() => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('assessment');
  const [brandingForm, setBrandingForm] = useState({
    industry: 'Tech',
    role: '',
    experience: 'intermediate',
    goals: [] as string[],
    currentPlatforms: [] as string[],
    personalityTraits: [] as string[],
    uniqueSkills: '',
    targetAudience: '',
    careerAspirations: ''
  });

  const brandingGoals = [
    'Reconnaissance expertise',
    'Opportunités emploi',
    'Speaking/Conférences',
    'Consulting/Freelance',
    'Leadership opinion',
    'Réseau professionnel',
    'Opportunités board',
    'Partenariats business'
  ];

  const platforms = [
    'LinkedIn',
    'Twitter',
    'Medium/Blog',
    'YouTube',
    'Instagram',
    'TikTok',
    'Podcast',
    'Newsletter'
  ];

  const personalityTraits = [
    'Analytique',
    'Créatif',
    'Innovant',
    'Pragmatique',
    'Empathique',
    'Visionnaire',
    'Collaboratif',
    'Disruptif',
    'Mentor',
    'Entrepreneur'
  ];

  const contentIdeas: ContentIdea[] = [
    {
      platform: 'LinkedIn',
      type: 'Thought Leadership',
      title: '5 tendances tech qui vont transformer 2024',
      description: 'Article détaillé sur les innovations émergentes de votre secteur',
      engagement: 85,
      effort: 'Medium',
      frequency: 'Bi-mensuel'
    },
    {
      platform: 'LinkedIn',
      type: 'Behind the Scenes',
      title: 'Dans les coulisses d\'un projet complexe',
      description: 'Story authentique de vos défis et apprentissages quotidiens',
      engagement: 92,
      effort: 'Low',
      frequency: 'Hebdomadaire'
    },
    {
      platform: 'Twitter',
      type: 'Quick Tips',
      title: 'Thread: 10 astuces de productivité',
      description: 'Conseils pratiques en format thread viral',
      engagement: 78,
      effort: 'Low',
      frequency: 'Bi-hebdomadaire'
    },
    {
      platform: 'Medium',
      type: 'Deep Dive',
      title: 'Guide complet: Architecture microservices',
      description: 'Tutoriel technique approfondi avec exemples concrets',
      engagement: 88,
      effort: 'High',
      frequency: 'Mensuel'
    },
    {
      platform: 'YouTube',
      type: 'Tutorial',
      title: 'Code Review: Best practices en 15 min',
      description: 'Vidéo éducative courte sur vos compétences techniques',
      engagement: 95,
      effort: 'High',
      frequency: 'Bi-mensuel'
    },
    {
      platform: 'Podcast',
      type: 'Interview',
      title: 'Invité sur podcasts sectoriels',
      description: 'Partager votre expertise en tant qu\'invité expert',
      engagement: 90,
      effort: 'Medium',
      frequency: 'Mensuel'
    }
  ];

  const generateBrandAnalysis = useCallback(async () => {
    if (!brandingForm.role || !brandingForm.targetAudience) return;
    
    setIsAnalyzing(true);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockAnalysis: BrandAnalysis = {
      currentBrand: {
        strengths: [
          'Expertise technique reconnue par les pairs',
          'Communication claire et accessible',
          'Expérience diversifiée cross-industries',
          'Réseau solide dans l\'écosystème startup'
        ],
        weaknesses: [
          'Visibilité limitée sur les réseaux sociaux',
          'Message de marque pas assez différenciant',
          'Manque de contenu thought leadership',
          'Présence digitale incohérente entre plateformes'
        ],
        uniqueValue: 'Expert technique capable de vulgariser des concepts complexes pour les non-experts',
        audiencePerception: 'Compétent mais discret, potentiel de leadership sous-exploité',
        consistencyScore: 65,
        visibilityScore: 42
      },
      recommendations: {
        messaging: [
          'Développer un elevator pitch percutant en 30 secondes',
          'Créer une signature professionnelle distinctive',
          'Affiner votre proposition de valeur unique',
          'Adapter votre message selon l\'audience (tech vs business)'
        ],
        content: [
          'Publier 2-3 articles thought leadership par mois',
          'Partager des insights quotidiens sur LinkedIn',
          'Créer des infographies de vos réalisations',
          'Documenter vos apprentissages en temps réel'
        ],
        platforms: [
          'LinkedIn: Hub principal pour thought leadership',
          'Twitter: Quick insights et networking',
          'Medium: Articles détaillés techniques',
          'YouTube: Tutoriels courts et accessibles'
        ],
        networking: [
          'Participer à 2 événements sectoriels par mois',
          'Commenter intelligemment sur posts d\'influenceurs',
          'Organiser des meetups ou webinaires',
          'Mentorer publiquement des juniors'
        ]
      },
      actionPlan: {
        immediate: [
          'Optimiser profils LinkedIn et Twitter',
          'Prendre photos professionnelles cohérentes',
          'Créer template de posts récurrents',
          'Planifier contenu pour 4 semaines'
        ],
        shortTerm: [
          'Lancer newsletter mensuelle',
          'Établir calendrier content régulier',
          'Identifier et engager 20 leaders d\'opinion',
          'Créer 10 articles evergreen'
        ],
        longTerm: [
          'Devenir speaker reconnu dans 3 conférences',
          'Publier livre blanc ou guide de référence',
          'Construire communauté de 5000+ followers',
          'Obtenir mentions presse spécialisée'
        ]
      },
      competitorAnalysis: [
        {
          name: 'Expert Reconnu A',
          strengths: ['Présence YouTube forte', 'Book publié', 'Speaking régulier'],
          opportunities: ['Moins actif sur LinkedIn', 'Contenu parfois trop technique', 'Pas de communauté']
        },
        {
          name: 'Influencer Secteur B',
          strengths: ['10K+ followers Twitter', 'Contenu viral', 'Network impressionnant'],
          opportunities: ['Manque de profondeur technique', 'Pas de long-form content', 'Focus trop large']
        }
      ]
    };
    
    setBrandAnalysis(mockAnalysis);
    setIsAnalyzing(false);
  }, [brandingForm]);

  const addGoal = useCallback((goal: string) => {
    if (!brandingForm.goals.includes(goal)) {
      setBrandingForm(prev => ({
        ...prev,
        goals: [...prev.goals, goal]
      }));
    }
  }, [brandingForm.goals]);

  const removeGoal = useCallback((goal: string) => {
    setBrandingForm(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g !== goal)
    }));
  }, []);

  const addPlatform = useCallback((platform: string) => {
    if (!brandingForm.currentPlatforms.includes(platform)) {
      setBrandingForm(prev => ({
        ...prev,
        currentPlatforms: [...prev.currentPlatforms, platform]
      }));
    }
  }, [brandingForm.currentPlatforms]);

  const removePlatform = useCallback((platform: string) => {
    setBrandingForm(prev => ({
      ...prev,
      currentPlatforms: prev.currentPlatforms.filter(p => p !== platform)
    }));
  }, []);

  const addTrait = useCallback((trait: string) => {
    if (!brandingForm.personalityTraits.includes(trait)) {
      setBrandingForm(prev => ({
        ...prev,
        personalityTraits: [...prev.personalityTraits, trait]
      }));
    }
  }, [brandingForm.personalityTraits]);

  const removeTrait = useCallback((trait: string) => {
    setBrandingForm(prev => ({
      ...prev,
      personalityTraits: prev.personalityTraits.filter(t => t !== trait)
    }));
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      case 'High': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tabConfig = [
    { id: 'assessment', label: 'Évaluation', icon: '📊' },
    { id: 'strategy', label: 'Stratégie', icon: '🎯' },
    { id: 'content', label: 'Contenu', icon: '📝' },
    { id: 'monitoring', label: 'Suivi', icon: '📈' }
  ];

  if (isAnalyzing) {
    return (
      <Card className="relative h-[600px] overflow-hidden">
        <AnimatedGradient className="absolute inset-0 opacity-5" />
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <LoadingSpinner className="mx-auto w-12 h-12" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Analyse personal branding...</h3>
              <p className="text-gray-600 max-w-md">
                Luna évalue votre marque personnelle et crée votre stratégie de visibilité
              </p>
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
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
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assessment Tab */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Évaluation Personal Branding</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteur d'activité
                    </label>
                    <select
                      value={brandingForm.industry}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Tech">Tech/Digital</option>
                      <option value="Finance">Finance</option>
                      <option value="Consulting">Conseil</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Commercial</option>
                      <option value="HR">RH</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle actuel *
                    </label>
                    <input
                      type="text"
                      value={brandingForm.role}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="Ex: Senior Product Manager"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audience cible *
                    </label>
                    <input
                      type="text"
                      value={brandingForm.targetAudience}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                      placeholder="Ex: CTOs, Product Leaders, Entrepreneurs"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aspirations carrière
                    </label>
                    <input
                      type="text"
                      value={brandingForm.careerAspirations}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, careerAspirations: e.target.value }))}
                      placeholder="Ex: Devenir VP Product dans une scale-up"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compétences uniques
                  </label>
                  <textarea
                    value={brandingForm.uniqueSkills}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, uniqueSkills: e.target.value }))}
                    placeholder="Décrivez ce qui vous différencie de vos pairs..."
                    className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objectifs de personal branding
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {brandingForm.goals.map((goal, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{goal}</span>
                        <button
                          onClick={() => removeGoal(goal)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brandingGoals.filter(goal => !brandingForm.goals.includes(goal)).map((goal) => (
                      <button
                        key={goal}
                        onClick={() => addGoal(goal)}
                        className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        + {goal}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plateformes actuelles
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {brandingForm.currentPlatforms.map((platform, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{platform}</span>
                        <button
                          onClick={() => removePlatform(platform)}
                          className="text-green-500 hover:text-green-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {platforms.filter(platform => !brandingForm.currentPlatforms.includes(platform)).map((platform) => (
                      <button
                        key={platform}
                        onClick={() => addPlatform(platform)}
                        className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors"
                      >
                        + {platform}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Traits de personnalité professionnelle
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {brandingForm.personalityTraits.map((trait, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{trait}</span>
                        <button
                          onClick={() => removeTrait(trait)}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {personalityTraits.filter(trait => !brandingForm.personalityTraits.includes(trait)).map((trait) => (
                      <button
                        key={trait}
                        onClick={() => addTrait(trait)}
                        className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                      >
                        + {trait}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={generateBrandAnalysis}
                  disabled={!brandingForm.role || !brandingForm.targetAudience}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  🔍 Analyser ma marque personnelle
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Strategy Tab */}
      {activeTab === 'strategy' && brandAnalysis && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">État Actuel de votre Marque</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold mb-1 ${
                      brandAnalysis.currentBrand.consistencyScore >= 80 ? 'text-green-600' :
                      brandAnalysis.currentBrand.consistencyScore >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {brandAnalysis.currentBrand.consistencyScore}%
                    </div>
                    <div className="text-sm text-gray-600">Cohérence</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold mb-1 ${
                      brandAnalysis.currentBrand.visibilityScore >= 80 ? 'text-green-600' :
                      brandAnalysis.currentBrand.visibilityScore >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {brandAnalysis.currentBrand.visibilityScore}%
                    </div>
                    <div className="text-sm text-gray-600">Visibilité</div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💎 Votre Valeur Unique</h4>
                  <p className="text-blue-700">{brandAnalysis.currentBrand.uniqueValue}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">👥 Perception Audience</h4>
                  <p className="text-purple-700">{brandAnalysis.currentBrand.audiencePerception}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-700 mb-3">✅ Forces actuelles</h4>
                    <ul className="space-y-2">
                      {brandAnalysis.currentBrand.strengths.map((strength, index) => (
                        <li key={index} className="text-green-600 text-sm flex items-start space-x-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-700 mb-3">📈 Points d'amélioration</h4>
                    <ul className="space-y-2">
                      {brandAnalysis.currentBrand.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-orange-600 text-sm flex items-start space-x-2">
                          <span className="text-orange-500 mt-1">!</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Plan d'Action Stratégique</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-red-600 mb-3">🚀 Actions Immédiates (0-2 semaines)</h4>
                    <ul className="space-y-2">
                      {brandAnalysis.actionPlan.immediate.map((action, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" />
                          <span className="text-red-700 text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-600 mb-3">📅 Court Terme (1-3 mois)</h4>
                    <ul className="space-y-2">
                      {brandAnalysis.actionPlan.shortTerm.map((action, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" />
                          <span className="text-orange-700 text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-600 mb-3">🎯 Long Terme (6-12 mois)</h4>
                    <ul className="space-y-2">
                      {brandAnalysis.actionPlan.longTerm.map((action, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" />
                          <span className="text-green-700 text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-4">🎨 Recommandations par Domaine</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-blue-700 mb-2">💬 Messaging</h5>
                      <ul className="space-y-1">
                        {brandAnalysis.recommendations.messaging.map((item, index) => (
                          <li key={index} className="text-blue-600 text-sm">• {item}</li>
                        ))}
                      </ul>
                      
                      <h5 className="font-medium text-green-700 mb-2 mt-4">📱 Plateformes</h5>
                      <ul className="space-y-1">
                        {brandAnalysis.recommendations.platforms.map((item, index) => (
                          <li key={index} className="text-green-600 text-sm">• {item}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-purple-700 mb-2">📝 Contenu</h5>
                      <ul className="space-y-1">
                        {brandAnalysis.recommendations.content.map((item, index) => (
                          <li key={index} className="text-purple-600 text-sm">• {item}</li>
                        ))}
                      </ul>
                      
                      <h5 className="font-medium text-orange-700 mb-2 mt-4">🤝 Networking</h5>
                      <ul className="space-y-1">
                        {brandAnalysis.recommendations.networking.map((item, index) => (
                          <li key={index} className="text-orange-600 text-sm">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Analyse Concurrentielle</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {brandAnalysis.competitorAnalysis.map((competitor, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">{competitor.name}</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">💪 Leurs forces</h5>
                        <ul className="space-y-1">
                          {competitor.strengths.map((strength, idx) => (
                            <li key={idx} className="text-blue-600 text-sm">• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">🎯 Vos opportunités</h5>
                        <ul className="space-y-1">
                          {competitor.opportunities.map((opportunity, idx) => (
                            <li key={idx} className="text-green-600 text-sm">• {opportunity}</li>
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

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Stratégie de Contenu Personnalisée</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {contentIdeas.map((idea, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{idea.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                            {idea.platform}
                          </span>
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                            {idea.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-bold">{idea.engagement}%</span>
                          <span className="text-xs text-gray-500">engagement</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(idea.effort)}`}>
                          {idea.effort} effort
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{idea.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Fréquence recommandée: {idea.frequency}</span>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Utiliser ce template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Calendrier Editorial</h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-7 gap-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div key={day} className="text-center">
                    <div className="font-medium text-gray-700 mb-2">{day}</div>
                    <div className="space-y-2">
                      {day === 'Lun' && (
                        <div className="bg-blue-100 text-blue-700 p-2 rounded text-xs">
                          LinkedIn: Insight secteur
                        </div>
                      )}
                      {day === 'Mer' && (
                        <div className="bg-green-100 text-green-700 p-2 rounded text-xs">
                          Twitter: Quick tip
                        </div>
                      )}
                      {day === 'Ven' && (
                        <div className="bg-purple-100 text-purple-700 p-2 rounded text-xs">
                          LinkedIn: Behind scenes
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Tableau de Bord Personal Branding</h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                {[
                  { metric: 'Followers LinkedIn', value: '2,847', change: '+12%', color: 'blue' },
                  { metric: 'Engagement Rate', value: '4.2%', change: '+0.8%', color: 'green' },
                  { metric: 'Profile Views', value: '1,234', change: '+28%', color: 'purple' },
                  { metric: 'Content Shares', value: '156', change: '+45%', color: 'orange' }
                ].map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-800 mb-1">{item.value}</div>
                    <div className="text-sm text-gray-600 mb-1">{item.metric}</div>
                    <div className={`text-${item.color}-600 text-xs font-medium`}>{item.change}</div>
                  </div>
                ))}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">🎯 Objectifs du Mois</h4>
                  <div className="space-y-3">
                    {[
                      { goal: 'Publier 8 posts LinkedIn', progress: 75 },
                      { goal: 'Atteindre 3000 followers', progress: 95 },
                      { goal: 'Participer à 2 événements', progress: 50 },
                      { goal: 'Publier 1 article Medium', progress: 25 }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{item.goal}</span>
                          <span className="text-gray-500">{item.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.progress >= 80 ? 'bg-green-500' :
                              item.progress >= 50 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">📊 Performance par Plateforme</h4>
                  <div className="space-y-3">
                    {[
                      { platform: 'LinkedIn', score: 92, trend: '↗️' },
                      { platform: 'Twitter', score: 78, trend: '↗️' },
                      { platform: 'Medium', score: 65, trend: '➡️' },
                      { platform: 'YouTube', score: 45, trend: '↘️' }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-800">{item.platform}</span>
                          <span className="text-lg">{item.trend}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(item.score)}`}>
                          {item.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Recommandations d'Optimisation</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    priority: 'Haute',
                    action: 'Augmenter fréquence posts LinkedIn (actuellement 2/semaine → objectif 4/semaine)',
                    impact: 'Visibilité +35%',
                    effort: 'Medium'
                  },
                  {
                    priority: 'Moyenne',
                    action: 'Créer série de posts "Lessons Learned" plus personnels',
                    impact: 'Engagement +28%',
                    effort: 'Low'
                  },
                  {
                    priority: 'Moyenne',
                    action: 'Participer activement aux commentaires d\'autres leaders',
                    impact: 'Réseau +20%',
                    effort: 'Low'
                  },
                  {
                    priority: 'Basse',
                    action: 'Lancer newsletter mensuelle pour community building',
                    impact: 'Authority +40%',
                    effort: 'High'
                  }
                ].map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'Haute' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'Moyenne' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        Priorité {rec.priority}
                      </span>
                      <div className="flex space-x-2">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          {rec.impact}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getEffortColor(rec.effort)}`}>
                          {rec.effort} effort
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700">{rec.action}</p>
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

export default PersonalBrandingTab;