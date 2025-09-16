import React, { memo } from 'react';
import { Target, Loader2, CheckCircle, AlertTriangle, TrendingUp, FileText, Zap, Award } from 'lucide-react';
import { useMirrorMatch, MirrorMatchResult } from '../hooks/useMirrorMatch';

const MirrorMatchTab = memo(() => {
  const { form, result, isAnalyzing, updateForm, analyzeMirrorMatch, getCompatibilityLevel, getATSLevel } = useMirrorMatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await analyzeMirrorMatch(form);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'analyse');
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="h-8 w-8 text-purple-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Mirror Match Analysis</h3>
            <p className="text-gray-600">Analysez la correspondance entre votre CV et l'offre d'emploi</p>
          </div>
          <div className="px-3 py-1 bg-purple-100 rounded-full text-sm font-medium text-purple-700">25⚡</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Votre CV (copier-coller le texte)
              </label>
              <textarea
                value={form.cvText}
                onChange={(e) => updateForm('cvText', e.target.value)}
                className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Collez ici le contenu de votre CV..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="h-4 w-4 inline mr-2" />
                Description du poste ciblé
              </label>
              <textarea
                value={form.jobDescription}
                onChange={(e) => updateForm('jobDescription', e.target.value)}
                className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Collez ici l'offre d'emploi ou la description du poste..."
                required
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
                  <span>Luna analyse la correspondance...</span>
                </>
              ) : (
                <>
                  <Target className="h-5 w-5" />
                  <span>Analyser la correspondance</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <MirrorMatchResults 
          result={result} 
          getCompatibilityLevel={getCompatibilityLevel}
          getATSLevel={getATSLevel}
        />
      )}
    </div>
  );
});

const MirrorMatchResults = memo(({ 
  result, 
  getCompatibilityLevel, 
  getATSLevel 
}: {
  result: MirrorMatchResult;
  getCompatibilityLevel: (score: number) => { level: string, color: string };
  getATSLevel: (score: number) => { level: string, color: string };
}) => {
  const compatibility = getCompatibilityLevel(result.compatibility_score);
  const atsLevel = getATSLevel(result.ats_score);

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      emerald: 'text-emerald-600 bg-emerald-100 border-emerald-200',
      blue: 'text-blue-600 bg-blue-100 border-blue-200',
      yellow: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      orange: 'text-orange-600 bg-orange-100 border-orange-200',
      red: 'text-red-600 bg-red-100 border-red-200'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="space-y-8">
      {/* Score Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
          <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-full border-2 ${getColorClasses(compatibility.color)}`}>
            <TrendingUp className="h-6 w-6" />
            <div>
              <div className="text-2xl font-bold">{result.compatibility_score}%</div>
              <div className="text-sm font-medium">Compatibilité CV</div>
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            <strong>{compatibility.level}</strong> correspondance avec le poste
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
          <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-full border-2 ${getColorClasses(atsLevel.color)}`}>
            <Award className="h-6 w-6" />
            <div>
              <div className="text-2xl font-bold">{result.ats_score}/100</div>
              <div className="text-sm font-medium">Score ATS</div>
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            <strong>{atsLevel.level}</strong> pour les systèmes automatisés
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Strengths */}
        <AnalysisSection
          title="🟢 Points forts de votre CV"
          items={result.strengths}
          bgColor="bg-emerald-50"
          borderColor="border-emerald-200"
          textColor="text-emerald-800"
          icon={CheckCircle}
        />

        {/* Weaknesses */}
        <AnalysisSection
          title="🔴 Points à améliorer"
          items={result.weaknesses}
          bgColor="bg-red-50"
          borderColor="border-red-200"
          textColor="text-red-800"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Keywords Found */}
        <KeywordSection
          title="✅ Mots-clés trouvés"
          keywords={result.keyword_matches}
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          textColor="text-blue-800"
        />

        {/* Missing Keywords */}
        <KeywordSection
          title="❌ Mots-clés manquants"
          keywords={result.missing_keywords}
          bgColor="bg-orange-50"
          borderColor="border-orange-200"
          textColor="text-orange-800"
        />
      </div>

      {/* Suggestions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-6 w-6 text-purple-600" />
          <h4 className="text-lg font-bold text-purple-800">💡 Recommandations Luna</h4>
        </div>
        
        <div className="space-y-3">
          {result.suggestions.map((suggestion, index) => (
            <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">{suggestion}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-purple-600">
            {result.energy_consumed}⚡ énergie consommée pour cette analyse
          </span>
          <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm">
            Exporter le rapport
          </button>
        </div>
      </div>
    </div>
  );
});

const AnalysisSection = memo(({ 
  title, 
  items, 
  bgColor, 
  borderColor, 
  textColor,
  icon: Icon
}: {
  title: string;
  items: string[];
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: React.ComponentType<any>;
}) => (
  <div className={`${bgColor} ${borderColor} rounded-xl border p-6`}>
    <div className="flex items-center space-x-3 mb-4">
      <Icon className={`h-6 w-6 ${textColor.replace('800', '600')}`} />
      <h4 className={`text-lg font-bold ${textColor}`}>{title}</h4>
    </div>
    
    {items.length === 0 ? (
      <p className={`text-sm ${textColor.replace('800', '600')} italic`}>
        Aucun élément identifié dans cette catégorie.
      </p>
    ) : (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className={`text-sm ${textColor.replace('800', '700')} flex items-start space-x-2`}>
            <span className="w-2 h-2 bg-current rounded-full mt-2 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
));

const KeywordSection = memo(({ 
  title, 
  keywords, 
  bgColor, 
  borderColor, 
  textColor 
}: {
  title: string;
  keywords: string[];
  bgColor: string;
  borderColor: string;
  textColor: string;
}) => (
  <div className={`${bgColor} ${borderColor} rounded-xl border p-6`}>
    <h4 className={`text-lg font-bold ${textColor} mb-4`}>{title}</h4>
    
    {keywords.length === 0 ? (
      <p className={`text-sm ${textColor.replace('800', '600')} italic`}>
        Aucun mot-clé dans cette catégorie.
      </p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span 
            key={index}
            className={`px-3 py-1 ${bgColor.replace('50', '100')} ${textColor.replace('800', '700')} text-xs font-medium rounded-full border ${borderColor}`}
          >
            {keyword}
          </span>
        ))}
      </div>
    )}
  </div>
));

MirrorMatchTab.displayName = 'MirrorMatchTab';
MirrorMatchResults.displayName = 'MirrorMatchResults';
AnalysisSection.displayName = 'AnalysisSection';
KeywordSection.displayName = 'KeywordSection';

export default MirrorMatchTab;