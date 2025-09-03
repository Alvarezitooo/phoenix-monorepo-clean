import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import HomePage from "./components/HomePage";
import AubePage from "./pages/AubePage";
import LoginPage from "./pages/LoginPage";
import CVPage from "./pages/CVPage";
import LettersPage from "./pages/LettersPage";
import LunaFloatingWidget from "./components/LunaFloatingWidget";
import LunaEnergyBar from "./components/LunaEnergyBar";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
          <LunaFloatingWidget />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
