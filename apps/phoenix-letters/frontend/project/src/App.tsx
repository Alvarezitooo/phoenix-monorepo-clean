import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/pages/Dashboard';
import { Generate } from '@/pages/Generate';
import { Journal } from '@/pages/Journal';
import { useStore } from '@/store/useStore';
import { LunaProvider, FloatingLuna } from '@/components/Luna';
import { authService, User as AuthUser } from '@/services/authService';

const queryClient = new QueryClient();

function App() {
  const { user, setUser } = useStore();

  useEffect(() => {
    // Initialize authentication
    const initAuth = async () => {
      // Check for token from Phoenix Website or URL
      authService.initializeFromToken();
      
      if (authService.isAuthenticated()) {
        try {
          const authUser = await authService.getCurrentUser();
          // Convert auth user to app user format
          setUser({
            id: authUser.id,
            name: authUser.name || authUser.email.split('@')[0],
            email: authUser.email,
            subscription: authUser.is_unlimited ? 'premium' : 'free',
            createdAt: new Date(),
          });
        } catch (error) {
          console.error('Auth failed:', error);
          // Redirect to login if authentication fails
          authService.redirectToLogin();
        }
      } else {
        // Not authenticated, redirect to login
        authService.redirectToLogin();
      }
    };
    
    initAuth();
  }, [setUser]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Luna Hub...</p>
          <p className="text-gray-500 text-sm mt-2">Authenticating with Phoenix ecosystem</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LunaProvider initialEnergy={85}>
        <Router>
          <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/generate" element={<Generate />} />
                  <Route path="/letters" element={
                    <div className="p-6">
                      <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                          <div className="text-6xl mb-4">📝</div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Letters Library</h2>
                          <p className="text-gray-600 mb-6">All your generated letters will appear here. Start by creating your first letter!</p>
                          <button 
                            onClick={() => window.location.href = '/generate'}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Create First Letter
                          </button>
                        </div>
                      </div>
                    </div>
                  } />
                  <Route path="/letters/:id" element={
                    <div className="p-6">
                      <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                          <div className="text-6xl mb-4">🔍</div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-4">Letter Details</h2>
                          <p className="text-gray-600 mb-6">Letter viewing and editing features are being developed. For now, you can view your letters in the dashboard.</p>
                          <button 
                            onClick={() => window.location.href = '/dashboard'}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Back to Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                  } />
                  <Route path="/analytics" element={
                    <div className="p-6">
                      <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                          <div className="text-6xl mb-4">📊</div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>
                          <p className="text-gray-600 mb-6">Advanced analytics and insights are coming soon. Your basic stats are available on the dashboard.</p>
                          <button 
                            onClick={() => window.location.href = '/dashboard'}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            View Dashboard Stats
                          </button>
                        </div>
                      </div>
                    </div>
                  } />
                </Routes>
              </main>
            </div>
            
            {/* Luna Floating Assistant */}
            <FloatingLuna />
          </div>
        </Router>
      </LunaProvider>
    </QueryClientProvider>
  );
}

export default App;