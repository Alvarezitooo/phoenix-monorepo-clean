/**
 * 🌙 Luna Narrative Preview Component
 * 
 * Composant intelligent qui affiche l'aperçu du journal narratif
 * contextualisé pour chaque module Phoenix.
 * 
 * Remplace les données techniques par l'histoire personnelle de l'utilisateur.
 */

import React, { useState, useEffect } from 'react';
import { useLuna } from '../../luna/LunaContext';
import { useNarrativeCapture } from '../../services/narrativeCapture';
import { PhoenixCard, PhoenixButton, DesignTokens, combineClasses, getModuleStyles } from '../ui';
import { LunaNarrativePreviewSkeleton } from './SkeletonLoaders';
import { 
  Moon, 
  Sparkles, 
  TrendingUp, 
  Heart, 
  Lightbulb, 
  Target,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Brain,
  Flame,
  Clock,
  ArrowRight
} from 'lucide-react';

// 🎭 Types pour le narratif contextuel
export interface NarrativePreview {
  module: 'aube' | 'cv' | 'letters' | 'rise';
  
  // 📖 État narratif current
  currentChapter: string;
  emotionalState: 'curious' | 'confident' | 'uncertain' | 'motivated' | 'focused' | 'exploratory';
  
  // ⭐ Insights personnels clés
  keyInsights: string[];
  recentWins: string[];
  
  // 🎯 Momentum et guidance
  sessionMomentum: 'building' | 'maintaining' | 'declining';
  suggestedActions: string[];
  
  // 💬 Personnalité Luna contextuelle
  lunaPersonality: 'encouraging' | 'analytical' | 'playful' | 'supportive';
  lunaMessage: string;
  
  // 📊 Métriques narratives (pas techniques!)
  journeyProgress: number; // Progression dans le story arc
  engagementLevel: number; // Niveau d'engagement détecté
  confidenceGrowth: number; // Évolution de la confiance
}

