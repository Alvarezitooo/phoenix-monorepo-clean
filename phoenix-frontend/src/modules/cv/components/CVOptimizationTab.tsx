import React, { memo } from 'react';
import { Zap, Loader2, CheckCircle, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import { useCVOptimization, CVOptimizationResult } from '../hooks/useCVOptimization';

const CVOptimizationTab = memo(() => {
  const { form, result, isOptimizing, updateForm, optimizeCV, getSectionColor, getImprovementIcon } = useCVOptimization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await optimizeCV(form);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'optimisation');
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
        <div className="flex items-center space-x-3 mb-6">
          <Zap className="h-8 w-8 text-cyan-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Optimisation CV IA</h3>
            <p className="text-gray-600">Optimisez votre CV pour maximiser vos chances</p>
          </div>
          <div className="px-3 py-1 bg-cyan-100 rounded-full text-sm font-medium text-cyan-700">15⚡</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Votre CV actuel
              </label>
              <textarea
                value={form.cvText}
                onChange={(e) => updateForm('cvText', e.target.value)}
                className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Collez le contenu de votre CV ici..."
                required
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poste cible *
                </label>
                <input
                  type="text"
                  value={form.targetJobTitle}
                  onChange={(e) => updateForm('targetJobTitle', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ex: Product Manager Senior"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entreprise cible (optionnel)
                </label>
                <input
                  type="text"
                  value={form.targetCompany}
                  onChange={(e) => updateForm('targetCompany', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ex: Google, Microsoft..."
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isOptimizing}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Luna optimise votre CV...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Optimiser mon CV</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <CVOptimizationResults 
          result={result}
          getSectionColor={getSectionColor}
          getImprovementIcon={getImprovementIcon}
        />
      )}
    </div>
  );
});

const CVOptimizationResults = memo(({ 
  result, 
  getSectionColor, 
  getImprovementIcon 
}: {
  result: CVOptimizationResult;
  getSectionColor: (section: string) => string;
  getImprovementIcon: (section: string) => string;
}) => (
  <div className="space-y-8">
    {/* Score Improvement */}
    <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100 text-center">
      <div className="flex items-center justify-center space-x-4 mb-4">
        <TrendingUp className="h-8 w-8 text-emerald-500" />
        <div>
          <h3 className="text-2xl font-bold text-gray-800">+{result.score_improvement} points</h3>
          <p className="text-emerald-600 font-medium">Amélioration du score ATS</p>
        </div>
      </div>
      <p className="text-gray-600">Votre CV est maintenant mieux optimisé pour les systèmes de recrutement automatisés</p>
    </div>

    {/* Optimized CV */}
    <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-8 w-8 text-cyan-500" />
          <h3 className="text-2xl font-bold text-gray-800">📄 Votre CV Optimisé</h3>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm">
            Copier le CV
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
            Télécharger PDF
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-96 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
          {result.optimized_cv}
        </pre>
      </div>
    </div>

    {/* Improvements Breakdown */}
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 text-center">📊 Détail des améliorations</h3>
      
      {result.improvements.map((improvement, index) => (
        <ImprovementCard 
          key={index}
          improvement={improvement}
          getSectionColor={getSectionColor}
          getImprovementIcon={getImprovementIcon}
        />
      ))}
    </div>

    {/* Keywords and ATS Improvements */}
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
        <h4 className="text-lg font-bold text-blue-800 mb-4">🔤 Mots-clés ajoutés</h4>
        <div className="flex flex-wrap gap-2">
          {result.keywords_added.map((keyword, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
        <h4 className="text-lg font-bold text-green-800 mb-4">⚡ Améliorations ATS</h4>
        <ul className="space-y-2">
          {result.ats_improvements.map((improvement, index) => (
            <li key={index} className="text-sm text-green-700 flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{improvement}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Energy Usage */}
    <div className="text-center">
      <span className="text-sm text-cyan-600">
        {result.energy_consumed}⚡ énergie consommée pour cette optimisation
      </span>
    </div>
  </div>
));

const ImprovementCard = memo(({ 
  improvement, 
  getSectionColor, 
  getImprovementIcon 
}: {
  improvement: any;
  getSectionColor: (section: string) => string;
  getImprovementIcon: (section: string) => string;
}) => {
  const sectionColor = getSectionColor(improvement.section);
  const sectionIcon = getImprovementIcon(improvement.section);
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">{sectionIcon}</span>
        <h4 className="text-lg font-bold text-gray-800">{improvement.section}</h4>
        <span className={`px-2 py-1 bg-${sectionColor}-100 text-${sectionColor}-800 text-xs font-medium rounded-full`}>
          Amélioré
        </span>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h5 className="font-semibold text-gray-700">Avant :</h5>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{improvement.original}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h5 className="font-semibold text-gray-700">Après :</h5>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-800">{improvement.improved}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center space-x-2">
        <ArrowRight className="h-4 w-4 text-gray-400" />
        <p className="text-sm text-gray-600"><strong>Pourquoi :</strong> {improvement.reason}</p>
      </div>
    </div>
  );
});

CVOptimizationTab.displayName = 'CVOptimizationTab';
CVOptimizationResults.displayName = 'CVOptimizationResults';
ImprovementCard.displayName = 'ImprovementCard';

export default CVOptimizationTab;