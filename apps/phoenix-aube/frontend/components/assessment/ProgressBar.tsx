'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const percentage = (current / total) * 100;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Progression</span>
        <span>{current}/{total} ({Math.round(percentage)}%)</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-3 bg-gray-200"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Début</span>
        <span>Terminé</span>
      </div>
    </div>
  );
}