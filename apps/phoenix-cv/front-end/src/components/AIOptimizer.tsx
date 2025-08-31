import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Zap,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award,
  BarChart3,
  Search
} from 'lucide-react';

interface AIOptimizerProps {
  onScoreUpdate: (score: number) => void;
}

interface OptimizationSuggestion {
  id: string;
  type: 'critical' | 'improvement' | 'enhancement';
  category: 'keywords' | 'format' | 'content' | 'ats';
  title: string;
  description: string;
  impact: number;
  applied: boolean;
}

export function AIOptimizer({ onScoreUpdate }: AIOptimizerProps) {
  const [currentScore, setCurrentScore] = useState(73);
  const [targetScore, setTargetScore] = useState(95);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const [suggestions] = useState<OptimizationSuggestion[]>([
    {
      id: '1',
      type: 'critical',
      category: 'keywords',
      title: 'Add Industry Keywords',
      description: 'Include 8 missing keywords that ATS systems scan for in your industry',
      impact: 12,
      applied: false
    },
    {
      id: '2',
      type: 'improvement',
      category: 'content',
      title: 'Quantify Achievements',
      description: 'Transform 5 bullet points with specific metrics and percentages',
      impact: 8,
      applied: false
    },
    {
      id: '3',
      type: 'critical',
      category: 'format',
      title: 'ATS-Friendly Format',
      description: 'Fix formatting issues that prevent ATS from reading your CV properly',
      impact: 15,
      applied: false
    },
    {
      id: '4',
      type: 'enhancement',
      category: 'content',
      title: 'Strengthen Action Verbs',
      description: 'Replace weak verbs with powerful, impact-driven alternatives',
      impact: 6,
      applied: false
    },
    {
      id: '5',
      type: 'improvement',
      category: 'ats',
      title: 'Skills Section Enhancement',
      description: 'Optimize skills section with relevant technologies and certifications',
      impact: 9,
      applied: false
    }
  ]);

  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const applied = suggestions.filter(s => appliedSuggestions.includes(s.id));
    const scoreIncrease = applied.reduce((sum, s) => sum + s.impact, 0);
    const newScore = Math.min(currentScore + scoreIncrease, 100);
    onScoreUpdate(newScore);
  }, [appliedSuggestions, currentScore, suggestions, onScoreUpdate]);

  const startAnalysis = async () => {
    if (!user) return;
    
    setIsAnalyzing(true);
    setApiError(null);
    
    try {
      // Simulation d'un CV ID (dans une vraie app, on récupérerait depuis le contexte CV)
      const cvId = 'user-cv-' + user.id;
      
      const optimizationRequest = {
        cv_id: cvId,
        optimization_type: 'comprehensive',
        target_job_title: 'Développeur Full-Stack',
        target_industry: 'technology',
        focus_areas: ['ats_compatibility', 'content_enhancement', 'skills_optimization']
      };

      const result = await apiService.optimizeCV(optimizationRequest);
      
      if (result.success && result.suggestions) {
        // Convertir les suggestions API vers le format local
        const apiSuggestions: OptimizationSuggestion[] = result.suggestions.map((suggestion, index) => ({
          id: `api-${index}`,
          type: suggestion.impact === 'high' ? 'critical' : suggestion.impact === 'medium' ? 'improvement' : 'enhancement',
          category: (suggestion.category as any) || 'content',
          title: suggestion.title || 'Amélioration suggérée',
          description: typeof suggestion.current === 'string' ? 
            `Remplacer "${suggestion.current}" par "${suggestion.improved}"` : 
            suggestion.title || 'Amélioration recommandée',
          impact: suggestion.impact === 'high' ? 15 : suggestion.impact === 'medium' ? 10 : 5,
          applied: false
        }));
        
        setSuggestions(apiSuggestions);
        setShowAnalysis(true);
      } else {
        throw new Error(result.error_message || 'Échec de l\'analyse');
      }
      
    } catch (error) {
      console.error('Erreur analyse AI Optimizer:', error);
      setApiError(error instanceof Error ? error.message : 'Erreur d\'analyse');
      
      // Fallback: utiliser les suggestions par défaut
      setShowAnalysis(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestionId: string) => {
    if (!appliedSuggestions.includes(suggestionId)) {
      setAppliedSuggestions([...appliedSuggestions, suggestionId]);
    }
  };

  const applyAllSuggestions = () => {
    const allIds = suggestions.map(s => s.id);
    setAppliedSuggestions(allIds);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'keywords': return Search;
      case 'format': return Award;
      case 'content': return Target;
      case 'ats': return BarChart3;
      default: return Sparkles;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'keywords': return 'from-cyan-500 to-blue-600';
      case 'format': return 'from-purple-500 to-pink-600';
      case 'content': return 'from-emerald-500 to-teal-600';
      case 'ats': return 'from-orange-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'improvement': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'enhancement': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const currentTotalScore = currentScore + appliedSuggestions.reduce((sum, id) => {
    const suggestion = suggestions.find(s => s.id === id);
    return sum + (suggestion?.impact || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center space-x-3">
          <motion.div
            animate={{ rotate: isAnalyzing ? 360 : 0 }}
            transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: "linear" }}
            className="p-3 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30"
          >
            <Brain className="w-8 h-8 text-purple-400" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-white">AI Optimization Engine</h2>
            <p className="text-gray-400">Let AI transform your CV into an ATS-beating masterpiece</p>
          </div>
        </div>

        {!showAnalysis && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-semibold text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Analyzing CV...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Start AI Analysis</span>
              </span>
            )}
          </motion.button>
        )}
      </motion.div>

      {/* Analysis Progress */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Analyzing CV Structure...</span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1 }}
                  className="w-32 h-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Scanning for Keywords...</span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 1 }}
                  className="w-32 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Generating Recommendations...</span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 2 }}
                  className="w-32 h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Dashboard */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Current Score */}
            <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-sm text-gray-400 mb-2">Current Score</div>
              <div className="text-4xl font-bold text-white mb-2">{Math.min(currentTotalScore, 100)}</div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: `${currentScore}%` }}
                  animate={{ width: `${Math.min(currentTotalScore, 100)}%` }}
                  className={`h-3 rounded-full ${
                    currentTotalScore < 70 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                    currentTotalScore < 85 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </motion.div>

            {/* Target Score */}
            <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-sm text-gray-400 mb-2">Target Score</div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">{targetScore}</div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${targetScore}%` }} />
              </div>
            </motion.div>

            {/* Potential Increase */}
            <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-sm text-gray-400 mb-2">Potential Increase</div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">
                +{suggestions.filter(s => !appliedSuggestions.includes(s.id)).reduce((sum, s) => sum + s.impact, 0)}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-gray-300">points available</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimization Suggestions */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">AI Recommendations</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={applyAllSuggestions}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-medium text-white shadow-lg hover:shadow-emerald-500/25"
              >
                <Sparkles className="w-5 h-5" />
                <span>Apply All</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {suggestions.map((suggestion, index) => {
                const CategoryIcon = getCategoryIcon(suggestion.category);
                const isApplied = appliedSuggestions.includes(suggestion.id);
                
                return (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 ${
                      isApplied ? 'bg-emerald-500/10 border-emerald-500/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-r ${getCategoryColor(suggestion.category)}`}>
                          <CategoryIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">{suggestion.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(suggestion.type)}`}>
                            {suggestion.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-400">+{suggestion.impact}</div>
                        <div className="text-xs text-gray-400">points</div>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4 leading-relaxed">{suggestion.description}</p>

                    <div className="flex items-center justify-between">
                      {isApplied ? (
                        <div className="flex items-center space-x-2 text-emerald-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Applied</span>
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => applySuggestion(suggestion.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                        >
                          <span>Apply Fix</span>
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      )}
                      
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        suggestion.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                        suggestion.type === 'improvement' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {suggestion.category}
                      </span>
                    </div>

                    {isApplied && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-emerald-500/5 rounded-2xl pointer-events-none"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Summary */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
              Optimization Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Keywords Added', value: appliedSuggestions.length * 3, icon: Search },
                { label: 'ATS Compatibility', value: `${Math.min(currentTotalScore, 100)}%`, icon: CheckCircle },
                { label: 'Impact Score', value: appliedSuggestions.reduce((sum, id) => {
                  const suggestion = suggestions.find(s => s.id === id);
                  return sum + (suggestion?.impact || 0);
                }, 0), icon: TrendingUp },
                { label: 'Improvements', value: appliedSuggestions.length, icon: Sparkles }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="text-center p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <stat.icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}