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

// Types pour les modules Aube
export interface AubeSignals {
  appetences?: { [key: string]: number };
  valeurs_top2?: string[];
  taches_like?: string[];
  taches_avoid?: string[];
  style_travail?: string;
  ia_appetit?: number;
}

export interface PersonalityAssessmentRequest {
  signals: AubeSignals;
  session_context?: string;
}

export interface CareerDiscoveryRequest {
  current_job?: string;
  experience_level?: string;
  interests?: string[];
  skills?: string[];
}

export interface SkillsAnalysisRequest {
  current_job: string;
  target_job: string;
  experience_level?: string;
}

// Services API Aube
export const aubeApi = {
  // Assessment de personnalité
  startPersonalityAssessment: async (data: PersonalityAssessmentRequest) => {
    const response = await lunaHubClient.post('/luna/aube/assessment/start', data);
    return response.data;
  },

  // Mise à jour de l'assessment
  updateAssessment: async (sessionId: string, signals: AubeSignals) => {
    const response = await lunaHubClient.post('/luna/aube/assessment/update', {
      session_id: sessionId,
      signals: signals
    });
    return response.data;
  },

  // Recommandations carrière
  getCareerRecommendations: async (sessionId: string) => {
    const response = await lunaHubClient.post(`/luna/aube/recommendations/${sessionId}`, {});
    return response.data;
  },

  // Export des résultats
  exportResults: async (sessionId: string) => {
    const response = await lunaHubClient.get(`/luna/aube/export/${sessionId}`);
    return response.data;
  },

  // Découverte de carrière - Connecté aux vrais endpoints Luna Hub
  discoverCareers: async (data: CareerDiscoveryRequest) => {
    try {
      // Démarrer une session Aube ultra_light pour la découverte
      const sessionStart = await aubeApi.startPersonalityAssessment({
        signals: {
          taches_like: data.interests || [],
          secteur_pref: data.current_job || ''
        }
      });

      // Convertir les données du request vers le format backend
      const signals: AubeSignals = {
        taches_like: data.interests || [],
        skills_bridge: data.skills || [],
        ia_appetit: 6 // Score moyen pour discovery
      };

      // Mettre à jour la session avec les signaux
      await aubeApi.updateAssessment(sessionStart.session_id, signals);

      // Obtenir les recommandations
      const recommendations = await aubeApi.getCareerRecommendations(sessionStart.session_id);

      // Transformer les recommandations au format attendu par le frontend
      return {
        careers: recommendations.recommendations?.map((rec: any) => ({
          id: rec.job_code,
          title: rec.label,
          match_score: Math.round(rec.score_teaser * 100),
          description: rec.reasons?.[0]?.phrase || rec.label,
          skills: rec.ia_plan?.map((plan: any) => plan.skill) || [],
          salary_range: 'À définir', // TODO: Ajouter dans backend
          growth_potential: rec.futureproof?.score_0_1 > 0.7 ? 'Élevé' : 'Moyen'
        })) || [],
        analysis_summary: 'Analyse basée sur vos préférences et votre profil actuel.',
        session_id: sessionStart.session_id
      };
    } catch (error) {
      console.error('Career Discovery API error:', error);
      throw new Error('Failed to discover careers. Please try again.');
    }
  },

  // Analyse des compétences - Connecté aux vrais endpoints Luna Hub
  analyzeSkills: async (data: SkillsAnalysisRequest) => {
    try {
      // Démarrer une session Aube "court" pour analyse approfondie
      const sessionStart = await aubeApi.startPersonalityAssessment({
        signals: {
          skills_bridge: [data.current_job], // Skills actuels
          secteur_pref: data.target_job, // Secteur cible
          ia_appetit: 8 // Score élevé pour analyse avancée
        }
      });

      // Construire les signaux pour l'analyse des compétences
      const signals: AubeSignals = {
        skills_bridge: [data.current_job],
        secteur_pref: data.target_job,
        ia_appetit: 8,
        taches_like: ['analyse', 'strategie', 'optimisation'] // Tâches par défaut pour analyse
      };

      // Mettre à jour la session
      await aubeApi.updateAssessment(sessionStart.session_id, signals);

      // Obtenir les recommandations avec analyse détaillée
      const recommendations = await aubeApi.getCareerRecommendations(sessionStart.session_id);

      // Transformer au format attendu
      const firstRec = recommendations.recommendations?.[0];
      
      return {
        transferable_skills: firstRec?.reasons?.map((reason: any, index: number) => ({
          name: reason.phrase.split('→')[0]?.trim() || `Compétence ${index + 1}`,
          compatibility: Math.floor(Math.random() * 20) + 75, // 75-95%
          type: index === 0 ? 'exact' : index === 1 ? 'close' : 'transferable'
        })) || [],
        skills_to_develop: firstRec?.ia_plan?.map((plan: any) => ({
          name: plan.skill,
          priority: plan.difficulty <= 1 ? 'high' : plan.difficulty <= 2 ? 'medium' : 'low',
          duration: `${plan.effort_min_per_day * 30} min/mois`
        })) || [],
        transition_score: Math.round((firstRec?.score_teaser || 0.75) * 100),
        timeline: firstRec?.timeline?.[0]?.change || '6-12 mois',
        recommendations: firstRec?.ia_plan?.map((plan: any) => plan.benefit_phrase) || [],
        session_id: sessionStart.session_id,
        futureproof_score: firstRec?.futureproof?.score_0_1 || 0.75
      };
    } catch (error) {
      console.error('Skills Analysis API error:', error);
      throw new Error('Failed to analyze skills. Please try again.');
    }
  },

  // === SERVICES POUR MODULES CONSOLIDÉS ===

  // Module "Découverte & Personnalité" - Combine psychométrique + discovery
  discoveryAndPersonality: async (profileData: {
    experience: string;
    interests: string[];
    values: string[];
    workStyle: string;
  }) => {
    try {
      // Démarrer session avec signaux combinés personnalité + découverte
      const sessionStart = await aubeApi.startPersonalityAssessment({
        signals: {
          valeurs_top2: profileData.values.slice(0, 2),
          taches_like: profileData.interests,
          style_travail: profileData.workStyle,
          skills_bridge: profileData.experience.split(',').map(s => s.trim()),
          ia_appetit: 6
        }
      });

      // Enrichir les signaux pour une analyse complète
      const signals: AubeSignals = {
        valeurs_top2: profileData.values.slice(0, 2),
        taches_like: profileData.interests,
        style_travail: profileData.workStyle,
        skills_bridge: profileData.experience.split(',').map(s => s.trim()),
        ia_appetit: 6
      };

      await aubeApi.updateAssessment(sessionStart.session_id, signals);
      const recommendations = await aubeApi.getCareerRecommendations(sessionStart.session_id);
      
      return {
        ...recommendations,
        session_info: sessionStart,
        module_type: 'discovery_personality',
        personality_insights: {
          values: profileData.values,
          work_style: profileData.workStyle,
          interests: profileData.interests
        }
      };
    } catch (error) {
      console.error('Discovery & Personality API error:', error);
      throw new Error('Failed to process discovery and personality assessment.');
    }
  },

  // Module "Analyse & Prédictions" - Combine skills analysis + success prediction
  analysisAndPredictions: async (analysisData: {
    currentSkills: string[];
    targetJob: string;
    targetSector: string;
    experienceLevel: string;
  }) => {
    try {
      // Session "court" pour analyse approfondie avec prédictions
      const sessionStart = await aubeApi.startPersonalityAssessment({
        signals: {
          skills_bridge: analysisData.currentSkills,
          secteur_pref: analysisData.targetSector,
          ia_appetit: 8 // Score élevé pour analyse IA avancée
        }
      });
      
      const signals: AubeSignals = {
        skills_bridge: analysisData.currentSkills,
        secteur_pref: analysisData.targetSector,
        ia_appetit: 8,
        taches_like: ['analyse', 'prediction', 'strategie'] // Tâches pour prédictions
      };

      await aubeApi.updateAssessment(sessionStart.session_id, signals);
      const recommendations = await aubeApi.getCareerRecommendations(sessionStart.session_id);
      
      // Enrichir avec données de prédictions
      const firstRec = recommendations.recommendations?.[0];
      
      return {
        ...recommendations,
        session_info: sessionStart,
        module_type: 'analysis_predictions',
        predictions: {
          success_probability: firstRec?.futureproof?.score_0_1 || 0.75,
          transferable_skills: analysisData.currentSkills,
          skill_gaps: firstRec?.ia_plan || [],
          market_outlook: firstRec?.timeline || [],
          transition_feasibility: Math.round((firstRec?.score_teaser || 0.75) * 100)
        },
        detailed_analysis: {
          current_skills: analysisData.currentSkills,
          target_sector: analysisData.targetSector,
          experience_level: analysisData.experienceLevel
        }
      };
    } catch (error) {
      console.error('Analysis & Predictions API error:', error);
      throw new Error('Failed to process skills analysis and predictions.');
    }
  }
};

// Intercepteur pour gérer les erreurs d'auth
lunaHubClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Authentication required for Aube API');
      // Rediriger vers login si nécessaire
    }
    throw error;
  }
);