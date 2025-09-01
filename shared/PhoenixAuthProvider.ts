/**
 * 🔐 Phoenix Auth Provider - Centralized Authentication
 * Provider d'authentification centralisé pour l'écosystème Phoenix
 * 
 * Features:
 * - HTTPOnly cookies sécurisés
 * - Session sync cross-services
 * - Luna Energy integration
 * - Error handling robuste
 */

export interface PhoenixUser {
  id: string;
  email: string;
  name?: string;
  subscription_type?: string;
  is_unlimited?: boolean;
  luna_energy?: number;
  capital_narratif_started?: boolean;
}

export interface PhoenixAuthOptions {
  hubUrl?: string;
  enableSync?: boolean;
  enableEnergyTracking?: boolean;
}

export interface PhoenixAuthState {
  user: PhoenixUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  energy: number | null;
  isUnlimited: boolean;
}

export class PhoenixAuthProvider {
  private static instance: PhoenixAuthProvider;
  private hubUrl: string;
  private enableSync: boolean;
  private enableEnergyTracking: boolean;
  private syncChannel: BroadcastChannel | null = null;
  private state: PhoenixAuthState;
  private listeners: Set<(state: PhoenixAuthState) => void> = new Set();

  constructor(options: PhoenixAuthOptions = {}) {
    this.hubUrl = options.hubUrl || 'https://luna-hub-backend-unified-production.up.railway.app';
    this.enableSync = options.enableSync ?? true;
    this.enableEnergyTracking = options.enableEnergyTracking ?? true;
    
    this.state = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      energy: null,
      isUnlimited: false,
    };

