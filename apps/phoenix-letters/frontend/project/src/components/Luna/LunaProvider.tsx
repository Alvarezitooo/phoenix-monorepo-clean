import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { LunaContextType, Message } from './types';
import { lunaAPI, EnergyCheckResponse } from '@/services/lunaAPI';

// Context creation
const LunaContext = createContext<LunaContextType | undefined>(undefined);

// Provider props
interface LunaProviderProps {
  children: ReactNode;
  initialEnergy?: number;
  maxEnergy?: number;
}

// Luna Provider Component - Connected to Phoenix Letters Backend
export function LunaProvider({ 
  children, 
  initialEnergy = 85, 
  maxEnergy = 100 
}: LunaProviderProps) {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Energy state (connected to backend)
  const [currentEnergy, setCurrentEnergy] = useState(initialEnergy);
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(false);
  
  // Conversation state
  const [conversationHistory, setConversationHistory] = useState<Message[]>([
    {
      id: 'welcome',
      content: '🌙 Salut ! Je suis Luna, votre assistante IA pour Phoenix Letters. Comment puis-je vous aider avec vos lettres de motivation ?',
      sender: 'luna',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  
  // Context awareness for Phoenix Letters pages
  const [currentContext, setCurrentContext] = useState<LunaContextType['currentContext']>('dashboard');

  // User ID (in real app, this would come from auth)
  const userId = 'demo-user';

  // Load energy on mount
  useEffect(() => {
    loadEnergyFromBackend();
  }, []);

  const loadEnergyFromBackend = async () => {
    setIsLoadingEnergy(true);
    try {
      const energyData = await lunaAPI.checkEnergy(userId);
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
    try {
      const result = await lunaAPI.updateEnergy({
        userId,
        action,
        amount: Math.abs(amount),
        reason: `Luna ${action} - ${currentContext}`
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
    if (message.sender === 'user') {
      try {
        // Check energy before making API call
        const canPerform = await lunaAPI.canPerformAction(userId, 5);
        if (!canPerform) {
          const energyWarning: Message = {
            id: `msg-${Date.now()}-energy-warning`,
            content: '⚡ Énergie insuffisante ! Vous devez recharger votre énergie Luna pour continuer à utiliser l\'assistant.',
            sender: 'luna',
            timestamp: new Date(),
            type: 'energy-notification'
          };
          setConversationHistory(prev => [...prev, energyWarning]);
          return;
        }

        // Get Luna response from backend
        const lunaResponse = await lunaAPI.sendMessage({
          message: message.content,
          context: currentContext,
          userId,
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
          content: '🌙 Désolé, j\'ai des difficultés techniques. Pouvez-vous reformuler ?',
          sender: 'luna',
          timestamp: new Date(),
          type: 'system'
        };
        
        setConversationHistory(prev => [...prev, errorMessage]);
      }
    }
  }, [currentContext, userId, updateEnergy]);

  const clearHistory = useCallback(() => {
    setConversationHistory([{
      id: 'welcome-reset',
      content: '🌙 Conversation effacée ! Comment puis-je vous aider ?',
      sender: 'luna',
      timestamp: new Date(),
      type: 'text'
    }]);
  }, []);

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
    clearHistory,
    
    // Context
    currentContext,
    setContext: setCurrentContext
  };

  return (
    <LunaContext.Provider value={contextValue}>
      {children}
    </LunaContext.Provider>
  );
}

// Custom hook for using Luna context
export function useLuna(): LunaContextType {
  const context = useContext(LunaContext);
  
  if (context === undefined) {
    throw new Error('useLuna must be used within a LunaProvider');
  }
  
  return context;
}