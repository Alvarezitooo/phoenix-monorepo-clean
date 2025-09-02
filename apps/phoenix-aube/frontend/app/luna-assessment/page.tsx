'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAssessmentStore } from '@/lib/store';
import { phoenixAubeApi } from '@/lib/api';
import LunaChat from '@/components/luna/LunaChat';
import { MoodCheck, DuoEclair, TerritoryCards } from '@/components/luna/MicroExercises';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Types pour le parcours Luna
type LunaStep = 'welcome' | 'mood' | 'duos' | 'territories' | 'results' | 'escalation';
type LunaPersona = 'reconversion' | 'jeune_diplome' | 'pivot_tech' | 'ops_data' | 'reprise';

interface LunaResults {
  persona: LunaPersona;
  mood: string;
  timePreference: string;
  duos: Record<string, string>;
  territories: string[];
  recommendations: string[];
  escalationSuggested?: 'court' | 'profond';
}

export default function LunaAssessmentPage() {
  const router = useRouter();
  const { user, setUser } = useAssessmentStore();
  
  // État Luna
  const [currentStep, setCurrentStep] = useState<LunaStep>('welcome');
  const [persona, setPersona] = useState<LunaPersona>('jeune_diplome');
  const [lunaResults, setLunaResults] = useState<LunaResults>({
    persona: 'jeune_diplome',
    mood: '',
    timePreference: '',
    duos: {},
    territories: [],
    recommendations: []
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());

  // Détecter persona automatiquement (futur: basé sur l'historique utilisateur)
  useEffect(() => {
    // Pour l'instant, persona par défaut ou détection simple
    // TODO: Intégrer avec Luna Hub pour récupérer l'historique utilisateur
    setPersona('jeune_diplome');
    setStartTime(new Date());
  }, []);

  // Gestion des étapes Ultra-Light (60s)
  const handleMoodResponse = (mood: string, timeAvailable: string) => {
    setLunaResults(prev => ({
      ...prev,
      mood,
      timePreference: timeAvailable
    }));
    
    // Adaptation selon l'humeur
    if (mood === 'fatigue' && timeAvailable === '60s') {
      // Mode ultra-doux pour personnes fatiguées
      setPersona('reconversion');
    }
    
    setCurrentStep('duos');
  };

  const handleDuosResponse = (duos: Record<string, string>) => {
    setLunaResults(prev => ({
      ...prev,
      duos
    }));
    setCurrentStep('territories');
  };

  const handleTerritoriesResponse = async (territories: string[]) => {
    setLunaResults(prev => ({
      ...prev,
      territories
    }));
    
    // Génération immédiate des recommandations Ultra-Light
    setIsGenerating(true);
    setCurrentStep('results');
    
    try {
      // Appel API pour recommandations rapides (0 énergie)
      const quickRecs = await generateQuickRecommendations({
        ...lunaResults,
        territories
      });
      
      setLunaResults(prev => ({
        ...prev,
        recommendations: quickRecs,
        escalationSuggested: determineEscalation(prev.mood, prev.timePreference)
      }));
    } catch (error) {
      console.error('Quick recommendations failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Génération recommandations rapides (algorithme local, pas Luna Hub)
  const generateQuickRecommendations = async (data: Partial<LunaResults>): Promise<string[]> => {
    // Simulation algorithme local basé sur les réponses
    const { duos, territories } = data;
    
    let recommendations: string[] = [];
    
    // Logique simplifiée basée sur les choix
    if (duos?.people_data === 'people' && territories?.includes('design_humain')) {
      recommendations.push('UX Designer', 'Product Manager', 'Service Designer');
    }
    if (duos?.people_data === 'data' && territories?.includes('produit_data')) {
      recommendations.push('Data Analyst', 'Product Analyst', 'Business Intelligence');
    }
    if (territories?.includes('ops_organisation')) {
      recommendations.push('Product Operations', 'Project Manager', 'Business Analyst');
    }
    
    // Fallbacks génériques
    if (recommendations.length === 0) {
      recommendations = ['Product Manager', 'UX Designer', 'Data Analyst'];
    }
    
    return recommendations.slice(0, 3); // Top 3 pour Ultra-Light
  };

  const determineEscalation = (mood: string, timePreference: string): 'court' | 'profond' | undefined => {
    if (mood === 'fatigue') return undefined;
    if (timePreference === 'plus_tard') return undefined;
    if (mood === 'energise') return 'profond';
    return 'court';
  };

  const handleEscalation = (level: 'court' | 'profond') => {
    // Redirection vers assessment complet avec contexte Luna
    router.push(`/assessment?luna_context=${level}&persona=${persona}`);
  };

  const getElapsedTime = () => {
    const now = new Date();
    const elapsed = Math.round((now.getTime() - startTime.getTime()) / 1000);
    return elapsed;
  };

  // Protection: rediriger si pas connecté
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <span className="text-4xl mb-4 block">🌙</span>
            <h2 className="text-xl font-semibold mb-4">Connexion requise</h2>
            <p className="text-gray-600 mb-6">
              Luna a besoin de te connaître pour personnaliser l'expérience
            </p>
            <Link href="/login">
              <Button className="w-full">Se connecter</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              <Clock className="w-3 h-3 mr-1" />
              {getElapsedTime()}s
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-300">
              0 énergie
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale - Exercices */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 'welcome' && (
              <Card className="text-center py-8">
                <CardContent>
                  <span className="text-6xl mb-4 block">🌅</span>
                  <h1 className="text-2xl font-bold text-purple-900 mb-4">
                    Phoenix Aube - Découverte Luna
                  </h1>
                  <p className="text-gray-600 mb-6">
                    3 micro-exercices, 60 secondes, 0% énergie.<br/>
                    Tu peux passer à tout moment ✅
                  </p>
                  <Button 
                    onClick={() => setCurrentStep('mood')}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Commencer avec Luna
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === 'mood' && (
              <MoodCheck 
                onResponse={handleMoodResponse}
              />
            )}

            {currentStep === 'duos' && (
              <DuoEclair 
                onResponse={handleDuosResponse}
              />
            )}

            {currentStep === 'territories' && (
              <TerritoryCards 
                onResponse={handleTerritoriesResponse}
              />
            )}

            {currentStep === 'results' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🎯</span>
                    <span>Tes 3 premières pistes</span>
                    <Badge className="ml-auto">{getElapsedTime()}s chrono</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse flex items-center justify-center space-x-2">
                        <span>🌙</span>
                        <span>Luna analyse tes réponses...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lunaResults.recommendations.map((job, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-purple-900">{job}</h3>
                              <p className="text-sm text-purple-700">
                                Match basé sur tes appétences {lunaResults.duos.people_data === 'people' ? 'humaines' : 'analytiques'}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-purple-400" />
                          </div>
                        </div>
                      ))}
                      
                      {/* Escalation suggestion */}
                      {lunaResults.escalationSuggested && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                          <h4 className="font-semibold text-orange-900 mb-2">
                            🚀 Envie d'aller plus loin ?
                          </h4>
                          <p className="text-sm text-orange-800 mb-3">
                            Luna peut creuser avec toi pour des recommandations plus précises et un plan IA personnalisé.
                          </p>
                          <Button
                            onClick={() => handleEscalation(lunaResults.escalationSuggested!)}
                            variant="outline"
                            className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                          >
                            Oui, on creuse ! (Assessment complet)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Chat Luna */}
          <div className="space-y-6">
            <LunaChat 
              persona={persona}
              currentStep={currentStep}
              onEscalation={(level) => handleEscalation(level as 'court' | 'profond')}
            />
            
            {/* Progress indicator */}
            <Card className="p-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Parcours Ultra-Light</h4>
              <div className="space-y-2">
                {[
                  { id: 'mood', label: 'Humeur & temps', completed: ['duos', 'territories', 'results'].includes(currentStep) },
                  { id: 'duos', label: 'Duos éclair', completed: ['territories', 'results'].includes(currentStep) },
                  { id: 'territories', label: 'Territoires', completed: currentStep === 'results' }
                ].map((step) => (
                  <div key={step.id} className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      step.completed ? "bg-purple-500" : "bg-gray-300"
                    )} />
                    <span className={cn(
                      "text-sm transition-colors",
                      step.completed ? "text-purple-700 font-medium" : "text-gray-500"
                    )}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}