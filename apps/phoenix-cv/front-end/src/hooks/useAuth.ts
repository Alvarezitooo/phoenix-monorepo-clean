/**
 * 🔐 useAuth Hook - Phoenix CV
 * Hook d'authentification centralisé avec Luna Hub
 */

import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/authService';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  redirectToLogin: () => void;
  checkAuth: () => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 🔐 Clean URL de anciens tokens
      AuthService.handleTokenFromURL();

      // Vérifie auth avec cookies HTTPOnly
      const isAuth = await AuthService.isAuthenticated();
      
      if (isAuth) {
        const userData = AuthService.getUserData();
        setIsAuthenticated(true);
        setUserId(userData?.user_id || null);
        setEmail(userData?.email || null);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setEmail(null);
      }

      setIsLoading(false);
      return isAuth;
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUserId(null);
      setEmail(null);
      setIsLoading(false);
      return false;
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const userData = await AuthService.login(email, password);
      
      setIsAuthenticated(true);
      setUserId(userData.id);
      setEmail(userData.email);
    } catch (error) {
      setIsAuthenticated(false);
      setUserId(null);
      setEmail(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await AuthService.logout();
    } finally {
      setIsAuthenticated(false);
      setUserId(null);
      setEmail(null);
      setIsLoading(false);
    }
  };

  const redirectToLogin = (): void => {
    AuthService.redirectToLogin();
  };

  // Vérifie l'authentification au montage
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    isLoading,
    userId,
    email,
    login,
    logout,
    redirectToLogin,
    checkAuth,
  };
}