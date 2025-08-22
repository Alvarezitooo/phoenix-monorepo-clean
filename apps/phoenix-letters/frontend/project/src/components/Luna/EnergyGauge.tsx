import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame } from 'lucide-react';
import { useLuna } from './LunaProvider';

interface EnergyGaugeProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'phoenix' | 'luna' | 'minimal';
}

// Energy Gauge Component - Phoenix Letters branding
export function EnergyGauge({ 
  showLabel = true, 
  size = 'md',
  variant = 'luna'
}: EnergyGaugeProps) {
  const { currentEnergy, maxEnergy } = useLuna();
  
  const percentage = (currentEnergy / maxEnergy) * 100;

  // Size configurations
  const sizeConfig = {
    sm: { width: 'w-16', height: 'h-2', icon: 'w-3 h-3', text: 'text-xs' },
    md: { width: 'w-24', height: 'h-3', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { width: 'w-32', height: 'h-4', icon: 'w-5 h-5', text: 'text-base' }
  };

  // Variant configurations
  const variantConfig = {
    phoenix: {
      bgColor: 'bg-phoenix-100',
      fillColor: 'from-phoenix-500 to-phoenix-600',
      icon: Flame,
      iconColor: 'text-phoenix-500',
      textColor: 'text-phoenix-700'
    },
    luna: {
      bgColor: 'bg-luna-100',
      fillColor: 'from-luna-500 to-luna-600',
      icon: Zap,
      iconColor: 'text-luna-500',
      textColor: 'text-luna-700'
    },
    minimal: {
      bgColor: 'bg-gray-200',
      fillColor: 'from-gray-400 to-gray-500',
      icon: Zap,
      iconColor: 'text-gray-500',
      textColor: 'text-gray-600'
    }
  };

  const config = sizeConfig[size];
  const variantStyle = variantConfig[variant];
  const IconComponent = variantStyle.icon;

  // Energy level status
  const getEnergyStatus = () => {
    if (percentage >= 80) return { status: 'high', color: 'text-green-600' };
    if (percentage >= 50) return { status: 'medium', color: 'text-yellow-600' };
    if (percentage >= 20) return { status: 'low', color: 'text-orange-600' };
    return { status: 'critical', color: 'text-red-600' };
  };

  const energyStatus = getEnergyStatus();

  return (
    <div className="flex items-center space-x-2">
      {/* Icon */}
      <IconComponent className={`${config.icon} ${variantStyle.iconColor}`} />
      
      {/* Energy Bar */}
      <div className={`${config.width} ${config.height} ${variantStyle.bgColor} rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full bg-gradient-to-r ${variantStyle.fillColor} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      {/* Label */}
      {showLabel && (
        <div className={`${config.text} font-medium ${variantStyle.textColor}`}>
          <span className={energyStatus.color}>{currentEnergy}</span>
          <span className="text-gray-400">/{maxEnergy}</span>
        </div>
      )}
    </div>
  );
}