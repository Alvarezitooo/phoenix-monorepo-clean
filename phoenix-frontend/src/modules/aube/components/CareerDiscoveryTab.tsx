import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Target, Check, TrendingUp, MapPin, Users, Route, ArrowRight, Sparkles, Brain, Award } from 'lucide-react';
import { useCareerDiscovery, CareerSuggestion } from '../hooks/useCareerDiscovery';
import { useLuna } from '../../../luna';
import LunaAssessmentChat from './LunaAssessmentChat';
import EnhancedAssessmentManager from './psychometric/EnhancedAssessmentManager';
import RoadmapChoiceComponent from './RoadmapChoiceComponent';

const CareerDiscoveryTab = memo(() => {
  const navigate = useNavigate();
  const luna = useLuna();
  const { form, results, isAnalyzing, updateForm, analyzeCareer } = useCareerDiscovery();
  const [selectedCareer, setSelectedCareer] = useState<CareerSuggestion | null>(null);
  const [showLunaAssessment, setShowLunaAssessment] = useState(true); // Show Luna by default
  const [assessmentMode, setAssessmentMode] = useState<'quick' | 'enhanced' | null>(null);
  const [showRoadmapChoice, setShowRoadmapChoice] = useState(false);
  const [psychometricResults, setPsychometricResults] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🛡️ Race condition protection
    if (isAnalyzing) {
      return;
    }
    
    try {
      await analyzeCareer(form);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'analyse');
    }
  };

  const handleChooseCareer = (career: CareerSuggestion) => {
    setSelectedCareer(career);
    setShowRoadmapChoice(true);
  };

  const handleRoadmapSelected = (roadmap: any) => {
    // Final save with complete data
    luna.setCareerChoice({
      selectedCareer,
      chosenRoadmap: roadmap,
      psychometricResults,
      allCareers: results || [],
      choiceTimestamp: Date.now(),
      sourceModule: 'aube'
    });
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const handleEnhancedAssessmentComplete = (results: any) => {
    // Store psychometric results
    setPsychometricResults(results);
    
    // For enhanced assessment, we bypass the quick discovery
    // and go straight to personalized career matching
    // The assessment already contains career preferences
    console.log('Enhanced assessment results:', results);
    
    // Mock a career suggestion based on enhanced assessment
    const enhancedCareer = {
      title: "Data Analyst", // This would come from AI analysis
      compatibility: 94,
      sector: "Technology",
      description: "Analyse des données pour éclairer les décisions business",
      skills: ["Python", "SQL", "Statistiques", "Communication"],
      salaryRange: "45k-65k€",
      demand: "Très forte",
      transitionTime: "6-12 mois"
    };
    
    setSelectedCareer(enhancedCareer);
    setShowRoadmapChoice(true);
  };

  // If roadmap choice is active, show roadmap selection
  if (showRoadmapChoice && selectedCareer) {
    return (
      <RoadmapChoiceComponent
        selectedCareer={selectedCareer}
        psychometricResults={psychometricResults}
        onRoadmapSelected={handleRoadmapSelected}
        onBack={() => {
          setShowRoadmapChoice(false);
          setSelectedCareer(null);
        }}
      />
    );
  }

  // If enhanced assessment is active, show full-screen component
  if (assessmentMode === 'enhanced') {
    return (
      <EnhancedAssessmentManager
        onComplete={handleEnhancedAssessmentComplete}
        onCancel={() => setAssessmentMode(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Assessment Mode Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            🎯 Choisissez votre type d'analyse
          </h3>
          <p className="text-gray-600">
            Mode rapide ou assessment complet avec tests psychométriques
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Quick Mode */}
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-400 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Mode Rapide</h4>
              <p className="text-gray-600 mb-4">Découverte métiers en 5 minutes</p>
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <p>⏱️ 5 minutes</p>
                <p>⚡ 15 énergie Luna</p>
                <p>🎯 Résultats immédiats</p>
              </div>
              <button
                onClick={() => setAssessmentMode('quick')}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all"
              >
                Commencer l'analyse rapide
              </button>
            </div>
          </div>
          
          {/* Enhanced Mode */}
          <div className="border-2 border-purple-300 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 relative">
            <div className="absolute top-3 right-3">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-purple-800 mb-2">Assessment Complet</h4>
              <p className="text-purple-700 mb-4">Bilan psychométrique professionnel</p>
              <div className="space-y-2 text-sm text-purple-600 mb-4">
                <p>⏱️ 25 minutes</p>
                <p>⚡ 45 énergie Luna</p>
                <p>🧠 Tests Big Five + RIASEC</p>
                <p>✨ Précision +40%</p>
              </div>
              <button
                onClick={() => setAssessmentMode('enhanced')}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
              >
                🎯 Assessment Premium
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Mode Interface */}
      {assessmentMode === 'quick' && (
        <>
          {/* Toggle between Luna Assessment and Classic Form */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setShowLunaAssessment(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showLunaAssessment 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                Assessment Luna
              </button>
              <button
                onClick={() => setShowLunaAssessment(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !showLunaAssessment 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                <Target className="h-4 w-4 inline mr-2" />
                Formulaire Rapide
              </button>
            </div>
          </div>
        </>
      )}

      {/* Luna Assessment Chat - Only show if quick mode selected */}
      {assessmentMode === 'quick' && showLunaAssessment ? (
        <LunaAssessmentChat />
      ) : assessmentMode === 'quick' && !showLunaAssessment ? (
        /* Classic Form */
        <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre poste actuel *
                </label>
                <input
                  type="text"
                  value={form.currentJob}
                  onChange={(e) => updateForm('currentJob', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Chef de projet, Développeur, Commercial..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur d'activité *
                </label>
                <input
                  type="text"
                  value={form.currentSector}
                  onChange={(e) => updateForm('currentSector', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Tech, Finance, Santé, Retail..."
                  required
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau d'expérience
                </label>
                <select
                  value={form.experience}
                  onChange={(e) => updateForm('experience', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez...</option>
                  <option value="0-2 ans">0-2 ans (Junior)</option>
                  <option value="2-5 ans">2-5 ans (Intermédiaire)</option>
                  <option value="5+ ans">5+ ans (Senior/Expert)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Centres d'intérêt professionnels
                </label>
                <input
                  type="text"
                  value={form.interests}
                  onChange={(e) => updateForm('interests', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Innovation, Management, Design, Data..."
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="relative flex items-center space-x-2">
                      <div className="relative">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                        <Sparkles className="absolute inset-0 h-5 w-5 text-yellow-200 animate-pulse" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Luna analyse votre profil...</span>
                        <span className="text-xs text-orange-200 animate-pulse">
                          {["🧠 Lecture de vos réponses", "🎯 Calcul compatibilités", "✨ Génération recommandations"][Math.floor(Date.now()/2000) % 3]}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Target className="h-5 w-5" />
                    <span>Découvrir mes métiers compatibles</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Results Section - Only show for quick mode */}
      {assessmentMode === 'quick' && results && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              🎯 Vos métiers les plus compatibles
            </h3>
            <p className="text-gray-600">
              Basé sur votre profil et vos compétences actuelles
            </p>
          </div>
          
          <div className="grid gap-6">
            {results.map((career, index) => (
              <CareerCard 
                key={career.title} 
                career={career} 
                rank={index + 1}
                onChoose={handleChooseCareer}
                isSelected={selectedCareer?.title === career.title}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const CareerCard = memo(({ 
  career, 
  rank, 
  onChoose, 
  isSelected 
}: { 
  career: CareerSuggestion;
  rank: number;
  onChoose: (career: CareerSuggestion) => void;
  isSelected: boolean;
}) => {
  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    if (score >= 80) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 70) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {rank}
            </div>
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-800">{career.title}</h4>
            <p className="text-gray-600">{career.sector}</p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-full border-2 ${getCompatibilityColor(career.compatibility)}`}>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span className="font-bold">{career.compatibility}%</span>
          </div>
        </div>
      </div>
      
      <p className="text-gray-700 mb-4">{career.description}</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Demande</span>
          </div>
          <p className="text-sm text-blue-700">{career.demand}</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Salaire</span>
          </div>
          <p className="text-sm text-green-700">{career.salaryRange}</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <MapPin className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Transition</span>
          </div>
          <p className="text-sm text-purple-700">{career.transitionTime}</p>
        </div>
        
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Compatibilité</span>
          </div>
          <p className="text-sm text-orange-700">Excellente</p>
        </div>
      </div>
      
      <div className="mb-4">
        <h5 className="font-semibold text-gray-800 mb-2">Compétences clés :</h5>
        <div className="flex flex-wrap gap-2">
          {career.skills.map((skill, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex space-x-2">
        <button 
          onClick={() => onChoose(career)}
          className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            isSelected 
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg' 
              : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg hover:from-orange-600 hover:to-red-700'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4" />
              <span>✅ Choisi</span>
            </>
          ) : (
            <>
              <Route className="w-4 h-4" />
              <span>🎯 Choisir ce métier</span>
            </>
          )}
        </button>
        <button 
          className="px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 flex items-center justify-center"
          title="Plus de détails sur ce métier"
        >
          <span className="text-sm font-medium">📋 Détails</span>
        </button>
      </div>
    </div>
  );
});

CareerDiscoveryTab.displayName = 'CareerDiscoveryTab';
CareerCard.displayName = 'CareerCard';

export default CareerDiscoveryTab;