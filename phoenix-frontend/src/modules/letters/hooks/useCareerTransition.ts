import { useState, useCallback } from 'react';
import { lettersApi } from '../../../services/lettersApi';

export interface CareerTransitionForm {
  previous_role: string;
  target_role: string;
  previous_industry: string;
  target_industry: string;
}

export interface CareerTransitionResult {
  analysis: string;
  transferable_skills: string[];
  skill_gaps: string[];
  transition_roadmap: {
    phase: string;
    duration: string;
    actions: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
  difficulty_level: number; // 1-10
  success_probability: number; // percentage
  energy_consumed: number;
}

export const useCareerTransition = () => {
  const [form, setForm] = useState<CareerTransitionForm>({
    previous_role: '',
    target_role: '',
    previous_industry: '',
    target_industry: ''
  });
  
  const [result, setResult] = useState<CareerTransitionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeTransition = useCallback(async (formData: CareerTransitionForm) => {
    if (!formData.previous_role.trim() || !formData.target_role.trim()) {
      throw new Error('Veuillez remplir au minimum le poste actuel et le poste cible');
    }

    setIsAnalyzing(true);
    
    try {
      // Backend-first avec appel API Phoenix réel
      const apiResult = await lettersApi.analyzeCareerTransition({
        previous_role: formData.previous_role,
        target_role: formData.target_role,
        previous_industry: formData.previous_industry || undefined,
        target_industry: formData.target_industry || undefined
      });
      
      // Transformation de la réponse API vers notre interface
      const transformedResult: CareerTransitionResult = {
        analysis: apiResult.analysis || "Analyse de transition effectuée avec succès",
        transferable_skills: apiResult.transferable_skills || [],
        skill_gaps: apiResult.skill_gaps || [],
        transition_roadmap: apiResult.transition_roadmap || [],
        difficulty_level: apiResult.difficulty_level || 5,
        success_probability: apiResult.success_probability || 75,
        energy_consumed: 25 // Coût défini dans ENERGY_COSTS
      };
      
      setResult(transformedResult);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const updateForm = useCallback((field: keyof CareerTransitionForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetAnalysis = useCallback(() => {
    setForm({
      previous_role: '',
      target_role: '',
      previous_industry: '',
      target_industry: ''
    });
    setResult(null);
    setIsAnalyzing(false);
  }, []);

  const getDifficultyLevel = useCallback((level: number): { label: string, color: string } => {
    if (level <= 3) return { label: 'Facile', color: 'green' };
    if (level <= 5) return { label: 'Modérée', color: 'blue' };
    if (level <= 7) return { label: 'Challenging', color: 'orange' };
    return { label: 'Difficile', color: 'red' };
  }, []);

  const getSuccessProbability = useCallback((probability: number): { label: string, color: string } => {
    if (probability >= 85) return { label: 'Très élevée', color: 'green' };
    if (probability >= 70) return { label: 'Élevée', color: 'blue' };
    if (probability >= 50) return { label: 'Moyenne', color: 'orange' };
    return { label: 'Faible', color: 'red' };
  }, []);

  const getPriorityIcon = useCallback((priority: string) => {
    switch (priority) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⚡';
      case 'low':
        return '💡';
      default:
        return '⚡';
    }
  }, []);

  return {
    form,
    result,
    isAnalyzing,
    updateForm,
    analyzeTransition,
    resetAnalysis,
    getDifficultyLevel,
    getSuccessProbability,
    getPriorityIcon
  };
};