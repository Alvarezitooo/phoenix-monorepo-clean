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

// Types d'authentification - Plus de tokens exposés
export interface AuthResponse {
  access_token: string; // Maintenu pour compatibilité register endpoint
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

// 🔐 MIGRATION COOKIES HTTPONLY - Plus de localStorage
const AUTH_USER_KEY = 'phoenix_auth_user'; // User info seulement (non-sensible)

// Instance API avec auth
class PhoenixAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = PHOENIX_SERVICES['luna-hub'].url;
  }

  // 🔐 Plus de gestion token - Cookie HTTPOnly automatique
  private clearUserData(): void {
    localStorage.removeItem(AUTH_USER_KEY);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setStoredUser(user: User): void {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }

  // Headers basiques - Cookie HTTPOnly géré automatiquement
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  // 🔐 Authentification sécurisée avec cookies HTTPOnly
  async login(credentials: LoginRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/secure-session`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include', // Inclut cookies HTTPOnly
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    const userData: User = await response.json();
    this.setStoredUser(userData);
    return userData;
  }

  async register(userData: RegisterRequest): Promise<User> {
    // Étape 1: Register normal pour créer compte
    const registerResponse = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      throw new Error(error || 'Registration failed');
    }

    // Étape 2: Secure session pour HTTPOnly cookie
    const sessionResponse = await fetch(`${this.baseUrl}/auth/secure-session`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ email: userData.email, password: userData.password }),
    });

    if (!sessionResponse.ok) {
      throw new Error('Failed to create secure session');
    }

    const user: User = await sessionResponse.json();
    this.setStoredUser(user);
    return user;
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
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
    this.setStoredUser(user);
    return user;
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseUrl}/auth/logout-secure`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    this.clearUserData();
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  getUser(): User | null {
    return this.getStoredUser();
  }

  // Méthodes de billing avec auth HTTPOnly
  async createPaymentIntent(packageType: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/billing/create-intent`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include', // Auth cookie
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
      credentials: 'include', // Auth cookie
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
 * 🔐 Redirige vers un service Phoenix avec auth centralisée
 * Plus de token URL - cookies HTTPOnly partagés cross-domain
 */
export const redirectToService = async (service: keyof PhoenixServices) => {
  const serviceConfig = PHOENIX_SERVICES[service];
  if (serviceConfig && serviceConfig.available) {
    // Vérifier auth avant redirection
    const isAuth = await api.isAuthenticated();
    if (!isAuth && service !== 'luna-hub') {
      console.warn(`User not authenticated, cannot access ${service}`);
      return;
    }
    
    // Redirection simple - cookies HTTPOnly gérés automatiquement
    // par navigateur sur même domaine .railway.app
    window.open(serviceConfig.url, '_blank');
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