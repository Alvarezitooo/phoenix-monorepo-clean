/**
 * 🎨 Phoenix UI - Card Component
 * Composant card unifié avec variantes et module theming
 */

import React from 'react';
import { DesignTokens, getModuleStyles, combineClasses } from '../design-tokens';

interface PhoenixCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'gradient';
  module?: 'aube' | 'cv' | 'letters' | 'rise';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const PhoenixCard: React.FC<PhoenixCardProps> = ({
  children,
  variant = 'default',
  module,
  className = '',
  onClick,
  hover = false,
  padding = 'md'
}) => {
  // Base classes selon variant
  const baseClasses = DesignTokens.components.cards[variant];
  
  // Classes de padding
  const paddingClasses = DesignTokens.spacing.padding[padding];
  
  // Classes de module si spécifié
  const moduleClasses = module ? getModuleStyles(module) : null;
  
  // Classes de hover avec micro-interactions sophistiquées
  const hoverClasses = hover || onClick ? combineClasses(
    DesignTokens.animations.hover,
    'hover-lift transition-all duration-300 ease-out',
    'hover:shadow-xl hover:-translate-y-1',
    variant === 'gradient' ? 'hover:scale-105' : 'hover:scale-102'
  ) : '';
  
  // Classes pour variant gradient avec module
  const gradientClasses = variant === 'gradient' && module 
    ? `bg-gradient-to-br ${moduleClasses?.bg} ${moduleClasses?.border} relative overflow-hidden` 
    : '';
  
  // Classes pour interactive avec feedback
  const interactiveClasses = onClick ? combineClasses(
    'cursor-pointer group',
    'click-scale active:scale-95',
    'focus:outline-none focus-ring'
  ) : '';
  
  // Combine toutes les classes
  const finalClasses = combineClasses(
    baseClasses,
    paddingClasses,
    gradientClasses,
    hoverClasses,
    interactiveClasses,
    className
  );

  return (
    <div 
      className={finalClasses}
      onClick={onClick}
    >
      {/* Shine effect pour gradient cards */}
      {variant === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
      )}
      
      {children}
    </div>
  );
};

// Composant spécialisé pour modules
interface ModuleCardProps extends Omit<PhoenixCardProps, 'module'> {
  module: 'aube' | 'cv' | 'letters' | 'rise';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  isPopular?: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  title,
  description,
  icon,
  badge,
  isPopular,
  children,
  ...props
}) => {
  const moduleStyles = getModuleStyles(module);
  
  return (
    <PhoenixCard 
      module={module}
      variant="gradient" 
      hover
      {...props}
      className={combineClasses(
        'relative',
        isPopular ? 'ring-2 ring-orange-500' : '',
        props.className || ''
      )}
    >
      {/* Badge populaire */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            POPULAIRE
          </span>
        </div>
      )}
      
      {/* Badge custom */}
      {badge && !isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className={`bg-gradient-to-r ${moduleStyles.primary} text-white px-4 py-1 rounded-full text-sm font-semibold`}>
            {badge}
          </span>
        </div>
      )}

      {/* Header avec icon */}
      {(icon || title) && (
        <div className="text-center mb-4 sm:mb-6">
          {icon && (
            <div className={`inline-flex p-3 sm:p-4 rounded-full bg-gradient-to-r ${moduleStyles.primary} mb-3 sm:mb-4`}>
              {icon}
            </div>
          )}
          {title && (
            <h3 className={DesignTokens.typography.headings.h4}>
              {title}
            </h3>
          )}
          {description && (
            <p className={combineClasses(
              DesignTokens.typography.body.small,
              DesignTokens.colors.neutral.text.secondary
            )}>
              {description}
            </p>
          )}
        </div>
      )}

      {/* Contenu custom */}
      {children}
    </PhoenixCard>
  );
};