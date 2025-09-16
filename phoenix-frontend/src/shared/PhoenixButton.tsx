import React, { ReactNode } from 'react';
import { ArrowRight, Zap } from 'lucide-react';

interface PhoenixButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: ReactNode;
  energyCost?: number;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function PhoenixButton({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  energyCost,
  disabled = false,
  onClick,
  className = ''
}: PhoenixButtonProps) {
  const baseClasses = "relative group font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
  
  const variants = {
    primary: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-orange-500/25 focus:ring-orange-500",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 shadow-lg focus:ring-slate-500",
    ghost: "text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 border border-orange-500/30 hover:border-orange-400"
  };

  const sizes = {
    small: "px-4 py-2 text-sm",
    medium: "px-6 py-3 text-base",
    large: "px-8 py-4 text-lg"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      <div className="flex items-center space-x-2 relative z-10">
        {icon && <span>{icon}</span>}
        <span>{children}</span>
        {energyCost && (
          <span className="bg-black/20 rounded-full px-2 py-1 text-xs flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>{energyCost}%</span>
          </span>
        )}
        {!icon && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
      </div>
      
      {/* Energy animation overlay for primary buttons */}
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200 animate-pulse"></div>
      )}
    </button>
  );
}