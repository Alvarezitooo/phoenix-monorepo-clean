import { useState, useCallback } from 'react';
import { phoenixRiseApi, transformInterviewSimulationRequest } from '../../../services/riseApiPhoenix';
import { useNarrativeCapture } from '../../../services/narrativeCapture';

export interface InterviewSimulationForm {
  position_title: string;
  company_name: string;
  interview_type: string;
  experience_level: string;
  preparation_areas: string[];
}

export interface SimulationSession {
  session_id: string;
  scenario: string;
  questions: string[];
  tips: string[];
  estimated_duration: string;
  current_question_index: number;
  responses: {
    question: string;
    response: string;
    feedback?: string;
    score?: number;
  }[];
}

export interface InterviewFeedback {
  feedback: string;
  score: number;
  improvements: string[];
  next_question?: string;
  session_complete: boolean;
}

export const useInterviewSimulation = () => {
  const [form, setForm] = useState<InterviewSimulationForm>({
    position_title: '',
    company_name: '',
    interview_type: 'behavioral',
    experience_level: 'intermediate',
    preparation_areas: []
  });
  
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  
  // 🧠 Hook de capture narrative pour enrichissement automatique
  const { captureInterviewSimulation } = useNarrativeCapture();

  const startSimulation = useCallback(async (formData: InterviewSimulationForm) => {
    if (!formData.position_title.trim() || !formData.company_name.trim()) {
      throw new Error('Veuillez remplir le poste et l\'entreprise');
    }

    const actionStartTime = Date.now(); // 🧠 Timing pour analyse comportementale
    setIsStarting(true);
    
    try {
      // Appel Phoenix API réel avec Gemini
      const requestData = transformInterviewSimulationRequest(formData);
      const backendResults = await phoenixRiseApi.startInterviewSimulation(requestData);
      
      // Transform Phoenix API results ou fallback vers calcul local
      if (backendResults?.session_id) {
        const realSession: SimulationSession = {
          session_id: backendResults.session_id,
          scenario: backendResults.scenario || `Simulation d'entretien pour ${formData.position_title}`,
          questions: backendResults.questions || generateQuestions(formData.interview_type, formData.position_title),
          tips: backendResults.tips || [
            "Préparez des exemples concrets avec la méthode STAR",
            "Recherchez des informations sur l'entreprise et ses valeurs",
            "Préparez des questions à poser au recruteur",
            "Entraînez-vous à parler de vos forces et faiblesses"
          ],
          estimated_duration: backendResults.estimated_duration || "15-20 minutes",
          current_question_index: 0,
          responses: []
        };
        setSession(realSession);
        
        // 🧠 CAPTURE NARRATIVE AUTOMATIQUE - Simulation réelle
        await captureInterviewSimulation({
          form_data: formData,
          session_id: realSession.session_id,
          questions_count: realSession.questions.length,
          estimated_duration: realSession.estimated_duration,
          interview_type: formData.interview_type,
          data_source: 'phoenix_api',
          quality_indicator: 'high'
        }, actionStartTime);
        
      } else {
        // Fallback vers simulation locale si backend non disponible
        const fallbackSession: SimulationSession = {
          session_id: `sim-${Date.now()}`,
          scenario: `Simulation d'entretien pour le poste de ${formData.position_title} chez ${formData.company_name}`,
          questions: generateQuestions(formData.interview_type, formData.position_title),
          tips: [
            "Préparez des exemples concrets avec la méthode STAR",
            "Recherchez des informations sur l'entreprise et ses valeurs",
            "Préparez des questions à poser au recruteur",
            "Entraînez-vous à parler de vos forces et faiblesses"
          ],
          estimated_duration: "15-20 minutes",
          current_question_index: 0,
          responses: []
        };
        setSession(fallbackSession);
        
        // 🧠 CAPTURE NARRATIVE - Fallback local
        await captureInterviewSimulation({
          form_data: formData,
          session_id: fallbackSession.session_id,
          questions_count: fallbackSession.questions.length,
          estimated_duration: fallbackSession.estimated_duration,
          interview_type: formData.interview_type,
          data_source: 'local_fallback',
          quality_indicator: 'medium',
          fallback_reason: 'backend_unavailable'
        }, actionStartTime);
      }
    } finally {
      setIsStarting(false);
    }
  }, [captureInterviewSimulation]);

  const submitResponse = useCallback(async (response: string) => {
    if (!session || !response.trim()) {
      throw new Error('Veuillez saisir une réponse');
    }

    setIsProcessingResponse(true);

    try {
      const currentQuestion = session.questions[session.current_question_index];
      
      const requestBody = {
        scenario: session.scenario,
        user_response: response,
        session_id: session.session_id
      };

      // Appel Phoenix API pour analyse réponse avec Gemini
      try {
        const backendFeedback = await phoenixRiseApi.submitMockInterviewResponse(requestBody);
        
        const realFeedback: InterviewFeedback = {
          feedback: backendFeedback.feedback || generateFeedback(currentQuestion, response),
          score: backendFeedback.score || Math.floor(Math.random() * 30) + 70,
          improvements: backendFeedback.improvements || generateImprovements(currentQuestion, response),
          next_question: backendFeedback.next_question || (
            session.current_question_index < session.questions.length - 1 
              ? session.questions[session.current_question_index + 1] 
              : undefined
          ),
          session_complete: backendFeedback.session_complete ?? (session.current_question_index >= session.questions.length - 1)
        };
        
        var mockFeedback = realFeedback;
      } catch (feedbackError) {
        console.error('Error getting backend feedback, using fallback:', feedbackError);
        // Fallback vers feedback local si backend fail
        const mockFeedback: InterviewFeedback = {
          feedback: generateFeedback(currentQuestion, response),
          score: Math.floor(Math.random() * 30) + 70, // 70-100
          improvements: generateImprovements(currentQuestion, response),
          next_question: session.current_question_index < session.questions.length - 1 
            ? session.questions[session.current_question_index + 1] 
            : undefined,
          session_complete: session.current_question_index >= session.questions.length - 1
        };
      }

        // Mettre à jour la session avec la nouvelle réponse
        const updatedSession: SimulationSession = {
          ...session,
          current_question_index: session.current_question_index + 1,
          responses: [...session.responses, {
            question: currentQuestion,
            response: response,
            feedback: mockFeedback.feedback,
            score: mockFeedback.score
          }]
        };

        setSession(updatedSession);
        setCurrentResponse('');
        
        return mockFeedback;
    } finally {
      setIsProcessingResponse(false);
    }
  }, [session]);

  const updateForm = useCallback((field: keyof InterviewSimulationForm, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetSimulation = useCallback(() => {
    setForm({
      position_title: '',
      company_name: '',
      interview_type: 'behavioral',
      experience_level: 'intermediate',
      preparation_areas: []
    });
    setSession(null);
    setCurrentResponse('');
  }, []);

  const getInterviewTypeInfo = useCallback((type: string) => {
    const typeMap: Record<string, { icon: string, description: string }> = {
      behavioral: { icon: '🧠', description: 'Questions sur vos expériences et comportements' },
      technical: { icon: '⚡', description: 'Questions techniques spécifiques au poste' },
      case_study: { icon: '📊', description: 'Résolution de cas pratiques et business' }
    };
    return typeMap[type] || typeMap.behavioral;
  }, []);

  const getExperienceLevel = useCallback((level: string) => {
    const levelMap: Record<string, { label: string, color: string }> = {
      junior: { label: 'Junior (0-2 ans)', color: 'green' },
      intermediate: { label: 'Confirmé (2-5 ans)', color: 'blue' },
      senior: { label: 'Senior (5+ ans)', color: 'purple' },
      expert: { label: 'Expert (10+ ans)', color: 'orange' }
    };
    return levelMap[level] || levelMap.intermediate;
  }, []);

  return {
    form,
    session,
    isStarting,
    isProcessingResponse,
    currentResponse,
    startSimulation,
    submitResponse,
    updateForm,
    resetSimulation,
    getInterviewTypeInfo,
    getExperienceLevel,
    setCurrentResponse
  };
};

// Fonctions utilitaires pour générer du contenu mock
function generateQuestions(type: string, position: string): string[] {
  const baseQuestions = [
    "Pouvez-vous vous présenter en quelques minutes ?",
    `Qu'est-ce qui vous intéresse le plus dans le poste de ${position} ?`,
    "Décrivez-moi un projet dont vous êtes particulièrement fier.",
    "Comment gérez-vous les situations de stress ou de pression ?"
  ];

  const specificQuestions = {
    behavioral: [
      "Parlez-moi d'une fois où vous avez dû résoudre un conflit en équipe.",
      "Comment vous adaptez-vous aux changements dans votre environnement de travail ?",
      "Donnez-moi un exemple d'un échec et comment vous l'avez géré."
    ],
    technical: [
      "Expliquez-moi comment vous aborderiez ce problème technique.",
      "Quelles sont vos compétences techniques les plus avancées ?",
      "Comment restez-vous à jour avec les nouvelles technologies ?"
    ],
    case_study: [
      "Comment analyseriez-vous cette situation business ?",
      "Quelle stratégie proposeriez-vous pour résoudre ce défi ?",
      "Comment mesureriez-vous le succès de votre solution ?"
    ]
  };

  return [...baseQuestions, ...(specificQuestions[type as keyof typeof specificQuestions] || specificQuestions.behavioral)];
}

function generateFeedback(question: string, response: string): string {
  const feedbackTemplates = [
    `Très bonne réponse ! Vous avez bien structuré votre réponse et donné des exemples concrets. Pour améliorer, vous pourriez ajouter plus de détails sur les résultats obtenus.`,
    `Bonne approche dans votre réponse. Vous démontrez une compréhension claire du sujet. Considérez utiliser la méthode STAR pour structurer encore mieux vos réponses.`,
    `Réponse solide avec de bons éléments. Vous pourriez renforcer votre argumentation en ajoutant des métriques ou des résultats quantifiés.`,
    `Excellente réponse ! Vous avez montré votre capacité de réflexion et votre expérience. Continuez sur cette lancée.`
  ];
  
  return feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
}

function generateImprovements(question: string, response: string): string[] {
  const improvements = [
    "Utilisez la méthode STAR (Situation, Tâche, Action, Résultat) pour structurer vos réponses",
    "Ajoutez des métriques concrètes pour quantifier vos résultats",
    "Préparez 2-3 exemples polyvalents que vous pouvez adapter à différentes questions",
    "Entraînez-vous à maintenir un contact visuel et une posture confiante",
    "Terminez vos réponses en liant votre expérience au poste visé"
  ];

  return improvements.slice(0, Math.floor(Math.random() * 3) + 2);
}