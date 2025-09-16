/**
 * 🔄 Auth Token Manager - Gestion tokens avec refresh automatique
 * Phoenix Frontend - Optimisation UX Authentication
 */

import axios from 'axios';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user_id?: string;
  email?: string;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

class AuthTokenManager {
  private static instance: AuthTokenManager;
  private tokens: TokenData | null = null;
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing = false;

  private constructor() {
    this.loadTokensFromStorage();
    this.setupAxiosInterceptors();
  }

  public static getInstance(): AuthTokenManager {
    if (!AuthTokenManager.instance) {
      AuthTokenManager.instance = new AuthTokenManager();
    }
    return AuthTokenManager.instance;
  }

  /**
   * 💾 Gestion persistence localStorage
   */
  private loadTokensFromStorage(): void {
    try {
      const stored = localStorage.getItem('phoenix_tokens');
      if (stored) {
        const tokenData = JSON.parse(stored);
        
        // Vérifier si le token n'est pas expiré (avec marge de sécurité)
        const now = Date.now();
        const expiresAt = tokenData.expires_at || 0;
        const isExpiringSoon = (expiresAt - now) < (5 * 60 * 1000); // 5 min buffer
        
        if (!isExpiringSoon) {
          this.tokens = tokenData;
          console.log('🔑 Tokens restored from localStorage');
        } else {
          console.log('⏰ Stored tokens expired, clearing...');
          this.clearTokens();
        }
      }
    } catch (error) {
      console.error('❌ Error loading tokens from storage:', error);
      this.clearTokens();
    }
  }

  private saveTokensToStorage(): void {
    try {
      if (this.tokens) {
        localStorage.setItem('phoenix_tokens', JSON.stringify(this.tokens));
        console.log('💾 Tokens saved to localStorage');
      }
    } catch (error) {
      console.error('❌ Error saving tokens to storage:', error);
    }
  }

  private clearTokens(): void {
    this.tokens = null;
    localStorage.removeItem('phoenix_tokens');
    console.log('🗑️ Tokens cleared');
  }

  /**
   * 🔧 Configuration tokens
   */
  public setTokens(tokenData: Partial<TokenData>): void {
    const expiresAt = Date.now() + (14 * 60 * 1000); // 14 minutes (1 min buffer)
    
    this.tokens = {
      access_token: tokenData.access_token!,
      refresh_token: tokenData.refresh_token!,
      expires_at: expiresAt,
      user_id: tokenData.user_id,
      email: tokenData.email,
    };
    
    this.saveTokensToStorage();
    console.log('✅ New tokens set with expiration:', new Date(expiresAt).toISOString());
  }

  public getAccessToken(): string | null {
    if (!this.tokens) return null;
    
    // Vérifier l'expiration avec marge
    const now = Date.now();
    const expiresAt = this.tokens.expires_at || 0;
    const isExpiringSoon = (expiresAt - now) < (2 * 60 * 1000); // 2 min buffer
    
    if (isExpiringSoon) {
      console.log('⏰ Access token expiring soon, needs refresh');
      return null;
    }
    
    return this.tokens.access_token;
  }

  public getRefreshToken(): string | null {
    return this.tokens?.refresh_token || null;
  }

  public hasValidTokens(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * 🔄 Logique refresh automatique
   */
  public async refreshTokens(): Promise<string> {
    // Éviter les appels concurrents
    if (this.refreshPromise) {
      console.log('🔄 Refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.error('❌ No refresh token available');
      this.clearTokens();
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    console.log('🔄 Starting token refresh...');

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const newAccessToken = await this.refreshPromise;
      console.log('✅ Token refresh successful');
      return newAccessToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.clearTokens();
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string> {
    try {
      const LUNA_HUB_URL = import.meta.env.MODE === 'development' 
        ? 'http://localhost:8003' 
        : 'https://luna-hub-production.up.railway.app';

      const response = await axios.post<RefreshResponse>(
        `${LUNA_HUB_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10s timeout
        }
      );

      const { access_token, refresh_token: new_refresh_token } = response.data;

      // Mettre à jour les tokens
      this.setTokens({
        access_token,
        refresh_token: new_refresh_token,
        user_id: this.tokens?.user_id,
        email: this.tokens?.email,
      });

      return access_token;
    } catch (error) {
      console.error('🔄 Refresh API call failed:', error);
      throw new Error('Failed to refresh tokens');
    }
  }

  /**
   * 🔧 Configuration interceptors axios
   */
  private setupAxiosInterceptors(): void {
    // Request interceptor - Ajouter token automatiquement
    axios.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Token added to request:', config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Auto-refresh sur 401
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Vérifier si c'est une erreur 401 et si on n'a pas déjà tenté le refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🔄 401 detected, attempting token refresh...');
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshTokens();
            
            // Retry la requête originale avec le nouveau token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            console.log('🔄 Retrying original request with new token');
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('🔄 Auto-refresh failed, redirecting to login');
            // Déclencher logout/redirect vers login
            this.handleAuthenticationFailure();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    console.log('🔧 Axios interceptors configured for auto-refresh');
  }

  /**
   * 🚨 Gestion échec authentification
   */
  private handleAuthenticationFailure(): void {
    this.clearTokens();
    
    // Event pour notifier les composants React
    window.dispatchEvent(new CustomEvent('auth:failed'));
    
    // Optionnel: Redirection automatique
    if (window.location.pathname !== '/') {
      console.log('🔄 Redirecting to home due to auth failure');
      window.location.href = '/';
    }
  }

  /**
   * 🚪 Logout manuel
   */
  public logout(): void {
    console.log('🚪 Manual logout triggered');
    this.clearTokens();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  /**
   * 🔍 Utilitaires debug
   */
  public getTokenInfo(): any {
    if (!this.tokens) return null;
    
    const now = Date.now();
    const expiresAt = this.tokens.expires_at || 0;
    const timeLeft = Math.max(0, expiresAt - now);
    
    return {
      hasAccessToken: !!this.tokens.access_token,
      hasRefreshToken: !!this.tokens.refresh_token,
      expiresAt: new Date(expiresAt).toISOString(),
      timeLeftMs: timeLeft,
      timeLeftMin: Math.floor(timeLeft / (60 * 1000)),
      isExpiring: timeLeft < (5 * 60 * 1000),
      userId: this.tokens.user_id,
      email: this.tokens.email,
    };
  }
}

// Export singleton instance
export const authTokenManager = AuthTokenManager.getInstance();
export default authTokenManager;