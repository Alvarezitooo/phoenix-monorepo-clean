import { Link, useLocation } from 'react-router-dom';
import { Flame, Moon, FileText, BarChart3, Sunrise, User } from 'lucide-react';

export default function PhoenixNavigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Accueil', icon: Flame },
    { path: '/aube', label: 'Aube', icon: Sunrise },
    { path: '/cv', label: 'CV', icon: BarChart3 },
    { path: '/letters', label: 'Lettres', icon: FileText },
    { path: '/login', label: 'Connexion', icon: User }
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
          
          <div className="flex items-center space-x-6">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === path
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}