import React from 'react';
import { motion } from 'framer-motion';
import { LunaInteractionPoint, useLuna } from './Luna';
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
import { Link } from 'react-router-dom';
import { StatsCard } from './StatsCard';
import { ActionCard } from './ActionCard';
import { AIInsights } from './AIInsights';

export function Dashboard() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const quickActions = [
    {
      title: 'AI CV Builder',
      description: 'Create your perfect CV with AI assistance',
      icon: Zap,
      color: 'from-cyan-500 to-blue-600',
      path: '/builder',
      premium: false
    },
    {
      title: 'Mirror Match',
      description: 'Match your CV to specific job requirements',
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      path: '/mirror-match',
      premium: true
    },
    {
      title: 'Template Gallery',
      description: 'Browse premium ATS-friendly templates',
      icon: FileText,
      color: 'from-emerald-500 to-teal-600',
      path: '/templates',
      premium: false
    },
    {
      title: 'Analytics Hub',
      description: 'Track your application success rate',
      icon: BarChart3,
      color: 'from-orange-500 to-red-600',
      path: '/analytics',
      premium: true
    }
  ];

  const newFeatures = [
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
  const stats = [
    { label: 'CVs Optimized', value: '12,847', icon: FileText, color: 'cyan' },
    { label: 'Success Rate', value: '94.2%', icon: TrendingUp, color: 'emerald' },
    { label: 'ATS Score Avg', value: '8.7/10', icon: Award, color: 'purple' },
    { label: 'Active Users', value: '2,341', icon: Users, color: 'orange' }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-6 py-8"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center mb-12">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-phoenix-luna-gradient bg-clip-text text-transparent"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Welcome to the Future
          </motion.h1>
          <LunaInteractionPoint
            tooltipText="Luna peut vous expliquer toutes les fonctionnalités"
            variant="prominent"
          />
        </div>
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Revolutionary AI-powered CV optimization that guarantees you land your dream job
        </motion.p>
        
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/builder">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-phoenix-gradient rounded-2xl font-semibold text-white shadow-xl shadow-phoenix-500/25 hover:shadow-phoenix-500/40 transition-all duration-300 flex items-center space-x-2"
            >
              <Rocket className="w-6 h-6" />
              <span>Start Building CV</span>
            </motion.button>
          </Link>
          
          <Link to="/mirror-match">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-luna-gradient bg-opacity-20 rounded-2xl font-semibold text-white border border-luna-500/30 backdrop-blur-sm hover:bg-luna-600/30 transition-all duration-300 flex items-center space-x-2"
            >
              <Sparkles className="w-6 h-6" />
              <span>Try Mirror Match</span>
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div variants={itemVariants} className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Quick Actions</h2>
          <LunaInteractionPoint
            tooltipText="Demandez à Luna quelle action commencer"
            variant="default"
            position="left"
          />
          <div className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">
            <span className="text-sm font-medium">View All</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <ActionCard key={index} {...action} />
          ))}
        </div>
      </motion.div>

      {/* New Features Section */}
      <motion.div variants={itemVariants} className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">🚀 Nouvelles Fonctionnalités</h2>
          <LunaInteractionPoint
            tooltipText="Luna peut vous guider dans ces nouvelles fonctionnalités"
            variant="default"
            position="left"
          />
          <div className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">
            <span className="text-sm font-medium">Découvrir</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newFeatures.map((feature, index) => (
            <ActionCard key={index} {...feature} />
          ))}
        </div>
      </motion.div>
      {/* AI Insights Section */}
      <motion.div variants={itemVariants}>
        <AIInsights />
      </motion.div>
    </motion.div>
  );
}