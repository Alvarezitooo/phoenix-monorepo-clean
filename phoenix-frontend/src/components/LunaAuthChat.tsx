import { useState, useEffect, useRef } from 'react';
import { Moon, Send } from 'lucide-react';
import { registerUser, loginUser } from '../services/api';

interface AuthMessage {
  id: string;
  type: 'luna' | 'user';
  content: string;
  timestamp: Date;
}

interface AuthStep {
  step: 'welcome' | 'name' | 'email' | 'password' | 'objective' | 'complete';
  field?: string;
}

const objectives = [
  { id: 'reconversion', label: 'Reconversion professionnelle', icon: '🔄' },
  { id: 'newjob', label: 'Trouver un nouveau job', icon: '🎯' },
  { id: 'optimizecv', label: 'Optimiser mon CV', icon: '📄' },
  { id: 'other', label: 'Autre objectif', icon: '✨' }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export default function LunaAuthChat({ isOpen, onClose, onAuthSuccess }: Props) {
  const [messages, setMessages] = useState<AuthMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<AuthStep>({ step: 'welcome' });
  const [userInput, setUserInput] = useState('');
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    password: '',
    objective: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addLunaMessage("Salut ! Je suis Luna, ton guide IA 🌙\n\nPour mieux t'accompagner dans ta transformation, j'aimerais te connaître un peu...\n\nComment tu t'appelles ?", 1000);
      setCurrentStep({ step: 'name', field: 'name' });
    }
  }, [isOpen]);

  const addLunaMessage = (content: string, delay = 0) => {
    setTimeout(() => {
      const message: AuthMessage = {
        id: Date.now().toString(),
        type: 'luna',
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    }, delay);
  };

  const addUserMessage = (content: string) => {
    const message: AuthMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleNextStep = async () => {
    if (!userInput.trim() && currentStep.step !== 'objective') return;

    addUserMessage(userInput);
    const newProfile = { ...userProfile, [currentStep.field!]: userInput };
    setUserProfile(newProfile);
    setUserInput('');
    setIsLoading(true);

    switch (currentStep.step) {
      case 'name':
        setTimeout(() => {
          addLunaMessage(`Ravi de te rencontrer, ${userInput} ! ✨\n\nTon email pour qu'on reste en contact ?\n\n(Je te promets, pas de spam 😊)`);
          setCurrentStep({ step: 'email', field: 'email' });
          setIsLoading(false);
        }, 1500);
        break;

      case 'email':
        setTimeout(() => {
          addLunaMessage(`Parfait ! 📧\n\nMaintenant, ton mot de passe pour accéder à tes outils Phoenix ?\n\n🔒 Tes données sont 100% sécurisées`);
          setCurrentStep({ step: 'password', field: 'password' });
          setIsLoading(false);
        }, 1500);
        break;

      case 'password':
        setTimeout(() => {
          addLunaMessage(`Top ! 🛡️\n\nUne dernière chose, ${newProfile.name} - quel est ton objectif principal ?\n\nÇa m'aidera à te proposer les meilleurs outils !`);
          setCurrentStep({ step: 'objective' });
          setIsLoading(false);
        }, 1500);
        break;

      case 'objective':
        // Handle objective selection in separate function
        setIsLoading(false);
        break;
    }
  };

  const handleObjectiveSelect = async (objective: string) => {
    const finalProfile = { ...userProfile, objective };
    setUserProfile(finalProfile);
    addUserMessage(objectives.find(o => o.id === objective)?.label || objective);
    setIsLoading(true);

    try {
      // Here you would typically register the user
      // For now, simulate registration success
      setTimeout(async () => {
        addLunaMessage(`Excellent choix, ${finalProfile.name} ! 🎉\n\nBienvenue dans Phoenix ! Je vais maintenant te connecter à ton espace personnel...\n\n✨ Prépare-toi à découvrir tes outils de transformation !`);
        
        setTimeout(async () => {
          try {
            // First, try to login (for existing users like admin)
            console.log('🔐 Trying to login existing user:', finalProfile.email);
            let loginResult;
            
            try {
              loginResult = await loginUser(finalProfile.email, finalProfile.password);
              console.log('✅ Existing user logged in successfully:', loginResult);
            } catch (loginError: any) {
              console.log('⚠️ Login failed, trying registration for new user');
              
              // If login fails, try to register (for new users)
              console.log('🚀 Registering new user:', finalProfile);
              await registerUser(finalProfile.name, finalProfile.email, finalProfile.password, objective);
              console.log('✅ New user registered successfully');
              
              // Then login the newly registered user
              console.log('🔐 Logging in newly registered user');
              loginResult = await loginUser(finalProfile.email, finalProfile.password);
              console.log('✅ New user logged in successfully:', loginResult);
            }
            
            onAuthSuccess(loginResult);
            setCurrentStep({ step: 'complete' });
          } catch (error: any) {
            console.error('❌ Auth error:', error);
            const errorMessage = error.message || "Un petit souci technique lors de la connexion";
            addLunaMessage(`Oops ! ${errorMessage}. Tout va bien, on va réessayer !`);
          }
          setIsLoading(false);
        }, 2000);
      }, 1500);
    } catch (error) {
      addLunaMessage("Oups ! Un petit problème. Réessayons...");
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden">
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center py-3">
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Luna</h3>
                <p className="text-sm text-gray-500">Ton guide IA</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Objective Buttons */}
            {currentStep.step === 'objective' && !isLoading && (
              <div className="grid grid-cols-1 gap-3 mt-4">
                {objectives.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => handleObjectiveSelect(obj.id)}
                    className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors border border-gray-200 hover:border-indigo-300"
                  >
                    <span className="text-2xl">{obj.icon}</span>
                    <span className="font-medium text-gray-800">{obj.label}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          {(currentStep.step === 'name' || currentStep.step === 'email' || currentStep.step === 'password') && (
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex space-x-3">
                <input
                  type={currentStep.step === 'password' ? 'password' : currentStep.step === 'email' ? 'email' : 'text'}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNextStep()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={
                    currentStep.step === 'name' ? 'Ton prénom...' :
                    currentStep.step === 'email' ? 'ton@email.com' : 
                    'Mot de passe sécurisé'
                  }
                  disabled={isLoading}
                />
                <button
                  onClick={handleNextStep}
                  disabled={!userInput.trim() || isLoading}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full p-3 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Desktop: Centered Modal */}
      <div className="hidden md:block fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-[480px] max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Moon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Luna</h3>
                <p className="text-sm text-gray-500">Ton guide IA bienveillant</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ✕
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Objective Buttons */}
            {currentStep.step === 'objective' && !isLoading && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {objectives.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => handleObjectiveSelect(obj.id)}
                    className="flex flex-col items-center space-y-2 p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-indigo-300 hover:shadow-md"
                  >
                    <span className="text-2xl">{obj.icon}</span>
                    <span className="font-medium text-gray-800 text-sm text-center">{obj.label}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          {(currentStep.step === 'name' || currentStep.step === 'email' || currentStep.step === 'password') && (
            <div className="p-6 border-t border-gray-100">
              <div className="flex space-x-3">
                <input
                  type={currentStep.step === 'password' ? 'password' : currentStep.step === 'email' ? 'email' : 'text'}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNextStep()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder={
                    currentStep.step === 'name' ? 'Ton prénom...' :
                    currentStep.step === 'email' ? 'ton@email.com' : 
                    'Mot de passe sécurisé'
                  }
                  disabled={isLoading}
                />
                <button
                  onClick={handleNextStep}
                  disabled={!userInput.trim() || isLoading}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full p-3 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </>
  );
}