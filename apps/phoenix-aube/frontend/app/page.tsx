'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, Users, TrendingUp, Brain, Target, Heart } from 'lucide-react';
import Link from 'next/link';
import LunaFloatingWidget from '@/components/luna/LunaFloatingWidget';
import { useLunaWidget } from '@/hooks/useLunaWidget';

const testimonials = [
  {
    name: "Marie Dubois",
    role: "Data Scientist",
    content: "Phoenix Aube m'a aidée à découvrir ma passion pour l'analyse de données. L'assessment était précis et les recommandations parfaites !",
    rating: 5
  },
  {
    name: "Thomas Laurent",
    role: "UX Designer", 
    content: "Grâce à cette plateforme, j'ai trouvé ma voie dans le design. L'analyse psychologique était impressionnante de justesse.",
    rating: 5
  },
  {
    name: "Sarah Chen",
    role: "Product Manager",
    content: "Une approche révolutionnaire pour l'orientation professionnelle. J'ai enfin compris mes motivations profondes.",
    rating: 5
  }
];

const trendingCareers = [
  { title: "Data Scientist", growth: "+23%", salary: "55k-85k €" },
  { title: "UX Designer", growth: "+18%", salary: "45k-70k €" },
  { title: "DevOps Engineer", growth: "+31%", salary: "60k-90k €" },
  { title: "Product Manager", growth: "+15%", salary: "70k-100k €" }
];

const features = [
  {
    icon: Brain,
    title: "Assessment Psychologique",
    description: "Analyse avancée de votre personnalité professionnelle basée sur des modèles scientifiques validés"
  },
  {
    icon: Target,
    title: "Recommandations IA",
    description: "Intelligence artificielle qui analyse vos réponses pour identifier vos métiers de rêve"
  },
  {
    icon: TrendingUp,
    title: "Marché du Travail",
    description: "Données temps réel sur les opportunités, salaires et perspectives d'évolution"
  },
  {
    icon: Heart,
    title: "Développement Personnel",
    description: "Comprenez vos motivations profondes et construisez une carrière épanouissante"
  }
];

export default function HomePage() {
  const [hoveredCareer, setHoveredCareer] = useState<number | null>(null);
  const { isOpen, toggleWidget, openWidget, persona } = useLunaWidget('jeune_diplome');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Phoenix Aube
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/careers" className="text-gray-600 hover:text-gray-900 transition-colors">
                Explorer
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">Connexion</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                {/* Luna Introduction */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-xl">🌙</span>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-2 rounded-full border border-purple-200">
                    <span className="text-sm text-purple-800 font-medium">Salut ! Moi c'est Luna, ton guide carrière ✨</span>
                  </div>
                </div>
                
                <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200">
                  🌙 Guidance bienveillante par IA
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Découvrez votre
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {" "}carrière idéale
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Luna vous accompagne dans une exploration douce de vos appétences professionnelles. 
                  Zéro pression, guidance empathique, résultats personnalisés.
                </p>
              </div>
              
              {/* Options Luna : Ultra-Light vs Assessment */}
              <div className="space-y-4">
                {/* Option principale : Ultra-Light avec Luna */}
                <Button 
                  size="lg" 
                  onClick={openWidget}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <span className="mr-2">🌙</span>
                  Commencer avec Luna (60s, 0 énergie)
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                
                {/* Options secondaires */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/assessment" className="flex-1">
                    <Button variant="outline" size="lg" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                      <Brain className="mr-2 w-4 h-4" />
                      Assessment Complet
                    </Button>
                  </Link>
                  <Link href="/careers" className="flex-1">
                    <Button variant="outline" size="lg" className="w-full border-gray-300 hover:border-gray-400">
                      Explorer Métiers
                    </Button>
                  </Link>
                </div>
                
                {/* Message Luna encourageant */}
                <div className="text-center text-sm text-gray-500 italic">
                  💭 "Commence léger avec moi, on peut toujours creuser après !"
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>50,000+ utilisateurs</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>4.9/5 étoiles</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>95% de satisfaction</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 lg:p-12">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Assessment en cours</h3>
                      <Badge variant="secondary">Étape 3/8</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-3/8 transition-all duration-500"></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-gray-700 font-medium">Dans quel environnement préférez-vous travailler ?</p>
                      <div className="space-y-2">
                        <div className="p-3 border-2 border-blue-200 bg-blue-50 rounded-lg cursor-pointer transition-colors">
                          <span className="text-blue-800">En équipe collaborative</span>
                        </div>
                        <div className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                          <span className="text-gray-700">En autonomie complète</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Notre approche scientifique combine psychologie et intelligence artificielle 
              pour une orientation précise et personnalisée.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Careers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Métiers tendance 2025
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez les carrières les plus prometteuses selon nos analyses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingCareers.map((career, index) => (
              <Card 
                key={index}
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                onMouseEnter={() => setHoveredCareer(index)}
                onMouseLeave={() => setHoveredCareer(null)}
              >
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-gray-900">{career.title}</h3>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {career.growth}
                    </Badge>
                    <span className="text-sm text-gray-600">{career.salary}</span>
                  </div>
                  {hoveredCareer === index && (
                    <div className="pt-2 border-t">
                      <Link href="/careers">
                        <Button variant="ghost" size="sm" className="w-full">
                          En savoir plus
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Ils ont trouvé leur voie
            </h2>
            <p className="text-xl text-gray-600">
              Témoignages authentiques de nos utilisateurs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-none shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.content}"</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Prêt à découvrir votre carrière idéale ?
            </h2>
            <p className="text-xl text-blue-100">
              Rejoignez plus de 50,000 professionnels qui ont transformé leur parcours grâce à Phoenix Aube
            </p>
            <Link href="/assessment">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 shadow-xl transition-all duration-300 transform hover:scale-105">
                Commencer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Phoenix Aube</span>
              </div>
              <p className="text-gray-400">
                Révélez votre potentiel professionnel grâce à l'IA et la psychologie.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <div className="space-y-2">
                <Link href="/assessment" className="block text-gray-400 hover:text-white transition-colors">Assessment</Link>
                <Link href="/careers" className="block text-gray-400 hover:text-white transition-colors">Métiers</Link>
                <Link href="/pricing" className="block text-gray-400 hover:text-white transition-colors">Tarifs</Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <Link href="/help" className="block text-gray-400 hover:text-white transition-colors">Aide</Link>
                <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors">Contact</Link>
                <Link href="/privacy" className="block text-gray-400 hover:text-white transition-colors">Confidentialité</Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Luna Hub</h3>
              <div className="space-y-2">
                <Link href="https://luna-hub.phoenix-ia.com" className="block text-gray-400 hover:text-white transition-colors">
                  Mon compte
                </Link>
                <Link href="https://luna-hub.phoenix-ia.com/energy" className="block text-gray-400 hover:text-white transition-colors">
                  Recharger énergie
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Phoenix Aube. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Luna Floating Widget */}
      <LunaFloatingWidget
        isOpen={isOpen}
        onToggle={toggleWidget}
        persona={persona}
      />
    </div>
  );
}