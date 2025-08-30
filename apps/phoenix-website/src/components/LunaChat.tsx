/**
 * 🌙 Luna Chat - Interface conversationnelle enterprise
 * Chat avec Luna (Gemini AI + personnalité + mémoire utilisateur)
 * Architecture: Frontend pur → Luna Hub → Luna Core → Gemini
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Zap, 
  Sparkles, 
  X,
  Minimize2,
  Maximize2,
  Moon,
  AlertCircle,
  Check
} from 'lucide-react';
import { api, ChatMessage, LunaChatRequest, LunaChatResponse } from '../lib/api';

interface LunaChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  userId?: string;
  userName?: string;
}

type ChatStatus = 'idle' | 'sending' | 'error' | 'no_energy';

export const LunaChat: React.FC<LunaChatProps> = ({
  isOpen,
  onClose,
  onMinimize,
  isMinimized,
  userId,
  userName
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input quand chat s'ouvre
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Message d'accueil Luna
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'luna',
        message: `Salut ${userName ? userName : ''} ! 🌙\n\nJe suis Luna, ton copilote IA chez Phoenix. Je suis là pour t'aider à transformer ton parcours en histoire puissante !\n\n💡 Que puis-je faire pour toi aujourd'hui ?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, userName]);

  // Envoyer message à Luna
  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId || status === 'sending') return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      message: inputMessage.trim(),
      timestamp: new Date()
    };

    // Ajouter message utilisateur
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setStatus('sending');
    setError(null);

    try {
      const request: LunaChatRequest = {
        user_id: userId,
        message: userMessage.message,
        app_context: 'website',
        user_name: userName
      };

      const response = await api.sendLunaMessage(request);

      if (response.success) {
        const lunaMessage: ChatMessage = {
          id: `luna-${Date.now()}`,
          role: 'luna',
          message: response.message,
          timestamp: new Date(),
          energy_cost: response.energy_consumed
        };

        setMessages(prev => [...prev, lunaMessage]);
        
        // Mise à jour énergie si disponible
        if (response.energy_consumed > 0) {
          setEnergyLevel(prev => prev ? prev - response.energy_consumed : null);
        }
      } else {
        throw new Error('Luna n\'a pas pu répondre');
      }

      setStatus('idle');
    } catch (err: any) {
      console.error('Luna Chat Error:', err);
      
      // Gestion erreur énergie insuffisante  
      if (err.message?.includes('insufficient_energy') || err.status === 402) {
        setStatus('no_energy');
        setError('⚡ Énergie insuffisante pour continuer la conversation. Recharge ton compte !');
      } else {
        setStatus('error');
        setError('Désolée, je n\'ai pas pu répondre. Peux-tu réessayer ? 🤔');
      }

      // Message d'erreur dans le chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'luna',
        message: status === 'no_energy' 
          ? '⚡ Oups ! Il te faut plus d\'énergie pour continuer notre conversation. Va recharger ton compte et on reprend ! 🔋'
          : 'Désolée, j\'ai eu un petit bug ! 🤖 Peux-tu réessayer ton message ?',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setStatus('idle');
    }
  };

  // Gestion Enter pour envoyer
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          height: isMinimized ? 60 : 500
        }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 ${
          isMinimized ? 'w-80' : 'w-96'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Luna</h3>
                <p className="text-xs text-blue-100">
                  {status === 'sending' ? 'Luna réfléchit...' : 'Copilote IA Phoenix'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {energyLevel !== null && (
                <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
                  <Zap className="w-3 h-3" />
                  {energyLevel}
                </div>
              )}
              
              <button
                onClick={onMinimize}
                className="p-1 hover:bg-white/20 rounded"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        {!isMinimized && (
          <div className="flex flex-col h-96">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">
                      {message.message}
                    </div>
                    
                    {/* Info message */}
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      
                      {message.energy_cost && message.energy_cost >= 10 && (
                        <div className={`flex items-center gap-1 text-xs ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <Zap className="w-3 h-3" />
                          -{message.energy_cost}⚡
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Indicateur Luna en train de taper */}
              {status === 'sending' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">Luna réfléchit avec Gemini...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200">
              {error && (
                <div className={`mb-3 p-2 rounded-lg text-xs flex items-center gap-2 ${
                  status === 'no_energy' 
                    ? 'bg-orange-50 text-orange-800 border border-orange-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    !userId 
                      ? 'Connecte-toi pour parler avec Luna...'
                      : status === 'no_energy'
                      ? 'Recharge ton énergie pour continuer...'
                      : 'Message à Luna...'
                  }
                  disabled={!userId || status === 'sending' || status === 'no_energy'}
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
                
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || !userId || status === 'sending' || status === 'no_energy'}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[44px]"
                >
                  {status === 'sending' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Actions suggérées */}
              {messages.length <= 1 && status === 'idle' && userId && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Comment optimiser mon CV ?",
                    "Aide-moi avec ma lettre de motivation",
                    "Quels sont mes points forts ?",
                    "Comment me reconvertir ?"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(suggestion)}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default LunaChat;