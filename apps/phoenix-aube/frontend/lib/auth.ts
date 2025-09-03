/**
 * AuthService moderne pour Phoenix Aube
 * Pattern harmonisé avec Phoenix CV et Letters
 * HTTPOnly cookies + validation sécurisée
 */

import axios from 'axios';

const LUNA_HUB_URL = process.env.NEXT_PUBLIC_LUNA_HUB_URL || 'https://luna-hub-backend-unified-production.up.railway.app';

export interface LunaUser {
  id: string;
  email: string;
  luna_energy: number;
  narrative_started: boolean;
  subscription_type?: string;
  is_unlimited?: boolean;
  name?: string;
}

export class AuthService {
  /**
   * Vérifie si l'utilisateur est authentifié via HTTPOnly cookies
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const response = await axios.get(`${LUNA_HUB_URL}/api/auth/me`, {
        withCredentials: true,
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.debug('Auth check failed:', error);
      return false;
    }
  }

  /**
   * Récupère les informations utilisateur depuis Luna Hub
   */
  static async getCurrentUser(): Promise<LunaUser | null> {
    try {
      const response = await axios.get(`${LUNA_HUB_URL}/api/auth/me`, {
        withCredentials: true,
        timeout: 8000
      });
      
      if (response.status === 200 && response.data) {
        return {
          id: response.data.sub || response.data.id,
          email: response.data.email,
          luna_energy: response.data.luna_energy || 0,
          narrative_started: response.data.narrative_started || false,
          subscription_type: response.data.subscription_type,
          is_unlimited: response.data.is_unlimited || false,
          name: response.data.name || response.data.email?.split('@')[0]
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Déconnexion utilisateur
   */
  static async logout(): Promise<void> {
    try {
      await axios.post(`${LUNA_HUB_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Redirection vers login
      window.location.href = '/login';
    }
  }

  /**
   * Redirection vers Luna Hub pour authentification
   */
  static redirectToLogin(): void {
    const currentUrl = encodeURIComponent(window.location.origin + '/login?auth_callback=true');
    window.location.href = `${LUNA_HUB_URL}/auth/login?redirect=${currentUrl}`;
  }

  /**
   * Gestion du callback d'authentification Luna Hub
   */
  static async handleAuthCallback(): Promise<LunaUser | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthCallback = urlParams.get('auth_callback') === 'true';
    
    if (hasAuthCallback) {
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Vérifier l'authentification via cookie
      const user = await this.getCurrentUser();
      return user;
    }
    
    return null;
  }

  /**
   * Vérification énergie utilisateur
   */
  static async checkUserEnergy(actionName: string): Promise<{ canPerform: boolean; currentEnergy: number }> {
    try {
      const response = await axios.post(`${LUNA_HUB_URL}/api/luna/energy/can-perform`, {
        action_name: actionName
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Service': 'phoenix-aube'
        }
      });
      
      return {
        canPerform: response.data.can_perform || false,
        currentEnergy: response.data.current_energy || 0
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.redirectToLogin();
        throw new Error('Authentication required');
      }
      if (error.response?.status === 402) {
        // Énergie insuffisante
        return {
          canPerform: false,
          currentEnergy: 0
        };
      }
      throw error;
    }
  }

  /**
   * Consommation d'énergie pour une action
   */
  static async consumeEnergy(actionName: string, context: Record<string, any> = {}): Promise<{ success: boolean; remainingEnergy: number }> {
    try {
      const response = await axios.post(`${LUNA_HUB_URL}/api/luna/energy/consume`, {
        action_name: actionName,
        context
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Service': 'phoenix-aube',
          'X-Request-ID': crypto.randomUUID()
        }
      });
      
      return {
        success: response.data.success || false,
        remainingEnergy: response.data.remaining_energy || 0
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.redirectToLogin();
        throw new Error('Authentication required');
      }
      if (error.response?.status === 402) {
        // Redirection vers achat d'énergie
        window.open(`${LUNA_HUB_URL}/energy/buy`, '_blank');
        throw new Error('Insufficient energy');
      }
      throw error;
    }
  }
}

/**
 * Configuration axios pour HTTPOnly cookies
 */
export const createAuthenticatedClient = () => {
  const client = axios.create({
    timeout: 30000,
    withCredentials: true
  });

  // Intercepteur pour gestion d'erreurs standardisée
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expiré ou invalide
        AuthService.redirectToLogin();
      } else if (error.response?.status === 402) {
        // Énergie insuffisante
        window.open(`${LUNA_HUB_URL}/energy/buy`, '_blank');
      }
      return Promise.reject(error);
    }
  );

  return client;
};