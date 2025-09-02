'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle, X } from 'lucide-react';

interface WhyPopoverProps {
  question: string;
  explanation: string;
  lunaNote?: string;
  className?: string;
}

// Explications contextuelles par étape (basé sur la doc)
export const WHY_EXPLANATIONS = {
  mood: {
    question: "Pourquoi je te demande ton humeur ?",
    explanation: "Pour calibrer le ton et la durée. Si tu es fatigué(e), on reste ultra-léger !",
    lunaNote: "Je m'adapte toujours à ton état. Zéro pression."
  },
  duos: {
    question: "Pourquoi ces choix binaires ?",
    explanation: "Pour identifier tes appétences naturelles : people vs data, créer vs analyser, etc.",
    lunaNote: "Pas de bonne réponse ! Juste ton style personnel."
  },
  valeurs: {
    question: "Pourquoi classer tes valeurs ?",
    explanation: "Pour écarter les métiers incompatibles et personnaliser tes prochains chapitres.",
    lunaNote: "Tes valeurs sont ton filtre personnel. Je les respecte."
  },
  taches: {
    question: "Pourquoi les tâches aimées/évitées ?",
    explanation: "Pour éviter les désajustements quotidiens. Un job génial en théorie peut être pénible au quotidien.",
    lunaNote: "Le diable est dans les détails du quotidien !"
  },
  style: {
    question: "Pourquoi ton style de travail ?",
    explanation: "Équipe vs solo, structure vs liberté... pour matcher avec les bons environnements.",
    lunaNote: "Il n'y a pas de mauvais style, juste des contextes qui te conviennent."
  },
  appetit_ia: {
    question: "Pourquoi ton appétit IA ?",
    explanation: "Pour calibrer ton plan skills et identifier les métiers qui résistent à l'automatisation.",
    lunaNote: "L'IA transforme tout. Autant être stratégique !"
  },
  contraintes: {
    question: "Pourquoi tes contraintes ?",
    explanation: "Remote, horaires, salaire... pour que mes suggestions soient réalistes pour TOI.",
    lunaNote: "Les contraintes ne sont pas des faiblesses, c'est ton cadre de vie."
  },
  risque: {
    question: "Pourquoi ta tolérance au risque ?",
    explanation: "Pour équilibrer entre pivot adjacent (sûr) et moonshot (excitant mais incertain).",
    lunaNote: "Connaître ses limites, c'est la sagesse."
  }
};

const WhyPopover: React.FC<WhyPopoverProps> = ({ 
  question, 
  explanation, 
  lunaNote,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 transition-colors text-sm"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="underline decoration-dotted">Pourquoi ?</span>
      </button>

      {/* Popover */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-10 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popover content */}
          <div className="absolute z-50 top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-purple-200 p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🌙</span>
                <h4 className="font-semibold text-purple-900 text-sm">
                  {question}
                </h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation */}
            <div className="space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {explanation}
              </p>
              
              {lunaNote && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border-l-4 border-purple-300">
                  <p className="text-sm text-purple-800 italic">
                    💭 <strong>Luna :</strong> {lunaNote}
                  </p>
                </div>
              )}
              
              {/* Footer transparence */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 flex items-center space-x-1">
                  <span>🔒</span>
                  <span>Tes réponses t'appartiennent et restent exportables</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WhyPopover;