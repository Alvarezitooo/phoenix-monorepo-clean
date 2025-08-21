import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  TrendingUp, 
  Target, 
  Lightbulb,
  Crown,
  Lock,
  Sparkles,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { useCareerTransition } from '@/hooks/useCareerTransition';
import { TransferableSkill, SkillGap, NarrativeBridge } from '@/types';

interface CareerTransitionSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function CareerTransitionSection({ isExpanded, onToggle }: CareerTransitionSectionProps) {
  const { user, formData, updateFormData, careerTransition } = useStore();
  const { analyzeTransition, getPreview, isAnalyzing, isLoadingPreview } = useCareerTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any>(null);

  const isPremium = user?.subscription === 'premium';

  // 🎯 GAME CHANGER - Analyse complète avec notre backend
  const handleAnalyze = async () => {
    if (!isPremium) return;

    const newErrors: Record<string, string> = {};
    
    if (!formData.previousRole.trim()) {
      newErrors.previousRole = 'Rôle précédent obligatoire';
    }
    
    if (!formData.targetRole.trim()) {
      newErrors.targetRole = 'Rôle cible obligatoire';
    }

    if (formData.previousRole.trim().toLowerCase() === formData.targetRole.trim().toLowerCase()) {
      newErrors.targetRole = 'Le rôle cible doit être différent du rôle précédent';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      try {
        await analyzeTransition(formData.previousRole, formData.targetRole);
      } catch (error) {
        console.error('Erreur analyse:', error);
        // Gestion d'erreur pour l'UI
      }
    }
  };

  // Preview gratuit pour les utilisateurs Free
  const handlePreview = async () => {
    if (!formData.previousRole.trim() || !formData.targetRole.trim()) {
      return;
    }

    try {
      const previewData = await getPreview(formData.previousRole, formData.targetRole);
      setPreview(previewData);
    } catch (error) {
      console.error('Erreur preview:', error);
    }
  };

  const handleInputChange = (field: 'previousRole' | 'targetRole', value: string) => {
    updateFormData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Auto-preview pour les utilisateurs Free
    if (!isPremium && formData.previousRole && formData.targetRole) {
      handlePreview();
    }
  };

  const categoryColors = {
    technical: 'bg-blue-100 text-blue-800 border-blue-200',
    soft: 'bg-green-100 text-green-800 border-green-200',
    leadership: 'bg-purple-100 text-purple-800 border-purple-200',
    analytical: 'bg-orange-100 text-orange-800 border-orange-200',
    creative: 'bg-pink-100 text-pink-800 border-pink-200',
  };

  const importanceColors = {
    high: 'text-red-600 border-red-300 bg-red-50',
    medium: 'text-yellow-600 border-yellow-300 bg-yellow-50',
    low: 'text-green-600 border-green-300 bg-green-50',
  };

