import { ReactNode } from 'react';

interface AnimatedGradientProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedGradient = ({ children, className = '' }: AnimatedGradientProps) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Gradient animé de fond */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 opacity-10 animate-pulse"></div>
      
      {/* Contenu par-dessus */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};