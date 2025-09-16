import React, { memo, useState, useCallback, useEffect } from 'react';
import { 
  Palette, 
  Search, 
  Filter, 
  Star, 
  Users, 
  CheckCircle, 
  Download, 
  Eye,
  TrendingUp,
  Award,
  Building,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  Globe,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react';

// Mock templates data from backend (20 templates organizés par catégorie)
const TEMPLATES_DATA = [
  // === CATÉGORIE SOBRE PROFESSIONNEL ===
  {
    id: "executive_minimal",
    name: "Executive Minimal",
    description: "Design ultra-épuré pour dirigeants et cadres supérieurs",
    category: "Sobre Professionnel",
    preview: "/templates/executive-minimal-template.png",
    template_file: "/templates/executive-minimal-template.html",
    ats_compatible: true,
    popularity: 95,
    sectors: ["Direction", "C-Level", "Consulting", "Finance"],
    features: ["Typographie classique", "Espacement généreux", "Focus sur l'expérience"],
    color_scheme: "monochrome",
    layout: "single-column"
  },
  {
    id: "finance_classic",
    name: "Finance Classic", 
    description: "Format traditionnel pour secteurs bancaires et financiers",
    category: "Sobre Professionnel",
    preview: "/templates/finance-classic-template.png",
    template_file: "/templates/finance-classic-template.html",
    ats_compatible: true,
    popularity: 88,
    sectors: ["Finance", "Banque", "Assurance", "Audit"],
    features: ["Format conservateur", "Sections claires", "Optimisé ATS"],
    color_scheme: "blue-gray",
    layout: "two-column"
  },
  {
    id: "legal_formal",
    name: "Legal Formal",
    description: "Template élégant pour professions juridiques",
    category: "Sobre Professionnel",
    preview: "/templates/legal-formal-template.png",
    template_file: "/templates/legal-formal-template.html",
    ats_compatible: true,
    popularity: 82,
    sectors: ["Juridique", "Notariat", "Administration", "Public"],
    features: ["Typographie serif", "Structure formelle", "Présentation rigoureuse"],
    color_scheme: "dark-gray",
    layout: "single-column"
  },
  {
    id: "silicon_valley",
    name: "Silicon Valley",
    description: "Design moderne pour écosystème tech américain",
    category: "Moderne Tech",
    preview: "/templates/silicon-valley-template.png",
    template_file: "/templates/silicon-valley-template.html",
    ats_compatible: true,
    popularity: 94,
    sectors: ["Tech", "Startup", "SaaS", "IA/ML"],
    features: ["Design système", "Métriques mises en avant", "Stack technique"],
    color_scheme: "purple-gradient",
    layout: "modern-grid"
  },
  {
    id: "designer_portfolio",
    name: "Designer Portfolio",
    description: "Showcase créatif pour designers et artistes",
    category: "Créative",
    preview: "/templates/designer-portfolio-template.png",
    template_file: "/templates/designer-portfolio-template.html",
    ats_compatible: false,
    popularity: 78,
    sectors: ["Design", "Arts", "Mode", "Architecture"],
    features: ["Portfolio intégré", "Typographie créative", "Couleurs brand"],
    color_scheme: "creative-multi",
    layout: "asymmetric"
  }
];

// Types
interface TemplatesGalleryTabProps {
  onNavigateToBuilder?: (templateId: string) => void;
}

interface FilterState {
  category: string;
  atsCompatible: boolean;
  layout: string;
  searchTerm: string;
}

const TemplatesGalleryTab = memo(({ onNavigateToBuilder }: TemplatesGalleryTabProps = {}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'gallery' | 'detailed' | 'compare'>('gallery');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    atsCompatible: false,
    layout: 'all',
    searchTerm: ''
  });

  const [templates] = useState(TEMPLATES_DATA);
  const [categories] = useState([
    { id: 'all', name: 'Tous les templates', count: templates.length },
    ...Object.entries(
      templates.reduce((acc: Record<string, number>, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, count]) => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name, count }))
  ]);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = filters.category === 'all' || 
      template.category.toLowerCase().replace(/\s+/g, '-') === filters.category;
    const matchesATS = !filters.atsCompatible || template.ats_compatible;
    const matchesSearch = !filters.searchTerm || 
      template.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesCategory && matchesATS && matchesSearch;
  });

  const getColorSchemePreview = (colorScheme: string) => {
    const schemes = {
      'monochrome': 'bg-gradient-to-r from-gray-700 to-gray-900',
      'blue-gray': 'bg-gradient-to-r from-blue-600 to-gray-700',
      'dark-gray': 'bg-gradient-to-r from-gray-800 to-gray-900',
      'purple-gradient': 'bg-gradient-to-r from-purple-600 to-indigo-600',
      'creative-multi': 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500'
    };
    return schemes[colorScheme as keyof typeof schemes] || schemes.monochrome;
  };

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Galerie de Templates CV</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Choisissez parmi notre collection de templates professionnels, optimisés pour votre secteur d'activité
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un template..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setFilters(prev => ({ ...prev, category: category.id }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filters.category === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* ATS filter */}
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.atsCompatible}
            onChange={(e) => setFilters(prev => ({ ...prev, atsCompatible: e.target.checked }))}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">Uniquement les templates compatibles ATS</span>
        </label>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => setSelectedTemplate(template.id)}
            getColorSchemePreview={getColorSchemePreview}
            onNavigateToBuilder={onNavigateToBuilder}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun template trouvé</h3>
          <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
        </div>
      )}

      {/* Stats */}
      <div className="text-center text-sm text-gray-500">
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} affiché{filteredTemplates.length !== 1 ? 's' : ''} sur {templates.length} disponible{templates.length !== 1 ? 's' : ''}
      </div>

      {/* Modal Détail Template */}
      {showDetailModal && selectedTemplate && (
        <TemplateDetailModal 
          template={templates.find(t => t.id === selectedTemplate)!}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTemplate(null);
          }}
          onUseTemplate={(templateId: string) => {
            setShowDetailModal(false);
            if (onNavigateToBuilder) {
              onNavigateToBuilder(templateId);
            }
          }}
        />
      )}
    </div>
  );
});

