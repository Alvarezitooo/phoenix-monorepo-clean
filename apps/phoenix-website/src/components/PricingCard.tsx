import React from 'react';
import { Check, Crown, Zap, Moon, Calendar, Coffee, Croissant, Pizza, Gift, MessageCircle, FileText, BarChart3, Target } from 'lucide-react';
import PhoenixButton from './PhoenixButton';

interface EnergyOption {
  type: string;
  icon: React.ComponentType<any>;
  name: string;
  price: number;
  energy: string;
  description: string;
  actions: string[];
  popular?: boolean;
  subscription?: boolean;
  bestDeal?: boolean;
}

interface PricingCardProps {
  type: 'founders' | 'energie';
  badge?: string;
  title: string;
  subtitle?: string;
  price?: string;
  features?: string[];
  energyOptions?: EnergyOption[];
  valueMessage?: string;
  cta?: string;
  highlight?: boolean;
}

export default function PricingCard({ 
  type, 
  badge, 
  title, 
  subtitle, 
  price, 
  features, 
  energyOptions, 
  valueMessage, 
  cta, 
  highlight 
}: PricingCardProps) {
  return (
    <div className={`relative p-8 rounded-3xl border transition-all duration-300 hover:scale-105 ${
      highlight 
        ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300 shadow-lg shadow-orange-500/10' 
        : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'
    }`}>
      
      {badge && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-1">
            <Crown className="h-3 w-3" />
            <span>{badge}</span>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
        {subtitle && <p className="text-slate-600 text-sm mb-4">{subtitle}</p>}
        
        {price && (
          <div className="text-4xl font-bold text-orange-400 mb-2">
          <div className="text-4xl font-bold text-indigo-600 mb-2">
            {price}
          </div>
          </div>
        )}
      </div>

      {type === 'founders' && features && (
        <div className="space-y-4 mb-8">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-slate-300">{feature}</span>
              <span className="text-slate-600">{feature}</span>
            </div>
          ))}
        </div>
      )}

      {type === 'energie' && energyOptions && (
        <div className="space-y-4 mb-8">
          {energyOptions.map((option, idx) => (
            <div key={idx} className={`relative p-4 rounded-xl border transition-all duration-200 hover:scale-105 cursor-pointer ${
              option.popular
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-400/30'
                : option.bestDeal
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-400/30'
                : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
            }`}>
              
              {(option.popular || option.bestDeal) && (
                <div className="absolute -top-2 -right-2">
                  <div className={`text-white px-2 py-1 rounded-full text-xs font-bold ${
                    option.popular 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                  }`}>
                    {option.popular ? 'POPULAIRE' : 'MEILLEUR DEAL'}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <option.icon className={`h-5 w-5 ${
                    option.subscription ? 'text-indigo-500' : 
                    option.bestDeal ? 'text-emerald-500' :
                    option.popular ? 'text-purple-500' : 'text-orange-500'
                  }`} />
                  <div>
                    <div className="font-semibold text-slate-800">
                      {option.name}
                    </div>
                    <div className="text-xs text-slate-500">{option.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-indigo-600">
                    {option.price}€
                  </div>
                  <div className="text-xs text-slate-500">
                    {option.subscription ? '/mois' : option.energy}
                  </div>
                </div>
              </div>
              
              {/* Actions possibles */}
              <div className="space-y-1">
                {option.actions.map((action, actionIdx) => (
                  <div key={actionIdx} className="text-xs text-slate-600 flex items-center space-x-1">
                    <span className="text-indigo-400">✨</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
              
              {/* Bonus premier achat pour Café */}
              {option.type === 'cafe' && (
                <div className="mt-3 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-lg p-2 border border-emerald-200">
                  <div className="flex items-center space-x-1 text-emerald-600">
                    <Gift className="h-3 w-3" />
                    <span className="text-xs font-medium">+10% bonus pour votre première collaboration !</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {valueMessage && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-8 border border-indigo-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-indigo-600">Votre investissement :</span>
          </div>
          <div className="text-sm text-indigo-600 text-center font-medium">{valueMessage}</div>
        </div>
      )}

      <PhoenixButton 
        variant={highlight ? "primary" : "secondary"} 
        size="medium"
        icon={type === 'founders' ? <Crown className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        className="w-full"
      >
        {cta || "Choisir ce pack"}
      </PhoenixButton>
    </div>
  );
}