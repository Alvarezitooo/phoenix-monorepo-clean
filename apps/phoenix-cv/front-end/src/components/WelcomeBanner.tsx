/**
 * 🌙 Welcome Banner - Phoenix CV
 * Bannière d'accueil contextuel post-inscription Luna
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, 
  X, 
  ArrowRight, 
  Sparkles, 
  Upload,
  Target
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface WelcomeBannerProps {
  onClose?: () => void;
}

export function WelcomeBanner({ onClose }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Détecter si l'utilisateur vient de s'inscrire
  useEffect(() => {
    const fromRegistration = searchParams.get('welcome') === 'true' || 
                            localStorage.getItem('phoenix_just_registered') === 'true';
    
    if (fromRegistration) {
      setIsVisible(true);
      // Animation séquentielle
      const timer = setTimeout(() => setAnimationStep(1), 1000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.removeItem('phoenix_just_registered');
    if (onClose) onClose();
  };

  const handleStartAnalysis = () => {
    navigate('/builder');
    handleClose();
  };

  const handleMirrorMatch = () => {
    navigate('/mirror-match');
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="relative z-40 mx-6 mt-6 mb-8"
      >
        {/* Background avec gradient Luna */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20">
          
          {/* Particules animées */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-4 left-8 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-12 w-1 h-1 bg-purple-300 rounded-full animate-ping"></div>
            <div className="absolute bottom-6 left-16 w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
            <div className="absolute bottom-4 right-8 w-1 h-1 bg-pink-300 rounded-full animate-pulse"></div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative p-6">
            {/* Luna Avatar + Message */}
            <div className="flex items-start space-x-4 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex-shrink-0"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50 relative">
                  <Moon className="w-8 h-8 text-white" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-white/30 rounded-full"
                  />
                </div>
              </motion.div>

              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <Sparkles className="w-6 h-6 text-yellow-400 mr-2" />
                    Parfait, nous y sommes !
                  </h2>
                  <p className="text-purple-100 leading-relaxed text-lg">
                    Je suis <strong className="text-yellow-300">Luna</strong>, votre assistante IA. 
                    Bienvenue dans Phoenix CV ! Prêt à révéler tout le potentiel de votre profil ? ✨
                  </p>
                </motion.div>

                {/* Animation du texte contextuel */}
                <AnimatePresence>
                  {animationStep >= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-white/10 rounded-xl border border-purple-400/30"
                    >
                      <p className="text-purple-100 text-sm">
                        🎯 <strong>Votre mission :</strong> Analysons ensemble votre premier CV. 
                        Mes 4 fonctionnalités révolutionnaires vont transformer votre recherche d'emploi !
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <button
                onClick={handleStartAnalysis}
                className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-xl text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <Upload className="w-5 h-5" />
                <span>Analyser mon premier CV</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleMirrorMatch}
                className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]"
              >
                <Target className="w-5 h-5" />
                <span>Mirror Match d'abord</span>
              </button>
            </motion.div>

            {/* Progress hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-4 text-center"
            >
              <p className="text-purple-300 text-xs">
                💡 Astuce : Avec Luna Unlimited, toutes les analyses sont illimitées !
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}