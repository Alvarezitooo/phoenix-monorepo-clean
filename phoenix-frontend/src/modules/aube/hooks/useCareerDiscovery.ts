import { useState, useCallback, useMemo } from 'react';
import { phoenixAubeApi, transformCareerDiscoveryRequest } from '../../../services/aubeApiPhoenix';
import { useNarrativeCapture } from '../../../services/narrativeCapture';

export interface DiscoveryForm {
  currentJob: string;
  currentSector: string;
  experience: string;
  interests: string;
}

export interface CareerSuggestion {
  title: string;
  compatibility: number;
  sector: string;
  description: string;
  skills: string[];
  salaryRange: string;
  demand: string;
  transitionTime: string;
}

export const useCareerDiscovery = () => {
  const [form, setForm] = useState<DiscoveryForm>({
    currentJob: '',
    currentSector: '',
    experience: '',
    interests: ''
  });
  
  const [results, setResults] = useState<CareerSuggestion[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 🧠 Hook de capture narrative pour enrichissement automatique
  const { captureCareerDiscovery } = useNarrativeCapture();

  // 🚀 Cache memoization pour optimiser les calculs répétés
  const suggestionCache = useMemo(() => new Map<string, CareerSuggestion[]>(), []);

  const generateCareerSuggestions = useCallback((formData: DiscoveryForm): CareerSuggestion[] => {
    // 🚀 Check cache pour éviter recalculs
    const cacheKey = JSON.stringify(formData);
    if (suggestionCache.has(cacheKey)) {
      return suggestionCache.get(cacheKey)!;
    }

    // Smart career matching based on profile
    const baseSuggestions: CareerSuggestion[] = [
      {
        title: "Product Manager",
        compatibility: 94,
        sector: "Tech/SaaS",
        description: "Gérez le cycle de vie des produits numériques",
        skills: ["Vision produit", "Gestion d'équipe", "Analyse de données", "Communication"],
        salaryRange: "55k-80k€",
        demand: "Forte",
        transitionTime: "6-12 mois"
      },
      {
        title: "UX Designer",
        compatibility: 87,
        sector: "Design/Tech",
        description: "Concevez des expériences utilisateur exceptionnelles",
        skills: ["Design thinking", "Prototypage", "Recherche utilisateur", "Wireframing"],
        salaryRange: "45k-65k€",
        demand: "Très forte",
        transitionTime: "8-15 mois"
      },
      {
        title: "Data Analyst",
        compatibility: 82,
        sector: "Tech/Finance",
        description: "Transformez les données en insights stratégiques",
        skills: ["SQL", "Python/R", "Visualisation", "Analyse statistique"],
        salaryRange: "40k-60k€",
        demand: "Très forte",
        transitionTime: "4-8 mois"
      }
    ];

    // 🚀 Intelligent adjustments based on profile
    const finalSuggestions = baseSuggestions.map(suggestion => {
      let adjustedCompatibility = suggestion.compatibility;
      
      // Experience level adjustments
      if (formData.experience.includes('5+') || formData.experience.includes('expert')) {
        if (suggestion.title === 'Product Manager') adjustedCompatibility += 5;
      }
      
      // Interest-based adjustments
      const interests = formData.interests.toLowerCase();
      if (interests.includes('design') && suggestion.title === 'UX Designer') {
        adjustedCompatibility += 8;
      }
      if (interests.includes('data') && suggestion.title === 'Data Analyst') {
        adjustedCompatibility += 10;
      }
      
      // Sector familiarity
      const currentSector = formData.currentSector.toLowerCase();
      if (currentSector.includes('tech') || currentSector.includes('digital')) {
        adjustedCompatibility += 3;
      }

      return {
        ...suggestion,
        compatibility: Math.min(adjustedCompatibility, 99)
      };
    }).sort((a, b) => b.compatibility - a.compatibility);

    suggestionCache.set(cacheKey, finalSuggestions);
    
    return finalSuggestions;
  }, [suggestionCache]);

  const analyzeCareer = useCallback(async (formData: DiscoveryForm) => {
    if (!formData.currentJob.trim() || !formData.currentSector.trim()) {
      throw new Error('Veuillez remplir au minimum le poste actuel et le secteur');
    }

    const actionStartTime = Date.now(); // 🧠 Timing pour analyse comportementale
    setIsAnalyzing(true);
    
    try {
      // 🚀 ALWAYS try Phoenix API with Gemini first, fallback if fails
      let backendResults = null;
      
      try {
        const requestData = transformCareerDiscoveryRequest({
          current_job: formData.currentJob,
          current_industry: formData.currentSector,
          experience_level: formData.experience,
          interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean),
        });

        backendResults = await phoenixAubeApi.discoverCareers(requestData);
        console.log('✅ Phoenix API with Gemini successful:', backendResults);
      } catch (apiError) {
        console.log('⚠️ Phoenix API failed, using intelligent fallback:', apiError);
        // Will use fallback below
      }
      
      // Transform Phoenix API results ou fallback vers calcul local
      if (backendResults?.compatible_careers) {
        // Phoenix API retourne du JSON structuré de Gemini
        let careersData = backendResults.compatible_careers;
        
        // Si c'est une string JSON, la parser
        if (typeof careersData === 'string') {
          try {
            careersData = JSON.parse(careersData);
          } catch (e) {
            console.warn('Failed to parse careers JSON, using fallback');
            careersData = null;
          }
        }
        
        if (careersData && Array.isArray(careersData)) {
          const transformedResults: CareerSuggestion[] = careersData.map((career: any) => ({
            title: career.title || career.name || 'Métier compatible',
            compatibility: career.compatibility_score || career.score || 85,
            sector: career.sector || career.industry || 'Technologie',
            description: career.description || career.descriptif || 'Description du métier',
            skills: career.skills || career.competences_requises || [],
            salaryRange: career.salary_range || career.salaire || '40k-60k€',
            demand: career.demand || career.demande || 'Modérée',
            transitionTime: career.transition_time || career.duree_transition || '6-12 mois'
          }));
          setResults(transformedResults);
          
          // 🧠 CAPTURE NARRATIVE AUTOMATIQUE - Résultats de qualité
          await captureCareerDiscovery({
            form_data: formData,
            results_count: transformedResults.length,
            top_compatibility: Math.max(...transformedResults.map(r => r.compatibility)),
            careers_discovered: transformedResults.map(r => r.title),
            data_source: 'phoenix_api',
            quality_indicator: 'high'
          }, actionStartTime);
          
        } else {
          // Fallback vers calcul local si format JSON non reconnu
          const suggestions = generateCareerSuggestions(formData);
          setResults(suggestions);
          
          // 🧠 CAPTURE NARRATIVE - Fallback utilisé
          await captureCareerDiscovery({
            form_data: formData,
            results_count: suggestions.length,
            top_compatibility: Math.max(...suggestions.map(r => r.compatibility)),
            careers_discovered: suggestions.map(r => r.title),
            data_source: 'local_fallback',
            quality_indicator: 'medium',
            fallback_reason: 'api_format_unrecognized'
          }, actionStartTime);
        }
      } else {
        // Fallback vers calcul local si backend non disponible
        const suggestions = generateCareerSuggestions(formData);
        setResults(suggestions);
        
        // 🧠 CAPTURE NARRATIVE - Backend indisponible
        await captureCareerDiscovery({
          form_data: formData,
          results_count: suggestions.length,
          top_compatibility: Math.max(...suggestions.map(r => r.compatibility)),
          careers_discovered: suggestions.map(r => r.title),
          data_source: 'local_fallback',
          quality_indicator: 'medium',
          fallback_reason: 'backend_unavailable'
        }, actionStartTime);
      }
    } catch (error) {
      console.error('Error with backend career discovery:', error);
      // Fallback vers calcul local
      const suggestions = generateCareerSuggestions(formData);
      setResults(suggestions);
      
      // 🧠 CAPTURE NARRATIVE - Erreur backend
      await captureCareerDiscovery({
        form_data: formData,
        results_count: suggestions.length,
        top_compatibility: Math.max(...suggestions.map(r => r.compatibility)),
        careers_discovered: suggestions.map(r => r.title),
        data_source: 'local_fallback',
        quality_indicator: 'low',
        fallback_reason: 'backend_error',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      }, actionStartTime);
    } finally {
      setIsAnalyzing(false);
    }
  }, [generateCareerSuggestions]);

  const updateForm = useCallback((field: keyof DiscoveryForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetDiscovery = useCallback(() => {
    setForm({
      currentJob: '',
      currentSector: '',
      experience: '',
      interests: ''
    });
    setResults(null);
    setIsAnalyzing(false);
  }, []);

  return {
    form,
    results,
    isAnalyzing,
    updateForm,
    analyzeCareer,
    resetDiscovery
  };
};