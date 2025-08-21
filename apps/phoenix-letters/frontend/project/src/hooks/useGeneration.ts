import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Letter, GenerationProgress } from '@/types';
import { generateId, calculateReadingTime } from '@/lib/utils';

export function useGeneration() {
  const [progress, setProgress] = useState<GenerationProgress>({
    step: 0,
    totalSteps: 4,
    message: '',
    estimatedTime: 0,
  });

  const { formData, addLetter, setGenerating, setCurrentLetter } = useStore();

  const generateLetter = async (): Promise<Letter> => {
    setGenerating(true);
    
    const steps = [
      { message: "Analyzing job requirements...", duration: 2000 },
      { message: "Crafting personalized content...", duration: 3000 },
      { message: "Optimizing for ATS...", duration: 1500 },
      { message: "Final review...", duration: 1000 },
    ];

    let currentStep = 0;
    
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

    // Simulate letter generation
    const sampleContent = `Dear Hiring Manager,

I am writing to express my strong interest in the ${formData.positionTitle} position at ${formData.companyName}. With my ${formData.experienceLevel === 'junior' ? 'fresh perspective and eagerness to learn' : formData.experienceLevel === 'intermediate' ? 'solid experience and proven track record' : 'extensive expertise and leadership experience'}, I am confident that I would be a valuable addition to your team.

${formData.includeAchievements ? 'Throughout my career, I have achieved significant milestones that demonstrate my capability and dedication to excellence. ' : ''}My ${formData.tone} approach to work aligns perfectly with ${formData.companyName}'s values and culture.

${formData.includeMotivation ? `What particularly excites me about this opportunity is the chance to contribute to ${formData.companyName}'s mission and help drive innovation in your industry. ` : ''}I am eager to bring my skills and enthusiasm to your team and contribute to your continued success.

Thank you for considering my application. I look forward to the opportunity to discuss how my background and passion can contribute to ${formData.companyName}'s goals.

Best regards,
[Your Name]`;

    const newLetter: Letter = {
      id: generateId(),
      userId: 'demo-user',
      companyName: formData.companyName,
      positionTitle: formData.positionTitle,
      experienceLevel: formData.experienceLevel,
      tone: formData.tone,
      jobDescription: formData.jobDescription,
      content: sampleContent,
      wordCount: sampleContent.split(' ').length,
      readingTime: calculateReadingTime(sampleContent),
      qualityScore: Math.floor(Math.random() * 20) + 80,
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

    addLetter(newLetter);
    setCurrentLetter(newLetter);
    setGenerating(false);
    
    setProgress({
      step: steps.length,
      totalSteps: steps.length,
      message: "Letter generated successfully!",
      estimatedTime: 0,
    });

    return newLetter;
  };

  return {
    generateLetter,
    progress,
  };
}