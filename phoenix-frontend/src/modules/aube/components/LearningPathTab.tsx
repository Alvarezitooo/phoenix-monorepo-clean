import React, { memo, useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../shared/ui/card';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AnimatedGradient } from '../../../shared/components/AnimatedGradient';

interface LearningModule {
  id: string;
  title: string;
  provider: string;
  type: 'Course' | 'Certification' | 'Workshop' | 'Book' | 'Project';
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  cost: 'Free' | 'Paid' | 'Premium';
  rating: number;
  relevance_score: number;
  prerequisites: string[];
  learning_outcomes: string[];
  url?: string;
  estimated_completion: string;
}

interface SkillGap {
  skill: string;
  current_level: number;
  target_level: number;
  priority: 'Critical' | 'Important' | 'Nice to have';
  gap_percentage: number;
  market_demand: number;
}

interface LearningPath {
  target_role: string;
  estimated_timeline: string;
  total_time_commitment: string;
  skill_gaps: SkillGap[];
  learning_phases: {
    phase: string;
    duration: string;
    focus_areas: string[];
    modules: LearningModule[];
    milestones: string[];
  }[];
  career_impact: {
    salary_increase_potential: string;
    job_opportunities: number;
    skill_transferability: number;
  };
  alternative_paths: {
    name: string;
    description: string;
    time_saving: string;
    trade_offs: string[];
  }[];
  budget_breakdown: {
    free_resources: number;
    paid_courses: number;
    certifications: number;
    books_materials: number;
    total_estimated: string;
  };
}

export const LearningPathTab = memo(() => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('10_hours_week');
  const [budget, setBudget] = useState('500_1000');
  const [learningStyle, setLearningStyle] = useState('mixed');

  const addSkill = useCallback(() => {
    if (skillInput.trim() && !currentSkills.includes(skillInput.trim())) {
      setCurrentSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  }, [skillInput, currentSkills]);

  const removeSkill = useCallback((skill: string) => {
    setCurrentSkills(prev => prev.filter(s => s !== skill));
  }, []);

  const generateLearningPath = useCallback(async () => {
    if (!targetRole) return;
    
    setIsGenerating(true);
    
    // Simulate AI-powered learning path generation
    await new Promise(resolve => setTimeout(resolve, 3200));
    
    // Mock comprehensive learning path
    const mockPath: LearningPath = {
      target_role: targetRole,
      estimated_timeline: '8-12 mois',
      total_time_commitment: '240-360 heures',
      skill_gaps: [
        {
          skill: 'React Advanced Patterns',
          current_level: 60,
          target_level: 85,
          priority: 'Critical',
          gap_percentage: 29,
          market_demand: 92
        },
        {
          skill: 'System Design',
          current_level: 40,
          target_level: 80,
          priority: 'Critical',
          gap_percentage: 50,
          market_demand: 88
        },
        {
          skill: 'Team Leadership',
          current_level: 30,
          target_level: 75,
          priority: 'Important',
          gap_percentage: 60,
          market_demand: 85
        },
        {
          skill: 'Cloud Architecture (AWS)',
          current_level: 45,
          target_level: 80,
          priority: 'Important',
          gap_percentage: 44,
          market_demand: 90
        }
      ],
      learning_phases: [
        {
          phase: 'Phase 1: Fondations Techniques',
          duration: '2-3 mois',
          focus_areas: ['React avancé', 'Architecture frontend', 'Testing'],
          modules: [
            {
              id: 'react-advanced',
              title: 'Advanced React Patterns & Performance',
              provider: 'Kent C. Dodds (EpicReact)',
              type: 'Course',
              duration: '40 heures',
              difficulty: 'Advanced',
              cost: 'Paid',
              rating: 4.8,
              relevance_score: 95,
              prerequisites: ['React basics', 'JavaScript ES6+'],
              learning_outcomes: [
                'Maîtrise des hooks avancés',
                'Patterns de performance optimization',
                'Testing React applications'
              ],
              estimated_completion: '6-8 semaines'
            },
            {
              id: 'testing-js',
              title: 'Testing JavaScript Applications',
              provider: 'Kent C. Dodds',
              type: 'Course',
              duration: '30 heures',
              difficulty: 'Intermediate',
              cost: 'Paid',
              rating: 4.7,
              relevance_score: 88,
              prerequisites: ['JavaScript fundamentals'],
              learning_outcomes: [
                'Unit testing best practices',
                'Integration testing',
                'E2E testing strategies'
              ],
              estimated_completion: '4-5 semaines'
            }
          ],
          milestones: [
            'Portfolio project avec React patterns avancés',
            'Test coverage >90% sur projet personnel',
            'Article technique publié sur testing'
          ]
        },
        {
          phase: 'Phase 2: System Design & Architecture',
          duration: '3-4 mois',
          focus_areas: ['System Design', 'Cloud Architecture', 'Scalability'],
          modules: [
            {
              id: 'system-design',
              title: 'Grokking the System Design Interview',
              provider: 'Design Gurus',
              type: 'Course',
              duration: '50 heures',
              difficulty: 'Advanced',
              cost: 'Paid',
              rating: 4.6,
              relevance_score: 92,
              prerequisites: ['Backend development experience'],
              learning_outcomes: [
                'Design de systèmes distribués',
                'Patterns de scalabilité',
                'Trade-offs architecturaux'
              ],
              estimated_completion: '8-10 semaines'
            },
            {
              id: 'aws-solution-architect',
              title: 'AWS Solutions Architect Associate',
              provider: 'A Cloud Guru',
              type: 'Certification',
              duration: '60 heures',
              difficulty: 'Intermediate',
              cost: 'Premium',
              rating: 4.5,
              relevance_score: 89,
              prerequisites: ['Cloud basics', 'Networking fundamentals'],
              learning_outcomes: [
                'AWS services mastery',
                'Cloud architecture patterns',
                'Cost optimization strategies'
              ],
              estimated_completion: '10-12 semaines'
            }
          ],
          milestones: [
            'Certification AWS Solutions Architect',
            'Design document système complexe',
            'Présentation architecture à équipe technique'
          ]
        },
        {
          phase: 'Phase 3: Leadership & Management',
          duration: '3-4 mois',
          focus_areas: ['Team Leadership', 'Technical Communication', 'Product Mindset'],
          modules: [
            {
              id: 'tech-leadership',
              title: 'The Manager\'s Path',
              provider: 'Camille Fournier',
              type: 'Book',
              duration: '15 heures',
              difficulty: 'Intermediate',
              cost: 'Paid',
              rating: 4.8,
              relevance_score: 87,
              prerequisites: ['Some team experience'],
              learning_outcomes: [
                'Transition from IC to manager',
                'Building high-performing teams',
                'Technical decision making'
              ],
              estimated_completion: '3-4 semaines'
            },
            {
              id: 'staff-eng',
              title: 'Staff Engineer: Leadership beyond the management track',
              provider: 'Will Larson',
              type: 'Book',
              duration: '12 heures',
              difficulty: 'Advanced',
              cost: 'Paid',
              rating: 4.7,
              relevance_score: 85,
              prerequisites: ['Senior engineering experience'],
              learning_outcomes: [
                'Staff+ engineer responsibilities',
                'Technical strategy',
                'Cross-team influence'
              ],
              estimated_completion: '2-3 semaines'
            }
          ],
          milestones: [
            'Mentoring junior developer',
            'Leading cross-team technical initiative',
            'Public speaking at tech meetup'
          ]
        }
      ],
      career_impact: {
        salary_increase_potential: '25-40%',
        job_opportunities: 156,
        skill_transferability: 85
      },
      alternative_paths: [
        {
          name: 'Fast Track Bootcamp',
          description: 'Formation intensive 3 mois avec placement garanti',
          time_saving: '-50%',
          trade_offs: ['Moins de profondeur', 'Plus stressant', 'Coût élevé']
        },
        {
          name: 'Internal Mobility',
          description: 'Évolution interne avec support entreprise',
          time_saving: '-30%',
          trade_offs: ['Limité à stack actuelle', 'Dépendant politique interne']
        }
      ],
      budget_breakdown: {
        free_resources: 15,
        paid_courses: 60,
        certifications: 20,
        books_materials: 5,
        total_estimated: '800-1200€'
      }
    };
    
    setLearningPath(mockPath);
    setIsGenerating(false);
  }, [targetRole, currentSkills, timeCommitment, budget]);

  const getSkillLevelColor = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-yellow-500';
    if (level >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'Important': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'Free': return 'bg-green-100 text-green-700';
      case 'Paid': return 'bg-blue-100 text-blue-700';
      case 'Premium': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tabConfig = [
    { id: 'settings', label: 'Configuration', icon: '⚙️' },
    { id: 'overview', label: 'Vue d\'ensemble', icon: '📋' },
    { id: 'gaps', label: 'Gaps de Compétences', icon: '📊' },
    { id: 'path', label: 'Parcours Détaillé', icon: '🛤️' },
    { id: 'budget', label: 'Budget & ROI', icon: '💰' }
  ];

  if (isGenerating) {
    return (
      <Card className="relative h-[600px] overflow-hidden">
        <AnimatedGradient className="absolute inset-0 opacity-5" />
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <LoadingSpinner className="mx-auto w-12 h-12" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Génération parcours d'apprentissage...</h3>
              <p className="text-gray-600 max-w-md">
                Luna analyse votre profil et crée un parcours personnalisé pour atteindre vos objectifs
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

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Configuration du Parcours d'Apprentissage</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle cible *
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Ex: Senior Full Stack Developer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temps disponible par semaine
                  </label>
                  <select
                    value={timeCommitment}
                    onChange={(e) => setTimeCommitment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="5_hours_week">5 heures/semaine</option>
                    <option value="10_hours_week">10 heures/semaine</option>
                    <option value="15_hours_week">15 heures/semaine</option>
                    <option value="20_hours_week">20+ heures/semaine</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget formation
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="0_500">0-500€</option>
                    <option value="500_1000">500-1000€</option>
                    <option value="1000_2000">1000-2000€</option>
                    <option value="2000_plus">2000€+</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style d'apprentissage
                  </label>
                  <select
                    value={learningStyle}
                    onChange={(e) => setLearningStyle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="visual">Visuel (vidéos, diagrammes)</option>
                    <option value="reading">Lecture (livres, articles)</option>
                    <option value="hands_on">Pratique (projets, labs)</option>
                    <option value="mixed">Mixte (tous supports)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compétences actuelles
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentSkills.map((skill, index) => (
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
                onClick={generateLearningPath}
                disabled={!targetRole}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                🎓 Générer mon parcours d'apprentissage
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && learningPath && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Parcours vers: {learningPath.target_role}</h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-blue-600 text-2xl">⏱️</span>
                  </div>
                  <h4 className="font-medium text-gray-800">Durée Estimée</h4>
                  <p className="text-gray-600">{learningPath.estimated_timeline}</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-purple-600 text-2xl">📚</span>
                  </div>
                  <h4 className="font-medium text-gray-800">Temps Total</h4>
                  <p className="text-gray-600">{learningPath.total_time_commitment}</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-green-600 text-2xl">💰</span>
                  </div>
                  <h4 className="font-medium text-gray-800">ROI Potentiel</h4>
                  <p className="text-gray-600">{learningPath.career_impact.salary_increase_potential}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Impact Carrière</h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800">Augmentation Salariale</h4>
                  <p className="text-green-600 text-xl font-bold">{learningPath.career_impact.salary_increase_potential}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800">Opportunités d'Emploi</h4>
                  <p className="text-blue-600 text-xl font-bold">{learningPath.career_impact.job_opportunities} postes</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800">Transférabilité</h4>
                  <p className="text-purple-600 text-xl font-bold">{learningPath.career_impact.skill_transferability}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Parcours Alternatifs</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningPath.alternative_paths.map((alt, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-800">{alt.name}</h4>
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm font-medium">
                        {alt.time_saving} temps
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{alt.description}</p>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Trade-offs:</h5>
                      <ul className="space-y-1">
                        {alt.trade_offs.map((tradeOff, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span className="text-gray-600 text-sm">{tradeOff}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skill Gaps Tab */}
      {activeTab === 'gaps' && learningPath && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Analyse des Gaps de Compétences</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {learningPath.skill_gaps.map((gap, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">{gap.skill}</h4>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(gap.priority)}`}>
                        {gap.priority}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Demande Marché</p>
                      <p className="font-bold text-purple-600">{gap.market_demand}%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Niveau Actuel</span>
                        <span className="text-sm text-gray-600">{gap.current_level}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getSkillLevelColor(gap.current_level)}`}
                          style={{ width: `${gap.current_level}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Niveau Cible</span>
                        <span className="text-sm text-gray-600">{gap.target_level}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full"
                          style={{ width: `${gap.target_level}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-red-800 font-medium">
                        Gap à combler: {gap.gap_percentage}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Path Tab */}
      {activeTab === 'path' && learningPath && (
        <div className="space-y-6">
          {learningPath.learning_phases.map((phase, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{phase.phase}</h3>
                    <p className="text-gray-600">Durée: {phase.duration}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {phase.focus_areas.map((area, idx) => (
                      <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-4">📚 Modules d'Apprentissage</h4>
                    <div className="space-y-4">
                      {phase.modules.map((module, moduleIdx) => (
                        <div key={moduleIdx} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-semibold text-gray-800">{module.title}</h5>
                              <p className="text-gray-600 text-sm">par {module.provider}</p>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCostColor(module.cost)}`}>
                                {module.cost}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                                {module.difficulty}
                              </span>
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-sm font-medium">{module.rating}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <h6 className="font-medium text-gray-700 mb-1">⏱️ {module.duration}</h6>
                              <h6 className="font-medium text-gray-700 mb-1">🎯 Pertinence: {module.relevance_score}%</h6>
                              <h6 className="font-medium text-gray-700">📅 Completion: {module.estimated_completion}</h6>
                            </div>
                            <div>
                              <h6 className="font-medium text-gray-700 mb-1">Prérequis:</h6>
                              <ul className="text-sm text-gray-600">
                                {module.prerequisites.map((prereq, prereqIdx) => (
                                  <li key={prereqIdx}>• {prereq}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="font-medium text-gray-700 mb-1">Objectifs d'apprentissage:</h6>
                            <ul className="text-sm text-gray-600">
                              {module.learning_outcomes.map((outcome, outcomeIdx) => (
                                <li key={outcomeIdx} className="flex items-start space-x-2">
                                  <span className="text-green-500 mt-1">✓</span>
                                  <span>{outcome}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">🎯 Jalons de Validation</h4>
                    <ul className="space-y-2">
                      {phase.milestones.map((milestone, milestoneIdx) => (
                        <li key={milestoneIdx} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <span className="text-green-500 mt-1">🏆</span>
                          <span className="text-green-700">{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Budget Tab */}
      {activeTab === 'budget' && learningPath && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Répartition du Budget</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800">Ressources Gratuites</h4>
                    <p className="text-green-600 text-xl font-bold">{learningPath.budget_breakdown.free_resources}%</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800">Cours Payants</h4>
                    <p className="text-blue-600 text-xl font-bold">{learningPath.budget_breakdown.paid_courses}%</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800">Certifications</h4>
                    <p className="text-purple-600 text-xl font-bold">{learningPath.budget_breakdown.certifications}%</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-800">Livres & Matériel</h4>
                    <p className="text-orange-600 text-xl font-bold">{learningPath.budget_breakdown.books_materials}%</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Budget Total Estimé</h3>
                  <p className="text-3xl font-bold text-purple-600">{learningPath.budget_breakdown.total_estimated}</p>
                  <p className="text-gray-600 mt-2">Investissement pour {learningPath.estimated_timeline}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Retour sur Investissement</h3>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">💰 Impact Financier</h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-600">Investissement formation:</span>
                        <span className="font-medium">{learningPath.budget_breakdown.total_estimated}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Augmentation potentielle:</span>
                        <span className="font-medium text-green-600">{learningPath.career_impact.salary_increase_potential}</span>
                      </li>
                      <li className="flex justify-between border-t pt-2">
                        <span className="text-gray-800 font-medium">ROI sur 2 ans:</span>
                        <span className="font-bold text-green-600">~1000-1500%</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">📈 Impact Carrière</h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-600">Nouvelles opportunités:</span>
                        <span className="font-medium">{learningPath.career_impact.job_opportunities} postes</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Compétences transférables:</span>
                        <span className="font-medium">{learningPath.career_impact.skill_transferability}%</span>
                      </li>
                      <li className="flex justify-between border-t pt-2">
                        <span className="text-gray-800 font-medium">Durée amortissement:</span>
                        <span className="font-bold text-blue-600">2-4 mois</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});