// API Service pour Phoenix CV
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://phoenix-cv-production.up.railway.app';

// Types pour les requêtes/réponses - Correspondant aux DTOs backend
export interface MirrorMatchRequest {
  cv_id: string;
  job_description: string;
  job_title?: string;
  company_name?: string;
  industry?: string;
  include_salary_insights?: boolean;
  include_culture_fit?: boolean;
}

export interface MirrorMatchResponse {
  success: boolean;
  analysis_id?: string;
  overall_compatibility?: number;
  match_type?: string;
  processing_time_ms: number;
  executive_summary: Record<string, any>;
  detailed_analysis?: Record<string, any>;
  error_message?: string;
}

export interface CVOptimizationRequest {
  cv_id: string;
  optimization_type?: string;
  target_job_title?: string;
  target_industry?: string;
  focus_areas?: string[];
}

export interface CVOptimizationResponse {
  success: boolean;
  optimization_id?: string;
  improvements?: Array<{
    type: string;
    priority: string;
    description: string;
    impact_score: number;
  }>;
  error_message?: string;
}

export interface ChatStartRequest {
  user_id: string;
  context_type?: string;
  initial_context?: Record<string, any>;
}

export interface ChatMessageRequest {
  conversation_id: string;
  message: string;
  message_type?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  success: boolean;
  conversation_id?: string;
  response_message?: string;
  suggested_actions?: Array<{
    action_type: string;
    action_label: string;
    action_data?: Record<string, any>;
  }>;
  conversation_context?: Record<string, any>;
  error_message?: string;
}

export interface SalaryAnalysisRequest {
  user_id: string;
  cv_id: string;
  target_role?: string;
  target_location: string;
  current_salary?: number;
}

export interface SalaryBenchmarkResponse {
  success: boolean;
  benchmark: {
    job_title: string;
    location: string;
    experience_level: string;
    salary_range: {
      min: number;
      max: number;
      median: number;
      p25: number;
      p75: number;
    };
    sample_size: number;
    confidence_score: number;
    last_updated: string;
  };
}

export interface SalaryAnalysisResponse {
  success: boolean;
  analysis_id?: string;
  salary_range?: {
    min: number;
    max: number;
    median: number;
  };
  recommended_ask?: number;
  market_position?: string;
  market_insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: number;
  }>;
  negotiation_tips: Array<{
    category: string;
    title: string;
    content: string;
    priority: string;
  }>;
  skill_premiums: Record<string, number>;
  confidence_score: number;
  analysis_date?: string;
  processing_time_ms: number;
  error_message?: string;
}

// Configuration des headers avec JWT
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Ajouter JWT token si disponible
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Gestion des erreurs
class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(response.status, errorData.message || 'API Error');
  }
  return response.json();
};

// Services API - Connectés au backend Phoenix CV
export const apiService = {
  // Mirror Match Analysis
  async mirrorMatch(data: MirrorMatchRequest): Promise<MirrorMatchResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cv/mirror-match`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // CV Optimization
  async optimizeCV(data: CVOptimizationRequest): Promise<CVOptimizationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cv/optimize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Chat avec Luna
  async startChat(data: ChatStartRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async sendMessage(data: ChatMessageRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Salary Analysis
  async analyzeSalary(data: SalaryAnalysisRequest): Promise<SalaryAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/api/salary/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Salary Benchmark
  async getSalaryBenchmark(jobTitle: string, location: string = 'france', experienceLevel: string = 'mid_level'): Promise<SalaryBenchmarkResponse> {
    const params = new URLSearchParams({
      location,
      experience_level: experienceLevel
    });
    const response = await fetch(`${API_BASE_URL}/api/salary/benchmark/${encodeURIComponent(jobTitle)}?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // LinkedIn Integration
  async linkedinAuth(data: { user_id: string; return_url?: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/linkedin/auth`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Health Check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Hook pour les requêtes avec React Query
export const useAPI = () => {
  return {
    analyzeCV: (data: CVAnalysisRequest) => apiService.analyzeCV(data),
    mirrorMatch: (cvContent: string, jobDescription: string) => 
      apiService.mirrorMatch(cvContent, jobDescription),
    sendMessage: (data: ChatRequest) => apiService.sendMessage(data),
    analyzeSalary: (data: SalaryAnalysisRequest) => apiService.analyzeSalary(data),
  };
};