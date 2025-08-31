import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, MessageCircle, X, Send } from 'lucide-react';
import { useLuna } from './LunaProvider';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function FloatingLuna() {
  const { 
    isModalOpen, 
    openModal, 
    closeModal, 
    sendMessage, 
    conversationHistory,
    currentEnergy,
    maxEnergy,
    currentContext,
    setContext
  } = useLuna();
  const [inputMessage, setInputMessage] = useState('');
  const focusTrapRef = useFocusTrap(isModalOpen);

  // Auto-detect context from current page
  useEffect(() => {
    const detectContextFromURL = () => {
      const path = window.location.pathname;
      
      if (path.includes('mirror-match')) {
        setContext('mirror-match');
      } else if (path.includes('optimizer') || path.includes('optimize')) {
        setContext('optimizer');
      } else if (path.includes('salary') || path.includes('salaire')) {
        setContext('salary');
      } else if (path.includes('linkedin')) {
        setContext('linkedin');
      } else {
        setContext('dashboard');
      }
    };

    detectContextFromURL();
  }, [setContext]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Gestion de l'événement de fermeture par Escape
  useEffect(() => {
    const handleCloseFocusTrap = () => {
      closeModal();
    };

    if (focusTrapRef.current) {
      focusTrapRef.current.addEventListener('closeFocusTrap', handleCloseFocusTrap);
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.removeEventListener('closeFocusTrap', handleCloseFocusTrap);
      }
    };
  }, [closeModal, focusTrapRef]);

  return (
    <>
      {/* Floating Luna Button */}
      <AnimatePresence>
        {!isModalOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={openModal}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center group"
          >
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 animate-ping opacity-20"></div>
            
            {/* Main icon */}
            <Moon className="w-8 h-8 text-white relative z-10" />
            
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">!</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            ref={focusTrapRef}
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="luna-modal-title"
            aria-describedby="luna-modal-description"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 id="luna-modal-title" className="font-semibold">Luna Assistant</h3>
                    <div className="flex flex-col">
                      <p className="text-sm opacity-90">Votre IA personnelle pour Phoenix CV</p>
                      <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full self-start mt-1">
                        {currentContext === 'mirror-match' ? '🎯 Mirror Match' :
                         currentContext === 'optimizer' ? '🔧 Optimizer' :
                         currentContext === 'salary' ? '💰 Salaire' :
                         currentContext === 'linkedin' ? '🔗 LinkedIn' :
                         '🏠 Dashboard'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Energy Display */}
                  <div className="text-right">
                    <div className="text-xs opacity-75 mb-1">Énergie Luna</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-white/20 rounded-full h-2">
                        <div 
                          className="h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                          style={{ width: `${(currentEnergy / maxEnergy) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{currentEnergy}%</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Fermer Luna Assistant"
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-80 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {conversationHistory.map((message) => (
                  <div key={message.id} className={`flex items-start space-x-3 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {message.sender === 'luna' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Moon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">U</span>
                      </div>
                    )}
                    <div className={`rounded-2xl p-3 shadow-sm max-w-xs ${
                      message.sender === 'luna' 
                        ? 'bg-white text-gray-800 rounded-tl-sm' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-sm'
                    }`}>
                      <p className="text-sm">
                        {message.content}
                      </p>
                      {message.type === 'energy-notification' && (
                        <div className="mt-2 text-xs opacity-75">
                          ⚡ Notification d'énergie
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Energy Warning */}
              {currentEnergy < 20 && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600 text-sm">⚡</span>
                    <p className="text-yellow-800 text-xs">
                      Énergie Luna faible ({currentEnergy}%). Certaines fonctionnalités avancées peuvent être limitées.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={currentEnergy < 10 ? "Énergie insuffisante..." : "Tapez votre message..."}
                  disabled={currentEnergy < 10}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || currentEnergy < 10}
                  className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Envoyer le message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}