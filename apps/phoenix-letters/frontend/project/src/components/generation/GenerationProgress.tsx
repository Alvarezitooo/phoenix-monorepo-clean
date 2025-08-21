import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GenerationProgress as ProgressType } from '@/types';

interface GenerationProgressProps {
  progress: ProgressType;
}

export function GenerationProgress({ progress }: GenerationProgressProps) {
  const progressPercentage = (progress.step / progress.totalSteps) * 100;

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          {/* Phoenix Logo Animation */}
          <motion.div
            className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-sm text-gray-600">
              Step {progress.step} of {progress.totalSteps}
            </p>
          </div>

          {/* Current Step */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {progress.message}
            </h3>
            
            {progress.estimatedTime > 0 && (
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Estimated time: {progress.estimatedTime}s
              </div>
            )}
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2">
            {Array.from({ length: progress.totalSteps }, (_, i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < progress.step ? 'bg-gradient-primary' : 'bg-gray-300'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}