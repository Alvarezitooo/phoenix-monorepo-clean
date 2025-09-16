import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { setApiAuthToken } from '../services/api';
import authTokenManager from '../services/authTokenManager';

interface LunaContextType {
  showAuthChat: boolean;
  authenticatedUser: any;
  user: any; // Alias for authenticatedUser
  lunaEnergy: number;
  isTokenValid: boolean;
  openAuthChat: () => void;
  closeAuthChat: () => void;
  setUser: (user: any) => void;
  updateEnergy: (energy: number) => void;
  logout: () => void;
  refreshTokenStatus: () => void;
  // 🌙 Luna GPS Smart Controls
  openSmartChat: (context?: any) => void;
  setCareerChoice: (choice: any) => void;
}

const LunaContext = createContext<LunaContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function LunaProvider({ children }: Props) {
  const [showAuthChat, setShowAuthChat] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const [lunaEnergy, setLunaEnergy] = useState(85);
  const [isTokenValid, setIsTokenValid] = useState(false);
  
  // 🌙 Luna GPS States
  const [smartChatContext, setSmartChatContext] = useState<any>(null);
  const [careerChoice, setCareerChoiceState] = useState<any>(null);

  const openAuthChat = () => setShowAuthChat(true);
  const closeAuthChat = () => setShowAuthChat(false);

  // 🔄 Initialisation et écoute des événements auth
  useEffect(() => {
    // Vérifier si des tokens valides existent au démarrage
    const checkTokens = () => {
      const hasValid = authTokenManager.hasValidTokens();
      setIsTokenValid(hasValid);
      
      if (hasValid) {
        // Récupérer les infos utilisateur depuis les tokens si disponibles
        const tokenInfo = authTokenManager.getTokenInfo();
        if (tokenInfo && !authenticatedUser) {
          console.log('🔄 Restoring user session from tokens');
          setAuthenticatedUser({
            id: tokenInfo.userId,
            email: tokenInfo.email,
            access_token: authTokenManager.getAccessToken()
          });
        }
      }
    };

    checkTokens();

    // Écouter les événements d'échec d'auth
    const handleAuthFailed = () => {
      console.log('🚨 Auth failed event received');
      setAuthenticatedUser(null);
      setIsTokenValid(false);
      setShowAuthChat(true);
    };

    const handleLogout = () => {
      console.log('🚪 Logout event received');
      setAuthenticatedUser(null);
      setIsTokenValid(false);
    };

    window.addEventListener('auth:failed', handleAuthFailed);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:failed', handleAuthFailed);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);
  
  const setUser = (user: any) => {
    console.log('🌙 Setting user in Luna context:', user);
    setAuthenticatedUser(user);
    
    // 🔄 Configuration auth token manager avec refresh tokens
    if (user.access_token && user.refresh_token && (user.user_id || user.id)) {
      console.log('🔑 Setting tokens in auth manager', {
        hasAccessToken: !!user.access_token,
        hasRefreshToken: !!user.refresh_token,
        userId: user.user_id || user.id,
        email: user.email
      });
      authTokenManager.setTokens({
        access_token: user.access_token,
        refresh_token: user.refresh_token,
        user_id: user.user_id || user.id,
        email: user.email
      });
      setIsTokenValid(true);
      
      // API client configuré automatiquement par les interceptors
    } else if (user.access_token) {
      // Fallback pour compatibilité avec ancien système
      console.log('🔑 Setting legacy API auth token', {
        hasAccessToken: !!user.access_token,
        missingRefreshToken: !user.refresh_token,
        missingUserId: !(user.user_id || user.id)
      });
      setApiAuthToken(user.access_token);
    } else {
      console.warn('⚠️ No valid tokens provided to setUser', {
        hasAccessToken: !!user.access_token,
        hasRefreshToken: !!user.refresh_token,
        hasUserId: !!(user.user_id || user.id)
      });
    }
    
    // Set real energy from Luna Hub profile
    if (user.profile?.luna_energy !== undefined) {
      setLunaEnergy(user.profile.luna_energy);
    }
    closeAuthChat();
  };
  
  const updateEnergy = (energy: number) => setLunaEnergy(energy);

  const logout = () => {
    console.log('🚪 Manual logout from Luna context');
    authTokenManager.logout();
    setAuthenticatedUser(null);
    setIsTokenValid(false);
  };

  const refreshTokenStatus = () => {
    const hasValid = authTokenManager.hasValidTokens();
    setIsTokenValid(hasValid);
    console.log('🔄 Token status refreshed:', hasValid);
  };

  // 🌙 Luna GPS Functions
  const openSmartChat = (context?: any) => {
    console.log('🌙 Opening Luna Smart Chat with context:', context);
    setSmartChatContext(context);
    // Trigger pour ouvrir la sidebar existante
    window.dispatchEvent(new CustomEvent('luna:openSidebar', { detail: context }));
  };

  const setCareerChoice = (choice: any) => {
    console.log('🎯 Setting career choice:', choice);
    setCareerChoiceState(choice);
  };

  return (
    <LunaContext.Provider value={{
      showAuthChat,
      authenticatedUser,
      user: authenticatedUser, // Alias for compatibility
      lunaEnergy,
      isTokenValid,
      openAuthChat,
      closeAuthChat,
      setUser,
      updateEnergy,
      logout,
      refreshTokenStatus,
      // 🌙 Luna GPS
      openSmartChat,
      setCareerChoice
    }}>
      {children}
    </LunaContext.Provider>
  );
}

export function useLuna() {
  const context = useContext(LunaContext);
  if (context === undefined) {
    throw new Error('useLuna must be used within a LunaProvider');
  }
  return context;
}