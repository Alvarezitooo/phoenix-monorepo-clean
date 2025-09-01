/**
 * 🔐 Phoenix Letters - Service d'Authentification
 * Connexion avec Luna Hub pour auth centralisée
 */

interface User {
  id: string;
  email: string;
  name?: string;
  subscription_type?: string;
  subscription_status?: string;
  is_unlimited?: boolean;
  luna_energy?: number;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// 🔐 AuthService migré vers cookies HTTPOnly
class AuthService {
  private readonly LUNA_HUB_URL = import.meta.env.VITE_LUNA_HUB_URL || 'https://luna-hub-backend-unified-production.up.railway.app';
  private readonly USER_KEY = 'phoenix_auth_user'; // Info user seulement

  // 🔐 Plus de gestion token localStorage - Cookie HTTPOnly automatique
  private clearUserData(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // User management
  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Headers basiques - Cookie HTTPOnly géré automatiquement
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  // Check authentication status avec validation serveur
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  // Get current user from Luna Hub avec cookies HTTPOnly
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.LUNA_HUB_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include', // Cookie HTTPOnly inclus
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearUserData();
      }
      throw new Error('Failed to get user info');
    }

    const user: User = await response.json();
    this.setUser(user);
    return user;
  }

  // 🔐 Plus de token URL - Cookies HTTPOnly cross-domain .railway.app
  initializeFromToken(token?: string): void {
    // Clean URL si ancien token présent
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('phoenix_token')) {
      urlParams.delete('phoenix_token');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
    // Plus rien à faire - cookies HTTPOnly gérés automatiquement
  }

  // Logout sécurisé avec serveur
  async logout(): Promise<void> {
    await fetch(`${this.LUNA_HUB_URL}/auth/logout-secure`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    this.clearUserData();
  }

  // Check if user has unlimited subscription
  hasUnlimitedAccess(): boolean {
    const user = this.getUser();
    return user?.is_unlimited === true;
  }

  // Get user subscription tier for display
  getSubscriptionTier(): string {
    const user = this.getUser();
    if (user?.is_unlimited) {
      return 'Luna Unlimited';
    }
    return user?.subscription_type || 'free';
  }

  // Redirect to login if not authenticated
  redirectToLogin(): void {
    const phoenixWebsiteUrl = 'https://phoenix-website-production.up.railway.app';
    window.location.href = `${phoenixWebsiteUrl}?login_redirect=${encodeURIComponent(window.location.href)}`;
  }
}

export const authService = new AuthService();
export type { User, AuthResponse };