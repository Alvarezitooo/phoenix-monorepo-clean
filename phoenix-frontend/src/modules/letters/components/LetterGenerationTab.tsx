import React, { memo } from 'react';
import { PenTool, Building, Briefcase, User, Palette, FileText, Loader2, Copy, Download, TrendingUp } from 'lucide-react';
import { useLetterGeneration } from '../hooks/useLetterGeneration';

const LetterGenerationTab = memo(() => {
  const { 
    form, 
    result, 
    isGenerating, 
    updateForm, 
    generateLetter,
    getExperienceBadge,
    getToneIcon
  } = useLetterGeneration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generateLetter(form);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la génération');
    }
  };

  const experienceBadge = getExperienceBadge(form.experience_level);
  const toneIcon = getToneIcon(form.desired_tone);

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
        <div className="flex items-center space-x-3 mb-6">
          <PenTool className="h-8 w-8 text-orange-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Générateur de Lettres IA</h3>
            <p className="text-gray-600">Créez une lettre de motivation personnalisée et percutante</p>
          </div>
          <div className="px-3 py-1 bg-orange-100 rounded-full text-sm font-medium text-orange-700">15⚡</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company and Position */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => updateForm('company_name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ex: Microsoft, Google, Airbus..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="h-4 w-4 inline mr-2" />
                Poste visé *
              </label>
              <input
                type="text"
                value={form.position_title}
                onChange={(e) => updateForm('position_title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ex: Développeur Full-Stack, Chef de Projet..."
                required
              />
            </div>
          </div>

          {/* Experience and Tone */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Niveau d'expérience
              </label>
              <select
                value={form.experience_level}
                onChange={(e) => updateForm('experience_level', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="débutant">Débutant (0-2 ans)</option>
                <option value="intermédiaire">Intermédiaire (2-5 ans)</option>
                <option value="expérimenté">Expérimenté (5+ ans)</option>
                <option value="expert">Expert (10+ ans)</option>
              </select>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${experienceBadge.color}-100 text-${experienceBadge.color}-700`}>
                  {experienceBadge.label}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette className="h-4 w-4 inline mr-2" />
                Ton désiré
              </label>
              <select
                value={form.desired_tone}
                onChange={(e) => updateForm('desired_tone', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="professionnel">Professionnel</option>
                <option value="enthousiaste">Enthousiaste</option>
                <option value="créatif">Créatif</option>
                <option value="confiant">Confiant</option>
              </select>
              <div className="mt-2">
                <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  <span>{toneIcon}</span>
                  <span>{form.desired_tone}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Description du poste (optionnel)
            </label>
            <textarea
              value={form.job_description}
              onChange={(e) => updateForm('job_description', e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Collez ici l'offre d'emploi pour une personnalisation maximale..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Plus de détails = lettre plus personnalisée !
            </p>
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isGenerating}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Luna rédige votre lettre...</span>
                </>
              ) : (
                <>
                  <PenTool className="h-5 w-5" />
                  <span>Générer ma lettre</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <LetterResults result={result} />
      )}
    </div>
  );
});

const LetterResults = memo(({ result }: { result: any }) => (
  <div className="space-y-6">
    {/* Performance Metrics */}
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <TrendingUp className="h-8 w-8 text-emerald-500" />
          <div>
            <div className="text-2xl font-bold text-emerald-700">{result.personalization_score}%</div>
            <div className="text-sm font-medium text-emerald-600">Score de personnalisation</div>
          </div>
        </div>
        <p className="text-gray-600">Lettre adaptée à votre profil et au poste</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center space-x-3 mb-4">
          <Palette className="h-6 w-6 text-blue-500" />
          <h4 className="text-lg font-bold text-blue-800">Analyse du ton</h4>
        </div>
        <p className="text-sm text-blue-700">{result.tone_analysis}</p>
      </div>
    </div>

    {/* Generated Letter */}
    <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-orange-500" />
          <h3 className="text-2xl font-bold text-gray-800">✉️ Votre Lettre Personnalisée</h3>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center space-x-2">
            <Copy className="h-4 w-4" />
            <span>Copier</span>
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-96 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
          {result.content}
        </pre>
      </div>
    </div>

    {/* Suggestions */}
    <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
      <div className="flex items-center space-x-3 mb-4">
        <TrendingUp className="h-6 w-6 text-purple-600" />
        <h4 className="text-lg font-bold text-purple-800">💡 Suggestions d'amélioration</h4>
      </div>
      
      <div className="space-y-3">
        {result.suggestions.map((suggestion: string, index: number) => (
          <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">{suggestion}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <span className="text-sm text-orange-600">
          {result.energy_consumed}⚡ énergie consommée pour cette génération
        </span>
      </div>
    </div>
  </div>
));

LetterGenerationTab.displayName = 'LetterGenerationTab';
LetterResults.displayName = 'LetterResults';

export default LetterGenerationTab;