import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Zap, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Target,
  Lightbulb,
  ArrowRight,
  Star,
  Award,
  Rocket,
  Brain,
  Heart
} from 'lucide-react';
import { useLuna } from '../../../luna';
import { useNarrativeCapture } from '../../../services/narrativeCapture';
import { phoenixAubeApi } from '../../../services/aubeApiPhoenix';

interface RoadmapOption {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  style: 'accelerated' | 'balanced' | 'exploratory';
  icon: React.ReactNode;
  phases: RoadmapPhase[];
  matchScore: number;
  energyCost: number;
  phoenixActions: PhoenixAction[];
  personalizedInsight: string;
}

interface RoadmapPhase {
  id: string;
  title: string;
  duration: string;
  description: string;
  keyActions: string[];
  milestones: string[];
}

interface PhoenixAction {
  type: 'cv_optimization' | 'letters_generation' | 'luna_coaching' | 'networking';
  title: string;
  description: string;
  energyCost: number;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
}

interface RoadmapChoiceProps {
  selectedCareer: any;
  psychometricResults?: {
    bigFive: { extraversion: number; [key: string]: number };
    riasec: { [key: string]: number };
  };
  onRoadmapSelected: (roadmap: RoadmapOption) => void;
  onBack: () => void;
}

const RoadmapChoiceComponent: React.FC<RoadmapChoiceProps> = ({
  selectedCareer,
  psychometricResults,
  onRoadmapSelected,
  onBack
}) => {
  const navigate = useNavigate();
  const luna = useLuna();
  const { captureAction } = useNarrativeCapture();
  
  const [roadmapOptions, setRoadmapOptions] = useState<RoadmapOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Generate personalized roadmaps using Phoenix API + psychometric data
  useEffect(() => {
    generatePersonalizedRoadmaps();
  }, [selectedCareer, psychometricResults]);

  const generatePersonalizedRoadmaps = async () => {
    setIsGenerating(true);
    
    try {
      // For demo, create intelligent roadmaps based on psychometric profile
      const baseRoadmaps = generateIntelligentRoadmaps();
      setRoadmapOptions(baseRoadmaps);
      
      // Capture roadmap generation event
      await captureAction(
        'roadmap_options_generated',
        'aube',
        {
          selectedCareer: selectedCareer.title,
          psychometricProfile: psychometricResults,
          roadmapCount: baseRoadmaps.length,
          topMatchScore: Math.max(...baseRoadmaps.map(r => r.matchScore))
        }
      );
      
    } catch (error) {
      console.error('Error generating roadmaps:', error);
      // Fallback to basic roadmaps
      setRoadmapOptions(generateBasicRoadmaps());
    } finally {
      setIsGenerating(false);
    }
  };

  const generateIntelligentRoadmaps = (): RoadmapOption[] => {
    const extraversion = psychometricResults?.bigFive?.extraversion || 3;
    const riasecSocial = psychometricResults?.riasec?.social || 3;
    const riasecInvestigative = psychometricResults?.riasec?.investigative || 3;

    return [
      // Accelerated Path - For high achievers
      {
        id: 'accelerated',
        title: '🚀 Roadmap Accéléré',
        subtitle: 'Transition intensive et structurée',
        duration: '6 mois',
        style: 'accelerated',
        icon: <Rocket className="w-6 h-6" />,
        matchScore: calculateMatchScore('accelerated', psychometricResults),
        energyCost: 120,
        personalizedInsight: extraversion > 4 
          ? "Ton profil extraverti adore les défis intenses !"
          : "Parfait pour ton côté déterminé et focus.",
        phases: [
          {
            id: 'foundations',
            title: 'Phase 1: Fondations Intensives',
            duration: '2 mois',
            description: 'Formation accélérée et acquisition compétences core',
            keyActions: [
              'Formation technique 40h/semaine',
              'Projet portfolio challenge',
              'Certification rapide'
            ],
            milestones: ['Première compétence maîtrisée', 'Portfolio fonctionnel']
          },
          {
            id: 'application',
            title: 'Phase 2: Application Directe',
            duration: '2 mois', 
            description: 'Mise en pratique immédiate et networking intensif',
            keyActions: [
              'Stage intensif ou mission freelance',
              'Networking quotidien (5 contacts/jour)',
              'Candidatures ciblées premium'
            ],
            milestones: ['Premier contrat/stage', '20 contacts qualifiés réseau']
          },
          {
            id: 'transition',
            title: 'Phase 3: Transition Finale',
            duration: '2 mois',
            description: 'Négociation poste et intégration rapide',
            keyActions: [
              'Négociation salaire agressive',
              'Intégration express nouvelle équipe',
              'Plan évolution 1 an'
            ],
            milestones: ['CDI signé', 'Intégration réussie']
          }
        ],
        phoenixActions: [
          {
            type: 'cv_optimization',
            title: '📄 CV Transition Express',
            description: 'CV optimisé pour reconversion rapide',
            energyCost: 25,
            estimatedTime: '30 min',
            priority: 'high'
          },
          {
            type: 'letters_generation', 
            title: '✍️ Lettres Motivation Impact',
            description: 'Lettres percutantes pour transition accélérée',
            energyCost: 20,
            estimatedTime: '45 min',
            priority: 'high'
          },
          {
            type: 'luna_coaching',
            title: '🌙 Coaching Intensif Luna',
            description: 'Sessions coaching quotidiennes',
            energyCost: 60,
            estimatedTime: '15 min/jour',
            priority: 'high'
          }
        ]
      },
      
      // Balanced Path - For most users
      {
        id: 'balanced',
        title: '⚖️ Roadmap Équilibré',
        subtitle: 'Approche humaine et durable',
        duration: '12 mois',
        style: 'balanced',
        icon: <Heart className="w-6 h-6" />,
        matchScore: calculateMatchScore('balanced', psychometricResults),
        energyCost: 180,
        personalizedInsight: riasecSocial > 3.5
          ? "Ton côté social va adorer le mix formation + networking !"
          : "Parfait équilibre entre apprentissage et action.",
        phases: [
          {
            id: 'exploration',
            title: 'Phase 1: Exploration Douce',
            duration: '3 mois',
            description: 'Découverte progressive et construction réseau',
            keyActions: [
              'Formation week-end (10h/semaine)',
              'Meetups et events secteur (2/mois)',
              'Projets perso exploration'
            ],
            milestones: ['Bases solides acquises', 'Réseau de 10 contacts']
          },
          {
            id: 'development',
            title: 'Phase 2: Développement',
            duration: '6 mois',
            description: 'Montée en compétences et premières expériences',
            keyActions: [
              'Formation certifiante (20h/semaine)',
              'Stage ou mission bénévole',
              'Mentoring personnalisé'
            ],
            milestones: ['Certification obtenue', 'Première expérience terrain']
          },
          {
            id: 'transition_smooth',
            title: 'Phase 3: Transition Progressive',
            duration: '3 mois',
            description: 'Candidatures ciblées et négociation sereine',
            keyActions: [
              'Candidatures quality over quantity',
              'Préparation entretiens avec coach',
              'Négociation accompagnée'
            ],
            milestones: ['5 entretiens qualifiés', 'Poste idéal trouvé']
          }
        ],
        phoenixActions: [
          {
            type: 'cv_optimization',
            title: '📄 CV Évolution Progressive',
            description: 'CV qui raconte votre parcours de transition',
            energyCost: 20,
            estimatedTime: '45 min',
            priority: 'medium'
          },
          {
            type: 'letters_generation',
            title: '✍️ Lettres Storytelling',
            description: 'Lettres qui valorisent votre parcours unique',
            energyCost: 18,
            estimatedTime: '1h',
            priority: 'medium'
          },
          {
            type: 'luna_coaching',
            title: '🌙 Coaching Bienveillant',
            description: 'Accompagnement psychologique de la transition',
            energyCost: 35,
            estimatedTime: '30 min/semaine',
            priority: 'high'
          }
        ]
      },

      // Exploratory Path - For deep learners
      {
        id: 'exploratory',
        title: '🔬 Roadmap Exploratoire',
        subtitle: 'Recherche approfondie et maîtrise',
        duration: '18 mois',
        style: 'exploratory',
        icon: <Brain className="w-6 h-6" />,
        matchScore: calculateMatchScore('exploratory', psychometricResults),
        energyCost: 250,
        personalizedInsight: riasecInvestigative > 4
          ? "Ton profil analytique va adorer l'approche recherche !"
          : "Parfait pour maîtriser tous les aspects du métier.",
        phases: [
          {
            id: 'research',
            title: 'Phase 1: Recherche Exhaustive',
            duration: '6 mois',
            description: 'Analyse complète du secteur et des opportunités',
            keyActions: [
              'Veille sectorielle quotidienne',
              'Interviews d\'experts (1/semaine)',
              'Analyse comparative métiers'
            ],
            milestones: ['Expertise secteur acquise', 'Réseau expert constitué']
          },
          {
            id: 'experimentation',
            title: 'Phase 2: Expérimentation',
            duration: '8 mois',
            description: 'Tests multiples et acquisition expertise',
            keyActions: [
              'Formations multiples et croisées',
              'Projets expérimentaux variés',
              'Stages d\'observation secteur'
            ],
            milestones: ['3 spécialisations testées', 'Choix expertise finalisé']
          },
          {
            id: 'mastery',
            title: 'Phase 3: Maîtrise et Positionnement',
            duration: '4 mois',
            description: 'Expertise reconnue et positionnement premium',
            keyActions: [
              'Spécialisation expertise pointue',
              'Publications et speaking',
              'Candidatures expert'
            ],
            milestones: ['Reconnaissance expertise', 'Poste senior obtenu']
          }
        ],
        phoenixActions: [
          {
            type: 'cv_optimization',
            title: '📄 CV Expert Technique',
            description: 'CV démontrant expertise et leadership',
            energyCost: 30,
            estimatedTime: '1h30',
            priority: 'medium'
          },
          {
            type: 'letters_generation',
            title: '✍️ Lettres Expertise',
            description: 'Lettres positionnant votre expertise unique',
            energyCost: 25,
            estimatedTime: '1h15',
            priority: 'medium'
          },
          {
            type: 'luna_coaching',
            title: '🌙 Coaching Stratégique',
            description: 'Accompagnement leadership et positionnement',
            energyCost: 45,
            estimatedTime: '45 min/semaine',
            priority: 'high'
          }
        ]
      }
    ];
  };

  const calculateMatchScore = (style: string, psychoResults?: any): number => {
    if (!psychoResults) return 75; // Default score

    const { bigFive, riasec } = psychoResults;
    let score = 70; // Base score

    switch (style) {
      case 'accelerated':
        // High conscientiousness + low neuroticism = good for intense pace
        if (bigFive?.conscientiousness > 4) score += 15;
        if (bigFive?.extraversion > 3.5) score += 10;
        break;
      
      case 'balanced':
        // Good for most profiles, bonus for social
        if (riasec?.social > 3.5) score += 12;
        if (bigFive?.agreeableness > 3.5) score += 8;
        score += 5; // Balanced is generally good
        break;
      
      case 'exploratory':
        // High openness + investigative = perfect match
        if (bigFive?.openness > 4) score += 18;
        if (riasec?.investigative > 4) score += 15;
        break;
    }

    return Math.min(score, 98); // Cap at 98%
  };

  const generateBasicRoadmaps = (): RoadmapOption[] => {
    // Fallback roadmaps if API fails
    return [
      {
        id: 'standard',
        title: '🎯 Roadmap Standard',
        subtitle: 'Approche progressive et sûre',
        duration: '9 mois',
        style: 'balanced',
        icon: <Target className="w-6 h-6" />,
        matchScore: 85,
        energyCost: 150,
        personalizedInsight: "Plan équilibré adapté à votre reconversion",
        phases: [],
        phoenixActions: []
      }
    ];
  };

  const handleRoadmapSelect = async (roadmap: RoadmapOption) => {
    setSelectedOption(roadmap.id);
    
    // Capture selection
    await captureAction(
      'roadmap_selected',
      'aube',
      {
        roadmapId: roadmap.id,
        roadmapStyle: roadmap.style,
        matchScore: roadmap.matchScore,
        duration: roadmap.duration,
        energyCost: roadmap.energyCost
      }
    );

    // Save to Luna context with full roadmap data
    luna.setCareerChoice({
      selectedCareer,
      chosenRoadmap: roadmap,
      psychometricResults,
      choiceTimestamp: Date.now(),
      sourceModule: 'aube'
    });

    // Navigate to journal with roadmap
    setTimeout(() => {
      navigate('/journal', {
        state: {
          fromAube: true,
          newRoadmap: roadmap,
          selectedCareer,
          timestamp: Date.now()
        }
      });
    }, 1500);

    // Call parent callback
    onRoadmapSelected(roadmap);
  };

  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="mb-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
              <Brain className="absolute inset-0 h-20 w-20 text-yellow-400 animate-pulse mx-auto" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🧠 Luna génère vos roadmaps personnalisées...
          </h2>
          <div className="space-y-3 text-lg text-gray-600">
            <p className="animate-pulse">🎯 Analyse de votre profil psychométrique...</p>
            <p className="animate-pulse">🚀 Création de 3 parcours sur-mesure...</p>
            <p className="animate-pulse">✨ Optimisation Phoenix intégrée...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <button 
          onClick={onBack}
          className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Retour aux résultats
        </button>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🗺️ Choisissez votre roadmap pour {selectedCareer.title}
        </h2>
        <p className="text-xl text-gray-600">
          3 parcours personnalisés basés sur votre profil psychométrique
        </p>
      </div>

      {/* Roadmap Options */}
      <div className="grid gap-8">
        {roadmapOptions.map((roadmap, index) => (
          <RoadmapCard
            key={roadmap.id}
            roadmap={roadmap}
            isRecommended={roadmap.matchScore >= 90}
            isSelected={selectedOption === roadmap.id}
            onSelect={() => handleRoadmapSelect(roadmap)}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
};

const RoadmapCard: React.FC<{
  roadmap: RoadmapOption;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
  rank: number;
}> = ({ roadmap, isRecommended, isSelected, onSelect, rank }) => {
  const getStyleColors = (style: string) => {
    switch (style) {
      case 'accelerated':
        return 'from-red-500 to-orange-600';
      case 'balanced':
        return 'from-emerald-500 to-blue-600';
      case 'exploratory':
        return 'from-purple-500 to-indigo-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 ${
      isRecommended ? 'border-gold-400 shadow-gold-200' : 'border-gray-200'
    } ${isSelected ? 'scale-105 shadow-2xl' : 'hover:shadow-xl'}`}>
      
      {/* Header */}
      <div className={`bg-gradient-to-r ${getStyleColors(roadmap.style)} p-6 text-white rounded-t-2xl relative`}>
        {isRecommended && (
          <div className="absolute top-3 right-3">
            <Award className="w-8 h-8 text-yellow-300" />
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {roadmap.icon}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">{roadmap.title}</h3>
            <p className="text-lg opacity-90">{roadmap.subtitle}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{roadmap.matchScore}%</div>
            <div className="text-sm opacity-80">compatibilité</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <p className="text-lg">💡 {roadmap.personalizedInsight}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Duration & Energy */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Durée totale</span>
            </div>
            <p className="text-xl font-bold text-blue-800">{roadmap.duration}</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <span className="font-semibold">Énergie Luna</span>
            </div>
            <p className="text-xl font-bold text-orange-800">{roadmap.energyCost}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">Phoenix Actions</span>
            </div>
            <p className="text-xl font-bold text-purple-800">{roadmap.phoenixActions.length}</p>
          </div>
        </div>

        {/* Phases Preview */}
        <div className="mb-6">
          <h4 className="font-bold text-gray-800 mb-3">📋 Phases principales :</h4>
          <div className="space-y-3">
            {roadmap.phases.slice(0, 2).map((phase, index) => (
              <div key={phase.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">{phase.title}</h5>
                  <p className="text-sm text-gray-600">{phase.description}</p>
                </div>
              </div>
            ))}
            {roadmap.phases.length > 2 && (
              <div className="text-center text-gray-500 text-sm">
                + {roadmap.phases.length - 2} autres phases...
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={onSelect}
            disabled={isSelected}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2 mx-auto ${
              isSelected
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                : `bg-gradient-to-r ${getStyleColors(roadmap.style)} text-white hover:shadow-lg`
            }`}
          >
            {isSelected ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>✅ Roadmap choisie !</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                <span>🎯 Choisir ce roadmap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapChoiceComponent;