import React, { memo } from 'react';
import { Route, ArrowRight, Briefcase, Building, Loader2, TrendingUp, Target, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useCareerTransition } from '../hooks/useCareerTransition';

const CareerTransitionTab = memo(() => {
  const { 
    form, 
    result, 
    isAnalyzing, 
    updateForm, 
    analyzeTransition,
    getDifficultyLevel,
    getSuccessProbability,
    getPriorityIcon
  } = useCareerTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await analyzeTransition(form);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'analyse');
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <div className="flex items-center space-x-3 mb-6">
          <Route className="h-8 w-8 text-purple-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Analyse de Transition de Carrière</h3>
            <p className="text-gray-600">Obtenez un plan personnalisé pour votre évolution professionnelle</p>
          </div>
          <div className="px-3 py-1 bg-purple-100 rounded-full text-sm font-medium text-purple-700">25⚡</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Role */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="h-4 w-4 inline mr-2" />
                Poste actuel *
              </label>
              <input
                type="text"
                value={form.previous_role}
                onChange={(e) => updateForm('previous_role', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Développeur Frontend"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Secteur actuel
              </label>
              <input
                type="text"
                value={form.previous_industry}
                onChange={(e) => updateForm('previous_industry', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Technologie, Finance..."
              />
            </div>
          </div>

          {/* Target Role */}
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-lg font-semibold text-purple-600">Transition vers</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="h-4 w-4 inline mr-2" />
                Poste visé *
              </label>
              <input
                type="text"
                value={form.target_role}
                onChange={(e) => updateForm('target_role', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Product Manager"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Secteur visé
              </label>
              <input
                type="text"
                value={form.target_industry}
                onChange={(e) => updateForm('target_industry', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: FinTech, E-commerce..."
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Luna analyse votre transition...</span>
                </>
              ) : (
                <>
                  <Route className="h-5 w-5" />
                  <span>Analyser la transition</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <TransitionResults 
          result={result} 
          getDifficultyLevel={getDifficultyLevel}
          getSuccessProbability={getSuccessProbability}
          getPriorityIcon={getPriorityIcon}
        />
      )}
    </div>
  );
});

const TransitionResults = memo(({ 
  result, 
  getDifficultyLevel, 
  getSuccessProbability, 
  getPriorityIcon 
}: {
  result: any;
  getDifficultyLevel: (level: number) => { label: string, color: string };
  getSuccessProbability: (prob: number) => { label: string, color: string };
  getPriorityIcon: (priority: string) => string;
}) => {
  const difficultyInfo = getDifficultyLevel(result.difficulty_level);
  const successInfo = getSuccessProbability(result.success_probability);

  return (
    <div className="space-y-8">
      {/* Success Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-purple-700">{result.success_probability}%</div>
              <div className="text-sm font-medium text-purple-600">Probabilité de réussite</div>
            </div>
          </div>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium bg-${successInfo.color}-100 text-${successInfo.color}-700`}>
            {successInfo.label}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <div>
              <div className="text-2xl font-bold text-orange-700">{result.difficulty_level}/10</div>
              <div className="text-sm font-medium text-orange-600">Niveau de difficulté</div>
            </div>
          </div>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium bg-${difficultyInfo.color}-100 text-${difficultyInfo.color}-700`}>
            {difficultyInfo.label}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Clock className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-700">12-18</div>
              <div className="text-sm font-medium text-green-600">Mois estimés</div>
            </div>
          </div>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Transition complète
          </span>
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center space-x-3 mb-6">
          <Route className="h-8 w-8 text-blue-500" />
          <h3 className="text-2xl font-bold text-gray-800">📊 Analyse Détaillée</h3>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <pre className="whitespace-pre-wrap text-sm text-blue-800 leading-relaxed font-sans">
            {result.analysis}
          </pre>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Transferable Skills */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <h4 className="text-lg font-bold text-emerald-800">✅ Compétences Transférables</h4>
          </div>
          
          <div className="space-y-2">
            {result.transferable_skills.map((skill: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-emerald-800">{skill}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gaps */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h4 className="text-lg font-bold text-orange-800">⚠️ Compétences à Développer</h4>
          </div>
          
          <div className="space-y-2">
            {result.skill_gaps.map((gap: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-orange-800">{gap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transition Roadmap */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <div className="flex items-center space-x-3 mb-6">
          <Route className="h-8 w-8 text-purple-600" />
          <h3 className="text-2xl font-bold text-purple-800">🗺️ Feuille de Route</h3>
        </div>
        
        <div className="space-y-6">
          {result.transition_roadmap.map((phase: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPriorityIcon(phase.priority)}</span>
                  <div>
                    <h5 className="text-lg font-semibold text-gray-800">{phase.phase}</h5>
                    <span className="text-sm text-gray-600">{phase.duration}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  phase.priority === 'high' ? 'bg-red-100 text-red-700' :
                  phase.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  Priorité {phase.priority === 'high' ? 'élevée' : phase.priority === 'medium' ? 'moyenne' : 'faible'}
                </span>
              </div>
              
              <div className="space-y-2">
                {phase.actions.map((action: string, actionIndex: number) => (
                  <div key={actionIndex} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Energy Usage */}
      <div className="text-center">
        <span className="text-sm text-purple-600">
          {result.energy_consumed}⚡ énergie consommée pour cette analyse
        </span>
      </div>
    </div>
  );
});

CareerTransitionTab.displayName = 'CareerTransitionTab';
TransitionResults.displayName = 'TransitionResults';

export default CareerTransitionTab;