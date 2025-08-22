import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Briefcase, 
  User, 
  MessageSquare, 
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { FormData } from '@/types';
import { CareerTransitionSection } from './CareerTransitionSection';
import { LunaInteractionPoint } from '@/components/Luna';

interface GenerationFormProps {
  onSubmit: (data: FormData) => void;
  isGenerating: boolean;
}

export function GenerationForm({ onSubmit, isGenerating }: GenerationFormProps) {
  const { formData, updateFormData } = useStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCareerTransition, setShowCareerTransition] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const experienceLevels = [
    { value: 'junior', label: 'Junior (0-2 years)' },
    { value: 'intermediate', label: 'Intermediate (2-5 years)' },
    { value: 'senior', label: 'Senior (5+ years)' },
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'creative', label: 'Creative' },
    { value: 'casual', label: 'Casual' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.positionTitle.trim()) {
      newErrors.positionTitle = 'Position title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    updateFormData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-gradient-primary flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Generate Your Perfect Cover Letter
            <LunaInteractionPoint
              variant="prominent"
              tooltipText="Luna peut vous aider à optimiser votre lettre"
              contextMessage="📝 Je suis là pour vous aider à créer la lettre de motivation parfaite ! Je peux vous donner des conseils sur les informations à remplir, analyser votre offre d'emploi, ou vous suggérer le bon ton à adopter. Comment puis-je vous accompagner ?"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="company" className="flex items-center text-sm font-medium">
                  <Building className="w-4 h-4 mr-2" />
                  Company Name *
                </Label>
                <Input
                  id="company"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="e.g., Google, Microsoft, Tesla"
                  className={errors.companyName ? 'border-red-500' : ''}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="position" className="flex items-center text-sm font-medium">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Position Title *
                </Label>
                <Input
                  id="position"
                  value={formData.positionTitle}
                  onChange={(e) => handleInputChange('positionTitle', e.target.value)}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  className={errors.positionTitle ? 'border-red-500' : ''}
                />
                {errors.positionTitle && (
                  <p className="text-red-500 text-xs mt-1">{errors.positionTitle}</p>
                )}
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label className="flex items-center text-sm font-medium">
                  <User className="w-4 h-4 mr-2" />
                  Experience Level
                </Label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value: any) => handleInputChange('experienceLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label className="flex items-center text-sm font-medium">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Letter Tone
                </Label>
                <Select
                  value={formData.tone}
                  onValueChange={(value: any) => handleInputChange('tone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            </div>

            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="description" className="text-sm font-medium">
                Description du Poste (Optionnel)
              </Label>
              <Textarea
                id="description"
                value={formData.jobDescription}
                onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                placeholder="Collez la description du poste ici pour obtenir une lettre plus personnalisée..."
                rows={4}
                className="resize-none"
              />
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>{formData.jobDescription.length} caractères</span>
                {formData.jobDescription.length > 0 && (
                  <span className="text-green-600">✓ Description ajoutée - lettre plus personnalisée</span>
                )}
              </div>
            </motion.div>

            {/* 🎯 GAME CHANGER - Career Transition Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative"
            >
              {!showCareerTransition && (
                <motion.div 
                  className="mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCareerTransition(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100 text-purple-700 font-medium py-6"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>🎯 Découvrir l'Analyse de Transition de Carrière</span>
                    <div className="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
                      NOUVEAU
                    </div>
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Identifiez vos compétences transférables et optimisez votre candidature
                  </p>
                </motion.div>
              )}
              <CareerTransitionSection 
                isExpanded={showCareerTransition} 
                onToggle={() => setShowCareerTransition(!showCareerTransition)} 
              />
            </motion.div>

            {/* Advanced Options */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-sm font-medium p-0 h-auto hover:bg-transparent"
              >
                <Settings className="w-4 h-4 mr-2" />
                Options Avancées
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2" />
                )}
              </Button>

              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-4"
                >
                  <div>
                    <Label className="text-sm font-medium">
                      Nombre de mots cible: {formData.wordCount} mots
                    </Label>
                    <input
                      type="range"
                      min="200"
                      max="500"
                      value={formData.wordCount}
                      onChange={(e) => handleInputChange('wordCount', parseInt(e.target.value))}
                      className="w-full mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>200 mots</span>
                      <span>500 mots</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.includeAchievements}
                        onChange={(e) => handleInputChange('includeAchievements', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Inclure les réalisations</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.includeMotivation}
                        onChange={(e) => handleInputChange('includeMotivation', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Focus sur la motivation</span>
                    </label>
                  </div>

                  <div>
                    <Label htmlFor="instructions" className="text-sm font-medium">
                      Instructions Personnalisées
                    </Label>
                    <Textarea
                      id="instructions"
                      value={formData.customInstructions}
                      onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                      placeholder="Exigences spécifiques ou détails que vous aimeriez inclure..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="pt-4"
            >
              <Button
                type="submit"
                size="lg"
                className="w-full md:w-auto px-8 py-3 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Génération en cours...
                  </div>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Générer Ma Lettre de Motivation
                  </>
                )}
              </Button>
              
              {/* Indicateur de fonctionnalités */}
              <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-500">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  IA Gemini
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Personnalisé
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Skill Mapping
                </div>
              </div>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}