interface LunaNarrativePreviewProps {
  module: 'aube' | 'cv' | 'letters' | 'rise';
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

// 🎨 Mapping des icônes par module
const MODULE_ICONS = {
  aube: Sparkles,
  cv: TrendingUp, 
  letters: MessageSquare,
  rise: Flame
};

// 🌈 Messages Luna par état émotionnel
const LUNA_MESSAGES = {
  curious: "J'adore ta curiosité ! Continuons à explorer ensemble 🔍",
  confident: "Tu rayonnes de confiance ! C'est magnifique à voir ✨",
  uncertain: "C'est normal d'avoir des doutes. Je suis là pour te guider 🤝",
  motivated: "Cette motivation est contagieuse ! Allons-y ! 🚀",
  focused: "Ton focus est impressionnant. Restons dans cette énergie 🎯",
  exploratory: "Parfait ! L'exploration ouvre toutes les possibilités 🌟"
};

export const LunaNarrativePreview: React.FC<LunaNarrativePreviewProps> = ({ 
  module, 
  isOpen = true, 
  onClose,
  className 
}) => {
  const { user } = useLuna();
  const [narrativeData, setNarrativeData] = useState<NarrativePreview | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 🎨 Styles du module
  const moduleStyles = getModuleStyles(module);
  const ModuleIcon = MODULE_ICONS[module];

  // 🧠 Récupération des données narratives
  useEffect(() => {
    const fetchNarrativePreview = async () => {
      if (!user?.id) {
        // Fallback intelligent sans utilisateur
        setNarrativeData(generateIntelligentFallback());
        setIsLoading(false);
        return;
      }

      try {
        // Appel à Luna Hub pour récupérer l'aperçu narratif du module
        const response = await fetch(`${import.meta.env.MODE === 'development' 
          ? 'http://localhost:8003' 
          : 'https://luna-hub-production.up.railway.app'}/luna/narrative/preview/${module}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setNarrativeData(data.narrative_preview);
        } else {
          // Fallback si API indisponible
          setNarrativeData(generateIntelligentFallback());
        }
      } catch (error) {
        console.warn('Narrative preview fallback:', error);
        setNarrativeData(generateIntelligentFallback());
      }

      setIsLoading(false);
    };

    fetchNarrativePreview();
  }, [user, module]);

  // 🎯 Fallback intelligent basé sur le module et le contexte
  const generateIntelligentFallback = (): NarrativePreview => {
    const currentTime = new Date().getHours();
    const isWorkingHours = currentTime >= 9 && currentTime <= 17;

    const fallbacks = {
      aube: {
        currentChapter: "Découverte de tes aspirations",
        emotionalState: 'curious' as const,
        keyInsights: [
          "Tu montres une forte curiosité pour l'exploration",
          "Tes valeurs semblent s'orienter vers l'innovation"
        ],
        recentWins: ["Session d'exploration initiée", "Première réflexion sur tes forces"],
        sessionMomentum: 'building' as const,
        suggestedActions: isWorkingHours ? [
          "Explore tes métiers de rêve",
          "Identifie tes forces naturelles"
        ] : [
          "Réfléchis à tes aspirations profondes",
          "Note tes moments de flow au travail"
        ],
        lunaPersonality: 'encouraging' as const,
        lunaMessage: LUNA_MESSAGES.curious,
        journeyProgress: 25,
        engagementLevel: 80,
        confidenceGrowth: 15
      },
      cv: {
        currentChapter: "Optimisation de ton profil professionnel",
        emotionalState: 'focused' as const,
        keyInsights: [
          "Ton profil révèle un potentiel excellent",
          "Tes expériences s'articulent bien ensemble"
        ],
        recentWins: ["Profil analysé avec succès", "Points d'amélioration identifiés"],
        sessionMomentum: 'maintaining' as const,
        suggestedActions: [
          "Finalise l'optimisation de ton CV",
          "Prépare tes lettres de motivation ciblées"
        ],
        lunaPersonality: 'analytical' as const,
        lunaMessage: LUNA_MESSAGES.focused,
        journeyProgress: 60,
        engagementLevel: 85,
        confidenceGrowth: 25
      },
      letters: {
        currentChapter: "Maîtrise de la communication écrite",
        emotionalState: 'motivated' as const,
        keyInsights: [
          "Ton style d'écriture est naturellement engageant",
          "Tes lettres reflètent ta personnalité authentique"
        ],
        recentWins: ["Première lettre générée", "Style personnel identifié"],
        sessionMomentum: 'building' as const,
        suggestedActions: [
          "Personnalise tes lettres par entreprise",
          "Affine ton accroche personnelle"
        ],
        lunaPersonality: 'supportive' as const,
        lunaMessage: LUNA_MESSAGES.motivated,
        journeyProgress: 45,
        engagementLevel: 90,
        confidenceGrowth: 30
      },
      rise: {
        currentChapter: "Développement de ta confiance en entretien",
        emotionalState: 'uncertain' as const,
        keyInsights: [
          "Tu as toutes les ressources pour réussir",
          "Tes expériences sont plus riches que tu ne le penses"
        ],
        recentWins: ["Première simulation lancée", "Points forts identifiés"],
        sessionMomentum: 'building' as const,
        suggestedActions: [
          "Pratique tes réponses STAR",
          "Prépare 3 questions intelligentes"
        ],
        lunaPersonality: 'encouraging' as const,
        lunaMessage: LUNA_MESSAGES.uncertain,
        journeyProgress: 30,
        engagementLevel: 70,
        confidenceGrowth: 20
      }
    };

    return {
      module,
      ...fallbacks[module]
    };
  };

  if (!isOpen) return null;
  
  // 🎭 Afficher skeleton pendant le loading
  if (isLoading || !narrativeData) {
    return <LunaNarrativePreviewSkeleton module={module} />;
  }

  return (
    <div className={combineClasses(
      "fixed top-16 right-0 h-[calc(100vh-4rem)] w-96 z-40",
      "bg-gradient-to-b from-white to-slate-50",
      "border-l shadow-2xl",
      DesignTokens.animations.transition,
      className || ""
    )}>
      <div className="h-full flex flex-col">
        
        {/* 🎨 Header avec identité module */}
        <div className={combineClasses(
          "p-4 border-b text-white",
          `bg-gradient-to-r ${moduleStyles.primary}`
        )}>
          <div className={DesignTokens.layouts.flex.between}>
            <div className={DesignTokens.layouts.flex.start}>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mr-3">
                <ModuleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={combineClasses(
                  DesignTokens.typography.headings.h4,
                  "text-white mb-1"
                )}>
                  Luna {module.charAt(0).toUpperCase() + module.slice(1)}
                </h3>
                <p className="text-white/80 text-sm">Ton copilote narratif</p>
              </div>
            </div>
            {onClose && (
              <PhoenixButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                ×
              </PhoenixButton>
            )}
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-white/90 mb-1">
              <span>Progression du parcours</span>
              <span>{narrativeData.journeyProgress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="h-2 bg-white rounded-full transition-all duration-500"
                style={{ width: `${narrativeData.journeyProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 📖 Contenu narratif */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* État émotionnel et chapitre current */}
          <PhoenixCard variant="gradient" padding="md" className="relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className={`w-full h-full bg-gradient-to-br ${moduleStyles.primary}`}></div>
            </div>
            <div className="relative">
              <div className={DesignTokens.layouts.flex.start}>
                <Heart className="w-5 h-5 text-pink-500 mr-2" />
                <h4 className={combineClasses(
                  DesignTokens.typography.headings.h5,
                  DesignTokens.colors.neutral.text.primary
                )}>
                  {narrativeData.currentChapter}
                </h4>
              </div>
              <p className={combineClasses(
                DesignTokens.typography.body.small,
                DesignTokens.colors.neutral.text.secondary,
                "mt-2"
              )}>
                État émotionnel : <span className="font-medium capitalize">{narrativeData.emotionalState}</span>
              </p>
            </div>
          </PhoenixCard>

          {/* Insights personnels */}
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-left mb-3"
            >
              <div className={DesignTokens.layouts.flex.start}>
                <Lightbulb className={`w-5 h-5 ${moduleStyles.text} mr-2`} />
                <span className={combineClasses(
                  DesignTokens.typography.headings.h5,
                  DesignTokens.colors.neutral.text.primary
                )}>
                  Insights de ton parcours
                </span>
              </div>
              {isExpanded ? 
                <ChevronDown className={`w-4 h-4 ${moduleStyles.text}`} /> : 
                <ChevronRight className={`w-4 h-4 ${moduleStyles.text}`} />
              }
            </button>
            
            {isExpanded && (
              <div className="space-y-3 animate-in slide-in-from-top duration-300">
                {narrativeData.keyInsights.map((insight, index) => (
                  <div key={index} className={combineClasses(
                    "flex items-start space-x-2 p-3 rounded-lg",
                    `bg-gradient-to-r ${moduleStyles.bg}`
                  )}>
                    <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className={combineClasses(
                      DesignTokens.typography.body.small,
                      DesignTokens.colors.neutral.text.secondary
                    )}>
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent wins */}
          {narrativeData.recentWins.length > 0 && (
            <PhoenixCard padding="md">
              <div className={DesignTokens.layouts.flex.start}>
                <Target className="w-5 h-5 text-green-500 mr-2" />
                <h4 className={combineClasses(
                  DesignTokens.typography.headings.h5,
                  DesignTokens.colors.neutral.text.primary,
                  "mb-2"
                )}>
                  Tes victoires récentes
                </h4>
              </div>
              <div className="space-y-2">
                {narrativeData.recentWins.map((win, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className={combineClasses(
                      DesignTokens.typography.body.small,
                      DesignTokens.colors.neutral.text.secondary
                    )}>
                      {win}
                    </span>
                  </div>
                ))}
              </div>
            </PhoenixCard>
          )}

          {/* Actions suggérées */}
          <PhoenixCard padding="md">
            <div className={DesignTokens.layouts.flex.start}>
              <Brain className={`w-5 h-5 ${moduleStyles.text} mr-2`} />
              <h4 className={combineClasses(
                DesignTokens.typography.headings.h5,
                DesignTokens.colors.neutral.text.primary,
                "mb-3"
              )}>
                Prochaines étapes suggérées
              </h4>
            </div>
            <div className="space-y-2">
              {narrativeData.suggestedActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group transition-colors">
                  <span className={combineClasses(
                    DesignTokens.typography.body.small,
                    DesignTokens.colors.neutral.text.secondary
                  )}>
                    {action}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              ))}
            </div>
          </PhoenixCard>

          {/* Message Luna */}
          <PhoenixCard variant="gradient" padding="md" className={`bg-gradient-to-br ${moduleStyles.bg}`}>
            <div className={DesignTokens.layouts.flex.start}>
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <Moon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className={combineClasses(
                  DesignTokens.typography.body.small,
                  DesignTokens.colors.neutral.text.primary,
                  "font-medium mb-1"
                )}>
                  Message de Luna
                </p>
                <p className={combineClasses(
                  DesignTokens.typography.body.small,
                  DesignTokens.colors.neutral.text.secondary,
                  "italic"
                )}>
                  "{narrativeData.lunaMessage}"
                </p>
              </div>
            </div>
          </PhoenixCard>
        </div>

        {/* Footer avec engagement metrics */}
        <div className={combineClasses(
          "p-4 border-t border-slate-200 bg-slate-50",
          DesignTokens.layouts.flex.between
        )}>
          <div className="text-center">
            <div className={combineClasses(
              DesignTokens.typography.body.small,
              DesignTokens.typography.weights.semibold,
              DesignTokens.colors.neutral.text.primary
            )}>
              {narrativeData.engagementLevel}%
            </div>
            <div className={combineClasses(
              DesignTokens.typography.body.xs,
              DesignTokens.colors.neutral.text.muted
            )}>
              Engagement
            </div>
          </div>
          <div className="text-center">
            <div className={combineClasses(
              DesignTokens.typography.body.small,
              DesignTokens.typography.weights.semibold,
              "text-green-600"
            )}>
              +{narrativeData.confidenceGrowth}%
            </div>
            <div className={combineClasses(
              DesignTokens.typography.body.xs,
              DesignTokens.colors.neutral.text.muted
            )}>
              Confiance
            </div>
          </div>
          <div className="text-center">
            <div className={combineClasses(
              DesignTokens.typography.body.small,
              DesignTokens.typography.weights.semibold,
              narrativeData.sessionMomentum === 'building' ? 'text-green-600' :
              narrativeData.sessionMomentum === 'maintaining' ? 'text-blue-600' : 'text-yellow-600'
            )}>
              {narrativeData.sessionMomentum}
            </div>
            <div className={combineClasses(
              DesignTokens.typography.body.xs,
              DesignTokens.colors.neutral.text.muted
            )}>
              Momentum
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LunaNarrativePreview;