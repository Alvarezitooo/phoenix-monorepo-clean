import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import AubePage from "./pages/AubePage";
import LoginPage from "./pages/LoginPage";
import CVPage from "./pages/CVPage";
import LettersPage from "./pages/LettersPage"; // Import the new Letters page

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
          <header className="p-4 w-full">
            <nav className="flex justify-center gap-6 text-lg">
              <Link to="/" className="hover:text-blue-400">Home</Link>
              <Link to="/aube" className="text-purple-300 hover:text-purple-200 font-bold">Aube</Link>
              <Link to="/cv" className="text-green-300 hover:text-green-200 font-bold">CV</Link>
              <Link to="/letters" className="text-blue-300 hover:text-blue-200 font-bold">Letters</Link>
              <Link to="/login" className="hover:text-blue-400">Login</Link>
            </nav>
          </header>
          <main className="flex-grow p-8 w-full flex justify-center">
            <Routes>
              <Route path="/" element={<h1>Welcome to the new Phoenix Frontend!</h1>} />
              <Route path="/aube" element={<AubePage />} />
              <Route path="/cv" element={<CVPage />} />
              <Route path="/letters" element={<LettersPage />} /> {/* Use the new component */}
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
