import React, { useState, memo, useCallback } from 'react';
import { 
  Library, 
  Search, 
  Copy,
  Star,
  Filter,
  Eye,
  Edit3,
  Sparkles,
  Code,
  PieChart,
  TrendingUp,
  Users,
  Heart,
  Briefcase,
  GraduationCap,
  Building,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

interface TemplateSection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  templates: Template[];
}

interface Template {
  id: string;
  name: string;
  type: 'opening' | 'hook' | 'body' | 'closing';
  content: string;
  industry: string[];
  experience_level: string[];
  tone: string[];
  success_rate?: number;
  usage_count?: number;
  variables?: string[];
}

interface HookPhrase {
  id: string;
  industry: string;
  phrases: string[];
  icon: React.ReactNode;
  color: string;
  description: string;
}

const HOOK_PHRASES: HookPhrase[] = [
  {
    id: 'tech',
    industry: 'Tech & Développement',
    icon: <Code className="w-5 h-5" />,
    color: 'blue',
    description: 'Phrases d\'accroche pour le secteur technologique',
    phrases: [
      "Transformer des lignes de code en impact business",
      "Créer des solutions qui simplifient la vie de millions d'utilisateurs", 
      "Faire grandir une équipe tech vers l'excellence",
      "Résoudre des problèmes complexes avec des solutions élégantes",
      "Construire l'infrastructure qui alimentera demain",
      "Développer des produits qui redefinissent l'expérience utilisateur"
    ]
  },
  {
    id: 'marketing',
    industry: 'Marketing & Communication',
    icon: <PieChart className="w-5 h-5" />,
    color: 'purple',
    description: 'Accroches percutantes pour le marketing digital',
    phrases: [
      "Transformer des insights data en croissance explosive",
      "Créer des campagnes qui marquent les esprits",
      "Générer du ROI là où d'autres voient des coûts",
      "Construire des marques qui résonnent émotionnellement", 
      "Décrypter les comportements consommateurs pour anticiper les tendances",
      "Orchestrer des stratégies omnicanales qui convertissent"
    ]
  },
  {
    id: 'sales',
    industry: 'Vente & Business Development',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'green',
    description: 'Accroches qui vendent pour les commerciaux',
    phrases: [
      "Transformer des prospects en ambassadeurs",
      "Créer de la valeur là où d'autres voient des objections",
      "Dépasser les objectifs n'est pas un défi, c'est une habitude",
      "Construire des relations durables qui génèrent du business récurrent",
      "Identifier les opportunités cachées dans chaque interaction",
      "Transformer les 'non' en opportunités d'apprentissage"
    ]
  },
  {
    id: 'design',
    industry: 'Design & UX/UI',
    icon: <Heart className="w-5 h-5" />,
    color: 'pink',
    description: 'Créativité et passion pour les designers',
    phrases: [
      "Créer des expériences qui émotionnent autant qu'elles fonctionnent",
      "Transformer des idées abstraites en solutions tangibles",
      "Designer l'invisible pour rendre l'impossible évident",
      "Équilibrer beauté et fonctionnalité dans chaque pixel",
      "Comprendre l'utilisateur avant de créer l'interface",
      "Révéler la simplicité derrière la complexité"
    ]
  },
  {
    id: 'finance',
    industry: 'Finance & Consulting',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'amber',
    description: 'Expertise et rigueur pour la finance',
    phrases: [
      "Transformer l'incertitude en stratégies gagnantes",
      "Créer de la valeur durable dans un environnement volatile",
      "Optimiser les performances tout en maîtrisant les risques",
      "Déceler les opportunités d'investissement avant les autres",
      "Traduire la complexité financière en décisions éclairées",
      "Construire des modèles qui anticipent les évolutions du marché"
    ]
  },
  {
    id: 'education',
    industry: 'Éducation & Formation',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'emerald',
    description: 'Passion pédagogique et transmission',
    phrases: [
      "Révéler le potentiel caché de chaque apprenant",
      "Transformer la curiosité en compétences durables",
      "Créer des expériences d'apprentissage inoubliables",
      "Adapter ma pédagogie à chaque style d'apprentissage",
      "Faire de l'échec une étape vers la réussite",
      "Inspirer la prochaine génération de leaders"
    ]
  }
];

