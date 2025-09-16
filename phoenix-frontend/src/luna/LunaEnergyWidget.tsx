import React from 'react';
import { useLuna } from './LunaContext';
import { Zap, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LunaEnergyWidgetProps {
  isCompact?: boolean;
  showActions?: boolean;
}

export default function LunaEnergyWidget({ isCompact = false, showActions = true }: LunaEnergyWidgetProps) {
  const luna = useLuna();
  const navigate = useNavigate();
  
  const energy = luna.lunaEnergy || 0;
  const maxEnergy = 100;
  const percentage = (energy / maxEnergy) * 100;
  
  const getEnergyColor = () => {
    if (percentage > 66) return 'text-emerald-500';
    if (percentage > 33) return 'text-amber-500';
    return 'text-red-500';
  };

  const getEnergyBgColor = () => {
    if (percentage > 66) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
    if (percentage > 33) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getEnergyMessage = () => {
    if (percentage > 80) return "🚀 Pleine puissance !";
    if (percentage > 50) return "⚡ Prête pour l'action";
    if (percentage > 20) return "🔋 Attention énergie";
    return "💔 Recharge nécessaire";
  };

  const getEnergyIcon = () => {
    if (percentage > 50) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  if (isCompact) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
        <Zap className={`h-4 w-4 ${getEnergyColor()}`} />
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${getEnergyBgColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <span className={`text-xs font-medium ${getEnergyColor()}`}>
          {energy}⚡
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Zap className={`h-5 w-5 ${getEnergyColor()}`} />
            <div className="absolute inset-0 h-5 w-5 animate-pulse opacity-50">
              <Zap className={`h-5 w-5 ${getEnergyColor()}`} />
            </div>
          </div>
          <span className="font-semibold text-gray-800">Énergie Luna</span>
        </div>
        <div className="flex items-center space-x-1">
          {getEnergyIcon()}
          <span className={`text-sm font-bold ${getEnergyColor()}`}>
            {energy}/{maxEnergy}
          </span>
        </div>
      </div>
      
      {/* Energy Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${getEnergyBgColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Status Message */}
      <div className="text-xs text-gray-600 mb-3 text-center">
        {getEnergyMessage()}
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/energy')}
            className="flex-1 flex items-center justify-center space-x-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-3 w-3" />
            <span>Recharger</span>
          </button>
          
          {percentage < 30 && (
            <button
              onClick={() => navigate('/energy')}
              className="flex-1 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 text-xs py-2 rounded-lg transition-colors animate-pulse"
            >
              Urgent !
            </button>
          )}
        </div>
      )}
    </div>
  );
}