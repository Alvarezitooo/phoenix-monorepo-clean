import React, { useState, memo, useCallback } from 'react';
import { 
  Sparkles, 
  Crown, 
  Rocket, 
  Palette, 
  Route, 
  GraduationCap,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  Loader2,
  CheckCircle,
  Star,
  ArrowRight,
  FileText,
  MessageSquare,
  Lightbulb
} from 'lucide-react';

interface LetterType {
  id: string;
  name: string;
  description: string;
  energy_cost: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  features: string[];
  ideal_for: string[];
  success_rate: number;
  avg_response_time: string;
  sample_intro: string;
  difficulty: 'facile' | 'intermédiaire' | 'avancé';
}

interface AdvancedForm {
  letter_type: string;
  tone: string;
  company_name: string;
  position_title: string;
  experience_level: string;
  industry: string;
  special_requirements: string;
  previous_role?: string;
  career_change_reason?: string;
}

const LETTER_TYPES: LetterType[] = [
  {
    id: 'standard',
    name: 'Standard Professionnel',
    description: 'Lettre classique et efficace pour la plupart des candidatures',
    energy_cost: 15,
    icon: <FileText className="w-6 h-6" />,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    features: [
      'Structure professionnelle classique',
      'Ton formel et respectueux',
      'Mise en avant de l\'expérience',
      'Adaptation secteur standard'
    ],
    ideal_for: [
      'Grandes entreprises traditionnelles',
      'Secteurs conservateurs (banque, droit)',
      'Postes corporate standards',
      'Candidatures spontanées'
    ],
    success_rate: 78,
    avg_response_time: '2 min',
    sample_intro: 'Madame, Monsieur,\n\nVivement intéressé(e) par le poste de [POSTE] au sein de [ENTREPRISE], je vous propose ma candidature...',
    difficulty: 'facile'
  },
  {
    id: 'creative',
    name: 'Créative & Originale',
    description: 'Lettre qui sort du lot avec personnalité et créativité',
    energy_cost: 20,
    icon: <Palette className="w-6 h-6" />,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    features: [
      'Accroche créative mémorable',
      'Storytelling personnalisé',
      'Ton dynamique et authentique',
      'Mise en scène de votre parcours'
    ],
    ideal_for: [
      'Startups et scale-ups',
      'Métiers créatifs (design, marketing)',
      'Entreprises innovantes',
      'Culture d\'entreprise décontractée'
    ],
    success_rate: 82,
    avg_response_time: '3 min',
    sample_intro: 'Bonjour l\'équipe [ENTREPRISE] !\n\n[HOOK CRÉATIF] C\'est exactement ce que je ressens en découvrant votre offre [POSTE]...',
    difficulty: 'intermédiaire'
  },
  {
    id: 'executive',
    name: 'Leadership & Executive',
    description: 'Lettre haut de gamme pour postes de direction et management',
    energy_cost: 25,
    icon: <Crown className="w-6 h-6" />,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'Vision stratégique mise en avant',
      'Exemples de leadership concrets',
      'Résultats quantifiés',
      'Ton d\'expert reconnu'
    ],
    ideal_for: [
      'Postes de direction (C-level)',
      'Management d\'équipes importantes',
      'Transformations d\'entreprise',
      'Secteurs à enjeux élevés'
    ],
    success_rate: 85,
    avg_response_time: '4 min',
    sample_intro: 'Madame la Directrice, Monsieur le Directeur,\n\nFort(e) de [X] années d\'expérience en leadership, je souhaite contribuer à la vision stratégique de [ENTREPRISE]...',
    difficulty: 'avancé'
  },
  {
    id: 'tech_startup',
    name: 'Tech & Startup',
    description: 'Lettre optimisée pour l\'écosystème tech et startup',
    energy_cost: 22,
    icon: <Rocket className="w-6 h-6" />,
    color: 'orange',
    gradient: 'from-orange-500 to-red-600',
    features: [
      'Vocabulaire tech approprié',
      'Passion produit et innovation',
      'Approche agile et collaborative',
      'Impact et métriques business'
    ],
    ideal_for: [
      'Startups tech et licornes',
      'Postes techniques (dev, product)',
      'Écosystème innovation',
      'Scale-ups en hyper-croissance'
    ],
    success_rate: 88,
    avg_response_time: '3.5 min',
    sample_intro: 'Salut l\'équipe [ENTREPRISE] !\n\nTransformer des lignes de code en impact business, c\'est ma passion. Votre mission chez [ENTREPRISE] résonne parfaitement...',
    difficulty: 'intermédiaire'
  },
  {
    id: 'career_change',
    name: 'Reconversion Carrière',
    description: 'Lettre spécialisée pour transition et reconversion professionnelle',
    energy_cost: 28,
    icon: <Route className="w-6 h-6" />,
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-600',
    features: [
      'Justification naturelle du changement',
      'Compétences transférables mises en avant',
      'Motivation authentique pour le nouveau secteur',
      'Stratégie de réduction des risques'
    ],
    ideal_for: [
      'Changement de secteur d\'activité',
      'Évolution de poste majeure',
      'Retour à l\'emploi après pause',
      'Transition métier/fonction'
    ],
    success_rate: 76,
    avg_response_time: '5 min',
    sample_intro: 'Bonjour,\n\nAprès [X] années enrichissantes en [ANCIEN_SECTEUR], je souhaite aujourd\'hui orienter ma carrière vers [NOUVEAU_SECTEUR] car...',
    difficulty: 'avancé'
  },
  {
    id: 'entry_level',
    name: 'Junior & Premier Emploi',
    description: 'Lettre optimisée pour jeunes diplômés et premiers postes',
    energy_cost: 18,
    icon: <GraduationCap className="w-6 h-6" />,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    features: [
      'Compensation du manque d\'expérience',
      'Mise en avant formation et projets',
      'Motivation et potentiel d\'évolution',
      'Soft skills et adaptabilité'
    ],
    ideal_for: [
      'Jeunes diplômés (0-2 ans exp)',
      'Premiers postes dans le secteur',
      'Stages de fin d\'études',
      'Alternances et formations'
    ],
    success_rate: 73,
    avg_response_time: '2.5 min',
    sample_intro: 'Bonjour,\n\nJeune diplômé(e) en [FORMATION] avec une forte motivation pour [SECTEUR], je candidate pour le poste de [POSTE]...',
    difficulty: 'facile'
  }
];

