/**
 * 🛡️ Error Boundary - Phoenix CV
 * Composant pour capturer et gérer les erreurs React
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to error tracking service (Sentry, etc.)
    this.logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // TODO: Implement error logging service
    console.log('Logging error to service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full text-center"
          >
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-gradient rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/25">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Oups ! Une erreur est survenue
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Phoenix CV a rencontré un problème inattendu. Nous nous excusons pour la gêne occasionnée.
              </p>
            </div>

            {/* Error details (dev mode) */}
            {import.meta.env.DEV && this.state.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left"
              >
                <h3 className="text-red-400 font-semibold mb-2 flex items-center">
                  <Bug className="w-4 h-4 mr-2" />
                  Détails techniques (mode dev)
                </h3>
                <p className="text-red-300 text-sm font-mono break-all">
                  {this.state.error.message}
                </p>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReload}
                className="w-full bg-phoenix-gradient hover:shadow-lg hover:shadow-phoenix-500/25 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3"
                aria-label="Recharger la page"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Recharger la page</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleGoHome}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3"
                aria-label="Retour à l'accueil"
              >
                <Home className="w-5 h-5" />
                <span>Retour à l'accueil</span>
              </motion.button>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm text-gray-400">
                Si le problème persiste, contactez le support à{' '}
                <a 
                  href="mailto:support@phoenix-ai.fr" 
                  className="text-phoenix-400 hover:text-phoenix-300 underline focus:outline-none focus:ring-2 focus:ring-phoenix-400/50 rounded"
                  aria-label="Contacter le support par email"
                >
                  support@phoenix-ai.fr
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook pour utiliser l'Error Boundary de manière declarative
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Manual error report:', error, errorInfo);
    // Force re-render with error
    throw error;
  };
}