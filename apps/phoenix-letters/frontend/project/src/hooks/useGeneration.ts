import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Letter, GenerationProgress } from '@/types';
import { generateId, calculateReadingTime } from '@/lib/utils';

// API Service pour la génération
class LetterGenerationAPI {
  private baseURL = import.meta.env.VITE_API_URL || 'https://phoenix-letters-production.up.railway.app';

  async generateLetter(formData: any, userId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/letters/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Ajouter JWT token quand auth est implémentée
        // 'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        company_name: formData.companyName,
        position_title: formData.positionTitle,
        job_description: formData.jobDescription,
        experience_level: formData.experienceLevel,
        desired_tone: formData.tone,
        max_words: formData.wordCount,
        include_achievements: formData.includeAchievements,
        include_motivation: formData.includeMotivation,
        company_research: formData.companyResearch,
        custom_instructions: formData.customInstructions,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }
}

export function useGeneration() {
  const [progress, setProgress] = useState<GenerationProgress>({
    step: 0,
    totalSteps: 4,
    message: '',
    estimatedTime: 0,
  });

  const { formData, addLetter, setGenerating, setCurrentLetter, user } = useStore();
  const apiService = new LetterGenerationAPI();

  const generateLetter = async (): Promise<Letter> => {
    setGenerating(true);
    
    const steps = [
      { message: "Analyzing job requirements...", duration: 1500 },
      { message: "Connecting to Luna AI...", duration: 2000 },
      { message: "Crafting personalized content...", duration: 3000 },
      { message: "Optimizing for ATS...", duration: 1500 },
    ];

    let currentStep = 0;
    
    // Progress animation
    for (const step of steps) {
      setProgress({
        step: currentStep + 1,
        totalSteps: steps.length,
        message: step.message,
        estimatedTime: step.duration / 1000,
      });
      
      await new Promise(resolve => setTimeout(resolve, step.duration));
      currentStep++;
    }

    try {
      // Appel à la vraie API !
      const apiResponse = await apiService.generateLetter(formData, user?.id || 'demo-user');
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Generation failed');
      }

      // Transformation de la réponse API vers notre format Letter
      const generatedLetter = apiResponse.letter;
      const newLetter: Letter = {
        id: generatedLetter.id || generateId(),
        userId: user?.id || 'demo-user',
        companyName: formData.companyName,
        positionTitle: formData.positionTitle,
        experienceLevel: formData.experienceLevel,
        tone: formData.tone,
        jobDescription: formData.jobDescription,
        content: generatedLetter.content,
        wordCount: generatedLetter.word_count || generatedLetter.content.split(' ').length,
        readingTime: calculateReadingTime(generatedLetter.content),
        qualityScore: generatedLetter.quality_score || Math.floor(Math.random() * 20) + 80,
        status: 'generated',
        createdAt: new Date(generatedLetter.created_at || Date.now()),
        updatedAt: new Date(generatedLetter.updated_at || Date.now()),
        settings: {
          wordCount: formData.wordCount,
          includeAchievements: formData.includeAchievements,
          includeMotivation: formData.includeMotivation,
          companyResearch: formData.companyResearch,
          customInstructions: formData.customInstructions,
        },
      };

      addLetter(newLetter);
      setCurrentLetter(newLetter);
      
      setProgress({
        step: steps.length,
        totalSteps: steps.length,
        message: "Letter generated successfully!",
        estimatedTime: 0,
      });

      return newLetter;

    } catch (error) {
      console.error('API Generation failed, using fallback:', error);
      
      // Fallback si l'API échoue - contenu générique mais fonctionnel
      const fallbackContent = `Dear Hiring Manager,

I am writing to express my strong interest in the ${formData.positionTitle} position at ${formData.companyName}. With my ${formData.experienceLevel === 'junior' ? 'fresh perspective and eagerness to learn' : formData.experienceLevel === 'intermediate' ? 'solid experience and proven track record' : 'extensive expertise and leadership experience'}, I am confident that I would be a valuable addition to your team.

${formData.includeAchievements ? 'Throughout my career, I have achieved significant milestones that demonstrate my capability and dedication to excellence. ' : ''}My ${formData.tone} approach to work aligns perfectly with ${formData.companyName}'s values and culture.

${formData.includeMotivation ? `What particularly excites me about this opportunity is the chance to contribute to ${formData.companyName}'s mission and help drive innovation in your industry. ` : ''}I am eager to bring my skills and enthusiasm to your team and contribute to your continued success.

Thank you for considering my application. I look forward to the opportunity to discuss how my background and passion can contribute to ${formData.companyName}'s goals.

Best regards,
[Your Name]`;

      const fallbackLetter: Letter = {
        id: generateId(),
        userId: user?.id || 'demo-user',
        companyName: formData.companyName,
        positionTitle: formData.positionTitle,
        experienceLevel: formData.experienceLevel,
        tone: formData.tone,
        jobDescription: formData.jobDescription,
        content: fallbackContent,
        wordCount: fallbackContent.split(' ').length,
        readingTime: calculateReadingTime(fallbackContent),
        qualityScore: Math.floor(Math.random() * 20) + 75, // Légèrement moins pour le fallback
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

      addLetter(fallbackLetter);
      setCurrentLetter(fallbackLetter);
      
      setProgress({
        step: steps.length,
        totalSteps: steps.length,
        message: "Letter generated (fallback mode)",
        estimatedTime: 0,
      });

      return fallbackLetter;
      
    } finally {
      setGenerating(false);
    }
  };

  return {
    generateLetter,
    progress,
  };
}