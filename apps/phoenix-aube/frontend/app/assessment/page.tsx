'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { EnergyRequired } from '@/components/assessment/EnergyRequired';
import { ArrowLeft, ArrowRight, Brain, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAssessmentStore } from '@/lib/store';
import { phoenixAubeApi } from '@/lib/api';

interface Question {
  id: string;
  type: 'scale' | 'choice' | 'ranking';
  text: string;
  options?: string[];
  required: boolean;
}

interface AssessmentStep {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  icon: string;
  energyCost: number;
}

const assessmentSteps: AssessmentStep[] = [
  {
    id: 1,
    title: "Appétences Générales",
    description: "Préférez-vous travailler avec les données ou les personnes ?",
    icon: "👥",
    energyCost: 2,
    questions: [
      {
        id: "people_data",
        type: "scale",
        text: "Entre ces deux options, vers quoi penchez-vous naturellement ?",
        options: ["Travailler avec des données/systèmes", "Travailler avec des personnes"],
        required: true
      },
      {
        id: "detail_vision",
        type: "scale", 
        text: "Préférez-vous vous concentrer sur les détails ou avoir une vision d'ensemble ?",
        options: ["Attention aux détails", "Vision d'ensemble"],
        required: true
      }
    ]
  },
  {
    id: 2,
    title: "Valeurs Professionnelles",
    description: "Qu'est-ce qui vous motive vraiment dans le travail ?",
    icon: "💼",
    energyCost: 2,
    questions: [
      {
        id: "work_values",
        type: "ranking",
        text: "Classez ces valeurs par ordre d'importance pour vous (1 = le plus important) :",
        options: [
          "Sécurité de l'emploi",
          "Salaire élevé", 
          "Équilibre vie-travail",
          "Impact social",
          "Reconnaissance",
          "Créativité",
          "Autonomie",
          "Apprentissage continu"
        ],
        required: true
      }
    ]
  },
  {
    id: 3,
    title: "Environnement de Travail",
    description: "Dans quel cadre vous épanouissez-vous le mieux ?",
    icon: "🏢",
    energyCost: 1,
    questions: [
      {
        id: "work_environment",
        type: "choice",
        text: "Quel environnement de travail vous attire le plus ?",
        options: [
          "Bureau traditionnel en équipe",
          "Open space dynamique",
          "Télétravail à domicile",
          "Espaces de coworking",
          "Terrain/extérieur",
          "Laboratoire/atelier"
        ],
        required: true
      },
      {
        id: "team_size",
        type: "choice",
        text: "Quelle taille d'équipe préférez-vous ?",
        options: [
          "Travail en solo",
          "Petite équipe (2-5 personnes)",
          "Équipe moyenne (6-15 personnes)", 
          "Grande équipe (15+ personnes)"
        ],
        required: true
      }
    ]
  },
  {
    id: 4,
    title: "Autonomie et Responsabilités",
    description: "Quel niveau de responsabilité souhaitez-vous ?",
    icon: "🎯",
    energyCost: 1,
    questions: [
      {
        id: "autonomy_level",
        type: "scale",
        text: "Préférez-vous recevoir des instructions précises ou avoir une totale liberté d'action ?",
        options: ["Instructions précises", "Totale liberté"],
        required: true
      },
      {
        id: "leadership",
        type: "scale",
        text: "Vous voyez-vous plutôt en position de leadership ou de contributeur individuel ?",
        options: ["Contributeur individuel", "Position de leadership"],
        required: true
      }
    ]
  },
  {
    id: 5,
    title: "Créativité et Innovation",
    description: "Quelle place accordez-vous à la créativité ?",
    icon: "🎨",
    energyCost: 1,
    questions: [
      {
        id: "creativity_importance",
        type: "scale",
        text: "L'importance de la créativité dans votre travail :",
        options: ["Peu importante", "Très importante"],
        required: true
      },
      {
        id: "innovation_comfort",
        type: "choice",
        text: "Face à un problème, vous préférez :",
        options: [
          "Appliquer des méthodes éprouvées",
          "Expérimenter de nouvelles approches",
          "Combiner tradition et innovation",
          "Révolutionner complètement l'approche"
        ],
        required: true
      }
    ]
  },
  {
    id: 6,
    title: "Stabilité vs Changement",
    description: "Comment réagissez-vous au changement ?",
    icon: "⚖️",
    energyCost: 1,
    questions: [
      {
        id: "change_comfort",
        type: "scale",
        text: "Votre rapport au changement professionnel :",
        options: ["Préfère la stabilité", "Adore le changement"],
        required: true
      },
      {
        id: "routine_variety",
        type: "scale",
        text: "Entre routine et variété :",
        options: ["Routine rassurante", "Variété stimulante"],
        required: true
      }
    ]
  },
  {
    id: 7,
    title: "Impact et Sens",
    description: "Quelle empreinte voulez-vous laisser ?",
    icon: "🌱",
    energyCost: 2,
    questions: [
      {
        id: "impact_scope",
        type: "choice",
        text: "Quel type d'impact vous motive le plus ?",
        options: [
          "Impact local/communautaire",
          "Impact national",
          "Impact international",
          "Impact environnemental",
          "Impact technologique",
          "Impact éducatif"
        ],
        required: true
      },
      {
        id: "meaning_importance",
        type: "scale",
        text: "L'importance du sens dans votre travail :",
        options: ["Travail = revenu", "Travail = mission"],
        required: true
      }
    ]
  },
  {
    id: 8,
    title: "Apprentissage et Évolution",
    description: "Comment envisagez-vous votre développement ?",
    icon: "📚",
    energyCost: 2,
    questions: [
      {
        id: "learning_style",
        type: "choice",
        text: "Comment préférez-vous apprendre ?",
        options: [
          "Formation théorique/académique",
          "Apprentissage par la pratique",
          "Mentorat et observation",
          "Auto-formation/autodidacte"
        ],
        required: true
      },
      {
        id: "career_evolution",
        type: "choice",
        text: "Comment voyez-vous l'évolution de votre carrière ?",
        options: [
          "Spécialisation technique profonde",
          "Montée en management",
          "Entrepreneuriat/freelance",
          "Reconversion régulière"
        ],
        required: true
      }
    ]
  }
];

