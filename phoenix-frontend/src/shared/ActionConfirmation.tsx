import React from 'react';
import { Moon, Shield, ArrowRight, X } from 'lucide-react';
import { LunaAvatar2_5D } from './components/LunaAvatar2_5D';
import PhoenixButton from './PhoenixButton';

interface ActionConfirmationProps {
  actionName: string;
  energyCost: number;
  currentEnergy: number;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function ActionConfirmation({
  actionName,
  energyCost,
  currentEnergy,
  onConfirm,
  onCancel,
  isOpen
}: ActionConfirmationProps) {
  if (!isOpen) return null;

  const remainingEnergy = currentEnergy - energyCost;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <LunaAvatar2_5D state="idle" energy={68} size={32} />
            <span className="font-semibold text-slate-800">Confirmation avec Luna</span>
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-700 mb-4">
            "Cette <strong>{actionName}</strong> est l'une de mes spécialités. 
            Elle utilisera <strong>{energyCost}%</strong> de votre énergie restante. 
            Commençons cette exploration ensemble ! ✨"
          </p>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Impact énergie :</span>
              <span className="font-semibold text-indigo-600">
                {currentEnergy}% → {remainingEnergy}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-6">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Shield className="h-3 w-3" />
            <span>Garantie satisfaction - Énergie remboursée si non satisfait</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <PhoenixButton
            variant="primary"
            size="medium"
            onClick={onConfirm}
            className="flex-1"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Oui, allons-y Luna! 🚀
          </PhoenixButton>
          <PhoenixButton
            variant="ghost"
            size="medium"
            onClick={onCancel}
            className="flex-1"
          >
            Peut-être plus tard
          </PhoenixButton>
        </div>
      </div>
    </div>
  );
}