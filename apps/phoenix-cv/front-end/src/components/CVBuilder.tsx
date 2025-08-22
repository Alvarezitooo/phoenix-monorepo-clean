import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LunaInteractionPoint, useLuna } from './Luna';
import { 
  FileText, 
  Zap, 
  Download, 
  Eye, 
  Settings, 
  Plus,
  Brain,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { CVPreview } from './CVPreview';
import { CVEditor } from './CVEditor';
import { AIOptimizer } from './AIOptimizer';

export function CVBuilder() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'optimize'>('edit');
  const [atsScore, setAtsScore] = useState(87);

  const tabs = [
    { id: 'edit', label: 'Editor', icon: FileText },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'optimize', label: 'AI Optimize', icon: Brain },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-4xl font-bold bg-phoenix-luna-gradient bg-clip-text text-transparent">
              AI CV Builder
            </h1>
            <LunaInteractionPoint
              tooltipText="Luna peut vous aider à optimiser votre CV"
              variant="prominent"
            />
          </div>
          <p className="text-gray-400 mt-2">Create your perfect CV with AI-powered assistance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl"
          >
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">ATS Score: {atsScore}%</span>
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-6 py-3 bg-phoenix-gradient rounded-xl font-medium text-white shadow-lg hover:shadow-phoenix-500/25"
          >
            <Download className="w-5 h-5" />
            <span>Export CV</span>
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 flex-1 justify-center relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-luna-gradient bg-opacity-20 rounded-xl border border-luna-500/30"
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="font-medium relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'edit' && <CVEditor />}
            {activeTab === 'preview' && <CVPreview />}
            {activeTab === 'optimize' && <AIOptimizer onScoreUpdate={setAtsScore} />}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-luna-400" />
              Quick Actions
              <LunaInteractionPoint
                tooltipText="Demandez à Luna des suggestions d'actions"
                variant="subtle"
                position="right"
              />
            </h3>
            
            <div className="space-y-3">
              {[
                'Add new section',
                'Import LinkedIn',
                'Spell check',
                'Optimize keywords'
              ].map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-gray-300 hover:text-white border border-white/5 hover:border-white/20"
                >
                  {action}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* AI Suggestions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-luna-400" />
              AI Suggestions
              <LunaInteractionPoint
                tooltipText="Luna peut personnaliser ces suggestions"
                variant="subtle"
                position="right"
              />
            </h3>
            
            <div className="space-y-4">
              {[
                {
                  type: 'Improve',
                  text: 'Add quantified achievements to your experience section',
                  priority: 'high'
                },
                {
                  type: 'Missing',
                  text: 'Include relevant technical skills',
                  priority: 'medium'
                },
                {
                  type: 'Optimize',
                  text: 'Enhance summary with keywords',
                  priority: 'low'
                }
              ].map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="p-3 rounded-lg bg-gradient-to-r from-white/5 to-white/10 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      suggestion.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {suggestion.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{suggestion.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}