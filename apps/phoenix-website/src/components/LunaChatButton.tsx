/**
 * 🌙 Luna Chat Button - Bouton flottant pour ouvrir le chat
 * Accès rapide à Luna depuis n'importe où sur le website
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Moon, Sparkles } from 'lucide-react';

interface LunaChatButtonProps {
  onClick: () => void;
  hasUnreadMessages?: boolean;
  isAuthenticated: boolean;
}

export const LunaChatButton: React.FC<LunaChatButtonProps> = ({
  onClick,
  hasUnreadMessages = false,
  isAuthenticated
}) => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white group"
    >
      {/* Badge non lu */}
      {hasUnreadMessages && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Icône Luna */}
      <div className="relative">
        {isAuthenticated ? (
          <Moon className="w-6 h-6 group-hover:rotate-12 transition-transform duration-200" />
        ) : (
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
        )}
        
        {/* Effet brillance */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-white/20"
        />
      </div>

      {/* Tooltip */}
      <div className="absolute right-16 bottom-2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {isAuthenticated ? 'Parle avec Luna 🌙' : 'Connecte-toi pour parler avec Luna'}
        <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-black/80 rotate-45"></div>
      </div>

      {/* Effet de vagues */}
      {isAuthenticated && (
        <>
          <motion.div
            animate={{ 
              scale: [1, 2, 1],
              opacity: [0, 0.3, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full border-2 border-blue-400"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.8, 1],
              opacity: [0, 0.4, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute inset-0 rounded-full border-2 border-purple-400"
          />
        </>
      )}
    </motion.button>
  );
};

export default LunaChatButton;