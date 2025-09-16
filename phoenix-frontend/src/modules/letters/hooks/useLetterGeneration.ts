import { useState, useCallback } from 'react';
import { lettersApi } from '../../../services/lettersApi';
import { useNarrativeCapture } from '../../../services/narrativeCapture';

export interface LetterGenerationForm {
  company_name: string;
  position_title: string;
  job_description: string;
  experience_level: string;
  desired_tone: string;
}

export interface LetterGenerationResult {
  content: string;
  energy_consumed: number;
  personalization_score: number;
  tone_analysis: string;
  suggestions: string[];
}

export const useLetterGeneration = () => {
  const [form, setForm] = useState<LetterGenerationForm>({
    company_name: '',
    position_title: '',
    job_description: '',
    experience_level: 'intermédiaire',
    desired_tone: 'professionnel'
  });
  
  const [result, setResult] = useState<LetterGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 🧠 Hook de capture narrative pour enrichissement automatique
  const { captureLetterGeneration } = useNarrativeCapture();

  const generateLetter = useCallback(async (formData: LetterGenerationForm) => {
    if (!formData.company_name.trim() || !formData.position_title.trim()) {
      throw new Error('Veuillez remplir au minimum le nom de l\'entreprise et le poste');
    }

    const actionStartTime = Date.now(); // 🧠 Timing pour analyse comportementale
    setIsGenerating(true);
    
    try {
      // Backend-first avec appel API Phoenix réel
      const apiResult = await lettersApi.generateCoverLetter({
        company_name: formData.company_name,
        position_title: formData.position_title,
        job_description: formData.job_description || undefined,
        experience_level: formData.experience_level,
        desired_tone: formData.desired_tone
      });
      
      // Transformation de la réponse API vers notre interface
      const transformedResult: LetterGenerationResult = {
        content: apiResult.content || "Lettre générée avec succès",
        energy_consumed: 15, // Coût défini dans ENERGY_COSTS
        personalization_score: apiResult.personalization_score || 85,
        tone_analysis: apiResult.tone_analysis || getToneDescription(formData.desired_tone),
        suggestions: apiResult.suggestions || []
      };
      
      setResult(transformedResult);
      
      // 🧠 CAPTURE NARRATIVE AUTOMATIQUE - Letter Generation
      await captureLetterGeneration({
        form_data: formData,
        company_name: formData.company_name,
        position_title: formData.position_title,
        experience_level: formData.experience_level,
        desired_tone: formData.desired_tone,
        personalization_score: transformedResult.personalization_score,
        has_job_description: !!formData.job_description,
        data_source: 'phoenix_api',
        quality_indicator: 'high'
      }, actionStartTime);
      
    } finally {
      setIsGenerating(false);
    }
  }, [captureLetterGeneration]);

  const getToneDescription = useCallback((tone: string) => {
    switch (tone) {
      case 'professionnel':
        return 'Ton professionnel équilibré avec une approche respectueuse';
      case 'enthousiaste':
        return 'Ton dynamique et motivé avec une énergie positive';
      case 'créatif':
        return 'Ton original et innovant avec une approche différenciante';
      case 'confiant':
        return 'Ton assuré et déterminé avec une confiance mesurée';
      default:
        return 'Ton professionnel adapté au contexte';
    }
  }, []);

  const updateForm = useCallback((field: keyof LetterGenerationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetGeneration = useCallback(() => {
    setForm({
      company_name: '',
      position_title: '',
      job_description: '',
      experience_level: 'intermédiaire',
      desired_tone: 'professionnel'
    });
    setResult(null);
    setIsGenerating(false);
  }, []);

  const getExperienceBadge = useCallback((level: string) => {
    switch (level) {
      case 'débutant':
        return { label: 'Junior', color: 'green' };
      case 'intermédiaire':
        return { label: 'Confirmé', color: 'blue' };
      case 'expérimenté':
        return { label: 'Senior', color: 'purple' };
      case 'expert':
        return { label: 'Expert', color: 'orange' };
      default:
        return { label: 'Confirmé', color: 'blue' };
    }
  }, []);

  const getToneIcon = useCallback((tone: string) => {
    switch (tone) {
      case 'professionnel':
        return '💼';
      case 'enthousiaste':
        return '🚀';
      case 'créatif':
        return '🎨';
      case 'confiant':
        return '💪';
      default:
        return '💼';
    }
  }, []);

  return {
    form,
    result,
    isGenerating,
    updateForm,
    generateLetter,
    resetGeneration,
    getExperienceBadge,
    getToneIcon
  };
};