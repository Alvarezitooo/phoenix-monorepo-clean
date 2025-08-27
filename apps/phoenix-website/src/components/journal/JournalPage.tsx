import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Zap, 
  FileText, 
  Target,
  Clock,
  Star,
  ChevronRight,
  Moon,
  Heart,
  Award,
  BookOpen
} from 'lucide-react';
import { api } from '../../lib/api';

// Types pour le Journal
interface JournalUser {
  id: string;
  first_name: string;
  plan: 'standard' | 'unlimited';
}

interface JournalEnergy {
  balance_pct: number;
  last_purchase?: string;
}

interface JournalKPIs {
  ats_mean: {
    value: number;
    target: number;
    trend: 'up' | 'down' | 'flat';
    delta_pct_14d: number;
  };
  letters_count?: {
    value: number;
  };
}

interface JournalChapter {
  id: string;
  type: 'cv' | 'letter' | 'analysis' | 'milestone' | 'other';
  title: string;
  gain: string[];
  ts: string;
}

interface JournalNextStep {
  action: string;
  cost_pct: number;
  expected_gain: string;
}

interface JournalNarrative {
  chapters: JournalChapter[];
  kpis: JournalKPIs;
  last_doubt?: string;
  next_steps: JournalNextStep[];
}

interface JournalData {
  user: JournalUser;
  energy: JournalEnergy;
  narrative: JournalNarrative;
  ethics: {
    ownership: boolean;
    export_available: boolean;
  };
}

interface JournalPageProps {
  userId?: string;
  onClose?: () => void;
}

const JournalPage: React.FC<JournalPageProps> = ({ userId, onClose }) => {
  const [journalData, setJournalData] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournal = async () => {
      // Récupérer l'utilisateur authentifié réel
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Veuillez vous connecter pour accéder à votre journal');
        setLoading(false);
        return;
      }

      let currentUserId: string;
      try {
        // Décoder le token JWT pour récupérer l'user_id réel
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = payload.sub;
        
        if (!currentUserId) {
          setError('Token invalide - Veuillez vous reconnecter');
          setLoading(false);
          return;
        }
      } catch (err) {
        setError('Token malformé - Veuillez vous reconnecter');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`https://luna-hub-backend-unified-production.up.railway.app/luna/journal/${currentUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setJournalData(data);
      } catch (err) {
        console.error('Erreur chargement journal:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchJournal();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <Moon className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-indigo-600">Luna compile votre récit narratif...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h2>
            <p className="text-red-600">{error}</p>
            {onClose && (
              <button 
                onClick={onClose}
                className="mt-4 text-red-600 hover:underline"
              >
                Retour
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!journalData) return null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <div className="h-4 w-4 border-t-2 border-gray-400" />;
    }
  };

  const getChapterIcon = (type: string) => {
    switch (type) {
      case 'cv': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'letter': return <BookOpen className="h-5 w-5 text-green-500" />;
      case 'analysis': return <Target className="h-5 w-5 text-purple-500" />;
      case 'milestone': return <Award className="h-5 w-5 text-yellow-500" />;
      default: return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header avec profil utilisateur */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Journal Narratif - {journalData.user.first_name}
                </h1>
                <p className="text-gray-600">Votre parcours Phoenix avec Luna</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Énergie Luna</div>
              <div className="text-2xl font-bold text-indigo-600">
                {journalData.energy.balance_pct.toFixed(0)}%
              </div>
              {journalData.user.plan === 'unlimited' && (
                <div className="text-xs text-emerald-600 font-semibold">Unlimited ✨</div>
              )}
            </div>
          </div>
        </div>

        {/* KPIs Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Score ATS Moyen</h3>
              {getTrendIcon(journalData.narrative.kpis.ats_mean.trend)}
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-bold text-indigo-600">
                {journalData.narrative.kpis.ats_mean.value}
              </span>
              <span className="text-gray-500">/ {journalData.narrative.kpis.ats_mean.target}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {journalData.narrative.kpis.ats_mean.delta_pct_14d > 0 ? '+' : ''}{journalData.narrative.kpis.ats_mean.delta_pct_14d}% sur 14j
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Lettres Générées</h3>
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {journalData.narrative.kpis.letters_count?.value || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">Avec Luna</p>
          </div>
        </div>

        {/* Chapitres Timeline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
            Votre Parcours Narratif
          </h3>
          
          {journalData.narrative.chapters.length > 0 ? (
            <div className="space-y-4">
              {journalData.narrative.chapters.map((chapter, index) => (
                <div key={chapter.id} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0">
                    {getChapterIcon(chapter.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{chapter.title}</h4>
                      <time className="text-sm text-gray-500">
                        {new Date(chapter.ts).toLocaleDateString('fr-FR')}
                      </time>
                    </div>
                    {chapter.gain.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {chapter.gain.map((gain, idx) => (
                          <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {gain}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Votre parcours commence ici. Première action avec Luna pour créer votre premier chapitre !</p>
            </div>
          )}
        </div>

        {/* Prochaines Étapes */}
        {journalData.narrative.next_steps.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Target className="h-5 w-5 text-indigo-500 mr-2" />
              Prochaines Étapes Recommandées
            </h3>
            <div className="space-y-3">
              {journalData.narrative.next_steps.map((step, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-indigo-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{step.action}</p>
                      <p className="text-sm text-green-600">{step.expected_gain}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{step.cost_pct}% énergie</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doute récent */}
        {journalData.narrative.last_doubt && (
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
            <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
              <Heart className="h-5 w-5 text-amber-600 mr-2" />
              Luna se souvient
            </h3>
            <p className="text-amber-700 italic">
              "{journalData.narrative.last_doubt}"
            </p>
            <p className="text-sm text-amber-600 mt-2">
              💫 Luna garde en mémoire tes interrogations pour mieux t'accompagner
            </p>
          </div>
        )}

        {/* Footer éthique */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-indigo-600">
              <Moon className="h-5 w-5" />
              <span className="font-semibold">Ton histoire t'appartient</span>
            </div>
            <p className="text-sm text-gray-600">
              {journalData.ethics.ownership ? '✅' : '❌'} Propriété complète de tes données
              {' • '}
              {journalData.ethics.export_available ? '✅' : '❌'} Export disponible à tout moment
            </p>
          </div>
        </div>

        {onClose && (
          <div className="text-center">
            <button 
              onClick={onClose}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Retour au tableau de bord
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalPage;