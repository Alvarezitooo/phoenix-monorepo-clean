import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Letter, UserStats, FormData, CareerTransition } from '@/types';

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Letters state
  letters: Letter[];
  currentLetter: Letter | null;
  
  // UI state
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // Form state
  formData: FormData;
  
  // Generation state
  isGenerating: boolean;
  generationProgress: number;
  
  // Stats state
  userStats: UserStats | null;
  
  // 🎯 Career Transition state
  careerTransition: CareerTransition | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  addLetter: (letter: Letter) => void;
  updateLetter: (id: string, updates: Partial<Letter>) => void;
  deleteLetter: (id: string) => void;
  setCurrentLetter: (letter: Letter | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateFormData: (updates: Partial<FormData>) => void;
  resetFormData: () => void;
  setGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setUserStats: (stats: UserStats) => void;
  // 🎯 Career Transition actions
  setCareerTransition: (transition: CareerTransition | null) => void;
}

const initialFormData: FormData = {
  companyName: '',
  positionTitle: '',
  experienceLevel: 'intermediate',
  tone: 'professional',
  jobDescription: '',
  wordCount: 300,
  includeAchievements: true,
  includeMotivation: true,
  companyResearch: false,
  customInstructions: '',
  // 🎯 Career Transition fields
  previousRole: '',
  targetRole: '',
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      letters: [],
      currentLetter: null,
      sidebarCollapsed: false,
      theme: 'system',
      formData: initialFormData,
      isGenerating: false,
      generationProgress: 0,
      userStats: null,
      // 🎯 Career Transition initial state
      careerTransition: null,
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      
      addLetter: (letter) => set(state => ({ 
        letters: [letter, ...state.letters] 
      })),
      
      updateLetter: (id, updates) => set(state => ({
        letters: state.letters.map(letter => 
          letter.id === id ? { ...letter, ...updates } : letter
        ),
        currentLetter: state.currentLetter?.id === id 
          ? { ...state.currentLetter, ...updates } 
          : state.currentLetter
      })),
      
      deleteLetter: (id) => set(state => ({
        letters: state.letters.filter(letter => letter.id !== id),
        currentLetter: state.currentLetter?.id === id ? null : state.currentLetter
      })),
      
      setCurrentLetter: (letter) => set({ currentLetter: letter }),
      
      toggleSidebar: () => set(state => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setTheme: (theme) => set({ theme }),
      
      updateFormData: (updates) => set(state => ({
        formData: { ...state.formData, ...updates }
      })),
      
      resetFormData: () => set({ formData: initialFormData }),
      
      setGenerating: (generating) => set({ isGenerating: generating }),
      setGenerationProgress: (progress) => set({ generationProgress: progress }),
      setUserStats: (stats) => set({ userStats: stats }),
      
      // 🎯 Career Transition actions
      setCareerTransition: (transition) => set({ careerTransition: transition }),
    }),
    {
      name: 'phoenix-letters-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        letters: state.letters,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        formData: state.formData,
        // 🎯 Persist career transition
        careerTransition: state.careerTransition,
      }),
    }
  )
);