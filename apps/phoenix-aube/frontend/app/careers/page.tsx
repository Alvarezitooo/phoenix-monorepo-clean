'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScoreCircle } from '@/components/assessment/ScoreCircle';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Users, 
  MapPin, 
  Clock,
  Star,
  Brain,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { phoenixAubeApi } from '@/lib/api';
import { useAssessmentStore } from '@/lib/store';

interface Career {
  id: string;
  title: string;
  description: string;
  industry: string;
  salary_range: string;
  growth_outlook: string;
  required_skills: string[];
  work_environment: string;
  autonomy_level: 'low' | 'medium' | 'high';
  creativity_level: 'low' | 'medium' | 'high';
  social_impact: 'low' | 'medium' | 'high';
  compatibility_score?: number;
}

const industries = ["Tous", "Tech", "Conseil", "Corporate", "Startup", "Santé", "Éducation", "Finance", "Marketing"];

const autonomyLevels = {
  low: "Guidé",
  medium: "Équilibré", 
  high: "Autonome"
};

const levelColors = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-purple-100 text-purple-800"
};

export default function CareersPage() {
  const { user, results } = useAssessmentStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('Tous');
  const [sortBy, setSortBy] = useState('compatibility');
  const [careers, setCareers] = useState<Career[]>([]);
  const [filteredCareers, setFilteredCareers] = useState<Career[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la base de données métiers
  useEffect(() => {
    const loadCareers = async () => {
      setIsLoading(true);
      try {
        const careersData = await phoenixAubeApi.getCareersDatabase();
        
        // Ajouter les scores de compatibilité si disponibles
        const enrichedCareers = careersData.careers.map((career: Career) => {
          const match = results?.career_matches.find(m => 
            m.title.toLowerCase() === career.title.toLowerCase()
          );
          return {
            ...career,
            compatibility_score: match?.compatibility_score
          };
        });

        setCareers(enrichedCareers);
        setFilteredCareers(enrichedCareers);
      } catch (error: unknown) {
        console.error('Failed to load careers:', error);
        // Utiliser données de fallback si API échoue
        setCareers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCareers();
  }, [results]);

  // Filtrer et trier
  useEffect(() => {
    let filtered = careers.filter(career => {
      const matchesSearch = career.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           career.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           career.required_skills.some(skill => 
                             skill.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      
      const matchesIndustry = selectedIndustry === 'Tous' || career.industry === selectedIndustry;
      
      return matchesSearch && matchesIndustry;
    });

    // Tri
    if (sortBy === 'compatibility' && filtered.some(c => c.compatibility_score)) {
      filtered.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
    } else if (sortBy === 'growth') {
      filtered.sort((a, b) => {
        const growthA = parseInt(a.growth_outlook.replace(/[^\d]/g, ''));
        const growthB = parseInt(b.growth_outlook.replace(/[^\d]/g, ''));
        return growthB - growthA;
      });
    } else if (sortBy === 'salary') {
      filtered.sort((a, b) => {
        const salaryA = parseInt(a.salary_range.replace(/[^\d]/g, ''));
        const salaryB = parseInt(b.salary_range.replace(/[^\d]/g, ''));
        return salaryB - salaryA;
      });
    }

    setFilteredCareers(filtered);
  }, [searchTerm, selectedIndustry, sortBy, careers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <p className="text-gray-600">Chargement de la base métiers...</p>
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
              <Link href="/profile">
                <Button variant="outline" size="sm">Mon Profil</Button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl font-bold text-gray-900">
            Explorez les métiers de demain
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Plus de 500 métiers analysés avec leurs perspectives d'évolution, 
            salaires et compatibilité avec votre profil
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Rechercher un métier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Secteur" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compatibility">Compatibilité</SelectItem>
                  <SelectItem value="growth">Croissance</SelectItem>
                  <SelectItem value="salary">Salaire</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Plus de filtres</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredCareers.length} métier{filteredCareers.length > 1 ? 's' : ''} trouvé{filteredCareers.length > 1 ? 's' : ''}
            </p>
            {filteredCareers.some(c => c.compatibility_score) && (
              <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                ✨ Scores personnalisés disponibles
              </Badge>
            )}
          </div>

          <div className="grid gap-6">
            {filteredCareers.map((career) => (
              <Card key={career.id} className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {career.title}
                        </h3>
                        <Badge variant="outline">{career.industry}</Badge>
                        {career.compatibility_score && (
                          <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                            <Star className="w-3 h-3 mr-1" />
                            {career.compatibility_score}% match
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600">{career.description}</p>
                    </div>
                    {career.compatibility_score && (
                      <div className="ml-6">
                        <ScoreCircle 
                          score={career.compatibility_score} 
                          size="md" 
                          label="Match" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{career.salary_range}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Croissance {career.growth_outlook}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{career.work_environment}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{autonomyLevels[career.autonomy_level]}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <p className="text-sm font-medium text-gray-900">Compétences requises :</p>
                    <div className="flex flex-wrap gap-2">
                      {career.required_skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <Badge className={levelColors[career.creativity_level]}>
                        🎨 Créativité {career.creativity_level}
                      </Badge>
                      <Badge className={levelColors[career.social_impact]}>
                        🌱 Impact {career.social_impact}
                      </Badge>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 group-hover:scale-105 transition-all duration-200">
                      Voir détails
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCareers.length === 0 && (
            <Card className="shadow-lg">
              <CardContent className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Aucun métier trouvé</h3>
                <p className="text-gray-600">
                  Essayez d'ajuster vos critères de recherche ou explorez d'autres secteurs
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedIndustry('Tous');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CTA Banner */}
        {!user && (
          <Card className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none shadow-xl">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold">Pas encore fait votre assessment ?</h2>
              <p className="text-blue-100">
                Découvrez vos scores de compatibilité personnalisés avec chaque métier
              </p>
              <Link href="/assessment">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50">
                  Commencer l'assessment
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}