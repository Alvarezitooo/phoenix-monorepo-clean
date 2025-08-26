import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnergyGauge, useLuna } from './Luna';
import { useUserProfile } from '../hooks/useUserProfile';
import { PhoenixNavigation } from './PhoenixNavigation';
import { 
  Zap, 
  BarChart3, 
  Palette, 
  Target, 
  User, 
  Menu, 
  X,
  Crown,
  Sparkles,
  CheckCircle,
  BookOpen
} from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentEnergy } = useLuna();
  const { userProfile, isLoadingProfile, isUnlimited } = useUserProfile();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/builder', label: 'CV Builder', icon: Zap },
    { path: '/mirror-match', label: 'Mirror Match', icon: Target },
    { path: '/templates', label: 'Templates', icon: Palette },
    { path: '/analytics', label: 'Analytics Hub', icon: BarChart3 },
    { path: '/journal', label: '📖 Journal Narratif', icon: BookOpen },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative z-50 backdrop-blur-xl bg-white/5 border-b border-white/10"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Navigation Phoenix */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-10 h-10 bg-phoenix-gradient rounded-xl flex items-center justify-center shadow-lg shadow-phoenix-500/25">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-luna-gradient rounded-full animate-pulse" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-phoenix-luna-gradient bg-clip-text text-transparent">
                  Phoenix CV
                </h1>
                <p className="text-xs text-gray-400 -mt-1">AI-Powered Career Revolution</p>
              </div>
            </Link>
            
            {/* Phoenix Navigation */}
            <div className="hidden lg:block">
              <PhoenixNavigation />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group relative"
                >
                  <motion.div
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-luna-gradient bg-opacity-20 text-luna-300'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Premium Button & Profile */}
          <div className="flex items-center space-x-4">
            {/* Luna Energy Gauge */}
            <EnergyGauge currentEnergy={currentEnergy} />
            
            {isLoadingProfile ? (
              <div className="hidden md:flex items-center space-x-2 px-6 py-3 bg-gray-700 rounded-xl">
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                <span className="text-gray-300">Loading...</span>
              </div>
            ) : isUnlimited ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden md:flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-white shadow-lg shadow-yellow-500/25"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Luna Unlimited</span>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://phoenix-website-production.up.railway.app', '_blank')}
                className="hidden md:flex items-center space-x-2 px-6 py-3 bg-phoenix-gradient rounded-xl font-semibold text-white shadow-lg shadow-phoenix-500/25 hover:shadow-phoenix-500/40 transition-all duration-300"
              >
                <Crown className="w-5 h-5" />
                <span>Upgrade to Pro</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl border border-slate-500/30"
            >
              <User className="w-5 h-5" />
            </motion.button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 bg-slate-800 rounded-xl border border-slate-700"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4"
          >
            {/* Phoenix Navigation Mobile */}
            <div className="mb-4 lg:hidden">
              <div className="px-4 py-2 text-sm font-medium text-gray-400 mb-2">Navigation Phoenix</div>
              <PhoenixNavigation />
            </div>

            <div className="px-4 py-2 text-sm font-medium text-gray-400 mb-2">Phoenix CV</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                    isActive
                      ? 'bg-luna-gradient bg-opacity-20 text-luna-300'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {isLoadingProfile ? (
              <div className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 rounded-xl mt-4">
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                <span className="text-gray-300">Loading...</span>
              </div>
            ) : isUnlimited ? (
              <div className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-white shadow-lg shadow-yellow-500/25 mt-4">
                <CheckCircle className="w-5 h-5" />
                <span>Luna Unlimited</span>
              </div>
            ) : (
              <button 
                onClick={() => window.open('https://phoenix-website-production.up.railway.app', '_blank')}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-phoenix-gradient rounded-xl font-semibold text-white shadow-lg shadow-phoenix-500/25 mt-4"
              >
                <Crown className="w-5 h-5" />
                <span>Upgrade to Pro</span>
              </button>
            )}
          </motion.nav>
        )}
      </div>
    </motion.header>
  );
}