import React, { memo, useState, useCallback, useEffect } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Target, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Award,
  Loader2,
  Sparkles,
  Brain,
  Gauge,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

// Types pour l'analyse ATS
interface ATSScore {
  overall_score: number;
  readability_score: number;
  keyword_density: number;
  format_compliance: number;
  sections_completeness: number;
  content_quality: number;
}

interface ATSAnalysis {
  score: ATSScore;
  recommendations: {
    critical: string[];
    important: string[];
    suggestions: string[];
  };
  keyword_analysis: {
    found_keywords: Array<{ keyword: string; frequency: number; relevance: string }>;
    missing_keywords: Array<{ keyword: string; importance: string; suggestions: string[] }>;
    keyword_density_status: 'optimal' | 'low' | 'high';
  };
  format_analysis: {
    file_compatibility: boolean;
    font_readability: boolean;
    section_headers: boolean;
    bullet_points: boolean;
    contact_info_format: boolean;
    length_appropriate: boolean;
  };
  sections_analysis: {
    contact_info: { present: boolean; quality: number; issues: string[] };
    professional_summary: { present: boolean; quality: number; issues: string[] };
    work_experience: { present: boolean; quality: number; issues: string[] };
    education: { present: boolean; quality: number; issues: string[] };
    skills: { present: boolean; quality: number; issues: string[] };
    achievements: { present: boolean; quality: number; issues: string[] };
  };
  industry_benchmarks: {
    sector: string;
    average_score: number;
    top_performers_score: number;
    your_position: 'below_average' | 'average' | 'above_average' | 'top_performer';
  };
  optimization_potential: number;
  estimated_improvement_time: string;
}

// Mock data pour démonstration
const MOCK_ATS_ANALYSIS: ATSAnalysis = {
  score: {
    overall_score: 74,
    readability_score: 82,
    keyword_density: 68,
    format_compliance: 91,
    sections_completeness: 78,
    content_quality: 71
  },
  recommendations: {
    critical: [
      "Augmenter la densité de mots-clés sectoriels (actuellement 68%, optimal: 75-85%)",
      "Ajouter une section 'Réalisations' avec des métriques quantifiées",
      "Reformuler le résumé professionnel pour inclure plus de termes techniques"
    ],
    important: [
      "Utiliser des verbes d'action plus variés dans les expériences", 
      "Optimiser l'ordre des sections selon les standards ATS",
      "Standardiser le format des dates (MM/YYYY)"
    ],
    suggestions: [
      "Ajouter des certifications professionnelles",
      "Inclure des liens vers projets ou portfolio",
      "Utiliser des synonymes pour éviter la répétition excessive"
    ]
  },
  keyword_analysis: {
    found_keywords: [
      { keyword: "Project Management", frequency: 4, relevance: "high" },
      { keyword: "Leadership", frequency: 3, relevance: "high" },
      { keyword: "Digital Marketing", frequency: 2, relevance: "medium" },
      { keyword: "Analytics", frequency: 5, relevance: "high" },
      { keyword: "Strategic Planning", frequency: 2, relevance: "medium" }
    ],
    missing_keywords: [
      { 
        keyword: "Agile Methodology", 
        importance: "high", 
        suggestions: ["Mentionner Scrum/Kanban", "Ajouter sprint planning"] 
      },
      { 
        keyword: "Cross-functional Teams", 
        importance: "medium", 
        suggestions: ["Détailler collaboration inter-équipes"] 
      },
      { 
        keyword: "ROI Optimization", 
        importance: "high", 
        suggestions: ["Quantifier impact business", "Inclure pourcentages d'amélioration"] 
      }
    ],
    keyword_density_status: 'low'
  },
  format_analysis: {
    file_compatibility: true,
    font_readability: true,
    section_headers: true,
    bullet_points: false,
    contact_info_format: true,
    length_appropriate: false
  },
  sections_analysis: {
    contact_info: { present: true, quality: 95, issues: [] },
    professional_summary: { present: true, quality: 72, issues: ["Trop générique", "Manque de mots-clés sectoriels"] },
    work_experience: { present: true, quality: 78, issues: ["Dates non standardisées", "Peu de métriques quantifiées"] },
    education: { present: true, quality: 85, issues: ["Pourrait inclure formations continues"] },
    skills: { present: true, quality: 65, issues: ["Liste trop générale", "Manque compétences techniques"] },
    achievements: { present: false, quality: 0, issues: ["Section manquante - impact ATS important"] }
  },
  industry_benchmarks: {
    sector: "Product Management",
    average_score: 68,
    top_performers_score: 92,
    your_position: 'above_average'
  },
  optimization_potential: 23,
  estimated_improvement_time: "2-3 heures"
};

