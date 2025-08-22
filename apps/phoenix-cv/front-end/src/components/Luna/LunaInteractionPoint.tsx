import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sparkles } from 'lucide-react';
import { useLuna } from './LunaProvider';

interface LunaInteractionPointProps {
  tooltipText: string;
  variant?: 'default' | 'subtle' | 'prominent';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function LunaInteractionPoint({ 
  tooltipText, 
  variant = 'default',
  position = 'top'
}: LunaInteractionPointProps) {
  const { openModal } = useLuna();

  const getVariantStyles = () => {
    switch (variant) {
      case 'subtle':
        return 'w-6 h-6 bg-luna-gradient bg-opacity-20 border border-luna-500/30';
      case 'prominent':
        return 'w-8 h-8 bg-luna-gradient bg-opacity-40 border border-luna-500/50 shadow-lg shadow-luna-500/25';
      default:
        return 'w-7 h-7 bg-luna-gradient bg-opacity-30 border border-luna-500/40';
    }
  };

  const getTooltipPosition = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getTooltipArrow = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900';
    }
  };

  return (
    <div className="relative group inline-block">
      <motion.button
        onClick={openModal}
        className={`${getVariantStyles()} rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(147, 51, 234, 0)',
            '0 0 0 8px rgba(147, 51, 234, 0.1)',
            '0 0 0 0 rgba(147, 51, 234, 0)'
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            repeatDelay: 2
          }}
        >
          <Moon className="w-3 h-3 text-purple-300" />
        </motion.div>
        
        {/* Particules scintillantes */}
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <Sparkles className="w-2 h-2 text-cyan-400 absolute -top-1 -right-1" />
        </motion.div>
      </motion.button>

      {/* Tooltip */}
      <div className={`absolute ${getTooltipPosition()} opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50`}>
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-700 max-w-xs">
          <div className="flex items-center space-x-2">
            <Moon className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span>{tooltipText}</span>
          </div>
          {/* Flèche du tooltip */}
          <div className={`absolute ${getTooltipArrow()}`}></div>
        </div>
      </div>
    </div>
  );
}