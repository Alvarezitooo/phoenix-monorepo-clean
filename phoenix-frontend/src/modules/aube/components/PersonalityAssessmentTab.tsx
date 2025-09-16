import React, { memo, useState, useCallback, useEffect } from 'react';
import { 
  Brain, 
  Users, 
  Target, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star,
  Award,
  Loader2,
  Sparkles,
  Eye,
  Download,
  BarChart3,
  User,
  Heart,
  Zap,
  Shield
} from 'lucide-react';
import { aubeApi, type AubeSignals, type PersonalityAssessmentRequest } from '../../../services/aubeApi';

// Types pour l'assessment personnalité
interface PersonalityTrait {
  name: string;
  score: number;
  description: string;
  careerImpact: string;
  developmentTips: string[];
}

interface PersonalityProfile {
  type: string;
  description: string;
  strengths: string[];
  challenges: string[];
  idealRoles: string[];
  workEnvironment: string;
  communicationStyle: string;
  leadershipStyle: string;
  traits: {
    openness: PersonalityTrait;
    conscientiousness: PersonalityTrait;
    extraversion: PersonalityTrait;
    agreeableness: PersonalityTrait;
    neuroticism: PersonalityTrait;
  };
}

interface AssessmentQuestion {
  id: number;
  text: string;
  category: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
  reversed?: boolean;
}

// Questions Big Five - Version simplifiée mais scientifiquement valide
const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Openness (Ouverture)
  { id: 1, text: "J'aime explorer de nouvelles idées et concepts", category: 'openness' },
  { id: 2, text: "Je préfère les routines établies aux nouveautés", category: 'openness', reversed: true },
  { id: 3, text: "J'apprécie l'art et les activités créatives", category: 'openness' },
  { id: 4, text: "Je suis curieux(se) de nature", category: 'openness' },
  { id: 5, text: "J'aime réfléchir à des questions abstraites", category: 'openness' },

  // Conscientiousness (Conscienciosité)
  { id: 6, text: "Je suis très organisé(e) dans mon travail", category: 'conscientiousness' },
  { id: 7, text: "Je procrastine souvent", category: 'conscientiousness', reversed: true },
  { id: 8, text: "Je respecte toujours mes engagements", category: 'conscientiousness' },
  { id: 9, text: "J'ai tendance à être négligent(e)", category: 'conscientiousness', reversed: true },
  { id: 10, text: "Je planifie tout en avance", category: 'conscientiousness' },

  // Extraversion
  { id: 11, text: "J'aime être entouré(e) de beaucoup de monde", category: 'extraversion' },
  { id: 12, text: "Je préfère travailler seul(e)", category: 'extraversion', reversed: true },
  { id: 13, text: "Je prends facilement la parole en public", category: 'extraversion' },
  { id: 14, text: "Je suis plutôt réservé(e)", category: 'extraversion', reversed: true },
  { id: 15, text: "J'aime animer des réunions", category: 'extraversion' },

  // Agreeableness (Amabilité)
  { id: 16, text: "Je fais confiance aux autres facilement", category: 'agreeableness' },
  { id: 17, text: "Je peux être dur(e) en affaires", category: 'agreeableness', reversed: true },
  { id: 18, text: "J'aide volontiers mes collègues", category: 'agreeableness' },
  { id: 19, text: "Je critique souvent les idées des autres", category: 'agreeableness', reversed: true },
  { id: 20, text: "J'évite les conflits", category: 'agreeableness' },

  // Neuroticism (Névrosisme/Stabilité émotionnelle)
  { id: 21, text: "Je reste calme sous pression", category: 'neuroticism', reversed: true },
  { id: 22, text: "Je m'inquiète facilement", category: 'neuroticism' },
  { id: 23, text: "Mes émotions sont stables", category: 'neuroticism', reversed: true },
  { id: 24, text: "Je me sens souvent stressé(e)", category: 'neuroticism' },
  { id: 25, text: "Je récupère vite après un échec", category: 'neuroticism', reversed: true }
];

