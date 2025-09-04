import { useState } from 'react';
import { sendChatMessage } from '../services/api';

interface Message {
  sender: 'user' | 'luna';
  text: string;
}

interface Props {
  onAuthRequest?: () => void;
}

export default function LunaFloatingWidget({ onAuthRequest }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'luna', text: '🌙 Salut ! Je suis Luna, ton copilote IA. Comment puis-je t\'aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        user_id: 'user-123', // This will be dynamic with auth
        message: input,
        persona: 'jeune_diplome'
      });
      const lunaMessage: Message = { sender: 'luna', text: response.luna_response };
      setMessages(prev => [...prev, lunaMessage]);
    } catch (error) {
      const errorMessage: Message = { 
        sender: 'luna', 
        text: '😅 Oops ! Petit souci technique. Peux-tu réessayer ?' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-lg">🌙</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Luna</h3>
                <p className="text-xs opacity-90">Copilote IA</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-md' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Écris ton message..."
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Welcome Tooltip */}
        {showWelcomeTooltip && !isOpen && (
          <div className="absolute bottom-20 right-0 bg-white rounded-xl shadow-2xl p-4 w-64 border border-indigo-100 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🌙</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 mb-1">Salut ! Je suis Luna ✨</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ton copilote IA pour la transformation professionnelle. Clique pour commencer !
                </p>
              </div>
              <button 
                onClick={() => setShowWelcomeTooltip(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-indigo-100 transform rotate-45"></div>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => {
              setShowWelcomeTooltip(false);
              if (onAuthRequest && !isOpen) {
                onAuthRequest();
              } else {
                setIsOpen(!isOpen);
              }
            }}
            onMouseEnter={() => setTimeout(() => setShowWelcomeTooltip(false), 3000)}
            className="group relative w-20 h-20 bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center overflow-hidden"
          >
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 animate-spin-slow"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
            
            {/* Icon */}
            <div className="relative z-10">
              {isOpen ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-2xl animate-bounce">🌙</span>
                </div>
              )}
            </div>
          </button>

          {/* Active Notification Dot */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>

          {/* Pulse Ring Animation */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-20"></div>
        </div>
      </div>
    </>
  );
}