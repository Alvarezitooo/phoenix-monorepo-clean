/**
 * 🌐 Phoenix Navigation - Inter-Services
 * Header unifié pour navigation entre toutes les apps Phoenix
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  FileText, 
  Target, 
  ChevronDown, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface PhoenixApp {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ComponentType<any>;
  color: string;
  available: boolean;
  current?: boolean;
}

export function PhoenixNavigation() {
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);

  const phoenixApps: PhoenixApp[] = [
    {
      id: 'website',
      name: 'Phoenix Hub',
      description: 'Centre de contrôle Luna',
      url: 'https://phoenix-website-production.up.railway.app',
      icon: Home,
      color: 'from-purple-500 to-blue-600',
      available: true
    },
    {
      id: 'cv',
      name: 'Phoenix CV',
      description: 'Optimisation CV avec IA',
      url: 'https://phoenix-cv-production.up.railway.app',
      icon: Target,
      color: 'from-cyan-500 to-blue-600',
      available: true,
      current: true
    },
    {
      id: 'letters',
      name: 'Phoenix Letters',
      description: 'Lettres de motivation IA',
      url: 'https://phoenix-letters-production.up.railway.app',
      icon: FileText,
      color: 'from-green-500 to-teal-600',
      available: true
    }
  ];

  const currentApp = phoenixApps.find(app => app.current);

  const handleAppNavigation = (app: PhoenixApp) => {
    if (app.current) return;
    
    // 🔐 Plus de token URL - Cookies HTTPOnly cross-domain
    const targetUrl = app.url;
    
    window.location.href = targetUrl;
  };

  return (
    <div className="relative">
      {/* Apps Navigation Dropdown */}
      <div className="relative">
        <motion.button
          onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-300"
        >
          {currentApp && (
            <>
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${currentApp.color} flex items-center justify-center`}>
                <currentApp.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium hidden md:block">{currentApp.name}</span>
            </>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${isAppMenuOpen ? 'rotate-180' : ''}`} />
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isAppMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full left-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden z-50"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-gray-700/50">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">Écosystème Phoenix</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">Naviguez entre vos outils IA</p>
              </div>

              {/* Apps List */}
              <div className="py-2">
                {phoenixApps.map((app) => (
                  <motion.button
                    key={app.id}
                    onClick={() => handleAppNavigation(app)}
                    disabled={!app.available}
                    whileHover={{ x: 4 }}
                    className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/5 transition-all duration-200 ${
                      app.current ? 'bg-white/5 border-r-2 border-blue-500' : ''
                    } ${!app.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${app.color} flex items-center justify-center flex-shrink-0`}>
                      <app.icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{app.name}</span>
                        {app.current && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">Actuel</span>
                        )}
                        {!app.current && app.available && (
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{app.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50">
                <p className="text-gray-400 text-xs text-center">
                  🌙 Powered by Luna AI • Votre progression est synchronisée
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close */}
      {isAppMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsAppMenuOpen(false)}
        />
      )}
    </div>
  );
}