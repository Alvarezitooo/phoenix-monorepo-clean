'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Heart, ArrowRight } from 'lucide-react';
import { lunaApi } from '@/lib/luna-api';

// Types pour les messages Luna
interface LunaMessage {
  id: string;
  type: 'luna' | 'user' | 'mirror';
  content: string;
  timestamp: Date;
  persona?: string;
  tone?: 'bienveillant' | 'energisant' | 'rassurant' | 'complice';
  escalation?: string;
}

interface LunaChatProps {
  persona?: 'reconversion' | 'jeune_diplome' | 'pivot_tech' | 'ops_data' | 'reprise';
  currentStep?: string;
  userSignals?: Record<string, any>;
  onResponse?: (response: string) => void;
  onEscalation?: (nextLevel: string) => void;
  className?: string;
}

// Scripts Luna par persona (basé sur la doc)
const LUNA_SCRIPTS = {
  reconversion: {
    tone: 'bienveillant' as const,
    opening: "Salut ! Moi c'est Luna 🌙 On reste léger, tu peux tout passer. Je vais t'accompagner sans pression.",
    encouragement: "On avance à ton rythme, sans stress. Tu as déjà fait le plus dur en venant ici ✨",
    escalation: "proposer Court uniquement si 🙂 et « ok pour 3 min ». Sinon « on reprend demain au calme »"
  },
  jeune_diplome: {
    tone: 'energisant' as const, 
    opening: "Salut ! Moi c'est Luna 🌙 3 minutes et je te montre 3 métiers qui te ressemblent. Prêt(e) ? 🚀",
    encouragement: "Tu as plein de potentiel ! On va révéler tes forces cachées",
    escalation: "proposer Profond si enthousiasme (« je veux creuser »)"
  },
  pivot_tech: {
    tone: 'rassurant' as const,
    opening: "Salut ! Moi c'est Luna 🌙 On va capitaliser sur tes forces tech pour explorer de nouveaux territoires",
    encouragement: "Tes compétences sont transférables, je vais te le prouver !",
    escalation: "focus sur la transférabilité des skills"
  },
  ops_data: {
    tone: 'complice' as const,
    opening: "Salut ! Moi c'est Luna 🌙 Version no-code en premier, puis on voit si tu veux creuser la technique",
    encouragement: "Les Ops comprennent les systèmes - l'analyse de données va te parler",
    escalation: "proposer parcours technique progressif"
  },
  reprise: {
    tone: 'bienveillant' as const,
    opening: "Salut ! Moi c'est Luna 🌙 On intègre tes contraintes dès le départ. Tout est adaptable.",
    encouragement: "Ton expérience est un atout, pas un obstacle. On construit ensemble",
    escalation: "focus sur flexibilité et contraintes"
  }
};

