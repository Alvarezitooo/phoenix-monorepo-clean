import React, { memo, useState } from 'react';
import { Brain, Lightbulb, Users, Target, Loader2, CheckCircle, TrendingUp, AlertCircle, Award, BookOpen, Mic } from 'lucide-react';
import { useStorytellingCoach } from '../hooks/useStorytellingCoach';

const StorytellingCoachTab = memo(() => {
  const { 
    form, 
    result, 
    isCoaching,
    updateForm,
    getStoryCoaching,
    resetCoaching,
    getStoryTypeInfo,
    getAudienceInfo,
    getScoreColor,
    getPriorityColor
  } = useStorytellingCoach();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await getStoryCoaching(form);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors du coaching');
    }
  };

  const storyTypeInfo = getStoryTypeInfo(form.story_type);
  const audienceInfo = getAudienceInfo(form.audience_type);

  if (result) {
    return <CoachingResults 
      result={result} 
      onReset={resetCoaching}
      getScoreColor={getScoreColor}
      getPriorityColor={getPriorityColor}
    />;
  }

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="h-8 w-8 text-purple-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Coaching Storytelling Professionnel</h3>
            <p className="text-gray-600">Transforme tes expériences en histoires percutantes avec Luna</p>
          </div>
          <div className="px-3 py-1 bg-purple-100 rounded-full text-sm font-medium text-purple-700">15⚡</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Story Type and Audience */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="h-4 w-4 inline mr-2" />
                Type d'histoire *
              </label>
              <select
                value={form.story_type}
                onChange={(e) => updateForm('story_type', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="professional_achievement">Accomplissement professionnel</option>
                <option value="challenge_overcome">Défi surmonté</option>
                <option value="leadership_example">Exemple de leadership</option>
                <option value="innovation_project">Projet d'innovation</option>
                <option value="failure_learning">Échec et apprentissage</option>
                <option value="team_collaboration">Collaboration d'équipe</option>
              </select>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-lg">{storyTypeInfo.icon}</span>
                <span className="text-xs text-gray-600">{storyTypeInfo.description}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 inline mr-2" />
                Public cible
              </label>
              <select
                value={form.audience_type}
                onChange={(e) => updateForm('audience_type', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="recruiter">Recruteur</option>
                <option value="team_member">Collègue d'équipe</option>
                <option value="manager">Manager</option>
                <option value="client">Client</option>
              </select>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-lg">{audienceInfo.icon}</span>
                <span className="text-xs text-gray-600">{audienceInfo.tone}</span>
              </div>
            </div>
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="h-4 w-4 inline mr-2" />
              Contexte de votre histoire *
            </label>
            <textarea
              value={form.context}
              onChange={(e) => updateForm('context', e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Décrivez la situation, les défis rencontrés, les actions entreprises..."
              required
            />
          </div>

          {/* Target Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lightbulb className="h-4 w-4 inline mr-2" />
              Message clé à transmettre *
            </label>
            <textarea
              value={form.target_message}
              onChange={(e) => updateForm('target_message', e.target.value)}
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Quelle est la principale qualité ou compétence que vous voulez démontrer ?"
              required
            />
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isCoaching}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCoaching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Luna structure votre histoire...</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  <span>Optimiser mon storytelling</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

const CoachingResults = memo(({ 
  result, 
  onReset, 
  getScoreColor, 
  getPriorityColor 
}: {
  result: any;
  onReset: () => void;
  getScoreColor: (score: number) => string;
  getPriorityColor: (priority: string) => string;
}) => {
  const [activeTab, setActiveTab] = useState<'story' | 'analysis' | 'improvements' | 'practice'>('story');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-purple-500" />
            <div>
              <h3 className="text-xl font-bold text-gray-800">Coaching Storytelling Terminé</h3>
              <p className="text-purple-600">Votre histoire a été optimisée par Luna</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{result.story_analysis.overall_score}</div>
              <div className="text-xs text-gray-500">Score global</div>
            </div>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Nouvelle histoire
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <TabButton 
            active={activeTab === 'story'} 
            onClick={() => setActiveTab('story')}
            icon={<Mic className="h-4 w-4" />}
            label="Histoire Structurée"
          />
          <TabButton 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')}
            icon={<TrendingUp className="h-4 w-4" />}
            label="Analyse"
          />
          <TabButton 
            active={activeTab === 'improvements'} 
            onClick={() => setActiveTab('improvements')}
            icon={<Lightbulb className="h-4 w-4" />}
            label="Améliorations"
          />
          <TabButton 
            active={activeTab === 'practice'} 
            onClick={() => setActiveTab('practice')}
            icon={<Target className="h-4 w-4" />}
            label="Questions d'Entraînement"
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'story' && (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <div 
                className="bg-purple-50 border border-purple-200 rounded-lg p-6 whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: result.structured_story.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/## (.*?)\n/g, '<h3 class="text-lg font-bold text-purple-800 mb-3">$1</h3>') }}
              />
            </div>
            
            {/* STAR Framework */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Award className="h-5 w-5 text-yellow-500 mr-2" />
                Framework STAR
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-blue-800 mb-2">🎯 Situation</div>
                  <p className="text-blue-700 text-sm">{result.storytelling_framework.situation}</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800 mb-2">📋 Tâche</div>
                  <p className="text-green-700 text-sm">{result.storytelling_framework.task}</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-2">⚡ Action</div>
                  <p className="text-yellow-700 text-sm">{result.storytelling_framework.action}</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="font-medium text-purple-800 mb-2">🏆 Résultat</div>
                  <p className="text-purple-700 text-sm">{result.storytelling_framework.result}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <ScoreCard title="Clarté" score={result.story_analysis.clarity_score} color={getScoreColor(result.story_analysis.clarity_score)} />
              <ScoreCard title="Impact" score={result.story_analysis.impact_score} color={getScoreColor(result.story_analysis.impact_score)} />
              <ScoreCard title="Authenticité" score={result.story_analysis.authenticity_score} color={getScoreColor(result.story_analysis.authenticity_score)} />
              <ScoreCard title="Score Global" score={result.story_analysis.overall_score} color={getScoreColor(result.story_analysis.overall_score)} />
            </div>
          </div>
        )}

        {activeTab === 'improvements' && (
          <div className="space-y-4">
            {result.improvements.map((improvement: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-800">{improvement.category}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getPriorityColor(improvement.priority)}-100 text-${getPriorityColor(improvement.priority)}-700`}>
                    {improvement.priority === 'high' ? 'Haute' : improvement.priority === 'medium' ? 'Moyenne' : 'Faible'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{improvement.suggestion}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-emerald-600" />
                <div className="font-medium text-emerald-800">Questions d'entraînement</div>
              </div>
              <p className="text-emerald-700 text-sm">
                Utilisez ces questions pour pratiquer votre histoire optimisée
              </p>
            </div>
            {result.practice_questions.map((question: string, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium text-sm">{index + 1}</span>
                  </div>
                  <p className="text-gray-800">{question}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const TabButton = memo(({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      active 
        ? 'bg-white text-purple-700 shadow-sm' 
        : 'text-gray-600 hover:text-purple-600'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
));

const ScoreCard = memo(({ title, score, color }: {
  title: string;
  score: number;
  color: string;
}) => (
  <div className="text-center p-4 bg-gray-50 rounded-lg">
    <div className={`text-3xl font-bold text-${color}-600 mb-1`}>{score}</div>
    <div className="text-gray-600 text-sm mb-2">{title}</div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 bg-${color}-500 rounded-full transition-all duration-300`}
        style={{ width: `${score}%` }}
      ></div>
    </div>
  </div>
));

StorytellingCoachTab.displayName = 'StorytellingCoachTab';
CoachingResults.displayName = 'CoachingResults';
TabButton.displayName = 'TabButton';
ScoreCard.displayName = 'ScoreCard';

export default StorytellingCoachTab;