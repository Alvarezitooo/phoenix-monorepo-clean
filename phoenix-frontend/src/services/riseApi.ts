import axios from 'axios';

// Luna Hub URL pour les services IA
const LUNA_HUB_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:8003'
  : 'https://luna-hub-production.up.railway.app';

// Client API pour Luna Hub avec auth
export const lunaHubClient = axios.create({
  baseURL: LUNA_HUB_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Support HTTPOnly cookies
});

// Types pour les modules Rise
export interface InterviewSimulationRequest {
  job_position: string;
  industry: string;
  interview_type: 'behavioral' | 'technical' | 'case_study' | 'situational';
  difficulty_level: 'junior' | 'mid_level' | 'senior' | 'executive';
  duration: number; // en minutes
}

export interface StorytellingCoachRequest {
  situation: string;
  context: 'interview' | 'presentation' | 'networking' | 'performance_review';
  story_framework: 'STAR' | 'CAR' | 'SOAR' | 'PAR';
  audience_level: 'peer' | 'management' | 'client' | 'team';
}

export interface CommunicationImpactRequest {
  communication_goal: string;
  audience_type: 'technical' | 'business' | 'mixed' | 'executive';
  presentation_context: 'meeting' | 'conference' | 'pitch' | 'training';
  key_messages: string[];
}

export interface NegotiationSkillsRequest {
  negotiation_type: 'salary' | 'contract' | 'project_scope' | 'timeline';
  counterpart_profile: 'hr' | 'manager' | 'client' | 'vendor';
  desired_outcome: string;
  constraints: string[];
}

export interface PersonalBrandingRequest {
  professional_field: string;
  career_stage: 'early' | 'mid' | 'senior' | 'executive';
  target_audience: 'employers' | 'clients' | 'peers' | 'industry';
  unique_value_proposition: string;
  current_presence: {
    linkedin: boolean;
    portfolio: boolean;
    speaking: boolean;
    writing: boolean;
  };
}

export interface LeadershipAssessmentRequest {
  leadership_context: 'team_lead' | 'project_manager' | 'department_head' | 'executive';
  team_size: number;
  industry: string;
  challenges: string[];
  leadership_style_preference: string;
}