const LunaChat: React.FC<LunaChatProps> = ({ 
  persona = 'jeune_diplome',
  currentStep,
  userSignals,
  onResponse,
  onEscalation,
  className 
}) => {
  const [messages, setMessages] = useState<LunaMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  
  const script = LUNA_SCRIPTS[persona];

  // Message d'accueil Luna au chargement
  useEffect(() => {
    const welcomeMessage: LunaMessage = {
      id: `luna-${Date.now()}`,
      type: 'luna',
      content: script.opening,
      timestamp: new Date(),
      persona,
      tone: script.tone
    };
    
    // Animation d'apparition progressive
    setTimeout(() => {
      setMessages([welcomeMessage]);
    }, 500);
  }, [persona]);

  // Fonction pour Luna qui répond avec empathie
  const addLunaResponse = (content: string, type: 'luna' | 'mirror' = 'luna') => {
    setIsTyping(true);
    
    // Simulation typing Luna
    setTimeout(() => {
      const response: LunaMessage = {
        id: `luna-${Date.now()}`,
        type,
        content,
        timestamp: new Date(),
        persona,
        tone: script.tone
      };
      
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
      
      // Parfois proposer escalation
      if (Math.random() > 0.7 && !showEscalation) {
        setTimeout(() => setShowEscalation(true), 2000);
      }
    }, 1500 + Math.random() * 1000); // Timing humain variable
  };

  // Gestion réponse utilisateur avec IA
  const handleUserResponse = async (response: string) => {
    const userMessage: LunaMessage = {
      id: `user-${Date.now()}`,
      type: 'user', 
      content: response,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    onResponse?.(response);
    
    // Luna génère un miroir empathique via IA
    setIsTyping(true);
    
    try {
      const mirrorResponse = await lunaApi.getLunaMirrorResponse({
        user_response: response,
        persona,
        context: {
          step: currentStep,
          signals: userSignals,
          mood: 'neutre'
        }
      });
      
      setTimeout(() => {
        const aiMirror: LunaMessage = {
          id: `luna-${Date.now()}`,
          type: 'mirror',
          content: mirrorResponse,
          timestamp: new Date(),
          persona,
          tone: script.tone
        };
        
        setMessages(prev => [...prev, aiMirror]);
        setIsTyping(false);
        
        // Parfois proposer escalation
        if (Math.random() > 0.7 && !showEscalation) {
          setTimeout(() => setShowEscalation(true), 2000);
        }
      }, 1000 + Math.random() * 800);
      
    } catch (error) {
      console.error('Erreur Luna mirror:', error);
      // Fallback sur réponses pré-définies
      const mirrors = [
        "Merci 🙏 J'entends ce que tu me dis. Continue !",
        "Intéressant ! Je note ça pour tes pistes ✨",
        "Ok, ça m'aide à mieux te cerner 🎯"
      ];
      
      setTimeout(() => {
        const fallbackMirror = mirrors[Math.floor(Math.random() * mirrors.length)];
        addLunaResponse(fallbackMirror, 'mirror');
      }, 800);
    }
  };

  return (
    <div className={cn(
      "bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-100",
      className
    )}>
      {/* Header Luna */}
      <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-purple-200">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-xl">🌙</span>
        </div>
        <div>
          <h3 className="font-semibold text-purple-900">Luna</h3>
          <p className="text-sm text-purple-600">Ton guide carrière personnel</p>
        </div>
        <div className="ml-auto">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
        </div>
      </div>

      {/* Messages conversation */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start space-x-3",
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            )}
          >
            {message.type !== 'user' && (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                {message.type === 'mirror' ? (
                  <Heart className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-sm">🌙</span>
                )}
              </div>
            )}
            
            <div className={cn(
              "max-w-sm p-3 rounded-lg shadow-sm",
              message.type === 'user' 
                ? "bg-white border border-gray-200 text-gray-800" 
                : message.type === 'mirror'
                ? "bg-gradient-to-r from-pink-100 to-purple-100 text-purple-800 border border-pink-200"
                : "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200"
            )}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              <span className="text-xs text-gray-500 mt-1 block">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {message.type === 'user' && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">👤</span>
              </div>
            )}
          </div>
        ))}
        
        {/* Animation typing Luna */}
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-sm">🌙</span>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-3 rounded-lg border border-purple-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone escalation optionnelle */}
      {showEscalation && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center space-x-2">
            <ArrowRight className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-800 font-medium">
              Envie d'aller plus loin ? 
            </span>
          </div>
          <p className="text-xs text-orange-700 mt-1">
            {script.escalation}
          </p>
          <button
            onClick={() => onEscalation?.('court')}
            className="text-xs text-orange-600 hover:text-orange-800 font-semibold mt-2 hover:underline"
          >
            Oui, on creuse ! 🚀
          </button>
        </div>
      )}

      {/* Footer discret */}
      <div className="mt-4 text-center">
        <p className="text-xs text-purple-500">
          Tu peux passer à tout moment ✅ • Tes réponses t'appartiennent 🌙
        </p>
      </div>
    </div>
  );
};

export default LunaChat;