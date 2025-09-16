import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";
import { Suspense, lazy } from "react";

// import { AuthProvider } from "../context/AuthContext";
import { LunaProvider, useLuna } from "../luna/LunaContext";
import { LoadingSpinner, PageTransition } from "../shared/components";
import { LunaConversationalSidebar } from "../luna";
import { useLocation } from "react-router-dom";

// Lazy loading des pages principales
const HomePage = lazy(() => import("./HomePage"));
const AubePage = lazy(() => import("../modules/aube").then(module => ({ default: module.AubePage })));
const AuthPage = lazy(() => import("../shared/AuthPage"));
const CVPage = lazy(() => import("../modules/cv").then(module => ({ default: module.CVPage })));
const LettersPage = lazy(() => import("../modules/letters").then(module => ({ default: module.LettersPage })));
const RisePage = lazy(() => import("../modules/rise").then(module => ({ default: module.RisePage })));
const EnergyPage = lazy(() => import("../pages/EnergyPage"));
const LunaNarrativeJournal = lazy(() => import("../luna/LunaNarrativeJournal"));

// Composant de loading pour les pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="lg" color="text-blue-500" />
      <p className="mt-4 text-gray-600">Chargement de la page...</p>
    </div>
  </div>
);

function AppContent() {
  const luna = useLuna();
  const location = useLocation();
  
  return (
    <div className="min-h-screen">
      <Suspense fallback={<PageLoader />}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/aube" element={<AubePage />} />
            <Route path="/cv" element={<CVPage />} />
            <Route path="/letters" element={<LettersPage />} />
            <Route path="/rise" element={<RisePage />} />
            <Route path="/energy" element={<EnergyPage />} />
            <Route path="/journal" element={<LunaNarrativeJournal />} />
            <Route path="/auth" element={<AuthPage mode="register" />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
          </Routes>
        </PageTransition>
      </Suspense>
      
      {/* 🌙 Luna Omnisciente - Partout sauf auth */}
      {!location.pathname.includes('/auth') && 
       !location.pathname.includes('/login') && <LunaConversationalSidebar />}
    </div>
  );
}

function App() {
  return (
    <LunaProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </LunaProvider>
  )
}

export default App
