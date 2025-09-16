/**
 * 🎨 Phoenix Design System - Design Tokens
 * Système unifié de couleurs, spacing, typography, etc.
 */

export const DesignTokens = {
  
  // 🌈 Color System Phoenix
  colors: {
    // Module Colors - Identité visuelle des modules
    modules: {
      aube: {
        primary: 'from-purple-500 to-indigo-600',
        bg: 'from-purple-50 to-indigo-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        hover: 'hover:from-purple-600 hover:to-indigo-700',
      },
      cv: {
        primary: 'from-cyan-500 to-blue-600', 
        bg: 'from-cyan-50 to-blue-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
        hover: 'hover:from-cyan-600 hover:to-blue-700',
      },
      letters: {
        primary: 'from-orange-500 to-red-600',
        bg: 'from-orange-50 to-red-50', 
        text: 'text-orange-700',
        border: 'border-orange-200',
        hover: 'hover:from-orange-600 hover:to-red-700',
      },
      rise: {
        primary: 'from-emerald-500 to-teal-600',
        bg: 'from-emerald-50 to-teal-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200', 
        hover: 'hover:from-emerald-600 hover:to-teal-700',
      }
    },
    
    // Luna Brand Colors
    luna: {
      primary: 'from-indigo-600 to-purple-600',
      secondary: 'from-indigo-500 to-purple-500',
      bg: 'from-indigo-50 to-purple-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    },
    
    // Semantic Colors
    semantic: {
      success: {
        primary: 'from-green-500 to-emerald-600',
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200'
      },
      warning: {
        primary: 'from-yellow-500 to-orange-500',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700', 
        border: 'border-yellow-200'
      },
      error: {
        primary: 'from-red-500 to-pink-600',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200'
      }
    },
    
    // Neutral Palette
    neutral: {
      50: 'bg-slate-50',
      100: 'bg-slate-100',
      200: 'bg-slate-200',
      300: 'bg-slate-300',
      400: 'bg-slate-400',
      500: 'bg-slate-500',
      600: 'bg-slate-600',
      700: 'bg-slate-700',
      800: 'bg-slate-800',
      900: 'bg-slate-900',
      text: {
        primary: 'text-slate-900',
        secondary: 'text-slate-700', 
        muted: 'text-slate-500',
        disabled: 'text-slate-400'
      }
    }
  },

  // 📏 Spacing System
  spacing: {
    // Standard spacing scale
    xs: 'space-x-1 space-y-1', // 4px
    sm: 'space-x-2 space-y-2', // 8px  
    md: 'space-x-3 space-y-3', // 12px
    lg: 'space-x-4 space-y-4', // 16px
    xl: 'space-x-6 space-y-6', // 24px
    '2xl': 'space-x-8 space-y-8', // 32px
    
    // Gap utilities
    gap: {
      xs: 'gap-2', // 8px
      sm: 'gap-4', // 16px
      md: 'gap-6', // 24px
      lg: 'gap-8', // 32px
      xl: 'gap-12', // 48px
    },
    
    // Padding scale
    padding: {
      xs: 'p-2',
      sm: 'p-4', 
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12'
    }
  },

  // 📝 Typography System
  typography: {
    // Heading scale
    headings: {
      h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight',
      h2: 'text-xl sm:text-2xl md:text-3xl font-bold leading-tight',
      h3: 'text-lg sm:text-xl md:text-2xl font-semibold leading-tight',
      h4: 'text-base sm:text-lg font-semibold leading-tight',
      h5: 'text-sm sm:text-base font-medium leading-tight',
    },
    
    // Body text
    body: {
      large: 'text-lg sm:text-xl leading-relaxed',
      base: 'text-base leading-relaxed',
      small: 'text-sm leading-normal',
      xs: 'text-xs leading-normal'
    },
    
    // Font weights
    weights: {
      normal: 'font-normal',
      medium: 'font-medium', 
      semibold: 'font-semibold',
      bold: 'font-bold'
    }
  },

  // 🎭 Component Patterns
  components: {
    // Card variants
    cards: {
      default: 'rounded-xl border border-slate-200 bg-white shadow-sm',
      elevated: 'rounded-xl border border-slate-200 bg-white shadow-lg',
      interactive: 'rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer',
      gradient: 'rounded-xl border-2 shadow-lg transition-all duration-200 hover:shadow-xl',
    },
    
    // Button variants
    buttons: {
      primary: 'px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold text-white transition-all duration-200 active:scale-95 touch-manipulation',
      secondary: 'px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium border-2 transition-all duration-200 active:scale-95 touch-manipulation',
      ghost: 'px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-slate-100 active:scale-95 touch-manipulation',
    },
    
    // Input variants
    inputs: {
      default: 'px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200',
      error: 'px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50',
    }
  },

  // ✨ Animations & Transitions  
  animations: {
    // Standard transitions
    transition: 'transition-all duration-200 ease-in-out',
    hover: 'hover:scale-105 hover:shadow-lg transition-all duration-200',
    press: 'active:scale-95 transition-transform duration-100',
    
    // Loading states
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    
    // Custom animations
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    pulseSoft: 'animate-pulse-soft'
  },

  // 📐 Layout Patterns
  layouts: {
    // Grid systems
    grids: {
      responsive1to4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      responsive1to3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 
      responsive1to2: 'grid grid-cols-1 md:grid-cols-2',
      auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    },
    
    // Container patterns
    containers: {
      page: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      section: 'max-w-6xl mx-auto px-4 sm:px-6',
      content: 'max-w-4xl mx-auto px-4',
      narrow: 'max-w-2xl mx-auto px-4'
    },
    
    // Flexbox patterns
    flex: {
      center: 'flex items-center justify-center',
      between: 'flex items-center justify-between',
      start: 'flex items-center justify-start',
      column: 'flex flex-col items-center',
      responsive: 'flex flex-col sm:flex-row items-center'
    }
  },

  // 📱 Responsive Patterns
  responsive: {
    // Hide/show patterns
    mobile: {
      only: 'block sm:hidden',
      hidden: 'hidden sm:block'
    },
    desktop: {
      only: 'hidden lg:block',
      hidden: 'block lg:hidden'
    },
    
    // Text sizing
    text: {
      responsive: 'text-sm sm:text-base lg:text-lg',
      heading: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl'
    }
  }
}

// Helper functions pour utilisation facile
export const getModuleStyles = (module: 'aube' | 'cv' | 'letters' | 'rise') => {
  return DesignTokens.colors.modules[module];
}

export const combineClasses = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
}