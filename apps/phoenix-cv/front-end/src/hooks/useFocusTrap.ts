/**
 * 🎯 useFocusTrap Hook - Phoenix CV
 * Hook pour gérer le focus trap dans les modales
 */

import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // Sauvegarde l'élément actuellement focusé
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Trouve tous les éléments focusables dans le container
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable]'
      ].join(',');

      return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    };

    // Focus sur le premier élément focusable
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Gestion du focus trap
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Gestion de la touche Escape
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Déclenche l'événement pour fermer la modal
        container.dispatchEvent(new CustomEvent('closeFocusTrap'));
      }
    };

    // Empêche le focus en dehors du container
    const handleFocusOutside = (e: FocusEvent) => {
      if (container && !container.contains(e.target as Node)) {
        e.preventDefault();
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    // Ajout des listeners
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('focusin', handleFocusOutside);

    // Cleanup au démontage
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('focusin', handleFocusOutside);

      // Restaure le focus précédent
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}