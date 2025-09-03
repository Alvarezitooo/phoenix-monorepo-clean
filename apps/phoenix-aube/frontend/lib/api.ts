import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const LUNA_HUB_URL = process.env.NEXT_PUBLIC_LUNA_HUB_URL || 'https://luna-hub-backend-unified-production.up.railway.app';

// Types pour l'API
export interface AubeSignals {
  people_vs_data: number; // 1-7 scale
  detail_vs_vision: number;
  work_values: Record<string, number>; // ranking
  work_environment: string;
  team_size: string;
  autonomy_level: number;
  leadership: number;
  creativity_importance: number;
  innovation_comfort: string;
  change_comfort: number;
  routine_variety: number;
  impact_scope: string;
  meaning_importance: number;
  learning_style: string;
  career_evolution: string;
}

export interface CareerMatch {
  title: string;
  compatibility_score: number;
  description: string;
  required_skills: string[];
  transition_difficulty: 'facile' | 'modéré' | 'élevé';
  salary_range: string;
  growth_outlook: string;
  industry: string;
}

export interface PersonalityDimension {
  dimension: string;
  score: number;
  description: string;
}

export interface AssessmentResults {
  personality_profile: PersonalityDimension[];
  career_matches: CareerMatch[];
  insights: string[];
}

// Configuration axios moderne avec HTTPOnly cookies
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // HTTPOnly cookies support
});

// Interceptor pour ajouter headers standardisés
apiClient.interceptors.request.use(
  (config) => {
    // Headers standardisés Phoenix
    config.headers['Content-Type'] = 'application/json';
    config.headers['X-Service'] = 'phoenix-aube';
    config.headers['X-Request-ID'] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor moderne pour gestion d'erreurs standardisée
apiClient.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    if (error.response?.status === 401) {
      // Unauthorized - Redirection vers login
      window.location.href = '/login';
    } else if (error.response?.status === 402) {
      // Payment Required - Énergie insuffisante
      window.open(`${LUNA_HUB_URL}/energy/buy`, '_blank');
    }
    return Promise.reject(error);
  }
);

// API Methods
export const phoenixAubeApi = {
  // Health check
  async healthCheck() {
    try {
      const response = await apiClient.get('/aube/health');
      return response.data;
    } catch (error: unknown) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Vérification énergie Luna Hub
  async checkEnergy(userId: string, actionType: string) {
    try {
      const response = await apiClient.post('/aube/energy/check', {
        user_id: userId,
        action_type: actionType,
        estimated_cost: actionType === 'assessment_complet' ? 25 : 12
      });
      return response.data;
    } catch (error: unknown) {
      console.error('Energy check failed:', error);
      throw error;
    }
  },

  // Assessment complet
  async submitAssessment(userId: string, signals: AubeSignals, context?: object): Promise<AssessmentResults> {
    try {
      const response = await apiClient.post('/aube/career-match-luna', {
        user_id: userId,
        signals,
        context
      });
      return response.data;
    } catch (error: unknown) {
      console.error('Assessment submission failed:', error);
      throw error;
    }
  },

  // Statut assessment utilisateur
  async getAssessmentStatus(userId: string) {
    try {
      const response = await apiClient.get(`/aube/assessment/status/${userId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to get assessment status:', error);
      throw error;
    }
  },

  // Recommandations carrière
  async getRecommendations(userId: string, limit = 10, includeAnalysis = true) {
    try {
      const response = await apiClient.get(`/aube/recommendations/${userId}`, {
        params: { limit, include_analysis: includeAnalysis }
      });
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  },

  // Base métiers
  async getCareersDatabase(category?: string, limit = 50) {
    try {
      const response = await apiClient.get('/aube/careers/database', {
        params: { category, limit }
      });
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to get careers database:', error);
      throw error;
    }
  },

  // Vérification énergie (intégrée dans career-match-luna endpoint)
  async checkUserEnergy(userId: string) {
    try {
      // L'énergie est vérifiée automatiquement via Luna Hub dans career-match-luna
      // Cette méthode peut être utilisée pour prévisualiser l'état
      const status = await this.getAssessmentStatus(userId);
      return status;
    } catch (error: unknown) {
      console.error('Failed to check user energy:', error);
      throw error;
    }
  }
};

// DEPRECATED: Legacy helpers removed - Use AuthService for all Luna Hub interactions

export default apiClient;