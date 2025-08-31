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
      
      // Vérifie d'abord les tokens dans l'URL (redirect depuis Phoenix Website)
      const tokenFromURL = AuthService.handleTokenFromURL();
      if (tokenFromURL) {
        setIsAuthenticated(true);
        setUserId(AuthService.getUserId());
        setEmail(AuthService.getUserEmail());
        setIsLoading(false);
        return true;
      }

      // Vérifie l'authentification locale
      if (!AuthService.isAuthenticated()) {
        setIsAuthenticated(false);
        setUserId(null);
        setEmail(null);
        setIsLoading(false);
        return false;
      }

      // Valide le token avec Luna Hub
      const isValid = await AuthService.validateToken();
      
      if (isValid) {
        setIsAuthenticated(true);
        setUserId(AuthService.getUserId());
        setEmail(AuthService.getUserEmail());
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setEmail(null);
      }

      setIsLoading(false);
      return isValid;
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
      const response = await AuthService.login(email, password);
      
      setIsAuthenticated(true);
      setUserId(response.user_id);
      setEmail(response.email);
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