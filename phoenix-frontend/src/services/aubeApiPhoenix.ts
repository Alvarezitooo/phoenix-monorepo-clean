import axios from 'axios';

// Phoenix API URL pour les services Aube avec vraie Gemini
const PHOENIX_API_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:8000'
  : 'https://phoenix-api-production.up.railway.app';

// Client API pour Phoenix API (Aube avec Gemini)
export const phoenixAubeClient = axios.create({
  baseURL: `${PHOENIX_API_URL}/api/v1/aube`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// 🔐 AUTH: Get or create auth token for development
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Check if we have a stored token
    const storedToken = localStorage.getItem('phoenix_auth_token');
    if (storedToken) {
      return storedToken;
    }

    // For development, use environment variables (create .env file)
    const DEV_EMAIL = import.meta.env.VITE_DEV_EMAIL;
    const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD;
    
    if (!DEV_EMAIL || !DEV_PASSWORD) {
      console.log('⚠️ Dev credentials not found in .env file. Add VITE_DEV_EMAIL and VITE_DEV_PASSWORD');
      return null;
    }

    console.log('🔐 Authenticating with Luna Hub...');
    const LUNA_HUB_URL = import.meta.env.MODE === 'development'
      ? 'http://localhost:8003'
      : 'https://luna-hub-production.up.railway.app';
      
    const authResponse = await axios.post(`${LUNA_HUB_URL}/auth/login`, {
      email: DEV_EMAIL,
      password: DEV_PASSWORD
    });

    if (authResponse.data?.access_token) {
      const token = authResponse.data.access_token;
      localStorage.setItem('phoenix_auth_token', token);
      console.log('✅ Authentication successful');
      return token;
    }
  } catch (error) {
    console.log('⚠️ Authentication failed:', error);
  }
  return null;
};

// Add auth interceptor to include token in requests
phoenixAubeClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types pour Phoenix API Aube
export interface PhoenixChatRequest {
  message: string;
  persona?: string;
  context?: Record<string, any>;
}

export interface PhoenixSkillTransferRequest {
  current_role: string;
  current_industry: string;
  years_experience: number;
  target_role: string;
  target_industry: string;
  key_skills: string[];
  key_achievements?: string[];
}

export interface PhoenixCareerDiscoveryRequest {
  current_role: string;
  current_industry: string;
  years_experience: number;
  interests: string[];
  preferred_work_environment?: string;
  salary_expectations?: string;
}

export interface PhoenixTransitionRoadmapRequest {
  current_profile: Record<string, any>;
  target_career: Record<string, any>;
  timeline_months?: number;
}

// Services API Phoenix Aube (avec vraie Gemini)
export const phoenixAubeApi = {
  // Chat with Luna (délégué à Luna Hub pour event sourcing)
  chat: async (data: PhoenixChatRequest) => {
    try {
      const response = await phoenixAubeClient.post('/chat', data);
      return response.data;
    } catch (error) {
      console.error('Phoenix Aube Chat API Error:', error);
      throw new Error('Failed to chat with Luna. Please try again.');
    }
  },

  // Skill Transfer Analysis (vraie Gemini)
  analyzeSkillTransfer: async (data: PhoenixSkillTransferRequest) => {
    try {
      const response = await phoenixAubeClient.post('/skill-transfer-analysis', data);
      return response.data;
    } catch (error) {
      console.error('Phoenix Skill Transfer API Error:', error);
      throw new Error('Failed to analyze skill transfer. Please try again.');
    }
  },

  // Career Discovery (vraie Gemini)
  discoverCareers: async (data: PhoenixCareerDiscoveryRequest) => {
    try {
      const response = await phoenixAubeClient.post('/career-discovery', data);
      return response.data;
    } catch (error) {
      console.error('Phoenix Career Discovery API Error:', error);
      throw new Error('Failed to discover careers. Please try again.');
    }
  },

  // Transition Roadmap (vraie Gemini)
  generateTransitionRoadmap: async (data: PhoenixTransitionRoadmapRequest) => {
    try {
      const response = await phoenixAubeClient.post('/transition-roadmap', data);
      return response.data;
    } catch (error) {
      console.error('Phoenix Transition Roadmap API Error:', error);
      throw new Error('Failed to generate transition roadmap. Please try again.');
    }
  }
};

// Transformation helpers pour compatibilité avec les hooks existants
export const transformCareerDiscoveryRequest = (data: any): PhoenixCareerDiscoveryRequest => ({
  current_role: data.current_job || data.currentJob || 'Professional',
  current_industry: data.current_industry || data.currentIndustry || 'Various',
  years_experience: (() => {
    const exp = data.experience_level || data.experience || '';
    if (exp.includes('0-2')) return 1;
    if (exp.includes('2-5')) return 3;
    if (exp.includes('5+')) return 8;
    // Fallback pour anciens formats
    if (exp === 'débutant') return 1;
    if (exp === 'intermédiaire') return 5;
    return 5; // Default safe value
  })(),
  interests: data.interests || [],
  preferred_work_environment: data.work_environment,
  salary_expectations: data.salary_expectations
});

export const transformSkillTransferRequest = (data: any): PhoenixSkillTransferRequest => ({
  current_role: data.current_job || data.currentRole || 'Professional',
  current_industry: data.current_industry || data.currentIndustry || 'Various',
  years_experience: data.years_experience || 5,
  target_role: data.target_job || data.targetRole || 'New Role',
  target_industry: data.target_industry || data.targetIndustry || 'New Industry',
  key_skills: data.skills || data.key_skills || [],
  key_achievements: data.achievements || data.key_achievements || []
});