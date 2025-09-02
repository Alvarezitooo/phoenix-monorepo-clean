import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
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

// Configuration axios avec interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Interceptor pour ajouter le token Luna Hub
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('luna_hub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor pour gérer les erreurs d'énergie
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      // Payment Required - Énergie insuffisante
      window.location.href = `${LUNA_HUB_URL}/energy/buy`;
    } else if (error.response?.status === 401) {
      // Unauthorized - Token expiré
      localStorage.removeItem('luna_hub_token');
      window.location.href = '/login';
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
    } catch (error) {
      console.error('Health check failed:', error);
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
    } catch (error) {
      console.error('Assessment submission failed:', error);
      throw error;
    }
  },

  // Statut assessment utilisateur
  async getAssessmentStatus(userId: string) {
    try {
      const response = await apiClient.get(`/aube/assessment/status/${userId}`);
      return response.data;
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to check user energy:', error);
      throw error;
    }
  }
};

// Helpers Luna Hub
export const lunaHubHelpers = {
  // Redirection vers Luna Hub
  redirectToEnergyPurchase() {
    window.open(`${LUNA_HUB_URL}/energy/buy`, '_blank');
  },

  redirectToLogin() {
    window.location.href = `${LUNA_HUB_URL}/auth/login?redirect=${encodeURIComponent(window.location.origin)}`;
  },

  // Récupération token depuis URL callback
  extractTokenFromCallback(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('luna_hub_token', token);
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    return token;
  },

  // Vérification token validité
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${LUNA_HUB_URL}/api/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
};

export default apiClient;