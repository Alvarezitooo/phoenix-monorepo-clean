'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, ExternalLink, ArrowRight, Mail, Lock, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { lunaHubHelpers } from '@/lib/api';
import { useAssessmentStore } from '@/lib/store';

export default function LoginPage() {
  const { setUser } = useAssessmentStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'luna' | 'local'>('luna');

  // Vérifier token Luna Hub au chargement
  useEffect(() => {
    const checkLunaHubAuth = async () => {
      const token = lunaHubHelpers.extractTokenFromCallback();
      if (token) {
        const isValid = await lunaHubHelpers.validateToken(token);
        if (isValid) {
          // TODO: Récupérer profil utilisateur depuis Luna Hub
          const mockUser = {
            id: 'user-123',
            name: 'Utilisateur Luna Hub',
            email: 'user@luna-hub.com',
            lunaHubEnergy: 85,
            assessmentStatus: 'not_started' as const,
          };
          setUser(mockUser);
          window.location.href = '/profile';
        }
      }
    };

    checkLunaHubAuth();
  }, [setUser]);

  const handleLunaHubLogin = () => {
    const currentUrl = encodeURIComponent(window.location.origin + '/login');
    window.location.href = `https://luna-hub.phoenix-ia.com/auth/login?redirect=${currentUrl}`;
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Intégrer avec NextAuth ou API locale
      console.log('Local login attempt:', { email, password });
      
      // Simulation pour démo
      setTimeout(() => {
        const mockUser = {
          id: 'local-user-123',
          name: email.split('@')[0],
          email,
          lunaHubEnergy: 50,
          assessmentStatus: 'not_started' as const,
        };
        setUser(mockUser);
        setIsLoading(false);
        window.location.href = '/profile';
      }, 1500);
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  const handleLocalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Intégrer avec NextAuth ou API locale
      console.log('Local signup attempt:', { name, email, password });
      
      // Simulation pour démo
      setTimeout(() => {
        const mockUser = {
          id: 'new-user-123',
          name,
          email,
          lunaHubEnergy: 100, // Énergie de bienvenue
          assessmentStatus: 'not_started' as const,
        };
        setUser(mockUser);
        setIsLoading(false);
        window.location.href = '/assessment';
      }, 1500);
    } catch (error) {
      console.error('Signup failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Phoenix Aube
            </span>
          </Link>
          <p className="text-gray-600">
            Connectez-vous pour accéder à vos résultats d'assessment
          </p>
        </div>

        {/* Luna Hub Option (Recommandée) */}
        <Card className="shadow-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <ExternalLink className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <h3 className="text-lg font-bold text-blue-900">Connexion Luna Hub</h3>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Recommandé</Badge>
              </div>
              <p className="text-sm text-blue-700">
                Utilisez votre compte Luna Hub existant pour accéder à Phoenix Aube avec vos points d'énergie
              </p>
            </div>
            <Button 
              onClick={handleLunaHubLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              size="lg"
              disabled={isLoading}
            >
              {isLoading && authMethod === 'luna' ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5 mr-2" />
              )}
              Se connecter avec Luna Hub
            </Button>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou créer un compte Phoenix Aube</span>
          </div>
        </div>

        {/* Local Auth */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Compte Phoenix Aube</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLocalLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading && authMethod === 'local' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleLocalSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Votre nom"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    En créant un compte, vous acceptez nos{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                      conditions d'utilisation
                    </Link>{' '}
                    et notre{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                      politique de confidentialité
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading}
                    onClick={() => setAuthMethod('local')}
                  >
                    {isLoading && authMethod === 'local' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
          <CardContent className="p-6 text-center space-y-3">
            <h3 className="text-lg font-bold">Pourquoi créer un compte ?</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium">✨ Assessment personnalisé</div>
                <div className="text-blue-100">Profil psychologique détaillé</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">🎯 Recommandations IA</div>
                <div className="text-blue-100">Métiers adaptés à votre profil</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">📈 Suivi évolution</div>
                <div className="text-blue-100">Historique et progression</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">🔗 Intégration Luna Hub</div>
                <div className="text-blue-100">Écosystème Phoenix IA</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}