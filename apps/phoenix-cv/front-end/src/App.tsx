import React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LunaProvider, FloatingLuna } from './components/Luna';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CVBuilder } from './components/CVBuilder';
import { MirrorMatch } from './components/MirrorMatch';
import { TemplateGallery } from './components/TemplateGallery';
import { Analytics } from './components/Analytics';
import { ParticleBackground } from './components/ParticleBackground';
import { MultiFormatPreview } from './components/MultiFormatPreview';
import { SalarySuggestions } from './components/SalarySuggestions';
import { LinkedInIntegration } from './components/LinkedInIntegration';
import JournalPage from './components/journal/JournalPage';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LunaProvider initialEnergy={85}>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white overflow-x-hidden">
            <ParticleBackground />
            <Header />
            <FloatingLuna />
            <main className="relative z-10">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/builder" element={<CVBuilder />} />
                <Route path="/mirror-match" element={<MirrorMatch />} />
                <Route path="/templates" element={<TemplateGallery />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/preview" element={<MultiFormatPreview />} />
                <Route path="/salary" element={<SalarySuggestions />} />
                <Route path="/linkedin" element={<LinkedInIntegration />} />
                <Route path="/journal" element={<JournalPage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </LunaProvider>
    </QueryClientProvider>
  );
}

export default App;