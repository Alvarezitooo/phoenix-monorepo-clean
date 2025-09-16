/**
 * 🎭 Page Transition System - Phoenix Animations Phase D
 * 
 * Système de transitions de pages sophistiqué avec animations contextuelles
 * pour une expérience utilisateur fluide et professionnelle.
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DesignTokens, combineClasses, getModuleStyles } from '../ui';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// Map des modules selon les routes
const getModuleFromPath = (pathname: string): 'aube' | 'cv' | 'letters' | 'rise' | null => {
  if (pathname.includes('/aube')) return 'aube';
  if (pathname.includes('/cv')) return 'cv';
  if (pathname.includes('/letters')) return 'letters';
  if (pathname.includes('/rise')) return 'rise';
  return null;
};

// Types de transitions selon le contexte
const getTransitionType = (pathname: string): 'home' | 'module' | 'auth' | 'secondary' => {
  if (pathname === '/') return 'home';
  if (pathname.includes('/aube') || pathname.includes('/cv') || pathname.includes('/letters') || pathname.includes('/rise')) return 'module';
  if (pathname.includes('/login')) return 'auth';
  return 'secondary';
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  const module = getModuleFromPath(location.pathname);
  const transitionType = getTransitionType(location.pathname);
  const moduleStyles = module ? getModuleStyles(module) : null;

  // Effet de transition lors du changement de route
  useEffect(() => {
    // Fade out
    setIsVisible(false);

    const timer = setTimeout(() => {
      // Update children puis fade in
      setDisplayChildren(children);
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  // Classes de transition selon le type de page
  const getTransitionClasses = () => {
    const baseClasses = combineClasses(
      'transition-all duration-500 ease-in-out',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    );

    switch (transitionType) {
      case 'home':
        return combineClasses(
          baseClasses,
          'transform',
          isVisible ? 'scale-100' : 'scale-95'
        );

      case 'module':
        return combineClasses(
          baseClasses,
          'transform relative',
          isVisible ? 'scale-100' : 'scale-98',
          // Subtle background glow pour les modules
          module ? `before:absolute before:inset-0 before:bg-gradient-to-br before:${moduleStyles?.bg} before:opacity-5 before:pointer-events-none` : ''
        );

      case 'auth':
        return combineClasses(
          baseClasses,
          'transform',
          isVisible ? 'scale-100 rotate-0' : 'scale-95 rotate-1'
        );

      default:
        return combineClasses(
          baseClasses,
          'transform',
          isVisible ? 'translate-x-0' : 'translate-x-2'
        );
    }
  };

  return (
    <div className={combineClasses(getTransitionClasses(), className)}>
      {displayChildren}
    </div>
  );
};

// Hook pour déclencher des transitions programmatiques
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const triggerTransition = (callback?: () => void) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      callback?.();
      setIsTransitioning(false);
    }, 300);
  };

  return {
    isTransitioning,
    triggerTransition
  };
};

// Composant pour les micro-transitions d'éléments
interface ElementTransitionProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
  duration?: number;
  className?: string;
}

export const ElementTransition: React.FC<ElementTransitionProps> = ({
  children,
  delay = 0,
  direction = 'up',
  duration = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getDirectionClasses = () => {
    const base = `transition-all duration-${duration} ease-out`;
    
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `${base} opacity-0 translate-y-4`;
        case 'down':
          return `${base} opacity-0 -translate-y-4`;
        case 'left':
          return `${base} opacity-0 translate-x-4`;
        case 'right':
          return `${base} opacity-0 -translate-x-4`;
        case 'scale':
          return `${base} opacity-0 scale-95`;
        case 'fade':
        default:
          return `${base} opacity-0`;
      }
    }

    return `${base} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  return (
    <div className={combineClasses(getDirectionClasses(), className)}>
      {children}
    </div>
  );
};

// Composant pour les transitions de liste avec stagger
interface StaggerTransitionProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export const StaggerTransition: React.FC<StaggerTransitionProps> = ({
  children,
  staggerDelay = 100,
  direction = 'up',
  className = ''
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <ElementTransition
          key={index}
          delay={index * staggerDelay}
          direction={direction}
        >
          {child}
        </ElementTransition>
      ))}
    </div>
  );
};