export default function AssessmentPage() {
  const {
    user,
    currentStep,
    answers,
    isSubmitting,
    setCurrentStep,
    setAnswer,
    setIsSubmitting,
    setResults,
    getSignalsFromAnswers
  } = useAssessmentStore();

  const [energyCheck, setEnergyCheck] = useState<{ sufficient: boolean; required: number } | null>(null);
  const [showEnergyModal, setShowEnergyModal] = useState(false);

  const currentStepData = assessmentSteps[currentStep];
  const totalEnergyCost = assessmentSteps.reduce((sum, step) => sum + step.energyCost, 0);

  useEffect(() => {
    // Vérifier l'énergie au début de l'assessment
    const checkInitialEnergy = async () => {
      if (user?.id) {
        try {
          const energyStatus = await phoenixAubeApi.checkEnergy(user.id, 'assessment_complet');
          setEnergyCheck({
            sufficient: energyStatus.has_sufficient_energy,
            required: totalEnergyCost
          });
          
          if (!energyStatus.has_sufficient_energy) {
            setShowEnergyModal(true);
          }
        } catch (error) {
          console.error('Energy check failed:', error);
        }
      }
    };

    checkInitialEnergy();
  }, [user?.id, totalEnergyCost]);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswer(questionId, value);
  };

  const handleNext = async () => {
    if (currentStep < assessmentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      window.location.href = '/login';
      return;
    }

    setIsSubmitting(true);
    
    try {
      const signals = getSignalsFromAnswers();
      const results = await phoenixAubeApi.submitAssessment(
        user.id, 
        signals,
        { version: '2025.1', source: 'web' }
      );
      
      setResults(results);
      window.location.href = '/results';
    } catch (error: any) {
      console.error('Assessment submission failed:', error);
      setIsSubmitting(false);
      
      if (error.response?.status === 402) {
        setShowEnergyModal(true);
      }
    }
  };

  const isStepComplete = () => {
    return currentStepData.questions.every(question => 
      question.required ? answers[question.id] !== undefined : true
    );
  };

  // Afficher modal énergie insuffisante
  if (showEnergyModal && energyCheck && !energyCheck.sufficient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <EnergyRequired
          required={energyCheck.required}
          current={user?.lunaHubEnergy || 0}
          actionName="l'assessment complet"
          onRecharge={() => {
            setShowEnergyModal(false);
            window.location.href = '/profile?tab=energy';
          }}
        />
      </div>
    );
  }

  // Loading state pendant soumission
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Analyse en cours...</h2>
              <p className="text-gray-600">
                Notre IA analyse vos réponses pour identifier vos métiers idéaux
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
            <p className="text-sm text-gray-500">
              Cette analyse consomme {totalEnergyCost} points d'énergie Luna Hub
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Étape {currentStep + 1} sur {assessmentSteps.length}
              </span>
              <Badge variant="secondary">
                ⚡ {currentStepData.energyCost} énergie
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="mb-8">
          <ProgressBar current={currentStep + 1} total={assessmentSteps.length} />
        </div>

        {/* Step Content */}
        <Card className="shadow-xl border-none">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="text-5xl mx-auto">{currentStepData.icon}</div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {currentStepData.title}
              </CardTitle>
              <p className="text-lg text-gray-600">{currentStepData.description}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {currentStepData.questions.map((question, questionIndex) => (
              <div key={question.id} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {question.text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </h3>

                {question.type === 'scale' && question.options && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 px-2">
                      <span className="text-center max-w-32">{question.options[0]}</span>
                      <span className="text-center max-w-32">{question.options[1]}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                        <button
                          key={value}
                          onClick={() => handleAnswer(question.id, value)}
                          className={cn(
                            "w-12 h-12 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                            answers[question.id] === value
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500 text-white shadow-lg"
                              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          )}
                        >
                          <span className="font-medium">{value}</span>
                        </button>
                      ))}
                    </div>
                    <div className="text-center text-xs text-gray-500">
                      1 = {question.options[0]} | 7 = {question.options[1]}
                    </div>
                  </div>
                )}

                {question.type === 'choice' && question.options && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswer(question.id, option)}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500",
                          answers[question.id] === option
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500 text-blue-900 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option}</span>
                          {answers[question.id] === option && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {question.type === 'ranking' && question.options && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Cliquez pour assigner un rang (1 = le plus important) :</p>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const answerObj = answers[question.id] as Record<string, number> | undefined;
                        const currentRank = answerObj?.[option] || null;
                        return (
                          <div
                            key={optionIndex}
                            className={cn(
                              "flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                              currentRank ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <select
                              value={currentRank || ''}
                              onChange={(e) => {
                                const rank = parseInt(e.target.value);
                                const newRanking = { ...(answers[question.id] as Record<string, number> || {}) };
                                
                                // Remove this option from any previous rank
                                Object.keys(newRanking).forEach(key => {
                                  if (newRanking[key] === rank) {
                                    delete newRanking[key];
                                  }
                                });
                                
                                // Set new rank
                                if (rank) {
                                  newRanking[option] = rank;
                                }
                                handleAnswer(question.id, newRanking);
                              }}
                              className="w-16 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">-</option>
                              {question.options!.map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                              ))}
                            </select>
                            <span className="flex-1 font-medium text-gray-900">{option}</span>
                            {currentRank && (
                              <Badge className="bg-blue-100 text-blue-800">#{currentRank}</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Energy Cost Display */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Étape {currentStep + 1}: {currentStepData.energyCost} points d'énergie
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  Total: {totalEnergyCost} points
                </Badge>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Précédent</span>
              </Button>

              <Button
                onClick={handleNext}
                disabled={!isStepComplete()}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <span>
                  {currentStep === assessmentSteps.length - 1 ? 'Analyser mon profil' : 'Suivant'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}