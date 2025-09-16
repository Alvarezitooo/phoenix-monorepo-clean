import { useState, useCallback, useEffect } from 'react';
import { cvApi } from '../../../services/cvApi';
import { useNarrativeCapture } from '../../../services/narrativeCapture';

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  ats_compatible: boolean;
  sectors: string[];
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  linkedIn?: string;
  portfolio?: string;
  summary: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
  gpa?: string;
}

export interface CVBuilderForm {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  skills: string[];
  education: Education[];
  selectedTemplate: string;
}

export interface CVBuilderResult {
  cv_content: string;
  template_id: string;
  energy_consumed: number;
}

export const useCVBuilder = () => {
  const [form, setForm] = useState<CVBuilderForm>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      linkedIn: '',
      portfolio: '',
      summary: ''
    },
    experiences: [],
    skills: [],
    education: [],
    selectedTemplate: 'modern'
  });

  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [result, setResult] = useState<CVBuilderResult | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // 🧠 Hook de capture narrative pour enrichissement automatique
  const { captureCVAnalysis } = useNarrativeCapture();

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      // Backend-first avec appel API Phoenix réel
      const apiResult = await cvApi.getTemplates();
      setTemplates(apiResult.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  const buildCV = useCallback(async (formData: CVBuilderForm) => {
    if (!formData.personalInfo.firstName.trim() || !formData.personalInfo.lastName.trim()) {
      throw new Error('Veuillez renseigner au minimum votre prénom et nom');
    }

    if (formData.experiences.length === 0) {
      throw new Error('Veuillez ajouter au moins une expérience professionnelle');
    }

    setIsBuilding(true);
    
    try {
      // Backend-first avec appel API Phoenix réel
      const apiResult = await cvApi.buildCV({
        personal_info: formData.personalInfo,
        experience: formData.experiences,
        skills: formData.skills,
        education: formData.education,
        template_id: formData.selectedTemplate
      });
      
      // Transformation de la réponse API vers notre interface
      const transformedResult: CVBuilderResult = {
        cv_content: apiResult.cv_content || "CV généré avec succès",
        template_id: apiResult.template_id || formData.selectedTemplate,
        energy_consumed: 20 // Coût défini dans ENERGY_COSTS
      };
      
      setResult(transformedResult);
    } finally {
      setIsBuilding(false);
    }
  }, []);

  const updatePersonalInfo = useCallback((field: keyof PersonalInfo, value: string) => {
    setForm(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  }, []);

  const addExperience = useCallback(() => {
    const newExperience: Experience = {
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: ['']
    };
    setForm(prev => ({
      ...prev,
      experiences: [...prev.experiences, newExperience]
    }));
  }, []);

  const updateExperience = useCallback((index: number, field: keyof Experience, value: any) => {
    setForm(prev => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  }, []);

  const removeExperience = useCallback((index: number) => {
    setForm(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  }, []);

  const addEducation = useCallback(() => {
    const newEducation: Education = {
      institution: '',
      degree: '',
      field: '',
      graduationYear: '',
      gpa: ''
    };
    setForm(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  }, []);

  const updateEducation = useCallback((index: number, field: keyof Education, value: string) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  }, []);

  const removeEducation = useCallback((index: number) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  }, []);

  const updateSkills = useCallback((skills: string[]) => {
    setForm(prev => ({ ...prev, skills }));
  }, []);

  const selectTemplate = useCallback((templateId: string) => {
    setForm(prev => ({ ...prev, selectedTemplate: templateId }));
  }, []);

  const resetBuilder = useCallback(() => {
    setForm({
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        linkedIn: '',
        portfolio: '',
        summary: ''
      },
      experiences: [],
      skills: [],
      education: [],
      selectedTemplate: 'modern'
    });
    setResult(null);
  }, []);

  const getSelectedTemplate = useCallback(() => {
    return templates.find(t => t.id === form.selectedTemplate) || templates[0];
  }, [templates, form.selectedTemplate]);

  return {
    form,
    templates,
    result,
    isBuilding,
    isLoadingTemplates,
    buildCV,
    updatePersonalInfo,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    selectTemplate,
    resetBuilder,
    getSelectedTemplate
  };
};