const TONES = [
  { id: 'professional', name: 'Professionnel', icon: '🎯', description: 'Ton corporate classique' },
  { id: 'enthusiastic', name: 'Enthousiaste', icon: '🚀', description: 'Dynamique et passionné' },
  { id: 'confident', name: 'Confiant', icon: '⚡', description: 'Assuré et expert' },
  { id: 'creative', name: 'Créatif', icon: '🎨', description: 'Innovant et original' },
  { id: 'humble', name: 'Respectueux', icon: '🙏', description: 'Modeste et respectueux' }
];

const AdvancedLetterTypesTab = memo(() => {
  const [selectedType, setSelectedType] = useState<LetterType | null>(null);
  const [form, setForm] = useState<AdvancedForm>({
    letter_type: '',
    tone: 'professional',
    company_name: '',
    position_title: '',
    experience_level: 'intermédiaire',
    industry: '',
    special_requirements: '',
    previous_role: '',
    career_change_reason: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const updateForm = useCallback((field: keyof AdvancedForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const selectLetterType = useCallback((type: LetterType) => {
    setSelectedType(type);
    setForm(prev => ({ ...prev, letter_type: type.id }));
    setShowForm(true);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setIsGenerating(true);
    try {
      // Simulation génération - en réalité appel API Luna Letters
      await new Promise(resolve => setTimeout(resolve, 4000));
      // Redirection vers résultats ou affichage inline
    } catch (error) {
      console.error('Erreur génération:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'facile': 'green',
      'intermédiaire': 'yellow',
      'avancé': 'red'
    };
    return colors[difficulty as keyof typeof colors] || 'gray';
  };

  const getDifficultyIcon = (difficulty: string) => {
    const icons = {
      'facile': '🟢',
      'intermédiaire': '🟡',
      'avancé': '🔴'
    };
    return icons[difficulty as keyof typeof icons] || '⚪';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          ✨ Types de Lettres Avancés
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Choisissez le type de lettre parfaitement adapté à votre situation et votre cible
        </p>
      </div>

      {/* Letter Types Grid */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {LETTER_TYPES.map((type) => (
          <LetterTypeCard 
            key={type.id} 
            type={type}
            isSelected={selectedType?.id === type.id}
            onSelect={() => selectLetterType(type)}
            getDifficultyColor={getDifficultyColor}
            getDifficultyIcon={getDifficultyIcon}
          />
        ))}
      </div>

      {/* Advanced Form */}
      {showForm && selectedType && (
        <AdvancedLetterForm
          selectedType={selectedType}
          form={form}
          updateForm={updateForm}
          onSubmit={handleGenerate}
          isGenerating={isGenerating}
          tones={TONES}
        />
      )}
    </div>
  );
});

const LetterTypeCard = memo(({ 
  type, 
  isSelected, 
  onSelect,
  getDifficultyColor,
  getDifficultyIcon
}: {
  type: LetterType;
  isSelected: boolean;
  onSelect: () => void;
  getDifficultyColor: (difficulty: string) => string;
  getDifficultyIcon: (difficulty: string) => string;
}) => {
  const difficultyColor = getDifficultyColor(type.difficulty);

  return (
    <div 
      onClick={onSelect}
      className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-xl ${
        isSelected 
          ? `border-${type.color}-500 shadow-${type.color}-200` 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Card Header */}
      <div className={`bg-gradient-to-r ${type.gradient} text-white p-6 rounded-t-2xl`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              {type.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold">{type.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-2xl font-bold">{type.energy_cost}⚡</span>
                <span className="text-xs opacity-75">énergie</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs opacity-75">Difficulté</span>
            <span className="text-lg">{getDifficultyIcon(type.difficulty)}</span>
          </div>
        </div>
        
        <p className="text-sm opacity-90 leading-relaxed">
          {type.description}
        </p>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-4">
        {/* Success Metrics */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">
              {type.success_rate}% succès
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">
              {type.avg_response_time}
            </span>
          </div>
        </div>

        {/* Features */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-2 text-sm">✨ Fonctionnalités:</h5>
          <div className="space-y-1">
            {type.features.slice(0, 2).map((feature, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-600">{feature}</span>
              </div>
            ))}
            {type.features.length > 2 && (
              <div className="text-xs text-gray-500 ml-5">
                +{type.features.length - 2} autres fonctionnalités...
              </div>
            )}
          </div>
        </div>

        {/* Ideal For Preview */}
        <div>
          <h5 className="font-semibold text-gray-800 mb-2 text-sm">🎯 Idéal pour:</h5>
          <div className="text-xs text-gray-600">
            {type.ideal_for[0]}
          </div>
          {type.ideal_for.length > 1 && (
            <div className="text-xs text-gray-500">
              +{type.ideal_for.length - 1} autres contextes...
            </div>
          )}
        </div>

        {/* Sample Preview */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h5 className="font-semibold text-gray-800 mb-2 text-xs">📝 Aperçu style:</h5>
          <div className="text-xs text-gray-600 leading-relaxed font-mono bg-white rounded p-2 border">
            {type.sample_intro.substring(0, 80)}...
          </div>
        </div>

        {/* Select Button */}
        <div className="pt-2">
          <button className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            isSelected
              ? `bg-gradient-to-r ${type.gradient} text-white shadow-lg`
              : `border-2 border-${type.color}-200 text-${type.color}-600 hover:bg-${type.color}-50`
          }`}>
            {isSelected ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Type sélectionné</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Choisir ce type</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

const AdvancedLetterForm = memo(({
  selectedType,
  form,
  updateForm,
  onSubmit,
  isGenerating,
  tones
}: {
  selectedType: LetterType;
  form: AdvancedForm;
  updateForm: (field: keyof AdvancedForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isGenerating: boolean;
  tones: Array<{id: string, name: string, icon: string, description: string}>;
}) => {
  const showCareerChangeFields = selectedType.id === 'career_change';

  return (
    <div className={`bg-gradient-to-br from-white to-${selectedType.color}-50 rounded-2xl shadow-xl p-8 border border-${selectedType.color}-200`}>
      <div className="flex items-center space-x-4 mb-8">
        <div className={`w-16 h-16 bg-gradient-to-r ${selectedType.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
          {selectedType.icon}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">
            Configuration {selectedType.name}
          </h3>
          <div className="flex items-center space-x-4 mt-1">
            <span className={`text-${selectedType.color}-600 font-semibold`}>
              {selectedType.energy_cost}⚡ énergie requise
            </span>
            <span className={`px-2 py-1 bg-${selectedType.color}-100 text-${selectedType.color}-700 rounded-full text-xs font-medium`}>
              Taux de succès: {selectedType.success_rate}%
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="h-4 w-4 inline mr-2" />
              Entreprise cible *
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => updateForm('company_name', e.target.value)}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${selectedType.color}-500 focus:border-transparent`}
              placeholder="Ex: Microsoft, Airbnb..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="h-4 w-4 inline mr-2" />
              Poste visé *
            </label>
            <input
              type="text"
              value={form.position_title}
              onChange={(e) => updateForm('position_title', e.target.value)}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${selectedType.color}-500 focus:border-transparent`}
              placeholder="Ex: Product Manager..."
              required
            />
          </div>
        </div>

        {/* Experience & Industry */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 inline mr-2" />
              Niveau d'expérience
            </label>
            <select
              value={form.experience_level}
              onChange={(e) => updateForm('experience_level', e.target.value)}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${selectedType.color}-500 focus:border-transparent`}
            >
              <option value="débutant">Débutant (0-2 ans)</option>
              <option value="intermédiaire">Intermédiaire (2-5 ans)</option>
              <option value="expérimenté">Expérimenté (5-10 ans)</option>
              <option value="expert">Expert (10+ ans)</option>
              <option value="senior">Senior/Leadership (15+ ans)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Secteur d'activité
            </label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => updateForm('industry', e.target.value)}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${selectedType.color}-500 focus:border-transparent`}
              placeholder="Ex: Tech, Finance, Santé..."
            />
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Ton de communication souhaité
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {tones.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => updateForm('tone', tone.id)}
                className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                  form.tone === tone.id
                    ? `border-${selectedType.color}-500 bg-${selectedType.color}-50 text-${selectedType.color}-700`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xl mb-1">{tone.icon}</div>
                <div className="text-sm font-medium">{tone.name}</div>
                <div className="text-xs text-gray-500 mt-1">{tone.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Career Change Specific Fields */}
        {showCareerChangeFields && (
          <div className={`bg-${selectedType.color}-50 rounded-lg p-6 border border-${selectedType.color}-200 space-y-4`}>
            <h4 className={`font-semibold text-${selectedType.color}-800 flex items-center space-x-2`}>
              <Route className="h-4 w-4" />
              <span>Spécifique Reconversion</span>
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poste/secteur précédent
                </label>
                <input
                  type="text"
                  value={form.previous_role}
                  onChange={(e) => updateForm('previous_role', e.target.value)}
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${selectedType.color}-500 focus:border-transparent`}
                  placeholder="Ex: Comptable en cabinet..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivation du changement
                </label>
                <select
                  value={form.career_change_reason}
                  onChange={(e) => updateForm('career_change_reason', e.target.value)}
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${selectedType.color}-500 focus:border-transparent`}
                >
                  <option value="">Sélectionner...</option>
                  <option value="passion">Suivre ma passion</option>
                  <option value="growth">Opportunités de croissance</option>
                  <option value="challenge">Nouveau défi professionnel</option>
                  <option value="balance">Meilleur équilibre vie/travail</option>
                  <option value="market">Évolution du marché</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Special Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Lightbulb className="h-4 w-4 inline mr-2" />
            Exigences particulières (optionnel)
          </label>
          <textarea
            value={form.special_requirements}
            onChange={(e) => updateForm('special_requirements', e.target.value)}
            className={`w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-${selectedType.color}-500 focus:border-transparent`}
            placeholder="Éléments spécifiques à inclure: références, projets, compétences particulières..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            disabled={isGenerating || !form.company_name.trim() || !form.position_title.trim()}
            className={`px-8 py-4 bg-gradient-to-r ${selectedType.gradient} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Luna crée votre lettre {selectedType.name.toLowerCase()}...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Générer ma lettre {selectedType.name}</span>
                <span className="bg-white/20 px-2 py-1 rounded text-sm">
                  {selectedType.energy_cost}⚡
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
});

AdvancedLetterTypesTab.displayName = 'AdvancedLetterTypesTab';
LetterTypeCard.displayName = 'LetterTypeCard';
AdvancedLetterForm.displayName = 'AdvancedLetterForm';

export default AdvancedLetterTypesTab;