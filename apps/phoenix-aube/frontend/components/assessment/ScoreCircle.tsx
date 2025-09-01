'use client';

import { cn } from '@/lib/utils';

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function ScoreCircle({ score, size = 'md', label, className }: ScoreCircleProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20', 
    lg: 'w-24 h-24'
  };

  const radius = size === 'sm' ? 28 : size === 'md' ? 36 : 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

  return (
    <div className={cn("text-center space-y-2", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={strokeDasharray}
            className="text-blue-500 transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-bold text-blue-600",
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-xl'
          )}>
            {score}%
          </span>
        </div>
      </div>
      {label && (
        <p className={cn(
          "text-gray-600",
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {label}
        </p>
      )}
    </div>
  );
}