import { useState } from 'react';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  FileText, 
  Sparkles, 
  ChevronRight,
  BarChart3,
  Users,
  Award,
  Rocket,
  DollarSign,
  Linkedin,
  Eye
} from 'lucide-react';

interface ActionCard {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  path: string;
  premium: boolean;
}

export default function CVPage() {
  const [stats] = useState([
    { label: 'CVs Optimized', value: '1,247', icon: FileText, color: 'text-cyan-400' },
    { label: 'Success Rate', value: '94.2%', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'ATS Score Avg', value: '8.7/10', icon: Award, color: 'text-purple-400' },
    { label: 'Active Users', value: '341', icon: Users, color: 'text-orange-400' }
  ]);

  const quickActions: ActionCard[] = [
    {
      title: 'Constructeur CV IA',
      description: 'Créez votre CV parfait avec l\'assistance IA',
      icon: Zap,
      color: 'from-cyan-500 to-blue-600',
      path: '/builder',
      premium: false
    },
    {
      title: 'Mirror Match',
      description: 'Adaptez votre CV aux exigences spécifiques d\'emploi',
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      path: '/mirror-match',
      premium: true
    },
    {
      title: 'Galerie de Modèles',
      description: 'Parcourez les modèles premium compatibles ATS',
      icon: FileText,
      color: 'from-emerald-500 to-teal-600',
      path: '/templates',
      premium: false
    },
    {
      title: 'Hub Analytics',
      description: 'Suivez votre taux de réussite des candidatures',
      icon: BarChart3,
      color: 'from-orange-500 to-red-600',
      path: '/analytics',
      premium: true
    }
  ];

  const newFeatures: ActionCard[] = [
    {
      title: 'Suggestions de Salaire IA',
      description: 'Découvrez votre valeur sur le marché avec l\'IA',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      path: '/salary',
      premium: false
    },
    {
      title: 'Intégration LinkedIn',
      description: 'Importez vos données LinkedIn automatiquement',
      icon: Linkedin,
      color: 'from-blue-500 to-cyan-600',
      path: '/linkedin',
      premium: false
    },
    {
      title: 'Prévisualisation Multi-Format',
      description: 'Voir votre CV en PDF, Word et Web simultanément',
      icon: Eye,
      color: 'from-purple-500 to-pink-600',
      path: '/preview',
      premium: true
    }
  ];

  const ActionCard = ({ action }: { action: ActionCard }) => (
    <div className="relative group cursor-pointer">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-full hover:border-gray-600 transition-all duration-300 hover:scale-105">
        <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <action.icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
          {action.title}
        </h3>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
          {action.description}
        </p>
        {action.premium && (
          <div className="absolute top-4 right-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
              PRO
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-6">
          Welcome to the Future
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Revolutionary AI-powered CV optimization that guarantees you land your dream job
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105">
            <Rocket className="w-6 h-6" />
            <span>Start Building CV</span>
          </button>
          
          <button className="px-8 py-4 bg-gray-800/50 rounded-2xl font-semibold text-white border border-purple-500/30 backdrop-blur-sm hover:bg-purple-600/20 transition-all duration-300 flex items-center justify-center space-x-2">
            <Sparkles className="w-6 h-6" />
            <span>Try Mirror Match</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={stat.color}>
                <stat.icon className="w-8 h-8" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Quick Actions</h2>
          <div className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">
            <span className="text-sm font-medium">View All</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <ActionCard key={index} action={action} />
          ))}
        </div>
      </div>

      {/* New Features Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center">
            🚀 <span className="ml-2">Nouvelles Fonctionnalités</span>
          </h2>
          <div className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">
            <span className="text-sm font-medium">Découvrir</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newFeatures.map((feature, index) => (
            <ActionCard key={index} action={feature} />
          ))}
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
          AI Insights & Recommendations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-3">Market Trends</h4>
            <p className="text-gray-300 text-sm mb-4">
              Based on current job market analysis, UX/UI roles are showing 23% growth this quarter.
            </p>
            <div className="flex items-center text-emerald-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm">+23% growth</span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-3">Skills Recommendation</h4>
            <p className="text-gray-300 text-sm mb-4">
              Consider adding React, TypeScript, and Figma to match 89% of open positions.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">React</span>
              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">TypeScript</span>
              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">Figma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
