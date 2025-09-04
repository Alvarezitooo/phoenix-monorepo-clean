import { useState } from 'react';

interface Props {
  onAuthRequest?: () => void;
  enableChat?: boolean; // Pour les services pages
}

export default function LunaFloatingWidget({ onAuthRequest, enableChat = false }: Props) {
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);

  const handleWidgetClick = () => {
    console.log('🌙 Luna widget clicked!', { onAuthRequest, enableChat });
    setShowWelcomeTooltip(false);
    
    if (onAuthRequest) {
      // Homepage: ouvre auth chat
      console.log('🚀 Opening auth chat');
      onAuthRequest();
    } else if (enableChat) {
      // Services: active le chat Luna (TODO)
      console.log('💬 Chat mode not implemented yet');
    }
  };

  return (
    <>
      {/* Enhanced Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Welcome Tooltip */}
        {showWelcomeTooltip && (
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
            onClick={handleWidgetClick}
            onMouseEnter={() => setTimeout(() => setShowWelcomeTooltip(false), 3000)}
            className="group relative w-20 h-20 bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center overflow-hidden"
          >
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 animate-spin-slow"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
            
            {/* Icon */}
            <div className="relative z-10">
              <div className="flex flex-col items-center justify-center">
                <span className="text-2xl animate-bounce">🌙</span>
              </div>
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