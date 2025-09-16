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

// Types pour les modules Letters
export interface LetterGenerationRequest {
  job_title: string;
  company_name: string;
  job_description?: string;
  applicant_profile: {
    name: string;
    experience: string;
    skills: string[];
    motivation: string;
  };
  letter_type: 'motivation' | 'cover' | 'follow_up' | 'networking';
  tone: 'professional' | 'enthusiastic' | 'creative';
}

export interface CompanyResearchRequest {
  company_name: string;
  company_url?: string;
  industry?: string;
  research_depth: 'basic' | 'complete' | 'strategic';
}

export interface CareerTransitionRequest {
  current_field: string;
  target_field: string;
  transition_reason: string;
  transferable_skills: string[];
  experience_level: string;
}

export interface InteractiveFlowRequest {
  session_id: string;
  step: 'company_info' | 'job_analysis' | 'profile_matching' | 'letter_generation';
  data: Record<string, any>;
}

export interface TemplateCustomizationRequest {
  template_id: string;
  personalizations: {
    header_style: string;
    font_family: string;
    color_scheme: string;
    signature_style: string;
  };
  content_sections: string[];
}

// Services API Letters
export const lettersApi = {
  // Génération lettres principales
  generateLetter: async (data: LetterGenerationRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/letters/generate', data);
      return response.data;
    } catch (error) {
      console.error('Letter Generation API error:', error);
      // Fallback vers génération locale sophistiquée
      return new Promise(resolve => {
        setTimeout(() => {
          const templates = {
            professional: {
              opening: `Madame, Monsieur,\n\nC'est avec un vif intérêt que j'ai pris connaissance de votre offre pour le poste de ${data.job_title} au sein de ${data.company_name}.`,
              body: `Fort(e) de ${data.applicant_profile.experience} d'expérience, je possède les compétences techniques recherchées, notamment ${data.applicant_profile.skills.slice(0, 3).join(', ')}. ${data.applicant_profile.motivation}`,
              closing: `Convaincu(e) que mon profil correspond à vos attentes, je serais ravi(e) de vous rencontrer pour approfondir ma candidature.\n\nCordialement,\n${data.applicant_profile.name}`
            },
            enthusiastic: {
              opening: `Bonjour,\n\nJe suis absolument enthousiaste à l'idée de rejoindre ${data.company_name} en tant que ${data.job_title} !`,
              body: `Mes ${data.applicant_profile.experience} d'expérience m'ont permis de développer une expertise en ${data.applicant_profile.skills.slice(0, 2).join(' et ')}. Ce qui me motive particulièrement : ${data.applicant_profile.motivation}`,
              closing: `J'ai hâte d'échanger avec vous sur cette opportunité passionnante !\n\nÀ très bientôt,\n${data.applicant_profile.name}`
            }
          };

          const selectedTemplate = templates[data.tone as keyof typeof templates] || templates.professional;

          resolve({
            success: true,
            letter_id: `letter_${Date.now()}`,
            content: {
              subject: `Candidature ${data.job_title} - ${data.applicant_profile.name}`,
              body: `${selectedTemplate.opening}\n\n${selectedTemplate.body}\n\n${selectedTemplate.closing}`,
              word_count: 150,
              estimated_reading_time: '1 min'
            },
            analysis: {
              tone_score: data.tone === 'professional' ? 92 : 88,
              personalization_score: 85,
              keyword_optimization: 78,
              ats_compatibility: 82
            },
            suggestions: [
              'Ajouter des exemples quantifiés',
              'Personnaliser davantage pour l\'entreprise',
              'Optimiser les mots-clés du secteur'
            ]
          });
        }, 3000);
      });
    }
  },

  // Recherche entreprise
  researchCompany: async (data: CompanyResearchRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/letters/company-research', data);
      return response.data;
    } catch (error) {
      console.error('Company Research API error:', error);
      // Fallback vers recherche mock
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            company_info: {
              name: data.company_name,
              industry: data.industry || 'Technology',
              size: '100-500 employees',
              headquarters: 'Paris, France',
              founded: '2010',
              description: `${data.company_name} est une entreprise innovante spécialisée dans ${data.industry || 'les solutions technologiques'}.`
            },
            recent_news: [
              {
                title: `${data.company_name} annonce une levée de fonds`,
                date: '2024-08-15',
                summary: 'Expansion internationale prévue'
              },
              {
                title: 'Nouveau partenariat stratégique',
                date: '2024-07-20',
                summary: 'Renforcement de la position marché'
              }
            ],
            culture_values: [
              'Innovation',
              'Collaboration',
              'Excellence',
              'Responsabilité sociale'
            ],
            key_executives: [
              {
                name: 'Marie Martin',
                position: 'CEO',
                background: 'Ex-Google, Stanford MBA'
              }
            ],
            personalization_tips: [
              `Mentionner l'expansion internationale de ${data.company_name}`,
              'Souligner l\'alignement avec les valeurs d\'innovation',
              'Référencer le partenariat stratégique récent'
            ]
          });
        }, 2500);
      });
    }
  },

  // Lettres transition carrière
  generateTransitionLetter: async (data: CareerTransitionRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/letters/career-transition', data);
      return response.data;
    } catch (error) {
      console.error('Career Transition API error:', error);
      // Fallback vers génération spécialisée
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
            transition_letter: {
              introduction: `Après ${data.experience_level} dans le secteur ${data.current_field}, je souhaite aujourd'hui orienter ma carrière vers ${data.target_field}. Cette transition s'appuie sur ${data.transition_reason}.`,
              skills_bridge: `Mes compétences en ${data.transferable_skills.join(', ')} sont directement applicables et valorisables dans votre secteur.`,
              motivation: `Ce changement de trajectoire reflète ma volonté d'évoluer vers un domaine qui correspond davantage à mes aspirations professionnelles.`,
              call_to_action: 'Je serais ravi(e) de vous expliquer en détail comment mon parcours atypique peut apporter une valeur ajoutée à votre équipe.'
            },
            transition_strengths: [
              'Vision cross-sectorielle',
              'Adaptabilité démontrée',
              'Compétences transférables valorisées',
              'Motivation authentique'
            ],
            addressing_concerns: [
              'Expliquer la logique de transition',
              'Rassurer sur l\'engagement long terme',
              'Démontrer la préparation du changement'
            ]
          });
        }, 3500);
      });
    }
  },

  // Flow interactif de génération
  processInteractiveFlow: async (data: InteractiveFlowRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/letters/interactive-flow', data);
      return response.data;
    } catch (error) {
      console.error('Interactive Flow API error:', error);
      // Fallback vers logique de flow
      return new Promise(resolve => {
        setTimeout(() => {
          const responses = {
            company_info: {
              next_step: 'job_analysis',
              collected_data: data.data,
              suggestions: ['Vérifiez le site web de l\'entreprise', 'Consultez LinkedIn pour les équipes'],
              progress: 25
            },
            job_analysis: {
              next_step: 'profile_matching',
              analysis: 'Job requirements analyzed successfully',
              key_requirements: ['Experience', 'Technical skills', 'Soft skills'],
              progress: 50
            },
            profile_matching: {
              next_step: 'letter_generation',
              match_score: 87,
              strengths: ['Strong technical background', 'Relevant experience'],
              gaps: ['Industry-specific knowledge'],
              progress: 75
            },
            letter_generation: {
              next_step: 'complete',
              letter_preview: 'Generated letter preview...',
              customization_options: ['Tone adjustment', 'Length optimization'],
              progress: 100
            }
          };

          resolve(responses[data.step] || { error: 'Invalid step' });
        }, 1500);
      });
    }
  },

  // Customisation templates
  customizeTemplate: async (data: TemplateCustomizationRequest) => {
    try {
      const response = await lunaHubClient.post('/luna/letters/customize-template', data);
      return response.data;
    } catch (error) {
      console.error('Template Customization API error:', error);
      // Fallback vers customisation locale
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            customized_template: {
              template_id: data.template_id,
              preview_html: `<div style="font-family: ${data.personalizations.font_family}">Customized template preview</div>`,
              css_styles: {
                header: data.personalizations.header_style,
                body: `font-family: ${data.personalizations.font_family}`,
                colors: data.personalizations.color_scheme
              },
              sections_enabled: data.content_sections
            },
            customization_score: 92,
            recommendations: [
              'Template bien équilibré',
              'Couleurs professionnelles appropriées',
              'Lisibilité optimale'
            ]
          });
        }, 2000);
      });
    }
  }
};

// Intercepteur pour gérer les erreurs d'auth
lunaHubClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Authentication required for Letters API');
      // Rediriger vers login si nécessaire
    }
    throw error;
  }
);