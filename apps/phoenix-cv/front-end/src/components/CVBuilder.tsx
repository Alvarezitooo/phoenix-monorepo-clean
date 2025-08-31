import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LunaInteractionPoint, useLuna } from './Luna';
import { CVProvider, useCV } from '../contexts/CVContext';
import { 
  FileText, 
  Zap, 
  Download, 
  Eye, 
  Settings, 
  Plus,
  Brain,
  Sparkles,
  BarChart3,
  Save,
  Upload
} from 'lucide-react';
import { CVPreview } from './CVPreview';
import { CVEditor } from './CVEditor';
import { AIOptimizer } from './AIOptimizer';

// Composant interne pour utiliser le contexte CV
function CVBuilderContent() {
  const { cvData, exportCV } = useCV();
  const [atsScore, setAtsScore] = useState(87);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCV = async () => {
    setIsExporting(true);
    try {
      const data = exportCV();
      // Ici vous pouvez ajouter la logique d'export (PDF, etc.)
      console.log('Exporting CV:', data);
      
      // Simulation d'export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Implémenter l'export réel vers Backend CV
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

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
          <p className="text-gray-400 mt-2">
            Créez votre CV parfait avec synchronisation temps réel
            <span className="ml-2 text-xs text-luna-400">
              Dernière modif: {cvData.lastModified.toLocaleTimeString()}
            </span>
          </p>
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
            onClick={handleExportCV}
            disabled={isExporting}
            className="flex items-center space-x-2 px-6 py-3 bg-phoenix-gradient rounded-xl font-medium text-white shadow-lg hover:shadow-phoenix-500/25 disabled:opacity-50"
            aria-label="Exporter le CV en PDF"
          >
            {isExporting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Export...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Export CV</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Layout Éditeur + Aperçu Synchronisé */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Éditeur */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <FileText className="w-6 h-6 text-luna-400" />
              <span>Éditeur</span>
            </h2>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all"
                aria-label="Sauvegarder les modifications"
              >
                <Save className="w-4 h-4" />
                <span>Sauvegarder</span>
              </motion.button>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-[calc(100vh-300px)] overflow-y-auto">
            <CVEditor />
          </div>
        </div>

        {/* Aperçu */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Eye className="w-6 h-6 text-emerald-400" />
              <span>Aperçu Temps Réel</span>
            </h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>Synchronisé</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-[calc(100vh-300px)] overflow-y-auto">
            <CVPreview />
          </div>
        </div>
      </div>

      {/* AI Optimizer Panel (Collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Optimisation IA</h3>
            <div className="flex-1"></div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-gradient rounded-lg font-medium text-white text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Optimiser avec IA</span>
            </motion.button>
          </div>
          <AIOptimizer />
        </div>
      </motion.div>
    </div>
  );
}

// Composant principal avec Provider
export function CVBuilder() {
  return (
    <CVProvider>
      <CVBuilderContent />
    </CVProvider>
  );
}