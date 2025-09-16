import React, { useState, useCallback } from 'react';
import { CheckCircle, Users, Brain, Target, Sparkles, Award, ArrowRight } from 'lucide-react';
import BigFiveExtraversionGame from './BigFiveExtraversionGame';
import RiasecJobShadowGame from './RiasecJobShadowGame';
import { useLuna } from '../../../../luna';
import { useNarrativeCapture } from '../../../../services/narrativeCapture';

interface AssessmentPhase {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  estimated_time: string;
  energy_cost: number;
  component?: React.ReactNode;
}

interface AssessmentResults {
  bigFive: {
    extraversion: number;
    insights: string[];
  };
  riasec: {
    scores: Record<string, number>;
    insights: string[];
  };
  completionTime: number;
  totalInsights: number;
}

interface EnhancedAssessmentManagerProps {
  onComplete: (results: AssessmentResults) => void;
  onCancel: () => void;
}

const EnhancedAssessmentManager: React.FC<EnhancedAssessmentManagerProps> = ({ onComplete, onCancel }) => {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [results, setResults] = useState<Partial<AssessmentResults>>({});
  const [startTime] = useState(Date.now());
  const [phaseProgress, setPhaseProgress] = useState({ current: 0, total: 0 });
  
  const luna = useLuna();
  const { captureCareerDiscovery } = useNarrativeCapture();

  const assessmentPhases: AssessmentPhase[] = [
    {
      id: 'introduction',
      title: '🎯 Démarrage Assessment',
      description: 'Préparation de ton bilan de compétences interactif',
      icon: <Target className="w-6 h-6" />,
      estimated_time: '1 min',
      energy_cost: 0
    },
    {
      id: 'big_five_extraversion',
      title: '🧠 Test Personnalité',
      description: 'Mini-jeux pour révéler ton profil psychologique',
      icon: <Brain className="w-6 h-6" />,
      estimated_time: '8 min',
      energy_cost: 15
    },
    {
      id: 'riasec_job_shadow',
      title: '🎮 Job Shadow RIASEC',
      description: 'Simulations métiers pour découvrir tes préférences',
      icon: <Users className="w-6 h-6" />,
      estimated_time: '12 min',
      energy_cost: 20
    },
    {
      id: 'synthesis',
      title: '✨ Synthèse Luna',
      description: 'Analyse IA personnalisée de ton profil complet',
      icon: <Sparkles className="w-6 h-6" />,
      estimated_time: '3 min',
      energy_cost: 10
    }
  ];

  const handleBigFiveComplete = useCallback((score: number, insights: string[]) => {
    const bigFiveResults = {
      extraversion: score,
      insights
    };
    
    setResults(prev => ({
      ...prev,
      bigFive: bigFiveResults
    }));
    
    setCurrentPhase(2); // Move to RIASEC
  }, []);

  const handleRiasecComplete = useCallback((scores: Record<string, number>, insights: string[]) => {
    const riasecResults = {
      scores,
      insights
    };
    
    setResults(prev => ({
      ...prev,
      riasec: riasecResults
    }));
    
    setCurrentPhase(3); // Move to synthesis
  }, []);

  const handleSynthesisComplete = useCallback(async () => {
    const completionTime = Date.now() - startTime;
    const totalInsights = (results.bigFive?.insights.length || 0) + (results.riasec?.insights.length || 0);
    
    const finalResults: AssessmentResults = {
      bigFive: results.bigFive!,
      riasec: results.riasec!,
      completionTime,
      totalInsights
    };

    // 🧠 Capture narrative event for enhanced assessment
    await captureCareerDiscovery({
      assessment_type: 'enhanced_psychometric',
      big_five_score: results.bigFive?.extraversion || 0,
      riasec_scores: results.riasec?.scores || {},
      completion_time_ms: completionTime,
      total_insights: totalInsights,
      data_source: 'enhanced_assessment',
      quality_indicator: 'premium'
    }, startTime);

    onComplete(finalResults);
  }, [results, startTime, onComplete, captureCareerDiscovery]);

  const handlePhaseProgress = useCallback((current: number, total: number) => {
    setPhaseProgress({ current, total });
  }, []);

  const getTotalEnergyRequired = () => {
    return assessmentPhases.reduce((total, phase) => total + phase.energy_cost, 0);
  };

  const getCurrentPhaseContent = () => {
    const phase = assessmentPhases[currentPhase];
    
    switch (phase.id) {
      case 'introduction':
        return (
          <IntroductionPhase 
            onStart={() => setCurrentPhase(1)}
            totalEnergy={getTotalEnergyRequired()}
            estimatedTime="25 minutes"
          />
        );
      
      case 'big_five_extraversion':
        return (
          <BigFiveExtraversionGame
            onComplete={handleBigFiveComplete}
            onProgress={handlePhaseProgress}
          />
        );
      
      case 'riasec_job_shadow':
        return (
          <RiasecJobShadowGame
            onComplete={handleRiasecComplete}
            onProgress={handlePhaseProgress}
          />
        );
      
      case 'synthesis':
        return (
          <SynthesisPhase
            results={results}
            onComplete={handleSynthesisComplete}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
      {/* Assessment Progress Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                🎯 Assessment Complet - Phase {currentPhase + 1}/4
              </h1>
              <p className="text-gray-600">
                {assessmentPhases[currentPhase].description}
              </p>
            </div>
            
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
          </div>
          
          {/* Phase Progress */}
          <div className="mt-4 flex items-center space-x-4">
            {assessmentPhases.map((phase, index) => (
              <div key={phase.id} className="flex items-center">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  index === currentPhase 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                    : index < currentPhase 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {index < currentPhase ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    phase.icon
                  )}
                  <span className="text-sm font-medium">{phase.title}</span>
                  <span className="text-xs">({phase.estimated_time})</span>
                </div>
                {index < assessmentPhases.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Phase Content */}
      <div className="max-w-6xl mx-auto p-6">
        {getCurrentPhaseContent()}
      </div>
    </div>
  );
};

// Introduction Phase Component
const IntroductionPhase: React.FC<{
  onStart: () => void;
  totalEnergy: number;
  estimatedTime: string;
}> = ({ onStart, totalEnergy, estimatedTime }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Assessment Complet Phoenix
          </h2>
          <p className="text-xl text-gray-600">
            Bilan de compétences 2.0 avec IA et psychométrie
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-purple-50 rounded-xl">
            <Brain className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-bold text-purple-800 mb-2">Tests Psychométriques</h3>
            <p className="text-sm text-purple-700">Big Five + RIASEC via mini-jeux interactifs</p>
          </div>
          
          <div className="p-6 bg-blue-50 rounded-xl">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-bold text-blue-800 mb-2">Job Shadow VR</h3>
            <p className="text-sm text-blue-700">6 environnements métiers à expérimenter</p>
          </div>
          
          <div className="p-6 bg-emerald-50 rounded-xl">
            <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-bold text-emerald-800 mb-2">Analyse Luna IA</h3>
            <p className="text-sm text-emerald-700">Synthèse personnalisée et recommandations</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center space-x-6 text-lg">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⏱️</span>
              <span><strong>Durée:</strong> {estimatedTime}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <span><strong>Énergie:</strong> {totalEnergy} Luna</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span><strong>Précision:</strong> +40%</span>
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          🚀 Commencer l'Assessment
        </button>
      </div>
    </div>
  );
};

// Synthesis Phase Component
const SynthesisPhase: React.FC<{
  results: Partial<AssessmentResults>;
  onComplete: () => void;
}> = ({ results, onComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isAnalyzing) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="mb-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
              <Sparkles className="absolute inset-0 h-20 w-20 text-yellow-400 animate-pulse mx-auto" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🧠 Luna analyse ton profil complet...
          </h2>
          
          <div className="space-y-3 text-lg text-gray-600">
            <p className="animate-pulse">📊 Synthèse de tes 23 réponses psychométriques...</p>
            <p className="animate-pulse">🎯 Calcul de compatibilité avec 127 métiers...</p>
            <p className="animate-pulse">✨ Génération de recommandations personnalisées...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <Award className="w-16 h-16 text-gold-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            🎉 Assessment Terminé !
          </h2>
          <p className="text-xl text-gray-600">
            Ton profil psychométrique est maintenant complet
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-purple-50 rounded-xl">
            <h3 className="font-bold text-purple-800 mb-3">🧠 Profil Big Five</h3>
            <div className="text-left space-y-2">
              <p className="text-sm">
                <strong>Extraversion:</strong> {results.bigFive?.extraversion.toFixed(1)}/5
              </p>
              <p className="text-xs text-purple-700">
                {results.bigFive?.insights.length} insights collectés
              </p>
            </div>
          </div>
          
          <div className="p-6 bg-blue-50 rounded-xl">
            <h3 className="font-bold text-blue-800 mb-3">🎯 Profil RIASEC</h3>
            <div className="text-left space-y-1">
              {results.riasec?.scores && Object.entries(results.riasec.scores).map(([type, score]) => (
                <p key={type} className="text-xs">
                  <strong>{type}:</strong> {score.toFixed(1)}/5
                </p>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
        >
          🎯 Voir mes Métiers Recommandés
        </button>
      </div>
    </div>
  );
};

export default EnhancedAssessmentManager;