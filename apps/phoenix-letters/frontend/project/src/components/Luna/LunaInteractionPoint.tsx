import React from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { useLuna } from './LunaProvider';

interface LunaInteractionPointProps {
  tooltipText?: string;
  variant?: 'default' | 'prominent' | 'subtle';
  contextMessage?: string; // Message contextuel pour Luna
}

// Luna Interaction Points - Smart integration in Phoenix Letters content
export function LunaInteractionPoint({ 
  tooltipText = "Cliquez pour parler à Luna",
  variant = 'default',
  contextMessage
}: LunaInteractionPointProps) {
  const { openModal, addMessage } = useLuna();

  const handleClick = () => {
    // Open Luna modal
    openModal();
    
    // Add contextual message if provided
    if (contextMessage) {
      setTimeout(() => {
        addMessage({
          content: contextMessage,
          sender: 'luna',
          type: 'text'
        });
      }, 500);
    }
  };

  // Variant styles adapted to Phoenix Letters design
  const getVariantStyles = () => {
    switch (variant) {
      case 'prominent':
        return {
          container: "w-8 h-8 bg-luna-gradient hover:shadow-lg",
          icon: "w-4 h-4 text-white",
          tooltip: "bg-luna-600 text-white"
        };
      case 'subtle':
        return {
          container: "w-6 h-6 bg-luna-100 hover:bg-luna-200 border border-luna-300",
          icon: "w-3 h-3 text-luna-600",
          tooltip: "bg-gray-800 text-white"
        };
      default:
        return {
          container: "w-7 h-7 bg-luna-gradient hover:shadow-md",
          icon: "w-3 h-3 text-white",
          tooltip: "bg-luna-600 text-white"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="relative inline-block group">
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`
          ${styles.container}
          rounded-full transition-all duration-200 
          flex items-center justify-center
          hover:scale-110 active:scale-95
          cursor-pointer
        `}
        aria-label={tooltipText}
      >
        <Moon className={styles.icon} />
      </motion.button>

      {/* Tooltip */}
      <div className={`
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        px-2 py-1 rounded text-xs font-medium
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        pointer-events-none whitespace-nowrap z-50
        ${styles.tooltip}
      `}>
        {tooltipText}
        <div className={`
          absolute top-full left-1/2 transform -translate-x-1/2
          border-l-4 border-r-4 border-t-4 border-transparent
          ${variant === 'subtle' ? 'border-t-gray-800' : 'border-t-luna-600'}
        `} />
      </div>
    </div>
  );
}