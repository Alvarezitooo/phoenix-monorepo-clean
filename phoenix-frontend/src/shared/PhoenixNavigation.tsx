import { Link, useLocation } from 'react-router-dom';
import { Flame, Moon, FileText, BarChart3, Sunrise, User, Menu, Zap, BookOpen } from 'lucide-react';
import { useLuna } from '../luna';

export default function PhoenixNavigation() {
  const location = useLocation();
  const luna = useLuna();
  
  const navItems = [
    { path: '/', label: 'Luna Copilot', icon: Flame },
    { path: '/aube', label: 'Luna Aube', icon: Sunrise, badge: '🌅' },
    { path: '/cv', label: 'Luna CV', icon: BarChart3, badge: '📄' },
    { path: '/letters', label: 'Luna Letters', icon: FileText, badge: '✍️' },
    { path: '/rise', label: 'Luna Rise', icon: User, badge: '🎯', isNew: true },
    { path: '/energy', label: `${luna.lunaEnergy || 0}⚡ Energy`, icon: Zap, badge: '⚡', special: true },
    ...(luna.authenticatedUser ? [{ path: '/journal', label: 'Journal Luna', icon: BookOpen, badge: '📖' }] : []),
    // ✅ Logique conditionnelle : Connexion OU Profil/Logout
    ...(luna.authenticatedUser 
      ? [{ path: '/profile', label: `👋 ${luna.authenticatedUser.email?.split('@')[0] || 'Profil'}`, icon: User, isAuth: true }]
      : [{ path: '/login', label: 'Connexion', icon: User }]
    )
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-b border-orange-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative">
              <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
              <div className="absolute inset-0 h-8 w-8 text-orange-400 animate-ping opacity-75">
                <Flame className="h-8 w-8" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Phoenix
              </span>
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-slate-400">avec</span>
                <Moon className="h-4 w-4 text-indigo-500" />
                <span className="font-semibold text-indigo-600">Luna</span>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">            
            {navItems.map(({ path, label, icon: Icon, badge, isNew, special, isAuth }) => {
              // 🎯 Gestion spéciale pour l'élément auth (Profil connecté)
              if (isAuth && luna.authenticatedUser) {
                return (
                  <div key={path} className="relative">
                    <button
                      onClick={() => luna.logout()}
                      className="relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200"
                      title="Cliquer pour se déconnecter"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    </button>
                  </div>
                );
              }

              // 🎯 Navigation normale
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === path
                      ? special 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg animate-pulse' 
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : special
                        ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200'
                        : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {badge && <span className="text-xs">{badge}</span>}
                  <span>{label}</span>
                  {isNew && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs px-1 rounded-full animate-pulse">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}