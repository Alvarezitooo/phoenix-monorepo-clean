import React from 'react';
import { Moon, Plus, Zap, Heart, Gift, Shield } from 'lucide-react';

interface LunaEnergyGaugeProps {
  energy: number;
  hasFirstPurchaseBonus?: boolean;
}

export default function LunaEnergyGauge({ energy, hasFirstPurchaseBonus = false }: LunaEnergyGaugeProps) {
  const getEnergyColor = (energy: number) => {
    if (energy >= 70) return 'from-emerald-500 to-cyan-500';
    if (energy >= 40) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getEnergyMessage = (energy: number) => {
    if (energy >= 90) return '🔥 Énergie de titan - Tout est possible !';
    if (energy >= 70) return '✨ Prête pour votre transformation majeure';
    if (energy >= 50) return '💫 Belle énergie pour nos explorations';
    if (energy >= 30) return '🌅 Encore de belles sessions ensemble';
    if (energy >= 10) return '🌙 Rechargeons notre énergie créative';
    return '⚡ Pause Luna - Votre prochain pack vous attend';
  };

  const getEnergyEmoji = (energy: number) => {
    if (energy >= 90) return '🔥';
    if (energy >= 70) return '✨'; 
    if (energy >= 50) return '💫';
    if (energy >= 30) return '🌅';
    if (energy >= 10) return '🌙';
    return '⚡';
  };

  return (
    <div className="flex items-center space-x-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full px-6 py-3 border border-indigo-200 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Moon className="h-6 w-6 text-indigo-500" />
          <div className="absolute inset-0 h-6 w-6 text-indigo-400 animate-pulse opacity-50">
            <Moon className="h-6 w-6" />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-indigo-600 text-lg">Luna</span>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-slate-600">Énergie :</span>
              <span className="font-semibold text-slate-800">{energy}%</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="h-3 w-3 text-pink-400" />
            <span className="text-xs text-slate-500 italic">{getEnergyMessage(energy)}</span>
          </div>
          
          {/* Bonus visible si applicable */}
          {hasFirstPurchaseBonus && (
            <div className="flex items-center space-x-1 mt-1">
              <Gift className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">+10% Bonus généreux</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${getEnergyColor(energy)} transition-all duration-500 ease-out`}
          style={{ width: `${energy}%` }}
        />
      </div>
      
      {/* Garantie discrète */}
      <div className="flex items-center space-x-1 text-xs text-slate-400">
        <Shield className="h-3 w-3" />
        <span>Garantie satisfaction</span>
      </div>
      
      <button className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105">
        <Zap className="h-4 w-4" />
        <span>Recharger</span>
      </button>
    </div>
  );
}