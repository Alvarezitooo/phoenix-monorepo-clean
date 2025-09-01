/**
 * 🌐 Phoenix Navigation - Unified Cross-Services Navigation
 * Barre de navigation unifiée pour l'écosystème Phoenix
 * 
 * Features:
 * - Navigation cross-services
 * - Energy indicator temps réel
 * - User menu avec sessions management
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';
import { PhoenixAuthProvider, PhoenixUser } from './PhoenixAuthProvider';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  external?: boolean;
}

function NavLink({ href, children, isActive, external = true }: NavLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (external) {
      e.preventDefault();
      window.open(href, '_blank');
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isActive 
          ? 'bg-purple-100 text-purple-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      {children}
    </a>
  );
}

interface EnergyIndicatorProps {
  energy: number | null;
  isUnlimited: boolean;
}

function EnergyIndicator({ energy, isUnlimited }: EnergyIndicatorProps) {
  if (isUnlimited) {
    return (
      <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-full text-sm font-medium">
        <span className="text-lg">🌙</span>
        <span>Luna Unlimited</span>
      </div>
    );
  }

  if (energy === null) {
    return (
      <div className="flex items-center space-x-2 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full text-sm">
        <span>⚡</span>
        <span>Loading...</span>
      </div>
    );
  }

  const getEnergyColor = (energy: number) => {
    if (energy >= 100) return 'from-emerald-500 to-green-600';
    if (energy >= 50) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-red-600';
  };

  return (
    <div className={`flex items-center space-x-2 bg-gradient-to-r ${getEnergyColor(energy)} text-white px-3 py-1.5 rounded-full text-sm font-medium`}>
      <span>⚡</span>
      <span>{Math.round(energy)} Energy</span>
    </div>
  );
}

interface UserMenuProps {
  user: PhoenixUser;
  onLogout: () => void;
}

function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {user.name || user.email.split('@')[0]}
          </div>
          <div className="text-xs text-gray-500">
            {user.subscription_type || 'free'}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-4 border-b border-gray-100">
              <div className="font-medium text-gray-900">{user.name || 'Phoenix User'}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              {user.subscription_type && (
                <div className="text-xs text-purple-600 font-medium mt-1">
                  {user.subscription_type}
                </div>
              )}
            </div>
            
            <div className="p-2">
              <button
                onClick={() => {
                  window.open('https://phoenix-website-production.up.railway.app', '_blank');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🏠 Phoenix Website
              </button>
              
              <button
                onClick={() => {
                  // Lien vers sessions management (si disponible)
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🔐 Manage Sessions
              </button>
              
              <button
                onClick={() => {
                  window.open(`${import.meta.env.VITE_LUNA_HUB_URL || 'https://luna-hub-backend-unified-production.up.railway.app'}/billing/history/${user.id}`, '_blank');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                💳 Billing History
              </button>
              
              <hr className="my-2" />
              
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export interface PhoenixNavigationProps {
  currentService?: 'website' | 'cv' | 'letters' | 'aube';
  className?: string;
}

export function PhoenixNavigation({ currentService, className = '' }: PhoenixNavigationProps) {
  const authProvider = PhoenixAuthProvider.getInstance();
  const [authState, setAuthState] = useState(authProvider.getState());

  useEffect(() => {
    // Initialize auth
    authProvider.initialize();

    // Subscribe to changes
    const unsubscribe = authProvider.subscribe(setAuthState);

    // Refresh energy every 30s
    const energyInterval = setInterval(() => {
      if (authState.isAuthenticated) {
        authProvider.refreshEnergy();
      }
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(energyInterval);
    };
  }, []);

  const handleLogout = async () => {
    await authProvider.logout();
  };

  if (!authState.isAuthenticated) {
    return null; // Don't show nav if not authenticated
  }

  return (
    <nav className={`bg-white border-b border-gray-200 px-6 py-3 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo + Services */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-gray-900">Phoenix</span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <NavLink 
              href="https://phoenix-website-production.up.railway.app"
              isActive={currentService === 'website'}
            >
              🏠 Website
            </NavLink>
            
            <NavLink 
              href="https://phoenix-cv-production.up.railway.app"
              isActive={currentService === 'cv'}
            >
              📄 CV Generator
            </NavLink>
            
            <NavLink 
              href="https://phoenix-letters-production.up.railway.app"
              isActive={currentService === 'letters'}
            >
              ✉️ Letters
            </NavLink>
          </div>
        </div>

        {/* Energy + User Menu */}
        <div className="flex items-center space-x-4">
          <EnergyIndicator 
            energy={authState.energy} 
            isUnlimited={authState.isUnlimited} 
          />
          
          {authState.user && (
            <UserMenu 
              user={authState.user} 
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          <NavLink 
            href="https://phoenix-website-production.up.railway.app"
            isActive={currentService === 'website'}
          >
            🏠 Website
          </NavLink>
          
          <NavLink 
            href="https://phoenix-cv-production.up.railway.app"
            isActive={currentService === 'cv'}
          >
            📄 CV
          </NavLink>
          
          <NavLink 
            href="https://phoenix-letters-production.up.railway.app"
            isActive={currentService === 'letters'}
          >
            ✉️ Letters
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default PhoenixNavigation;