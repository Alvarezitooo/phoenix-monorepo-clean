'use client';
import { useState, useEffect } from 'react';
import { HUB } from '../../../config/hub';
import WhyPopover from '@/components/aube/WhyPopover';
import DisclaimerFooter from '@/components/aube/DisclaimerFooter';

export default function AubeStartPage(){
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('loading');

  // Récupérer l'utilisateur authentifié au montage
  useEffect(() => {
    const token = // 🔐 CLEANED: Was localStorage access_token - now uses HTTPOnly cookies;
    if (!token) {
      setStatus('no_auth');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = payload.sub;
      
      if (currentUserId) {
        setUserId(currentUserId);
        setStatus('ready');
      } else {
        setStatus('invalid_token');
      }
    } catch (error) {
      setStatus('invalid_token');
    }
  }, []);
  
  const start = async ()=>{
    if (!userId) {
      setStatus('no_auth');
      return;
    }

    setStatus('loading');
    try {
      const token = // 🔐 CLEANED: Was localStorage access_token - now uses HTTPOnly cookies;
      const response = await fetch(`${HUB}/luna/aube/assessment/start`, {
        method:'POST', 
        headers:{
          'Content-Type':'application/json',
          // 🔐 CLEANED: Auth header - use credentials: 'include' instead
        }, 
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        setStatus('started');
        // Optionnel: redirection vers la page suivante
        // window.location.href = '/aube/exercise';
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Erreur démarrage Aube:', error);
      setStatus('error');
    }
  };
  
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">On commence léger 🌙</h1>
        <WhyPopover />
      </header>
      
      <section className="p-4 rounded-2xl border bg-white space-y-3">
        <p className="text-sm">Mini‑exercices pour y voir clair. Tu peux passer quand tu veux ✅</p>
        
        {status === 'no_auth' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              🔐 Veuillez vous connecter pour accéder à Phoenix Aube
            </p>
          </div>
        )}
        
        {status === 'invalid_token' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              🔑 Session expirée, veuillez vous reconnecter
            </p>
          </div>
        )}
        
        {(status === 'ready' || status === 'loading') && userId && (
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 rounded text-sm text-gray-700">
              Utilisateur: {userId.slice(0, 8)}...
            </div>
            <button 
              onClick={start} 
              disabled={status === 'loading'}
              className="px-3 py-1 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
            >
              {status === 'loading' ? 'Démarrage...' : 'Démarrer'}
            </button>
          </div>
        )}
        
        {status === 'loading' && !userId && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Chargement...</p>
          </div>
        )}
        
        {status === 'started' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Assessment démarré ! Première étape : comment tu te sens maintenant ?
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ⚠️ Erreur lors du démarrage. Vérifiez votre connexion.
            </p>
          </div>
        )}
      </section>
      
      <DisclaimerFooter />
    </main>
  );
}