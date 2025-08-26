'use client';
import { useState } from 'react';
import { HUB } from '../../../config/hub';
import WhyPopover from '@/components/aube/WhyPopover';
import DisclaimerFooter from '@/components/aube/DisclaimerFooter';

export default function AubeStartPage(){
  const [userId, setUserId] = useState('11111111-1111-1111-1111-111111111111');
  const [status, setStatus] = useState<string>('ready');
  
  const start = async ()=>{
    setStatus('loading');
    try {
      const response = await fetch(`${HUB}/luna/aube/assessment/start`, {
        method:'POST', 
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer dev'
        }, 
        body: JSON.stringify({user_id:userId})
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
        <div className="flex gap-2">
          <input 
            className="border rounded px-2 py-1 text-sm flex-1" 
            value={userId} 
            onChange={e=>setUserId(e.target.value)}
            placeholder="User ID"
          />
          <button 
            onClick={start} 
            disabled={status === 'loading'}
            className="px-3 py-1 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
          >
            {status === 'loading' ? 'Démarrage...' : 'Démarrer'}
          </button>
          <span className="text-xs opacity-70 self-center">{status}</span>
        </div>
        
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