  // Fonction pour déterminer le message de compatibilité
  const getCompatibilityMessage = (score: number) => {
    if (score >= 90) return "Excellent match! Votre profil correspond parfaitement.";
    if (score >= 80) return "Très bon match! Votre background s'aligne bien avec le rôle cible.";
    if (score >= 70) return "Bon match avec quelques adaptations nécessaires.";
    if (score >= 60) return "Match modéré - préparation recommandée.";
    return "Transition challengeante mais réalisable avec de la préparation.";
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "from-green-50 to-emerald-50 border-green-200";
    if (score >= 70) return "from-blue-50 to-cyan-50 border-blue-200";
    if (score >= 60) return "from-yellow-50 to-orange-50 border-yellow-200";
    return "from-red-50 to-pink-50 border-red-200";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-2">
        {!isPremium && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none" />
        )}
        
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <TrendingUp className="w-6 h-6 mr-3 text-purple-600" />
              🎯 Analyse de Transition de Carrière
              {!isPremium && (
                <Badge className="ml-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  PREMIUM
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              onClick={onToggle}
              className="text-sm font-medium"
            >
              {isExpanded ? 'Masquer' : 'Afficher'} l'Analyse
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Obtenez des insights IA sur votre transition de carrière et vos compétences transférables
          </p>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-6 pt-6">
                {!isPremium ? (
                  <div className="space-y-6">
                    {/* Formulaire pour tous les utilisateurs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="previousRole" className="text-sm font-medium">
                          Rôle Précédent/Actuel *
                        </Label>
                        <Input
                          id="previousRole"
                          value={formData.previousRole}
                          onChange={(e) => handleInputChange('previousRole', e.target.value)}
                          placeholder="ex: Responsable Marketing"
                          className={errors.previousRole ? 'border-red-500' : ''}
                        />
                        {errors.previousRole && (
                          <p className="text-red-500 text-xs mt-1">{errors.previousRole}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="targetRole" className="text-sm font-medium">
                          Rôle Cible *
                        </Label>
                        <Input
                          id="targetRole"
                          value={formData.targetRole}
                          onChange={(e) => handleInputChange('targetRole', e.target.value)}
                          placeholder="ex: Product Manager"
                          className={errors.targetRole ? 'border-red-500' : ''}
                        />
                        {errors.targetRole && (
                          <p className="text-red-500 text-xs mt-1">{errors.targetRole}</p>
                        )}
                      </div>
                    </div>

                    {/* Preview gratuit */}
                    {preview && formData.previousRole && formData.targetRole && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                      >
                        <h4 className="font-medium text-purple-900 mb-2">
                          📊 Aperçu de Transition : {formData.previousRole} → {formData.targetRole}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Difficulté estimée:</span>
                            <span className="ml-2 font-medium text-purple-700">
                              {preview.transition?.estimated_difficulty || 'Modérée'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Score estimé:</span>
                            <span className="ml-2 font-medium text-purple-700">
                              {preview.transition?.estimated_score_range || '70-85%'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-purple-600 mt-2 italic">
                          Upgrade vers Premium pour l'analyse complète avec IA !
                        </p>
                      </motion.div>
                    )}

                    {/* CTA Premium */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8 space-y-6"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Débloquez l'Analyse Complète
                      </h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Obtenez des insights personnalisés sur vos compétences transférables, 
                        identifiez les lacunes, et découvrez des ponts narratifs puissants 
                        pour réussir votre transition de carrière.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <BarChart3 className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                          <h4 className="font-medium mb-2">Mapping de Compétences</h4>
                          <p className="text-sm text-gray-600">IA analyse vos compétences transférables</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <Target className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                          <h4 className="font-medium mb-2">Analyse des Lacunes</h4>
                          <p className="text-sm text-gray-600">Identifie les compétences à développer</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                          <Lightbulb className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                          <h4 className="font-medium mb-2">Ponts Narratifs</h4>
                          <p className="text-sm text-gray-600">Connecte votre expérience au nouveau rôle</p>
                        </div>
                      </div>
                      <Button size="lg" className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        <Crown className="w-5 h-5 mr-2" />
                        Passer à Premium - 14€/mois
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Input Form Premium */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="previousRole" className="text-sm font-medium">
                          Rôle Précédent/Actuel *
                        </Label>
                        <Input
                          id="previousRole"
                          value={formData.previousRole}
                          onChange={(e) => handleInputChange('previousRole', e.target.value)}
                          placeholder="ex: Responsable Marketing"
                          className={errors.previousRole ? 'border-red-500' : ''}
                        />
                        {errors.previousRole && (
                          <p className="text-red-500 text-xs mt-1">{errors.previousRole}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="targetRole" className="text-sm font-medium">
                          Rôle Cible *
                        </Label>
                        <Input
                          id="targetRole"
                          value={formData.targetRole}
                          onChange={(e) => handleInputChange('targetRole', e.target.value)}
                          placeholder="ex: Product Manager"
                          className={errors.targetRole ? 'border-red-500' : ''}
                        />
                        {errors.targetRole && (
                          <p className="text-red-500 text-xs mt-1">{errors.targetRole}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      size="lg"
                      className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Analyse en cours...
                        </div>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Analyser les Compétences Transférables
                        </>
                      )}
                    </Button>

                    {/* Résultats de l'analyse */}
                    {careerTransition && !isAnalyzing && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                      >
                        {/* Compatibilité Globale */}
                        <Card className={`bg-gradient-to-r ${getCompatibilityColor(careerTransition.overallCompatibility)} border-2`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-800">Compatibilité Globale</h3>
                              <div className="text-3xl font-bold text-green-600">
                                {careerTransition.overallCompatibility}%
                              </div>
                            </div>
                            <Progress 
                              value={careerTransition.overallCompatibility} 
                              className="h-4 mb-3" 
                            />
                            <p className="text-sm text-gray-700">
                              {getCompatibilityMessage(careerTransition.overallCompatibility)}
                            </p>
                            {careerTransition.analysisMetadata && (
                              <div className="mt-3 text-xs text-gray-500 flex items-center">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Analyse IA en {careerTransition.analysisMetadata.analysisTimeSeconds?.toFixed(1)}s
                                {careerTransition.analysisMetadata.aiServiceUsed ? ' (IA Gemini)' : ' (Fallback)'}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Compétences Transférables */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <CheckCircle className="w-6 h-6 mr-3 text-green-500" />
                              Compétences Transférables ({careerTransition.transferableSkills.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {careerTransition.transferableSkills.map((skill, index) => (
                                <motion.div
                                  key={skill.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="p-4 border-2 rounded-lg hover:shadow-md transition-all duration-200 bg-white"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-gray-800">{skill.name}</h4>
                                    <Badge className={categoryColors[skill.category]}>
                                      {skill.category}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-medium">Confiance</span>
                                      <span className="font-bold text-green-600">{skill.confidenceScore}%</span>
                                    </div>
                                    <Progress value={skill.confidenceScore} className="h-2" />
                                    {skill.examples && skill.examples.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">Exemples:</p>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                          {skill.examples.slice(0, 2).map((example, idx) => (
                                            <li key={idx} className="flex items-start">
                                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                              {example}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Lacunes de Compétences */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <AlertCircle className="w-6 h-6 mr-3 text-orange-500" />
                              Domaines à Développer ({careerTransition.skillGaps.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {careerTransition.skillGaps.map((gap, index) => (
                                <motion.div
                                  key={gap.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`p-4 border-l-4 ${importanceColors[gap.importance]} rounded-r-lg`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-gray-800">{gap.skill}</h4>
                                    <Badge variant="outline" className={`${importanceColors[gap.importance]} border-current`}>
                                      {gap.importance === 'high' ? 'Priorité Haute' : gap.importance === 'medium' ? 'Priorité Moyenne' : 'Priorité Basse'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2 font-medium">{gap.suggestion}</p>
                                  <p className="text-xs text-gray-600 italic">{gap.howToAddress}</p>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Ponts Narratifs */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <ArrowRight className="w-6 h-6 mr-3 text-blue-500" />
                              Ponts Narratifs ({careerTransition.narrativeBridges.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {careerTransition.narrativeBridges.map((bridge, index) => (
                                <motion.div
                                  key={bridge.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-blue-900">{bridge.title}</h4>
                                    <div className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                      {bridge.strength}% de pertinence
                                    </div>
                                  </div>
                                  <p className="text-sm text-blue-800 mb-3 font-medium">{bridge.description}</p>
                                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                                    <p className="text-xs text-gray-500 mb-2 font-medium">Exemple d'utilisation :</p>
                                    <p className="text-sm italic text-gray-800 leading-relaxed">"{bridge.example}"</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Recommandations */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <Lightbulb className="w-6 h-6 mr-3 text-yellow-500" />
                              Recommandations Clés
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              {careerTransition.recommendations.map((rec, index) => (
                                <motion.li
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-start p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                                >
                                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 leading-relaxed">{rec}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}