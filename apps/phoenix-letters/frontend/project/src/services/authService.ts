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

class AuthService {
  private readonly LUNA_HUB_URL = import.meta.env.VITE_LUNA_HUB_URL || 'https://phoenix-backend-unified-production.up.railway.app';
  private readonly TOKEN_KEY = 'phoenix_auth_token';
  private readonly USER_KEY = 'phoenix_auth_user';

  // Token management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
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

  // Auth headers
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // Check authentication status
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Get current user from Luna Hub
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.LUNA_HUB_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
      }
      throw new Error('Failed to get user info');
    }

    const user: User = await response.json();
    this.setUser(user);
    return user;
  }

  // Initialize from URL token (from Phoenix Website)
  initializeFromToken(token?: string): void {
    // Check URL params for phoenix_token from other Phoenix apps
    const urlParams = new URLSearchParams(window.location.search);
    const phoenixToken = token || urlParams.get('phoenix_token');
    
    if (phoenixToken) {
      this.setToken(phoenixToken);
      // Clean URL
      if (urlParams.has('phoenix_token')) {
        urlParams.delete('phoenix_token');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }

  // Logout
  logout(): void {
    this.removeToken();
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