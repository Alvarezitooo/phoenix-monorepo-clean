/**
 * 🚀 Phoenix Letters API Service
 * Connexion au backend FastAPI Clean Architecture
 */

import { Letter, User, UserStats, FormData } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types API (matching FastAPI DTOs)
interface GenerateLetterRequest {
  company_name: string;
  position_title: string;
  job_description?: string;
  experience_level: 'junior' | 'intermédiaire' | 'senior';
  desired_tone: 'professionnel' | 'enthousiaste' | 'créatif' | 'décontracté';
  max_words: number;
  use_ai: boolean;
}

interface GenerateLetterResponse {
  letter: {
    id: string;
    content: string;
    company_name: string | null;
    position_title: string | null;
    status: string;
    word_count: number;
    estimated_read_time_seconds: number;
    ai_generated: boolean;
    generation_model: string | null;
    created_at: string;
    updated_at: string;
    quality_indicators: Record<string, any>;
    filename: string;
  };
  generation_info: Record<string, any>;
  user_updated: boolean;
}

interface LetterResponse {
  id: string;
  content: string;
  company_name: string | null;
  position_title: string | null;
  status: string;
  word_count: number;
  estimated_read_time_seconds: number;
  ai_generated: boolean;
  generation_model: string | null;
  created_at: string;
  updated_at: string;
  quality_indicators: Record<string, any>;
  filename: string;
}

interface UserStatisticsResponse {
  total_letters: number;
  this_month: number;
  average_quality: number;
  productivity_trend: string;
  current_month_usage: {
    letters_generated: number;
    letters_downloaded: number;
    remaining_free: number | null;
    is_premium: boolean;
  };
  account_info: {
    tier: string;
    days_remaining: number | null;
    auto_renew: boolean;
  };
}

// Utility functions pour conversion
const mapExperienceLevel = (level: 'junior' | 'intermediate' | 'senior'): 'junior' | 'intermédiaire' | 'senior' => {
  const mapping = {
    'junior': 'junior' as const,
    'intermediate': 'intermédiaire' as const,
    'senior': 'senior' as const,
  };
  return mapping[level];
};

const mapTone = (tone: 'professional' | 'enthusiastic' | 'creative' | 'casual'): 'professionnel' | 'enthousiaste' | 'créatif' | 'décontracté' => {
  const mapping = {
    'professional': 'professionnel' as const,
    'enthusiastic': 'enthousiaste' as const,
    'creative': 'créatif' as const,
    'casual': 'décontracté' as const,
  };
  return mapping[tone];
};

const mapApiLetterToLetter = (apiLetter: LetterResponse): Omit<Letter, 'settings'> => ({
  id: apiLetter.id,
  userId: 'demo-user', // TODO: Get from auth
  companyName: apiLetter.company_name || '',
  positionTitle: apiLetter.position_title || '',
  experienceLevel: 'intermediate', // TODO: Store in API
  tone: 'professional', // TODO: Store in API
  jobDescription: '', // TODO: Store in API
  content: apiLetter.content,
  wordCount: apiLetter.word_count,
  readingTime: Math.ceil(apiLetter.estimated_read_time_seconds / 60),
  qualityScore: Math.floor(Math.random() * 20) + 80, // TODO: Get from API quality_indicators
  status: apiLetter.status as Letter['status'],
  createdAt: new Date(apiLetter.created_at),
  updatedAt: new Date(apiLetter.updated_at),
});

// API Service Class
class PhoenixAPIService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 🔥 Génère une lettre de motivation via l'API
   */
  async generateLetter(formData: FormData): Promise<Letter> {
    const request: GenerateLetterRequest = {
      company_name: formData.companyName,
      position_title: formData.positionTitle,
      job_description: formData.jobDescription || undefined,
      experience_level: mapExperienceLevel(formData.experienceLevel),
      desired_tone: mapTone(formData.tone),
      max_words: formData.wordCount,
      use_ai: true, // Always use AI for now
    };

    const response = await this.request<GenerateLetterResponse>('/api/letters/generate?user_id=demo-user', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    // Convert API response to frontend Letter type
    const letter: Letter = {
      ...mapApiLetterToLetter(response.letter),
      settings: {
        wordCount: formData.wordCount,
        includeAchievements: formData.includeAchievements,
        includeMotivation: formData.includeMotivation,
        companyResearch: formData.companyResearch,
        customInstructions: formData.customInstructions,
      },
    };

    return letter;
  }

  /**
   * 📚 Récupère les lettres d'un utilisateur
   */
  async getUserLetters(userId: string = 'demo-user', limit: number = 20): Promise<Letter[]> {
    const response = await this.request<LetterResponse[]>(`/api/letters/user/${userId}?limit=${limit}`);
    
    return response.map(apiLetter => ({
      ...mapApiLetterToLetter(apiLetter),
      settings: {
        wordCount: apiLetter.word_count,
        includeAchievements: true,
        includeMotivation: true,
        companyResearch: false,
        customInstructions: '',
      },
    }));
  }

  /**
   * 📄 Récupère une lettre spécifique
   */
  async getLetterById(letterId: string, userId: string = 'demo-user'): Promise<Letter> {
    const response = await this.request<LetterResponse>(`/api/letters/${letterId}?user_id=${userId}`);
    
    return {
      ...mapApiLetterToLetter(response),
      settings: {
        wordCount: response.word_count,
        includeAchievements: true,
        includeMotivation: true,
        companyResearch: false,
        customInstructions: '',
      },
    };
  }

  /**
   * 📊 Récupère les statistiques utilisateur
   */
  async getUserStatistics(userId: string = 'demo-user'): Promise<UserStats> {
    const response = await this.request<UserStatisticsResponse>(`/api/user/${userId}/statistics`);
    
    return {
      totalLetters: response.total_letters,
      monthlyUsage: response.this_month,
      averageQuality: response.average_quality * 100, // Convert 0-1 to 0-100
      successRate: 85, // TODO: Calculate from API
      timeSaved: response.total_letters * 30, // 30 minutes per letter
      monthlyLimit: response.current_month_usage.is_premium ? -1 : 3,
    };
  }

  /**
   * ❤️ Health check de l'API
   */
  async healthCheck() {
    return this.request('/health');
  }

  /**
   * 🤖 Status du service IA
   */
  async getAIStatus() {
    return this.request('/api/ai/status');
  }
}

// Export singleton instance
export const apiService = new PhoenixAPIService();

// Export types
export type {
  GenerateLetterRequest,
  GenerateLetterResponse,
  LetterResponse,
  UserStatisticsResponse,
};