import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AubeSignals, AssessmentResults } from './api';
import { AuthService, LunaUser } from './auth';

// Utilisation de LunaUser standardisé pour cohérence
interface User extends LunaUser {
  assessmentStatus: 'not_started' | 'in_progress' | 'completed';
  lastAssessmentDate?: string;
}

interface AssessmentStore {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Auth methods with modern AuthService
  loadCurrentUser: () => Promise<void>;
  refreshUserEnergy: () => Promise<void>;
  logout: () => Promise<void>;

  // Assessment state
  currentStep: number;
  answers: Record<string, unknown>;
  isSubmitting: boolean;
  results: AssessmentResults | null;

  // Assessment actions
  setCurrentStep: (step: number) => void;
  setAnswer: (questionId: string, value: unknown) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setResults: (results: AssessmentResults | null) => void;
  resetAssessment: () => void;

  // Utility
  getSignalsFromAnswers: () => AubeSignals;
}

export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      currentStep: 0,
      answers: {},
      isSubmitting: false,
      results: null,

      // User actions
      setUser: (user) => set({ user }),

      // Modern auth methods
      loadCurrentUser: async () => {
        try {
          const lunaUser = await AuthService.getCurrentUser();
          if (lunaUser) {
            const user: User = {
              ...lunaUser,
              assessmentStatus: 'not_started', // Default, sera mis à jour selon historique
              name: lunaUser.name || lunaUser.email.split('@')[0]
            };
            set({ user });
          } else {
            set({ user: null });
          }
        } catch (error) {
          console.error('Failed to load current user:', error);
          set({ user: null });
        }
      },

      refreshUserEnergy: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const updatedUser = await AuthService.getCurrentUser();
          if (updatedUser) {
            set({
              user: {
                ...user,
                luna_energy: updatedUser.luna_energy
              }
            });
          }
        } catch (error) {
          console.error('Failed to refresh energy:', error);
        }
      },

      logout: async () => {
        await AuthService.logout();
        set({ user: null });
      },

      // Assessment actions
      setCurrentStep: (step) => set({ currentStep: step }),
      setAnswer: (questionId: string, value: unknown) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: value }
        })),
      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
      setResults: (results) => set({ results }),
      resetAssessment: () =>
        set({
          currentStep: 0,
          answers: {},
          isSubmitting: false,
          results: null
        }),

      // Transform answers to API format
      getSignalsFromAnswers: () => {
        const { answers } = get();
        
        // Conversion des réponses en format AubeSignals
        const signals: AubeSignals = {
          people_vs_data: (answers.people_data as number) || 4,
          detail_vs_vision: (answers.detail_vision as number) || 4,
          work_values: (answers.work_values as Record<string, number>) || {},
          work_environment: (answers.work_environment as string) || '',
          team_size: (answers.team_size as string) || '',
          autonomy_level: (answers.autonomy_level as number) || 4,
          leadership: (answers.leadership as number) || 4,
          creativity_importance: (answers.creativity_importance as number) || 4,
          innovation_comfort: (answers.innovation_comfort as string) || '',
          change_comfort: (answers.change_comfort as number) || 4,
          routine_variety: (answers.routine_variety as number) || 4,
          impact_scope: (answers.impact_scope as string) || '',
          meaning_importance: (answers.meaning_importance as number) || 4,
          learning_style: (answers.learning_style as string) || '',
          career_evolution: (answers.career_evolution as string) || ''
        };

        return signals;
      }
    }),
    {
      name: 'phoenix-aube-storage',
      partialize: (state) => ({
        user: state.user,
        answers: state.answers,
        currentStep: state.currentStep,
        results: state.results
      })
    }
  )
);

// Store pour l'état global de l'app
interface AppStore {
  isLunaHubConnected: boolean;
  energyLevel: number;
  setLunaHubConnected: (connected: boolean) => void;
  setEnergyLevel: (level: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isLunaHubConnected: false,
  energyLevel: 0,
  setLunaHubConnected: (connected) => set({ isLunaHubConnected: connected }),
  setEnergyLevel: (level) => set({ energyLevel: level })
}));