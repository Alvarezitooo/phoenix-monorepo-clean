import React from 'react';
import { MessageCircle, FileText, BarChart3, Target, Sparkles } from 'lucide-react';

export default function EnergyConsumptionGuide() {
  const actions = [
    {
      type: 'simple',
      icon: MessageCircle,
      name: 'Conseil rapide personnalisé',
      cost: '5%',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      type: 'medium',
      icon: FileText,
      name: 'Lettre motivation complète',
      cost: '15%',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      type: 'complex',
      icon: BarChart3,
      name: 'Analyse CV + recommandations',
      cost: '25%',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      type: 'premium',
      icon: Target,
      name: 'Mirror Match + stratégie complète',
      cost: '30%',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h3 className="text-xl font-bold text-slate-800">Combien coûte chaque action avec Luna ?</h3>
        </div>
        <p className="text-slate-600 text-sm">Transparence totale sur votre investissement énergie</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${action.bgColor} ${action.borderColor} transition-all duration-200 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-white ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">
                    {action.name}
                  </div>
                </div>
              </div>
              <div className={`font-bold text-lg ${action.color}`}>
                {action.cost}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
        <div className="text-center">
          <div className="text-sm text-indigo-600 font-medium mb-1">
            💡 Exemple concret
          </div>
          <div className="text-xs text-indigo-600">
            Avec un <strong>Café Luna (2,99€)</strong>, vous pouvez : 20 conseils rapides OU 6-7 lettres complètes OU 4 analyses CV
          </div>
        </div>
      </div>
    </div>
  );
}