import React, { memo } from 'react';
import { Loader2, Brain, Check, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import { useSkillsAnalysis, SkillMatch } from '../hooks/useSkillsAnalysis';

const SkillsAnalysisTab = memo(() => {
  const { form, results, isAnalyzing, updateForm, analyzeSkills } = useSkillsAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await analyzeSkills(form);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'analyse');
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="h-8 w-8 text-blue-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Analyse des Compétences</h3>
            <p className="text-gray-600">Analysez la transférabilité de vos compétences vers un nouveau métier</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre métier actuel *
              </label>
              <input
                type="text"
                value={form.currentJob}
                onChange={(e) => updateForm('currentJob', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Chef de projet digital, Développeur full-stack..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Métier cible *
              </label>
              <input
                type="text"
                value={form.targetJob}
                onChange={(e) => updateForm('targetJob', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Product Manager, UX Designer..."
                required
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  <span>Analyser la compatibilité</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {results && (
        <AnalysisResults results={results} />
      )}
    </div>
  );
});

const AnalysisResults = memo(({ results }: { results: any }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    if (score >= 60) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  return (
    <div className="space-y-8">
      {/* Compatibility Score */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
        <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-full border-2 ${getScoreColor(results.compatibilityScore)}`}>
          <TrendingUp className="h-6 w-6" />
          <div>
            <div className="text-2xl font-bold">{results.compatibilityScore}%</div>
            <div className="text-sm font-medium">Compatibilité globale</div>
          </div>
        </div>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          {results.compatibilityScore >= 80 ? 
            "Excellente correspondance ! Vous avez déjà la plupart des compétences requises." :
            results.compatibilityScore >= 60 ?
            "Bonne correspondance. Quelques compétences à développer pour une transition réussie." :
            "Transition possible mais nécessitera un effort de formation significatif."
          }
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Exact Matches */}
        <SkillSection
          title="🟢 Vos compétences actuelles"
          subtitle="Compétences que vous maîtrisez déjà"
          skills={results.exact}
          bgColor="bg-emerald-50"
          borderColor="border-emerald-200"
          textColor="text-emerald-800"
        />

        {/* Transferable Skills */}
        <SkillSection
          title="🔵 Compétences transférables"
          subtitle="Compétences adaptables avec un peu d'effort"
          skills={results.transferable}
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          textColor="text-blue-800"
        />
      </div>

      {/* Skills to Acquire */}
      {results.toAcquire.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <div>
              <h4 className="text-lg font-bold text-orange-800">🎯 Compétences à développer</h4>
              <p className="text-sm text-orange-600">Nouvelles compétences recommandées pour le poste cible</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.toAcquire.map((skill: string, index: number) => (
              <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">{skill}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-orange-100 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>💡 Conseil Luna :</strong> Concentrez-vous d'abord sur 2-3 compétences clés. 
              Vous pouvez développer ces compétences via des formations en ligne, des projets personnels ou du mentoring.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

const SkillSection = memo(({ 
  title, 
  subtitle, 
  skills, 
  bgColor, 
  borderColor, 
  textColor 
}: {
  title: string;
  subtitle: string;
  skills: SkillMatch[];
  bgColor: string;
  borderColor: string;
  textColor: string;
}) => (
  <div className={`${bgColor} ${borderColor} rounded-xl border p-6`}>
    <div className="mb-4">
      <h4 className={`text-lg font-bold ${textColor}`}>{title}</h4>
      <p className={`text-sm ${textColor.replace('800', '600')}`}>{subtitle}</p>
    </div>
    
    {skills.length === 0 ? (
      <p className={`text-sm ${textColor.replace('800', '600')} italic`}>
        Aucune compétence identifiée dans cette catégorie.
      </p>
    ) : (
      <div className="space-y-3">
        {skills.map((skill, index) => (
          <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800">{skill.name}</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  skill.score >= 90 ? 'bg-emerald-500' : 
                  skill.score >= 75 ? 'bg-blue-500' : 'bg-orange-500'
                }`} />
                <span className="text-xs text-gray-500">{skill.score}%</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              → <span className="font-medium">{skill.mapped}</span>
              <span className="text-xs text-gray-500 ml-2">({skill.confidence})</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));

SkillsAnalysisTab.displayName = 'SkillsAnalysisTab';
AnalysisResults.displayName = 'AnalysisResults';
SkillSection.displayName = 'SkillSection';

export default SkillsAnalysisTab;