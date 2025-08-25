/**
 * 🌙 Luna API Service - Phoenix Letters Integration
 * Service de connexion entre Luna et le backend Phoenix Letters
 */

import { Message } from '@/components/Luna/types';

// Configuration API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://phoenix-letters-production.up.railway.app';
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
   * Envoie un message à Luna avec vérification d'énergie réelle
   */
  async sendMessage(request: LunaAPIRequest): Promise<LunaAPIResponse> {
    if (!LUNA_ENABLED) {
      return this.getMockResponse(request.message);
    }

    try {
      // Vérification d'énergie avant l'action
      const energyCheck = await this.checkEnergy(request.userId || 'anonymous');
      if (!energyCheck.canPerformAction) {
        return {
          message: "🌙 Énergie insuffisante ! Rechargez votre énergie Luna pour continuer.",
          type: 'energy-notification',
          energyConsumed: 0,
          contextualActions: [{ label: "Recharger", action: "purchase-energy" }]
        };
      }

      // Génération avec vraie consommation d'énergie
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

      // Consomme l'énergie après succès
      if (request.userId) {
        await this.updateEnergy({
          userId: request.userId,
          action: 'consume',
          amount: 5,
          reason: 'conseil_rapide'
        });
      }

      return {
        message: this.extractLunaResponse(response.letter_content || 'Désolé, je ne peux pas répondre pour le moment.'),
        type: 'text',
        energyConsumed: 5,
        suggestions: this.generateSuggestions(request.context),
      };
    } catch (error) {
      lunaLog('Error in sendMessage', error);
      return this.getErrorResponse();
    }
  }

  /**
   * Vérifie le niveau d'énergie de l'utilisateur via Luna Hub
   */
  async checkEnergy(userId: string): Promise<EnergyCheckResponse> {
    if (!LUNA_ENABLED) {
      return this.getMockEnergyResponse();
    }

    try {
      const response = await apiCall('/api/luna/energy/check', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          action_name: 'conseil_rapide' // Action basique pour check
        }),
      });

      return {
        currentEnergy: response.current_energy || 85,
        maxEnergy: 100,
        canPerformAction: response.can_perform || false,
        energyRequired: response.energy_required || 5,
      };
    } catch (error) {
      lunaLog('Error in checkEnergy', error);
      return this.getMockEnergyResponse();
    }
  }

  /**
   * Consomme l'énergie via Luna Hub
   */
  async updateEnergy(request: EnergyUpdateRequest): Promise<EnergyCheckResponse> {
    if (!LUNA_ENABLED) {
      return this.getMockEnergyResponse();
    }

    try {
      if (request.action === 'consume') {
        // Utilise l'endpoint de consommation réel Luna Hub
        const response = await apiCall('/api/luna/energy/consume', {
          method: 'POST',
          body: JSON.stringify({
            user_id: request.userId,
            action_name: request.reason || 'lettre_motivation',
            context: { amount: request.amount }
          }),
        });

        return {
          currentEnergy: response.energy_remaining || 0,
          maxEnergy: 100,
          canPerformAction: response.energy_remaining >= 5,
        };
      } else {
        // Pour refund/purchase, garde la logique locale pour l'instant
        return this.getMockEnergyResponse();
      }
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