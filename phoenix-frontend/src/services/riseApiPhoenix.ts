import axios from 'axios';

// Phoenix API URL pour les services Rise avec vraie Gemini
const PHOENIX_API_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:8000'
  : 'https://phoenix-api-production.up.railway.app';

// Client API pour Phoenix API (Rise avec Gemini)
export const phoenixRiseClient = axios.create({
  baseURL: `${PHOENIX_API_URL}/api/v1/rise`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Types pour Phoenix API Rise
export interface PhoenixInterviewSimulationRequest {
  position_title: string;
  company_name: string;
  interview_type: string;
  experience_level: string;
  preparation_areas?: string[];
}

export interface PhoenixMockInterviewRequest {
  scenario: string;
  user_response: string;
  session_id?: string;
}

export interface PhoenixStorytellingCoachRequest {
  story_type: string;
  context: string;
  target_message: string;
  audience_type: string;
}

// Services API Phoenix Rise (avec vraie Gemini)
export const phoenixRiseApi = {
  // Interview Simulation (vraie Gemini)
  startInterviewSimulation: async (data: PhoenixInterviewSimulationRequest) => {
    try {
      const response = await phoenixRiseClient.post('/interview-simulation', data);
      return response.data;
    } catch (error) {
      console.error('Phoenix Rise Interview Simulation API Error:', error);
      throw new Error('Failed to start interview simulation. Please try again.');
    }
  },

  // Mock Interview Response (vraie Gemini)
  submitMockInterviewResponse: async (data: PhoenixMockInterviewRequest) => {
    try {
      const response = await phoenixRiseClient.post('/mock-interview', data);
      return response.data;
    } catch (error) {
      console.error('Phoenix Rise Mock Interview API Error:', error);
      throw new Error('Failed to process interview response. Please try again.');
    }
  },

  // Storytelling Coach (vraie Gemini)
  getStorytellingCoaching: async (data: PhoenixStorytellingCoachRequest) => {
    try {
      const response = await phoenixRiseClient.post('/storytelling-coach', data);
      return response.data;
    } catch (error) {
      console.error('Phoenix Rise Storytelling Coach API Error:', error);
      throw new Error('Failed to get storytelling coaching. Please try again.');
    }
  }
};

// Transformation helpers pour compatibilité avec les hooks existants
export const transformInterviewSimulationRequest = (data: any): PhoenixInterviewSimulationRequest => ({
  position_title: data.position_title || data.position || 'Professional',
  company_name: data.company_name || data.company || 'Company',
  interview_type: data.interview_type || 'behavioral',
  experience_level: data.experience_level || 'intermediate',
  preparation_areas: data.preparation_areas || []
});