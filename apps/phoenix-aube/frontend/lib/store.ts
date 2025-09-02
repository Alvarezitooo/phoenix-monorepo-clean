import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AubeSignals, AssessmentResults } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  lunaHubEnergy: number;
  assessmentStatus: 'not_started' | 'in_progress' | 'completed';
  lastAssessmentDate?: string;
}

interface AssessmentStore {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

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
          people_vs_data: answers.people_data || 4,
          detail_vs_vision: answers.detail_vision || 4,
          work_values: answers.work_values || {},
          work_environment: answers.work_environment || '',
          team_size: answers.team_size || '',
          autonomy_level: answers.autonomy_level || 4,
          leadership: answers.leadership || 4,
          creativity_importance: answers.creativity_importance || 4,
          innovation_comfort: answers.innovation_comfort || '',
          change_comfort: answers.change_comfort || 4,
          routine_variety: answers.routine_variety || 4,
          impact_scope: answers.impact_scope || '',
          meaning_importance: answers.meaning_importance || 4,
          learning_style: answers.learning_style || '',
          career_evolution: answers.career_evolution || ''
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