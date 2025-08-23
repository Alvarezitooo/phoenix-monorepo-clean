import React, { ReactNode } from 'react';
import { ExternalLink, Clock, Moon, Zap } from 'lucide-react';
import PhoenixButton from './PhoenixButton';
import { redirectToService } from '../services/api';

interface AppCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  description: string;
  status: 'available' | 'coming-soon';
  url?: string;
  stats: string;
  lunaFeature?: string;
  energyCost?: number;
  serviceKey?: 'letters' | 'cv' | 'luna-hub'; // Clé pour redirection
}

export default function AppCard({ icon, title, subtitle, description, status, url, stats, lunaFeature, energyCost, serviceKey }: AppCardProps) {
  const isAvailable = status === 'available';

  const handleServiceRedirect = () => {
    if (serviceKey && isAvailable) {
      redirectToService(serviceKey);
    }
  };

  return (
    <div className={`relative p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${
      isAvailable 
        ? 'bg-gradient-to-br from-white to-orange-50 border-orange-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/10' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
    }`}>
      
      {!isAvailable && (
        <div className="absolute top-4 right-4">
          <div className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Luna arrive</span>
          </div>
        </div>
      )}

      <div className={`flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
        isAvailable 
          ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-500' 
          : 'bg-slate-200 text-slate-500'
      }`}>
        {icon}
      </div>

      <div className="mb-4">
        <h3 className={`text-xl font-bold ${
          isAvailable ? 'text-slate-800' : 'text-slate-500'
        }`}>
          {title}
        </h3>
        {subtitle && (
          <div className="flex items-center space-x-1 mt-1">
            <Moon className="h-4 w-4 text-indigo-500" />
            <span className="text-sm text-indigo-600 font-medium">{subtitle}</span>
          </div>
        )}
      </div>
      
      <p className={`text-sm mb-4 ${
        isAvailable ? 'text-slate-800' : 'text-slate-500'
      }`}>
        {description}
      </p>

      {lunaFeature && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mb-4 border border-indigo-200">
          <div className="flex items-center space-x-2 mb-1">
            <Moon className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600">Avec Luna :</span>
          </div>
          <p className="text-xs text-indigo-600 italic">{lunaFeature}</p>
        </div>
      )}
      
      <div className={`text-xs mb-6 ${
        isAvailable ? 'text-slate-600' : 'text-slate-400'
      }`}>
        {stats}
      </div>

      {isAvailable ? (
        <div className="space-y-3">
          <PhoenixButton 
            variant="primary" 
            size="small" 
            icon={<ExternalLink className="h-4 w-4" />}
            energyCost={energyCost}
            className="w-full"
            onClick={handleServiceRedirect}
          >
            Continuer avec Luna
          </PhoenixButton>
          {url && (
            <div className="text-xs text-slate-500 text-center">
              {url}
            </div>
          )}
        </div>
      ) : (
        <PhoenixButton 
          variant="ghost" 
          size="small" 
          disabled
          className="w-full"
        >
          Luna arrive bientôt
        </PhoenixButton>
      )}
    </div>
  );
}