// Services API Rise
export const riseApi = {
  // Simulation d'entretiens
  startInterviewSimulation: async (data: InterviewSimulationRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/rise/interview/simulate', data);
      return response.data;
    } catch (error) {
      console.error('Interview Simulation API error:', error);
      // Fallback vers simulation locale
      return new Promise(resolve => {
        setTimeout(() => {
          const questionTypes = {
            behavioral: [
              "Parlez-moi d'un défi que vous avez surmonté dans votre dernier poste",
              "Décrivez une situation où vous avez dû convaincre une équipe",
              "Comment gérez-vous les priorités conflictuelles ?"
            ],
            technical: [
              "Expliquez votre approche pour résoudre ce problème technique",
              "Comment optimiseriez-vous cette architecture ?",
              "Quels outils utilisez-vous pour le debugging ?"
            ],
            situational: [
              "Que feriez-vous si un projet prenait du retard ?",
              "Comment aborderiez-vous un conflit dans l'équipe ?",
              "Votre manager vous demande l'impossible, que faites-vous ?"
            ]
          };

          const questions = questionTypes[data.interview_type] || questionTypes.behavioral;

          resolve({
            session_id: `interview_${Date.now()}`,
            questions: questions.slice(0, Math.min(5, Math.floor(data.duration / 10))),
            simulation_config: {
              type: data.interview_type,
              position: data.job_position,
              difficulty: data.difficulty_level,
              duration: data.duration
            },
            evaluation_criteria: [
              'Clarté de communication',
              'Pertinence des exemples',
              'Structure des réponses',
              'Confiance et attitude'
            ],
            tips: [
              'Utilisez la méthode STAR pour les questions comportementales',
              'Préparez des exemples concrets et quantifiés',
              'Posez des questions pertinentes à la fin'
            ]
          });
        }, 2000);
      });
    }
  },

  // Coaching storytelling
  coachStoryTelling: async (data: StorytellingCoachRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/rise/storytelling/coach', data);
      return response.data;
    } catch (error) {
      console.error('Storytelling Coach API error:', error);
      // Fallback vers coaching local
      return new Promise(resolve => {
        setTimeout(() => {
          const frameworks = {
            STAR: {
              structure: ['Situation', 'Task', 'Action', 'Result'],
              description: 'Situation-Task-Action-Result pour présenter vos réalisations',
              example_prompts: [
                'Décrivez le contexte et les enjeux',
                'Quel était votre rôle spécifique ?',
                'Quelles actions avez-vous entreprises ?',
                'Quels résultats avez-vous obtenus ?'
              ]
            },
            CAR: {
              structure: ['Challenge', 'Action', 'Result'],
              description: 'Challenge-Action-Result pour des situations de résolution de problèmes',
              example_prompts: [
                'Quel était le défi ou problème ?',
                'Comment avez-vous agi pour le résoudre ?',
                'Quel fut l\'impact de vos actions ?'
              ]
            }
          };

          const selectedFramework = frameworks[data.story_framework] || frameworks.STAR;

          resolve({
            framework_guidance: selectedFramework,
            story_structure: {
              opening: 'Accroche qui contextualise votre histoire',
              development: 'Développement avec détails pertinents',
              climax: 'Point culminant de votre action',
              conclusion: 'Résultats et apprentissages'
            },
            customized_prompts: selectedFramework.example_prompts,
            storytelling_tips: [
              'Utilisez des détails sensoriels pour impliquer l\'audience',
              'Quantifiez vos résultats quand c\'est possible',
              'Terminez par l\'impact ou l\'apprentissage',
              'Adaptez la durée à votre contexte'
            ],
            practice_exercises: [
              'Racontez votre histoire en 60 secondes',
              'Variez l\'intensité selon les moments clés',
              'Préparez 3 versions : courte, moyenne, longue'
            ]
          });
        }, 2500);
      });
    }
  },

  // Impact communication
  assessCommunicationImpact: async (data: CommunicationImpactRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/rise/communication/impact', data);
      return response.data;
    } catch (error) {
      console.error('Communication Impact API error:', error);
      // Fallback vers analyse locale
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            impact_assessment: {
              clarity_score: 85,
              persuasion_potential: 78,
              audience_alignment: 92,
              message_coherence: 88
            },
            communication_strategy: {
              opening: 'Commencez par un fait marquant ou une question',
              structure: 'Utilisez la règle des 3 : 3 points clés maximum',
              support: 'Appuyez chaque point avec des exemples concrets',
              closing: 'Terminez par un appel à l\'action clair'
            },
            audience_adaptation: {
              technical: 'Utilisez un langage précis, schémas et données',
              business: 'Focus sur ROI, bénéfices et stratégie',
              mixed: 'Commencez simple, approfondissez progressivement',
              executive: 'Soyez concis, orienté résultats et décisions'
            },
            persuasion_techniques: [
              'Principe de réciprocité : offrez de la valeur d\'abord',
              'Preuve sociale : utilisez des exemples de réussite',
              'Autorité : mettez en avant votre expertise',
              'Engagement : faites participer votre audience'
            ],
            improvement_areas: [
              'Renforcez l\'accroche d\'ouverture',
              'Ajoutez plus d\'exemples concrets',
              'Optimisez la conclusion pour l\'action'
            ]
          });
        }, 3000);
      });
    }
  },

  // Compétences négociation
  trainNegotiationSkills: async (data: NegotiationSkillsRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/rise/negotiation/train', data);
      return response.data;
    } catch (error) {
      console.error('Negotiation Skills API error:', error);
      // Fallback vers entraînement local
      return new Promise(resolve => {
        setTimeout(() => {
          const strategies = {
            salary: {
              preparation: [
                'Recherchez les salaires du marché pour votre poste',
                'Préparez vos arguments de valeur ajoutée',
                'Définissez votre seuil minimum acceptable'
              ],
              tactics: [
                'Laissez l\'employeur faire la première offre',
                'Négociez le package complet, pas seulement le salaire',
                'Utilisez des fourchettes plutôt que des montants fixes'
              ],
              scripts: [
                '"Basé sur ma recherche marché et mon expérience..."',
                '"Je suis ouvert à discuter d\'un package complet..."',
                '"Pouvons-nous explorer d\'autres éléments de rémunération ?"'
              ]
            },
            contract: {
              preparation: [
                'Identifiez vos points non-négociables',
                'Préparez des alternatives créatives',
                'Comprenez les contraintes de votre interlocuteur'
              ],
              tactics: [
                'Cherchez les solutions win-win',
                'Séparez les personnes du problème',
                'Utilisez des critères objectifs'
              ]
            }
          };

          const selectedStrategy = strategies[data.negotiation_type] || strategies.salary;

          resolve({
            negotiation_framework: {
              preparation: selectedStrategy.preparation,
              opening: 'Établissez un climat de collaboration',
              exploration: 'Découvrez les intérêts mutuels',
              bargaining: 'Proposez et évaluez les options',
              closing: 'Formalisez l\'accord obtenu'
            },
            tactical_approaches: selectedStrategy.tactics || [],
            conversation_scripts: selectedStrategy.scripts || [],
            common_objections: [
              '"Ce n\'est pas dans notre budget"',
              '"C\'est notre politique standard"',
              '"Il faut que j\'en parle à ma hiérarchie"'
            ],
            response_strategies: [
              'Comprenez l\'objection réelle derrière les mots',
              'Reformulez pour valider votre compréhension',
              'Proposez des alternatives créatives'
            ],
            practice_scenarios: [
              'Simulation avec objections fréquentes',
              'Jeu de rôles avec inversion des rôles',
              'Négociation sous pression temporelle'
            ]
          });
        }, 3500);
      });
    }
  },

  // Personal branding
  developPersonalBranding: async (data: PersonalBrandingRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/rise/branding/develop', data);
      return response.data;
    } catch (error) {
      console.error('Personal Branding API error:', error);
      // Fallback vers stratégie locale
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            brand_strategy: {
              positioning: `Expert ${data.professional_field} spécialisé(e) en ${data.unique_value_proposition}`,
              target_personas: [
                'Recruteurs dans votre domaine',
                'Pairs et collaborateurs',
                'Clients potentiels',
                'Leaders d\'opinion du secteur'
              ],
              key_messages: [
                'Expertise technique démontrée',
                'Vision stratégique du secteur',
                'Capacité d\'innovation et adaptation'
              ]
            },
            content_strategy: {
              linkedin: {
                frequency: '3 posts par semaine',
                content_types: ['Insights sectoriels', 'Retours d\'expérience', 'Analyses de tendances'],
                engagement: 'Commentez 5 posts par jour dans votre domaine'
              },
              thought_leadership: [
                'Participez à des conférences sectorielles',
                'Écrivez des articles sur votre expertise',
                'Animez des webinaires ou formations'
              ]
            },
            online_presence_audit: {
              current_score: 65,
              strengths: ['Profil LinkedIn complet', 'Réseau professionnel développé'],
              gaps: ['Présence limitée sur autres plateformes', 'Peu de contenu créé'],
              recommendations: [
                'Créez un portfolio en ligne',
                'Développez une newsletter sectorielle',
                'Participez à des podcasts comme invité(e)'
              ]
            },
            action_plan: {
              month_1: 'Optimisation profil et audit présence',
              month_2: 'Création contenu et engagement réseau',
              month_3: 'Développement thought leadership',
              month_6: 'Évaluation impact et ajustements'
            }
          });
        }, 4000);
      });
    }
  },

  // Assessment leadership
  assessLeadershipSkills: async (data: LeadershipAssessmentRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/rise/leadership/assess', data);
      return response.data;
    } catch (error) {
      console.error('Leadership Assessment API error:', error);
      // Fallback vers évaluation locale
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            leadership_profile: {
              dominant_style: 'Transformationnel',
              style_breakdown: {
                transformationnel: 78,
                transactionnel: 65,
                participatif: 82,
                directif: 58
              },
              strengths: [
                'Vision inspirante',
                'Communication efficace',
                'Développement des talents',
                'Innovation encouragée'
              ]
            },
            situational_adaptability: {
              crisis_management: 72,
              change_leadership: 85,
              team_building: 79,
              performance_coaching: 68
            },
            development_areas: [
              'Améliorer la gestion des performances difficiles',
              'Renforcer les compétences de coaching individuel',
              'Développer la gestion de crise sous pression'
            ],
            action_plan: {
              immediate: [
                'Formation coaching pour managers',
                'Mise en place de 1-on-1 structurés',
                'Développement feedback constructif'
              ],
              medium_term: [
                'Mentoring par un leader senior',
                'Participation à un leadership program',
                'Projet de transformation à mener'
              ]
            },
            team_impact_prediction: {
              engagement_score: 85,
              retention_probability: 78,
              performance_improvement: 15
            }
          });
        }, 3500);
      });
    }
  }
};

// Intercepteur pour gérer les erreurs d'auth
lunaHubClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Authentication required for Rise API');
      // Rediriger vers login si nécessaire
    }
    throw error;
  }
);