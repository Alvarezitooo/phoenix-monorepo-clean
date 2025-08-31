/**
 * 🛡️ AuthGuard - Phoenix CV
 * Composant de protection des routes nécessitant une authentification
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, redirectToLogin } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-phoenix-gradient rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-300 text-lg">Vérification de votre session...</p>
        </motion.div>
      </div>
    );
  }

  // User is authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default authentication prompt
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-phoenix-gradient rounded-2xl flex items-center justify-center shadow-2xl shadow-phoenix-500/25">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-phoenix-luna-gradient bg-clip-text text-transparent mb-2">
            Authentification Requise
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Connectez-vous à votre compte Phoenix pour accéder à vos outils IA de création de CV
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={redirectToLogin}
          className="w-full bg-phoenix-gradient hover:shadow-lg hover:shadow-phoenix-500/25 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3"
        >
          <span>Se connecter avec Phoenix</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-sm text-gray-400">
            🌙 Accès à <strong>Luna AI</strong> • ⚡ Energy System • 🎯 Mirror Match • 📊 Analytics
          </p>
        </div>
      </motion.div>
    </div>
  );
}