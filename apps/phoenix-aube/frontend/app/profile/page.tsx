'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnergyMeter } from '@/components/assessment/EnergyMeter';
import { Brain, User, Settings, TrendingUp, Calendar, ExternalLink, RefreshCw, Download, Edit3, Bell, Shield, FolderSync as Sync } from 'lucide-react';
import Link from 'next/link';
import { useAssessmentStore } from '@/lib/store';
import { phoenixAubeApi, lunaHubHelpers } from '@/lib/api';

interface AssessmentHistory {
  date: string;
  type: string;
  results_summary: string;
  energy_cost: number;
}

export default function ProfilePage() {
  const { user, results, setUser } = useAssessmentStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger historique assessment
  useEffect(() => {
    const loadAssessmentHistory = async () => {
      if (user?.id) {
        try {
          const status = await phoenixAubeApi.getAssessmentStatus(user.id);
          // TODO: Adapter selon la réponse API réelle
          setAssessmentHistory(status.history || []);
        } catch (error) {
          console.error('Failed to load assessment history:', error);
        }
      }
    };

    loadAssessmentHistory();
  }, [user?.id]);

  // Rediriger si pas d'utilisateur connecté
  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    }
  }, [user]);

  const getStatusBadge = () => {
    if (!user) return null;
    
    switch (user.assessmentStatus) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">✅ Complété</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ En cours</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">➕ À faire</Badge>;
    }
  };

  const handleRefreshFromLunaHub = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // TODO: Implémenter sync avec Luna Hub
      const token = localStorage.getItem('luna_hub_token');
      if (token) {
        // Simulation mise à jour énergie
        const updatedUser = {
          ...user,
          lunaHubEnergy: Math.min(user.lunaHubEnergy + 10, 100)
        };
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Luna Hub sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <User className="w-16 h-16 text-gray-400 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Connexion requise</h2>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Se connecter
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
              <Link href="/careers">
                <Button variant="outline" size="sm">Explorer</Button>
              </Link>
              <Link href="/assessment">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Assessment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge()}
                    {user.lastAssessmentDate && (
                      <span className="text-sm text-gray-500">
                        Dernière évaluation : {new Date(user.lastAssessmentDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshFromLunaHub}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sync className="w-4 h-4 mr-2" />
                  )}
                  Sync Luna Hub
                </Button>
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="energy">Énergie Luna Hub</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Assessment Status */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-6 h-6 text-blue-500" />
                    <span>Assessment Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.assessmentStatus === 'completed' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Complété le</span>
                        <span className="font-medium">
                          {user.lastAssessmentDate 
                            ? new Date(user.lastAssessmentDate).toLocaleDateString('fr-FR')
                            : 'Date inconnue'
                          }
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Link href="/results">
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                            Voir mes résultats
                          </Button>
                        </Link>
                        <Link href="/assessment">
                          <Button variant="outline" className="w-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refaire l'assessment
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600">Découvrez vos métiers idéaux grâce à notre assessment psychologique</p>
                      <Link href="/assessment">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                          Commencer l'assessment
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                    <span>Statistiques</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center space-y-1">
                      <p className="text-2xl font-bold text-blue-600">
                        {results?.career_matches.length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Métiers recommandés</p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-2xl font-bold text-purple-600">
                        {results?.career_matches[0]?.compatibility_score || '--'}%
                      </p>
                      <p className="text-sm text-gray-600">Meilleur match</p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-2xl font-bold text-green-600">
                        {results?.career_matches[0]?.growth_outlook || '--'}
                      </p>
                      <p className="text-sm text-gray-600">Croissance secteur</p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-2xl font-bold text-orange-600">
                        {results?.career_matches[0]?.salary_range.split('-')[1] || '--'}
                      </p>
                      <p className="text-sm text-gray-600">Salaire max</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-gray-600" />
                  <span>Activité Récente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentHistory.length > 0 ? (
                    assessmentHistory.slice(0, 3).map((assessment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium text-blue-900">{assessment.type}</p>
                          <p className="text-sm text-blue-700">
                            {new Date(assessment.date).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs text-blue-600">{assessment.results_summary}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          -{assessment.energy_cost} énergie
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune activité récente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="energy" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <EnergyMeter current={user.lunaHubEnergy} />

              {/* Energy Usage Guide */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Coût des Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Assessment complet", cost: 12, description: "Analyse psychologique complète" },
                      { name: "Recommandations IA", cost: 5, description: "Suggestions métiers personnalisées" },
                      { name: "Plan de transition", cost: 8, description: "Roadmap personnalisée" },
                      { name: "Analyse comparative", cost: 3, description: "Comparaison entre métiers" }
                    ].map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{action.name}</p>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                        <div className="text-center">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            ⚡ {action.cost}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Luna Hub Integration */}
            <Card className="shadow-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="w-6 h-6 text-purple-600" />
                  <span>Intégration Luna Hub</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Gérez votre énergie et accédez à l'écosystème complet Phoenix IA
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button 
                    onClick={() => window.open('https://luna-hub.phoenix-ia.com/energy', '_blank')}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Recharger énergie
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://luna-hub.phoenix-ia.com', '_blank')}
                  >
                    Luna Hub Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Assessment History */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-gray-600" />
                  <span>Historique des Assessments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentHistory.length > 0 ? (
                    assessmentHistory.map((assessment, index) => (
                      <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{assessment.type}</h3>
                            <Badge variant="outline">
                              {new Date(assessment.date).toLocaleDateString('fr-FR')}
                            </Badge>
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              -{assessment.energy_cost} énergie
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{assessment.results_summary}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            Voir résultats
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun assessment effectué</p>
                      <Link href="/assessment">
                        <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600">
                          Faire mon premier assessment
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-6 h-6 text-gray-600" />
                  <span>Paramètres du Compte</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <span>Notifications par email</span>
                    </label>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Configurer les préférences
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Confidentialité</span>
                    </label>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Gérer mes données
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4" />
                      <span>Connexion Luna Hub</span>
                    </label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={handleRefreshFromLunaHub}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sync className="w-4 h-4 mr-2" />
                      )}
                      Synchroniser
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export données</span>
                    </label>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}