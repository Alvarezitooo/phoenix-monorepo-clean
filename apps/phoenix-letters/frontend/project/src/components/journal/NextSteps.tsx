import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Zap, 
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { JournalNextStep, JournalSocialProof } from '@/services/journalAPI';
import { journalAPI } from '@/services/journalAPI';
import { useStore } from '@/store/useStore';

interface NextStepsProps {
  steps: JournalNextStep[];
  userEnergy: number;
  socialProof: JournalSocialProof | null;
  onRefetch: () => void;
}

interface EnergyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: JournalNextStep;
  userEnergy: number;
  userId: string;
  onConfirm: () => void;
}

function EnergyPreviewModal({ 
  isOpen, 
  onClose, 
  step, 
  userEnergy, 
  userId,
  onConfirm 
}: EnergyPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && step) {
      loadPreview();
    }
  }, [isOpen, step]);

  const loadPreview = async () => {
    if (!step || !userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [preview, confirmation] = await Promise.all([
        journalAPI.previewEnergyAction({ user_id: userId, action: step.action }),
        journalAPI.getConfirmationMessage(step.action, userId)
      ]);
      
      setPreviewData({ preview, confirmation });
    } catch (err) {
      setError('Impossible de charger la prévisualisation');
      console.error('Preview error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              🌙 Luna vous accompagne
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Luna calcule l'impact énergétique...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <Button onClick={loadPreview} className="mt-4">
                Réessayer
              </Button>
            </div>
          ) : previewData ? (
            <>
              {/* Luna Message */}
              <div className="mb-6">
                <p className="text-gray-800 leading-relaxed">
                  {previewData.confirmation.confirmation_message}
                </p>
              </div>

              {/* Energy Impact */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Impact énergétique</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {previewData.preview.unlimited_user ? '∞' : 
                       `${Math.round(previewData.preview.balance_before)}% → ${Math.round(previewData.preview.balance_after)}%`
                      }
                    </div>
                  </div>
                </div>
                
                {!previewData.preview.unlimited_user && (
                  <Progress 
                    value={previewData.preview.balance_after} 
                    className="h-2"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={onConfirm}
                  disabled={!previewData.preview.can_perform}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {previewData.preview.can_perform ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Oui, allons-y Luna! 🚀
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Énergie insuffisante
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Pas maintenant
                </Button>
              </div>
            </>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function NextStepCard({ 
  step, 
  index, 
  userEnergy, 
  userId,
  onRefetch 
}: { 
  step: JournalNextStep; 
  index: number; 
  userEnergy: number;
  userId: string;
  onRefetch: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const canAfford = userEnergy >= step.cost_pct;

  const handleConfirm = () => {
    // TODO: Redirect to appropriate action page
    // For now, just close modal and refetch
    setShowModal(false);
    onRefetch();
    
    // Example redirects based on action
    const actionRoutes: Record<string, string> = {
      'lettre_motivation': '/generate',
      'optimisation_cv': '/dashboard',
      'mirror_match': '/analytics',
      'analyse_cv_complete': '/dashboard',
      'conseil_rapide': '/dashboard'
    };
    
    const route = actionRoutes[step.action];
    if (route) {
      // Small delay to allow modal to close smoothly
      setTimeout(() => {
        window.location.href = route;
      }, 300);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
          canAfford ? 'hover:bg-purple-50' : 'opacity-60'
        }`} onClick={() => setShowModal(true)}>
          
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-gray-900">Action Recommandée</span>
              </div>
              <p className="text-gray-600 text-sm">{step.expected_gain}</p>
            </div>
            
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant={canAfford ? "default" : "secondary"} className="flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              {step.cost_pct}% énergie
            </Badge>
            
            {!canAfford && (
              <span className="text-xs text-orange-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Énergie insuffisante
              </span>
            )}
          </div>
        </Card>
      </motion.div>

      <EnergyPreviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        step={step}
        userEnergy={userEnergy}
        userId={userId}
        onConfirm={handleConfirm}
      />
    </>
  );
}

export function NextSteps({ steps, userEnergy, socialProof, onRefetch }: NextStepsProps) {
  const { user } = useStore();

  if (steps.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Prêt pour la suite ?
        </h3>
        <p className="text-gray-600 text-sm">
          De nouvelles suggestions apparaîtront selon votre progression.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
          🚀 Prochaines Étapes
        </h2>
        <p className="text-gray-600 text-sm">
          Luna a analysé votre progression et suggère ces actions
        </p>
        
        {/* Social Proof */}
        {socialProof && socialProof.peers_percentage_recommended_step > 0 && (
          <div className="mt-3 p-2 bg-white rounded text-sm flex items-center">
            <Users className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-gray-700">
              {Math.round(socialProof.peers_percentage_recommended_step * 100)}% des utilisateurs 
              similaires ont choisi "{socialProof.recommended_label}"
            </span>
          </div>
        )}
      </Card>

      {/* Next Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <NextStepCard 
            key={step.action}
            step={step}
            index={index}
            userEnergy={userEnergy}
            userId={user?.id || ''}
            onRefetch={onRefetch}
          />
        ))}
      </div>
    </div>
  );
}