const PersonalityAssessmentTab = memo(() => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PersonalityProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'traits' | 'careers' | 'development'>('overview');

  const handleResponse = useCallback((questionId: number, score: number) => {
    setResponses(prev => ({ ...prev, [questionId]: score }));
    
    // Auto-advance to next question
    if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    }
  }, [currentQuestion]);

  const calculatePersonalityProfile = useCallback(() => {
    const scores = {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0
    };

    // Calcul des scores par dimension
    ASSESSMENT_QUESTIONS.forEach(question => {
      const response = responses[question.id] || 3;
      const score = question.reversed ? (6 - response) : response;
      scores[question.category] += score;
    });

    // Normalisation sur 100
    Object.keys(scores).forEach(trait => {
      const questionsCount = ASSESSMENT_QUESTIONS.filter(q => q.category === trait).length;
      scores[trait as keyof typeof scores] = Math.round((scores[trait as keyof typeof scores] / (questionsCount * 5)) * 100);
    });

    // Détermination du type de personnalité
    const personalityType = determinePersonalityType(scores);
    
    return generatePersonalityProfile(scores, personalityType);
  }, [responses]);

  const determinePersonalityType = (scores: Record<string, number>) => {
    const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = scores;
    
    // Logique simplifiée de détermination du type
    if (extraversion > 70 && agreeableness > 70) {
      return "Inspirateur";
    } else if (conscientiousness > 80 && agreeableness > 60) {
      return "Organisateur";
    } else if (openness > 80 && extraversion > 60) {
      return "Innovateur";
    } else if (conscientiousness > 70 && openness < 50) {
      return "Exécutant";
    } else if (agreeableness > 80 && neuroticism < 40) {
      return "Facilitateur";
    } else if (openness > 70 && conscientiousness > 70) {
      return "Stratège";
    } else {
      return "Adaptable";
    }
  };

  const generatePersonalityProfile = (scores: Record<string, number>, type: string): PersonalityProfile => {
    const profiles = {
      "Inspirateur": {
        description: "Vous êtes naturellement charismatique et motivez les autres par votre enthousiasme.",
        strengths: ["Leadership naturel", "Communication excellente", "Motivation d'équipe", "Vision partagée"],
        challenges: ["Peut manquer de détails", "Impatience parfois", "Délégation difficile"],
        idealRoles: ["Manager", "Chef de projet", "Business Developer", "Formateur"],
        workEnvironment: "Équipes dynamiques, projets variés, contact client",
        communicationStyle: "Direct, enthousiaste, inspirant",
        leadershipStyle: "Transformationnel, par l'exemple"
      },
      "Organisateur": {
        description: "Vous excellez dans la planification et l'exécution méthodique des projets.",
        strengths: ["Planning impeccable", "Fiabilité totale", "Attention aux détails", "Respect des deadlines"],
        challenges: ["Peut résister au changement", "Perfectionnisme excessif", "Stress sous pression"],
        idealRoles: ["Chef de projet", "Directeur opérationnel", "Consultant", "Analyste"],
        workEnvironment: "Processus clairs, objectifs définis, stabilité",
        communicationStyle: "Structuré, factuel, précis",
        leadershipStyle: "Par les processus et l'exemple"
      },
      "Innovateur": {
        description: "Vous apportez créativité et vision nouvelle aux défis complexes.",
        strengths: ["Créativité", "Vision prospective", "Résolution de problèmes", "Adaptabilité"],
        challenges: ["Peut manquer de pragmatisme", "Difficultés avec routine", "Dispersion"],
        idealRoles: ["Product Manager", "Designer", "Consultant stratégie", "Entrepreneur"],
        workEnvironment: "Liberté créative, projets innovants, défis intellectuels",
        communicationStyle: "Conceptuel, inspirant, visionnaire",
        leadershipStyle: "Par l'innovation et la vision"
      },
      "Stratège": {
        description: "Vous combinez analyse rigoureuse et vision à long terme.",
        strengths: ["Analyse approfondie", "Planification stratégique", "Objectivité", "Vision systémique"],
        challenges: ["Peut sembler distant", "Analyse paralysante", "Communication technique"],
        idealRoles: ["Directeur stratégie", "Consultant", "Analyste senior", "Architecte solution"],
        workEnvironment: "Défis intellectuels, autonomie, projets complexes",
        communicationStyle: "Analytique, précis, structuré",
        leadershipStyle: "Par l'expertise et la stratégie"
      },
      "Facilitateur": {
        description: "Vous excellez dans l'harmonie d'équipe et la résolution de conflits.",
        strengths: ["Médiation", "Empathie", "Travail d'équipe", "Communication interpersonnelle"],
        challenges: ["Difficulté avec conflits", "Décisions difficiles", "Assertivité"],
        idealRoles: ["RH", "Scrum Master", "Coach", "Médiateur"],
        workEnvironment: "Collaboration, harmonie, développement humain",
        communicationStyle: "Empathique, diplomate, inclusif",
        leadershipStyle: "Par le consensus et l'accompagnement"
      }
    };

    const profile = profiles[type as keyof typeof profiles] || profiles["Adaptable"] || {
      description: "Vous avez un profil équilibré qui s'adapte à diverses situations.",
      strengths: ["Flexibilité", "Adaptabilité", "Équilibre"],
      challenges: ["Peut manquer de spécialisation"],
      idealRoles: ["Rôles polyvalents", "Management"],
      workEnvironment: "Varié",
      communicationStyle: "Adaptatif",
      leadershipStyle: "Situationnel"
    };

    return {
      type,
      ...profile,
      traits: {
        openness: {
          name: "Ouverture",
          score: scores.openness,
          description: scores.openness > 70 ? "Très créatif et ouvert aux nouvelles expériences" : 
                      scores.openness > 40 ? "Équilibre entre tradition et innovation" : 
                      "Préfère la stabilité et les méthodes éprouvées",
          careerImpact: scores.openness > 70 ? "Excellerez dans l'innovation et le changement" : 
                       "Apporterez stabilité et fiabilité aux équipes",
          developmentTips: scores.openness > 70 ? 
            ["Canalisez votre créativité", "Développez votre pragmatisme"] :
            ["Sortez de votre zone de confort", "Explorez de nouvelles approches"]
        },
        conscientiousness: {
          name: "Conscienciosité", 
          score: scores.conscientiousness,
          description: scores.conscientiousness > 70 ? "Très organisé et fiable" :
                      scores.conscientiousness > 40 ? "Bon équilibre organisation/flexibilité" :
                      "Approche plus spontanée et flexible",
          careerImpact: scores.conscientiousness > 70 ? "Parfait pour rôles demandant rigueur" :
                       "Idéal pour environnements dynamiques",
          developmentTips: scores.conscientiousness > 70 ?
            ["Développez votre flexibilité", "Acceptez l'imperfection parfois"] :
            ["Améliorez vos méthodes d'organisation", "Développez la planification"]
        },
        extraversion: {
          name: "Extraversion",
          score: scores.extraversion, 
          description: scores.extraversion > 70 ? "Énergisé par les interactions sociales" :
                      scores.extraversion > 40 ? "Confortable seul ou en groupe" :
                      "Préfère la réflexion et le travail individuel",
          careerImpact: scores.extraversion > 70 ? "Excellent pour rôles client/management" :
                       "Parfait pour expertise technique/analyse",
          developmentTips: scores.extraversion > 70 ?
            ["Développez l'écoute active", "Prenez du temps pour réfléchir"] :
            ["Travaillez votre réseau", "Développez vos compétences de présentation"]
        },
        agreeableness: {
          name: "Amabilité",
          score: scores.agreeableness,
          description: scores.agreeableness > 70 ? "Très coopératif et altruiste" :
                      scores.agreeableness > 40 ? "Équilibre entre coopération et assertivité" :
                      "Direct et orienté résultats",
          careerImpact: scores.agreeableness > 70 ? "Excellent pour travail d'équipe/RH" :
                       "Parfait pour négociation/leadership directif",
          developmentTips: scores.agreeableness > 70 ?
            ["Développez votre assertivité", "Apprenez à dire non"] :
            ["Développez l'empathie", "Travaillez la diplomatie"]
        },
        neuroticism: {
          name: "Stabilité émotionnelle",
          score: 100 - scores.neuroticism, // Inversé pour présenter positivement
          description: scores.neuroticism < 30 ? "Très stable émotionnellement" :
                      scores.neuroticism < 60 ? "Bonne gestion du stress" :
                      "Sensible aux variations émotionnelles",
          careerImpact: scores.neuroticism < 30 ? "Excellent sous pression" :
                       "Apporte sensibilité et attention aux détails",
          developmentTips: scores.neuroticism < 30 ?
            ["Développez l'empathie émotionnelle", "Soyez attentif aux autres"] :
            ["Techniques de gestion du stress", "Développez la résilience"]
        }
      }
    };
  };

  const handleStartAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // Conversion des réponses en signaux Aube
      const signals: AubeSignals = {
        appetences: responses,
        style_travail: "assessment_big_five",
        ia_appetit: 5 // Assessment complet
      };

      // Appel API réel au backend
      const assessmentRequest: PersonalityAssessmentRequest = {
        signals,
        session_context: `big_five_assessment_${Date.now()}`
      };

      const backendResults = await aubeApi.startPersonalityAssessment(assessmentRequest);
      
      // Fallback vers calcul local si backend non disponible
      const profile = backendResults?.personality_profile || calculatePersonalityProfile();
      
      setResults(profile);
    } catch (error) {
      console.error('Error with backend personality assessment:', error);
      // Fallback vers calcul local
      const profile = calculatePersonalityProfile();
      setResults(profile);
    } finally {
      setIsAnalyzing(false);
    }
  }, [calculatePersonalityProfile, responses]);

  const isAssessmentComplete = Object.keys(responses).length === ASSESSMENT_QUESTIONS.length;
  const progress = Math.round((Object.keys(responses).length / ASSESSMENT_QUESTIONS.length) * 100);

  if (results) {
    return <PersonalityResults results={results} activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  if (isAnalyzing) {
    return <AnalysisInProgress />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="h-8 w-8 text-purple-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Assessment Personnalité Big Five</h3>
            <p className="text-gray-600">Découvrez votre profil psychologique et vos métiers compatibles</p>
          </div>
          <div className="px-3 py-1 bg-purple-100 rounded-full text-sm font-medium text-purple-700">12⚡</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progression</span>
            <span className="text-sm font-medium text-purple-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Question {Math.min(currentQuestion + 1, ASSESSMENT_QUESTIONS.length)} sur {ASSESSMENT_QUESTIONS.length}
          </p>
        </div>

        {/* Current Question */}
        {currentQuestion < ASSESSMENT_QUESTIONS.length && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              {ASSESSMENT_QUESTIONS[currentQuestion].text}
            </h4>
            
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => handleResponse(ASSESSMENT_QUESTIONS[currentQuestion].id, score)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    responses[ASSESSMENT_QUESTIONS[currentQuestion].id] === score
                      ? 'border-purple-500 bg-purple-500 text-white'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="font-semibold">{score}</div>
                  <div className="text-xs mt-1">
                    {score === 1 && 'Pas du tout'}
                    {score === 2 && 'Peu'}
                    {score === 3 && 'Neutre'}
                    {score === 4 && 'Plutôt'}
                    {score === 5 && 'Tout à fait'}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex justify-between mt-4">
              <button 
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-4 py-2 text-purple-600 disabled:text-gray-400"
              >
                ← Précédent
              </button>
              <button 
                onClick={() => setCurrentQuestion(Math.min(ASSESSMENT_QUESTIONS.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === ASSESSMENT_QUESTIONS.length - 1}
                className="px-4 py-2 text-purple-600 disabled:text-gray-400"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Analysis Button */}
        {isAssessmentComplete && (
          <div className="mt-6 text-center">
            <button
              onClick={handleStartAnalysis}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Brain className="h-5 w-5" />
              <span>Analyser ma personnalité</span>
            </button>
          </div>
        )}
      </div>

      {/* Info sur Big Five */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h4 className="font-semibold text-indigo-800 mb-3">🧠 Le modèle Big Five</h4>
        <p className="text-indigo-700 text-sm mb-4">
          Modèle scientifique reconnu qui mesure 5 dimensions fondamentales de la personnalité.
        </p>
        <div className="grid md:grid-cols-5 gap-3 text-xs">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              🎨
            </div>
            <span className="font-medium text-blue-800">Ouverture</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              📋
            </div>
            <span className="font-medium text-green-800">Conscienciosité</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              👥
            </div>
            <span className="font-medium text-orange-800">Extraversion</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-pink-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              🤝
            </div>
            <span className="font-medium text-pink-800">Amabilité</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              🧘
            </div>
            <span className="font-medium text-purple-800">Stabilité</span>
          </div>
        </div>
      </div>
    </div>
  );
});

const AnalysisInProgress = memo(() => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
        <Brain className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Analyse de votre personnalité en cours...</h3>
      <p className="text-gray-600 mb-4">Luna analyse vos réponses selon le modèle Big Five</p>
      <div className="flex items-center justify-center space-x-2">
        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
        <span className="text-sm text-gray-500">Calcul des dimensions psychologiques...</span>
      </div>
    </div>
  </div>
));

const PersonalityResults = memo(({ 
  results, 
  activeTab, 
  setActiveTab 
}: {
  results: PersonalityProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => (
  <div className="space-y-8">
    {/* Overview Cards */}
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <User className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{results.type}</h3>
        <p className="text-sm text-gray-600">{results.description}</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Award className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Forces clés</h3>
        <p className="text-sm text-gray-600">{results.strengths.slice(0, 2).join(', ')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Target className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Rôles idéaux</h3>
        <p className="text-sm text-gray-600">{results.idealRoles.slice(0, 2).join(', ')}</p>
      </div>
    </div>

    {/* Navigation Tabs */}
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex border-b border-gray-200">
        {[
          { id: 'overview', name: 'Vue d\'ensemble', icon: Eye },
          { id: 'traits', name: 'Traits détaillés', icon: BarChart3 },
          { id: 'careers', name: 'Carrières', icon: Target },
          { id: 'development', name: 'Développement', icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-4 flex items-center justify-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
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
        {activeTab === 'overview' && <OverviewTab results={results} />}
        {activeTab === 'traits' && <TraitsTab results={results} />}
        {activeTab === 'careers' && <CareersTab results={results} />}
        {activeTab === 'development' && <DevelopmentTab results={results} />}
      </div>
    </div>
  </div>
));

const OverviewTab = memo(({ results }: { results: PersonalityProfile }) => (
  <div className="space-y-8">
    {/* Profil radar */}
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
      <h4 className="text-lg font-semibold text-purple-800 mb-6">Profil Big Five</h4>
      <div className="grid md:grid-cols-5 gap-4">
        {Object.entries(results.traits).map(([key, trait]) => (
          <div key={key} className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="m18,2.0845
                    a 15.9155,15.9155 0 0,1 0,31.831
                    a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="m18,2.0845
                    a 15.9155,15.9155 0 0,1 0,31.831
                    a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke={trait.score > 70 ? '#10b981' : trait.score > 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${trait.score}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-800">{trait.score}</span>
              </div>
            </div>
            <h5 className="font-medium text-gray-800 text-sm">{trait.name}</h5>
            <p className="text-xs text-gray-600 mt-1">{trait.description}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Strengths & Challenges */}
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
        <h4 className="font-semibold text-emerald-800 mb-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>Vos forces</span>
        </h4>
        <div className="space-y-2">
          {results.strengths.map((strength, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-800">{strength}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
        <h4 className="font-semibold text-orange-800 mb-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>Points d'attention</span>
        </h4>
        <div className="space-y-2">
          {results.challenges.map((challenge, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800">{challenge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Work Environment */}
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
      <h4 className="font-semibold text-blue-800 mb-4">🏢 Environnement de travail idéal</h4>
      <p className="text-blue-700">{results.workEnvironment}</p>
    </div>
  </div>
));

const TraitsTab = memo(({ results }: { results: PersonalityProfile }) => (
  <div className="space-y-6">
    {Object.entries(results.traits).map(([key, trait]) => (
      <div key={key} className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">{trait.name}</h4>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  trait.score > 70 ? 'bg-emerald-500' : 
                  trait.score > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${trait.score}%` }}
              />
            </div>
            <span className="font-bold text-gray-700">{trait.score}/100</span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">{trait.description}</p>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-800 mb-2">Impact carrière</h5>
          <p className="text-sm text-gray-700">{trait.careerImpact}</p>
        </div>
      </div>
    ))}
  </div>
));

const CareersTab = memo(({ results }: { results: PersonalityProfile }) => (
  <div className="space-y-8">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
      <h4 className="text-lg font-semibold text-blue-800 mb-4">🎯 Rôles idéaux pour votre profil</h4>
      <div className="grid md:grid-cols-2 gap-4">
        {results.idealRoles.map((role, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {idx + 1}
              </div>
              <div>
                <h5 className="font-semibold text-gray-800">{role}</h5>
                <p className="text-sm text-gray-600">Compatibilité élevée</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-4">💬 Style de communication</h4>
        <p className="text-purple-700">{results.communicationStyle}</p>
      </div>

      <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
        <h4 className="font-semibold text-emerald-800 mb-4">👑 Style de leadership</h4>
        <p className="text-emerald-700">{results.leadershipStyle}</p>
      </div>
    </div>
  </div>
));

const DevelopmentTab = memo(({ results }: { results: PersonalityProfile }) => (
  <div className="space-y-6">
    <h4 className="text-lg font-semibold text-gray-800">🚀 Plan de développement personnalisé</h4>
    
    {Object.entries(results.traits).map(([key, trait]) => (
      <div key={key} className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h5 className="font-medium text-gray-800">{trait.name}</h5>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            trait.score > 70 ? 'bg-emerald-100 text-emerald-800' :
            trait.score > 40 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {trait.score > 70 ? 'Force' : trait.score > 40 ? 'Équilibré' : 'À développer'}
          </span>
        </div>
        
        <div className="space-y-2">
          <h6 className="font-medium text-gray-700">Conseils de développement :</h6>
          {trait.developmentTips.map((tip, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <Sparkles className="h-4 w-4 text-purple-500 mt-0.5" />
              <span className="text-sm text-gray-600">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
));

PersonalityAssessmentTab.displayName = 'PersonalityAssessmentTab';
AnalysisInProgress.displayName = 'AnalysisInProgress';
PersonalityResults.displayName = 'PersonalityResults';
OverviewTab.displayName = 'OverviewTab';
TraitsTab.displayName = 'TraitsTab';
CareersTab.displayName = 'CareersTab';
DevelopmentTab.displayName = 'DevelopmentTab';

export default PersonalityAssessmentTab;