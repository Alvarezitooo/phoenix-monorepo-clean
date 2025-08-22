import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Letter, GenerationProgress } from '@/types';
import { apiService } from '@/services/api';
import { useLuna } from '@/components/Luna';

/**
 * 🔥 Hook de génération connecté à l'API FastAPI
 * Remplace la simulation par des vraies requêtes API
 */
export function useGeneration() {
  const [progress, setProgress] = useState<GenerationProgress>({
    step: 0,
    totalSteps: 4,
    message: '',
    estimatedTime: 0,
  });

  const { formData, addLetter, setGenerating, setCurrentLetter } = useStore();
  const { updateEnergy, currentEnergy } = useLuna();

  const generateLetter = async (): Promise<Letter> => {
    // Check energy before generation (15% for letter generation)
    const requiredEnergy = 15;
    if (currentEnergy < requiredEnergy) {
      throw new Error(`Énergie insuffisante ! Vous avez besoin de ${requiredEnergy}% d'énergie Luna pour générer une lettre.`);
    }

    setGenerating(true);
    
    try {
      // Steps avec durées réalistes pour l'API
      const steps = [
        { message: "Connecting to Phoenix API...", duration: 500 },
        { message: "Analyzing job requirements with AI...", duration: 1000 },
        { message: "Crafting personalized content...", duration: 2000 },
        { message: "Applying quality checks...", duration: 500 },
      ];

      let currentStep = 0;
      
      // Animation du progress pendant l'appel API
      const progressInterval = setInterval(() => {
        if (currentStep < steps.length) {
          setProgress({
            step: currentStep + 1,
            totalSteps: steps.length,
            message: steps[currentStep].message,
            estimatedTime: steps[currentStep].duration / 1000,
          });
          currentStep++;
        }
      }, 800);

      // 🚀 APPEL API RÉEL
      const generatedLetter = await apiService.generateLetter(formData);

      // Clear progress animation
      clearInterval(progressInterval);

      // Final step
      setProgress({
        step: steps.length,
        totalSteps: steps.length,
        message: "Letter generated successfully! 🎉",
        estimatedTime: 0,
      });

      // Consume energy for successful generation
      await updateEnergy(requiredEnergy, 'consume');

      // Add to store
      addLetter(generatedLetter);
      setCurrentLetter(generatedLetter);
      
      return generatedLetter;

    } catch (error) {
      console.error('❌ Erreur génération API:', error);
      
      // Fallback en cas d'erreur API
      setProgress({
        step: 0,
        totalSteps: 4,
        message: "API unavailable, using fallback mode...",
        estimatedTime: 2,
      });

      // Génération de secours (comme l'ancien code)
      const fallbackLetter = await generateFallbackLetter();
      addLetter(fallbackLetter);
      setCurrentLetter(fallbackLetter);
      
      return fallbackLetter;

    } finally {
      setGenerating(false);
    }
  };

  /**
   * 🛡️ Génération de secours si l'API est indisponible
   */
  const generateFallbackLetter = async (): Promise<Letter> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

    const fallbackContent = `Objet : Candidature pour le poste de ${formData.positionTitle}

Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de ${formData.positionTitle} au sein de ${formData.companyName}.

Fort(e) d'une expérience ${formData.experienceLevel === 'junior' ? 'junior mais motivée' : formData.experienceLevel === 'intermediate' ? 'intermédiaire solide' : 'senior confirmée'}, je suis convaincu(e) que mes compétences et ma motivation s'alignent parfaitement avec les exigences de ce poste.

${formData.includeAchievements ? 'Mes réalisations professionnelles témoignent de ma capacité à apporter une valeur ajoutée significative à votre organisation. ' : ''}Mon approche ${formData.tone === 'professional' ? 'professionnelle' : formData.tone === 'enthusiastic' ? 'enthousiaste' : formData.tone === 'creative' ? 'créative' : 'authentique'} du travail correspond parfaitement à la culture de ${formData.companyName}.

${formData.includeMotivation ? `Ce qui m'attire particulièrement chez ${formData.companyName}, c'est l'opportunité de contribuer à votre mission et d'apporter mon expertise au service de vos objectifs ambitieux. ` : ''}Je suis impatient(e) de pouvoir échanger avec vous sur la façon dont je peux contribuer au succès de votre équipe.

Je vous remercie pour l'attention que vous porterez à ma candidature et reste à votre disposition pour tout complément d'information.

Cordialement,
[Votre nom]

---
Générée en mode autonome par Phoenix Letters`;

    const fallbackLetter: Letter = {
      id: `fallback_${Date.now()}`,
      userId: 'demo-user',
      companyName: formData.companyName,
      positionTitle: formData.positionTitle,
      experienceLevel: formData.experienceLevel,
      tone: formData.tone,
      jobDescription: formData.jobDescription,
      content: fallbackContent,
      wordCount: fallbackContent.split(' ').length,
      readingTime: Math.ceil(fallbackContent.split(' ').length / 250),
      qualityScore: 75, // Score de base pour fallback
      status: 'generated',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        wordCount: formData.wordCount,
        includeAchievements: formData.includeAchievements,
        includeMotivation: formData.includeMotivation,
        companyResearch: formData.companyResearch,
        customInstructions: formData.customInstructions,
      },
    };

    return fallbackLetter;
  };

  return {
    generateLetter,
    progress,
  };
}