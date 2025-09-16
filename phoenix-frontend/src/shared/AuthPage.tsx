import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useLuna } from '../luna';
import { loginUser, registerUser } from '../services/api';

interface AuthPageProps {
  mode?: 'login' | 'register';
  redirectTo?: string;
}

export default function AuthPage({ mode = 'login', redirectTo = '/aube' }: AuthPageProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>(mode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const luna = useLuna();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let authResult;
      
      if (authMode === 'register') {
        // Essayer de s'inscrire
        try {
          await registerUser(formData.name, formData.email, formData.password, 'newjob');
          console.log('✅ Registration successful');
        } catch (regError: any) {
          console.log('⚠️ Registration failed (user might exist):', regError.message);
          // Continuer avec le login même si l'inscription échoue
        }
      }
      
      // Login (pour inscription OU connexion)
      authResult = await loginUser(formData.email, formData.password);
      console.log('✅ Login successful:', authResult);
      
      // Configurer Luna context
      luna.setUser(authResult);
      
      // Redirection
      navigate(redirectTo);
      
    } catch (err: any) {
      console.error('❌ Auth error:', err);
      setError(err.message || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          
          {/* Header avec Luna */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Moon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {authMode === 'login' ? 'Bon retour !' : 'Bienvenue sur Phoenix !'}
            </h1>
            <p className="text-slate-600">
              {authMode === 'login' 
                ? 'Reconnecte-toi pour continuer ton parcours avec Luna' 
                : 'Crée ton compte et découvre tes métiers gratuitement'
              }
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/50">
            
            {/* Mode Toggle */}
            <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Se connecter
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                  authMode === 'register'
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                S'inscrire
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Field (only for register) */}
              {authMode === 'register' && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Ton prénom"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    className="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="ton@email.com"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Mot de passe sécurisé"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {authMode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* CTA gratuit pour register */}
            {authMode === 'register' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  🎁 <strong>Aucune carte bancaire</strong> • Luna commence à apprendre gratuitement
                </p>
              </div>
            )}
          </div>

          {/* Footer Link */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              ← Retour à l'accueil
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}