const LETTER_TEMPLATES: TemplateSection[] = [
  {
    id: 'openings',
    name: 'Introductions Percutantes',
    description: 'Premiers paragraphes qui accrochent immédiatement',
    icon: <Target className="w-6 h-6" />,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    templates: [
      {
        id: 'standard_formal',
        name: 'Professionnel Classique',
        type: 'opening',
        content: 'Madame, Monsieur,\n\nVivement intéressé(e) par le poste de {position} au sein de {company}, je vous propose ma candidature en vous présentant mon parcours et mes motivations.',
        industry: ['finance', 'consulting', 'legal'],
        experience_level: ['intermediate', 'senior'],
        tone: ['professional'],
        success_rate: 78,
        usage_count: 1247,
        variables: ['position', 'company']
      },
      {
        id: 'creative_hook',
        name: 'Créatif avec Accroche',
        type: 'opening',
        content: 'Bonjour l\'équipe {company} !\n\n{hook_phrase} C\'est exactement ce que je ressens en découvrant votre offre {position}.',
        industry: ['tech', 'startup', 'design'],
        experience_level: ['junior', 'intermediate'],
        tone: ['creative', 'enthusiastic'],
        success_rate: 84,
        usage_count: 892,
        variables: ['company', 'hook_phrase', 'position']
      },
      {
        id: 'executive_leadership',
        name: 'Leadership Exécutif',
        type: 'opening',
        content: 'Madame la Directrice, Monsieur le Directeur,\n\nFort(e) de {experience_years} années d\'expérience en {domain}, je souhaite contribuer à la vision stratégique de {company}.',
        industry: ['all'],
        experience_level: ['senior', 'executive'],
        tone: ['professional', 'confident'],
        success_rate: 91,
        usage_count: 456,
        variables: ['experience_years', 'domain', 'company']
      }
    ]
  },
  {
    id: 'bodies',
    name: 'Corps de Lettre',
    description: 'Développement de votre profil et motivations',
    icon: <FileText className="w-6 h-6" />,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    templates: [
      {
        id: 'experience_highlight',
        name: 'Mise en Avant Expérience',
        type: 'body',
        content: 'Au cours de mon parcours chez {previous_company}, j\'ai développé une expertise approfondie en {key_skills}. Cette expérience m\'a permis de {major_achievement}, générant {quantified_result}.\n\nCe qui me motive particulièrement chez {company}, c\'est votre approche innovante de {industry_aspect}. Je suis convaincu(e) que mes compétences en {relevant_skills} peuvent contribuer significativement à vos objectifs.',
        industry: ['all'],
        experience_level: ['intermediate', 'senior'],
        tone: ['professional', 'confident'],
        success_rate: 82,
        usage_count: 1456,
        variables: ['previous_company', 'key_skills', 'major_achievement', 'quantified_result', 'company', 'industry_aspect', 'relevant_skills']
      },
      {
        id: 'passion_driven',
        name: 'Approche Passionnée',
        type: 'body',
        content: 'Ma passion pour {field} ne se limite pas à mes heures de travail. J\'ai récemment {personal_project}, ce qui m\'a permis d\'approfondir mes connaissances en {technical_skills}.\n\nVotre mission "{company_mission}" résonne profondément avec mes valeurs. Je vois dans ce poste l\'opportunité parfaite de combiner expertise technique et impact significatif.',
        industry: ['tech', 'design', 'education'],
        experience_level: ['junior', 'intermediate'],
        tone: ['creative', 'enthusiastic'],
        success_rate: 79,
        usage_count: 743,
        variables: ['field', 'personal_project', 'technical_skills', 'company_mission']
      }
    ]
  },
  {
    id: 'closings',
    name: 'Conclusions Efficaces',
    description: 'Finales qui invitent à l\'action',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    templates: [
      {
        id: 'professional_close',
        name: 'Conclusion Professionnelle',
        type: 'closing',
        content: 'Dans l\'attente de pouvoir échanger avec vous sur ma candidature et sur les défis passionnants qui attendent {company}, je vous prie d\'agréer mes salutations distinguées.',
        industry: ['finance', 'consulting', 'corporate'],
        experience_level: ['all'],
        tone: ['professional'],
        success_rate: 76,
        usage_count: 2134,
        variables: ['company']
      },
      {
        id: 'enthusiastic_close',
        name: 'Conclusion Enthousiasmante',
        type: 'closing',
        content: 'Hâte de contribuer à l\'aventure {company} et d\'échanger avec vous sur comment nous pouvons créer ensemble des solutions qui marquent !\n\nÀ très bientôt j\'espère ! 🚀',
        industry: ['startup', 'tech', 'creative'],
        experience_level: ['junior', 'intermediate'],
        tone: ['enthusiastic', 'creative'],
        success_rate: 85,
        usage_count: 567,
        variables: ['company']
      },
      {
        id: 'confident_close',
        name: 'Conclusion Confiante',
        type: 'closing',
        content: 'Je serais ravi(e) de discuter de quelle manière mon expertise peut accélérer la croissance de {company}. Disponible pour un entretien à votre convenance.',
        industry: ['sales', 'business', 'management'],
        experience_level: ['intermediate', 'senior'],
        tone: ['confident', 'professional'],
        success_rate: 88,
        usage_count: 891,
        variables: ['company']
      }
    ]
  }
];

