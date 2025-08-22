import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Moon, 
  Zap, 
  User, 
  Minimize2,
  Maximize2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'luna';
  content: string;
  timestamp: Date;
}

interface SuggestedAction {
  id: string;
  label: string;
  action: () => void;
  energyCost?: number;
}

interface LunaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  conversationHistory: Message[];
  suggestedActions: SuggestedAction[];
  currentEnergy?: number;
}

export function LunaModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  conversationHistory, 
  suggestedActions,
  currentEnergy = 100
}: LunaModalProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSubmit(inputMessage);
      setInputMessage('');
    }
  };

  const handleSuggestedAction = (action: SuggestedAction) => {
    if (action.energyCost && currentEnergy < action.energyCost) {
      return;
    }
    action.action();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`bg-gray-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden ${
          isMinimized ? 'w-80 h-16' : 'w-80 h-96'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-purple-500/20 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Moon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Luna Assistant</h3>
              <p className="text-xs text-purple-300">IA contextuelle</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded text-xs">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-white">{currentEnergy}%</span>
            </div>
            
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded hover:bg-white/10 transition-all"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4 text-gray-300" /> : <Minimize2 className="w-4 h-4 text-gray-300" />}
            </button>
            
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-56 overflow-y-auto p-3 space-y-3">
              {conversationHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-orange-500 to-red-600' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600'
                    }`}>
                      {message.type === 'user' ? <User className="w-3 h-3 text-white" /> : <Moon className="w-3 h-3 text-white" />}
                    </div>
                    
                    <div className={`rounded-lg p-2 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                        : 'bg-white/10 text-gray-100 border border-purple-500/20'
                    }`}>
                      <p className="text-xs leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Actions suggérées */}
            {suggestedActions.length > 0 && (
              <div className="px-3 pb-2 border-t border-purple-500/10">
                <p className="text-xs text-purple-300 mb-2 mt-2">Actions suggérées :</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleSuggestedAction(action)}
                      disabled={action.energyCost && currentEnergy < action.energyCost}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 ${
                        action.energyCost && currentEnergy < action.energyCost
                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 text-purple-200 hover:from-purple-600/50 hover:to-blue-600/50'
                      }`}
                    >
                      <span>{action.label}</span>
                      {action.energyCost && (
                        <div className="flex items-center space-x-1">
                          <Zap className="w-2 h-2" />
                          <span>{action.energyCost}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-purple-500/20 bg-white/5">
              <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Posez votre question à Luna..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-xs"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}