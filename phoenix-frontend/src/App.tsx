import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { LunaProvider, useLuna } from "./context/LunaContext";
import HomePage from "./components/HomePage";
import AubePage from "./pages/AubePage";
import LoginPage from "./pages/LoginPage";
import CVPage from "./pages/CVPage";
import LettersPage from "./pages/LettersPage";
import LunaFloatingWidget from "./components/LunaFloatingWidget";
import LunaEnergyBar from "./components/LunaEnergyBar";
import LunaAuthChat from "./components/LunaAuthChat";
import LunaSidebar from "./components/LunaSidebar";

function AppContent() {
  const luna = useLuna();
  
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/aube" element={<AubePage />} />
        <Route path="/cv" element={<CVPage />} />
        <Route path="/letters" element={<LettersPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      
      {/* 🌙 Luna Components - Global */}
      <LunaEnergyBar />
      <LunaFloatingWidget onAuthRequest={luna.openAuthChat} />
      
      {/* Luna Auth Chat */}
      <LunaAuthChat
        isOpen={luna.showAuthChat}
        onClose={luna.closeAuthChat}
        onAuthSuccess={luna.setUser}
      />
      
      {/* Luna Sidebar */}
      <LunaSidebar
        isOpen={luna.showSidebar}
        onClose={luna.closeSidebar}
        userProfile={luna.authenticatedUser ? {
          name: luna.authenticatedUser.name || 'Phoenix User',
          energy: luna.lunaEnergy,
          objective: luna.authenticatedUser.objective || 'transformation'
        } : undefined}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LunaProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LunaProvider>
    </AuthProvider>
  )
}

export default App
