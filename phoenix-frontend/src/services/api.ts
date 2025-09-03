import axios from 'axios';

// 🚀 Multi-SPA Architecture - Dynamic URLs
const isDevelopment = import.meta.env.MODE === 'development';

// API Gateway URL (phoenix-api)
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:8000'
  : '/api'; // Proxy via Nginx in production

// Luna Hub URL (central AI + Auth)  
const LUNA_HUB_URL = isDevelopment
  ? 'http://localhost:8003'
  : '/hub'; // Proxy via Nginx in production

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

export const loginUser = async (email: string, pass: string) => {
  try {
    const response = await axios.post(`${LUNA_HUB_URL}/auth/login`, {
      email: email,
      password: pass
    });
    return response.data; // Should contain the token
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
