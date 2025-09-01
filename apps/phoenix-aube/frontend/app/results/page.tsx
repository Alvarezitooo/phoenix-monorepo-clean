'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CareerCard } from '@/components/assessment/CareerCard';
import { ScoreCircle } from '@/components/assessment/ScoreCircle';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  BookOpen, 
  Heart,
  ArrowRight,
  Download,
  Share2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useAssessmentStore } from '@/lib/store';
import { phoenixAubeApi, PersonalityDimension } from '@/lib/api';

const iconMap = {
  "Orientation People vs Data": Users,
  "Créativité": Sparkles,
  "Autonomie": Target,
  "Impact Social": TrendingUp,
  "Apprentissage": BookOpen,
  "Leadership": Target,
  "Stabilité": Heart
};

export default function ResultsPage() {
  const { user, results, setResults } = useAssessmentStore();
  const [isLoading, setIsLoading] = useState(!results);
  const [selectedCareer, setSelectedCareer] = useState(null);

  useEffect(() => {
    // Si pas de résultats en store, les récupérer via API
    const loadResults = async () => {
      if (!results && user?.id) {
        setIsLoading(true);
        try {
          const recommendations = await phoenixAubeApi.getRecommendations(user.id, 10, true);
          setResults(recommendations);
        } catch (error) {
          console.error('Failed to load results:', error);
          // Rediriger vers assessment si pas de résultats
          window.location.href = '/assessment';
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [user?.id, results, setResults]);

  const handleExportPDF = () => {
    // TODO: Implémenter export PDF
    console.log('Export PDF functionality to be implemented');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mes résultats Phoenix Aube',
          text: 'Découvrez vos métiers idéaux avec Phoenix Aube',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Sharing failed:', error);
      }
    } else {
      // Fallback: copier URL
      navigator.clipboard.writeText(window.location.href);
      // TODO: Afficher toast "Lien copié"
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Chargement de vos résultats...</h2>
              <p className="text-gray-600">Récupération de votre profil personnalisé</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <Brain className="w-16 h-16 text-gray-400 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Aucun résultat trouvé</h2>
              <p className="text-gray-600">Commencez par faire votre assessment</p>
            </div>
            <Link href="/assessment">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Faire l'assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Phoenix Aube</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center animate-bounce">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Vos résultats sont prêts ! 🎉
            </h1>
            <p className="text-xl text-gray-600">
              Découvrez votre profil psychologique et vos carrières idéales
            </p>
          </div>
        </div>

        <Tabs defaultValue="careers" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="careers" className="text-base">Carrières Recommandées</TabsTrigger>
            <TabsTrigger value="personality" className="text-base">Profil Psychologique</TabsTrigger>
          </TabsList>

          <TabsContent value="careers" className="space-y-6">
            <div className="grid gap-6">
              {results.career_matches.map((career, index) => (
                <CareerCard
                  key={index}
                  career={career}
                  onExplore={() => setSelectedCareer(career)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="personality" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {results.personality_profile.map((dimension, index) => {
                const Icon = iconMap[dimension.dimension] || Brain;
                return (
                  <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg">{dimension.dimension}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center">
                        <ScoreCircle score={dimension.score} size="lg" label="Score" />
                      </div>
                      <p className="text-gray-700 text-center">{dimension.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Insights */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <span>Insights Personnalisés</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {results.insights.map((insight, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-blue-900">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="text-center space-y-6 mt-12">
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Link href="/profile">
              <Button variant="outline" className="w-full">
                Mon Profil
              </Button>
            </Link>
            <Link href="/careers">
              <Button variant="outline" className="w-full">
                Explorer Métiers
              </Button>
            </Link>
            <Link href="/assessment">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                Refaire l'Assessment
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-500">
            💡 Vos résultats sont automatiquement sauvegardés dans votre profil
          </p>
        </div>
      </div>
    </div>
  );
}