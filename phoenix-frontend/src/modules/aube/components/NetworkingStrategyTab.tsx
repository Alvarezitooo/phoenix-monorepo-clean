import React, { memo, useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../shared/ui/card';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AnimatedGradient } from '../../../shared/components/AnimatedGradient';

interface NetworkContact {
  name: string;
  position: string;
  company: string;
  connection_type: 'Direct' | '2nd Degree' | 'Alumni' | 'Event' | 'Cold';
  relevance_score: number;
  contact_method: string[];
  approach_strategy: string;
  estimated_response_rate: number;
}

interface NetworkingPlan {
  target_profiles: NetworkContact[];
  events_to_attend: {
    name: string;
    date: string;
    location: string;
    attendees_profile: string;
    networking_potential: number;
    preparation_tips: string[];
  }[];
  online_strategies: {
    platform: string;
    approach: string;
    content_suggestions: string[];
    engagement_tactics: string[];
  }[];
  referral_opportunities: {
    company: string;
    referrer_profile: string;
    approach: string;
    success_probability: number;
  }[];
  personal_branding: {
    linkedin_optimization: string[];
    content_strategy: string[];
    thought_leadership: string[];
  };
  follow_up_system: {
    timeline: string;
    touchpoint_types: string[];
    relationship_building: string[];
  };
}

export const NetworkingStrategyTab = memo(() => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [networkingPlan, setNetworkingPlan] = useState<NetworkingPlan | null>(null);
  const [activeTab, setActiveTab] = useState('contacts');
  const [targetIndustry, setTargetIndustry] = useState('Tech');
  const [targetRole, setTargetRole] = useState('');
  const [networkingGoal, setNetworkingGoal] = useState('job_search');
  const [currentNetwork, setCurrentNetwork] = useState('limited');

  const generateNetworkingPlan = useCallback(async () => {
    if (!targetRole) return;
    
    setIsGenerating(true);
    
    // Simulate AI-powered networking analysis
    await new Promise(resolve => setTimeout(resolve, 2800));
    
    // Mock comprehensive networking strategy
    const mockPlan: NetworkingPlan = {
      target_profiles: [
        {
          name: 'Sarah Martinez',
          position: 'Senior Engineering Manager',
          company: 'Spotify',
          connection_type: '2nd Degree',
          relevance_score: 92,
          contact_method: ['LinkedIn InMail', 'Mutual Connection Introduction'],
          approach_strategy: 'Mentionner votre passion commune pour l\'architecture micro-services et demander conseil sur transition leadership',
          estimated_response_rate: 68
        },
        {
          name: 'Thomas Chen',
          position: 'VP of Engineering',
          company: 'BlaBlaCar',
          connection_type: 'Alumni',
          relevance_score: 89,
          contact_method: ['Alumni Network', 'LinkedIn Direct Message'],
          approach_strategy: 'Référence commune École 42, discussion sur évolution carrière dans mobility tech',
          estimated_response_rate: 78
        },
        {
          name: 'Marie Dubois',
          position: 'Head of Talent',
          company: 'Datadog',
          connection_type: 'Event',
          relevance_score: 85,
          contact_method: ['Tech Meetup Follow-up', 'Twitter DM'],
          approach_strategy: 'Rappel conversation DevOps Paris Meetup, intérêt pour opportunités senior',
          estimated_response_rate: 72
        },
        {
          name: 'Alex Johnson',
          position: 'Principal Software Architect',
          company: 'Uber',
          connection_type: 'Cold',
          relevance_score: 81,
          contact_method: ['LinkedIn Premium InMail', 'Company Blog Engagement'],
          approach_strategy: 'Commentaire réfléchi sur article architecture, demande informational interview',
          estimated_response_rate: 45
        }
      ],
      events_to_attend: [
        {
          name: 'Paris Tech Talks',
          date: '15 Octobre 2024',
          location: 'Station F, Paris',
          attendees_profile: 'Senior Engineers, Tech Leaders, Startup Founders',
          networking_potential: 85,
          preparation_tips: [
            'Préparer 3 questions techniques pertinentes',
            'Apporter business cards numériques',
            'Identifier 5 speakers cibles à rencontrer',
            'Préparer elevator pitch de 30 secondes'
          ]
        },
        {
          name: 'DevOps & Cloud Native Paris',
          date: '22 Octobre 2024',
          location: 'Microsoft France, Issy-les-Moulineaux',
          attendees_profile: 'DevOps Engineers, Cloud Architects, SREs',
          networking_potential: 78,
          preparation_tips: [
            'Étudier speakers et leurs entreprises',
            'Préparer questions spécifiques Kubernetes/AWS',
            'Planifier rendez-vous post-événement'
          ]
        }
      ],
      online_strategies: [
        {
          platform: 'LinkedIn',
          approach: 'Thought Leadership & Engagement',
          content_suggestions: [
            'Articles techniques sur architecture microservices',
            'Retour d\'expérience migrations cloud',
            'Réflexions sur leadership technique'
          ],
          engagement_tactics: [
            'Commenter intelligemment posts de cibles',
            'Partager articles avec insights personnels',
            'Participer discussions groupes techniques'
          ]
        },
        {
          platform: 'Twitter',
          approach: 'Tech Community Engagement',
          content_suggestions: [
            'Threads techniques détaillés',
            'Live-tweeting conférences tech',
            'Partage outils et bonnes pratiques'
          ],
          engagement_tactics: [
            'Répondre aux tweets de tech leaders',
            'Participer Twitter Spaces tech',
            'Créer du contenu viral technique'
          ]
        }
      ],
      referral_opportunities: [
        {
          company: 'Spotify',
          referrer_profile: 'Ex-collègue devenu Senior Developer',
          approach: 'Café informel pour discuter opportunités internes',
          success_probability: 82
        },
        {
          company: 'Datadog',
          referrer_profile: 'Contact LinkedIn actif dans recrutement',
          approach: 'Message LinkedIn mentionnant votre intérêt + CV',
          success_probability: 67
        }
      ],
      personal_branding: {
        linkedin_optimization: [
          'Headline accrocheur avec mots-clés secteur',
          'Summary storytelling avec réalisations quantifiées',
          '3-4 posts techniques par semaine',
          'Recommandations croisées avec collègues'
        ],
        content_strategy: [
          'Articles long-form (1-2 par mois)',
          'Posts courts techniques (2-3 par semaine)',
          'Partages avec commentaires personnels',
          'Stories behind-the-scenes projets'
        ],
        thought_leadership: [
          'Speaking à meetups locaux',
          'Contributions open source visibles',
          'Mentoring junior developers',
          'Participation podcasts tech'
        ]
      },
      follow_up_system: {
        timeline: 'J+1: Thank you note, J+7: Value-add follow-up, J+30: Relationship check-in',
        touchpoint_types: [
          'Article intéressant pertinent à leur business',
          'Introduction mutuelle bénéfique',
          'Invitation événement ou conférence',
          'Mise à jour professionnelle personnelle'
        ],
        relationship_building: [
          'Se souvenir détails personnels conversations',
          'Célébrer leurs succès professionnels',
          'Offrir aide avant de demander service',
          'Maintenir contact régulier sans être intrusif'
        ]
      }
    };
    
    setNetworkingPlan(mockPlan);
    setIsGenerating(false);
  }, [targetRole, targetIndustry, networkingGoal]);

  const getRelevanceColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'Direct': return 'bg-green-100 text-green-700';
      case '2nd Degree': return 'bg-blue-100 text-blue-700';
      case 'Alumni': return 'bg-purple-100 text-purple-700';
      case 'Event': return 'bg-orange-100 text-orange-700';
      case 'Cold': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tabConfig = [
    { id: 'settings', label: 'Paramètres', icon: '⚙️' },
    { id: 'contacts', label: 'Contacts Cibles', icon: '👥' },
    { id: 'events', label: 'Événements', icon: '📅' },
    { id: 'online', label: 'Stratégie Online', icon: '🌐' },
    { id: 'branding', label: 'Personal Branding', icon: '⭐' }
  ];

  if (isGenerating) {
    return (
      <Card className="relative h-[600px] overflow-hidden">
        <AnimatedGradient className="absolute inset-0 opacity-5" />
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <LoadingSpinner className="mx-auto w-12 h-12" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Génération stratégie réseau...</h3>
              <p className="text-gray-600 max-w-md">
                Luna analyse votre profil et identifie les meilleures opportunités de networking
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
            <h3 className="text-lg font-semibold text-gray-800">Configuration Stratégie Networking</h3>
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
                    placeholder="Ex: Senior Engineering Manager"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur cible
                  </label>
                  <select
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Tech">Tech/Software</option>
                    <option value="FinTech">FinTech</option>
                    <option value="Startup">Startup</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objectif networking
                  </label>
                  <select
                    value={networkingGoal}
                    onChange={(e) => setNetworkingGoal(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="job_search">Recherche d'emploi</option>
                    <option value="career_guidance">Conseil de carrière</option>
                    <option value="business_development">Développement business</option>
                    <option value="knowledge_sharing">Partage de connaissances</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Réseau actuel
                  </label>
                  <select
                    value={currentNetwork}
                    onChange={(e) => setCurrentNetwork(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="limited">Réseau limité</option>
                    <option value="moderate">Réseau modéré</option>
                    <option value="extensive">Réseau étendu</option>
                    <option value="very_strong">Réseau très fort</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={generateNetworkingPlan}
                disabled={!targetRole}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                🎯 Générer ma stratégie de networking
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && networkingPlan && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Contacts Cibles Prioritaires</h3>
              <p className="text-gray-600">Personnes clés à contacter selon votre profil et objectifs</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkingPlan.target_profiles.map((contact, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{contact.name}</h4>
                        <p className="text-gray-600">{contact.position} chez {contact.company}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConnectionTypeColor(contact.connection_type)}`}>
                          {contact.connection_type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(contact.relevance_score)}`}>
                          {contact.relevance_score}% relevance
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Stratégie d'approche:</h5>
                        <p className="text-sm text-gray-600">{contact.approach_strategy}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Méthodes de contact:</h5>
                          <div className="flex flex-wrap gap-1">
                            {contact.contact_method.map((method, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Taux de réponse estimé:</h5>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${contact.estimated_response_rate}%` }}
                              ></div>
                            </div>
                            <span className="text-green-600 font-medium">{contact.estimated_response_rate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">Opportunités de Référence</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkingPlan.referral_opportunities.map((ref, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-green-800">{ref.company}</h4>
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {ref.success_probability}% succès
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mb-2"><strong>Référent:</strong> {ref.referrer_profile}</p>
                    <p className="text-sm text-green-600"><strong>Approche:</strong> {ref.approach}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && networkingPlan && (
        <div className="space-y-6">
          {networkingPlan.events_to_attend.map((event, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{event.name}</h3>
                    <p className="text-gray-600">{event.date} - {event.location}</p>
                  </div>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {event.networking_potential}% potential
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">👥 Profil des participants</h4>
                    <p className="text-gray-600">{event.attendees_profile}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">🎯 Conseils de préparation</h4>
                    <ul className="space-y-2">
                      {event.preparation_tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start space-x-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span className="text-gray-600">{tip}</span>
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

      {/* Online Tab */}
      {activeTab === 'online' && networkingPlan && (
        <div className="space-y-6">
          {networkingPlan.online_strategies.map((strategy, index) => (
            <Card key={index}>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-800">
                  {strategy.platform} - {strategy.approach}
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">💡 Suggestions de contenu</h4>
                    <ul className="space-y-2">
                      {strategy.content_suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-gray-600">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">🎯 Tactiques d'engagement</h4>
                    <ul className="space-y-2">
                      {strategy.engagement_tactics.map((tactic, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span className="text-gray-600">{tactic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">🔄 Système de Suivi</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📅 Timeline de suivi</h4>
                  <p className="text-blue-700">{networkingPlan.follow_up_system.timeline}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">📧 Types de points de contact</h4>
                    <ul className="space-y-2">
                      {networkingPlan.follow_up_system.touchpoint_types.map((type, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span className="text-gray-600">{type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">🤝 Construction de relation</h4>
                    <ul className="space-y-2">
                      {networkingPlan.follow_up_system.relationship_building.map((tip, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span className="text-gray-600">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personal Branding Tab */}
      {activeTab === 'branding' && networkingPlan && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">📱 Optimisation LinkedIn</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {networkingPlan.personal_branding.linkedin_optimization.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-500 font-bold">{index + 1}</span>
                    <span className="text-blue-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">📝 Stratégie de Contenu</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {networkingPlan.personal_branding.content_strategy.map((strategy, index) => (
                  <li key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="text-green-700">{strategy}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">⭐ Leadership d'Opinion</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {networkingPlan.personal_branding.thought_leadership.map((action, index) => (
                  <li key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-500 font-bold">🚀</span>
                    <span className="text-purple-700">{action}</span>
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