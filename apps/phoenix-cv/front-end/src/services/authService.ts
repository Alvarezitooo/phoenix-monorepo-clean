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

class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly USER_ID_KEY = 'user_id';
  private static readonly USER_EMAIL_KEY = 'user_email';

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    return !!token;
  }

  /**
   * Récupère le token d'accès
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Récupère l'ID utilisateur
   */
  static getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  /**
   * Récupère l'email utilisateur
   */
  static getUserEmail(): string | null {
    return localStorage.getItem(this.USER_EMAIL_KEY);
  }

  /**
   * Stocke les tokens d'authentification
   */
  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(this.USER_ID_KEY, tokens.user_id);
    localStorage.setItem(this.USER_EMAIL_KEY, tokens.email);
  }

  /**
   * Supprime les tokens (logout)
   */
  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USER_EMAIL_KEY);
    // Nettoie aussi les anciens tokens
    localStorage.removeItem('authToken');
  }

  /**
   * Login via Luna Hub
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${LUNA_HUB_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Authentication failed');
    }

    const data = await response.json();
    
    // Stocke les tokens
    this.setTokens({
      access_token: data.access_token,
      user_id: data.user_id,
      email: data.email,
    });

    return data;
  }

  /**
   * Vérifie la validité du token via Luna Hub
   */
  static async validateToken(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${LUNA_HUB_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Logout complet
   */
  static async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();
      if (token) {
        // Optionnel : appeler endpoint logout côté serveur
        await fetch(`${LUNA_HUB_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
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
   * Handle token from URL (redirect depuis Phoenix Website)
   */
  static handleTokenFromURL(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');
    const email = urlParams.get('email');

    if (token && userId && email) {
      this.setTokens({
        access_token: token,
        user_id: userId,
        email: email,
      });
      
      // Nettoie l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }

    return false;
  }
}

export { AuthService };
export type { LoginResponse, AuthTokens };