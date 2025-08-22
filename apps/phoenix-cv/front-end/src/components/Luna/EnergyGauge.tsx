import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Battery } from 'lucide-react';

interface EnergyGaugeProps {
  currentEnergy: number; // 0-100
}

export function EnergyGauge({ currentEnergy }: EnergyGaugeProps) {
  const getEnergyColor = (energy: number) => {
    if (energy > 50) return 'from-luna-500 to-luna-accent';
    if (energy > 20) return 'from-warning to-phoenix-accent';
    return 'from-error to-phoenix-secondary';
  };

  const getEnergyTextColor = (energy: number) => {
    if (energy > 50) return 'text-luna-400';
    if (energy > 20) return 'text-phoenix-400';
    return 'text-red-400';
  };

  const circumference = 2 * Math.PI * 18; // rayon de 18px
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (currentEnergy / 100) * circumference;

  return (
    <div className="relative group">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative w-12 h-12 cursor-pointer"
      >
        {/* Cercle de fond */}
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-gray-700"
          />
          {/* Cercle de progression */}
          <motion.circle
            cx="20"
            cy="20"
            r="18"
            stroke="url(#energyGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentEnergy > 50 ? '#3b82f6' : currentEnergy > 20 ? '#f97316' : '#ef4444'} />
              <stop offset="100%" stopColor={currentEnergy > 50 ? '#06b6d4' : currentEnergy > 20 ? '#eab308' : '#ec4899'} />
            </linearGradient>
          </defs>
        </svg>

        {/* Contenu central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-xs font-bold ${getEnergyTextColor(currentEnergy)}`}>
              {currentEnergy}%
            </div>
          </div>
        </div>

        {/* Icône éclair */}
        <motion.div
          animate={{ 
            scale: currentEnergy < 20 ? [1, 1.2, 1] : 1,
            opacity: currentEnergy < 20 ? [1, 0.7, 1] : 1
          }}
          transition={{ 
            duration: 1.5, 
            repeat: currentEnergy < 20 ? Infinity : 0,
            ease: "easeInOut"
          }}
          className="absolute -top-1 -right-1"
        >
          <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getEnergyColor(currentEnergy)} flex items-center justify-center`}>
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
        </motion.div>
      </motion.div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-700">
          <div className="font-medium">Énergie Luna</div>
          <div className="text-gray-300">{currentEnergy}/100 disponible</div>
          {currentEnergy < 20 && (
            <div className="text-red-400 mt-1">⚠️ Énergie faible</div>
          )}
          {/* Flèche du tooltip */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}