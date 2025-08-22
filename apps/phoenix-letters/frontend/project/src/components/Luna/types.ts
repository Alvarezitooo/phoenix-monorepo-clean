// Luna Types - Adapted for Phoenix Letters ecosystem

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'luna';
  timestamp: Date;
  type?: 'text' | 'energy-notification' | 'system';
}

export interface LunaContextType {
  // Modal State
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  
  // Energy Management (for future Luna integration)
  currentEnergy: number;
  maxEnergy: number;
  updateEnergy: (amount: number) => void;
  
  // Conversation
  conversationHistory: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  // Context-aware features
  currentContext: 'dashboard' | 'generate' | 'letters' | 'analytics';
  setContext: (context: LunaContextType['currentContext']) => void;
}