import React, { useState, memo, useCallback } from 'react';
import { 
  Search, 
  Building2, 
  TrendingUp, 
  Target, 
  Users, 
  Globe, 
  Calendar,
  Zap,
  Loader2,
  ExternalLink,
  CheckCircle,
  Star,
  Briefcase,
  MessageSquare,
  Lightbulb,
  Award
} from 'lucide-react';

interface CompanyInfo {
  name: string;
  industry: string;
  mission: string;
  culture: string;
  recent_news: string;
  size: string;
  location: string;
  website: string;
  recommended_tone: 'professional' | 'creative' | 'confident' | 'enthusiastic';
  recommended_approach: string;
  key_values: string[];
  recent_achievements: string[];
  hiring_trends: string[];
}

interface ResearchForm {
  company_name: string;
  position_title: string;
  job_url?: string;
  industry_hint?: string;
}

const CompanyResearchTab = memo(() => {
  const [form, setForm] = useState<ResearchForm>({
    company_name: '',
    position_title: '',
    job_url: '',
    industry_hint: ''
  });

  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateForm = useCallback((field: keyof ResearchForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsResearching(true);

    try {
      // Simulation recherche - en réalité appel API Luna Letters
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock data basé sur le nom d'entreprise
      const mockResults: Record<string, CompanyInfo> = {
        'google': {
          name: 'Google (Alphabet Inc.)',
          industry: 'Technology / Artificial Intelligence',
          mission: 'Organiser les informations mondiales et les rendre accessibles et utiles à tous',
          culture: 'Innovation continue, excellence technique, impact global, "Don\'t be evil"',
          recent_news: 'Expansion majeure en IA générative avec Gemini, croissance cloud +35%',
          size: '150,000+ employés',
          location: 'Mountain View, CA (Global)',
          website: 'google.com',
          recommended_tone: 'confident',
          recommended_approach: 'Démonstration expertise technique + vision produit et impact utilisateur',
          key_values: ['Innovation', 'Excellence technique', 'Impact à grande échelle', 'Collaboration'],
          recent_achievements: [
            'Leader IA générative avec Bard/Gemini',
            'Google Cloud croissance +35% en 2024',
            'Breakthrough en informatique quantique'
          ],
          hiring_trends: [
            'Focus sur les experts IA/ML',
            'Recherche profils hybrides tech/product',
            'Privilégie impact démontrable'
          ]
        },
        'airbnb': {
          name: 'Airbnb Inc.',
          industry: 'Travel Technology / Marketplace',
          mission: 'Créer un monde où chacun peut se sentir chez soi partout',
          culture: 'Appartenance, design thinking, expérience utilisateur exceptionnelle',
          recent_news: 'Expansion marchés émergents, nouvelles expériences premium "Airbnb Luxe"',
          size: '6,000+ employés',
          location: 'San Francisco, CA (Global)',
          website: 'airbnb.com',
          recommended_tone: 'creative',
          recommended_approach: 'Storytelling personnel + passion pour la communauté et le design',
          key_values: ['Belonging', 'Design Excellence', 'Community', 'Innovation'],
          recent_achievements: [
            'Airbnb Luxe lancé dans 50+ pays',
            'Nouvelles expériences locales +200%',
            'Plateforme hôtes professionnels'
          ],
          hiring_trends: [
            'Recherche profils design-oriented',
            'Valorise expérience internationale',
            'Privilégie passion communauté'
          ]
        }
      };

      const companyKey = form.company_name.toLowerCase();
      const companyData = mockResults[companyKey] || {
        name: form.company_name,
        industry: form.industry_hint || 'Secteur dynamique en croissance',
        mission: 'Excellence et innovation dans son domaine d\'activité',
        culture: 'Performance, collaboration, développement des talents',
        recent_news: 'Croissance soutenue et expansion sur son marché',
        size: 'Entreprise établie',
        location: 'Localisation multiple',
        website: 'Site web officiel',
        recommended_tone: 'professional',
        recommended_approach: 'Mise en avant des résultats concrets + motivation pour le secteur',
        key_values: ['Excellence', 'Innovation', 'Collaboration', 'Performance'],
        recent_achievements: [
          'Croissance continue sur son marché',
          'Innovation dans ses produits/services',
          'Expansion de son équipe'
        ],
        hiring_trends: [
          'Recherche profils expérimentés',
          'Valorise polyvalence et adaptabilité',
          'Focus sur résultats mesurables'
        ]
      };

      setResult(companyData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setIsResearching(false);
    }
  };

  const getToneColor = (tone: string) => {
    const colors = {
      professional: 'blue',
      creative: 'purple',
      confident: 'green',
      enthusiastic: 'orange'
    };
    return colors[tone as keyof typeof colors] || 'blue';
  };

  const getToneIcon = (tone: string) => {
    const icons = {
      professional: '🎯',
      creative: '🎨',
      confident: '⚡',
      enthusiastic: '🚀'
    };
    return icons[tone as keyof typeof icons] || '🎯';
  };

  return (
    <div className="space-y-8">
      {/* Research Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-indigo-100">
        <div className="flex items-center space-x-3 mb-6">
          <Search className="h-8 w-8 text-indigo-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Company Intelligence Research</h3>
            <p className="text-gray-600">Analyse approfondie pour personnaliser votre lettre</p>
          </div>
          <div className="px-3 py-1 bg-indigo-100 rounded-full text-sm font-medium text-indigo-700">10⚡</div>
        </div>

        <form onSubmit={handleResearch} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-2" />
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => updateForm('company_name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: Google, Microsoft, Airbnb..."
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: Product Manager, Developer..."
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ExternalLink className="h-4 w-4 inline mr-2" />
                URL de l'offre (optionnel)
              </label>
              <input
                type="url"
                value={form.job_url}
                onChange={(e) => updateForm('job_url', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://careers.company.com/job/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="h-4 w-4 inline mr-2" />
                Secteur (indice)
              </label>
              <select
                value={form.industry_hint}
                onChange={(e) => updateForm('industry_hint', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Auto-détection</option>
                <option value="Technology">Technologie</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Santé</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Consulting">Conseil</option>
                <option value="Marketing">Marketing</option>
                <option value="Education">Éducation</option>
              </select>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center space-x-2 text-indigo-700 mb-2">
              <Lightbulb className="h-4 w-4" />
              <span className="font-medium text-sm">💡 Luna va analyser :</span>
            </div>
            <ul className="text-sm text-indigo-600 space-y-1 ml-6">
              <li>• 🏢 Mission, valeurs et culture d'entreprise</li>
              <li>• 📈 Actualités récentes et croissance</li>
              <li>• 🎯 Ton de communication recommandé</li>
              <li>• 🚀 Approche optimale pour votre candidature</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isResearching || !form.company_name.trim() || !form.position_title.trim()}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isResearching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Luna enquête sur {form.company_name}...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Lancer la recherche</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Research Results */}
      {result && (
        <CompanyResearchResults result={result} getToneColor={getToneColor} getToneIcon={getToneIcon} />
      )}
    </div>
  );
});

const CompanyResearchResults = memo(({ 
  result, 
  getToneColor, 
  getToneIcon 
}: {
  result: CompanyInfo;
  getToneColor: (tone: string) => string;
  getToneIcon: (tone: string) => string;
}) => {
  const toneColor = getToneColor(result.recommended_tone);

  return (
    <div className="space-y-8">
      {/* Company Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {result.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{result.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center space-x-1">
                  <Target className="h-3 w-3" />
                  <span>{result.industry}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{result.size}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Globe className="h-3 w-3" />
                  <span>{result.location}</span>
                </span>
              </div>
            </div>
          </div>
          <a
            href={`https://${result.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors flex items-center space-x-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Site web</span>
          </a>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
              <Target className="h-4 w-4 text-emerald-600" />
              <span>Mission</span>
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed bg-emerald-50 rounded-lg p-3">
              {result.mission}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Culture</span>
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed bg-blue-50 rounded-lg p-3">
              {result.culture}
            </p>
          </div>
        </div>
      </div>

      {/* Recent News & Trends */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            <h4 className="text-lg font-bold text-orange-800">📈 Actualités Récentes</h4>
          </div>
          <p className="text-sm text-orange-700 bg-orange-50 rounded-lg p-4 leading-relaxed">
            {result.recent_news}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center space-x-3 mb-4">
            <Briefcase className="h-6 w-6 text-purple-600" />
            <h4 className="text-lg font-bold text-purple-800">🎯 Tendances Recrutement</h4>
          </div>
          <div className="space-y-2">
            {result.hiring_trends.map((trend, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-purple-700">{trend}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Values & Achievements */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center space-x-3 mb-4">
            <Star className="h-6 w-6 text-blue-600" />
            <h4 className="text-lg font-bold text-blue-800">💎 Valeurs Clés</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.key_values.map((value, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="h-6 w-6 text-green-600" />
            <h4 className="text-lg font-bold text-green-800">🏆 Réalisations Récentes</h4>
          </div>
          <div className="space-y-2">
            {result.recent_achievements.map((achievement, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Award className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-green-700">{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Luna's Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center space-x-3 mb-6">
          <MessageSquare className="h-8 w-8 text-indigo-600" />
          <div>
            <h3 className="text-xl font-bold text-indigo-800">🌙 Recommandations Luna</h3>
            <p className="text-sm text-indigo-600">Stratégie optimale pour votre candidature</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 bg-${toneColor}-100 rounded-lg flex items-center justify-center text-${toneColor}-600 font-bold`}>
                {getToneIcon(result.recommended_tone)}
              </div>
              <div>
                <h5 className="font-semibold text-gray-800">Ton Recommandé</h5>
                <span className={`text-sm text-${toneColor}-600 capitalize font-medium`}>
                  {result.recommended_tone}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <Zap className="h-6 w-6 text-yellow-600" />
              <h5 className="font-semibold text-gray-800">Approche Gagnante</h5>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {result.recommended_approach}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto">
            <MessageSquare className="h-4 w-4" />
            <span>Générer ma lettre avec ces insights</span>
          </button>
          <p className="text-xs text-indigo-600 mt-2">
            Ces informations seront automatiquement intégrées dans votre lettre
          </p>
        </div>
      </div>
    </div>
  );
});

CompanyResearchTab.displayName = 'CompanyResearchTab';
CompanyResearchResults.displayName = 'CompanyResearchResults';

export default CompanyResearchTab;