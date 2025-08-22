/**
 * 🌙 Luna API Service - Phoenix Letters Integration
 * Service de connexion entre Luna et le backend Phoenix Letters
 */

import { Message } from '@/components/Luna/types';

// Configuration API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const LUNA_ENABLED = import.meta.env.VITE_LUNA_ENABLED === 'true';
const LUNA_DEBUG = import.meta.env.VITE_LUNA_DEBUG === 'true';

// Types pour les API calls
interface LunaAPIRequest {
  message: string;
  context?: 'dashboard' | 'generate' | 'letters' | 'analytics';
  userId?: string;
  conversationId?: string;
}

interface LunaAPIResponse {
  message: string;
  type: 'text' | 'energy-notification' | 'system';
  energyConsumed?: number;
  suggestions?: string[];
  contextualActions?: {
    label: string;
    action: string;
  }[];
}

interface EnergyUpdateRequest {
  userId: string;
  action: 'consume' | 'refund' | 'purchase';
  amount: number;
  reason?: string;
}

interface EnergyCheckResponse {
  currentEnergy: number;
  maxEnergy: number;
  canPerformAction: boolean;
  energyRequired?: number;
}

// Service de gestion des erreurs
class LunaAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'LunaAPIError';
  }
}

// Logger pour debug
const lunaLog = (message: string, data?: any) => {
  if (LUNA_DEBUG) {
    console.log(`[Luna API] ${message}`, data || '');
  }
};

