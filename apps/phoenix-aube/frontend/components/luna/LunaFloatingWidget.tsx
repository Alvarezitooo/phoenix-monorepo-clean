'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, MessageCircle, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import LunaChat from './LunaChat';

interface LunaFloatingWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  persona?: 'reconversion' | 'jeune_diplome' | 'pivot_tech' | 'ops_data' | 'reprise';
  className?: string;
}

const LunaFloatingWidget: React.FC<LunaFloatingWidgetProps> = ({
  isOpen,
  onToggle,
  persona = 'jeune_diplome',
  className
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [animateIcon, setAnimateIcon] = useState(false);

  // Animation d'appel à l'action subtile
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        setAnimateIcon(true);
        setTimeout(() => setAnimateIcon(false), 600);
      }, 8000); // Pulse toutes les 8 secondes

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Notification de nouveau message (simulation)
  useEffect(() => {
    if (!isOpen && !hasNewMessage) {
      const timeout = setTimeout(() => {
        setHasNewMessage(true);
      }, 3000); // Première notification après 3s

      return () => clearTimeout(timeout);
    }
  }, [isOpen, hasNewMessage]);

  const handleOpen = () => {
    setHasNewMessage(false);
    onToggle();
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Widget flottant */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out",
        className
      )}>
        
        {/* Bouton d'ouverture (quand fermé) */}
        {!isOpen && (
          <div className="relative">
            <button
              onClick={handleOpen}
              className={cn(
                "w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full shadow-2xl",
                "flex items-center justify-center text-white hover:shadow-purple-500/50",
                "transition-all duration-300 hover:scale-110 hover:rotate-12",
                "border-4 border-white",
                animateIcon && "animate-bounce"
              )}
            >
              <span className="text-2xl">🌙</span>
              
              {/* Badge notification */}
              {hasNewMessage && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">!</span>
                </div>
              )}
            </button>
            
            {/* Bulle d'introduction */}
            {hasNewMessage && (
              <div className="absolute bottom-20 right-0 bg-white p-3 rounded-xl shadow-lg border border-purple-200 max-w-xs animate-in slide-in-from-right">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🌙</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">Salut ! Moi c'est Luna ✨</p>
                    <p className="text-xs text-gray-600 mt-1">60s pour découvrir 3 métiers qui te ressemblent ?</p>
                  </div>
                </div>
                {/* Triangle pointer */}
                <div className="absolute bottom-0 right-6 transform translate-y-1">
                  <div className="w-3 h-3 bg-white border-b border-r border-purple-200 transform rotate-45"></div>
                </div>
              </div>
            )}
            
            {/* Effet de pulsation subtile */}
            <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full animate-ping opacity-20"></div>
          </div>
        )}

        {/* Chat widget ouvert */}
        {isOpen && (
          <div className={cn(
            "bg-white rounded-2xl shadow-2xl transition-all duration-300",
            "border border-purple-200 overflow-hidden",
            isMinimized 
              ? "w-80 h-16" 
              : "w-96 h-[600px] max-h-[80vh]"
          )}>
            
            {/* Header du widget */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">🌙</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Luna</h3>
                    <p className="text-xs text-purple-100">Ton guide carrière personnel</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Bouton minimiser */}
                  <button
                    onClick={handleMinimize}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    {isMinimized ? (
                      <Maximize2 className="w-4 h-4" />
                    ) : (
                      <Minimize2 className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Bouton fermer */}
                  <button
                    onClick={onToggle}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Indicateur en ligne */}
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span className="text-xs text-purple-100">En ligne maintenant</span>
              </div>
            </div>

            {/* Contenu chat (seulement si pas minimisé) */}
            {!isMinimized && (
              <div className="h-full overflow-hidden">
                <LunaChat
                  persona={persona}
                  onResponse={(response) => {
                    console.log('Luna response:', response);
                  }}
                  onEscalation={(level) => {
                    console.log('Luna escalation:', level);
                  }}
                  className="h-full border-0 rounded-none shadow-none bg-transparent p-4"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay léger quand ouvert (mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default LunaFloatingWidget;