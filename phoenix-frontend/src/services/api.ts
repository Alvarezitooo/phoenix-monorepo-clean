import axios from 'axios';

// 🚀 Multi-SPA Architecture - Dynamic URLs
const isDevelopment = import.meta.env.MODE === 'development';

// API Gateway URL (phoenix-api) - Railway handles dynamic ports
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:8000'
  : 'https://phoenix-api-production.up.railway.app';

// Luna Hub URL (central AI + Auth) - Railway handles dynamic ports  
const LUNA_HUB_URL = isDevelopment
  ? 'http://localhost:8003'
  : 'https://luna-hub-production.up.railway.app';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Support HTTPOnly cookies
});

// Function to set the auth token for API requests
export const setApiAuthToken = (token: string) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const checkUserStatus = async (email: string) => {
  try {
    const response = await axios.get(`${LUNA_HUB_URL}/auth/check-user/${email}`);
    return response.data;
  } catch (error) {
    console.error('Error checking user status:', error);
    // Fallback: assume new user
    return {
      user_exists: false,
      user_type: 'new',
      last_login: null,
      login_count: 0,
      needs_onboarding: true
    };
  }
};

// --- Interfaces for API communication ---

export interface ChatRequest {
  user_id: string;
  message: string;
  persona: string;
  context?: { [key: string]: any };
}

export interface ChatResponse {
  user_message: string;
  luna_response: string;
}

// --- API Client Functions ---

export const sendChatMessage = async (requestData: ChatRequest): Promise<ChatResponse> => {
  try {
    // apiClient will have the auth token set by AuthContext
    const response = await apiClient.post<ChatResponse>('/api/v1/aube/chat', requestData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'An API error occurred');
    } else {
      console.error('Generic Error:', error);
      throw new Error('An unexpected error occurred');
    }
  }
};

export const registerUser = async (name: string, email: string, password: string, objective: string) => {
  try {
    const response = await axios.post(`${LUNA_HUB_URL}/auth/register`, {
      name: name,
      email: email,
      password: password,
      objective: objective
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Registration Error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Registration failed');
    } else {
      console.error('Generic Registration Error:', error);
      throw new Error('An unexpected error occurred during registration');
    }
  }
};

export const loginUser = async (email: string, pass: string) => {
  try {
    const response = await axios.post(`${LUNA_HUB_URL}/auth/login`, {
      email: email,
      password: pass
    });
    
    // After successful login, get complete user profile
    const authData = response.data;
    const profileResponse = await axios.get(`${LUNA_HUB_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`
      }
    });
    
    return {
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      user_id: authData.user_id,
      email: authData.email,
      token_type: authData.token_type || "bearer",
      profile: profileResponse.data
    };
  } catch (error) {
     if (axios.isAxiosError(error)) {
      console.error('Login Error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Login failed');
    } else {
      console.error('Generic Login Error:', error);
      throw new Error('An unexpected error occurred during login');
    }
  }
};

// === LUNA CONVERSATION API ===

export interface LunaChatRequest {
  user_id: string;
  message: string;
  app_context?: string;
  user_name?: string;
}

export interface LunaChatResponse {
  success: boolean;
  message: string;
  context: string;
  energy_consumed: number;
  type: string;
}

export interface EnergyCheckResponse {
  success: boolean;
  user_id: string;
  current_energy: number;
  max_energy: number;
  percentage: number;
  can_perform_basic_action: boolean;
  last_recharge?: string;
  total_consumed: number;
  subscription_type?: string;
}

export const sendLunaChatMessage = async (requestData: LunaChatRequest): Promise<LunaChatResponse> => {
  try {
    // Use the new distributed Luna conversation endpoint
    const payload = {
      message: requestData.message,
      session_id: `web_session_${Date.now()}`,
      context: {
        user_name: requestData.user_name,
        app_context: requestData.app_context
      },
      current_module: requestData.app_context || 'default'
    };

    const response = await axios.post(`${LUNA_HUB_URL}/luna/conversation/send-message`, payload, {
      headers: {
        'Authorization': apiClient.defaults.headers.common['Authorization'],
        'Content-Type': 'application/json'
      }
    });
    
    // Transform the response to match expected format
    return {
      success: response.data.success,
      message: response.data.message,
      context: response.data.specialist || 'luna',
      energy_consumed: response.data.energy_consumed || 0,
      type: response.data.type || 'conversation'
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Luna Chat API Error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Erreur conversation Luna');
    } else {
      console.error('Luna Chat Error:', error);
      throw new Error('Erreur inattendue lors de la conversation avec Luna');
    }
  }
};

export const checkLunaEnergy = async (user_id: string): Promise<EnergyCheckResponse> => {
  try {
    const response = await axios.post(`${LUNA_HUB_URL}/luna/energy/check`, {
      user_id: user_id
    }, {
      headers: {
        'Authorization': apiClient.defaults.headers.common['Authorization'],
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Energy Check API Error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Erreur vérification énergie');
    } else {
      console.error('Energy Check Error:', error);
      throw new Error('Erreur inattendue lors de la vérification d\'énergie');
    }
  }
};
