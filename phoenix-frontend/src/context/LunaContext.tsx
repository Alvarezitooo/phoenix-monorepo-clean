import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LunaContextType {
  showAuthChat: boolean;
  showSidebar: boolean;
  authenticatedUser: any;
  lunaEnergy: number;
  openAuthChat: () => void;
  closeAuthChat: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setUser: (user: any) => void;
  updateEnergy: (energy: number) => void;
}

const LunaContext = createContext<LunaContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function LunaProvider({ children }: Props) {
  const [showAuthChat, setShowAuthChat] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const [lunaEnergy, setLunaEnergy] = useState(85);

  const openAuthChat = () => setShowAuthChat(true);
  const closeAuthChat = () => setShowAuthChat(false);
  const openSidebar = () => setShowSidebar(true);
  const closeSidebar = () => setShowSidebar(false);
  
  const setUser = (user: any) => {
    setAuthenticatedUser(user);
    // Set real energy from Luna Hub profile
    if (user.profile?.luna_energy !== undefined) {
      setLunaEnergy(user.profile.luna_energy);
    }
    closeAuthChat();
    openSidebar();
  };
  
  const updateEnergy = (energy: number) => setLunaEnergy(energy);

  return (
    <LunaContext.Provider value={{
      showAuthChat,
      showSidebar,
      authenticatedUser,
      lunaEnergy,
      openAuthChat,
      closeAuthChat,
      openSidebar,
      closeSidebar,
      setUser,
      updateEnergy
    }}>
      {children}
    </LunaContext.Provider>
  );
}

export function useLuna() {
  const context = useContext(LunaContext);
  if (context === undefined) {
    throw new Error('useLuna must be used within a LunaProvider');
  }
  return context;
}