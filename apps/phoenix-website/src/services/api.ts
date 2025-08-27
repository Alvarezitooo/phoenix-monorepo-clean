/**
 * 🚀 Phoenix Website - API Service
 * Connexion aux services Phoenix ecosystem + Authentification
 */

export interface PhoenixService {
  name: string;
  url: string;
  available: boolean;
}

export interface PhoenixServices {
  letters: PhoenixService;
  cv: PhoenixService;
  'luna-hub': PhoenixService;
}

// Types d'authentification
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  subscription_type?: string;
  subscription_status?: string;
  is_unlimited?: boolean;
  luna_energy?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

// URLs des services Phoenix (Railway)
const PHOENIX_SERVICES: PhoenixServices = {
  letters: {
    name: "Phoenix Letters",
    url: "https://phoenix-letters-production.up.railway.app",
    available: true
  },
  cv: {
    name: "Phoenix CV", 
    url: "https://phoenix-cv-production.up.railway.app",
    available: true
  },
  'luna-hub': {
    name: "Luna Hub",
    url: "https://luna-hub-backend-unified-production.up.railway.app", 
    available: true
  }
};

// Clé pour le localStorage - TODO: Migrer vers HTTPOnly cookies
const AUTH_TOKEN_KEY = 'phoenix_auth_token';
const AUTH_USER_KEY = 'phoenix_auth_user';

// Token validation et protection basique
const isTokenValid = (token: string): boolean => {
  if (!token || token.length < 20) return false;
  
  // Validation JWT basique (sans crypto complète pour perf)
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload pour vérifier expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    
    // Token expiré
    if (payload.exp && payload.exp < now) {
      console.warn('Token expired, removing from storage');
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      return false;
    }
    
    return true;
  } catch (e) {
    console.warn('Invalid token format, removing from storage');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    return false;
  }
};

// Instance API avec auth
class PhoenixAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = PHOENIX_SERVICES['luna-hub'].url;
  }

  // Gestion du token avec validation
  private getToken(): string | null {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && isTokenValid(token)) {
      return token;
    }
    return null;
  }

  private setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  private removeToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setStoredUser(user: User): void {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }

  // Headers avec authentification
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

  // Méthodes d'authentification
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    const authData: AuthResponse = await response.json();
    this.setToken(authData.access_token);
    this.setStoredUser(authData.user);
    return authData;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Registration failed');
    }

    const authData: AuthResponse = await response.json();
    this.setToken(authData.access_token);
    this.setStoredUser(authData.user);
    return authData;
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
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
    this.setStoredUser(user);
    return user;
  }

  logout(): void {
    this.removeToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    return this.getStoredUser();
  }

  // Méthodes de billing
  async createPaymentIntent(packageType: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/billing/create-intent`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ package_type: packageType }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return response.json();
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/billing/confirm-payment`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ payment_intent_id: paymentIntentId }),
    });

    if (!response.ok) {
      throw new Error('Failed to confirm payment');
    }

    return response.json();
  }
}

// Instance globale
export const api = new PhoenixAPI();

/**
 * Redirige vers un service Phoenix avec token si connecté
 */
export const redirectToService = (service: keyof PhoenixServices) => {
  const serviceConfig = PHOENIX_SERVICES[service];
  if (serviceConfig && serviceConfig.available) {
    let targetUrl = serviceConfig.url;
    
    // Transmettre le token si l'utilisateur est connecté
    if (api.isAuthenticated()) {
      const token = localStorage.getItem('phoenix_auth_token');
      if (token && service !== 'luna-hub') {
        targetUrl = `${serviceConfig.url}?phoenix_token=${encodeURIComponent(token)}`;
      }
    }
    
    // Ouvre dans un nouvel onglet pour garder Phoenix Website ouvert
    window.open(targetUrl, '_blank');
  } else {
    console.error(`Service ${service} not available`);
  }
};

/**
 * Obtient les URLs de tous les services
 */
export const getServices = (): PhoenixServices => {
  return PHOENIX_SERVICES;
};

/**
 * Vérifie si un service est disponible
 */
export const isServiceAvailable = (service: keyof PhoenixServices): boolean => {
  return PHOENIX_SERVICES[service]?.available ?? false;
};

// Export des types pour utilisation dans les composants
export type { User, AuthResponse, LoginRequest, RegisterRequest };

// L'interface User est déjà exportée plus haut dans le fichier