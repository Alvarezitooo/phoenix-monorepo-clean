import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { lunaCVAPI, EnergyCheckResponse, LunaMessage } from '../../services/lunaAPI';
import { AuthService } from '../../services/authService';

// Use harmonized Message type from lunaAPI
type Message = LunaMessage;

interface LunaContextType {
  // Modal State
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  
  // Energy Management (harmonized with Letters)
  currentEnergy: number;
  maxEnergy: number;
  updateEnergy: (amount: number, action?: 'consume' | 'refund' | 'purchase') => Promise<EnergyCheckResponse | null>;
  
  // Conversation
  conversationHistory: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  clearHistory: () => void;
  
  // Context-aware features (CV specific)
  currentContext: 'dashboard' | 'mirror-match' | 'optimizer' | 'salary' | 'linkedin';
  setContext: (context: LunaContextType['currentContext']) => void;
  
  // CV specific
  currentCVId?: string;
  setCurrentCVId: (cvId: string) => void;
}

const LunaContext = createContext<LunaContextType | undefined>(undefined);

export function useLuna() {
  const context = useContext(LunaContext);
  if (context === undefined) {
    throw new Error('useLuna must be used within a LunaProvider');
  }
  return context;
}

interface LunaProviderProps {
  children: ReactNode;
  initialEnergy?: number;
}

// Luna Provider Component - Harmonized with Phoenix Letters architecture
export function LunaProvider({ children, initialEnergy = 90 }: LunaProviderProps) {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Energy state (connected to backend)
  const [currentEnergy, setCurrentEnergy] = useState(initialEnergy);
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(false);
  const maxEnergy = 100;
  
  // Conversation state
  const [conversationHistory, setConversationHistory] = useState<Message[]>([
    {
      id: 'welcome',
      content: '🌙 Bonjour ! Je suis Luna, votre assistante IA pour Phoenix CV. Je peux vous aider avec l\'analyse Mirror Match, l\'optimisation CV, l\'analyse salariale et plus ! Comment puis-je vous aider ?',
      sender: 'luna',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  
  // Context awareness for Phoenix CV pages
  const [currentContext, setCurrentContext] = useState<LunaContextType['currentContext']>('dashboard');
  
  // CV specific state
  const [currentCVId, setCurrentCVId] = useState<string>();

  // 🔐 Récupérer user_id depuis AuthService
  const getUserId = (): string | null => {
    const userData = AuthService.getUserData();
    return userData?.user_id || null;
  };
  
  const userId = getUserId();

  // Load energy on mount
  useEffect(() => {
    if (userId) {
      loadEnergyFromBackend();
    }
  }, [userId]);

  const loadEnergyFromBackend = async () => {
    if (!userId) return;
    
    setIsLoadingEnergy(true);
    try {
      const energyData = await lunaCVAPI.checkEnergy(userId);
      setCurrentEnergy(energyData.currentEnergy);
    } catch (error) {
      console.error('Failed to load energy:', error);
    } finally {
      setIsLoadingEnergy(false);
    }
  };

  // Modal handlers
  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Energy management with backend integration
  const updateEnergy = useCallback(async (amount: number, action: 'consume' | 'refund' | 'purchase' = 'consume') => {
    if (!userId) {
      console.error('No authenticated user for energy update');
      return null;
    }
    
    try {
      const result = await lunaCVAPI.updateEnergy({
        userId,
        action,
        amount: Math.abs(amount),
        reason: `Luna CV ${action} - ${currentContext}`
      });
      setCurrentEnergy(result.currentEnergy);
      return result;
    } catch (error) {
      console.error('Failed to update energy:', error);
      // Fallback to local update
      setCurrentEnergy(prev => Math.max(0, Math.min(maxEnergy, prev + (action === 'consume' ? -amount : amount))));
      return null;
    }
  }, [maxEnergy, currentContext, userId]);

  // Message management with backend integration
  const addMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setConversationHistory(prev => [...prev, newMessage]);

    // If it's a user message, get Luna's response from backend
    if (message.sender === 'user' && userId) {
      try {
        // Check energy before making API call
        const energyRequired = getEnergyRequiredForContext(currentContext);
        const canPerform = await lunaCVAPI.canPerformAction(userId, energyRequired);
        
        if (!canPerform) {
          const energyWarning: Message = {
            id: `msg-${Date.now()}-energy-warning`,
            content: `⚡ Énergie insuffisante ! Vous avez besoin de ${energyRequired}% d'énergie Luna pour utiliser cette fonctionnalité. Rechargez votre énergie pour continuer.`,
            sender: 'luna',
            timestamp: new Date(),
            type: 'energy-notification'
          };
          setConversationHistory(prev => [...prev, energyWarning]);
          return;
        }

        // Get Luna response from backend
        const lunaResponse = await lunaCVAPI.sendMessage({
          message: message.content,
          context: currentContext,
          userId,
          cvId: currentCVId
        });

        // Add Luna's response
        const lunaMessage: Message = {
          id: `msg-${Date.now()}-luna`,
          content: lunaResponse.message,
          sender: 'luna',
          timestamp: new Date(),
          type: lunaResponse.type || 'text'
        };
        
        setConversationHistory(prev => [...prev, lunaMessage]);

        // Update energy if consumed
        if (lunaResponse.energyConsumed && lunaResponse.energyConsumed > 0) {
          await updateEnergy(lunaResponse.energyConsumed, 'consume');
        }

      } catch (error) {
        console.error('Failed to get Luna response:', error);
        
        // Fallback response
        const errorMessage: Message = {
          id: `msg-${Date.now()}-error`,
          content: '🌙 Désolé, j\'ai des difficultés techniques. Pouvez-vous reformuler votre question ?',
          sender: 'luna',
          timestamp: new Date(),
          type: 'system'
        };
        
        setConversationHistory(prev => [...prev, errorMessage]);
      }
    }
  }, [currentContext, userId, currentCVId, updateEnergy]);

  // Simplified sendMessage wrapper
  const sendMessage = useCallback(async (messageText: string) => {
    await addMessage({
      content: messageText,
      sender: 'user',
      type: 'text'
    });
  }, [addMessage]);

  const clearHistory = useCallback(() => {
    setConversationHistory([{
      id: 'welcome-reset',
      content: '🌙 Conversation effacée ! Je suis toujours là pour vous aider avec votre CV. Que souhaitez-vous faire ?',
      sender: 'luna',
      timestamp: new Date(),
      type: 'text'
    }]);
  }, []);

  // Helper function to get energy requirements by context
  const getEnergyRequiredForContext = (context: string): number => {
    const requirements = {
      'mirror-match': 25,
      'optimizer': 20,
      'salary': 15,
      'linkedin': 10,
      'dashboard': 5
    };
    return requirements[context as keyof typeof requirements] || 8;
  };

  // Context value
  const contextValue: LunaContextType = {
    // Modal
    isModalOpen,
    openModal,
    closeModal,
    
    // Energy
    currentEnergy,
    maxEnergy,
    updateEnergy,
    
    // Conversation
    conversationHistory,
    addMessage,
    sendMessage,
    clearHistory,
    
    // Context
    currentContext,
    setContext: setCurrentContext,
    
    // CV specific
    currentCVId,
    setCurrentCVId
  };

  return (
    <LunaContext.Provider value={contextValue}>
      {children}
    </LunaContext.Provider>
  );
}