const TemplatesLibraryTab = memo(() => {
  const [activeSection, setActiveSection] = useState<string>('hooks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedTone, setSelectedTone] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  }, []);

  const filteredHooks = HOOK_PHRASES.filter(hook => {
    if (selectedIndustry !== 'all' && selectedIndustry !== hook.id) return false;
    if (searchQuery && !hook.phrases.some(phrase => 
      phrase.toLowerCase().includes(searchQuery.toLowerCase())
    )) return false;
    return true;
  });

  const filteredTemplates = LETTER_TEMPLATES.map(section => ({
    ...section,
    templates: section.templates.filter(template => {
      if (selectedIndustry !== 'all' && !template.industry.includes(selectedIndustry) && !template.industry.includes('all')) return false;
      if (selectedTone !== 'all' && !template.tone.includes(selectedTone)) return false;
      if (searchQuery && !template.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
  })).filter(section => section.templates.length > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          📚 Bibliothèque Templates & Accroches
        </h2>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          Collection premium de phrases d'accroche sectorielles et templates professionnels pour des lettres qui marquent
        </p>
      </div>

      {/* Navigation & Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Section Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveSection('hooks')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeSection === 'hooks' 
                  ? 'bg-indigo-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Accroches
            </button>
            <button
              onClick={() => setActiveSection('templates')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeSection === 'templates' 
                  ? 'bg-indigo-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Library className="w-4 h-4 inline mr-2" />
              Templates
            </button>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Rechercher..."
            />
          </div>

          {/* Industry Filter */}
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Tous secteurs</option>
            <option value="tech">Tech</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Vente</option>
            <option value="design">Design</option>
            <option value="finance">Finance</option>
            <option value="education">Éducation</option>
          </select>

          {/* Tone Filter */}
          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Tous tons</option>
            <option value="professional">Professionnel</option>
            <option value="creative">Créatif</option>
            <option value="confident">Confiant</option>
            <option value="enthusiastic">Enthousiaste</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {activeSection === 'hooks' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Phrases d'Accroche Sectorielles</h3>
              <p className="text-gray-600">Premières impressions qui marquent, par secteur d'activité</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {filteredHooks.map((hookSection) => (
              <HookSectionCard 
                key={hookSection.id}
                section={hookSection}
                onCopy={handleCopy}
                copiedId={copiedId}
              />
            ))}
          </div>
        </div>
      )}

      {activeSection === 'templates' && (
        <div className="space-y-8">
          <div className="flex items-center space-x-3 mb-6">
            <Library className="w-8 h-8 text-indigo-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Templates Professionnels</h3>
              <p className="text-gray-600">Structures éprouvées pour chaque partie de votre lettre</p>
            </div>
          </div>

          {filteredTemplates.map((section) => (
            <TemplateSectionCard 
              key={section.id}
              section={section}
              onCopy={handleCopy}
              copiedId={copiedId}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const HookSectionCard = memo(({ 
  section, 
  onCopy, 
  copiedId 
}: {
  section: HookPhrase;
  onCopy: (content: string, id: string) => void;
  copiedId: string | null;
}) => (
  <div className={`bg-white rounded-2xl shadow-lg border-2 border-${section.color}-200 overflow-hidden`}>
    <div className={`bg-gradient-to-r from-${section.color}-500 to-${section.color}-600 text-white p-6`}>
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          {section.icon}
        </div>
        <div>
          <h4 className="text-xl font-bold">{section.industry}</h4>
          <p className="text-sm opacity-90">{section.description}</p>
        </div>
      </div>
    </div>

    <div className="p-6 space-y-3">
      {section.phrases.map((phrase, index) => {
        const phraseId = `${section.id}-${index}`;
        return (
          <div key={index} className={`group p-4 bg-${section.color}-50 rounded-lg border border-${section.color}-200 hover:shadow-md transition-all duration-200`}>
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-800 leading-relaxed flex-1 mr-3">
                "{phrase}"
              </p>
              <button
                onClick={() => onCopy(phrase, phraseId)}
                className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                  copiedId === phraseId
                    ? 'bg-green-500 text-white'
                    : `bg-${section.color}-100 text-${section.color}-600 hover:bg-${section.color}-200 opacity-0 group-hover:opacity-100`
                }`}
              >
                {copiedId === phraseId ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
));

const TemplateSectionCard = memo(({ 
  section, 
  onCopy, 
  copiedId 
}: {
  section: TemplateSection;
  onCopy: (content: string, id: string) => void;
  copiedId: string | null;
}) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
    <div className={`bg-gradient-to-r ${section.gradient} text-white p-6`}>
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
          {section.icon}
        </div>
        <div>
          <h4 className="text-2xl font-bold">{section.name}</h4>
          <p className="text-sm opacity-90">{section.description}</p>
          <div className="flex items-center space-x-3 mt-2">
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
              {section.templates.length} templates
            </span>
          </div>
        </div>
      </div>
    </div>

    <div className="p-6 space-y-6">
      {section.templates.map((template) => (
        <TemplateCard 
          key={template.id}
          template={template}
          onCopy={onCopy}
          copiedId={copiedId}
          sectionColor={section.color}
        />
      ))}
    </div>
  </div>
));

const TemplateCard = memo(({ 
  template, 
  onCopy, 
  copiedId,
  sectionColor 
}: {
  template: Template;
  onCopy: (content: string, id: string) => void;
  copiedId: string | null;
  sectionColor: string;
}) => (
  <div className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200">
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h5 className="font-bold text-gray-800">{template.name}</h5>
            {template.success_rate && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">
                  {template.success_rate}% succès
                </span>
              </div>
            )}
            {template.usage_count && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600">
                  {template.usage_count.toLocaleString()} utilisations
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {template.industry.slice(0, 3).map((industry) => (
              <span key={industry} className={`px-2 py-1 bg-${sectionColor}-100 text-${sectionColor}-700 rounded-full text-xs font-medium`}>
                {industry === 'all' ? 'Tous secteurs' : industry}
              </span>
            ))}
            {template.industry.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{template.industry.length - 3}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onCopy(template.content, template.id)}
          className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
            copiedId === template.id
              ? 'bg-green-500 text-white'
              : `bg-${sectionColor}-100 text-${sectionColor}-600 hover:bg-${sectionColor}-200 opacity-0 group-hover:opacity-100`
          }`}
        >
          {copiedId === template.id ? (
            <>
              <CheckCircle className="w-4 h-4" />
            </>
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>

    <div className="p-4">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
          {template.content}
        </pre>
      </div>

      {template.variables && template.variables.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <Edit3 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Variables à personnaliser:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {template.variables.map((variable) => (
              <code key={variable} className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-mono">
                {`{${variable}}`}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
));

TemplatesLibraryTab.displayName = 'TemplatesLibraryTab';
HookSectionCard.displayName = 'HookSectionCard';
TemplateSectionCard.displayName = 'TemplateSectionCard';
TemplateCard.displayName = 'TemplateCard';

export default TemplatesLibraryTab;