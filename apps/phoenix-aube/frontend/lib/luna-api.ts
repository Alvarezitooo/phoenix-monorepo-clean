import { API_BASE_URL } from './api';

interface LunaMirrorRequest {
  user_response: string;
  persona?: string;
  user_id?: string | null; // ID utilisateur pour capital narratif
  context?: {
    step?: string;
    signals?: Record<string, any>;
    mood?: string;
  };
}

interface LunaAnalysisRequest {
  user_signals: Record<string, any>;
  persona?: string;
  depth?: 'ultra_light' | 'court' | 'profond';
}

interface CareerMatch {
  title: string;
  compatibility_score: number;
  luna_reasoning: string;
  future_proof_score: number;
  salary_range: string;
  transition_difficulty: 'facile' | 'modéré' | 'élevé';
}

interface LunaAnalysisResponse {
  luna_insights: string;
  career_matches: CareerMatch[];
  next_steps: string[];
  luna_encouragement: string;
}

export class LunaApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL || 'http://localhost:8000';
  }

  async getLunaMirrorResponse(request: LunaMirrorRequest): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/luna/mirror`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Luna mirror API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || "Merci 🙏 J'entends ce que tu me dis. Continue !";
    } catch (error) {
      console.error('Luna mirror API error:', error);
      // Fallback response
      return "Merci 🙏 J'entends ce que tu me dis. Continue !";
    }
  }

  async getLunaCareerAnalysis(request: LunaAnalysisRequest): Promise<LunaAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/luna/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Luna analysis API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Luna analysis API error:', error);
      // Fallback response
      return {
        luna_insights: "D'après tes réponses, tu as un profil intéressant avec des appétences variées 🌙",
        career_matches: [
          {
            title: "Product Manager",
            compatibility_score: 0.8,
            luna_reasoning: "Ton profil correspond bien à la gestion de produit",
            future_proof_score: 0.85,
            salary_range: "45k-70k €",
            transition_difficulty: "modéré"
          }
        ],
        next_steps: [
          "Explorer ces métiers plus en détail",
          "Faire un assessment complet pour affiner"
        ],
        luna_encouragement: "Tu as des pistes solides ! On peut creuser ensemble si tu veux 🚀"
      };
    }
  }
}

export const lunaApi = new LunaApiService();