const TemplateCard = memo(({ 
  template, 
  onSelect,
  getColorSchemePreview,
  onNavigateToBuilder
}: {
  template: typeof TEMPLATES_DATA[0];
  onSelect: () => void;
  getColorSchemePreview: (colorScheme: string) => string;
  onNavigateToBuilder?: (templateId: string) => void;
}) => {
  return (
    <div className="group bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer"
         onClick={onSelect}>
      
      {/* Preview */}
      <div className="relative h-48 bg-gray-50 overflow-hidden border-b border-gray-200">
        <div className={`absolute top-0 left-0 right-0 h-2 ${getColorSchemePreview(template.color_scheme)}`} />
        
        <div className="p-4 pt-6 h-full flex items-center justify-center">
          <img 
            src={template.preview} 
            alt={template.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2Y4ZjlmYSIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTI1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Yjc0ODEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFwZXLDp3UgZHUgdGVtcGxhdGU8L3RleHQ+Cjwvc3ZnPg==';
            }}
          />
        </div>

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col space-y-1">
          {template.ats_compatible && (
            <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full shadow-lg">
              ATS ✓
            </span>
          )}
          {template.popularity >= 90 && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full shadow-lg">
              TOP
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h5 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
              {template.name}
            </h5>
            <div className="flex items-center space-x-1 text-orange-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{template.popularity}%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm">{template.description}</p>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {template.features.slice(0, 3).map((feature, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
              {feature}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigateToBuilder) {
                onNavigateToBuilder(template.id);
              }
            }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Utiliser ce template</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTemplate(template.id);
              setShowDetailModal(true);
            }}
            className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 text-sm">
            <Eye className="h-4 w-4" />
            <span>Voir le détail</span>
          </button>
        </div>
      </div>
    </div>
  );
});

const TemplateDetailModal = memo(({ 
  template, 
  onClose, 
  onUseTemplate 
}: {
  template: typeof TEMPLATES_DATA[0];
  onClose: () => void;
  onUseTemplate: (templateId: string) => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-gray-600">{template.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-2xl text-gray-400">×</span>
            </button>
          </div>

          {/* Template Preview Large */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <img 
                src={template.preview}
                alt={template.name}
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y4ZjlmYSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2Yjc0ODEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFwZXLDp3UgZHUgdGVtcGxhdGU8L3RleHQ+Cjwvc3ZnPg==';
                }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Informations */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Informations</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Catégorie:</span>
                  <span className="text-sm text-gray-900">{template.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Popularité:</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-current text-orange-500" />
                    <span className="text-sm text-gray-900">{template.popularity}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Compatible ATS:</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    template.ats_compatible 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {template.ats_compatible ? 'Oui' : 'Non'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Mise en page:</span>
                  <span className="text-sm text-gray-900 capitalize">{template.layout.replace('-', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Secteurs et caractéristiques */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Secteurs recommandés</h4>
              <div className="flex flex-wrap gap-2">
                {template.sectors.map((sector, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {sector}
                  </span>
                ))}
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mt-4">Caractéristiques</h4>
              <div className="space-y-2">
                {template.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => onUseTemplate(template.id)}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Sparkles className="h-5 w-5" />
              <span>Utiliser ce template</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TemplatesGalleryTab;