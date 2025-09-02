'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Smile, Meh, Frown, ArrowRight, Users, Database, Palette, BarChart, Heart, Briefcase, Monitor, Globe } from 'lucide-react';
import WhyPopover, { WHY_EXPLANATIONS } from './WhyPopover';

// Types pour les micro-exercices
interface MoodCheckProps {
  onResponse: (mood: string, timeAvailable: string) => void;
  className?: string;
}

interface DuoEclairProps {
  onResponse: (duos: Record<string, string>) => void;
  className?: string;
}

interface TerritoryCardsProps {
  onResponse: (territories: string[]) => void;
  className?: string;
}

// 🌙 Micro-Exercise 1: Humeur & Temps (état du jour)
const MoodCheck: React.FC<MoodCheckProps> = ({ onResponse, className }) => {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const moods = [
    { id: 'energise', label: 'Énergisé(e)', icon: Smile, color: 'text-green-600', bg: 'bg-green-100' },
    { id: 'neutre', label: 'Neutre', icon: Meh, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { id: 'fatigue', label: 'Fatigué(e)', icon: Frown, color: 'text-red-600', bg: 'bg-red-100' }
  ];

  const timeOptions = [
    { id: '60s', label: '60 secondes', desc: 'Ultra-rapide' },
    { id: '3min', label: '3 minutes', desc: 'Court mais complet' },
    { id: 'plus_tard', label: 'Plus tard', desc: 'Je garde ma progression' }
  ];

  const handleContinue = () => {
    if (selectedMood && selectedTime) {
      onResponse(selectedMood, selectedTime);
    }
  };

  return (
    <div className={cn("bg-white rounded-xl p-6 border border-purple-100 shadow-lg", className)}>
      {/* Header avec Luna */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🌙</span>
          <h3 className="text-lg font-semibold text-purple-900">
            Pour m'adapter à toi...
          </h3>
        </div>
        <WhyPopover 
          question={WHY_EXPLANATIONS.mood.question}
          explanation={WHY_EXPLANATIONS.mood.explanation}
          lunaNote={WHY_EXPLANATIONS.mood.lunaNote}
        />
      </div>

      <div className="space-y-6">
        {/* Humeur du moment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Comment tu te sens <em>là maintenant</em> ?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                  selectedMood === mood.id
                    ? `${mood.bg} border-purple-300 shadow-md`
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <mood.icon className={cn("w-8 h-8 mx-auto mb-2", mood.color)} />
                <span className="text-sm font-medium text-gray-800">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Temps disponible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tu as combien de temps ?
          </label>
          <div className="space-y-2">
            {timeOptions.map((time) => (
              <button
                key={time.id}
                onClick={() => setSelectedTime(time.id)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-sm",
                  selectedTime === time.id
                    ? "bg-purple-50 border-purple-300 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-800">{time.label}</span>
                    <span className="text-sm text-gray-600 ml-2">{time.desc}</span>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Continue button */}
        {selectedMood && selectedTime && (
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>3 choix rapides, prêt(e) ?</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// 🌙 Micro-Exercise 2: Duos éclair (ce qui t'énergise)
const DuoEclair: React.FC<DuoEclairProps> = ({ onResponse, className }) => {
  const [selections, setSelections] = useState<Record<string, string>>({});

  const duos = [
    {
      id: 'people_data',
      label: 'Ce qui t\'énergise le plus',
      options: [
        { id: 'people', label: 'Interactions humaines', icon: Users, color: 'text-blue-600' },
        { id: 'data', label: 'Données & analyse', icon: Database, color: 'text-green-600' }
      ]
    },
    {
      id: 'create_analyze',  
      label: 'Ton mode naturel',
      options: [
        { id: 'create', label: 'Créer du nouveau', icon: Palette, color: 'text-purple-600' },
        { id: 'analyze', label: 'Analyser l\'existant', icon: BarChart, color: 'text-orange-600' }
      ]
    },
    {
      id: 'impact_craft',
      label: 'Ce qui te motive',
      options: [
        { id: 'impact', label: 'Impact sur les autres', icon: Heart, color: 'text-red-600' },
        { id: 'craft', label: 'Excellence technique', icon: Monitor, color: 'text-indigo-600' }
      ]
    }
  ];

  const handleSelection = (duoId: string, choice: string) => {
    const newSelections = { ...selections, [duoId]: choice };
    setSelections(newSelections);
    
    // Si tous les duos sont complétés, envoyer automatiquement
    if (Object.keys(newSelections).length === duos.length) {
      setTimeout(() => onResponse(newSelections), 500);
    }
  };

  return (
    <div className={cn("bg-white rounded-xl p-6 border border-purple-100 shadow-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🌙</span>
          <h3 className="text-lg font-semibold text-purple-900">
            Duos éclair
          </h3>
        </div>
        <WhyPopover 
          question={WHY_EXPLANATIONS.duos.question}
          explanation={WHY_EXPLANATIONS.duos.explanation}
          lunaNote={WHY_EXPLANATIONS.duos.lunaNote}
        />
      </div>

      <div className="space-y-6">
        {duos.map((duo, index) => (
          <div key={duo.id}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {duo.label}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {duo.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelection(duo.id, option.id)}
                  className={cn(
                    "p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                    selections[duo.id] === option.id
                      ? "bg-purple-50 border-purple-300 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <option.icon className={cn("w-6 h-6 mx-auto mb-2", option.color)} />
                  <span className="text-sm font-medium text-gray-800">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2">
          {duos.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                Object.keys(selections).length > index ? "bg-purple-500" : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// 🌙 Micro-Exercise 3: Territoires (domaines qui t'attirent)
const TerritoryCards: React.FC<TerritoryCardsProps> = ({ onResponse, className }) => {
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);

  const territories = [
    { id: 'design_humain', label: 'Design humain', desc: 'UX, produit, service design', icon: Users, color: 'text-blue-600' },
    { id: 'produit_data', label: 'Produit data', desc: 'Analytics, insights, décision', icon: BarChart, color: 'text-green-600' },
    { id: 'ops_organisation', label: 'Ops & organisation', desc: 'Process, efficacité, systèmes', icon: Briefcase, color: 'text-purple-600' },
    { id: 'tech_innovation', label: 'Tech & innovation', desc: 'Dev, IA, nouvelles technos', icon: Monitor, color: 'text-indigo-600' },
    { id: 'business_strategy', label: 'Business & stratégie', desc: 'Croissance, partenariats', icon: Globe, color: 'text-orange-600' }
  ];

  const toggleTerritory = (territoryId: string) => {
    setSelectedTerritories(prev => {
      const newSelection = prev.includes(territoryId)
        ? prev.filter(id => id !== territoryId)
        : [...prev, territoryId];
      
      // Auto-submit si 2-3 sélections (sweet spot)
      if (newSelection.length >= 2) {
        setTimeout(() => onResponse(newSelection), 800);
      }
      
      return newSelection;
    });
  };

  return (
    <div className={cn("bg-white rounded-xl p-6 border border-purple-100 shadow-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🌙</span>
          <h3 className="text-lg font-semibold text-purple-900">
            Territoires qui t'attirent
          </h3>
        </div>
        <WhyPopover 
          question="Pourquoi ces territoires ?"
          explanation="Pour identifier les domaines où tu pourrais t'épanouir naturellement."
          lunaNote="Choisis 2-3 max. On affine après !"
        />
      </div>

      <div className="space-y-3">
        {territories.map((territory) => (
          <button
            key={territory.id}
            onClick={() => toggleTerritory(territory.id)}
            className={cn(
              "w-full p-4 rounded-lg border text-left transition-all duration-200 hover:shadow-md",
              selectedTerritories.includes(territory.id)
                ? "bg-purple-50 border-purple-300 shadow-md"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-center space-x-3">
              <territory.icon className={cn("w-6 h-6", territory.color)} />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{territory.label}</div>
                <div className="text-sm text-gray-600">{territory.desc}</div>
              </div>
              {selectedTerritories.includes(territory.id) && (
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          </button>
        ))}

        {/* Indicator */}
        {selectedTerritories.length > 0 && (
          <div className="text-center py-2">
            <span className="text-sm text-purple-600">
              {selectedTerritories.length} territoire{selectedTerritories.length > 1 ? 's' : ''} sélectionné{selectedTerritories.length > 1 ? 's' : ''}
              {selectedTerritories.length >= 2 && ' 🎯'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export { MoodCheck, DuoEclair, TerritoryCards };