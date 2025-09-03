import { useState, useEffect } from 'react';

export interface LunaState {
  energy: number;
  maxEnergy: number;
  isAuthenticated: boolean;
  notifications: string[];
}

export function useLuna() {
  const [lunaState, setLunaState] = useState<LunaState>({
    energy: 85, // Demo value
    maxEnergy: 100,
    isAuthenticated: false,
    notifications: ['🎯 Prêt à optimiser ton CV ?', '✨ Nouvelle fonctionnalité : Lettres IA']
  });

  // Simulate energy consumption
  const consumeEnergy = (amount: number) => {
    setLunaState(prev => ({
      ...prev,
      energy: Math.max(0, prev.energy - amount)
    }));
  };

  // Check if user can perform action
  const canPerformAction = (energyCost: number): boolean => {
    return lunaState.energy >= energyCost;
  };

  // Get energy status color
  const getEnergyColor = (): string => {
    const percentage = (lunaState.energy / lunaState.maxEnergy) * 100;
    if (percentage > 66) return 'text-green-500';
    if (percentage > 33) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get energy bar color
  const getEnergyBarColor = (): string => {
    const percentage = (lunaState.energy / lunaState.maxEnergy) * 100;
    if (percentage > 66) return 'bg-green-500';
    if (percentage > 33) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return {
    ...lunaState,
    consumeEnergy,
    canPerformAction,
    getEnergyColor,
    getEnergyBarColor
  };
}