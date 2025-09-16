import React, { memo, useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../shared/ui/card';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AnimatedGradient } from '../../../shared/components/AnimatedGradient';

interface PredictionInput {
  target_role: string;
  target_company: string;
  target_sector: string;
  experience_years: number;
  education_level: string;
  skills: string[];
  location: string;
  salary_expectation: string;
  application_method: string;
}

interface SuccessMetrics {
  interview_probability: number;
  hiring_probability: number;
  negotiation_power: number;
  cultural_fit: number;
  skill_match: number;
  experience_relevance: number;
  overall_score: number;
}

interface PredictionResult {
  success_metrics: SuccessMetrics;
  strengths: string[];
  weaknesses: string[];
  improvement_recommendations: {
    priority: 'Critique' | 'Important' | 'Bonus';
    action: string;
    impact: string;
    timeline: string;
  }[];
  market_positioning: {
    percentile: number;
    competitive_analysis: string;
    differentiation_factors: string[];
  };
  success_strategies: {
    application: string[];
    interview: string[];
    negotiation: string[];
  };
  risk_factors: {
    factor: string;
    mitigation: string;
  }[];
}

export const SuccessPredictionTab = memo(() => {
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [activeTab, setActiveTab] = useState('metrics');
  const [formData, setFormData] = useState<PredictionInput>({
    target_role: '',
    target_company: '',
    target_sector: 'Tech',
    experience_years: 3,
    education_level: 'Master',
    skills: [],
    location: 'Paris',
    salary_expectation: '50-60k€',
    application_method: 'LinkedIn'
  });
  const [skillInput, setSkillInput] = useState('');

  const addSkill = useCallback(() => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  }, [skillInput, formData.skills]);

  const removeSkill = useCallback((skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  }, []);

  const predictSuccess = useCallback(async () => {
    if (!formData.target_role || !formData.target_company) return;
    
    setIsPredicting(true);
    
    // Simulate AI prediction with realistic delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock sophisticated success prediction
    const mockResult: PredictionResult = {
      success_metrics: {
        interview_probability: 78,
        hiring_probability: 65,
        negotiation_power: 72,
        cultural_fit: 85,
        skill_match: 82,
        experience_relevance: 75,
        overall_score: 76
      },
      strengths: [
        'Compétences techniques solides alignées avec le poste',
        'Expérience pertinente dans le secteur cible',
        'Profil recherché sur le marché actuel',
        'Localisation géographique favorable'
      ],
      weaknesses: [
        'Manque de certification spécialisée',
        'Pas d\'expérience leadership démontrée',
        'Portfolio projets limité pour ce niveau'
      ],
      improvement_recommendations: [
        {
          priority: 'Critique',
          action: 'Obtenir certification AWS/Azure dans les 2 mois',
          impact: '+15% probabilité embauche',
          timeline: '2-3 mois'
        },
        {
          priority: 'Important',
          action: 'Développer 2 projets portfolio démontrant expertise',
          impact: '+10% probabilité entretien',
          timeline: '1-2 mois'
        },
        {
          priority: 'Bonus',
          action: 'Participer à événements tech de l\'entreprise cible',
          impact: '+8% cultural fit',
          timeline: '1 mois'
        }
      ],
      market_positioning: {
        percentile: 76,
        competitive_analysis: 'Votre profil se situe dans le top 24% des candidats pour ce type de poste',
        differentiation_factors: [
          'Combinaison unique frontend/backend',
          'Expérience startup + grand groupe',
          'Maîtrise méthodes agiles'
        ]
      },
      success_strategies: {
        application: [
          'Postuler via référence interne (x3 probabilité)',
          'Personnaliser CV avec mots-clés spécifiques au poste',
          'Inclure quantification des réalisations'
        ],
        interview: [
          'Préparer 3 exemples STAR spécifiques au secteur',
          'Rechercher en détail culture d\'entreprise',
          'Poser questions techniques pertinentes'
        ],
        negotiation: [
          'Attendre retour positif avant négociation',
          'Préparer justification salariale avec données marché',
          'Négocier package global (formation, télétravail)'
        ]
      },
      risk_factors: [
        {
          factor: 'Concurrence forte sur ce poste',
          mitigation: 'Se démarquer par spécialisation technique'
        },
        {
          factor: 'Expérience management limitée',
          mitigation: 'Mettre en avant leadership informel et mentorat'
        }
      ]
    };
    
    setPredictionResult(mockResult);
    setIsPredicting(false);
  }, [formData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    return 'À améliorer';
  };

  const tabConfig = [
    { id: 'form', label: 'Paramètres', icon: '⚙️' },
    { id: 'metrics', label: 'Scores', icon: '📊' },
    { id: 'analysis', label: 'Analyse', icon: '🔍' },
    { id: 'strategies', label: 'Stratégies', icon: '🎯' }
  ];

  if (isPredicting) {
    return (
      <Card className="relative h-[600px] overflow-hidden">
        <AnimatedGradient className="absolute inset-0 opacity-5" />
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <LoadingSpinner className="mx-auto w-12 h-12" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Analyse prédictive en cours...</h3>
              <p className="text-gray-600 max-w-md">
                Luna calcule vos probabilités de succès avec l'IA la plus avancée
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
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
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

      {/* Form Tab */}
      {activeTab === 'form' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Paramètres de Prédiction</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poste cible *
                  </label>
                  <input
                    type="text"
                    value={formData.target_role}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_role: e.target.value }))}
                    placeholder="Ex: Senior Frontend Developer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entreprise cible *
                  </label>
                  <input
                    type="text"
                    value={formData.target_company}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_company: e.target.value }))}
                    placeholder="Ex: Spotify, Uber, BlaBlaCar"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur
                  </label>
                  <select
                    value={formData.target_sector}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_sector: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Tech">Tech/Digital</option>
                    <option value="Finance">Finance</option>
                    <option value="Conseil">Conseil</option>
                    <option value="Startup">Startup</option>
                    <option value="Industry">Industrie</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                    max="50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau d'éducation
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, education_level: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Bac">Bac</option>
                    <option value="Bac+2">Bac+2</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="MBA">MBA</option>
                    <option value="Doctorat">Doctorat</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attentes salariales
                  </label>
                  <select
                    value={formData.salary_expectation}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_expectation: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="30-40k€">30-40k€</option>
                    <option value="40-50k€">40-50k€</option>
                    <option value="50-60k€">50-60k€</option>
                    <option value="60-80k€">60-80k€</option>
                    <option value="80-100k€">80-100k€</option>
                    <option value="100k€+">100k€+</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compétences clés
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-purple-500 hover:text-purple-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="Ajouter une compétence..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button
                onClick={predictSuccess}
                disabled={!formData.target_role || !formData.target_company}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                🔮 Prédire mes chances de succès
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && predictionResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Score Global de Réussite</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold ${getScoreColor(predictionResult.success_metrics.overall_score)}`}>
                  {predictionResult.success_metrics.overall_score}%
                </div>
                <p className="text-gray-600 mt-2">{getScoreLabel(predictionResult.success_metrics.overall_score)}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(predictionResult.success_metrics).filter(([key]) => key !== 'overall_score').map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(value as number)}`}>
                        {value}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          (value as number) >= 80 ? 'bg-green-500' :
                          (value as number) >= 60 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Positionnement Marché</h3>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">Votre percentile</span>
                  <span className="text-blue-600 text-xl font-bold">{predictionResult.market_positioning.percentile}%</span>
                </div>
                <p className="text-blue-700 text-sm mt-2">{predictionResult.market_positioning.competitive_analysis}</p>
              </div>
              
              <h4 className="font-medium text-gray-800 mb-3">🎯 Facteurs de Différenciation</h4>
              <ul className="space-y-2">
                {predictionResult.market_positioning.differentiation_factors.map((factor, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span className="text-gray-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && predictionResult && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-green-600">✅ Points Forts</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {predictionResult.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-orange-600">⚠️ Axes d'Amélioration</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {predictionResult.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-orange-500 mt-1">!</span>
                      <span className="text-gray-700">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">📈 Recommandations Prioritaires</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictionResult.improvement_recommendations.map((rec, index) => (
                  <div key={index} className={`p-4 border-l-4 rounded-r-lg ${
                    rec.priority === 'Critique' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'Important' ? 'border-orange-500 bg-orange-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        rec.priority === 'Critique' ? 'bg-red-200 text-red-800' :
                        rec.priority === 'Important' ? 'bg-orange-200 text-orange-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {rec.priority}
                      </span>
                      <span className="text-sm text-gray-600">{rec.timeline}</span>
                    </div>
                    <p className="font-medium text-gray-800 mb-1">{rec.action}</p>
                    <p className="text-green-600 text-sm font-medium">{rec.impact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">⚡ Facteurs de Risque</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictionResult.risk_factors.map((risk, index) => (
                  <div key={index} className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2 mb-2">
                      <span className="text-red-500 mt-1">⚠️</span>
                      <p className="font-medium text-red-800">{risk.factor}</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">💡</span>
                      <p className="text-green-700">{risk.mitigation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Strategies Tab */}
      {activeTab === 'strategies' && predictionResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">📝 Stratégie de Candidature</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {predictionResult.success_strategies.application.map((strategy, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">1.</span>
                    <span className="text-gray-700">{strategy}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">💼 Stratégie d'Entretien</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {predictionResult.success_strategies.interview.map((strategy, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">2.</span>
                    <span className="text-gray-700">{strategy}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">💰 Stratégie de Négociation</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {predictionResult.success_strategies.negotiation.map((strategy, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">3.</span>
                    <span className="text-gray-700">{strategy}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});