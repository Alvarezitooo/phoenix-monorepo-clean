/**
 * 🌙 Luna API Service - Phoenix CV Integration
 * Service de connexion entre Luna et le backend Phoenix CV
 * Basé sur l'architecture Luna Letters pour cohérence écosystème
 */

import { apiService, ChatStartRequest, ChatMessageRequest, ChatResponse } from './api';

// Configuration API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';
const LUNA_ENABLED = import.meta.env.VITE_LUNA_ENABLED !== 'false';
const LUNA_DEBUG = import.meta.env.VITE_LUNA_DEBUG === 'true';

// Types pour Luna CV (harmonisés avec Luna Letters)
interface LunaMessage {
  id: string;
  content: string;
  sender: 'user' | 'luna';
  timestamp: Date;
  type?: 'text' | 'energy-notification' | 'system';
}

interface LunaCVRequest {
  message: string;
  context?: 'dashboard' | 'mirror-match' | 'optimizer' | 'salary' | 'linkedin';
  userId?: string;
  conversationId?: string;
  cvId?: string;
}

interface LunaCVResponse {
  message: string;
  type: 'text' | 'energy-notification' | 'system';
  energyConsumed?: number;
  suggestions?: string[];
  contextualActions?: {
    label: string;
    action: string;
    energyCost?: number;
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
class LunaCVAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'LunaCVAPIError';
  }
}

// Logger pour debug
const lunaLog = (message: string, data?: any) => {
  if (LUNA_DEBUG) {
    console.log(`[Luna CV API] ${message}`, data || '');
  }
};

// 🌙 Luna CV API Service Class
class LunaCVAPIService {
  private conversationId: string | null = null;
  
  /**
   * Initialise une conversation Luna pour CV
   */
  async initializeConversation(userId: string): Promise<string> {
    try {
      const response = await apiService.startChat({
        user_id: userId,
        context_type: 'cv_analysis',
        initial_context: { app: 'phoenix-cv' }
      });

      if (response.success && response.conversation_id) {
        this.conversationId = response.conversation_id;
        lunaLog('Conversation initialized', { conversationId: this.conversationId });
        return this.conversationId;
      } else {
        throw new Error(response.error_message || 'Failed to start conversation');
      }
    } catch (error) {
      lunaLog('Error initializing conversation', error);
      // Fallback: génère un ID local
      this.conversationId = `local-${Date.now()}`;
      return this.conversationId;
    }
  }

