import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Users, Target, Sparkles } from 'lucide-react';

export function AIInsights() {
  const insights = [
    {
      title: "Performance de votre CV",
      value: "89%",
      change: "+12%",
      description: "Score de compatibilité ATS amélioré cette semaine",
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "Classement Industrie",
      value: "#47",
      change: "↑23",
      description: "Parmi les développeurs de votre région",
      icon: Users,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Potentiel de Match",
      value: "94%",
      change: "+8%",
      description: "Pour vos postes cibles ce mois-ci",
      icon: Target,
      color: "from-cyan-500 to-blue-600"
    }
  ];

  const recommendations = [
    "Ajoutez 3 compétences techniques pour booster votre score ATS",
    "Quantifiez vos réalisations dans la section expérience", 
    "Mettez à jour votre résumé avec des mots-clés industrie",
    "Considérez ajouter une section certifications"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* AI Insights Cards */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Analyses Luna IA</h3>
            <p className="text-gray-400 text-sm">Propulsé par l'analyse avancée</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${insight.color}`}>
                  <insight.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-emerald-400 text-sm font-medium">{insight.change}</span>
              </div>
              
              <div className="text-3xl font-bold text-white mb-2">{insight.value}</div>
              <div className="text-sm text-gray-400">{insight.title}</div>
              <div className="text-xs text-gray-500 mt-2">{insight.description}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Recommandations Luna</h3>
            <p className="text-gray-400 text-sm">Personnalisées pour vous</p>
          </div>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
            >
              <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-300 leading-relaxed">{rec}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
        >
          Apply All Recommendations
        </motion.button>
      </motion.div>
    </div>
  );
}