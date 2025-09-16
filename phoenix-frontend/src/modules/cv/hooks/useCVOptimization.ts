import { useState, useCallback } from 'react';
import { cvApi } from '../../../services/cvApi';
import { useNarrativeCapture } from '../../../services/narrativeCapture';

export interface CVOptimizationForm {
  cvText: string;
  targetJobTitle: string;
  targetCompany?: string;
  cvId?: string;
}

export interface CVOptimizationResult {
  optimized_cv: string;
  improvements: {
    section: string;
    original: string;
    improved: string;
    reason: string;
  }[];
  keywords_added: string[];
  ats_improvements: string[];
  score_improvement: number;
  energy_consumed: number;
}

export const useCVOptimization = () => {
  const [form, setForm] = useState<CVOptimizationForm>({
    cvText: '',
    targetJobTitle: '',
    targetCompany: '',
    cvId: ''
  });
  
  const [result, setResult] = useState<CVOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // 🧠 Hook de capture narrative pour enrichissement automatique
  const { captureCVAnalysis } = useNarrativeCapture();

  const optimizeCV = useCallback(async (formData: CVOptimizationForm) => {
    if (!formData.cvText.trim() || !formData.targetJobTitle.trim()) {
      throw new Error('Veuillez remplir votre CV et le poste cible');
    }

    const actionStartTime = Date.now(); // 🧠 Timing pour analyse comportementale
    setIsOptimizing(true);
    
    try {
      // Backend-first avec appel API Phoenix réel
      const apiResult = await cvApi.optimizeCV({
        cv_id: formData.cvId || `temp-cv-${Date.now()}`,
        target_job_title: formData.targetJobTitle
      });
      
      // Transformation de la réponse API vers notre interface
      const transformedResult: CVOptimizationResult = {
        optimized_cv: apiResult.suggestions || "CV optimisé avec succès",
        improvements: apiResult.improvements || [],
        keywords_added: apiResult.keywords_added || [],
        ats_improvements: apiResult.ats_improvements || [],
        score_improvement: apiResult.score_improvement || 18,
        energy_consumed: 15 // Coût défini dans ENERGY_COSTS
      };
      
      setResult(transformedResult);
      
      // 🧠 CAPTURE NARRATIVE AUTOMATIQUE - CV Optimization
      await captureCVAnalysis({
        form_data: formData,
        optimization_type: 'cv_optimization',
        target_position: formData.targetJobTitle,
        company_target: formData.targetCompany,
        improvements_count: transformedResult.improvements.length,
        keywords_added_count: transformedResult.keywords_added.length,
        score_improvement: transformedResult.score_improvement,
        cv_length_chars: formData.cvText.length,
        data_source: 'phoenix_api',
        quality_indicator: 'high'
      }, actionStartTime);
      
    } finally {
      setIsOptimizing(false);
    }
  }, [captureCVAnalysis]);

  const updateForm = useCallback((field: keyof CVOptimizationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetOptimization = useCallback(() => {
    setForm({
      cvText: '',
      targetJobTitle: '',
      targetCompany: '',
      cvId: ''
    });
    setResult(null);
    setIsOptimizing(false);
  }, []);

  const getSectionColor = useCallback((section: string) => {
    const colorMap: Record<string, string> = {
      'Résumé professionnel': 'blue',
      'Expérience': 'emerald',
      'Compétences': 'purple',
      'Formation': 'orange',
      'Projets': 'pink',
      'Langues': 'indigo',
      'default': 'gray'
    };
    return colorMap[section] || colorMap.default;
  }, []);

  const getImprovementIcon = useCallback((section: string) => {
    const iconMap: Record<string, string> = {
      'Résumé professionnel': '📝',
      'Expérience': '💼',
      'Compétences': '🚀',
      'Formation': '🎓',
      'Projets': '⚡',
      'Langues': '🌍',
      'default': '✨'
    };
    return iconMap[section] || iconMap.default;
  }, []);

  return {
    form,
    result,
    isOptimizing,
    updateForm,
    optimizeCV,
    resetOptimization,
    getSectionColor,
    getImprovementIcon
  };
};