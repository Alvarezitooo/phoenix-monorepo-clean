import React from 'react';
import { Flame, Plus } from 'lucide-react';

interface FlammesCounterProps {
  flames: number;
}

export default function FlammesCounter({ flames }: FlammesCounterProps) {
  return (
    <div className="flex items-center space-x-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full px-4 py-2 border border-indigo-200">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Flame className="h-5 w-5 text-indigo-500" />
          <div className="absolute inset-0 h-5 w-5 text-indigo-400 animate-pulse opacity-50">
            <Flame className="h-5 w-5" />
          </div>
        </div>
        <span className="font-bold text-indigo-600">{flames}</span>
        <span className="text-sm text-slate-700">Flammes</span>
      </div>
      <button className="flex items-center space-x-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 rounded-full px-3 py-1 text-xs font-medium text-white shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105">
        <Plus className="h-3 w-3" />
        <span>Recharger</span>
      </button>
    </div>
  );
}