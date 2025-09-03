'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAssessmentStore } from '@/lib/store';

interface UseLunaWidgetReturn {
  isOpen: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  persona: 'reconversion' | 'jeune_diplome' | 'pivot_tech' | 'ops_data' | 'reprise';
  setPersona: (persona: 'reconversion' | 'jeune_diplome' | 'pivot_tech' | 'ops_data' | 'reprise') => void;
  userId: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  requiresAuth: () => boolean;
}

export const useLunaWidget = (initialPersona: 'reconversion' | 'jeune_diplome' | 'pivot_tech' | 'ops_data' | 'reprise' = 'jeune_diplome'): UseLunaWidgetReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [persona, setPersona] = useState<'reconversion' | 'jeune_diplome' | 'pivot_tech' | 'ops_data' | 'reprise'>(initialPersona);
  
  // Récupération de l'utilisateur depuis le store
  const { user } = useAssessmentStore();

  const openWidget = useCallback(() => {
    setIsOpen(true);
    // Analytics: track widget opening
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'luna_widget_opened', {
        persona,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [persona, user?.id]);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
    // Analytics: track widget closing
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'luna_widget_closed', {
        persona,
        timestamp: new Date().toISOString()
      });
    }
  }, [persona]);

  const toggleWidget = useCallback(() => {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }, [isOpen, openWidget, closeWidget]);

  // Auto-détection persona basée sur l'URL ou le comportement
  useEffect(() => {
    const detectPersona = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      
      // Détection basée sur l'URL
      if (path.includes('reconversion') || search.includes('persona=reconversion')) {
        setPersona('reconversion');
      } else if (path.includes('pivot') || search.includes('persona=pivot_tech')) {
        setPersona('pivot_tech');
      } else if (path.includes('data') || search.includes('persona=ops_data')) {
        setPersona('ops_data');
      } else if (path.includes('reprise') || search.includes('persona=reprise')) {
        setPersona('reprise');
      }
      // Default: jeune_diplome
    };

    if (typeof window !== 'undefined') {
      detectPersona();
    }
  }, []);

  // Fermeture au clic ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeWidget();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeWidget]);

  // Fonctions d'authentification
  const requiresAuth = useCallback(() => {
    if (!user) {
      // Rediriger vers login si pas authentifié
      window.location.href = '/login';
      return true;
    }
    return false;
  }, [user]);

  return {
    isOpen,
    openWidget,
    closeWidget,
    toggleWidget,
    persona,
    setPersona,
    userId: user?.id || null,
    userEmail: user?.email || null,
    isAuthenticated: !!user,
    requiresAuth
  };
};

// Types pour les analytics (optionnel)
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}