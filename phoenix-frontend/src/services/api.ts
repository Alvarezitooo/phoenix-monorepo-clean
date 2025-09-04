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
      ...authData,
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
