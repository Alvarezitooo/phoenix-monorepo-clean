import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/pages/Dashboard';
import { Generate } from '@/pages/Generate';
import { useStore } from '@/store/useStore';
import { LunaProvider, FloatingLuna } from '@/components/Luna';

const queryClient = new QueryClient();

function App() {
  const { user, setUser } = useStore();

  useEffect(() => {
    // Initialize demo user for development
    if (!user) {
      setUser({
        id: 'demo-user',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        subscription: 'free',
        createdAt: new Date(),
      });
    }
  }, [user, setUser]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Phoenix Letters...</p>
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
                  <Route path="/generate" element={<Generate />} />
                  <Route path="/letters" element={<div className="p-6">Letters page coming soon...</div>} />
                  <Route path="/letters/:id" element={<div className="p-6">Letter detail coming soon...</div>} />
                  <Route path="/analytics" element={<div className="p-6">Analytics page coming soon...</div>} />
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