    this.initializeSync();
  }

  // Singleton pattern
  public static getInstance(options?: PhoenixAuthOptions): PhoenixAuthProvider {
    if (!PhoenixAuthProvider.instance) {
      PhoenixAuthProvider.instance = new PhoenixAuthProvider(options);
    }
    return PhoenixAuthProvider.instance;
  }

  // Initialize cross-tab sync
  private initializeSync(): void {
    if (this.enableSync && typeof BroadcastChannel !== 'undefined') {
      this.syncChannel = new BroadcastChannel('phoenix-auth');
      this.syncChannel.onmessage = (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'AUTH_STATE_CHANGED':
            this.updateState(data);
            break;
          case 'LOGOUT_ALL':
            this.handleLogoutAll();
            break;
          case 'ENERGY_UPDATED':
            if (this.enableEnergyTracking) {
              this.updateEnergy(data.energy, data.isUnlimited);
            }
            break;
        }
      };
    }
  }

  // State management
  private updateState(newState: Partial<PhoenixAuthState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  public subscribe(listener: (state: PhoenixAuthState) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): PhoenixAuthState {
    return { ...this.state };
  }

  // Core auth methods
  public async initialize(): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      const user = await this.getCurrentUser();
      
      if (user) {
        this.updateState({
          user,
          isAuthenticated: true,
          isUnlimited: user.is_unlimited || false,
        });
        
        // Load energy if enabled
        if (this.enableEnergyTracking) {
          await this.refreshEnergy();
        }
      } else {
        this.updateState({
          user: null,
          isAuthenticated: false,
          isUnlimited: false,
          energy: null,
        });
      }
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Authentication failed',
        isAuthenticated: false,
        user: null,
      });
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  public async getCurrentUser(): Promise<PhoenixUser | null> {
    try {
      const response = await fetch(`${this.hubUrl}/auth/me`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error('Failed to get user information');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  public async login(email: string, password: string): Promise<PhoenixUser> {
    try {
      this.updateState({ isLoading: true, error: null });

      const response = await fetch(`${this.hubUrl}/auth/secure-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Authentication failed');
      }

      const user = await response.json();
      
      this.updateState({
        user,
        isAuthenticated: true,
        isUnlimited: user.is_unlimited || false,
      });

      // Notify other tabs
      this.broadcastStateChange();

      // Load energy
      if (this.enableEnergyTracking) {
        await this.refreshEnergy();
      }

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.updateState({ error: errorMessage });
      throw error;
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  public async logout(): Promise<void> {
    try {
      this.updateState({ isLoading: true });

      await fetch(`${this.hubUrl}/auth/logout-secure`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.updateState({
        user: null,
        isAuthenticated: false,
        isUnlimited: false,
        energy: null,
        isLoading: false,
        error: null,
      });

      // Notify other tabs to logout
      this.broadcastLogout();
    }
  }

  public redirectToLogin(returnUrl?: string): void {
    const websiteUrl = 'https://phoenix-website-production.up.railway.app';
    const redirect = returnUrl || window.location.href;
    window.location.href = `${websiteUrl}?login_redirect=${encodeURIComponent(redirect)}`;
  }

  // Energy management
  public async refreshEnergy(): Promise<void> {
    if (!this.enableEnergyTracking || !this.state.user) {
      return;
    }

    try {
      const response = await fetch(`${this.hubUrl}/luna/energy/check`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: this.state.user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        this.updateEnergy(data.current_energy, data.subscription_type === 'luna_unlimited');
      }
    } catch (error) {
      console.error('Failed to refresh energy:', error);
    }
  }

  private updateEnergy(energy: number, isUnlimited: boolean): void {
    this.updateState({
      energy,
      isUnlimited,
    });
  }

  public async consumeEnergy(action: string, cost: number = 1): Promise<boolean> {
    if (!this.enableEnergyTracking || !this.state.user) {
      return false;
    }

    try {
      const response = await fetch(`${this.hubUrl}/luna/energy/consume`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.state.user.id,
          action,
          cost,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.updateEnergy(data.energy_remaining, data.unlimited || false);
        
        // Broadcast energy update
        this.broadcastEnergyUpdate();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to consume energy:', error);
      return false;
    }
  }

  // Cross-tab sync methods
  private broadcastStateChange(): void {
    if (this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'AUTH_STATE_CHANGED',
        data: this.state,
      });
    }
  }

  private broadcastLogout(): void {
    if (this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'LOGOUT_ALL',
      });
    }
  }

  private broadcastEnergyUpdate(): void {
    if (this.syncChannel && this.enableEnergyTracking) {
      this.syncChannel.postMessage({
        type: 'ENERGY_UPDATED',
        data: {
          energy: this.state.energy,
          isUnlimited: this.state.isUnlimited,
        },
      });
    }
  }

  private handleLogoutAll(): void {
    this.updateState({
      user: null,
      isAuthenticated: false,
      isUnlimited: false,
      energy: null,
      error: null,
    });
    
    // Redirect to login
    this.redirectToLogin();
  }

  // Cleanup
  public destroy(): void {
    if (this.syncChannel) {
      this.syncChannel.close();
      this.syncChannel = null;
    }
    
    this.listeners.clear();
    
    if (PhoenixAuthProvider.instance === this) {
      PhoenixAuthProvider.instance = null as any;
    }
  }
}

// React Hook (si utilisé dans un contexte React)
export function usePhoenixAuth(): PhoenixAuthState & {
  login: (email: string, password: string) => Promise<PhoenixUser>;
  logout: () => Promise<void>;
  redirectToLogin: (returnUrl?: string) => void;
  refreshEnergy: () => Promise<void>;
  consumeEnergy: (action: string, cost?: number) => Promise<boolean>;
} {
  const authProvider = PhoenixAuthProvider.getInstance();
  
  // Dans un vrai hook React, utiliseriez useState/useEffect
  // Ceci est une version simplifiée
  const state = authProvider.getState();
  
  return {
    ...state,
    login: authProvider.login.bind(authProvider),
    logout: authProvider.logout.bind(authProvider),
    redirectToLogin: authProvider.redirectToLogin.bind(authProvider),
    refreshEnergy: authProvider.refreshEnergy.bind(authProvider),
    consumeEnergy: authProvider.consumeEnergy.bind(authProvider),
  };
}

// Default export
export default PhoenixAuthProvider;