import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Mail, 
  BarChart3, 
  Trophy, 
  Zap, 
  Calendar,
  TrendingUp,
  Target
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { JournalChapter, JournalKPIs } from '@/services/journalAPI';

interface ChaptersTimelineProps {
  chapters: JournalChapter[];
  kpis: JournalKPIs;
}

// Mapping des types de chapitres vers leurs icônes et couleurs
const chapterTypeConfig = {
  cv: {
    icon: FileText,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    emoji: '📄'
  },
  letter: {
    icon: Mail,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    emoji: '✉️'
  },
  analysis: {
    icon: BarChart3,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    emoji: '📊'
  },
  milestone: {
    icon: Trophy,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    emoji: '🏆'
  },
  energy: {
    icon: Zap,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    emoji: '⚡'
  },
  other: {
    icon: Calendar,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    emoji: '📝'
  }
};

function ChapterCard({ chapter, index }: { chapter: JournalChapter; index: number }) {
  const config = chapterTypeConfig[chapter.type];
  const Icon = config.icon;
  
  // Format timestamp
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours < 1) return 'À l\'instant';
      return `Il y a ${diffInHours}h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative"
    >
      {/* Timeline connector */}
      {index > 0 && (
        <div className="absolute left-6 top-0 w-0.5 h-4 bg-gray-200" />
      )}
      
      <div className="flex space-x-4">
        {/* Timeline dot with icon */}
        <div className={`
          flex-shrink-0 w-12 h-12 ${config.color} rounded-full 
          flex items-center justify-center shadow-sm
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Chapter content */}
        <Card className={`flex-1 p-4 ${config.bgColor} border-l-4 border-l-${config.color.replace('bg-', '')}-500`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2">{config.emoji}</span>
                {chapter.title}
              </h3>
              <p className="text-sm text-gray-500">{formatDate(chapter.ts)}</p>
            </div>
          </div>

          {/* Chapter gains */}
          {chapter.gain.length > 0 && (
            <div className="space-y-1">
              {chapter.gain.map((gain, gainIndex) => (
                <Badge 
                  key={gainIndex}
                  variant="secondary" 
                  className={`mr-2 ${config.textColor} ${config.bgColor} border-0`}
                >
                  {gain}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}

function KPISection({ kpis }: { kpis: JournalKPIs }) {
  if (!kpis.ats_mean && !kpis.letters_count) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mb-8"
    >
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Target className="w-6 h-6 mr-2 text-purple-600" />
          📈 Votre Progression
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* ATS Score KPI */}
          {kpis.ats_mean && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Score ATS Moyen</h3>
                <Badge variant={
                  kpis.ats_mean.trend === 'up' ? 'default' : 
                  kpis.ats_mean.trend === 'down' ? 'destructive' : 'secondary'
                }>
                  {kpis.ats_mean.trend === 'up' && '📈'} 
                  {kpis.ats_mean.trend === 'down' && '📉'} 
                  {kpis.ats_mean.trend === 'flat' && '➡️'} 
                  {kpis.ats_mean.delta_pct_14d > 0 ? '+' : ''}{kpis.ats_mean.delta_pct_14d}%
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-gray-900">
                  {kpis.ats_mean.value}/100
                </div>
                <div className="flex-1">
                  <Progress value={kpis.ats_mean.value} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Actuel</span>
                    <span>Objectif: {kpis.ats_mean.target}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Letters Count KPI */}
          {kpis.letters_count && (
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Lettres Générées</h3>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-gray-900">
                  {kpis.letters_count.value}
                </div>
                <div className="text-gray-500">
                  lettre{kpis.letters_count.value > 1 ? 's' : ''} créée{kpis.letters_count.value > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function ChaptersTimeline({ chapters, kpis }: ChaptersTimelineProps) {
  if (chapters.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-6xl mb-4">📖</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Votre histoire commence maintenant
        </h3>
        <p className="text-gray-600">
          Vos actions avec Luna apparaîtront ici comme des chapitres de votre récit professionnel.
        </p>
      </Card>
    );
  }

  return (
    <div>
      {/* KPIs Section */}
      <KPISection kpis={kpis} />

      {/* Timeline Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          📖 Mes Chapitres
          <Badge className="ml-3 bg-purple-100 text-purple-800">
            {chapters.length} chapitre{chapters.length > 1 ? 's' : ''}
          </Badge>
        </h2>
        <p className="text-gray-600 mt-1">
          Chaque action forge votre légende professionnelle
        </p>
      </div>

      {/* Chapters Timeline */}
      <div className="space-y-6">
        {chapters.map((chapter, index) => (
          <ChapterCard 
            key={chapter.id} 
            chapter={chapter} 
            index={index}
          />
        ))}
      </div>

      {/* Timeline end */}
      <motion.div
        className="flex items-center justify-center mt-8 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="flex items-center space-x-3 text-gray-500">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span className="text-sm">Début de votre aventure Luna</span>
          <TrendingUp className="w-4 h-4" />
        </div>
      </motion.div>
    </div>
  );
}