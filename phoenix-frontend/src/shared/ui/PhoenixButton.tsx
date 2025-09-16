/**
 * 🎨 Phoenix UI - Button Component
 * Composant button unifié avec variantes et module theming
 */

import React from 'react';
import { DesignTokens, getModuleStyles, combineClasses } from '../design-tokens';

interface PhoenixButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  module?: 'aube' | 'cv' | 'letters' | 'rise' | 'luna';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const PhoenixButton: React.FC<PhoenixButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  module,
  className = '',
  onClick,
  disabled = false,
  loading = false,
  success = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button'
}) => {
  // Base classes selon variant
  const baseClasses = DesignTokens.components.buttons[variant];
  
  // Classes de taille
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
    lg: 'px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg'
  }[size];
  
  // Classes de largeur
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Classes de module pour couleurs
  let moduleClasses = '';
  if (variant === 'primary' && module) {
    if (module === 'luna') {
      moduleClasses = `bg-gradient-to-r ${DesignTokens.colors.luna.primary} hover:${DesignTokens.colors.luna.secondary}`;
    } else {
      const moduleStyles = getModuleStyles(module);
      moduleClasses = `bg-gradient-to-r ${moduleStyles.primary} ${moduleStyles.hover}`;
    }
  }
  
  if (variant === 'secondary' && module) {
    if (module === 'luna') {
      moduleClasses = `${DesignTokens.colors.luna.border} ${DesignTokens.colors.luna.text} hover:${DesignTokens.colors.luna.bg}`;
    } else {
      const moduleStyles = getModuleStyles(module);
      moduleClasses = `${moduleStyles.border} ${moduleStyles.text} hover:${moduleStyles.bg}`;
    }
  }
  
  // Classes d'état avec micro-interactions
  const stateClasses = combineClasses(
    disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    loading ? 'pointer-events-none' : '',
    success ? 'success-feedback' : '',
    !disabled && !loading && !success ? combineClasses(
      DesignTokens.animations.press,
      'hover-lift click-scale transition-all duration-200',
      'hover:shadow-lg focus:outline-none focus-ring',
      'hover:scale-102 active:scale-95'
    ) : ''
  );
  
  // Classes finales
  const finalClasses = combineClasses(
    baseClasses,
    sizeClasses,
    widthClasses,
    moduleClasses,
    stateClasses,
    'flex items-center justify-center space-x-2',
    className
  );

  return (
    <button
      type={type}
      className={finalClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      
      {success && (
        <svg className="h-4 w-4 text-green-500 animate-in fade-in scale-in duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      
      <span className={loading ? 'opacity-75' : ''}>{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
};

// Composants spécialisés pour usage fréquent
export const LunaButton: React.FC<Omit<PhoenixButtonProps, 'module'>> = (props) => (
  <PhoenixButton module="luna" {...props} />
);

export const ModuleButton: React.FC<PhoenixButtonProps & { module: 'aube' | 'cv' | 'letters' | 'rise' }> = (props) => (
  <PhoenixButton {...props} />
);