import React from "react";
import { motion } from "framer-motion";

interface LunaPresenceProps {
  onClick: () => void;
}

export function LunaPresence({ onClick }: LunaPresenceProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: 2,
          type: "spring", 
          stiffness: 200, 
          damping: 15 
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
        }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="group relative h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg transition-all hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-300/50"
        aria-label="Ouvrir Luna - Assistant IA"
      >
        {/* Pulsation douce */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0.3, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Icône Luna */}
        <div className="relative flex h-full w-full items-center justify-center text-white">
          <motion.span 
            className="text-2xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            🌙
          </motion.span>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
          <div className="whitespace-nowrap rounded-lg bg-black/80 px-3 py-2 text-sm text-white shadow-lg">
            Découvrir Luna IA
            <div className="absolute top-full right-4 h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
          </div>
        </div>
      </motion.button>
    </div>
  );
}