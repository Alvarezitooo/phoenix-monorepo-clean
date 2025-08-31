/**
 * 🔐 useUserProfile Hook - Phoenix CV
 * Hook pour gérer le profil utilisateur et statut Unlimited depuis Luna Hub
 */

import { useState, useEffect } from 'react';
import { lunaCVAPI, UserProfile } from '../services/lunaAPI';
import { AuthService } from '../services/authService';

interface UseUserProfileReturn {
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  isUnlimited: boolean;
  refreshProfile: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const refreshProfile = async () => {
    try {
      setIsLoadingProfile(true);
      
      // Utilise le service d'auth centralisé
      const token = AuthService.getAccessToken();
      if (!token) {
        setUserProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      const profile = await lunaCVAPI.getUserProfile(token);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Récupérer le profil au montage
  useEffect(() => {
    refreshProfile();
  }, []);

  return {
    userProfile,
    isLoadingProfile,
    isUnlimited: userProfile?.is_unlimited || false,
    refreshProfile
  };
}