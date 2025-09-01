/**
 * 💳 API Client Phoenix Website - Luna Hub Integration
 * Gestion billing et énergie avec types TypeScript
 */

const LUNA_HUB_URL = import.meta.env.VITE_LUNA_HUB_URL || "https://luna-hub-backend-unified-production.up.railway.app";

// Types pour les requêtes/réponses
export interface CreateIntentRequest {
  user_id: string;
  pack: "cafe_luna" | "petit_dej_luna" | "repas_luna";
  currency?: string;
}

export interface CreateIntentResponse {
  success: boolean;
  intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  pack: string;
  energy_units: number;
}

export interface ConfirmPaymentRequest {
  user_id: string;
  intent_id: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  status: string;
  energy_added: number;
  bonus_applied: boolean;
  bonus_units: number;
  new_energy_balance: number;
  event_id: string;
  transaction_id?: string;
}

export interface PurchaseHistory {
  success: boolean;
  user_id: string;
  total_purchases: number;
  total_spent_cents: number;
  total_energy_purchased: number;
  purchases: Purchase[];
}

// 🌙 Luna Chat Types
export interface LunaChatRequest {
  user_id: string;
  message: string;
  app_context?: string;
  user_name?: string;
}

export interface LunaChatResponse {
  success: boolean;
  message: string;
  context: string;
  energy_consumed: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'luna';
  message: string;
  timestamp: Date;
  energy_cost?: number;
}

export interface Purchase {
  event_id: string;
  date: string;
  pack: string;
  energy_added: number;
  amount_cents: number;
  currency: string;
  bonus_applied: boolean;
  bonus_units: number;
  transaction_id?: string;
}

export interface EnergyBalance {
  success: boolean;
  user_id: string;
  current_energy: number;
  max_energy: number;
  subscription_type: string;
}

export interface RefundRequest {
  user_id: string;
  action_event_id: string;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  status: string;
  refunded_units: number;
  new_energy_balance: number;
  refund_event_id: string;
  original_action?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  user_id: string;
  email: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserSession {
  id: string;
  device_label: string;
  ip: string;
  user_agent: string;
  created_at: string;
  last_seen: string;
  geo_location?: {
    city?: string;
    country?: string;
  };
}

// 🔐 Classe API avec cookies HTTPOnly - Plus de localStorage tokens
export class LunaAPI {
  private baseUrl: string;
  
  constructor(baseUrl: string = LUNA_HUB_URL) {
    this.baseUrl = baseUrl;
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
    };
    
    const response = await fetch(url, {
      ...options,
      credentials: useAuth ? 'include' : 'omit', // Cookie HTTPOnly inclus
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `API Error: ${response.status} ${response.statusText}`
      );
    }
    
    return response.json();
  }

  // 🔐 Plus de refresh tokens - HTTPOnly cookies gérés côté serveur

  // ====== AUTHENTICATION ENDPOINTS (HTTPOnly) ======

  async login(request: LoginRequest): Promise<any> {
    // Secure session pour HTTPOnly cookie
    return this.request('/auth/secure-session', {
      method: 'POST',
      body: JSON.stringify(request),
    }, false);
  }

  async register(request: RegisterRequest): Promise<any> {
    // Étape 1: Register normal
    await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    }, false);

    // Étape 2: Secure session pour cookie
    return this.request('/auth/secure-session', {
      method: 'POST',
      body: JSON.stringify({ email: request.email, password: request.password }),
    }, false);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async getUserSessions(): Promise<{ sessions: UserSession[] }> {
    return this.request('/auth/sessions');
  }

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    return this.request(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async logoutAllSessions(): Promise<{ message: string; sessions_revoked: number }> {
    return this.request('/auth/logout-all', {
      method: 'POST',
    });
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout-secure', {
      method: 'POST',
    });
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
  
  // ====== BILLING ENDPOINTS ======
  
  async createPaymentIntent(request: CreateIntentRequest): Promise<CreateIntentResponse> {
    return this.request<CreateIntentResponse>('/billing/create-intent', {
      method: 'POST',
      body: JSON.stringify({ currency: 'eur', ...request }),
    });
  }
  
  async confirmPayment(request: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> {
    return this.request<ConfirmPaymentResponse>('/billing/confirm-payment', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  async getPurchaseHistory(userId: string, limit: number = 50): Promise<PurchaseHistory> {
    return this.request<PurchaseHistory>(`/billing/history/${userId}?limit=${limit}`);
  }
  
  async getAvailablePacks() {
    return this.request('/billing/packs', {}, false);
  }
  
  // ====== ENERGY ENDPOINTS ======
  
  async checkEnergyBalance(userId: string): Promise<EnergyBalance> {
    return this.request<EnergyBalance>('/luna/energy/check', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }
  
  // ====== REFUND ENDPOINTS ======
  
  async requestRefund(request: RefundRequest): Promise<RefundResponse> {
    return this.request<RefundResponse>('/luna/energy/refund', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  async getRefundHistory(userId: string) {
    return this.request(`/luna/energy/refund-history/${userId}`);
  }
  
  async checkRefundEligibility(userId: string, actionEventId: string) {
    return this.request(`/luna/energy/refund-eligibility/${userId}/${actionEventId}`);
  }
  
  async getRefundPolicy() {
    return this.request('/luna/energy/refund-policy', {}, false);
  }
  
  // ====== HEALTH ENDPOINTS ======
  
  async healthCheck() {
    return this.request('/health', {}, false);
  }
  
  async billingHealthCheck() {
    return this.request('/billing/health', {}, false);
  }
  
  // ====== LUNA CHAT ENDPOINTS ======
  
  async sendLunaMessage(request: LunaChatRequest): Promise<LunaChatResponse> {
    return this.request<LunaChatResponse>('/luna/chat/send-message', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }
}

// Instance globale
export const lunaAPI = new LunaAPI();

// Convenience export for shorter imports
export const api = lunaAPI;

// Helpers pour les packs
export const PACK_INFO = {
  cafe_luna: {
    name: "☕ Café Luna",
    price: "2,99€",
    energy: 100,
    description: "Pack découverte parfait pour commencer",
    features: ["Bonus +10% premier achat", "Idéal pour tester", "Support communauté"],
    popular: true,
  },
  petit_dej_luna: {
    name: "🥐 Petit-déj Luna", 
    price: "5,99€",
    energy: 220,
    description: "L'essentiel pour une semaine productive",
    features: ["Économie 15% vs Café", "Semaine complète", "Accès prioritaire"],
    savings: "15%",
  },
  repas_luna: {
    name: "🍕 Repas Luna",
    price: "9,99€", 
    energy: 400,
    description: "Pack complet pour utilisateurs intensifs",
    features: ["Économie 33% vs Café", "Utilisateur power", "Fonctionnalités avancées"],
    popular: true,
    savings: "33%",
  },
} as const;

export type PackCode = keyof typeof PACK_INFO;

// Utilities
export function formatCurrency(cents: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long", 
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function getPackSavings(pack: PackCode): number {
  const cafePrice = 299; // Prix café en centimes
  const cafeEnergy = 100; // Énergie café
  
  const packInfo = PACK_INFO[pack];
  const packPriceCents = parseInt(packInfo.price.replace(/[€,]/g, "")) * 100;
  
  const cafeEquivalentPrice = (packInfo.energy / cafeEnergy) * cafePrice;
  const savings = ((cafeEquivalentPrice - packPriceCents) / cafeEquivalentPrice) * 100;
  
  return Math.round(savings);
}