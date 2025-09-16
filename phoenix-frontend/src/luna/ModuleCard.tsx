import React from 'react';
import { useLuna } from './LunaContext';
import { useNavigate } from 'react-router-dom';

interface ModuleCardProps {
  name: string;
  description: string;
  icon: string;
  color: 'purple' | 'cyan' | 'orange' | 'green';
  path: string;
  badge?: string;
  energyCost?: number;
}

const colorClasses = {
  purple: {
    gradient: 'from-purple-500 to-indigo-600',
    bg: 'from-purple-50 to-indigo-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'bg-purple-100'
  },
  cyan: {
    gradient: 'from-cyan-500 to-blue-600',
    bg: 'from-cyan-50 to-blue-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: 'bg-cyan-100'
  },
  orange: {
    gradient: 'from-orange-500 to-red-600',
    bg: 'from-orange-50 to-red-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: 'bg-orange-100'
  },
  green: {
    gradient: 'from-emerald-500 to-green-600',
    bg: 'from-emerald-50 to-green-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: 'bg-emerald-100'
  }
};

export default function ModuleCard({ 
  name, 
  description, 
  icon, 
  color, 
  path, 
  badge,
  energyCost = 0 
}: ModuleCardProps) {
  const luna = useLuna();
  const navigate = useNavigate();
  const colors = colorClasses[color];

  const handleModuleClick = () => {
    navigate(path);
  };

  return (
    <div 
      onClick={handleModuleClick}
      className={`relative group cursor-pointer bg-gradient-to-br ${colors.bg} rounded-2xl p-6 border ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
    >
      {/* Badge si nouveau */}
      {badge && (
        <div className={`absolute -top-2 -right-2 bg-gradient-to-r ${colors.gradient} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse`}>
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className={`${colors.icon} rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto text-2xl group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>

      {/* Content */}
      <div className="text-center">
        <h3 className={`text-xl font-bold ${colors.text} mb-2`}>
          Luna {name}
        </h3>
        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
          {description}
        </p>

        {/* Energy Cost */}
        {energyCost > 0 && (
          <div className="flex items-center justify-center space-x-1 text-xs text-slate-500">
            <span>⚡</span>
            <span>{energyCost}% énergie</span>
          </div>
        )}

        {/* Hover effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
      </div>

      {/* Luna Context Integration */}
      {luna.authenticatedUser && (
        <div className="absolute top-2 left-2 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" 
             title="Luna active" />
      )}
    </div>
  );
}