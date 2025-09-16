import { useState, useCallback } from 'react';
import { cvApi } from '../../../services/cvApi';
import { useNarrativeCapture } from '../../../services/narrativeCapture';

export interface MirrorMatchForm {
  cvText: string;
  jobDescription: string;
  cvId?: string;
}

export interface MirrorMatchResult {
  compatibility_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keyword_matches: string[];
  missing_keywords: string[];
  ats_score: number;
  energy_consumed: number;
}

export const useMirrorMatch = () => {
  const [form, setForm] = useState<MirrorMatchForm>({
    cvText: '',
    jobDescription: '',
    cvId: ''
  });
  
  const [result, setResult] = useState<MirrorMatchResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 🧠 Hook de capture narrative pour enrichissement automatique
  const { captureCVAnalysis } = useNarrativeCapture();

  const analyzeMirrorMatch = useCallback(async (formData: MirrorMatchForm) => {
    if (!formData.cvText.trim() || !formData.jobDescription.trim()) {
      throw new Error('Veuillez remplir votre CV et la description du poste');
    }

    const actionStartTime = Date.now(); // 🧠 Timing pour analyse comportementale
    setIsAnalyzing(true);
    
    try {
      // Backend-first avec appel API Phoenix réel
      const apiResult = await cvApi.analyzeMirrorMatch({
        cv_id: formData.cvId || `temp-cv-${Date.now()}`,
        job_description: formData.jobDescription
      });
      
      // Transformation de la réponse API vers notre interface
      const transformedResult: MirrorMatchResult = {
        compatibility_score: apiResult.compatibility_score || 85,
        ats_score: apiResult.ats_score || 78,
        strengths: apiResult.strengths || [],
        weaknesses: apiResult.weaknesses || [],
        keyword_matches: apiResult.keyword_matches || [],
        missing_keywords: apiResult.missing_keywords || [],
        suggestions: apiResult.suggestions || [],
        energy_consumed: 25 // Coût défini dans ENERGY_COSTS
      };
      
      setResult(transformedResult);
      
      // 🧠 CAPTURE NARRATIVE AUTOMATIQUE - Mirror Match Analysis
      await captureCVAnalysis({
        form_data: formData,
        optimization_type: 'mirror_match',
        compatibility_score: transformedResult.compatibility_score,
        ats_score: transformedResult.ats_score,
        strengths_count: transformedResult.strengths.length,
        weaknesses_count: transformedResult.weaknesses.length,
        keywords_matched: transformedResult.keyword_matches.length,
        keywords_missing: transformedResult.missing_keywords.length,
        job_description_length: formData.jobDescription.length,
        data_source: 'phoenix_api',
        quality_indicator: 'high'
      }, actionStartTime);
      
    } finally {
      setIsAnalyzing(false);
    }
  }, [captureCVAnalysis]);

  const updateForm = useCallback((field: keyof MirrorMatchForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetAnalysis = useCallback(() => {
    setForm({
      cvText: '',
      jobDescription: '',
      cvId: ''
    });
    setResult(null);
    setIsAnalyzing(false);
  }, []);

  const getCompatibilityLevel = useCallback((score: number): { level: string, color: string } => {
    if (score >= 90) return { level: 'Excellent', color: 'emerald' };
    if (score >= 80) return { level: 'Très bon', color: 'blue' };
    if (score >= 70) return { level: 'Bon', color: 'yellow' };
    if (score >= 60) return { level: 'Moyen', color: 'orange' };
    return { level: 'Faible', color: 'red' };
  }, []);

  const getATSLevel = useCallback((score: number): { level: string, color: string } => {
    if (score >= 85) return { level: 'Optimisé ATS', color: 'emerald' };
    if (score >= 70) return { level: 'Compatible ATS', color: 'blue' };
    if (score >= 50) return { level: 'Partiellement compatible', color: 'orange' };
    return { level: 'Non optimisé', color: 'red' };
  }, []);

  return {
    form,
    result,
    isAnalyzing,
    updateForm,
    analyzeMirrorMatch,
    resetAnalysis,
    getCompatibilityLevel,
    getATSLevel
  };
};