// Gestionnaire de requêtes HTTP
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  lunaLog(`Calling ${endpoint}`, config);

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new LunaAPIError(response.status, `API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    lunaLog(`Response from ${endpoint}`, data);
    
    return data;
  } catch (error) {
    lunaLog(`Error calling ${endpoint}`, error);
    throw error;
  }
};

// 🌙 Luna API Service Class
class LunaAPIService {
  
  /**
   * Envoie un message à Luna et récupère la réponse
   */
  async sendMessage(request: LunaAPIRequest): Promise<LunaAPIResponse> {
    if (!LUNA_ENABLED) {
      return this.getMockResponse(request.message);
    }

    try {
      // Pour l'instant, on utilise l'endpoint de génération pour simuler Luna
      // TODO: Créer un endpoint dédié /api/luna/chat dans le backend
      const response = await apiCall('/api/letters/generate', {
        method: 'POST',
        body: JSON.stringify({
          company_name: 'Luna AI Chat',
          position_title: 'AI Assistant',
          user_experience: request.message,
          tone: 'professional',
          specific_requirements: `Context: ${request.context}`,
        }),
      });

      return {
        message: this.extractLunaResponse(response.letter_content || 'Désolé, je ne peux pas répondre pour le moment.'),
        type: 'text',
        energyConsumed: 5, // Consommation basique pour un message Luna
        suggestions: this.generateSuggestions(request.context),
      };
    } catch (error) {
      lunaLog('Error in sendMessage', error);
      return this.getErrorResponse();
    }
  }

  /**
   * Vérifie le niveau d'énergie de l'utilisateur
   */
  async checkEnergy(userId: string): Promise<EnergyCheckResponse> {
    if (!LUNA_ENABLED) {
      return this.getMockEnergyResponse();
    }

    try {
      // TODO: Créer endpoint /api/luna/energy/check dans le backend
      // Pour l'instant, simulation avec données stockées localement
      const storedEnergy = localStorage.getItem(`luna-energy-${userId}`);
      const currentEnergy = storedEnergy ? parseInt(storedEnergy) : 85;

      return {
        currentEnergy,
        maxEnergy: 100,
        canPerformAction: currentEnergy >= 5,
        energyRequired: 5,
      };
    } catch (error) {
      lunaLog('Error in checkEnergy', error);
      return this.getMockEnergyResponse();
    }
  }

  /**
   * Met à jour l'énergie de l'utilisateur
   */
  async updateEnergy(request: EnergyUpdateRequest): Promise<EnergyCheckResponse> {
    if (!LUNA_ENABLED) {
      return this.getMockEnergyResponse();
    }

    try {
      // TODO: Créer endpoint /api/luna/energy/update dans le backend
      // Pour l'instant, gestion locale
      const currentEnergy = await this.checkEnergy(request.userId);
      let newEnergy = currentEnergy.currentEnergy;

      switch (request.action) {
        case 'consume':
          newEnergy = Math.max(0, newEnergy - request.amount);
          break;
        case 'refund':
          newEnergy = Math.min(100, newEnergy + request.amount);
          break;
        case 'purchase':
          newEnergy = Math.min(100, newEnergy + request.amount);
          break;
      }

      localStorage.setItem(`luna-energy-${request.userId}`, newEnergy.toString());
      
      lunaLog(`Energy ${request.action}`, { 
        userId: request.userId, 
        amount: request.amount, 
        newEnergy 
      });

      return {
        currentEnergy: newEnergy,
        maxEnergy: 100,
        canPerformAction: newEnergy >= 5,
      };
    } catch (error) {
      lunaLog('Error in updateEnergy', error);
      return this.getMockEnergyResponse();
    }
  }

  /**
   * Vérifie si une action peut être effectuée avec l'énergie disponible
   */
  async canPerformAction(userId: string, energyRequired: number): Promise<boolean> {
    const energyCheck = await this.checkEnergy(userId);
    return energyCheck.currentEnergy >= energyRequired;
  }

  // 🔧 Méthodes utilitaires privées

  private getMockResponse(message: string): LunaAPIResponse {
    const responses = [
      "🌙 Excellente question ! Pour Phoenix Letters, je recommande de personnaliser votre approche selon l'entreprise ciblée.",
      "✨ Je peux vous aider à améliorer cette lettre ! Analysons ensemble les points clés à mettre en avant.",
      "🚀 Pour une lettre percutante, concentrez-vous sur vos réalisations concrètes et mesurables.",
      "💡 Tip Luna : Adaptez le ton de votre lettre à la culture de l'entreprise que vous visez !",
      "🔥 Phoenix Letters peut vous aider à créer des lettres optimisées. Voulez-vous que je vous guide ?",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      message: randomResponse,
      type: 'text',
      energyConsumed: 5,
      suggestions: this.generateSuggestions(),
    };
  }

  private getErrorResponse(): LunaAPIResponse {
    return {
      message: "🌙 Désolé, j'ai des difficultés techniques. Pouvez-vous reformuler votre question ?",
      type: 'system',
      energyConsumed: 0,
    };
  }

  private getMockEnergyResponse(): EnergyCheckResponse {
    return {
      currentEnergy: 85,
      maxEnergy: 100,
      canPerformAction: true,
      energyRequired: 5,
    };
  }

  private extractLunaResponse(generatedContent: string): string {
    // Nettoie la réponse générée pour extraire une réponse Luna
    const lines = generatedContent.split('\n').filter(line => line.trim());
    const firstSentence = lines[0] || "Je suis là pour vous aider !";
    
    return `🌙 ${firstSentence.substring(0, 200)}...`;
  }

  private generateSuggestions(context?: string): string[] {
    const baseActions = [
      "Créer une nouvelle lettre",
      "Analyser une offre d'emploi",
      "Voir mes statistiques",
    ];

    const contextActions = {
      dashboard: ["Consulter mes lettres récentes", "Voir mes performances"],
      generate: ["Obtenir des conseils de rédaction", "Analyser le secteur"],
      letters: ["Dupliquer cette lettre", "Optimiser le contenu"],
      analytics: ["Exporter mes données", "Voir les tendances"],
    };

    return context ? [...baseActions, ...contextActions[context]] : baseActions;
  }
}

// Instance unique du service
export const lunaAPI = new LunaAPIService();

// Types exportés
export type { 
  LunaAPIRequest, 
  LunaAPIResponse, 
  EnergyUpdateRequest, 
  EnergyCheckResponse 
};

// Utilitaires exportés
export { LunaAPIError };