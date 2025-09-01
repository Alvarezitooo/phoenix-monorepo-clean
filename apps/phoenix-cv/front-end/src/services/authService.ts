/**
 * 🔐 Auth Service - Phoenix CV → Luna Hub
 * Service d'authentification centralisé via Luna Hub
 */

const LUNA_HUB_URL = import.meta.env.VITE_LUNA_HUB_URL || 'https://luna-hub-backend-unified-production.up.railway.app';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  luna_energy: number;
}

interface AuthTokens {
  access_token: string;
  user_id: string;
  email: string;
}

// 🔐 AuthService migré vers cookies HTTPOnly
class AuthService {
  private static readonly USER_DATA_KEY = 'phoenix_auth_user';

  /**
   * 🔐 Vérifie auth avec validation serveur
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      await this.validateToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Récupère les données utilisateur depuis localStorage (non-sensible)
   */
  static getUserData(): { user_id: string; email: string } | null {
    const userData = localStorage.getItem(this.USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Stocke les données utilisateur (non-sensibles)
   */
  private static setUserData(userData: { user_id: string; email: string }): void {
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  /**
   * Supprime les données utilisateur
   */
  static clearUserData(): void {
    localStorage.removeItem(this.USER_DATA_KEY);
    // Nettoie aussi les anciens tokens
    // 🔐 CLEANED: localStorage.removeItem access_token;
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('authToken');
  }

  /**
   * 🔐 Login via secure session (HTTPOnly cookies)
   */
  static async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${LUNA_HUB_URL}/auth/secure-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Cookie HTTPOnly
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Authentication failed');
    }

    const userData = await response.json();
    
    // Stocke données non-sensibles
    this.setUserData({
      user_id: userData.id,
      email: userData.email,
    });

    return userData;
  }

  /**
   * Vérifie la validité avec cookies HTTPOnly
   */
  static async validateToken(): Promise<any> {
    try {
      const response = await fetch(`${LUNA_HUB_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookie HTTPOnly inclus
      });

      if (!response.ok) {
        this.clearUserData();
        throw new Error('Authentication failed');
      }

      const userData = await response.json();
      this.setUserData({
        user_id: userData.id,
        email: userData.email,
      });

      return userData;
    } catch (error) {
      console.error('Token validation error:', error);
      this.clearUserData();
      throw error;
    }
  }

  /**
   * Logout sécurisé avec serveur
   */
  static async logout(): Promise<void> {
    try {
      await fetch(`${LUNA_HUB_URL}/auth/logout-secure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearUserData();
    }
  }

  /**
   * Redirige vers Phoenix Website pour login
   */
  static redirectToLogin(): void {
    const phoenixWebsiteUrl = import.meta.env.VITE_PHOENIX_WEBSITE_URL || 'https://phoenix-website-production.up.railway.app';
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `${phoenixWebsiteUrl}/login?redirect=${currentUrl}`;
  }

  /**
   * 🔐 Plus de token URL - Cookies HTTPOnly cross-domain
   */
  static handleTokenFromURL(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Nettoie anciens params token si présents
    if (urlParams.has('token') || urlParams.has('phoenix_token')) {
      urlParams.delete('token');
      urlParams.delete('phoenix_token');
      urlParams.delete('userId');
      urlParams.delete('email');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Plus rien à faire - cookies HTTPOnly gérés automatiquement
    return true;
  }
}

export { AuthService };
export type { LoginResponse, AuthTokens };