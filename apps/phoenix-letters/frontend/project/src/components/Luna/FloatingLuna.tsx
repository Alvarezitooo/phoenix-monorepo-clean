import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, X, Send, Trash2, Zap } from 'lucide-react';
import { useLuna } from './LunaProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Floating Luna Component - Adapted for Phoenix Letters design system
export function FloatingLuna() {
  const { 
    isModalOpen, 
    openModal, 
    closeModal, 
    conversationHistory, 
    addMessage,
    clearHistory,
    currentEnergy 
  } = useLuna();
  
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const messageContent = inputMessage;
    setInputMessage(''); // Clear input immediately for better UX
    
    // Add user message (Luna will respond automatically via addMessage)
    await addMessage({
      content: messageContent,
      sender: 'user',
      type: 'text'
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={openModal}
              className="w-16 h-16 rounded-full bg-luna-gradient hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-white/20"
              size="lg"
            >
              <Moon className="w-8 h-8 text-white" />
            </Button>
            
            {/* Energy indicator */}
            <div className="absolute -top-2 -left-2 bg-phoenix-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
              <Zap className="w-3 h-3 inline mr-1" />
              {currentEnergy}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-luna-gradient p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Luna Assistant</h3>
                  <p className="text-sm opacity-90">Phoenix Letters IA</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {conversationHistory.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-phoenix-500 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-phoenix-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Posez votre question à Luna..."
                  className="flex-1 focus:ring-luna-500 focus:border-luna-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-phoenix-500 hover:bg-phoenix-600 text-white px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Energy Status */}
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Zap className="w-3 h-3 mr-1 text-phoenix-500" />
                <span>Énergie Luna: {currentEnergy}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}