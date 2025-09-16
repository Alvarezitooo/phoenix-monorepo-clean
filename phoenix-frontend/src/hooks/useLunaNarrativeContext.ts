/**
 * 🧠 Luna Narrative Context Hook - Interface Narrative Intelligence
 * 
 * Hook global qui connecte tous les composants Luna au système narratif intelligent.
 * Fournit le contexte enrichi et les insights pour personnaliser les interactions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLuna } from '../luna';

// Types pour le contexte narratif enrichi
export interface UserNarrativeProfile {
  user_id: string;
  journey_stage: string;
  engagement_level: 'high' | 'medium' | 'low';
  preferred_communication_style: string;
}

export interface NarrativeSummary {
  current_chapter: string;
  recent_achievements: string[];
  active_goals: string[];
  emotional_state: string;
}

export interface ContextualInsights {
  last_interactions: Array<{
    module: string;
    action: string;
    outcome: string;
  }>;
  module_preferences: Record<string, number>;
  success_patterns: string[];
  support_needs: string[];
}

export interface SpecialistRecommendations {
  suggested_prompts: string[];
  proactive_suggestions: string[];
  personalized_greeting: string;
  energy_optimization: {
    current_usage_pattern: string;
    suggested_actions: string[];
    estimated_session_energy: number;
  };
}

export interface NarrativePredictions {
  next_likely_actions: string[];
  optimal_interaction_timing: string;
  potential_blockers: string[];
  acceleration_opportunities: string[];
}

export interface LunaNarrativeContext {
  user_profile: UserNarrativeProfile | null;
  narrative_summary: NarrativeSummary | null;
  contextual_insights: ContextualInsights | null;
  specialist_recommendations: SpecialistRecommendations | null;
  predictions?: NarrativePredictions | null;
  
  // Métadonnées
  last_updated: string | null;
  cache_valid_until: number | null;
  is_loading: boolean;
  error: string | null;
}

export interface NarrativeContextHook extends LunaNarrativeContext {
  refreshContext: (currentModule?: string) => Promise<void>;
  isContextValid: () => boolean;
  getGreetingForModule: (module: string) => string;
  getSuggestedPrompts: (module: string) => string[];
  getProactiveSuggestions: () => string[];
  markInteractionOccurred: (module: string, action: string) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

export const useLunaNarrativeContext = (currentModule?: string): NarrativeContextHook => {
  const [contextState, setContextState] = useState<LunaNarrativeContext>({
    user_profile: null,
    narrative_summary: null,
    contextual_insights: null,
    specialist_recommendations: null,
    predictions: null,
    last_updated: null,
    cache_valid_until: null,
    is_loading: false,
    error: null
  });

  const { user } = useLuna();
  const refreshTimeoutRef = useRef<number | null>(null);
  const lastRefreshRef = useRef<number>(0);

  /**
   * 🔄 Rafraîchissement du contexte narratif depuis Luna Hub
   */
  const refreshContext = useCallback(async (moduleOverride?: string) => {
    if (!user?.id) {
      console.warn('🧠 Cannot refresh narrative context: user not authenticated');
      return;
    }

    // Éviter les appels trop fréquents
    const now = Date.now();
    if (now - lastRefreshRef.current < 5000) { // Minimum 5s entre les appels
      return;
    }

    setContextState(prev => ({ ...prev, is_loading: true, error: null }));
    lastRefreshRef.current = now;

    try {
      const targetModule = moduleOverride || currentModule || 'aube';
      
      const response = await fetch(
        `${import.meta.env.MODE === 'development' 
          ? 'http://localhost:8003' 
          : 'https://luna-hub-production.up.railway.app'}/luna/narrative/context`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            user_id: user.id,
            current_module: targetModule,
            include_predictions: true
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Narrative context fetch failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.narrative_context) {
        setContextState({
          user_profile: data.narrative_context.user_profile,
          narrative_summary: data.narrative_context.narrative_summary,
          contextual_insights: data.narrative_context.contextual_insights,
          specialist_recommendations: data.narrative_context.specialist_recommendations,
          predictions: data.narrative_context.predictions,
          last_updated: data.last_updated,
          cache_valid_until: data.cache_valid_until,
          is_loading: false,
          error: null
        });

        console.log('🧠 Narrative context refreshed successfully:', {
          module: targetModule,
          chapter: data.narrative_context.narrative_summary?.current_chapter,
          emotional_state: data.narrative_context.narrative_summary?.emotional_state,
          suggestions_count: data.narrative_context.specialist_recommendations?.suggested_prompts?.length || 0
        });
      } else {
        throw new Error('Invalid narrative context response');
      }

    } catch (error) {
      console.error('🧠 Narrative context refresh failed:', error);
      setContextState(prev => ({
        ...prev,
        is_loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [user?.id, currentModule]);

  /**
   * ✅ Vérification de la validité du cache
   */
  const isContextValid = useCallback((): boolean => {
    if (!contextState.cache_valid_until || !contextState.last_updated) {
      return false;
    }
    
    return Date.now() < contextState.cache_valid_until;
  }, [contextState.cache_valid_until, contextState.last_updated]);

  /**
   * 👋 Récupération du salut personnalisé pour un module
   */
  const getGreetingForModule = useCallback((module: string): string => {
    const recommendations = contextState.specialist_recommendations;
    
    if (recommendations?.personalized_greeting) {
      return recommendations.personalized_greeting;
    }

    // Fallbacks par module
    const defaultGreetings = {
      aube: "🌅 Salut ! Prêt(e) à explorer tes possibilités carrière ?",
      cv: "📄 Hello ! On continue à peaufiner ton profil ?",
      letters: "✉️ Coucou ! Créons une lettre qui marque les esprits !",
      rise: "🚀 Hey ! Préparons-toi à briller en entretien !"
    };

    return defaultGreetings[module as keyof typeof defaultGreetings] || 
           "🌙 Salut ! Comment puis-je t'aider aujourd'hui ?";
  }, [contextState.specialist_recommendations]);

  /**
   * 💡 Récupération des prompts suggérés pour un module
   */
  const getSuggestedPrompts = useCallback((module: string): string[] => {
    const recommendations = contextState.specialist_recommendations;
    
    if (recommendations?.suggested_prompts && recommendations.suggested_prompts.length > 0) {
      return recommendations.suggested_prompts;
    }

    // Fallbacks contextuels par module
    const modulePrompts = {
      aube: [
        "🎯 Aide-moi à découvrir de nouveaux métiers",
        "🌅 Comment identifier mes compétences transférables ?",
        "💡 Quelles sont mes options de reconversion ?"
      ],
      cv: [
        "📄 Comment optimiser mon CV ?",
        "✨ Aide-moi à mettre en valeur mes compétences",
        "🎯 Comment adapter mon CV à une offre ?"
      ],
      letters: [
        "✉️ Aide-moi pour ma lettre de motivation",
        "🎨 Comment personnaliser ma candidature ?",
        "💌 Quel ton adopter pour cette entreprise ?"
      ],
      rise: [
        "🚀 Prépare-moi pour mon entretien",
        "💬 Comment répondre aux questions difficiles ?",
        "🎭 Aide-moi à pitcher mon parcours"
      ]
    };

    return modulePrompts[module as keyof typeof modulePrompts] || modulePrompts.aube;
  }, [contextState.specialist_recommendations]);

  /**
   * 🌟 Récupération des suggestions proactives
   */
  const getProactiveSuggestions = useCallback((): string[] => {
    const recommendations = contextState.specialist_recommendations;
    
    if (recommendations?.proactive_suggestions && recommendations.proactive_suggestions.length > 0) {
      return recommendations.proactive_suggestions;
    }

    // Suggestions génériques basées sur l'état narratif
    const insights = contextState.contextual_insights;
    const summary = contextState.narrative_summary;
    
    const suggestions: string[] = [];

    if (summary?.recent_achievements && summary.recent_achievements.length > 0) {
      suggestions.push("Félicitations pour tes progrès récents ! Continue sur cette lancée 🎉");
    }

    if (insights?.success_patterns && insights.success_patterns.length > 0) {
      suggestions.push("J'ai identifié tes points forts - exploitons-les davantage ! 💪");
    }

    if (contextState.predictions?.acceleration_opportunities && 
        contextState.predictions.acceleration_opportunities.length > 0) {
      suggestions.push("Je vois des opportunités d'accélération pour toi ! 🚀");
    }

    return suggestions.length > 0 ? suggestions : [
      "Prêt(e) pour la prochaine étape de ton développement carrière ? ✨"
    ];
  }, [contextState]);

  /**
   * 📝 Marquage d'une interaction pour mise à jour du contexte
   */
  const markInteractionOccurred = useCallback((module: string, action: string) => {
    // Cette fonction peut être utilisée pour marquer des interactions
    // et déclencher des mises à jour contextuelles si nécessaire
    console.log(`🧠 Interaction marked: ${module}.${action}`);
    
    // Optionnel : déclencher une actualisation légère après interaction
    setTimeout(() => {
      if (isContextValid()) {
        refreshContext(module);
      }
    }, 2000);
  }, [isContextValid, refreshContext]);

  /**
   * 🔄 Auto-refresh intelligent basé sur l'activité
   */
  useEffect(() => {
    if (!user?.id) return;

    // Refresh initial
    if (!contextState.last_updated) {
      refreshContext();
    }

    // Auto-refresh périodique si le contexte est expiré
    const setupAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        if (!isContextValid()) {
          refreshContext();
        }
        setupAutoRefresh(); // Récursif
      }, AUTO_REFRESH_INTERVAL);
    };

    setupAutoRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [user?.id, refreshContext, isContextValid, contextState.last_updated]);

  /**
   * 🎯 Refresh automatique lors du changement de module
   */
  useEffect(() => {
    if (currentModule && user?.id && contextState.last_updated) {
      // Délai court pour permettre aux actions du module de s'enregistrer
      const timer = setTimeout(() => {
        refreshContext(currentModule);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentModule, refreshContext, user?.id, contextState.last_updated]);

  return {
    // État du contexte narratif
    ...contextState,

    // Méthodes d'interaction
    refreshContext,
    isContextValid,
    getGreetingForModule,
    getSuggestedPrompts,
    getProactiveSuggestions,
    markInteractionOccurred
  };
};

// Hook de commodité pour les spécialistes Luna
export const useLunaSpecialistContext = (moduleName: string) => {
  const narrativeContext = useLunaNarrativeContext(moduleName);

  return {
    ...narrativeContext,
    
    // Méthodes spécialisées pour les sidebars Luna
    getModuleGreeting: () => narrativeContext.getGreetingForModule(moduleName),
    getModulePrompts: () => narrativeContext.getSuggestedPrompts(moduleName),
    markModuleInteraction: (action: string) => 
      narrativeContext.markInteractionOccurred(moduleName, action),
    
    // État spécialisé
    isModuleContextReady: () => 
      !narrativeContext.is_loading && 
      narrativeContext.specialist_recommendations !== null,
    
    // Insights spécialisés
    getEmotionalState: () => 
      narrativeContext.narrative_summary?.emotional_state || 'neutral',
    getCurrentChapter: () => 
      narrativeContext.narrative_summary?.current_chapter || 'Beginning of Journey',
    getRecentAchievements: () => 
      narrativeContext.narrative_summary?.recent_achievements || []
  };
};

export default useLunaNarrativeContext;