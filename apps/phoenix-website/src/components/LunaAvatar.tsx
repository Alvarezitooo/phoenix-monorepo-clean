import React from 'react';
import { Moon, Sparkles, Heart } from 'lucide-react';

interface LunaAvatarProps {
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  animated?: boolean;
}

export default function LunaAvatar({ size = 'medium', showName = true, animated = true }: LunaAvatarProps) {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  };

  const iconSizes = {
    small: 'h-6 w-6',
    medium: 'h-10 w-10',
    large: 'h-16 w-16'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Avatar Background */}
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 p-1 ${animated ? 'animate-pulse' : ''}`}>
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center relative overflow-hidden`}>
            {/* Luna Icon */}
            <Moon className={`${iconSizes[size]} text-indigo-600 z-10`} />
            
            {/* Sparkles Animation */}
            {animated && (
              <>
                <div className="absolute top-2 right-2 text-cyan-400 animate-bounce">
                  <Sparkles className="h-3 w-3" />
                </div>
                <div className="absolute bottom-2 left-2 text-purple-400 animate-bounce animation-delay-1000">
                  <Heart className="h-2 w-2" />
                </div>
              </>
            )}
            
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      </div>
      
      {showName && (
        <div className="text-center">
          <div className={`font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ${textSizes[size]}`}>
            Luna
          </div>
          <div className="text-xs text-slate-500 italic">
            Votre guide IA bienveillante
          </div>
        </div>
      )}
    </div>
  );
}