  /**
   * Envoie un message à Luna CV et récupère la réponse
   */
  async sendMessage(request: LunaCVRequest): Promise<LunaCVResponse> {
    if (!LUNA_ENABLED) {
      return this.getMockResponse(request.message, request.context);
    }

    try {
      // S'assurer qu'on a une conversation
      if (!this.conversationId) {
        await this.initializeConversation(request.userId || 'demo-user');
      }

      const response = await apiService.sendMessage({
        conversation_id: this.conversationId!,
        message: request.message,
        message_type: 'user_query',
        context: {
          page: request.context,
          cv_id: request.cvId,
          app: 'phoenix-cv'
        }
      });

      if (response.success && response.response_message) {
        return {
          message: response.response_message,
          type: 'text',
          energyConsumed: this.calculateEnergyCost(request.context),
          suggestions: this.extractSuggestions(response.suggested_actions),
          contextualActions: this.formatContextualActions(response.suggested_actions)
        };
      } else {
        throw new Error(response.error_message || 'No response from Luna');
      }
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
      // TODO: Créer endpoint /api/luna/energy/check dans le backend CV
      // Pour l'instant, simulation avec données stockées localement
      const storedEnergy = localStorage.getItem(`luna-cv-energy-${userId}`);
      const currentEnergy = storedEnergy ? parseInt(storedEnergy) : 90;

      return {
        currentEnergy,
        maxEnergy: 100,
        canPerformAction: currentEnergy >= 10,
        energyRequired: 10,
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
      // TODO: Créer endpoint /api/luna/energy/update dans le backend CV
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

      localStorage.setItem(`luna-cv-energy-${request.userId}`, newEnergy.toString());
      
      lunaLog(`Energy ${request.action}`, { 
        userId: request.userId, 
        amount: request.amount, 
        newEnergy 
      });

      return {
        currentEnergy: newEnergy,
        maxEnergy: 100,
        canPerformAction: newEnergy >= 10,
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

  private calculateEnergyCost(context?: string): number {
    const costs = {
      'mirror-match': 25,    // Analyse Mirror Match
      'optimizer': 20,       // Optimisation CV
      'salary': 15,          // Analyse salaire
      'linkedin': 10,        // LinkedIn integration
      'dashboard': 5,        // Chat général
    };

    return costs[context as keyof typeof costs] || 8;
  }

  private getMockResponse(message: string, context?: string): LunaCVResponse {
    const responses = {
      'mirror-match': [
        "🔍 Excellent ! Pour optimiser votre Mirror Match, analysons d'abord les mots-clés de l'offre d'emploi.",
        "✨ Je vais comparer votre CV avec cette offre. Voulez-vous que je me concentre sur les compétences techniques ?",
        "🚀 Votre profil a du potentiel ! Ajustons quelques sections pour maximiser la compatibilité.",
      ],
      'optimizer': [
        "🔧 Parfait ! Pour optimiser votre CV, commençons par renforcer vos réalisations quantifiées.",
        "💡 Je vois des opportunités d'amélioration. Voulez-vous que je propose des reformulations ?",
        "⭐ Votre CV a de bonnes bases. Optimisons la structure et les mots-clés pour les ATS.",
      ],
      'salary': [
        "💰 Analysons votre potentiel salarial ! Votre profil correspond à quelle fourchette selon vous ?",
        "📊 Basé sur votre expérience, je peux estimer un salaire compétitif. Quel secteur vous intéresse ?",
        "💎 Pour une négociation réussie, préparons vos arguments de valeur ajoutée !",
      ],
      default: [
        "🌙 Je suis Luna, votre assistante IA pour Phoenix CV ! Comment puis-je optimiser votre profil ?",
        "✨ Excellente question ! Pour votre CV, je recommande de mettre en avant vos réalisations.",
        "🚀 Phoenix CV a des outils puissants ! Voulez-vous que je vous guide dans l'utilisation ?",
      ]
    };

    const contextResponses = responses[context as keyof typeof responses] || responses.default;
    const randomResponse = contextResponses[Math.floor(Math.random() * contextResponses.length)];
    
    return {
      message: randomResponse,
      type: 'text',
      energyConsumed: this.calculateEnergyCost(context),
      suggestions: this.generateSuggestions(context),
    };
  }

  private getErrorResponse(): LunaCVResponse {
    return {
      message: "🌙 Désolé, j'ai des difficultés techniques. Pouvez-vous reformuler votre question ?",
      type: 'system',
      energyConsumed: 0,
    };
  }

  private getMockEnergyResponse(): EnergyCheckResponse {
    return {
      currentEnergy: 90,
      maxEnergy: 100,
      canPerformAction: true,
      energyRequired: 10,
    };
  }

  private extractSuggestions(suggestedActions?: any[]): string[] {
    if (!suggestedActions) return [];
    
    return suggestedActions
      .map(action => action.action_label)
      .filter(Boolean)
      .slice(0, 3); // Maximum 3 suggestions
  }

  private formatContextualActions(suggestedActions?: any[]): LunaCVResponse['contextualActions'] {
    if (!suggestedActions) return [];
    
    return suggestedActions.map(action => ({
      label: action.action_label,
      action: action.action_type,
      energyCost: this.calculateEnergyCost(action.action_type)
    })).slice(0, 3);
  }

  private generateSuggestions(context?: string): string[] {
    const contextSuggestions = {
      'mirror-match': [
        "Analyser une autre offre",
        "Optimiser mon CV",
        "Voir mes compatibilités"
      ],
      'optimizer': [
        "Analyser les mots-clés ATS",
        "Reformuler mes expériences", 
        "Vérifier la structure"
      ],
      'salary': [
        "Préparer ma négociation",
        "Comparer avec le marché",
        "Analyser mes atouts"
      ],
      default: [
        "Analyser mon CV",
        "Optimiser pour un poste",
        "Voir mes statistiques"
      ]
    };

    return contextSuggestions[context as keyof typeof contextSuggestions] || contextSuggestions.default;
  }
}

// Instance unique du service
export const lunaCVAPI = new LunaCVAPIService();

// Types exportés
export type { 
  LunaCVRequest, 
  LunaCVResponse, 
  EnergyUpdateRequest, 
  EnergyCheckResponse,
  LunaMessage
};

// Utilitaires exportés
export { LunaCVAPIError };