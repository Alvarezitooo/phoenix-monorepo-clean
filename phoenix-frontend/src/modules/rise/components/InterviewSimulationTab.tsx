import React, { memo, useState } from 'react';
import { Play, Building, Briefcase, User, Target, Loader2, MessageSquare, CheckCircle, TrendingUp, Lightbulb, Clock } from 'lucide-react';
import { useInterviewSimulation } from '../hooks/useInterviewSimulation';

const InterviewSimulationTab = memo(() => {
  const { 
    form, 
    session, 
    isStarting, 
    isProcessingResponse,
    currentResponse,
    startSimulation, 
    submitResponse, 
    updateForm,
    getInterviewTypeInfo,
    getExperienceLevel,
    setCurrentResponse
  } = useInterviewSimulation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await startSimulation(form);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors du démarrage');
    }
  };

  const handleResponseSubmit = async () => {
    try {
      await submitResponse(currentResponse);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
    }
  };

  const interviewTypeInfo = getInterviewTypeInfo(form.interview_type);
  const experienceInfo = getExperienceLevel(form.experience_level);

  if (session) {
    return <SimulationInterface 
      session={session} 
      currentResponse={currentResponse}
      setCurrentResponse={setCurrentResponse}
      onSubmitResponse={handleResponseSubmit}
      isProcessingResponse={isProcessingResponse}
    />;
  }

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
        <div className="flex items-center space-x-3 mb-6">
          <Play className="h-8 w-8 text-emerald-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Simulation d'Entretien Interactive</h3>
            <p className="text-gray-600">Entraînez-vous avec Luna dans des conditions réalistes</p>
          </div>
          <div className="px-3 py-1 bg-emerald-100 rounded-full text-sm font-medium text-emerald-700">20⚡</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Position and Company */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="h-4 w-4 inline mr-2" />
                Poste visé *
              </label>
              <input
                type="text"
                value={form.position_title}
                onChange={(e) => updateForm('position_title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ex: Product Manager, Développeur Senior..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => updateForm('company_name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ex: Microsoft, Airbus, BNP Paribas..."
                required
              />
            </div>
          </div>

          {/* Interview Type and Experience */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="h-4 w-4 inline mr-2" />
                Type d'entretien
              </label>
              <select
                value={form.interview_type}
                onChange={(e) => updateForm('interview_type', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="behavioral">Comportemental</option>
                <option value="technical">Technique</option>
                <option value="case_study">Étude de cas</option>
              </select>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-lg">{interviewTypeInfo.icon}</span>
                <span className="text-xs text-gray-600">{interviewTypeInfo.description}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Niveau d'expérience
              </label>
              <select
                value={form.experience_level}
                onChange={(e) => updateForm('experience_level', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="junior">Junior (0-2 ans)</option>
                <option value="intermediate">Confirmé (2-5 ans)</option>
                <option value="senior">Senior (5+ ans)</option>
                <option value="expert">Expert (10+ ans)</option>
              </select>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium bg-${experienceInfo.color}-100 text-${experienceInfo.color}-700`}>
                  {experienceInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Preparation Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lightbulb className="h-4 w-4 inline mr-2" />
              Domaines à travailler (optionnel)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Présentation personnelle',
                'Questions techniques', 
                'Leadership',
                'Gestion de conflit',
                'Innovation',
                'Travail d\'équipe'
              ].map((area) => (
                <label key={area} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.preparation_areas.includes(area)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateForm('preparation_areas', [...form.preparation_areas, area]);
                      } else {
                        updateForm('preparation_areas', form.preparation_areas.filter(a => a !== area));
                      }
                    }}
                    className="mr-2 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{area}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isStarting}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Luna prépare votre simulation...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Démarrer la simulation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

const SimulationInterface = memo(({ 
  session, 
  currentResponse, 
  setCurrentResponse, 
  onSubmitResponse, 
  isProcessingResponse 
}: {
  session: any;
  currentResponse: string;
  setCurrentResponse: (response: string) => void;
  onSubmitResponse: () => Promise<void>;
  isProcessingResponse: boolean;
}) => {
  const currentQuestion = session.questions[session.current_question_index];
  const isComplete = session.current_question_index >= session.questions.length;

  return (
    <div className="space-y-8">
      {/* Session Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Play className="h-8 w-8 text-emerald-500" />
            <div>
              <h3 className="text-xl font-bold text-gray-800">Simulation en cours</h3>
              <p className="text-gray-600">{session.scenario}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{session.current_question_index}</div>
              <div className="text-xs text-gray-500">sur {session.questions.length}</div>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{session.estimated_duration}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(session.current_question_index / session.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {!isComplete ? (
        <>
          {/* Current Question */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="h-6 w-6 text-blue-500" />
              <h4 className="text-lg font-bold text-blue-800">Question {session.current_question_index + 1}</h4>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-lg leading-relaxed">{currentQuestion}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre réponse
              </label>
              <textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Prenez votre temps pour structurer votre réponse..."
              />
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-gray-500">
                  💡 Conseil : Utilisez la méthode STAR (Situation, Tâche, Action, Résultat)
                </p>
                <button
                  onClick={onSubmitResponse}
                  disabled={!currentResponse.trim() || isProcessingResponse}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProcessingResponse ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analyse...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Valider ma réponse</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <SimulationComplete session={session} />
      )}

      {/* Previous Responses */}
      {session.responses.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            <h4 className="text-lg font-bold text-purple-800">Vos réponses précédentes</h4>
          </div>
          
          <div className="space-y-6">
            {session.responses.map((response: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-800">Question {index + 1}</h5>
                  {response.score && (
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-emerald-600">{response.score}/100</div>
                      <div className={`w-16 h-2 bg-gray-200 rounded-full`}>
                        <div 
                          className="h-2 bg-emerald-500 rounded-full" 
                          style={{ width: `${response.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Q:</strong> {response.question}
                </div>
                <div className="text-sm text-gray-800 mb-3">
                  <strong>R:</strong> {response.response}
                </div>
                
                {response.feedback && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                    <div className="text-xs font-medium text-emerald-700 mb-1">Feedback Luna:</div>
                    <div className="text-xs text-emerald-800">{response.feedback}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const SimulationComplete = memo(({ session }: { session: any }) => {
  const averageScore = session.responses.length > 0 
    ? Math.round(session.responses.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / session.responses.length)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100 text-center">
      <div className="flex items-center justify-center space-x-4 mb-6">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <div>
          <h3 className="text-3xl font-bold text-gray-800">Simulation Terminée !</h3>
          <p className="text-emerald-600 font-medium">Félicitations pour votre performance</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-emerald-600">{session.responses.length}</div>
          <div className="text-gray-600">Questions traitées</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{averageScore}%</div>
          <div className="text-gray-600">Score moyen</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">15-20</div>
          <div className="text-gray-600">Minutes d'entraînement</div>
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200">
          Télécharger le rapport détaillé
        </button>
        <button className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
          Démarrer une nouvelle simulation
        </button>
      </div>
    </div>
  );
});

InterviewSimulationTab.displayName = 'InterviewSimulationTab';
SimulationInterface.displayName = 'SimulationInterface';
SimulationComplete.displayName = 'SimulationComplete';

export default InterviewSimulationTab;