const ATSOptimizerTab = memo(() => {
  const [cvText, setCvText] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'format' | 'sections' | 'benchmark'>('overview');

  const handleAnalyzeATS = useCallback(async () => {
    if (!cvText.trim()) {
      alert('Veuillez coller le contenu de votre CV');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulation de l'analyse ATS (remplacer par vraie API)
    setTimeout(() => {
      setAnalysis(MOCK_ATS_ANALYSIS);
      setIsAnalyzing(false);
    }, 3000);
  }, [cvText]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'emerald';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return CheckCircle;
    if (score >= 70) return AlertCircle;
    return XCircle;
  };

  return (
    <div className="space-y-8">
      {/* Header & Input */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="h-8 w-8 text-blue-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">ATS Performance Optimizer</h3>
            <p className="text-gray-600">Analysez et optimisez votre CV pour les systèmes de recrutement automatisés</p>
          </div>
          <div className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-700">10⚡</div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Contenu de votre CV
            </label>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Collez ici tout le contenu textuel de votre CV..."
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secteur cible</label>
              <select
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un secteur</option>
                <option value="tech">Technologie</option>
                <option value="finance">Finance</option>
                <option value="marketing">Marketing</option>
                <option value="consulting">Consulting</option>
                <option value="healthcare">Santé</option>
                <option value="education">Éducation</option>
                <option value="retail">Retail</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poste cible</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Product Manager"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleAnalyzeATS}
            disabled={isAnalyzing}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyse ATS en cours...</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Analyser compatibilité ATS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-8">
          {/* Score Overview */}
          <ATSScoreOverview analysis={analysis} getScoreColor={getScoreColor} getScoreIcon={getScoreIcon} />
          
          {/* Navigation tabs */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {[
                { id: 'overview', name: 'Vue d\'ensemble', icon: BarChart3 },
                { id: 'keywords', name: 'Mots-clés', icon: Search },
                { id: 'format', name: 'Format', icon: FileText },
                { id: 'sections', name: 'Sections', icon: Target },
                { id: 'benchmark', name: 'Benchmark', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-6 py-4 flex items-center justify-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && <OverviewTab analysis={analysis} getScoreColor={getScoreColor} />}
              {activeTab === 'keywords' && <KeywordsTab analysis={analysis} />}
              {activeTab === 'format' && <FormatTab analysis={analysis} />}
              {activeTab === 'sections' && <SectionsTab analysis={analysis} getScoreColor={getScoreColor} />}
              {activeTab === 'benchmark' && <BenchmarkTab analysis={analysis} getScoreColor={getScoreColor} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const ATSScoreOverview = memo(({ 
  analysis, 
  getScoreColor, 
  getScoreIcon 
}: {
  analysis: ATSAnalysis;
  getScoreColor: (score: number) => string;
  getScoreIcon: (score: number) => React.ComponentType<any>;
}) => {
  const Icon = getScoreIcon(analysis.score.overall_score);
  const colorClass = getScoreColor(analysis.score.overall_score);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Score principal */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-${colorClass}-100 mb-4`}>
          <Icon className={`h-10 w-10 text-${colorClass}-600`} />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-bold text-gray-800">{analysis.score.overall_score}/100</h3>
          <p className={`font-medium text-${colorClass}-700`}>Score ATS Global</p>
          <p className="text-sm text-gray-600">
            {analysis.score.overall_score >= 85 ? 'Excellent' :
             analysis.score.overall_score >= 70 ? 'Bon' :
             analysis.score.overall_score >= 50 ? 'Moyen' : 'À améliorer'}
          </p>
        </div>
      </div>

      {/* Potentiel d'optimisation */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-4">
          <TrendingUp className="h-10 w-10 text-purple-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-bold text-gray-800">+{analysis.optimization_potential}</h3>
          <p className="font-medium text-purple-700">Points possibles</p>
          <p className="text-sm text-gray-600">Temps estimé: {analysis.estimated_improvement_time}</p>
        </div>
      </div>

      {/* Position sectorielle */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
          <Award className="h-10 w-10 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-800 capitalize">
            {analysis.industry_benchmarks.your_position.replace('_', ' ')}
          </h3>
          <p className="font-medium text-emerald-700">{analysis.industry_benchmarks.sector}</p>
          <p className="text-sm text-gray-600">
            vs {analysis.industry_benchmarks.average_score}% moyenne secteur
          </p>
        </div>
      </div>
    </div>
  );
});

const OverviewTab = memo(({ 
  analysis, 
  getScoreColor 
}: {
  analysis: ATSAnalysis;
  getScoreColor: (score: number) => string;
}) => (
  <div className="space-y-8">
    {/* Scores détaillés */}
    <div>
      <h4 className="text-lg font-semibold text-gray-800 mb-4">Analyse détaillée des scores</h4>
      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(analysis.score).filter(([key]) => key !== 'overall_score').map(([key, score]) => {
          const colorClass = getScoreColor(score);
          const labels = {
            readability_score: 'Lisibilité',
            keyword_density: 'Densité mots-clés', 
            format_compliance: 'Conformité format',
            sections_completeness: 'Complétude sections',
            content_quality: 'Qualité contenu'
          };
          
          return (
            <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700">{labels[key as keyof typeof labels]}</span>
                <span className={`font-bold text-${colorClass}-700`}>{score}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${colorClass}-500 h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Recommandations par priorité */}
    <div className="grid lg:grid-cols-3 gap-6">
      <RecommendationCard
        title="🚨 Critique"
        items={analysis.recommendations.critical}
        bgColor="bg-red-50"
        borderColor="border-red-200"
        textColor="text-red-800"
      />
      <RecommendationCard
        title="⚠️ Important"
        items={analysis.recommendations.important}
        bgColor="bg-yellow-50"
        borderColor="border-yellow-200"
        textColor="text-yellow-800"
      />
      <RecommendationCard
        title="💡 Suggestions"
        items={analysis.recommendations.suggestions}
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
        textColor="text-blue-800"
      />
    </div>
  </div>
));

const KeywordsTab = memo(({ analysis }: { analysis: ATSAnalysis }) => (
  <div className="space-y-8">
    {/* Status de la densité */}
    <div className={`p-4 rounded-lg border-2 ${
      analysis.keyword_analysis.keyword_density_status === 'optimal' ? 'bg-emerald-50 border-emerald-200' :
      analysis.keyword_analysis.keyword_density_status === 'low' ? 'bg-yellow-50 border-yellow-200' :
      'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center space-x-3">
        <Gauge className={`h-6 w-6 ${
          analysis.keyword_analysis.keyword_density_status === 'optimal' ? 'text-emerald-600' :
          analysis.keyword_analysis.keyword_density_status === 'low' ? 'text-yellow-600' :
          'text-red-600'
        }`} />
        <div>
          <h4 className={`font-semibold ${
            analysis.keyword_analysis.keyword_density_status === 'optimal' ? 'text-emerald-800' :
            analysis.keyword_analysis.keyword_density_status === 'low' ? 'text-yellow-800' :
            'text-red-800'
          }`}>
            Densité de mots-clés: {analysis.keyword_analysis.keyword_density_status === 'optimal' ? 'Optimale' :
                                    analysis.keyword_analysis.keyword_density_status === 'low' ? 'Trop faible' : 'Trop élevée'}
          </h4>
          <p className={`text-sm ${
            analysis.keyword_analysis.keyword_density_status === 'optimal' ? 'text-emerald-700' :
            analysis.keyword_analysis.keyword_density_status === 'low' ? 'text-yellow-700' :
            'text-red-700'
          }`}>
            {analysis.keyword_analysis.keyword_density_status === 'low' ? 
              'Augmentez la fréquence des mots-clés sectoriels (cible: 75-85%)' :
              'Votre densité de mots-clés est dans la fourchette optimale'}
          </p>
        </div>
      </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      {/* Mots-clés trouvés */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <span>Mots-clés détectés ({analysis.keyword_analysis.found_keywords.length})</span>
        </h4>
        
        {analysis.keyword_analysis.found_keywords.map((keyword, idx) => (
          <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-emerald-800">{keyword.keyword}</span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  keyword.relevance === 'high' ? 'bg-emerald-200 text-emerald-800' :
                  keyword.relevance === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {keyword.relevance === 'high' ? 'Haute' : 
                   keyword.relevance === 'medium' ? 'Moyenne' : 'Faible'} relevance
                </span>
                <span className="text-sm text-emerald-700">×{keyword.frequency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mots-clés manquants */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span>Mots-clés manquants ({analysis.keyword_analysis.missing_keywords.length})</span>
        </h4>
        
        {analysis.keyword_analysis.missing_keywords.map((keyword, idx) => (
          <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-orange-800">{keyword.keyword}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                keyword.importance === 'high' ? 'bg-red-200 text-red-800' :
                keyword.importance === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {keyword.importance === 'high' ? 'Critique' :
                 keyword.importance === 'medium' ? 'Important' : 'Optionnel'}
              </span>
            </div>
            <div className="space-y-1">
              {keyword.suggestions.map((suggestion, sidx) => (
                <div key={sidx} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  <span className="text-sm text-orange-700">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

const FormatTab = memo(({ analysis }: { analysis: ATSAnalysis }) => (
  <div className="space-y-6">
    <h4 className="text-lg font-semibold text-gray-800 mb-4">Conformité du format ATS</h4>
    
    <div className="grid md:grid-cols-2 gap-4">
      {Object.entries(analysis.format_analysis).map(([key, value]) => {
        const labels = {
          file_compatibility: 'Compatibilité fichier',
          font_readability: 'Lisibilité police',
          section_headers: 'En-têtes sections',
          bullet_points: 'Points à puces',
          contact_info_format: 'Format coordonnées',
          length_appropriate: 'Longueur appropriée'
        };
        
        return (
          <div key={key} className={`p-4 rounded-lg border-2 ${
            value ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-3">
              {value ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <span className={`font-medium ${
                  value ? 'text-emerald-800' : 'text-red-800'
                }`}>
                  {labels[key as keyof typeof labels]}
                </span>
                <p className={`text-sm ${
                  value ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {value ? '✓ Conforme' : '✗ À corriger'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Conseils format */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h5 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
        <Brain className="h-5 w-5" />
        <span>Conseils optimisation format</span>
      </h5>
      <ul className="space-y-2">
        <li className="flex items-start space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
          <span className="text-sm text-blue-800">Utilisez des formats .docx ou .pdf pour maximiser la compatibilité</span>
        </li>
        <li className="flex items-start space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
          <span className="text-sm text-blue-800">Évitez les tableaux, colonnes multiples et designs trop créatifs</span>
        </li>
        <li className="flex items-start space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
          <span className="text-sm text-blue-800">Utilisez des polices standard (Arial, Calibri, Times New Roman)</span>
        </li>
        <li className="flex items-start space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
          <span className="text-sm text-blue-800">Structurez avec des en-têtes clairs et des puces simples</span>
        </li>
      </ul>
    </div>
  </div>
));

const SectionsTab = memo(({ 
  analysis, 
  getScoreColor 
}: {
  analysis: ATSAnalysis;
  getScoreColor: (score: number) => string;
}) => (
  <div className="space-y-6">
    <h4 className="text-lg font-semibold text-gray-800 mb-4">Analyse des sections CV</h4>
    
    <div className="grid lg:grid-cols-2 gap-6">
      {Object.entries(analysis.sections_analysis).map(([sectionKey, sectionData]) => {
        const colorClass = getScoreColor(sectionData.quality);
        const labels = {
          contact_info: 'Informations de contact',
          professional_summary: 'Résumé professionnel',
          work_experience: 'Expérience professionnelle',
          education: 'Formation',
          skills: 'Compétences',
          achievements: 'Réalisations'
        };

        return (
          <div key={sectionKey} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-semibold text-gray-800">
                {labels[sectionKey as keyof typeof labels]}
              </h5>
              <div className="flex items-center space-x-2">
                {sectionData.present ? (
                  <CheckCircle className={`h-5 w-5 text-${colorClass}-600`} />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-bold text-${colorClass}-700`}>
                  {sectionData.quality}/100
                </span>
              </div>
            </div>

            {sectionData.present ? (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`bg-${colorClass}-500 h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${sectionData.quality}%` }}
                  />
                </div>
                
                {sectionData.issues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Points d'amélioration:</p>
                    {sectionData.issues.map((issue, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-medium">Section manquante</p>
                <p className="text-sm text-red-600">Cette section est importante pour l'ATS</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
));

const BenchmarkTab = memo(({ 
  analysis, 
  getScoreColor 
}: {
  analysis: ATSAnalysis;
  getScoreColor: (score: number) => string;
}) => {
  const benchmark = analysis.industry_benchmarks;
  const yourColorClass = getScoreColor(analysis.score.overall_score);

  return (
    <div className="space-y-8">
      {/* Comparaison sectorielle */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Position dans le secteur {benchmark.sector}</span>
        </h4>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 mb-1">{benchmark.average_score}%</div>
            <p className="text-sm text-gray-600">Moyenne secteur</p>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-${yourColorClass}-700 mb-1`}>
              {analysis.score.overall_score}%
            </div>
            <p className="text-sm text-gray-600">Votre score</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">{benchmark.top_performers_score}%</div>
            <p className="text-sm text-gray-600">Top performers</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>0%</span>
            <span>Moyenne ({benchmark.average_score}%)</span>
            <span>Top ({benchmark.top_performers_score}%)</span>
            <span>100%</span>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-4">
            {/* Barre de progression moyenne */}
            <div 
              className="absolute top-0 left-0 bg-gray-400 h-4 rounded-full"
              style={{ width: `${benchmark.average_score}%` }}
            />
            {/* Barre de progression top performers */}
            <div 
              className="absolute top-0 left-0 bg-emerald-500 h-4 rounded-full"
              style={{ width: `${benchmark.top_performers_score}%` }}
            />
            {/* Votre position */}
            <div 
              className={`absolute top-0 left-0 bg-${yourColorClass}-600 h-4 rounded-full`}
              style={{ width: `${analysis.score.overall_score}%` }}
            />
            {/* Indicateur position */}
            <div 
              className="absolute top-0 w-1 bg-white h-4 border-2 border-gray-800"
              style={{ left: `${analysis.score.overall_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Objectifs d'amélioration */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h5 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Target className="h-5 w-5 text-purple-600" />
            <span>Objectifs recommandés</span>
          </h5>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Court terme (1 semaine)</span>
              <span className="font-semibold text-purple-700">
                +{Math.min(10, analysis.optimization_potential)} points
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Moyen terme (1 mois)</span>
              <span className="font-semibold text-purple-700">
                +{Math.min(analysis.optimization_potential, 20)} points
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Objectif top 10%</span>
              <span className="font-semibold text-emerald-700">
                {benchmark.top_performers_score}% ({benchmark.top_performers_score - analysis.score.overall_score > 0 ? '+' : ''}{benchmark.top_performers_score - analysis.score.overall_score} points)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h5 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Award className="h-5 w-5 text-emerald-600" />
            <span>Impact attendu</span>
          </h5>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-sm text-gray-700">
                +{Math.round(analysis.optimization_potential * 0.4)}% de visibilité ATS
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-700">
                +{Math.round(analysis.optimization_potential * 0.3)}% de chances d'entretien
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <span className="text-sm text-gray-700">
                Temps de recherche réduit de {Math.round(analysis.optimization_potential * 0.5)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-center text-white">
        <h4 className="text-xl font-bold mb-2">Prêt à optimiser votre CV ?</h4>
        <p className="mb-4 opacity-90">
          Suivez nos recommandations pour améliorer votre score de {analysis.optimization_potential} points
        </p>
        <div className="flex justify-center space-x-4">
          <button className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Télécharger le rapport</span>
          </button>
          <button className="px-6 py-3 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition-colors flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Nouvelle analyse</span>
          </button>
        </div>
      </div>
    </div>
  );
});

const RecommendationCard = memo(({ 
  title, 
  items, 
  bgColor, 
  borderColor, 
  textColor 
}: {
  title: string;
  items: string[];
  bgColor: string;
  borderColor: string;
  textColor: string;
}) => (
  <div className={`${bgColor} ${borderColor} rounded-lg border-2 p-6`}>
    <h5 className={`font-bold ${textColor} mb-4`}>{title}</h5>
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full mt-2 ${textColor.replace('text-', 'bg-').replace('-800', '-600')}`} />
          <span className={`text-sm ${textColor.replace('-800', '-700')}`}>{item}</span>
        </div>
      ))}
    </div>
  </div>
));

ATSOptimizerTab.displayName = 'ATSOptimizerTab';
ATSScoreOverview.displayName = 'ATSScoreOverview';
OverviewTab.displayName = 'OverviewTab';
KeywordsTab.displayName = 'KeywordsTab';
FormatTab.displayName = 'FormatTab';
SectionsTab.displayName = 'SectionsTab';
BenchmarkTab.displayName = 'BenchmarkTab';
RecommendationCard.displayName = 'RecommendationCard';

export default ATSOptimizerTab;