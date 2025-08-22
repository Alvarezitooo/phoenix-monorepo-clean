import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GenerationForm } from '@/components/generation/GenerationForm';
import { GenerationProgress } from '@/components/generation/GenerationProgress';
import { useGeneration } from '@/hooks/useGeneration';
import { useStore } from '@/store/useStore';
import { FormData } from '@/types';
import { useLuna } from '@/components/Luna';

export function Generate() {
  const navigate = useNavigate();
  const { isGenerating } = useStore();
  const { generateLetter, progress } = useGeneration();
  const [showProgress, setShowProgress] = useState(false);
  const { setContext } = useLuna();

  // Set Luna context for generation page
  useEffect(() => {
    setContext('generate');
  }, [setContext]);

  const handleSubmit = async (data: FormData) => {
    setShowProgress(true);
    
    try {
      const letter = await generateLetter();
      
      // Navigate to the results page after generation
      setTimeout(() => {
        navigate(`/letters/${letter.id}`);
      }, 1000);
    } catch (error) {
      console.error('Generation failed:', error);
      setShowProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {!showProgress ? (
          <GenerationForm 
            onSubmit={handleSubmit} 
            isGenerating={isGenerating}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center min-h-[60vh]"
          >
            <GenerationProgress progress={progress} />
          </motion.div>
        )}
      </div>
    </div>
  );
}